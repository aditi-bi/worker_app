import type { SVGProps } from 'react'

/** Simple line icons (24x24 grid). Every icon is decorative unless a label is passed. */
const PATHS = {
  pin: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z M12 12.2a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4z',
  crosshair: 'M12 3v4M12 17v4M3 12h4M17 12h4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.500 5.600 12 3z',
  chevronDown: 'M6 9l6 6 6-6',
  chevronRight: 'M9 6l6 6-6 6',
  arrowLeft: 'M19 12H5M11 6l-6 6 6 6',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  filter: 'M4 6h16M7 12h10M10 18h4',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12.5l4.500 4.500L19 7.500',
  speaker: 'M4 10v4h4l5 4V6L8 10H4zM16.500 9a4.500 4.500 0 0 1 0 6M19 6.500a8 8 0 0 1 0 11',
  stop: 'M7 7h10v10H7z',
  refresh: 'M20 12a8 8 0 1 1-2.500-5.800M20 4v5h-5',
  wifiOff: 'M3 3l18 18M8.500 16.500a5 5 0 0 1 7 0M5 12.800a10 10 0 0 1 3.200-2M12 20h.01M10.500 6.200A15 15 0 0 1 22 10M2 10a15 15 0 0 1 4-2.600',
  alert: 'M12 4l9 16H3L12 4zM12 10v4M12 17.500h.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  briefcase: 'M4 8h16v11H4zM9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M4 13h16',
  rupee: 'M7 5h10M7 9h10M7 5c5 0 7 1.500 7 4s-2 4-7 4l8 6',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.700.400-1 .900-1 1.700M12 17h.01',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  lock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  cards: 'M6 6h12v12H6zM9 3h6M9 21h6',
  inbox: 'M4 13l2-7h12l2 7v5H4v-5zM4 13h4l1 2h6l1-2h4',
  edit: 'M4 20h4L19 9l-4-4L4 16v4z',
  doc: 'M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6',
  shield: 'M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6l8-3z',
  mic: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4',
  phone: 'M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  cal: 'M4 6h16v14H4zM8 3v4M16 3v4M4 10h16',
  plus: 'M12 5v14M5 12h14',
  trash: 'M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13',
  out: 'M10 4H5v16h5M15 8l5 4-5 4M20 12H9',
  home: 'M4 11l8-7 8 7M6 10v10h12V10M10 20v-5h4v5',
  /* work categories */
  construction: 'M4 20h16M6 20V9l6-5 6 5v11M10 20v-6h4v6',
  loading: 'M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8',
  factory: 'M3 20V10l6 3V10l6 3V6h4v14H3zM8 20v-3M13 20v-3',
  hotel: 'M5 10h14v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3zM3 10h18M9 6c0-1 1-1 1-2M14 6c0-1 1-1 1-2',
  domestic: 'M4 11l8-7 8 7M6 10v10h12V10M10 20v-5h4v5',
  farm: 'M12 21v-9M12 12c0-4 2.500-6 6-6 0 4-2 6-6 6zM12 15c0-3-2-5-5-5 0 3 1.500 5 5 5z',
} as const

export type IconName = keyof typeof PATHS

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
  /** Accessible label. Leave empty when the icon sits next to text. */
  label?: string
}

export function Icon({ name, size = 24, label, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
