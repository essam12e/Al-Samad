const P = {
  camera: 'M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.3-2h5.2l1.3 2h1.6A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5zM12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  back: 'M9 5l7 7-7 7',
  close: 'M6 6l12 12M18 6L6 18',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  face: 'M12 3c4 0 7 3.4 7 8.2C19 16 15.8 21 12 21s-7-5-7-9.8C5 6.4 8 3 12 3zM9.5 10.5h.01M14.5 10.5h.01M9.5 15c1.4 1 3.6 1 5 0',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  image: 'M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5zM4 16l4.5-4.5 4 4 2.5-2.5L20 18M15.5 9h.01',
  flip: 'M4 12a8 8 0 0 1 13.7-5.6M20 12a8 8 0 0 1-13.7 5.6M17 3v4h-4M7 21v-4h4',
  sliders: 'M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M10 15v4',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  share: 'M12 15V4M8 8l4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5',
  trash: 'M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  reset: 'M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4',
  upload: 'M12 16V5M7 10l5-5 5 5M5 20h14',
  timer: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2.5 2.5M9.5 2.5h5',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  mirror: 'M12 3v18M8 7l-4 5 4 5M16 7l4 5-4 5',
  palette: 'M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.5-2-.4-1.4.6-2.5 2-2.5H18a3 3 0 0 0 3-3C21 7 17 3 12 3zM7.5 11h.01M10 7.5h.01M14.5 7.5h.01',
  scissors: 'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.2 7.8L20 19M8.2 16.2L20 5',
  beard: 'M5 6c0 9 3 14 7 14s7-5 7-14M8.5 13c1-.8 2.2-1.2 3.5-1.2s2.5.4 3.5 1.2M10.5 16h3',
  search: 'M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM21 21l-5.2-5.2',
  copy: 'M9 9h10v11H9zM5 15V4h10',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  compare: 'M12 3v18M5 7h4v10H5zM15 7h4v10h-4z',
}

export default function Icon({ name, size = 22, stroke = 1.6, className, style }) {
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={P[name]} />
    </svg>
  )
}

export function Logo({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="lg-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6e2b3" />
          <stop offset="0.5" stopColor="#d4af6a" />
          <stop offset="1" stopColor="#9a7638" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="none" stroke="url(#lg-gold)" strokeWidth="1.4" />
      <circle cx="32" cy="32" r="26" fill="none" stroke="url(#lg-gold)" strokeWidth="0.6" opacity="0.6" />
      <g stroke="url(#lg-gold)" strokeWidth="2.2" fill="none" strokeLinecap="round">
        <circle cx="22" cy="42" r="5" />
        <circle cx="42" cy="42" r="5" />
        <path d="M25.5 38.5L42 16M38.5 38.5L22 16" />
      </g>
      <circle cx="32" cy="31" r="1.6" fill="url(#lg-gold)" />
    </svg>
  )
}
