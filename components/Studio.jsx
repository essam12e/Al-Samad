'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icons'
import HairArt, { Mannequin, StylePreview } from './HairArt'
import {
  HAIRSTYLES, BEARDS, CATEGORIES, BEARD_CATEGORIES, hairRender, beardRender, findHair, findBeard,
} from '../lib/catalog'
import { GUIDE } from '../lib/hairEngine'
import { HAIR_COLORS } from '../lib/color'
import { gallery } from '../lib/store'

const DEFAULT_ADJ = { x: 0, y: 0, scale: 1, sx: 1, sy: 1, rot: 0, opacity: 0.95 }

export default function Studio({ sel, setSel, go, openDetail, face, favs }) {
  const stageRef = useRef(null)
  const videoRef = useRef(null)
  const svgRef = useRef(null)
  const streamRef = useRef(null)
  const pointers = useRef(new Map())
  const gesture = useRef(null)

  const dockRef = useRef(null)
  const [size, setSize] = useState({ w: 390, h: 760 })
  const [dockH, setDockH] = useState(300)
  const [source, setSource] = useState('camera') // camera | photo | mannequin
  const [facing, setFacing] = useState('user')
  const [camState, setCamState] = useState('starting') // starting | live | error
  const [camError, setCamError] = useState('')
  const [photo, setPhoto] = useState(null)
  const [adj, setAdj] = useState(DEFAULT_ADJ)
  const [panel, setPanel] = useState('hair') // hair | beard | color | adjust
  const [cat, setCat] = useState('all')
  const [bcat, setBcat] = useState('all')
  const [guide, setGuide] = useState(true)
  const [before, setBefore] = useState(false)
  const [timer, setTimer] = useState(0)
  const [count, setCount] = useState(0)
  const [flash, setFlash] = useState(false)
  const [shot, setShot] = useState(null)
  const [toast, setToast] = useState('')
  const [collapsed, setCollapsed] = useState(false)

  const hair = findHair(sel.hair)
  const beard = findBeard(sel.beard)

  // ── حجم المسرح ──
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    const dr = new ResizeObserver(([e]) => setDockH(e.target.offsetHeight))
    if (dockRef.current) dr.observe(dockRef.current)
    return () => {
      ro.disconnect()
      dr.disconnect()
    }
  }, [])

  // ── الكاميرا ──
  const stopCam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  const startCam = useCallback(async (mode) => {
    stopCam()
    setCamState('starting')
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamState('error')
      setCamError('المتصفح لا يدعم الكاميرا، أو أن الصفحة لا تعمل عبر اتصال آمن (https).')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1920 } },
        audio: false,
      })
      streamRef.current = stream
      const v = videoRef.current
      if (v) {
        v.srcObject = stream
        await v.play().catch(() => {})
      }
      setCamState('live')
    } catch (e) {
      setCamState('error')
      setCamError(
        e?.name === 'NotAllowedError'
          ? 'لم يتم السماح باستخدام الكاميرا. اسمح بالوصول من إعدادات المتصفح ثم أعد المحاولة.'
          : 'تعذّر تشغيل الكاميرا على هذا الجهاز.'
      )
    }
  }, [])

  useEffect(() => {
    if (source === 'camera') startCam(facing)
    else stopCam()
    return stopCam
  }, [source, facing, startCam])

  // ── الإحداثيات الأساسية للإطار ──
  const base = useMemo(() => {
    // الإطار يتمركز في المساحة الظاهرة بين الشريط العلوي واللوحة السفلية
    const { w, h } = size
    const top = 118
    // ارتفاع ثابت للوحة حتى لا يقفز الإطار عند تبديل التبويبات
    const reserve = collapsed ? Math.min(dockH, 170) : 318
    const bottom = Math.max(top + 200, h - reserve - 12)
    const avail = bottom - top
    const s0 = Math.min((avail * 0.86) / (GUIDE.ry * 2), (w * 0.6) / (GUIDE.rx * 2))
    return { s0, ox: w / 2, oy: top + avail / 2 - GUIDE.cy * s0 }
  }, [size, dockH, collapsed])

  const hairTransform = `translate(${base.ox + adj.x} ${base.oy + adj.y}) rotate(${adj.rot}) scale(${base.s0 * adj.scale * adj.sx} ${base.s0 * adj.scale * adj.sy})`
  const baseTransform = `translate(${base.ox} ${base.oy}) scale(${base.s0})`

  // ── الإيماءات: سحب، تكبير وتدوير بإصبعين، عجلة الفأرة ──
  const onDown = (e) => {
    if (e.target.closest('.no-gesture')) return
    stageRef.current.setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    startGesture()
  }
  const startGesture = () => {
    const pts = [...pointers.current.values()]
    if (pts.length === 1) gesture.current = { type: 'drag', p: pts[0], adj }
    else if (pts.length >= 2) {
      const [a, b] = pts
      gesture.current = { type: 'pinch', d: Math.hypot(b.x - a.x, b.y - a.y), ang: Math.atan2(b.y - a.y, b.x - a.x), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, adj }
    }
  }
  const onMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    if (!g) return
    const pts = [...pointers.current.values()]
    if (g.type === 'drag' && pts.length === 1) {
      setAdj({ ...g.adj, x: g.adj.x + pts[0].x - g.p.x, y: g.adj.y + pts[0].y - g.p.y })
    } else if (g.type === 'pinch' && pts.length >= 2) {
      const [a, b] = pts
      const d = Math.hypot(b.x - a.x, b.y - a.y)
      const ang = Math.atan2(b.y - a.y, b.x - a.x)
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      setAdj({
        ...g.adj,
        scale: clamp(g.adj.scale * (d / g.d), 0.5, 1.9),
        rot: clamp(g.adj.rot + ((ang - g.ang) * 180) / Math.PI, -35, 35),
        x: g.adj.x + mid.x - g.mid.x,
        y: g.adj.y + mid.y - g.mid.y,
      })
    }
  }
  const onUp = (e) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size) startGesture()
    else gesture.current = null
  }
  useEffect(() => {
    const el = stageRef.current
    const onWheel = (e) => {
      if (e.target.closest('.no-gesture')) return
      e.preventDefault()
      setAdj((a) => ({ ...a, scale: clamp(a.scale * (e.deltaY < 0 ? 1.04 : 0.96), 0.5, 1.9) }))
    }
    el?.addEventListener('wheel', onWheel, { passive: false })
    return () => el?.removeEventListener('wheel', onWheel)
  }, [])

  // ── رفع صورة ──
  const fileRef = useRef(null)
  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    setPhoto(url)
    setSource('photo')
    e.target.value = ''
  }

  // ── التصوير ──
  const say = (t) => {
    setToast(t)
    setTimeout(() => setToast(''), 2200)
  }

  const capture = async () => {
    const { w, h } = size
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.fillStyle = '#0b0a09'
    ctx.fillRect(0, 0, w, h)

    const drawCover = (img, iw, ih, mirrorX) => {
      const s = Math.max(w / iw, h / ih)
      const dw = iw * s
      const dh = ih * s
      ctx.save()
      if (mirrorX) {
        ctx.translate(w, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
      ctx.restore()
    }
    if (source === 'camera' && camState === 'live') {
      const v = videoRef.current
      drawCover(v, v.videoWidth, v.videoHeight, facing === 'user')
    } else if (source === 'photo' && photo) {
      const img = await loadImage(photo)
      drawCover(img, img.naturalWidth, img.naturalHeight, false)
    }

    // طبقة الشعر (SVG) بدون الإطار الإرشادي
    const clone = svgRef.current.cloneNode(true)
    clone.querySelectorAll('[data-guide]').forEach((n) => n.remove())
    clone.setAttribute('width', w)
    clone.setAttribute('height', h)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    const xml = new XMLSerializer().serializeToString(clone)
    const svgUrl = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }))
    try {
      const overlay = await loadImage(svgUrl)
      ctx.drawImage(overlay, 0, 0, w, h)
    } finally {
      URL.revokeObjectURL(svgUrl)
    }

    // توقيع ذهبي
    const pad = 16
    ctx.save()
    const grad = ctx.createLinearGradient(0, h - 90, 0, h)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, 'rgba(0,0,0,0.65)')
    ctx.fillStyle = grad
    ctx.fillRect(0, h - 90, w, 90)
    ctx.direction = 'rtl'
    ctx.textAlign = 'right'
    ctx.fillStyle = '#e9cf98'
    ctx.font = '600 18px "El Messiri", serif'
    const title = [hair?.name, beard?.name].filter(Boolean).join(' + ') || 'بدون قصة'
    ctx.fillText(title, w - pad, h - 36)
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '400 12px "IBM Plex Sans Arabic", sans-serif'
    ctx.fillText('قصّتي · Qassati', w - pad, h - 16)
    ctx.restore()

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setFlash(true)
    setTimeout(() => setFlash(false), 350)
    const item = { id: 's' + Date.now(), at: Date.now(), img: dataUrl, hair: sel.hair, beard: sel.beard, color: sel.color }
    setShot(item)
    const ok = await gallery.add(item)
    if (!ok) say('تعذّر الحفظ في المعرض، لكن يمكنك تنزيل الصورة')
  }

  const startCapture = () => {
    if (!timer) return capture()
    let n = timer
    setCount(n)
    const t = setInterval(() => {
      n -= 1
      if (n <= 0) {
        clearInterval(t)
        setCount(0)
        capture()
      } else setCount(n)
    }, 1000)
  }

  const pick = useCallback((kind, id) => setSel((s) => ({ ...s, [kind]: s[kind] === id && kind === 'beard' ? null : id })), [setSel])

  const hairList = useMemo(() => HAIRSTYLES.filter((h) => cat === 'all' || h.cat === cat || (cat === 'fav' && favs.includes('hair:' + h.id))), [cat, favs])
  const beardList = useMemo(() => BEARDS.filter((b) => bcat === 'all' || b.cat === bcat), [bcat])
  const mirrored = source === 'camera' && facing === 'user'

  return (
    <main className="studio">
      <div
        ref={stageRef}
        className="stage"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {source === 'camera' && (
          <video ref={videoRef} className={'feed' + (mirrored ? ' mirror' : '')} playsInline muted autoPlay />
        )}
        {source === 'photo' && photo && <img className="feed" src={photo} alt="صورتك" />}
        {source === 'mannequin' && <div className="feed mannequin-bg" />}

        <svg ref={svgRef} className="overlay" viewBox={`0 0 ${size.w} ${size.h}`} width={size.w} height={size.h}>
          {source === 'mannequin' && (
            <g transform={baseTransform}>
              <Mannequin />
            </g>
          )}
          {guide && !before && (
            <g data-guide="1" transform={baseTransform} className="guide">
              <ellipse cx={GUIDE.cx} cy={GUIDE.cy} rx={GUIDE.rx} ry={GUIDE.ry} />
              <line x1="-40" x2="40" y1="-5" y2="-5" className="eye" />
              <line x1="-14" x2="14" y1="84" y2="84" className="chin" />
            </g>
          )}
          {!before && (
            <g transform={hairTransform} opacity={adj.opacity}>
              <HairArt hair={hairRender(hair)} beard={beardRender(beard)} color={sel.color} flip={sel.flip} />
            </g>
          )}
        </svg>

        {guide && camState !== 'error' && (
          <div className="guide-tip">
            <span>ضع وجهك داخل الإطار: الذقن على الخط السفلي والعينان على الخط الأوسط</span>
          </div>
        )}

        {source === 'camera' && camState === 'starting' && (
          <div className="cam-msg"><div className="spinner" /><p>جاري تشغيل الكاميرا…</p></div>
        )}
        {source === 'camera' && camState === 'error' && (
          <div className="cam-msg no-gesture">
            <Icon name="camera" size={38} />
            <h3>الكاميرا غير متاحة</h3>
            <p>{camError}</p>
            <div className="row">
              <button className="btn btn-gold" onClick={() => startCam(facing)}><Icon name="reset" size={18} /> أعد المحاولة</button>
              <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}><Icon name="upload" size={18} /> ارفع صورة</button>
              <button className="btn btn-ghost" onClick={() => setSource('mannequin')}><Icon name="face" size={18} /> جرّب على المجسّم</button>
            </div>
          </div>
        )}
        {count > 0 && <div className="countdown">{count}</div>}
        {flash && <div className="flash" />}
        {toast && <div className="toast">{toast}</div>}
      </div>

      {/* الشريط العلوي */}
      <header className="studio-top no-gesture">
        <button className="icon-btn" onClick={() => go('home')} aria-label="رجوع"><Icon name="back" /></button>
        <button className="now" onClick={() => hair && openDetail('hair', hair.id)}>
          <span className="now-name">{hair ? hair.name : 'بدون قصة'}{beard ? ' + ' + beard.name : ''}</span>
          <span className="now-sub"><Icon name="info" size={13} /> التفاصيل وطريقة طلبها</span>
        </button>
        <div className="top-actions">
          <button className={'icon-btn' + (guide ? ' on' : '')} onClick={() => setGuide((g) => !g)} aria-label="الإطار الإرشادي"><Icon name="face" /></button>
          {source === 'camera' && (
            <button className="icon-btn" onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))} aria-label="تبديل الكاميرا"><Icon name="flip" /></button>
          )}
          <button className="icon-btn" onClick={() => fileRef.current?.click()} aria-label="رفع صورة"><Icon name="image" /></button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        </div>
      </header>

      {/* زر المقارنة: اضغط مطولاً لرؤية وجهك قبل */}
      <div className="side-tools no-gesture">
        <button
          className={'tool' + (before ? ' on' : '')}
          onPointerDown={() => setBefore(true)}
          onPointerUp={() => setBefore(false)}
          onPointerLeave={() => setBefore(false)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <Icon name="eye" size={20} />
          <span>اضغط مطولاً<br />قبل/بعد</span>
        </button>
        <button className="tool" onClick={() => setSel((s) => ({ ...s, flip: !s.flip }))}>
          <Icon name="mirror" size={20} />
          <span>اعكس<br />الفرق</span>
        </button>
        <button className="tool" onClick={() => setTimer((t) => (t === 0 ? 3 : t === 3 ? 10 : 0))}>
          <Icon name="timer" size={20} />
          <span>{timer ? timer + ' ث' : 'مؤقّت'}</span>
        </button>
        {source !== 'camera' && (
          <button className="tool" onClick={() => setSource('camera')}>
            <Icon name="camera" size={20} />
            <span>الكاميرا</span>
          </button>
        )}
      </div>

      {/* اللوحة السفلية */}
      <section ref={dockRef} className={'dock no-gesture' + (collapsed ? ' collapsed' : '')}>
        <button className="dock-handle" onClick={() => setCollapsed((c) => !c)} aria-label="إظهار/إخفاء اللوحة"><span /></button>
        <div className="dock-tabs">
          {[
            ['hair', 'القصّات', 'scissors'],
            ['beard', 'اللحى', 'beard'],
            ['color', 'اللون', 'palette'],
            ['adjust', 'الضبط', 'sliders'],
          ].map(([k, label, ic]) => (
            <button key={k} className={panel === k ? 'on' : ''} onClick={() => { setPanel(k); setCollapsed(false) }}>
              <Icon name={ic} size={18} /> {label}
            </button>
          ))}
        </div>

        {!collapsed && (
          <div className="dock-body">
            {panel === 'hair' && (
              <>
                <div className="chips">
                  {[...CATEGORIES, { id: 'fav', name: '♥ المفضلة' }].map((c) => (
                    <button key={c.id} className={'chip' + (cat === c.id ? ' on' : '')} onClick={() => setCat(c.id)}>{c.name}</button>
                  ))}
                </div>
                <Rail kind="hair" list={hairList} selected={sel.hair} color={sel.color} face={face} onPick={pick} />
              </>
            )}
            {panel === 'beard' && (
              <>
                <div className="chips">
                  {BEARD_CATEGORIES.map((c) => (
                    <button key={c.id} className={'chip' + (bcat === c.id ? ' on' : '')} onClick={() => setBcat(c.id)}>{c.name}</button>
                  ))}
                </div>
                <Rail kind="beard" list={beardList} selected={sel.beard} color={sel.color} face={face} onPick={pick} />
              </>
            )}
            {panel === 'color' && (
              <div className="swatches">
                {HAIR_COLORS.map((c) => (
                  <button key={c.id} className={'swatch' + (sel.color === c.hex ? ' on' : '')} onClick={() => setSel((s) => ({ ...s, color: c.hex }))}>
                    <i style={{ background: `radial-gradient(circle at 35% 30%, ${c.hex}aa, ${c.hex} 60%)` }} />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            )}
            {panel === 'adjust' && (
              <div className="sliders">
                <Slider label="الحجم" value={adj.scale} min={0.5} max={1.9} step={0.01} fmt={(v) => Math.round(v * 100) + '%'} onChange={(v) => setAdj({ ...adj, scale: v })} />
                <Slider label="العرض" value={adj.sx} min={0.75} max={1.3} step={0.01} fmt={(v) => Math.round(v * 100) + '%'} onChange={(v) => setAdj({ ...adj, sx: v })} />
                <Slider label="الارتفاع" value={adj.sy} min={0.75} max={1.3} step={0.01} fmt={(v) => Math.round(v * 100) + '%'} onChange={(v) => setAdj({ ...adj, sy: v })} />
                <Slider label="الميلان" value={adj.rot} min={-35} max={35} step={0.5} fmt={(v) => Math.round(v) + '°'} onChange={(v) => setAdj({ ...adj, rot: v })} />
                <Slider label="الشفافية" value={adj.opacity} min={0.35} max={1} step={0.01} fmt={(v) => Math.round(v * 100) + '%'} onChange={(v) => setAdj({ ...adj, opacity: v })} />
                <div className="nudge">
                  <span>تحريك دقيق</span>
                  <div>
                    <button onClick={() => setAdj({ ...adj, y: adj.y - 2 })} aria-label="أعلى">▲</button>
                    <button onClick={() => setAdj({ ...adj, y: adj.y + 2 })} aria-label="أسفل">▼</button>
                    <button onClick={() => setAdj({ ...adj, x: adj.x + 2 })} aria-label="يمين">▶</button>
                    <button onClick={() => setAdj({ ...adj, x: adj.x - 2 })} aria-label="يسار">◀</button>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setAdj(DEFAULT_ADJ)}><Icon name="reset" size={16} /> إعادة الضبط</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="shutter-row">
          <button className="mini" onClick={() => go('gallery')}><Icon name="image" size={20} /><span>المعرض</span></button>
          <button className="shutter" onClick={startCapture} aria-label="التقاط صورة"><span /></button>
          <button className="mini" onClick={() => go('catalog')}><Icon name="grid" size={20} /><span>الكتالوج</span></button>
        </div>
      </section>

      {shot && (
        <div className="modal no-gesture" onClick={() => setShot(null)}>
          <div className="shot-card" onClick={(e) => e.stopPropagation()}>
            <img src={shot.img} alt="الصورة الملتقطة" />
            <div className="shot-actions">
              <a className="btn btn-gold" href={shot.img} download={`qassati-${shot.hair || 'look'}.jpg`}><Icon name="download" size={18} /> تنزيل</a>
              <button className="btn btn-ghost" onClick={() => shareImage(shot)}><Icon name="share" size={18} /> مشاركة</button>
              <button className="btn btn-ghost" onClick={() => go('gallery')}><Icon name="compare" size={18} /> قارن</button>
              <button className="icon-btn" onClick={() => setShot(null)} aria-label="إغلاق"><Icon name="close" /></button>
            </div>
            <p className="muted small">حُفظت الصورة في معرضك على هذا الجهاز.</p>
          </div>
        </div>
      )}
    </main>
  )
}

const Rail = memo(function Rail({ kind, list, selected, color, face, onPick }) {
  const isHair = kind === 'hair'
  return (
    <div className="rail">
      {list.length === 0 && <p className="empty-rail">لا توجد عناصر في المفضلة بعد.</p>}
      {!isHair && (
        <button className={'thumb' + (!selected ? ' on' : '')} onClick={() => onPick('beard', null)}>
          <StylePreview color={color} lite />
          <span>حليق</span>
        </button>
      )}
      {list.map((it) => (
        <button key={it.id} className={'thumb' + (selected === it.id ? ' on' : '')} onClick={() => onPick(kind, it.id)}>
          <StylePreview hair={isHair ? hairRender(it) : null} beard={isHair ? null : beardRender(it)} color={color} lite />
          <span>{it.name}</span>
          {face && it.info.face.includes(face) && <i className="fit" title="مناسبة لشكل وجهك">✓</i>}
        </button>
      ))}
    </div>
  )
})

function Slider({ label, value, min, max, step, fmt, onChange }) {
  return (
    <label className="slider">
      <span className="s-label">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
      <span className="s-val">{fmt(value)}</span>
    </label>
  )
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function shareImage(shot) {
  try {
    const blob = await (await fetch(shot.img)).blob()
    const file = new File([blob], 'qassati.jpg', { type: 'image/jpeg' })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'قصّتي' })
      return
    }
  } catch {}
  const a = document.createElement('a')
  a.href = shot.img
  a.download = 'qassati.jpg'
  a.click()
}
