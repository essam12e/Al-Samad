// تخزين محلي على جهاز المستخدم فقط — لا شيء يُرفع لأي خادم
const LS = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key)
      return v == null ? fallback : JSON.parse(v)
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  },
}
export default LS

// معرض الصور المحفوظة (IndexedDB)
const DB = 'qassati'
const STORE = 'shots'

function open() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no-idb'))
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx(mode, fn) {
  const db = await open()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const s = t.objectStore(STORE)
    const r = fn(s)
    t.oncomplete = () => resolve(r?.result)
    t.onerror = () => reject(t.error)
  })
}

export const gallery = {
  async all() {
    try {
      const list = await tx('readonly', (s) => s.getAll())
      return (list || []).sort((a, b) => b.at - a.at)
    } catch {
      return []
    }
  },
  async add(shot) {
    try {
      await tx('readwrite', (s) => s.put(shot))
      return true
    } catch {
      return false
    }
  },
  async remove(id) {
    try {
      await tx('readwrite', (s) => s.delete(id))
    } catch {}
  },
}
