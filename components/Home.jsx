'use client'

import { useEffect, useState } from 'react'
import Icon, { Logo } from './Icons'
import { StylePreview } from './HairArt'
import { HAIRSTYLES, BEARDS, FACE_SHAPES, hairRender, beardRender, findHair } from '../lib/catalog'
import { HAIR_COLORS } from '../lib/color'

const SHOWCASE = [
  ['pompadour', 'fullshort', '#1d1814'],
  ['frenchcrop', 'stubble', '#3b2a1f'],
  ['curlytop', 'gulfbeard', '#0f0d0c'],
  ['slickback', 'vandyke', '#5c3a24'],
  ['longwavy', null, '#7d5634'],
  ['quiff', 'heavystubble', '#1d1814'],
  ['afro', 'circle', '#0f0d0c'],
  ['manbun', 'fullbeard', '#3b2a1f'],
]

export default function Home({ go, face, sel, openDetail }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % SHOWCASE.length), 2600)
    return () => clearInterval(t)
  }, [])
  const [h, b, c] = SHOWCASE[i]
  const current = findHair(h)

  return (
    <main className="home">
      <div className="home-glow" aria-hidden="true" />
      <header className="topbar container">
        <div className="brand">
          <Logo size={40} />
          <div>
            <div className="brand-name">قصّتي</div>
            <div className="brand-sub">QASSATI · STUDIO</div>
          </div>
        </div>
        <nav className="topnav">
          <button className="link" onClick={() => go('catalog')}>الكتالوج</button>
          <button className="link" onClick={() => go('face')}>شكل وجهك</button>
          <button className="link" onClick={() => go('gallery')}>صوري</button>
        </nav>
      </header>

      <section className="hero container">
        <div className="hero-copy">
          <span className="eyebrow"><Icon name="lock" size={14} /> يعمل بالكامل على جهازك · بدون ذكاء اصطناعي</span>
          <h1>
            جرّب قصّتك
            <br />
            <span className="gold-text">قبل أن تجلس على الكرسي</span>
          </h1>
          <p className="lead">
            استوديو حلاقة شخصي في جيبك. افتح الكاميرا وجرّب أكثر من {HAIRSTYLES.length} قصة و{BEARDS.length} لحية وشارب على وجهك مباشرة،
            مع تفاصيل كاملة لكل قصة: من يناسبها، وكيف تطلبها من الحلاق، وكم تحتاج من عناية.
          </p>
          <div className="hero-cta">
            <button className="btn btn-gold btn-lg" onClick={() => go('studio')}>
              <Icon name="camera" /> افتح الكاميرا وابدأ
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => go('catalog')}>
              <Icon name="grid" /> تصفّح الكتالوج
            </button>
          </div>
          <div className="stats">
            <div><strong>{HAIRSTYLES.length}+</strong><span>قصة شعر</span></div>
            <div><strong>{BEARDS.length}</strong><span>لحية وشارب</span></div>
            <div><strong>{HAIR_COLORS.length}</strong><span>ألوان شعر</span></div>
            <div><strong>0</strong><span>صور تُرفع</span></div>
          </div>
        </div>

        <div className="hero-stage">
          <div className="stage-ring" aria-hidden="true" />
          <div className="stage-ring r2" aria-hidden="true" />
          <div className="hero-bust" key={i}>
            <StylePreview hair={hairRender(current)} beard={beardRender(BEARDS.find((x) => x.id === b))} color={c} />
          </div>
          <button className="hero-caption" onClick={() => openDetail('hair', h)}>
            <span className="cap-label">الآن تعرض</span>
            <span className="cap-name">{current.name}</span>
            <span className="cap-en">{current.en}</span>
          </button>
          <div className="dots">
            {SHOWCASE.map((_, k) => (
              <button key={k} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`عرض ${k + 1}`} />
            ))}
          </div>
        </div>
      </section>

      <section className="container features">
        <button className="feature" onClick={() => go('studio')}>
          <div className="f-icon"><Icon name="camera" size={26} /></div>
          <h3>المرآة الذكية… بدون ذكاء</h3>
          <p>ضع وجهك داخل الإطار الذهبي، واسحب القصة أو كبّرها بإصبعين لتطابق رأسك تماماً. كل شيء يُرسم على جهازك.</p>
          <span className="f-more">ابدأ التجربة <Icon name="back" size={16} style={{ transform: 'scaleX(-1)' }} /></span>
        </button>
        <button className="feature" onClick={() => go('face')}>
          <div className="f-icon"><Icon name="face" size={26} /></div>
          <h3>اكتشف شكل وجهك</h3>
          <p>
            {face
              ? `وجهك ${FACE_SHAPES[face].name}. سنُبرز لك القصص المناسبة له في كل مكان.`
              : 'ثلاثة أسئلة بسيطة تحدد شكل وجهك، ثم نرشّح لك القصات واللحى الأنسب.'}
          </p>
          <span className="f-more">{face ? 'أعد الاختبار' : 'ابدأ الاختبار'} <Icon name="back" size={16} style={{ transform: 'scaleX(-1)' }} /></span>
        </button>
        <button className="feature" onClick={() => go('catalog')}>
          <div className="f-icon"><Icon name="scissors" size={26} /></div>
          <h3>دليل الحلاق الكامل</h3>
          <p>لكل قصة: الأطوال وأرقام الماكينة، والجملة الجاهزة التي تقولها للحلاق، والمنتجات، ومستوى العناية.</p>
          <span className="f-more">افتح الدليل <Icon name="back" size={16} style={{ transform: 'scaleX(-1)' }} /></span>
        </button>
      </section>

      <section className="container how">
        <h2 className="section-title"><span>كيف تعمل؟</span></h2>
        <ol className="steps">
          <li><b>1</b><div><h4>افتح الكاميرا</h4><p>الكاميرا الأمامية تعمل كمرآة. لا يُرسل أي شيء خارج جهازك.</p></div></li>
          <li><b>2</b><div><h4>طابق وجهك مع الإطار</h4><p>الذقن على الخط السفلي، والعينان على الخط الأفقي.</p></div></li>
          <li><b>3</b><div><h4>اختر القصة واللون</h4><p>اسحب القصة لتحريكها، وقرّب بإصبعين لتكبيرها وتدويرها.</p></div></li>
          <li><b>4</b><div><h4>صوّر وقارن</h4><p>احفظ صوراً لعدة قصات وقارن بينها جنباً إلى جنب قبل زيارة الحلاق.</p></div></li>
        </ol>
      </section>

      <footer className="container footer">
        <Logo size={28} />
        <span>قصّتي — استوديو تجربة القصّات. يعمل محلياً على جهازك.</span>
      </footer>
    </main>
  )
}
