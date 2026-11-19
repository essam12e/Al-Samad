'use client'

import { useMemo, useState } from 'react'
import Icon from './Icons'
import { StylePreview } from './HairArt'
import { HAIRSTYLES, BEARDS, CATEGORIES, BEARD_CATEGORIES, FACE_SHAPES, LEVELS, hairRender, beardRender } from '../lib/catalog'

export default function Catalog({ sel, go, favs, toggleFav, face, openDetail }) {
  const [tab, setTab] = useState('hair')
  const [cat, setCat] = useState('all')
  const [shape, setShape] = useState(face || 'any')
  const [q, setQ] = useState('')
  const [onlyFav, setOnlyFav] = useState(false)
  const [maxLevel, setMaxLevel] = useState(5)

  const source = tab === 'hair' ? HAIRSTYLES : BEARDS
  const cats = tab === 'hair' ? CATEGORIES : BEARD_CATEGORIES

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return source.filter(
      (s) =>
        (cat === 'all' || s.cat === cat) &&
        (shape === 'any' || s.info.face.includes(shape)) &&
        s.info.level <= maxLevel &&
        (!onlyFav || favs.includes(tab + ':' + s.id)) &&
        (!term || s.name.includes(term) || s.en.toLowerCase().includes(term) || s.info.desc.includes(term))
    )
  }, [source, cat, shape, q, onlyFav, favs, tab, maxLevel])

  const switchTab = (t) => {
    setTab(t)
    setCat('all')
  }

  return (
    <main className="page">
      <header className="page-head container">
        <button className="icon-btn" onClick={() => go('home')} aria-label="رجوع"><Icon name="back" /></button>
        <div>
          <div className="kicker">دليل الحلاق</div>
          <h1>الكتالوج</h1>
        </div>
        <button className="btn btn-gold" onClick={() => go('studio')}><Icon name="camera" size={18} /> الكاميرا</button>
      </header>

      <div className="container">
        <div className="seg">
          <button className={tab === 'hair' ? 'on' : ''} onClick={() => switchTab('hair')}><Icon name="scissors" size={18} /> قصّات الشعر <em>{HAIRSTYLES.length}</em></button>
          <button className={tab === 'beard' ? 'on' : ''} onClick={() => switchTab('beard')}><Icon name="beard" size={18} /> اللحى والشوارب <em>{BEARDS.length}</em></button>
        </div>

        <div className="filters">
          <label className="search">
            <Icon name="search" size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم: فيد، كروب، Pompadour…" />
          </label>
          <div className="chips">
            {cats.map((c) => (
              <button key={c.id} className={'chip' + (cat === c.id ? ' on' : '')} onClick={() => setCat(c.id)}>{c.name}</button>
            ))}
            <button className={'chip' + (onlyFav ? ' on' : '')} onClick={() => setOnlyFav((v) => !v)}>♥ المفضلة</button>
          </div>
          <div className="filter-row">
            <label className="select">
              <span>شكل الوجه</span>
              <select value={shape} onChange={(e) => setShape(e.target.value)}>
                <option value="any">كل الأشكال</option>
                {Object.entries(FACE_SHAPES).map(([k, v]) => (
                  <option key={k} value={k}>{v.name}{k === face ? ' (وجهك)' : ''}</option>
                ))}
              </select>
            </label>
            <label className="select">
              <span>العناية</span>
              <select value={maxLevel} onChange={(e) => setMaxLevel(+e.target.value)}>
                <option value={5}>أي مستوى</option>
                <option value={2}>سهلة فقط</option>
                <option value={3}>حتى متوسطة</option>
                <option value={4}>حتى تحتاج اهتمام</option>
              </select>
            </label>
            {!face && (
              <button className="link" onClick={() => go('face')}><Icon name="face" size={16} /> لا تعرف شكل وجهك؟</button>
            )}
          </div>
        </div>

        <p className="result-count">{list.length} نتيجة</p>

        <div className="cards">
          {list.map((s) => {
            const key = tab + ':' + s.id
            const fits = face && s.info.face.includes(face)
            return (
              <article key={s.id} className="card" onClick={() => openDetail(tab, s.id)}>
                <div className="card-visual">
                  <StylePreview hair={tab === 'hair' ? hairRender(s) : null} beard={tab === 'beard' ? beardRender(s) : null} color={sel.color} lite />
                  {fits && <span className="fit-pill">مناسبة لوجهك</span>}
                  <button
                    className={'fav' + (favs.includes(key) ? ' on' : '')}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFav(key)
                    }}
                    aria-label="مفضلة"
                  >
                    <Icon name="heart" size={18} />
                  </button>
                </div>
                <div className="card-body">
                  <h3>{s.name}</h3>
                  <div className="en">{s.en}</div>
                  <p>{s.info.desc}</p>
                  <div className="card-meta">
                    <span className="level sm">
                      {[1, 2, 3, 4, 5].map((n) => <i key={n} className={n <= s.info.level ? 'on' : ''} />)}
                      <em>{LEVELS[s.info.level]}</em>
                    </span>
                    <span className="muted">{s.info.visit}</span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
        {list.length === 0 && <div className="empty">لا توجد نتائج مطابقة. جرّب تخفيف الفلاتر.</div>}
      </div>
    </main>
  )
}
