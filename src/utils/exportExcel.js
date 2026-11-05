import * as XLSX from 'xlsx';
import { CATEGORIES_BY_TYPE } from '../constants/docTypes';
import { applyPunctuation } from '../config/punctuationPresets';

const SHEET_NAMES = {
  libro: 'Libros',
  revista: 'Revistas',
  tesis: 'Tesis',
  articuloRevista: 'ArticulosRevista',
  articulosLibro: 'ArticulosLibro',
};

// La puntuación sale del preset del tipo de documento
// (config/punctuationPresets.js) más los overrides manuales por columna
// (`overrides`: { [fieldKey]: symbol }). Se usa la MISMA función que la
// vista previa del paso 03, así que ambas siempre coinciden.
// `fileSuffix` (opcional) se agrega al nombre del archivo, p. ej. la fecha
// de un paquete del historial.
// `columns` (opcional) es la lista final de columnas en el orden visible
// (utils/columns.js → getColumns), incluidas las propias. Sin ella se usan
// las columnas MARC del tipo, como siempre.
export function exportBooksToExcel(books, docType = 'libro', lang = 'es', overrides = {}, fileSuffix = '', columns = null) {
  const cats = Array.isArray(columns) && columns.length
    ? columns
    : CATEGORIES_BY_TYPE[docType] || CATEGORIES_BY_TYPE.libro;
  const headers = cats.map((c) => {
    const label = c.colLabel[lang] || c.colLabel.es;
    return c.marcTag ? `${label} (${c.marcTag})` : label;
  });

  // Como la base de la biblioteca: sin espacios de más y en orden por título.
  const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true, ignorePunctuation: true });
  const sorted = [...books].sort((a, b) => {
    const [ta, tb] = [String(a.titulo || '').trim(), String(b.titulo || '').trim()];
    if (!ta || !tb) return ta ? -1 : (tb ? 1 : 0);
    return collator.compare(ta, tb);
  });
  const rows = sorted.map((book) => cats.map((c) => applyPunctuation(book, c, docType, overrides).replace(/\s+/g, ' ').trim()));

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet['!cols'] = headers.map(() => ({ wch: 24 }));

  const workbook = XLSX.utils.book_new();
  const sheetName = SHEET_NAMES[docType] || 'Registros';
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const suffix = fileSuffix ? `-${fileSuffix}` : '';
  XLSX.writeFile(workbook, `EBO-BMSD-${sheetName.toLowerCase()}${suffix}.xlsx`);
}
