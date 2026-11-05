// Genera el catálogo de la Biblioteca Municipal Santo Domingo a partir de su
// base en Excel. Se corre a mano cuando la biblioteca entrega una base nueva:
//
//   node scripts/build-catalog.mjs "ruta/a/la/base.xlsx"
//
// Salida:
//   public/data/catalogo.json       registros que usa la app (solo lectura)
//   src/constants/catalogMeta.js    último id, para seguir la numeración
//
// La limpieza es mínima y solo acomoda: quita espacios de más, recupera los
// ISBN completos que Excel muestra como 9.78997E+12, unifica el idioma y pasa
// a su columna lo que estaba en otra. No corrige títulos, autores ni materias.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = process.argv[2];
if (!source) {
  console.error('Uso: node scripts/build-catalog.mjs "ruta/a/la/base.xlsx"');
  process.exit(1);
}

const wb = XLSX.read(fs.readFileSync(source));
const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
// Celdas con solo un punto, guion o signo de pregunta equivalen a vacío.
const value = (v) => { const s = clean(v); return /^[.\-?]+$/.test(s) ? '' : s; };

const LANGUAGES = [
  [/^espa[nñ]ol\s*[-e]\s*ingl[eé]s$/i, 'Español-Inglés'],
  [/^ingl[eé]s traducido/i, 'Inglés'],
  [/^espa[nñ]ol;?$/i, 'Español'],
  [/^ingl[eé]s;?$/i, 'Inglés'],
  [/^franc[eé]s;?$/i, 'Francés'],
];
const language = (v) => {
  const s = value(v);
  const hit = LANGUAGES.find(([re]) => re.test(s));
  return hit ? hit[1] : '';
};

let lastId = 0;
const stats = { idiomaDescartado: 0, ejemplaresANota: 0, clasificacionEnEjemplares: 0, edicionRecuperada: 0, isbnRecuperado: 0 };

/** Lee una hoja y devuelve filas de texto, más los ISBN como número completo. */
function readSheet(name, headerRows, isbnCol) {
  const ws = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false, blankrows: true });
  // También cuentan los id ya numerados en filas sin datos: no se reutilizan.
  rows.slice(headerRows).forEach((row) => { lastId = Math.max(lastId, parseInt(row[0], 10) || 0); });
  return rows.slice(headerRows).map((row, i) => {
    const cell = ws[XLSX.utils.encode_cell({ r: i + headerRows, c: isbnCol })];
    if (cell && cell.t === 'n') {
      row[isbnCol] = String(cell.v);
      stats.isbnRecuperado += 1;
    }
    return row;
  }).filter((row) => row.slice(1).some((v) => clean(v)));
}

function compact(record) {
  return Object.fromEntries(Object.entries(record).filter(([, v]) => v));
}

function bookRecord(r) {
  const rawLanguage = value(r[2]);
  const idioma = language(r[2]);
  if (rawLanguage && !idioma) stats.idiomaDescartado += 1;

  const notes = [];
  let ejemplares = value(r[10]);
  if (ejemplares && !/^\d+$/.test(ejemplares)) {
    // Texto en EJEMPLARES: las notas pasan a NOTA. Una clasificación aquí es
    // una revista pegada a la fila por error; esa revista está en su hoja.
    if (/^(R\s?\d|BPMIFA|\d{3})/i.test(ejemplares)) stats.clasificacionEnEjemplares += 1;
    else { notes.push(ejemplares); stats.ejemplaresANota += 1; }
    ejemplares = '';
  }
  const nota = value(r[11]);
  if (nota && !/^(español|isbn)$/i.test(nota)) notes.push(nota);

  const edicionRaw = value(r[13]);
  const edicion = /edici[oó]n|\bed\.?$/i.test(edicionRaw) ? edicionRaw : '';
  if (edicion) stats.edicionRecuperada += 1;

  return compact({
    _type: 'libro',
    registroId: value(r[0]),
    clasificacion: value(r[1]),
    idioma,
    anioEdicion: value(r[3]),
    titulo: value(r[4]).replace(/^t[ií]tulo\s+/i, ''),
    autor: value(r[5]).replace(/\s*\(autor\/a\)/gi, '').replace(/\.?\s*t[ií]tulo$/i, ''),
    materia: value(r[6]),
    lugarEditorial: value(r[7]),
    descFisica: value(r[8]),
    isbn: value(r[9]),
    ejemplares,
    nota: notes.join(' / '),
    edicion,
  });
}

function journalRecord(r) {
  return compact({
    _type: 'revista',
    registroId: value(r[0]),
    clasificacion: value(r[1]),
    idioma: language(r[2]),
    anioEdicion: value(r[3]),
    titulo: value(r[4]),
    autor: value(r[5]),
    materia: value(r[6]),
    lugarEditorial: value(r[7]),
    descFisica: value(r[8]),
    isbn: value(r[9]),
    ejemplares: /^\d+$/.test(value(r[10])) ? value(r[10]) : '',
    numeroRevista: value(r[11]),
    fechaRevista: value(r[12]),
    volumenes: value(r[13]),
    numeroVolumen: value(r[14]),
  });
}

const books = readSheet('Hoja1', 1, 9).map(bookRecord).filter((r) => r.titulo || r.autor || r.clasificacion);
const journals = readSheet('REVISTA', 2, 9).map(journalRecord).filter((r) => r.titulo);
const records = [...books, ...journals];

fs.mkdirSync(path.join(ROOT, 'public/data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'public/data/catalogo.json'), JSON.stringify({ records }));
fs.writeFileSync(
  path.join(ROOT, 'src/constants/catalogMeta.js'),
  `// Generado por scripts/build-catalog.mjs. No editar a mano.\nexport const CATALOG_LAST_ID = ${lastId};\nexport const CATALOG_SOURCE = ${JSON.stringify(path.basename(source))};\n`,
);

console.log({ libros: books.length, fasciculos: journals.length, lastId, ...stats });
