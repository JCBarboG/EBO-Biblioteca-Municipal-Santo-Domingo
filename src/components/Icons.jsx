// Íconos SVG de línea (sin emojis). Heredan el color del texto.
const PATHS = {
  catalog: 'M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M8 12h8',
  history: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 8v4l3 2',
  guide: 'M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2zM12 6v14',
  support: 'M4 5h16v11H9l-5 4z',
  config: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
  plus: 'M12 5v14M5 12h14',
  info: 'M12 8h.01M11 12h1v5h1M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  star: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.9 6.7 19.4l1.2-6L3.4 9.3l6-.7z',
  lines: 'M4 6h16M4 12h10M4 18h7',
  save: 'M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  chevronDown: 'M6 9l6 6 6-6',
  chevronLeft: 'M15 6l-6 6 6 6',
  chevronRight: 'M9 6l6 6-6 6',
  rotate: 'M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5',
  trash: 'M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  colLeft: 'M14 4h6v16h-6zM4 12h7M7.5 8.5v7',
  colRight: 'M4 4h6v16H4zM13 12h7M16.5 8.5v7',
  rowAbove: 'M4 14h16v6H4zM12 4v7M8.5 7.5h7',
  rowBelow: 'M4 4h16v6H4zM12 13v7M8.5 16.5h7',
  pencil: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  upload: 'M12 16V5M7 10l5-5 5 5M5 20h14',
  image: 'M4 5h16v14H4zM8.5 10a1.5 1.5 0 1 0 0-.01M20 16l-5-5-9 8',
  alert: 'M12 4l9 16H3zM12 10v4M12 17h.01',
  check: 'M5 12l5 5 9-10',
  reset: 'M4 12a8 8 0 1 0 2.3-5.6M4 4v5h5',
  palette: 'M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.9-.7-1.3-.7-2.2 0-.9.8-1.7 1.7-1.7H17a4 4 0 0 0 4-4c0-4.7-4-8.5-9-8.5zM7.5 11.5h.01M9.5 7.5h.01M14.5 7.5h.01M17 11h.01',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  pin: 'M9 4h6l-1 6 3 4H7l3-4zM12 14v6',
  barcode: 'M4 5v14M8 5v14M11 5v14M15 5v14M18 5v14M20 5v14',
  library: 'M5 4h3v16H5zM10 4h3v16h-3zM15 5l3-1 3 15-3 1z',
  pipette: 'M14.5 4.5l5 5M17 2.5a2.1 2.1 0 0 1 3 3l-2 2-3-3zM15 7.5l-9 9-1.5 4 4-1.5 9-9',
};

export default function Icon({ name, size = 18, strokeWidth = 1.7, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

export function DotsIcon({ size = 18, vertical = false }) {
  const pts = vertical ? [[12, 5], [12, 12], [12, 19]] : [[5, 12], [12, 12], [19, 12]];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      {pts.map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.8" />)}
    </svg>
  );
}
