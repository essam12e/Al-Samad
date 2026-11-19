// أدوات ألوان بسيطة (بدون أي مكتبات)
const clamp = (v, a = 0, b = 255) => Math.min(b, Math.max(a, v))

export function hexToRgb(hex) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => clamp(Math.round(v)).toString(16).padStart(2, '0')).join('')
}

export function mix(a, b, t) {
  const A = hexToRgb(a)
  const B = hexToRgb(b)
  return rgbToHex(A.map((v, i) => v + (B[i] - v) * t))
}

export function palette(base) {
  return {
    base,
    deep: mix(base, '#000000', 0.55),
    dark: mix(base, '#000000', 0.32),
    light: mix(base, '#ffffff', 0.22),
    lighter: mix(base, '#ffffff', 0.42),
  }
}

export const HAIR_COLORS = [
  { id: 'jet', name: 'أسود فاحم', hex: '#0f0d0c' },
  { id: 'black', name: 'أسود طبيعي', hex: '#1d1814' },
  { id: 'darkbrown', name: 'بني غامق', hex: '#3b2a1f' },
  { id: 'chestnut', name: 'كستنائي', hex: '#5c3a24' },
  { id: 'brown', name: 'بني فاتح', hex: '#7d5634' },
  { id: 'honey', name: 'عسلي', hex: '#a7773f' },
  { id: 'blonde', name: 'أشقر', hex: '#c9a467' },
  { id: 'copper', name: 'نحاسي', hex: '#8e3f1f' },
  { id: 'ash', name: 'رمادي دخاني', hex: '#8a8580' },
  { id: 'silver', name: 'فضي', hex: '#c4c2bf' },
]
