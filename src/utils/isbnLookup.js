// Busca los datos de un ISBN en catálogos públicos. Es lo único de la app que
// envía algo a un tercero, solo el ISBN y solo cuando la persona lo pide.
import { isbnDigits } from './catalog';

const LANGUAGE_NAMES = { es: 'Español', en: 'Inglés', fr: 'Francés', spa: 'Español', eng: 'Inglés', fre: 'Francés' };
const yearOf = (s) => (String(s ?? '').match(/\b(1[5-9]\d\d|20\d\d)\b/) || [])[1] || '';
const imprint = (place, publisher) => [place, publisher].filter(Boolean).join(' : ');

async function fromOpenLibrary(isbn) {
  const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
  if (!res.ok) return null;
  const book = (await res.json())[`ISBN:${isbn}`];
  if (!book) return null;
  return {
    titulo: [book.title, book.subtitle].filter(Boolean).join(': '),
    autor: (book.authors || []).map((a) => a.name).join('; '),
    anioEdicion: yearOf(book.publish_date),
    lugarEditorial: imprint(book.publish_places?.[0]?.name, book.publishers?.[0]?.name),
    descFisica: book.number_of_pages ? `${book.number_of_pages} páginas` : '',
  };
}

async function fromGoogleBooks(isbn) {
  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`);
  if (!res.ok) return null;
  const info = (await res.json()).items?.[0]?.volumeInfo;
  if (!info) return null;
  return {
    titulo: [info.title, info.subtitle].filter(Boolean).join(': '),
    autor: (info.authors || []).join('; '),
    anioEdicion: yearOf(info.publishedDate),
    lugarEditorial: info.publisher || '',
    descFisica: info.pageCount ? `${info.pageCount} páginas` : '',
    idioma: LANGUAGE_NAMES[info.language] || '',
  };
}

/** Devuelve los campos encontrados o null. Lanza si no hay conexión. */
export async function lookupIsbn(value) {
  const isbn = isbnDigits(value);
  const results = await Promise.allSettled([fromOpenLibrary(isbn), fromGoogleBooks(isbn)]);
  if (results.every((r) => r.status === 'rejected')) throw new Error('offline');
  const found = results.filter((r) => r.status === 'fulfilled' && r.value).map((r) => r.value);
  if (found.length === 0) return null;
  // Se combinan: lo que falte en un catálogo se toma del otro.
  return found.reduce((acc, book) => {
    Object.entries(book).forEach(([k, v]) => { if (v && !acc[k]) acc[k] = v; });
    return acc;
  }, {});
}
