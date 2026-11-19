'use client'

import { useState } from 'react'
import Icon from './Icons'
import { StylePreview } from './HairArt'
import { FACE_SHAPES, HAIRSTYLES, BEARDS, hairRender, beardRender } from '../lib/catalog'

// رسومات توضيحية بسيطة لأشكال الوجه
const SHAPE_PATHS = {
  oval: 'M50 8C72 8 84 30 84 54C84 80 68 100 50 100C32 100 16 80 16 54C16 30 28 8 50 8Z',
  round: 'M50 12C74 12 88 32 88 56C88 80 72 98 50 98C28 98 12 80 12 56C12 32 26 12 50 12Z',
  square: 'M22 14Q50 8 78 14Q84 16 84 26L84 76Q84 92 70 96Q50 100 30 96Q16 92 16 76L16 26Q16 16 22 14Z',
  oblong: 'M50 4C70 4 78 22 78 40L78 74C78 92 66 104 50 104C34 104 22 92 22 74L22 40C22 22 30 4 50 4Z',
  heart: 'M20 22Q50 4 80 22Q88 36 82 54Q72 82 50 100Q28 82 18 54Q12 36 20 22Z',
  diamond: 'M50 6Q66 14 82 46Q86 56 76 70Q62 92 50 102Q38 92 24 70Q14 56 18 46Q34 14 50 6Z',
  triangle: 'M34 10Q50 6 66 10Q76 26 82 54Q88 84 70 96Q50 102 30 96Q12 84 18 54Q24 26 34 10Z',
}

const QUESTIONS = [
  {
    id: 'len',
    title: 'انظر إلى وجهك في المرآة: كيف يقارن طوله بعرضه؟',
    hint: 'الطول من منبت الشعر إلى الذقن، والعرض عند الوجنتين.',
    options: [
      { v: 'long', label: 'أطول بوضوح', sub: 'الطول أكبر من العرض بمرة ونصف تقريباً', shape: 'oblong' },
      { v: 'slight', label: 'أطول قليلاً', sub: 'متوازن', shape: 'oval' },
      { v: 'equal', label: 'متقاربان', sub: 'الطول يقارب العرض', shape: 'round' },
    ],
  },
  {
    id: 'wide',
    title: 'ما أعرض جزء في وجهك؟',
    hint: 'قارن عرض الجبهة، والوجنتين، وخط الفك.',
    options: [
      { v: 'forehead', label: 'الجبهة', sub: 'أعرض من الفك', shape: 'heart' },
      { v: 'cheeks', label: 'الوجنتان', sub: 'الجبهة والفك أضيق', shape: 'diamond' },
      { v: 'jaw', label: 'الفك', sub: 'أعرض من الجبهة', shape: 'triangle' },
      { v: 'same', label: 'متساوية تقريباً', sub: 'خطوط متوازية', shape: 'square' },
    ],
  },
  {
    id: 'jaw',
    title: 'كيف يبدو خط فكك وذقنك؟',
    hint: 'مرّر إصبعك على الفك من الأذن إلى الذقن.',
    options: [
      { v: 'angular', label: 'زاوي وحاد', sub: 'زوايا واضحة', shape: 'square' },
      { v: 'soft', label: 'مستدير وناعم', sub: 'بدون زوايا', shape: 'round' },
      { v: 'pointed', label: 'ضيق ومدبب', sub: 'ذقن واضح ونحيف', shape: 'heart' },
    ],
  },
]

export function decideShape({ len, wide, jaw }) {
  if (wide === 'jaw') return 'triangle'
  if (wide === 'forehead') return jaw === 'pointed' ? 'heart' : len === 'long' ? 'oblong' : 'oval'
  if (wide === 'cheeks') {
    if (jaw === 'pointed') return 'diamond'
    if (len === 'equal' && jaw === 'soft') return 'round'
    return len === 'long' ? 'oblong' : 'oval'
  }
  // متساوية
  if (len === 'long') return 'oblong'
  if (jaw === 'angular') return 'square'
  if (len === 'equal') return 'round'
  return 'oval'
}

const ADVICE = {
  oval: 'محظوظ! الوجه البيضاوي يتقبل تقريباً كل القصات. ركّز على ما يناسب نوع شعرك وأسلوب حياتك.',
  round: 'هدفك إضافة طول وزوايا: ارتفاع في الأعلى مع جوانب قصيرة، ولحية أطول في الذقن من الجوانب.',
  square: 'فكك القوي ميزة؛ القصات الكلاسيكية والفرق الجانبي تبرزه، واللحى المستديرة تلطّف الزوايا.',
  oblong: 'تجنّب الارتفاع الكبير في الأعلى. الغرة والحجم الجانبي يقصّران الوجه بصرياً.',
  heart: 'وازن الجبهة العريضة بغرة أو طول متوسط، وأضف عرضاً للذقن بلحية كاملة.',
  diamond: 'اترك بعض الطول في الأعلى والجوانب لتوسيع الجبهة، ولحية تملأ الذقن.',
  triangle: 'أضف حجماً في الأعلى لموازنة الفك العريض، واختر لحية قصيرة أو سكسوكة.',
}

export default function FaceQuiz({ go, face, saveFace, sel, openDetail }) {
  const [step, setStep] = useState(face ? 3 : 0)
  const [ans, setAns] = useState({})
  const [result, setResult] = useState(face)

  const choose = (qid, v) => {
    const next = { ...ans, [qid]: v }
    setAns(next)
    if (step < QUESTIONS.length - 1) setStep(step + 1)
    else {
      const shape = decideShape(next)
      setResult(shape)
      saveFace(shape)
      setStep(3)
    }
  }

  const restart = () => {
    setAns({})
    setStep(0)
  }

  const recHair = result ? HAIRSTYLES.filter((h) => h.info.face.includes(result)).sort((a, b) => a.info.face.length - b.info.face.length).slice(0, 8) : []
  const recBeard = result ? BEARDS.filter((b) => b.info.face.includes(result)).sort((a, b) => a.info.face.length - b.info.face.length).slice(0, 6) : []

  return (
    <main className="page">
      <header className="page-head container">
        <button className="icon-btn" onClick={() => go('home')} aria-label="رجوع"><Icon name="back" /></button>
        <div>
          <div className="kicker">بدون ذكاء اصطناعي — أنت من يحدد</div>
          <h1>شكل وجهك</h1>
        </div>
        <span />
      </header>

      <div className="container quiz">
        {step < 3 && (
          <>
            <div className="progress">
              {QUESTIONS.map((q, i) => <i key={q.id} className={i <= step ? 'on' : ''} />)}
            </div>
            <h2 className="q-title">{QUESTIONS[step].title}</h2>
            <p className="muted">{QUESTIONS[step].hint}</p>
            <div className="options">
              {QUESTIONS[step].options.map((o) => (
                <button key={o.v} className={'option' + (ans[QUESTIONS[step].id] === o.v ? ' on' : '')} onClick={() => choose(QUESTIONS[step].id, o.v)}>
                  <svg viewBox="0 0 100 110" className="shape-ill"><path d={SHAPE_PATHS[o.shape]} /></svg>
                  <b>{o.label}</b>
                  <span>{o.sub}</span>
                </button>
              ))}
            </div>
            {step > 0 && <button className="link" onClick={() => setStep(step - 1)}>السؤال السابق</button>}
          </>
        )}

        {step === 3 && result && (
          <>
            <section className="result">
              <svg viewBox="0 0 100 110" className="shape-ill big"><path d={SHAPE_PATHS[result]} /></svg>
              <div>
                <div className="kicker">نتيجتك</div>
                <h2>وجه {FACE_SHAPES[result].name}</h2>
                <p className="muted">{FACE_SHAPES[result].hint}</p>
                <p className="advice">{ADVICE[result]}</p>
                <div className="row">
                  <button className="btn btn-gold" onClick={() => go('studio')}><Icon name="camera" size={18} /> جرّب المقترحات بالكاميرا</button>
                  <button className="btn btn-ghost" onClick={restart}><Icon name="reset" size={18} /> أعد الاختبار</button>
                </div>
              </div>
            </section>

            <div className="manual-shapes">
              <span className="muted small">أو اختر شكل وجهك مباشرة:</span>
              <div className="chips">
                {Object.entries(FACE_SHAPES).map(([k, v]) => (
                  <button key={k} className={'chip' + (k === result ? ' on' : '')} onClick={() => { setResult(k); saveFace(k) }}>{v.name}</button>
                ))}
              </div>
            </div>

            <h3 className="section-title"><span>قصّات نرشّحها لك</span></h3>
            <div className="rec-grid">
              {recHair.map((h) => (
                <button key={h.id} className="rec" onClick={() => openDetail('hair', h.id)}>
                  <StylePreview hair={hairRender(h)} color={sel.color} lite />
                  <span>{h.name}</span>
                </button>
              ))}
            </div>
            <h3 className="section-title"><span>لحى تناسبك</span></h3>
            <div className="rec-grid">
              {recBeard.map((b) => (
                <button key={b.id} className="rec" onClick={() => openDetail('beard', b.id)}>
                  <StylePreview beard={beardRender(b)} color={sel.color} lite />
                  <span>{b.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
