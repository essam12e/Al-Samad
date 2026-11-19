'use client'

import { useEffect, useState } from 'react'
import Icon from './Icons'
import { gallery } from '../lib/store'
import { findHair, findBeard } from '../lib/catalog'
import { shareImage } from './Studio'

const label = (s) => [findHair(s.hair)?.name, findBeard(s.beard)?.name].filter(Boolean).join(' + ') || 'بدون قصة'

export default function Gallery({ go, openDetail }) {
  const [shots, setShots] = useState(null)
  const [picked, setPicked] = useState([])
  const [view, setView] = useState(null)
  const [compare, setCompare] = useState(false)

  useEffect(() => {
    gallery.all().then(setShots)
  }, [])

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p.slice(-1), id]))

  const remove = async (id) => {
    await gallery.remove(id)
    setShots((s) => s.filter((x) => x.id !== id))
    setPicked((p) => p.filter((x) => x !== id))
    setView(null)
  }

  const pair = shots?.filter((s) => picked.includes(s.id)) || []

  return (
    <main className="page">
      <header className="page-head container">
        <button className="icon-btn" onClick={() => go('home')} aria-label="رجوع"><Icon name="back" /></button>
        <div>
          <div className="kicker">محفوظة على جهازك فقط</div>
          <h1>معرض الصور</h1>
        </div>
        <button className="btn btn-gold" onClick={() => go('studio')}><Icon name="camera" size={18} /> صورة جديدة</button>
      </header>

      <div className="container">
        {shots === null && <div className="empty"><div className="spinner" /></div>}
        {shots?.length === 0 && (
          <div className="empty big">
            <Icon name="image" size={44} />
            <h3>لا توجد صور بعد</h3>
            <p>التقط صوراً لنفسك بقصات مختلفة، ثم قارن بينها هنا جنباً إلى جنب.</p>
            <button className="btn btn-gold" onClick={() => go('studio')}><Icon name="camera" size={18} /> افتح الكاميرا</button>
          </div>
        )}

        {shots?.length > 0 && (
          <>
            <div className="compare-bar">
              <span>اختر صورتين للمقارنة ({picked.length}/2)</span>
              <button className="btn btn-gold btn-sm" disabled={picked.length !== 2} onClick={() => setCompare(true)}>
                <Icon name="compare" size={16} /> قارن
              </button>
            </div>
            <div className="shots">
              {shots.map((s) => (
                <figure key={s.id} className={'shot' + (picked.includes(s.id) ? ' picked' : '')}>
                  <img src={s.img} alt={label(s)} onClick={() => setView(s)} />
                  <button className="pick" onClick={() => toggle(s.id)} aria-label="اختيار للمقارنة">
                    {picked.includes(s.id) ? <Icon name="check" size={16} /> : null}
                  </button>
                  <figcaption>
                    <b>{label(s)}</b>
                    <span>{new Date(s.at).toLocaleDateString('ar', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </>
        )}
      </div>

      {view && (
        <div className="modal" onClick={() => setView(null)}>
          <div className="shot-card" onClick={(e) => e.stopPropagation()}>
            <img src={view.img} alt={label(view)} />
            <h3>{label(view)}</h3>
            <div className="shot-actions">
              <a className="btn btn-gold" href={view.img} download="qassati.jpg"><Icon name="download" size={18} /> تنزيل</a>
              <button className="btn btn-ghost" onClick={() => shareImage(view)}><Icon name="share" size={18} /> مشاركة</button>
              {view.hair && <button className="btn btn-ghost" onClick={() => openDetail('hair', view.hair)}><Icon name="info" size={18} /> التفاصيل</button>}
              <button className="btn btn-danger" onClick={() => remove(view.id)}><Icon name="trash" size={18} /> حذف</button>
              <button className="icon-btn" onClick={() => setView(null)} aria-label="إغلاق"><Icon name="close" /></button>
            </div>
          </div>
        </div>
      )}

      {compare && pair.length === 2 && (
        <div className="modal" onClick={() => setCompare(false)}>
          <div className="compare" onClick={(e) => e.stopPropagation()}>
            {pair.map((s) => (
              <figure key={s.id}>
                <img src={s.img} alt={label(s)} />
                <figcaption>{label(s)}</figcaption>
              </figure>
            ))}
            <button className="icon-btn compare-close" onClick={() => setCompare(false)} aria-label="إغلاق"><Icon name="close" /></button>
          </div>
        </div>
      )}
    </main>
  )
}
