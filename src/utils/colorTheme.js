// Personalización de colores de EBO.
//
// La persona elige un color por zona (fondo, riel, acento, tarjeta de
// imágenes, texto reconocido, campos MARC, tabla…). A partir de esos colores
// se calculan todas las variables CSS del tema, incluidos los colores de
// texto (siempre legibles) y una versión para el modo oscuro.
// Se guarda solo en este navegador (localStorage), como el idioma.

export const THEME_KEY = 'ebo-bmsd:theme';

// ── Zonas personalizables ──
// `def`: color por defecto en modo claro (el diseño original).
// `dark`: equivalente del diseño original en modo oscuro.
export const ZONES = [
  { id: 'bg', kind: 'surface', def: '#f7f2e7', dark: '#1b1917' },
  { id: 'rail', kind: 'rail', def: '#221c18', dark: '#141210' },
  { id: 'head', kind: 'surface', def: '#f7f2e7', dark: '#1b1917', follows: 'bg' },
  { id: 'capture', kind: 'surface', def: '#f2ebdc', dark: '#2c2926' },
  { id: 'ocr', kind: 'surface', def: '#fffdf8', dark: '#242120' },
  { id: 'fields', kind: 'surface', def: '#f7f2e7', dark: '#1b1917', follows: 'bg' },
  { id: 'tblHead', kind: 'surface', def: '#f2ebdc', dark: '#2c2926' },
  { id: 'tblCell', kind: 'surface', def: '#fffdf8', dark: '#242120' },
  { id: 'acc', kind: 'accent', def: '#7a1f2b', dark: '#e39aa3' },
  { id: 'green', kind: 'accent', def: '#2f6f4f', dark: '#8fd3ae' },
  { id: 'danger', kind: 'accent', def: '#a8322f', dark: '#ef9a8f' },
  { id: 'brass', kind: 'accent', def: '#8a6620', dark: '#e2b34f' },
];
export const ZONE_IDS = ZONES.map((z) => z.id);
const ZONE = Object.fromEntries(ZONES.map((z) => [z.id, z]));

// ── Muestras sugeridas ──
export const SWATCHES = {
  soft: [
    ['#ffffff', 'Blanco'], ['#f7f2e7', 'Crema'], ['#f5efe6', 'Arena'], ['#fbf1ea', 'Durazno'],
    ['#fdf0f4', 'Rosa pálido'], ['#f6e3ea', 'Rosa cuarzo'], ['#f4f1fa', 'Lavanda'], ['#eef3fb', 'Niebla'],
    ['#e9f4fa', 'Celeste'], ['#eaf5f1', 'Menta'], ['#f3f5e9', 'Pistacho'], ['#f1f1ef', 'Perla'],
  ],
  strong: [
    ['#7a1f2b', 'Vino'], ['#b0265a', 'Frambuesa'], ['#d63f7e', 'Rosa'], ['#e0789e', 'Rosa chicle'],
    ['#5b3a8c', 'Ciruela'], ['#7c5cc4', 'Violeta'], ['#1f4f8f', 'Azul marino'], ['#2f7fc1', 'Azul'],
    ['#0e6f8f', 'Océano'], ['#0f5f5c', 'Petróleo'], ['#2f6f4f', 'Verde'], ['#6b7a2a', 'Oliva'],
    ['#b8860b', 'Mostaza'], ['#d9731c', 'Naranja'], ['#a3401a', 'Terracota'], ['#8a6620', 'Dorado'],
    ['#4a2f23', 'Chocolate'], ['#2d3a4a', 'Pizarra'],
  ],
  dark: [
    ['#221c18', 'Café noche'], ['#3a1626', 'Rosa noche'], ['#231a30', 'Ciruela noche'], ['#152238', 'Azul noche'],
    ['#10302d', 'Petróleo noche'], ['#1f2a1c', 'Bosque noche'], ['#2b1a12', 'Terracota noche'], ['#1c1d1f', 'Carbón'],
  ],
};

// ── Temas rápidos (puntos de partida) ──
export const PRESETS = [
  { id: 'original', colors: {} },
  { id: 'rosa', colors: { bg: '#fdf3f6', rail: '#3a1626', acc: '#b0265a', capture: '#f7e4eb', ocr: '#fffafc', tblHead: '#f7e4eb', tblCell: '#fffafc' } },
  { id: 'azul', colors: { bg: '#f3f5f9', rail: '#152238', acc: '#1f4f8f', capture: '#e7ecf4', ocr: '#fdfeff', tblHead: '#e7ecf4', tblCell: '#fdfeff' } },
  { id: 'oceano', colors: { bg: '#f0f7fa', rail: '#0f2d38', acc: '#0e6f8f', capture: '#dfeef4', ocr: '#fbfeff', tblHead: '#dfeef4', tblCell: '#fbfeff' } },
  { id: 'petroleo', colors: { bg: '#f1f6f5', rail: '#10302d', acc: '#0f5f5c', capture: '#e2eeec', ocr: '#fbfdfd', tblHead: '#e2eeec', tblCell: '#fbfdfd' } },
  { id: 'ciruela', colors: { bg: '#f6f3f8', rail: '#231a30', acc: '#5b3a8c', capture: '#ece6f1', ocr: '#fefcff', tblHead: '#ece6f1', tblCell: '#fefcff' } },
  { id: 'terracota', colors: { bg: '#f8f2ec', rail: '#2b1a12', acc: '#a3401a', capture: '#f1e6dc', ocr: '#fffcf9', tblHead: '#f1e6dc', tblCell: '#fffcf9', brass: '#7d6420' } },
  { id: 'grafito', colors: { bg: '#f4f4f3', rail: '#1c1d1f', acc: '#2d3a4a', capture: '#eaeae8', ocr: '#ffffff', tblHead: '#eaeae8', tblCell: '#ffffff' } },
];

// ── Utilidades de color (sRGB ↔ OKLab/OKLCH, contraste WCAG) ──
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export function normalizeHex(h) {
  if (typeof h !== 'string') return null;
  let s = h.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(s)) s = s.split('').map((c) => c + c).join('');
  return /^[0-9a-f]{6}$/i.test(s) ? `#${s.toLowerCase()}` : null;
}
function hexToRgb(h) {
  const s = normalizeHex(h).slice(1);
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
}
function rgbToHex(rgb) {
  return `#${rgb.map((v) => Math.round(clamp(v) * 255).toString(16).padStart(2, '0')).join('')}`;
}
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function hexToOklab(h) {
  const [r, g, b] = hexToRgb(h).map(toLin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
function oklabToHex([L, A, B]) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => toGam(clamp(v)));
  return rgbToHex(rgb);
}
function toLch(h) {
  const [L, a, b] = hexToOklab(h);
  return [L, Math.hypot(a, b), Math.atan2(b, a)];
}
function fromLch(L, C, H) {
  // reduce el croma hasta que el color entre en sRGB
  let c = C;
  for (let i = 0; i < 24; i += 1) {
    const hex = oklabToHex([L, c * Math.cos(H), c * Math.sin(H)]);
    const back = hexToOklab(hex);
    if (Math.abs(back[0] - L) < 0.02) return hex;
    c *= 0.85;
  }
  return oklabToHex([L, 0, 0]);
}

export function luminance(h) {
  const [r, g, b] = hexToRgb(h).map(toLin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
export function mix(a, b, t) {
  const A = hexToOklab(a); const B = hexToOklab(b);
  return oklabToHex(A.map((v, i) => v + (B[i] - v) * t));
}
export function withAlpha(h, a) {
  const [r, g, b] = hexToRgb(h).map((v) => Math.round(v * 255));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
export function isDark(h) {
  return luminance(h) < 0.18;
}

/** Texto legible sobre `bg`: casi negro o casi blanco, con un leve tinte del fondo. */
export function inkFor(bg) {
  const [, C, H] = toLch(bg);
  const c = Math.min(C, 0.03);
  const darkInk = fromLch(0.24, c, H);
  const lightInk = fromLch(0.95, Math.min(c, 0.015), H);
  return contrast(darkInk, bg) >= contrast(lightInk, bg) ? darkInk : lightInk;
}
/** Texto secundario: mezcla tinta/fondo, sin bajar de 4.5:1. */
function softFor(bg, ink) {
  for (let t = 0.42; t >= 0; t -= 0.04) {
    const s = mix(ink, bg, t);
    if (contrast(s, bg) >= 4.6) return s;
  }
  return ink;
}
function surfaceSet(bg) {
  const ink = inkFor(bg);
  return { bg, ink, soft: softFor(bg, ink), rule: mix(bg, ink, isDark(bg) ? 0.16 : 0.12) };
}

/** Versión oscura sugerida de un color claro, según su papel. */
function darken(hex, role) {
  const [, C, H] = toLch(hex);
  if (role === 'rail') return fromLch(0.15, Math.min(C, 0.03), H);
  if (role === 'accent') return fromLch(0.8, Math.min(Math.max(C, 0.06), 0.13), H);
  const L = { bg: 0.2, head: 0.2, fields: 0.2, capture: 0.26, ocr: 0.235, tblHead: 0.26, tblCell: 0.235 }[role] ?? 0.22;
  return fromLch(L, Math.min(C, 0.025), H);
}

// ── Estado guardado ──
// { v: 1, colors: { zona: '#hex' }, dark: { zona: '#hex' } }
//   colors: elecciones en modo claro; dark: ajustes manuales en modo oscuro.
export function emptyTheme() {
  return { v: 1, colors: {}, dark: {} };
}
export function loadTheme() {
  try {
    const raw = JSON.parse(localStorage.getItem(THEME_KEY) || 'null');
    if (!raw || typeof raw !== 'object') return emptyTheme();
    const clean = (o) => Object.fromEntries(Object.entries(o || {})
      .filter(([k, v]) => ZONE_IDS.includes(k) && normalizeHex(v)).map(([k, v]) => [k, normalizeHex(v)]));
    return { v: 1, colors: clean(raw.colors), dark: clean(raw.dark) };
  } catch {
    return emptyTheme();
  }
}
export function saveTheme(theme) {
  try {
    if (isDefaultTheme(theme)) localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, JSON.stringify(theme));
  } catch { /* almacenamiento no disponible */ }
}
export function isDefaultTheme(theme) {
  return !theme || (Object.keys(theme.colors || {}).length === 0 && Object.keys(theme.dark || {}).length === 0);
}

/** Color final de cada zona para el modo pedido. */
export function resolveColors(theme, dark) {
  const light = {};
  ZONES.forEach((z) => {
    light[z.id] = theme.colors[z.id] || (z.follows ? (theme.colors[z.follows] || z.def) : z.def);
  });
  if (!dark) return light;
  const out = {};
  ZONES.forEach((z) => {
    if (theme.dark[z.id]) { out[z.id] = theme.dark[z.id]; return; }
    const chosen = theme.colors[z.id] || (z.follows && theme.colors[z.follows]);
    if (!chosen) {
      out[z.id] = z.follows && out[z.follows] ? out[z.follows] : z.dark;
      return;
    }
    out[z.id] = darken(chosen, z.kind === 'rail' ? 'rail' : z.kind === 'accent' ? 'accent' : z.id);
  });
  return out;
}

/** Variables CSS completas a partir de los colores de cada zona. */
export function buildTokens(c, dark) {
  const page = surfaceSet(c.bg);
  const sf = dark ? mix(c.bg, page.ink, 0.06) : mix(c.bg, '#ffffff', 0.62);
  const sf2 = dark ? mix(c.bg, page.ink, 0.1) : mix(c.bg, page.ink, 0.045);
  const t = {
    '--bg': c.bg,
    '--sf': sf,
    '--sf2': sf2,
    '--ink': page.ink,
    '--soft': page.soft,
    '--rule': page.rule,
    '--rail': c.rail,
    '--rail-ink': inkFor(c.rail),
    '--acc': c.acc,
    '--acc-ink': inkFor(c.acc),
    '--sel': withAlpha(c.acc, dark ? 0.2 : 0.13),
    '--green': c.green,
    '--green-ink': inkFor(c.green),
    '--danger': c.danger,
    '--danger-ink': inkFor(c.danger),
    '--brass': c.brass,
    '--overlay': dark ? 'rgba(0, 0, 0, 0.55)' : withAlpha(mix(c.rail, '#000000', 0.3), 0.45),
  };
  t['--g-ink'] = t['--ink']; t['--g-soft'] = t['--soft']; t['--g-rule'] = t['--rule'];
  const zone = (prefix, bg) => {
    const s = surfaceSet(bg);
    t[`--z-${prefix}-bg`] = s.bg; t[`--z-${prefix}-ink`] = s.ink;
    t[`--z-${prefix}-soft`] = s.soft; t[`--z-${prefix}-rule`] = s.rule;
  };
  zone('head', c.head); zone('cap', c.capture); zone('ocr', c.ocr); zone('fields', c.fields);
  zone('tblh', c.tblHead); zone('tblc', c.tblCell);
  return t;
}

export const TOKEN_NAMES = Object.keys(buildTokens(resolveColors(emptyTheme(), false), false));

/** Aplica (o quita) el tema en <html>. Sin personalización se usa el CSS original. */
export function applyTheme(theme, dark) {
  const root = document.documentElement;
  if (isDefaultTheme(theme)) {
    TOKEN_NAMES.forEach((n) => root.style.removeProperty(n));
    return;
  }
  const tokens = buildTokens(resolveColors(theme, dark), dark);
  Object.entries(tokens).forEach(([k, v]) => root.style.setProperty(k, v));
}

/** Avisos de legibilidad y de colores con significado. */
export function themeWarnings(theme, dark) {
  const c = resolveColors(theme, dark);
  const w = [];
  if (contrast(c.acc, c.bg) < 3) w.push({ zone: 'acc', code: 'accLow' });
  if (contrast(c.acc, c.ocr) < 3) w.push({ zone: 'acc', code: 'accLowOcr' });
  if (contrast(c.brass, c.tblHead) < 3) w.push({ zone: 'brass', code: 'brassLow' });
  if (contrast(c.brass, c.fields) < 3) w.push({ zone: 'brass', code: 'brassLowFields' });
  const hue = (h) => (toLch(h)[2] * 180) / Math.PI;
  const dh = Math.abs(((hue(c.green) - hue(c.danger) + 540) % 360) - 180);
  if (dh < 35) w.push({ zone: 'green', code: 'greenDanger' });
  const gH = hue(c.green);
  if (gH < 100 || gH > 200) w.push({ zone: 'green', code: 'greenMeaning' });
  const rH = hue(c.danger);
  if (rH > 70 && rH < 330) w.push({ zone: 'danger', code: 'dangerMeaning' });
  if (Math.abs(((hue(c.acc) - hue(c.danger) + 540) % 360) - 180) < 12 && contrast(c.acc, c.danger) < 1.4) {
    w.push({ zone: 'danger', code: 'dangerLikeAcc' });
  }
  return w;
}
