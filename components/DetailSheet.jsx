'use client'

import { useEffect, useState } from 'react'
import Icon from './Icons'
import { StylePreview } from './HairArt'
import { FACE_SHAPES, HAIR_TYPES, LEVELS, findHair, findBeard, hairRender, beardRender, CATEGORIES, BEARD_CATEGORIES } from '../lib/catalog'
import { HAIR_COLORS } from '../lib/color'

export default function DetailSheet({ kind, id, sel, face, favs, toggleFav, onClose, onTry, inStudio }) {
  const item = kind === 'hair' ? findHair(id) : findBeard(id)
  const [color, setColor] = useState(sel.color)
  const [flip, setFlip] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!item) return null
  const info = item.info
  const favKey = kind + ':' + item.id
  const isFav = favs.includes(favKey)
  const fits = face && info.face.includes(face)
  const catName = (kind === 'hair' ? CATEGORIES : BEARD_CATEGORIES).find((c) => c.id === item.cat)?.name

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(info.barber.replace(/[«»]/g, ''))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  const specs =
    kind === 'hair'
      ? [
          ['الطول في الأعلى', info.top],
          ['الجوانب', info.sides],
          ['وقت التصفيف اليومي', info.time],
          ['زيارة الحلاق', info.visit],
        ]
      : [
          ['الطول', info.length],
          ['التشذيب', info.visit],
        ]

  return (
    <div className="sheet-wrap" onClick={onClose}>
      <article className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={item.name}>
        <button className="icon-btn sheet-close" onClick={onClose} aria-label="إغلاق"><Icon name="close" /></button>

        <div className="sheet-grid">
          <div className="sheet-visual">
            <div className="visual-frame">
              <StylePreview
                hair={kind === 'hair' ? hairRender(item) : null}
                beard={kind === 'beard' ? beardRender(item) : null}
                color={color}
                flip={flip}
              />
            </div>
            <div className="mini-swatches">
              {HAIR_COLORS.map((c) => (
                <button key={c.id} title={c.name} className={color === c.hex ? 'on' : ''} style={{ background: c.hex }} onClick={() => setColor(c.hex)} />
              ))}
            </div>
            {kind === 'hair' && (
              <button className="btn btn-ghost btn-sm" onClick={() => setFlip((f) => !f)}><Icon name="mirror" size={16} /> اعكس اتجاه الفرق</button>
            )}
          </div>

          <div className="sheet-info">
            <div className="kicker">{catName} · {info.vibe || (kind === 'beard' ? 'لحية' : '')}</div>
            <h2>{item.name}</h2>
            <div className="en">{item.en}</div>
            {fits && <div className="fit-badge"><Icon name="check" size={16} /> مناسبة لوجهك ال{FACE_SHAPES[face].name}</div>}
            <p className="desc">{info.desc}</p>

            <div className="spec-grid">
              {specs.map(([k, v]) => (
                <div key={k} className="spec">
                  <span>{k}</span>
                  <b>{v}</b>
                </div>
              ))}
              <div className="spec">
                <span>مستوى العناية</span>
                <b className="level">
                  {[1, 2, 3, 4, 5].map((n) => <i key={n} className={n <= info.level ? 'on' : ''} />)}
                  <em>{LEVELS[info.level]}</em>
                </b>
              </div>
            </div>

            <h4 className="sub">أشكال الوجه المناسبة</h4>
            <div className="tags">
              {Object.keys(FACE_SHAPES).map((k) => (
                <span key={k} className={'tag' + (info.face.includes(k) ? ' yes' : ' no') + (k === face ? ' mine' : '')}>
                  {info.face.includes(k) ? '✓ ' : ''}{FACE_SHAPES[k].name}
                </span>
              ))}
            </div>

            {info.types && (
              <>
                <h4 className="sub">أنواع الشعر المناسبة</h4>
                <div className="tags">
                  {info.types.map((t) => <span key={t} className="tag yes">{HAIR_TYPES[t]}</span>)}
                </div>
              </>
            )}

            <div className="barber-card">
              <div className="bc-head">
                <Icon name="scissors" size={18} /> قل للحلاق
                <button className="link" onClick={copy}><Icon name={copied ? 'check' : 'copy'} size={15} /> {copied ? 'تم النسخ' : 'نسخ'}</button>
              </div>
              <blockquote>{info.barber}</blockquote>
            </div>

            <div className="two-col">
              <div>
                <h4 className="sub">المنتجات والأدوات</h4>
                <ul className="bullets">{info.products.map((p) => <li key={p}>{p}</li>)}</ul>
              </div>
              <div>
                <h4 className="sub">نصائح</h4>
                <ul className="bullets">{info.tips.map((p) => <li key={p}>{p}</li>)}</ul>
              </div>
            </div>

            <div className="sheet-actions">
              <button className="btn btn-gold btn-lg" onClick={onTry}>
                <Icon name="camera" /> {inStudio ? 'طبّقها الآن' : 'جرّبها بالكاميرا'}
              </button>
              <button className={'btn btn-ghost btn-lg' + (isFav ? ' fav-on' : '')} onClick={() => toggleFav(favKey)}>
                <Icon name="heart" /> {isFav ? 'في المفضلة' : 'أضف للمفضلة'}
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
