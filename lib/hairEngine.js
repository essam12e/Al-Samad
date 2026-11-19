// محرك رسم القصّات واللحى — هندسة إجرائية بحتة (SVG)، بدون أي ذكاء اصطناعي.
// نظام الإحداثيات: وحدة "رأس" ثابتة. الوجه بيضاوي مركزه (0,0) نصف عرضه 60 ونصف طوله 84
// (الذقن عند y=84). الجمجمة بيضاوي مركزه (0,-14) بأنصاف أقطار 69×88 (قمة الرأس عند y≈-102).

export const GUIDE = { cx: 0, cy: -9, rx: 68, ry: 93 } // إطار محاذاة الوجه في الكاميرا
const SK = { cx: 0, cy: -14, rx: 69, ry: 88 }
const T = 54.5 // صدغ
const TY = -36

// ---------- أدوات رياضية ----------
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashStr(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const rad = (d) => (d * Math.PI) / 180
const f1 = (n) => Math.round(n * 10) / 10
const lerp = (a, b, t) => a + (b - a) * t
const range = (R, [a, b]) => lerp(a, b, R())
const norm = ([x, y]) => {
  const l = Math.hypot(x, y) || 1
  return [x / l, y / l]
}

export const faceX = (y) => (Math.abs(y) >= 84 ? 0 : 60 * Math.sqrt(1 - (y / 84) ** 2))

function bez(p0, p1, p2, p3, n) {
  const out = []
  for (let i = 1; i <= n; i++) {
    const t = i / n
    const u = 1 - t
    out.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ])
  }
  return out
}

function pen(start) {
  const pts = [start]
  const last = () => pts[pts.length - 1]
  const api = {
    pts,
    L(p) {
      pts.push(p)
      return api
    },
    C(a, b, c, n = 14) {
      pts.push(...bez(last(), a, b, c, n))
      return api
    },
    Q(a, c, n = 10) {
      const p0 = last()
      return api.C(
        [p0[0] + (2 / 3) * (a[0] - p0[0]), p0[1] + (2 / 3) * (a[1] - p0[1])],
        [c[0] + (2 / 3) * (a[0] - c[0]), c[1] + (2 / 3) * (a[1] - c[1])],
        c,
        n
      )
    },
  }
  return api
}

export const toPath = (pts, close = true) =>
  'M' + pts.map((p) => f1(p[0]) + ' ' + f1(p[1])).join('L') + (close ? 'Z' : '')

function inside(poly, [x, y]) {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

function bbox(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const [x, y] of pts) {
    if (x < x0) x0 = x
    if (y < y0) y0 = y
    if (x > x1) x1 = x
    if (y > y1) y1 = y
  }
  return [x0, y0, x1, y1]
}

function ellipsePts(cx, cy, rx, ry, n = 28) {
  const out = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)])
  }
  return out
}

// ---------- خط منبت الشعر (من الصدغ الأيمن إلى الأيسر) ----------
function hairline(h = {}) {
  const { type = 'natural', y: f = -44, depth = 0 } = h
  const p = pen([T, TY])
  const top = -58 + depth
  switch (type) {
    case 'lineup':
      p.L([51, -49]).L([45, -56 + depth]).Q([22, top - 1.2], [0, top - 0.5]).Q([-22, top - 1.2], [-45, -56 + depth]).L([-51, -49]).L([-T, TY])
      break
    case 'fringe':
      p.C([56, f - 6], [50, f + 1], [44, f + 1]).C([20, f + 2.5], [-20, f + 2.5], [-44, f + 1]).C([-50, f + 1], [-56, f - 6], [-T, TY])
      break
    case 'choppy': {
      p.C([56, f - 8], [50, f], [46, f])
      let k = 0
      for (let x = 46; x > -46; x -= 5.5) {
        p.L([x - 2.75, f + (k % 2 ? -3.2 : 2.6) + (k % 3 === 0 ? 1.2 : 0)])
        k++
      }
      p.L([-46, f]).C([-50, f], [-56, f - 8], [-T, TY])
      break
    }
    case 'swept':
      p.C([50, -52], [30, -60], [8, -57]).C([-14, -53], [-32, f - 3], [-45, f + 1]).C([-52, f + 3], [-56, f - 4], [-T, TY])
      break
    case 'curtain':
      p.C([56, f - 2], [42, f + 1], [30, f - 3]).C([18, -48], [7, -60], [0, -62]).C([-7, -60], [-18, -48], [-30, f - 3]).C([-42, f + 1], [-56, f - 2], [-T, TY])
      break
    case 'arch':
      // منبت منخفض مستدير (للقصات الملمومة للأمام بدون غرة واضحة)
      p.C([54, f - 4], [36, f], [0, f]).C([-36, f], [-54, f - 4], [-T, TY])
      break
    default:
      p.C([52, -50], [30, top], [0, top]).C([-30, top], [-52, -50], [-T, TY])
  }
  return p.pts
}

// ---------- الكتلة العلوية ----------
function topOuter(o, R) {
  const {
    tt = 10, ts = 4, p = 1.5, endDeg = 168, flatY = null, spikes = 0, spikeAmp = 0,
    bumps = 0, bumpAmp = 0, jitter = 0, asym = 0, lift = 0, liftPow = 6,
  } = o
  const out = []
  const step = spikes ? 1 : 2.5
  for (let th = endDeg; th >= 180 - endDeg - 0.001; th -= step) {
    const r = rad(th)
    const s = Math.max(0, Math.sin(r))
    let t = ts + (tt - ts) * Math.pow(s, p)
    t *= 1 + asym * Math.cos(r)
    t += lift * Math.pow(s, liftPow)
    if (bumps) t += bumpAmp * Math.abs(Math.sin(rad(th * bumps)))
    if (spikes) t += spikeAmp * Math.pow(0.5 + 0.5 * Math.cos(rad(th * spikes * 2)), 5) * Math.pow(s, 0.6) * (0.65 + 0.7 * R())
    if (jitter) t += (R() - 0.5) * jitter
    let x = (SK.rx + t * 0.92) * Math.cos(r)
    let y = SK.cy - (SK.ry + t) * Math.sin(r)
    if (flatY != null && y < flatY) y = flatY + (R() - 0.5) * 0.8
    out.push([x, y])
  }
  return out
}

function topRegion(top, hl, R) {
  const outer = topOuter(top, R)
  const left = outer[0]
  const right = outer[outer.length - 1]
  const pts = [...outer]
  const edge = top.edge ?? 1.5
  if (right[1] > TY + 1) {
    for (let y = right[1]; y > TY; y -= 4) pts.push([faceX(y) + edge, y])
  }
  pts.push(...hairline(hl))
  if (left[1] > TY + 1) {
    for (let y = TY + 4; y <= left[1]; y += 4) pts.push([-(faceX(y) + edge), y])
  }
  return { pts, outer }
}

// ---------- الجوانب (السوالف وفوق الأذن) ----------
function sidePts(sign, ts = 2, sb = 12) {
  const s = sign
  const p = pen([s * T, TY - 2])
  p.L([s * (69 + ts * 0.9), -34])
    .C([s * (70.5 + ts), -26], [s * (70 + ts), -18], [s * (66.5 + ts * 0.5), -12])
    .C([s * 65, -10], [s * 64.2, -4], [s * 63.4, sb])
    .L([s * (faceX(sb) - 1), sb])
  for (let y = sb - 4; y > TY; y -= 4) p.L([s * (faceX(y) - 0.5), y])
  return p.pts
}

const FADE = {
  skin: [[0, 1], [0.1, 0.9], [0.32, 0.25], [0.48, 0]],
  high: [[0, 0.75], [0.14, 0.16], [0.26, 0]],
  mid: [[0, 1], [0.28, 0.8], [0.6, 0.12], [0.78, 0]],
  low: [[0, 1], [0.55, 0.9], [0.85, 0.25], [1, 0.08]],
  burst: [[0, 1], [0.35, 0.75], [0.7, 0.08], [1, 0]],
  taper: [[0, 1], [0.7, 0.95], [1, 0.35]],
  scissor: [[0, 1], [1, 1]],
  shaved: [[0, 0.3], [1, 0.22]],
}

// ---------- الشعر المنسدل ----------
function drapePts(sign, d, R) {
  const { len = 100, flare = 6, tuck = false, ts = 4, wavy = 0, tips = 'layered' } = d
  const s = sign
  const inner = (y) => {
    if (tuck) return y < 22 ? 71 : Math.max(36, 71 - (y - 22) * 1.1)
    return Math.max(faceX(y) + 1, 35)
  }
  const outerX = (y) => {
    const k = Math.min(1, Math.max(0, (y + 30) / (len + 30)))
    return 70 + ts + flare * Math.pow(k, 1.3) + (wavy ? Math.sin((y + 40) / 13) * wavy : 0)
  }
  const pts = []
  for (let y = -34; y <= len; y += 4) pts.push([s * outerX(y), y])
  // أطراف الشعر
  const xo = outerX(len)
  const xi = inner(len)
  const n = Math.max(3, Math.round((xo - xi) / 5))
  for (let i = 1; i < n; i++) {
    const x = lerp(xo, xi, i / n)
    const dip = tips === 'blunt' ? (R() - 0.5) * 1.5 : (i % 2 ? 5 + R() * 5 : -2 - R() * 3)
    pts.push([s * x, len + dip - (tips === 'layered' ? Math.sin((i / n) * Math.PI) * 4 : 0)])
  }
  for (let y = len - 2; y >= -32; y -= 4) pts.push([s * inner(y), y])
  return pts
}

// ---------- حقول اتجاه الشعر ----------
function dirField(kind, opts = {}) {
  const px = opts.partX ?? -24
  switch (kind) {
    case 'back':
      return (p) => norm([p[0] * 0.35 - p[0], -150 - p[1]])
    case 'up':
      return (p, R) => norm([p[0] * 0.012 + (R() - 0.5) * 0.25, -1])
    case 'pomp':
      return (p) => norm([p[0] * 0.01, -1 + Math.max(0, (p[1] + 90) / 120)])
    case 'forward':
      return (p, R) => norm([p[0] - 0 + (R() - 0.5) * 8, p[1] + 130])
    case 'swept':
      return (p) => norm([p[0] - 55, p[1] + 125])
    case 'side':
      return (p, R) =>
        p[0] > px
          ? norm([1, 0.1 + Math.max(0, p[0] - px) / 110 + (R() - 0.5) * 0.15])
          : norm([-1, 0.55 + (R() - 0.5) * 0.2])
    case 'curtain':
      return (p) => norm([Math.sign(p[0] || 1) * 1, 0.8 + Math.abs(p[0]) / 80])
    case 'radial':
      return (p, R) => norm([p[0] + (R() - 0.5) * 10, p[1] + 10])
    case 'down':
      return (p, R) => norm([Math.sign(p[0] || 1) * 0.08 + (R() - 0.5) * 0.08, 1])
    case 'messy':
      return (p, R) => {
        const a = rad(-90 + (R() - 0.5) * 150)
        return norm([Math.cos(a) + p[0] * 0.008, Math.sin(a)])
      }
    case 'beard':
      return (p, R) =>
        p[1] < 47 && Math.abs(p[0]) < 30
          ? norm([Math.sign(p[0] || 1), 0.75 + (R() - 0.5) * 0.2])
          : norm([-p[0] * 0.006 + (R() - 0.5) * 0.15, 1])
    default:
      return () => [0, -1]
  }
}

// ---------- مولدات الملمس ----------
function genStrands(R, poly, n, dir, o = {}) {
  const { len = [6, 14], w = [0.45, 1.05], curl = 0.3, wave = 0 } = o
  const [x0, y0, x1, y1] = bbox(poly)
  const out = []
  let tries = 0
  while (out.length < n && tries < n * 25) {
    tries++
    const p = [lerp(x0, x1, R()), lerp(y0, y1, R())]
    if (!inside(poly, p)) continue
    const d = dir(p, R)
    const L = range(R, len)
    const e = [p[0] + d[0] * L, p[1] + d[1] * L]
    const nx = -d[1]
    const ny = d[0]
    const b = (R() - 0.5) * curl * L
    let path
    if (wave) {
      const c1 = [p[0] + d[0] * L * 0.33 + nx * wave, p[1] + d[1] * L * 0.33 + ny * wave]
      const c2 = [p[0] + d[0] * L * 0.66 - nx * wave, p[1] + d[1] * L * 0.66 - ny * wave]
      path = `M${f1(p[0])} ${f1(p[1])}C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(e[0])} ${f1(e[1])}`
    } else {
      const c = [(p[0] + e[0]) / 2 + nx * b, (p[1] + e[1]) / 2 + ny * b]
      path = `M${f1(p[0])} ${f1(p[1])}Q${f1(c[0])} ${f1(c[1])} ${f1(e[0])} ${f1(e[1])}`
    }
    const r = R()
    out.push({ d: path, w: f1(range(R, w) * 10) / 10, c: r < 0.42 ? 'dark' : r < 0.75 ? 'base' : r < 0.95 ? 'light' : 'lighter', o: f1(range(R, [0.35, 0.85]) * 100) / 100 })
  }
  return out
}

function genCurls(R, poly, n, o = {}) {
  const { r = [1.3, 2.8] } = o
  const [x0, y0, x1, y1] = bbox(poly)
  const out = []
  let tries = 0
  while (out.length < n && tries < n * 25) {
    tries++
    const p = [lerp(x0, x1, R()), lerp(y0, y1, R())]
    if (!inside(poly, p)) continue
    const rr = range(R, r)
    const a0 = R() * Math.PI * 2
    const a1 = a0 + rad(250 + R() * 60)
    const s = [p[0] + rr * Math.cos(a0), p[1] + rr * Math.sin(a0)]
    const e = [p[0] + rr * Math.cos(a1), p[1] + rr * Math.sin(a1)]
    const k = R()
    out.push({
      d: `M${f1(s[0])} ${f1(s[1])}A${f1(rr)} ${f1(rr)} 0 1 1 ${f1(e[0])} ${f1(e[1])}`,
      w: f1(range(R, [0.6, 1.2])),
      c: k < 0.45 ? 'dark' : k < 0.8 ? 'light' : 'lighter',
      o: f1(range(R, [0.45, 0.9]) * 100) / 100,
    })
  }
  return out
}

function genFluff(R, outer, n, o = {}) {
  const { len = [2, 5], center = [0, -20] } = o
  const out = []
  for (let i = 0; i < n; i++) {
    const p = outer[Math.floor(R() * outer.length)]
    const d = norm([p[0] - center[0] + (R() - 0.5) * 30, p[1] - center[1] + (R() - 0.5) * 30])
    const L = range(R, len)
    const s = [p[0] - d[0] * L * 0.6, p[1] - d[1] * L * 0.6]
    const e = [p[0] + d[0] * L * 0.5, p[1] + d[1] * L * 0.5]
    out.push({ d: `M${f1(s[0])} ${f1(s[1])}L${f1(e[0])} ${f1(e[1])}`, w: f1(range(R, [0.35, 0.7])), c: R() < 0.5 ? 'dark' : 'base', o: 0.55 })
  }
  return out
}

function genBraids(rows, hl) {
  // ضفائر (كورنرو) تبدأ من منبت الشعر وتتجه للخلف
  const out = []
  for (let i = 0; i < rows; i++) {
    const t = rows === 1 ? 0.5 : i / (rows - 1)
    const x = lerp(-48, 48, t)
    const y = -Math.sqrt(Math.max(0, 1 - (x / 56) ** 2)) * 22 - 36
    const top = [x * 0.28, -101 + Math.abs(x) * 0.05]
    const c = [x * 0.85, (y + top[1]) / 2 - 6]
    out.push({ d: `M${f1(x)} ${f1(y)}Q${f1(c[0])} ${f1(c[1])} ${f1(top[0])} ${f1(top[1])}` })
  }
  return out
}

function genLocks(R, sign, d, count) {
  const { len = 110, ts = 6 } = d
  const out = []
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1)
    const x0 = sign * lerp(56, 72 + ts, t)
    const y0 = lerp(-40, -20, t) + (R() - 0.5) * 6
    const L = len * lerp(0.85, 1.05, R())
    const x1 = x0 + sign * (4 + t * 10) + (R() - 0.5) * 6
    const c = [lerp(x0, x1, 0.5) + (R() - 0.5) * 10, (y0 + L) / 2]
    out.push({ d: `M${f1(x0)} ${f1(y0)}Q${f1(c[0])} ${f1(c[1])} ${f1(x1)} ${f1(L)}`, w: f1(range(R, [4.2, 5.6])) })
  }
  return out
}

// ---------- اللحى ----------
function beardOuter(o) {
  const { len = 8, wide = 2, sb = 12, point = 0, squareness = 0 } = o
  const rx = 61 + wide
  const ry = 84 + len
  const phi0 = Math.asin(Math.min(0.99, sb / ry))
  const out = []
  const N = 36
  for (let i = 0; i <= N; i++) {
    const phi = Math.PI - phi0 - ((Math.PI - 2 * phi0) * i) / N
    let x = rx * Math.cos(phi)
    let y = ry * Math.sin(phi)
    if (squareness) {
      const k = Math.pow(Math.abs(Math.cos(phi)), 0.6)
      y += squareness * k * Math.max(0, Math.sin(phi)) * 6
    }
    if (point) y += point * Math.pow(Math.max(0, 1 - Math.abs(x) / rx), 3)
    out.push([x, y])
  }
  return out
}

const MUSTACHE_TOP = (p, k = 0) => p.C([16, 33 + k], [6, 32.5 + k], [0, 33.5 + k]).C([-6, 32.5 + k], [-16, 33 + k], [-27, 38])

function beardShapes(b) {
  const type = b.type
  const shapes = []
  const mouth = ellipsePts(0, 51, 15, 4.4)
  const cheek = b.cheek ?? 0
  const sb = b.sb ?? 12
  if (type === 'full') {
    const outer = beardOuter(b)
    const p = pen(outer[0])
    outer.slice(1).forEach((q) => p.L(q))
    p.L([faceX(sb) - 1, sb]).C([50, 22 + cheek], [38, 30 + cheek * 0.5], [27, 38])
    MUSTACHE_TOP(p)
    p.C([-38, 30 + cheek * 0.5], [-50, 22 + cheek], [-(faceX(sb) - 1), sb])
    shapes.push({ pts: p.pts, holes: [mouth], fadeTop: b.fadeTop ? sb : null })
  } else if (type === 'chinstrap') {
    const outer = beardOuter({ len: 2, wide: 1.5, sb })
    const inner = beardOuter({ len: -6, wide: -6, sb: sb + 2 }).reverse()
    shapes.push({ pts: [...outer, ...inner] })
  }
  if (type === 'circle' || type === 'goatee' || type === 'vandyke' || type === 'balbo' || type === 'anchor' || type === 'soul') {
    const len = b.len ?? 6
    if (type === 'circle') {
      const p = pen([-27, 38])
      p.C([-31, 50], [-29, 66], [-21, 80 + len * 0.6]).Q([0, 96 + len], [21, 80 + len * 0.6]).C([29, 66], [31, 50], [27, 38])
      p.C([16, 33], [6, 32.5], [0, 33.5]).C([-6, 32.5], [-16, 33], [-27, 38])
      shapes.push({ pts: p.pts, holes: [mouth] })
    } else if (type === 'soul') {
      const p = pen([-6, 58.5])
      p.Q([0, 57.5], [6, 58.5]).C([6, 64], [3, 70], [0, 72]).C([-3, 70], [-6, 64], [-6, 58.5])
      shapes.push({ pts: p.pts })
    } else {
      // قطعة الذقن
      const w = type === 'balbo' ? 25 : type === 'anchor' ? 30 : type === 'vandyke' ? 15 : 17
      const pt = b.point ?? (type === 'vandyke' ? 10 : 2)
      const p = pen([-w + 3, 58])
      if (type === 'anchor') {
        p.C([-28, 64], [-34, 72], [-30, 78]).C([-20, 88 + len], [-8, 92 + len + pt * 0.6], [0, 94 + len + pt])
          .C([8, 92 + len + pt * 0.6], [20, 88 + len], [30, 78]).C([34, 72], [28, 64], [w - 3, 58])
      } else {
        p.C([-w - 2, 66], [-w + 1, 78], [-w * 0.55, 87 + len]).C([-w * 0.3, 91 + len + pt * 0.5], [-3, 92 + len + pt], [0, 93 + len + pt])
          .C([3, 92 + len + pt], [w * 0.3, 91 + len + pt * 0.5], [w * 0.55, 87 + len]).C([w - 1, 78], [w + 2, 66], [w - 3, 58])
      }
      p.Q([0, 61.5], [-w + 3, 58])
      shapes.push({ pts: p.pts })
    }
  }
  if (b.mustache) shapes.push({ pts: mustachePts(b.mustache) })
  return shapes
}

function mustachePts(kind) {
  if (kind === 'pencil') {
    const p = pen([-22, 44])
    p.C([-14, 41.5], [-4, 41.2], [0, 42]).C([4, 41.2], [14, 41.5], [22, 44]).C([14, 44.2], [4, 44], [0, 44.6]).C([-4, 44], [-14, 44.2], [-22, 44])
    return p.pts
  }
  if (kind === 'handlebar') {
    const p = pen([0, 37])
    p.C([10, 35], [22, 37], [28, 42]).C([33, 45], [40, 42], [41, 35]).C([41.5, 31.5], [38.5, 30.5], [37.5, 33.5])
      .C([36.5, 38.5], [31, 41.5], [24, 44.5]).C([14, 46.5], [5, 45], [0, 45.5])
      .C([-5, 45], [-14, 46.5], [-24, 44.5]).C([-31, 41.5], [-36.5, 38.5], [-37.5, 33.5]).C([-38.5, 30.5], [-41.5, 31.5], [-41, 35])
      .C([-40, 42], [-33, 45], [-28, 42]).C([-22, 37], [-10, 35], [0, 37])
    return p.pts
  }
  const low = kind === 'chevron' ? 49 : 46.5
  const p = pen([-27, 41])
  p.C([-24, 36], [-12, 33], [0, 34]).C([12, 33], [24, 36], [27, 41]).C([27, 45], [22, low], [14, low]).Q([0, low - 1.6], [-14, low]).C([-22, low], [-27, 45], [-27, 41])
  return p.pts
}

// ---------- بناء النموذج الكامل ----------
export function buildModel(hair, beard, seedKey = 'x') {
  const R = rng(hashStr(seedKey))
  const layers = []

  if (hair && !hair.none) {
    const dens = hair.density ?? 1
    const dir = dirField(hair.dir || 'back', { partX: hair.part?.x })

    // 1) الشعر المنسدل خلف/بجانب الوجه
    if (hair.drape) {
      for (const s of [-1, 1]) {
        if (hair.drape.side && hair.drape.side !== s) continue
        const pts = drapePts(s, hair.drape, R)
        const layer = { key: 'drape' + s, pts, opacity: hair.drape.opacity ?? 0.96, body: true }
        if (hair.texture === 'locks') {
          layer.opacity = 0
          layer.locks = genLocks(R, s, hair.drape, 9)
        } else if (hair.texture === 'curls') {
          layer.curls = genCurls(R, pts, 120 * dens)
        } else {
          layer.strands = genStrands(R, pts, 150 * dens, dirField('down'), { len: [14, 30], curl: 0.25, wave: hair.drape.wavy ? 2.4 : 0 })
        }
        layers.push(layer)
      }
    }

    // 2) الجوانب
    const sides = hair.sides
    if (sides && sides.fade !== 'none') {
      for (const s of [-1, 1]) {
        const pts = sidePts(s, sides.ts ?? 2, sides.sb ?? 12)
        const long = sides.fade === 'scissor' || sides.fade === 'taper'
        layers.push({
          key: 'side' + s,
          pts,
          fade: FADE[sides.fade] || FADE.mid,
          fadeY: [-40, sides.sb ?? 12],
          opacity: long ? 0.92 : 0.62,
          stipple: !long,
          strands: long ? genStrands(R, pts, 40, (p) => norm([s * 0.25, 1]), { len: [3, 6] }) : null,
        })
      }
    }

    // 3) الكتلة العلوية
    if (hair.top) {
      const { pts, outer } = topRegion(hair.top, hair.hairline, R)
      const tex = hair.texture || 'strands'
      const layer = {
        key: 'top',
        pts,
        body: !hair.top.stipple,
        opacity: hair.top.opacity ?? (hair.top.stipple ? 0.6 : 0.97),
        stipple: !!hair.top.stipple,
        shine: !!hair.shine,
        part: hair.part ? partPath(hair.part, hair.hairline) : null,
        partHard: hair.part?.hard,
      }
      if (!hair.top.stipple) {
        if (tex === 'curls') {
          layer.curls = genCurls(R, pts, (hair.top.tt > 20 ? 420 : 260) * dens, { r: hair.curlR || [1.3, 2.8] })
          layer.fluff = []
        } else if (tex === 'braids') {
          layer.braids = genBraids(hair.rows || 9)
        } else {
          const len = hair.strandLen || (hair.top.tt > 14 ? [9, 20] : [5, 11])
          layer.strands = genStrands(R, pts, (hair.top.tt > 14 ? 360 : 260) * dens, dir, { len, curl: hair.dir === 'messy' ? 0.7 : 0.3, wave: hair.wave || 0 })
          layer.fluff = genFluff(R, outer, Math.round(70 * dens), { len: hair.dir === 'messy' || hair.top.spikes ? [3, 7] : [1.5, 4] })
        }
      }
      layers.push(layer)
    }

    // 4) إضافات: كعكة / موهوك
    if (hair.bun) {
      const { r = 16, y = -112 } = hair.bun
      const pts = ellipsePts(0, y, r * 1.1, r * 0.92, 40)
      layers.push({ key: 'bun', pts, body: true, opacity: 0.98, curls: hair.texture === 'curls' ? genCurls(R, pts, 60) : null, strands: hair.texture === 'curls' ? null : genStrands(R, pts, 70, (p) => norm([-(p[1] - y), p[0]]), { len: [6, 12], curl: 0.6 }) })
    }
    if (hair.strip) {
      const { w = 16, h = 34, spikes = 5 } = hair.strip
      const p = pen([-w * 0.7, -56])
      const base = -100
      for (let i = 0; i <= spikes * 2; i++) {
        const t = i / (spikes * 2)
        const x = lerp(-w, w, t)
        const arc = Math.sqrt(Math.max(0, 1 - (x / (w * 1.2)) ** 2))
        p.L([x * 1.05, base - h * arc * (i % 2 ? 1 : 0.7) - (i % 2 ? R() * 5 : 0)])
      }
      p.L([w * 0.7, -56]).Q([0, -60], [-w * 0.7, -56])
      const pts = p.pts
      layers.push({ key: 'strip', pts, body: true, opacity: 0.98, strands: genStrands(R, pts, 140, dirField('up'), { len: [8, 18] }) })
    }
  }

  if (beard && !beard.none) {
    const shapes = beardShapes(beard)
    shapes.forEach((sh, i) => {
      const stub = beard.stubble
      layers.push({
        key: 'beard' + i,
        pts: sh.pts,
        holes: sh.holes,
        body: !stub,
        stipple: !!stub,
        opacity: stub ? beard.stubble : 0.95,
        fade: sh.fadeTop != null ? [[0, 0.18], [0.5, 0.75], [1, 1]] : null,
        fadeY: sh.fadeTop != null ? [sh.fadeTop - 2, sh.fadeTop + 22] : null,
        strands: stub ? null : genStrands(R, sh.pts, Math.min(320, 80 + (beard.len ?? 6) * 10), dirField('beard'), { len: [3, 6 + (beard.len ?? 6) * 0.25], curl: 0.5 }),
        beard: true,
      })
    })
  }
  return layers
}

function partPath(part, hl) {
  const x = part.x ?? -24
  const y0 = hl?.type === 'swept' ? -56 : -57
  return `M${f1(x)} ${f1(y0)}Q${f1(x * 0.95)} -78 ${f1(x * 0.7)} -98`
}

export const regionPath = (layer) => toPath(layer.pts) + (layer.holes || []).map((h) => toPath(h)).join('')
