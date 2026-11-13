const paths = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v9.5h5v-6h3v6h5V10',
  flock:
    'M7 18c-2.2 0-4-1.8-4-4.2C3 10.5 6 8 9.5 8c.5-2.4 2.3-4 4.5-4 2.5 0 4.5 2 4.5 4.5 0 .4 0 .8-.1 1.1L21 10.5l-2.6.9C17.6 15.4 14 18 10 18H7Zm8.5-10.2h.01M9 18v2.5M12.5 18v2.5',
  layout: 'M3.5 3.5h17v17h-17zM3.5 10h8v10.5M11.5 3.5V7M15 14h5.5',
  calc: 'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm2 3h8v3H8zM8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01',
  book: 'M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13ZM20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5v-13Z',
  settings:
    'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.4-2.2.1-1.3-.1-1.3 2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2.2-1.3L14.5 3h-5l-.4 2.4c-.8.3-1.5.8-2.2 1.3l-2.4-1-2 3.4 2 1.6-.1 1.3.1 1.3-2 1.6 2 3.4 2.4-1c.7.5 1.4 1 2.2 1.3l.4 2.4h5l.4-2.4c.8-.3 1.5-.8 2.2-1.3l2.4 1 2-3.4-2-1.6Z',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12.5 10 17.5 19 7',
  chevron: 'M15 5l-7 7 7 7',
  back: 'M9 5l7 7-7 7',
  close: 'M6 6l12 12M18 6 6 18',
  alert: 'M12 3 2 20h20L12 3Zm0 6v5m0 3h.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-11v6m0-9h.01',
  thermo: 'M12 3a2 2 0 0 0-2 2v9.3a4 4 0 1 0 4 0V5a2 2 0 0 0-2-2Zm0 11v3',
  drop: 'M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5Z',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-13v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4',
  feed: 'M4 10h16l-1.5 9.5a1 1 0 0 1-1 .5h-11a1 1 0 0 1-1-.5L4 10Zm3-5h10l1 5H6l1-5Z',
  scale: 'M12 4v3M5 21h14l-2-12H7L5 21Zm7-12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  syringe: 'M18 3l3 3m-1.5-1.5L15 9m-1-4 5 5M14 5 5.5 13.5 4 20l6.5-1.5L19 10M8 13l1.5 1.5M11 10l1.5 1.5',
  humidity: 'M7 15.5a5 5 0 0 0 10 0c0-3-5-9-5-9s-5 6-5 9Zm2.5.5a2.5 2.5 0 0 0 2.5 2.5',
  camera: 'M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm8 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
  download: 'M12 4v11m-5-5 5 5 5-5M5 20h14',
  upload: 'M12 16V5m-5 5 5-5 5 5M5 20h14',
  share: 'M16 6l-4-3-4 3m4-3v12M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1',
  whatsapp:
    'M4 20l1.3-4A8 8 0 1 1 8 18.8L4 20Zm5-11.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8c-1-.5-2.3-1.8-2.8-2.8l.8-1-1-2L9 8.5Z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  chart: 'M4 20V4m0 16h16M8 16l3.5-4 3 2.5L20 8',
  trash: 'M5 7h14M10 7V4h4v3m-7 0 1 13h8l1-13',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4.5 4.5',
  edit: 'M4 20h4L19 9l-4-4L4 16v4Zm10-14 4 4',
  wind: 'M3 9h12a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h7',
  fire: 'M12 21c3.9 0 7-2.7 7-6.5 0-4-3.5-6-4.5-10-2 1.5-3 3.5-3 5.5-1-1-1.5-2-1.5-3C7.5 9 5 11.5 5 14.5 5 18.3 8.1 21 12 21Z',
} as const

export type IconName = keyof typeof paths

export function Icon({ name, size = 22, className = '' }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}
