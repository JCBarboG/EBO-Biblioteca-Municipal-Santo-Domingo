// Historial de paquetes guardado en localStorage (solo texto, sin imágenes).
// Un paquete = todas las filas de la tabla del paso 03 en el momento de
// guardar, más los overrides manuales de puntuación de ese momento.

// Las apps de EBO comparten origen (jcbarbog.github.io) y por lo tanto
// localStorage: la clave es propia para que sus historiales, que tienen
// columnas distintas, no se mezclen.
export const HISTORY_KEY = 'ebo-bmsd:history';
export const HISTORY_LIMIT = 50;

export class HistoryQuotaError extends Error {
  constructor() {
    super('QuotaExceededError');
    this.name = 'HistoryQuotaError';
  }
}

function isQuotaError(e) {
  return e && (
    e.name === 'QuotaExceededError'
    || e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    || e.code === 22
    || e.code === 1014
  );
}

/** Fecha ISO con el desfase local, p. ej. 2026-09-23T14:32:00-06:00. */
export function toLocalISO(date = new Date()) {
  const pad = (n) => String(Math.abs(n)).padStart(2, '0');
  const off = -date.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    + `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    + `${sign}${pad(Math.trunc(off / 60))}:${pad(off % 60)}`;
}

/** 23/9/2026 · 14:32 */
export function formatPackageDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} · ${hh}:${mm}`;
}

/** Sufijo seguro para nombre de archivo: 2026-09-23-1432 */
export function packageFileStamp(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);

/** Lista de paquetes, del más reciente al más antiguo. Nunca lanza. */
export function loadHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((p) => p && Array.isArray(p.rows)).sort(byNewest) : [];
  } catch {
    return [];
  }
}

/** Guarda la lista completa. Lanza HistoryQuotaError si no hay espacio. */
export function writeHistory(list) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch (e) {
    if (isQuotaError(e)) throw new HistoryQuotaError();
    throw e;
  }
}

// `columns` (opcional): { customColumns, columnOrder } del tipo de documento
// del paquete. Los paquetes viejos no los tienen y siguen cargando igual.
export function createPackage(rows, docType, overrides, columns = {}) {
  return {
    id: crypto.randomUUID(),
    createdAt: toLocalISO(),
    docType,
    rowCount: rows.length,
    rows: rows.map((r) => ({ ...r })),
    overrides: { ...overrides },
    customColumns: (columns.customColumns || []).map((c) => ({ ...c })),
    columnOrder: Array.isArray(columns.columnOrder) ? [...columns.columnOrder] : null,
  };
}

export function oldestPackage(list) {
  return [...list].sort(byNewest).at(-1) || null;
}
