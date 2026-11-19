'use client'

import { useCallback, useEffect, useState } from 'react'
import Home from './Home'
import Studio from './Studio'
import Catalog from './Catalog'
import FaceQuiz from './FaceQuiz'
import Gallery from './Gallery'
import DetailSheet from './DetailSheet'
import LS from '../lib/store'
import { HAIR_COLORS } from '../lib/color'

const ROUTES = ['home', 'studio', 'catalog', 'face', 'gallery']

export default function App() {
  const [route, setRoute] = useState('home')
  const [ready, setReady] = useState(false)
  const [sel, setSel] = useState({ hair: 'frenchcrop', beard: null, color: HAIR_COLORS[1].hex, flip: false })
  const [favs, setFavs] = useState([])
  const [face, setFace] = useState(null)
  const [detail, setDetail] = useState(null) // { kind: 'hair'|'beard', id }

  useEffect(() => {
    setFavs(LS.get('q.favs', []))
    setFace(LS.get('q.face', null))
    const saved = LS.get('q.sel', null)
    if (saved) setSel((s) => ({ ...s, ...saved }))
    const read = () => {
      const h = window.location.hash.replace('#/', '').replace('#', '')
      setRoute(ROUTES.includes(h) ? h : 'home')
    }
    read()
    setReady(true)
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [])

  useEffect(() => {
    if (ready) LS.set('q.sel', sel)
  }, [sel, ready])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  const go = useCallback((r) => {
    window.location.hash = r === 'home' ? '' : '/' + r
  }, [])

  const toggleFav = useCallback((key) => {
    setFavs((f) => {
      const next = f.includes(key) ? f.filter((k) => k !== key) : [...f, key]
      LS.set('q.favs', next)
      return next
    })
  }, [])

  const saveFace = (shape) => {
    setFace(shape)
    LS.set('q.face', shape)
  }

  const tryOn = (kind, id) => {
    setSel((s) => ({ ...s, [kind]: id }))
    setDetail(null)
    go('studio')
  }

  const shared = { sel, setSel, favs, toggleFav, face, go, openDetail: (kind, id) => setDetail({ kind, id }) }

  return (
    <>
      {route === 'home' && <Home {...shared} />}
      {route === 'studio' && <Studio {...shared} />}
      {route === 'catalog' && <Catalog {...shared} />}
      {route === 'face' && <FaceQuiz {...shared} saveFace={saveFace} />}
      {route === 'gallery' && <Gallery {...shared} />}
      {detail && (
        <DetailSheet
          {...shared}
          kind={detail.kind}
          id={detail.id}
          inStudio={route === 'studio'}
          onClose={() => setDetail(null)}
          onTry={() => tryOn(detail.kind, detail.id)}
        />
      )}
    </>
  )
}
