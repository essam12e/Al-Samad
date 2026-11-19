'use client'

import { memo, useId, useMemo } from 'react'
import { buildModel, regionPath } from '../lib/hairEngine'
import { palette } from '../lib/color'

// نقاط ثابتة لملمس الشعر القصير جداً
const DOTS = (() => {
  let a = 7
  const r = () => ((a = (a * 16807) % 2147483647) / 2147483647)
  return Array.from({ length: 34 }, () => [r() * 7, r() * 7, 0.16 + r() * 0.22, r() < 0.5 ? 1 : 0].map((v) => Math.round(v * 100) / 100))
})()

// يرسم طبقات الشعر/اللحية داخل <svg> بإحداثيات "الرأس"
function HairArt({ hair, beard, color = '#1d1814', beardColor, flip = false, lite = false }) {
  const thin = (arr) => (lite && arr ? arr.filter((_, i) => i % 3 === 0) : arr)
  const raw = useId()
  const id = 'h' + raw.replace(/[^a-zA-Z0-9]/g, '')
  const layers = useMemo(
    () => buildModel(hair, beard, (hair?.id || 'none') + '|' + (beard?.id || 'none')),
    [hair, beard]
  )
  const P = palette(color)
  const B = palette(beardColor || color)

  const defsFor = (pal, pre) => (
    <>
      <linearGradient id={`${pre}-body`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={pal.light} />
        <stop offset="0.35" stopColor={pal.base} />
        <stop offset="1" stopColor={pal.dark} />
      </linearGradient>
      <pattern id={`${pre}-dots`} width="7" height="7" patternUnits="userSpaceOnUse">
        {DOTS.map(([x, y, r, k], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={k ? pal.deep : pal.dark} />
        ))}
      </pattern>
    </>
  )

  return (
    <g transform={flip ? 'scale(-1,1)' : undefined}>
      <defs>
        {defsFor(P, id)}
        {defsFor(B, id + 'b')}
        <radialGradient id={`${id}-sheen`} cx="0.5" cy="0.18" r="0.55">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-soft`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="0.55" />
        </filter>
        {layers.map((L) => (
          <clipPath key={'c' + L.key} id={`${id}-c-${L.key}`}>
            <path d={regionPath(L)} clipRule="evenodd" />
          </clipPath>
        ))}
        {layers
          .filter((L) => L.fade)
          .map((L) => (
            <g key={'m' + L.key}>
              <linearGradient id={`${id}-g-${L.key}`} gradientUnits="userSpaceOnUse" x1="0" y1={L.fadeY[0]} x2="0" y2={L.fadeY[1]}>
                {L.fade.map(([o, v], i) => (
                  <stop key={i} offset={o} stopColor="#fff" stopOpacity={v} />
                ))}
              </linearGradient>
              <mask id={`${id}-m-${L.key}`} maskUnits="userSpaceOnUse" x="-300" y="-300" width="600" height="600">
                <rect x="-300" y="-300" width="600" height="600" fill={`url(#${id}-g-${L.key})`} />
              </mask>
            </g>
          ))}
        {layers
          .filter((L) => L.part)
          .map((L) => (
            <mask key={'p' + L.key} id={`${id}-p-${L.key}`} maskUnits="userSpaceOnUse" x="-300" y="-300" width="600" height="600">
              <rect x="-300" y="-300" width="600" height="600" fill="#fff" />
              <path d={L.part} stroke="#000" strokeWidth={L.partHard ? 2.2 : 1.1} strokeOpacity={L.partHard ? 1 : 0.7} fill="none" strokeLinecap="round" />
            </mask>
          ))}
      </defs>

      {layers.map((L) => {
        const pal = L.beard ? B : P
        const pre = L.beard ? id + 'b' : id
        const cmap = { dark: pal.dark, base: pal.base, light: pal.light, lighter: pal.lighter }
        const d = regionPath(L)
        const mask = L.fade ? `url(#${id}-m-${L.key})` : L.part ? `url(#${id}-p-${L.key})` : undefined
        return (
          <g key={L.key} mask={mask}>
            {L.body && L.opacity > 0 && (
              <path d={d} fill={`url(#${pre}-body)`} fillRule="evenodd" opacity={L.opacity} filter={`url(#${id}-soft)`} />
            )}
            {L.stipple && (
              <>
                <path d={d} fill={pal.base} fillRule="evenodd" opacity={L.opacity * 0.85} filter={`url(#${id}-soft)`} />
                <path d={d} fill={`url(#${pre}-dots)`} fillRule="evenodd" opacity={Math.min(1, L.opacity * 0.9)} />
              </>
            )}
            {L.shine && <path d={d} fill={`url(#${id}-sheen)`} fillRule="evenodd" />}
            <g clipPath={`url(#${id}-c-${L.key})`} fill="none" strokeLinecap="round">
              {thin(L.strands)?.map((s, i) => (
                <path key={i} d={s.d} stroke={cmap[s.c]} strokeWidth={s.w} strokeOpacity={s.o} />
              ))}
              {thin(L.curls)?.map((s, i) => (
                <path key={i} d={s.d} stroke={cmap[s.c]} strokeWidth={s.w} strokeOpacity={s.o} />
              ))}
              {L.braids?.map((s, i) => (
                <g key={i}>
                  <path d={s.d} stroke={pal.deep} strokeWidth="7.2" />
                  <path d={s.d} stroke={pal.base} strokeWidth="5.6" strokeDasharray="3.2 1.4" />
                  <path d={s.d} stroke={pal.lighter} strokeWidth="1" strokeOpacity="0.45" strokeDasharray="1.6 3" />
                </g>
              ))}
            </g>
            {thin(L.fluff)?.map((s, i) => (
              <path key={'f' + i} d={s.d} stroke={cmap[s.c]} strokeWidth={s.w} strokeOpacity={s.o} fill="none" strokeLinecap="round" />
            ))}
            {L.locks?.map((s, i) => (
              <g key={'l' + i} fill="none" strokeLinecap="round">
                <path d={s.d} stroke={pal.deep} strokeWidth={s.w + 1.4} />
                <path d={s.d} stroke={pal.base} strokeWidth={s.w} />
                <path d={s.d} stroke={pal.light} strokeWidth={s.w * 0.45} strokeDasharray="2.2 2.6" strokeOpacity="0.7" />
              </g>
            ))}
          </g>
        )
      })}
    </g>
  )
}

export default memo(HairArt)

// مجسّم رأس أنيق يُستخدم للمعاينة في الكتالوج
export function Mannequin({ tone = 'stone' }) {
  const id = 'mq' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const skin = tone === 'stone' ? ['#e7d3bf', '#c9a688', '#9c7458'] : ['#c79d78', '#a77a55', '#6f4b31']
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-f`} cx="0.42" cy="0.38" r="0.75">
          <stop offset="0" stopColor={skin[0]} />
          <stop offset="0.6" stopColor={skin[1]} />
          <stop offset="1" stopColor={skin[2]} />
        </radialGradient>
        <linearGradient id={`${id}-n`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skin[2]} />
          <stop offset="0.35" stopColor={skin[1]} />
          <stop offset="1" stopColor={skin[1]} stopOpacity="0.15" />
        </linearGradient>
      </defs>
      {/* الكتفان والرقبة */}
      <path d="M-30 60 C-30 90 -32 112 -40 124 C-62 132 -96 140 -112 160 L112 160 C96 140 62 132 40 124 C32 112 30 90 30 60 Z" fill={`url(#${id}-n)`} />
      <path d="M-30 96 C-12 112 12 112 30 96" stroke={skin[2]} strokeOpacity="0.35" fill="none" />
      {/* الأذنان */}
      <ellipse cx="-66" cy="4" rx="7.5" ry="15" fill={skin[1]} />
      <ellipse cx="66" cy="4" rx="7.5" ry="15" fill={skin[1]} />
      <path d="M-66 -6 q-4 8 0 18" stroke={skin[2]} strokeOpacity="0.6" fill="none" />
      <path d="M66 -6 q4 8 0 18" stroke={skin[2]} strokeOpacity="0.6" fill="none" />
      {/* الرأس */}
      <path d="M-64 8 C-74 -62 -40 -102 0 -102 C40 -102 74 -62 64 8 C60 44 38 80 0 85 C-38 80 -60 44 -64 8 Z" fill={`url(#${id}-f)`} />
      {/* ملامح خطية هادئة */}
      <g stroke={skin[2]} strokeLinecap="round" fill="none" opacity="0.75">
        <path d="M-38 -16 Q-27 -22 -14 -18" strokeWidth="2.2" />
        <path d="M38 -16 Q27 -22 14 -18" strokeWidth="2.2" />
        <path d="M-35 -4 Q-26 0 -17 -4" strokeWidth="1.4" />
        <path d="M35 -4 Q26 0 17 -4" strokeWidth="1.4" />
        <path d="M-2 -6 Q-6 18 -8 26 Q-2 31 6 27" strokeWidth="1.3" />
        <path d="M-15 50 Q0 47 15 50" strokeWidth="1.6" />
        <path d="M-10 55 Q0 59 10 55" strokeWidth="1" opacity="0.6" />
      </g>
    </g>
  )
}

export const StylePreview = memo(function StylePreview({ hair, beard, color, flip, className, showHead = true, lite = false }) {
  return (
    <svg className={className} viewBox="-112 -150 224 300" role="img" aria-hidden="true">
      {showHead && <Mannequin />}
      <HairArt hair={hair} beard={beard} color={color} flip={flip} lite={lite} />
    </svg>
  )
})
