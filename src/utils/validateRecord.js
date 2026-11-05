// Revisión de un registro antes de guardarlo. Solo avisa: la persona decide si
// guarda igual, porque un libro antiguo puede tener datos fuera de lo común.
import { LANGUAGES } from '../constants/docTypes';
import { isbnDigits } from './catalog';

const validIsbn10 = (d) => /^\d{9}[\dX]$/.test(d)
  && [...d].reduce((a, c, i) => a + (10 - i) * (c === 'X' ? 10 : Number(c)), 0) % 11 === 0;
const validIsbn13 = (d) => /^\d{13}$/.test(d)
  && [...d].reduce((a, c, i) => a + (i % 2 ? 3 : 1) * Number(c), 0) % 10 === 0;
const validIssn = (d) => /^\d{7}[\dX]$/.test(d)
  && [...d].reduce((a, c, i) => a + (8 - i) * (c === 'X' ? 10 : Number(c)), 0) % 11 === 0;

export function checkIsbn(value, docType) {
  const d = isbnDigits(value);
  return validIsbn10(d) || validIsbn13(d) || (docType === 'revista' && validIssn(d));
}

/** Devuelve [{ key, code, value? }]; los textos están en i18n/library.js. */
export function validateRecord(fields, docType) {
  const issues = [];
  const get = (k) => String(fields[k] ?? '').trim();
  const maxYear = new Date().getFullYear() + 1;

  const year = get('anioEdicion');
  if (year) {
    const plain = year.replace(/[[\]c?]/g, '');
    if (!/^\d{4}$/.test(plain)) issues.push({ key: 'anioEdicion', code: 'yearFormat', value: year });
    else if (Number(plain) < 1400 || Number(plain) > maxYear) issues.push({ key: 'anioEdicion', code: 'yearRange', value: year });
  }

  const isbn = get('isbn');
  if (isbn && !checkIsbn(isbn, docType)) issues.push({ key: 'isbn', code: 'isbn', value: isbn });

  const copies = get('ejemplares');
  if (copies && !/^\d+$/.test(copies)) issues.push({ key: 'ejemplares', code: 'copies', value: copies });

  const language = get('idioma');
  if (language && !LANGUAGES.includes(language)) issues.push({ key: 'idioma', code: 'language', value: language });

  // El año del pie de imprenta debe coincidir con el de AÑO EDICIÓN.
  const imprintYear = (get('lugarEditorial').match(/\b(1[5-9]\d\d|20\d\d)\b/) || [])[1];
  if (imprintYear && /^\d{4}$/.test(year) && imprintYear !== year) {
    issues.push({ key: 'lugarEditorial', code: 'yearMismatch', value: `${year} / ${imprintYear}` });
  }

  return issues;
}
