// Catálogo de la Biblioteca Municipal Santo Domingo (solo lectura), generado
// por scripts/build-catalog.mjs. De aquí salen los avisos de duplicados, el
// autocompletado y las sugerencias de clasificación. Todo se calcula en el
// navegador.

export const normalize = (s) => String(s ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();

const TITLE_ARTICLES = /^(EL|LA|LOS|LAS|UN|UNA|UNOS|UNAS|THE|AN|A)\s+/;

export const isbnDigits = (s) => String(s ?? '').replace(/[^0-9Xx]/g, '').toUpperCase();

/** Pasa un ISBN-10 a ISBN-13 para comparar las dos formas del mismo libro. */
function isbnKey(s) {
  const d = isbnDigits(s);
  if (d.length === 13) return d;
  if (d.length !== 10) return d.length >= 8 ? d : '';
  const body = `978${d.slice(0, 9)}`;
  const sum = [...body].reduce((a, c, i) => a + (i % 2 ? 3 : 1) * Number(c), 0);
  return `${body}${(10 - (sum % 10)) % 10}`;
}

const mainTitle = (s) => normalize(String(s ?? '').split(/[:/]/)[0]);

/** Separa "CR863.4 S718d" en número ("CR863.4"), Cutter ("S718") y letra ("d"). */
export function parseClassification(value) {
  const s = String(value ?? '').replace(/\s+/g, ' ').trim();
  const m = s.match(/^(.*?\d)\s*([A-Z][a-z]?\d{2,4})([a-z]?)$/);
  if (!m) return { number: s, cutter: '', letter: '' };
  return { number: m[1].replace(/^C\.\s?R\.?\s*|^CR\.?\s+/, 'CR').trim(), cutter: m[2], letter: m[3] };
}

/** Letra final de la clasificación: inicial del título sin artículo. */
export function titleLetter(title) {
  const t = normalize(title).replace(TITLE_ARTICLES, '');
  return t ? t[0].toLowerCase() : '';
}

const authorKey = (s) => normalize(String(s ?? '').replace(/\(?\b\d{4}\b.*$/, ''));
const surnameKey = (s) => normalize(String(s ?? '').split(',')[0]);

export const splitSubjects = (s) => String(s ?? '').split(/\s*-+\s*|;/).map((p) => p.trim()).filter(Boolean);

/** Separa "San José, C.R. : EUNED, 1998" en lugar, editorial y año. */
export function splitImprint(value) {
  const s = String(value ?? '').trim();
  const i = s.indexOf(':');
  if (i === -1) return { place: '', publisher: '', year: '' };
  const year = (s.match(/\b(1[5-9]\d\d|20\d\d)\b[.\s]*$/) || [])[1] || '';
  const publisher = s.slice(i + 1).replace(/,?\s*c?\[?(1[5-9]\d\d|20\d\d)\]?[.\s]*$/, '').trim();
  return { place: s.slice(0, i).trim(), publisher, year };
}

/** Une los tres datos con el formato de la base: "Lugar : Editorial, año". */
export function joinImprint({ place, publisher, year }) {
  const head = [place, publisher].map((p) => (p || '').trim()).filter(Boolean).join(' : ');
  return [head, (year || '').trim()].filter(Boolean).join(', ');
}

/** Tally con la forma más frecuente de cada término: { key → { label, count } }. */
function addVariant(vocab, key, label) {
  if (!key) return;
  let entry = vocab.get(key);
  if (!entry) { entry = { key, variants: new Map(), count: 0 }; vocab.set(key, entry); }
  entry.count += 1;
  entry.variants.set(label, (entry.variants.get(label) || 0) + 1);
}

function finishVocabulary(vocab) {
  return [...vocab.values()]
    .map((e) => ({
      key: e.key,
      count: e.count,
      label: [...e.variants.entries()].sort((a, b) => b[1] - a[1])[0][0],
    }))
    .sort((a, b) => b.count - a.count);
}

export function buildIndex(records) {
  const byIsbn = new Map();
  const byTitle = new Map();
  const subjects = new Map();
  const authors = new Map();
  const places = new Map();
  const publishers = new Map();
  const classBySubject = new Map();
  const cutterByAuthor = new Map();
  const cutterBySurname = new Map();

  const push = (map, key, value) => {
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(value);
  };
  const tally = (map, key, value) => {
    if (!key || !value) return;
    if (!map.has(key)) map.set(key, new Map());
    const inner = map.get(key);
    inner.set(value, (inner.get(value) || 0) + 1);
  };

  records.forEach((rec) => {
    const search = normalize([rec.titulo, rec.autor, rec.materia, rec.clasificacion, rec.isbn, rec.numeroRevista].join(' '));
    rec._search = search;
    rec._title = mainTitle(rec.titulo);
    rec._author = authorKey(rec.autor);

    push(byIsbn, isbnKey(rec.isbn), rec);
    push(byTitle, rec._title, rec);

    const { number, cutter } = parseClassification(rec.clasificacion);
    splitSubjects(rec.materia).forEach((term) => {
      const key = normalize(term);
      addVariant(subjects, key, term);
      tally(classBySubject, key, number);
    });
    // Autores: se dejan fuera las celdas que traen un pie de imprenta.
    if (rec.autor && !/[:/]/.test(rec.autor)) addVariant(authors, rec._author, rec.autor);
    if (cutter) {
      tally(cutterByAuthor, rec._author, cutter);
      tally(cutterBySurname, surnameKey(rec.autor), cutter);
    }
    const imprint = splitImprint(rec.lugarEditorial);
    if (imprint.place) addVariant(places, normalize(imprint.place), imprint.place);
    if (imprint.publisher) addVariant(publishers, normalize(imprint.publisher), imprint.publisher);
  });

  return {
    records,
    byIsbn,
    byTitle,
    classBySubject,
    cutterByAuthor,
    cutterBySurname,
    subjects: finishVocabulary(subjects),
    authors: finishVocabulary(authors),
    places: finishVocabulary(places),
    publishers: finishVocabulary(publishers),
  };
}

export async function loadCatalog() {
  const res = await fetch(`${import.meta.env.BASE_URL}data/catalogo.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { records } = await res.json();
  return buildIndex(records);
}

/**
 * Sugerencias para una casilla: primero las que empiezan igual, luego las que
 * contienen el texto, de la más usada a la menos usada.
 */
export function suggest(vocabulary, query, limit = 8) {
  const q = normalize(query);
  if (q.length < 2) return [];
  const starts = [];
  const contains = [];
  for (const item of vocabulary) {
    if (item.key.startsWith(q)) starts.push(item);
    else if (contains.length < limit && item.key.includes(q)) contains.push(item);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

/**
 * Posibles duplicados del registro en el catálogo y en la tabla actual.
 * `reason`: 'isbn' y 'tituloAutor' son fuertes; 'titulo' solo avisa.
 * En revistas, cada fascículo es un registro: un título igual con otro número
 * no es duplicado.
 */
export function findDuplicates(index, fields, tableRecords = [], docType = 'libro') {
  const title = mainTitle(fields.titulo);
  const author = authorKey(fields.autor);
  const key = isbnKey(fields.isbn);
  const issue = normalize(fields.numeroRevista);
  const isJournal = docType === 'revista';
  const seen = new Set();
  const out = [];

  const add = (rec, reason, source) => {
    if (seen.has(rec)) return;
    seen.add(rec);
    out.push({ rec, reason, source });
  };
  const classify = (rec) => {
    if (isJournal) {
      const sameTitle = mainTitle(rec.titulo) === title;
      if (sameTitle && issue && normalize(rec.numeroRevista) === issue) return 'fasciculo';
      if (sameTitle) return 'titulo';
      return null;
    }
    if (key && isbnKey(rec.isbn) === key) return 'isbn';
    if (title.length >= 4 && mainTitle(rec.titulo) === title) {
      return author && authorKey(rec.autor) === author ? 'tituloAutor' : 'titulo';
    }
    return null;
  };

  tableRecords.forEach((rec) => {
    const reason = classify(rec);
    if (reason) add(rec, reason, 'tabla');
  });
  if (index) {
    if (key) (index.byIsbn.get(key) || []).forEach((rec) => { const r = classify(rec); if (r) add(rec, r, 'catalogo'); });
    if (title.length >= 4) (index.byTitle.get(title) || []).forEach((rec) => { const r = classify(rec); if (r) add(rec, r, 'catalogo'); });
  }

  const rank = { fasciculo: 0, isbn: 0, tituloAutor: 1, titulo: 2 };
  return out.sort((a, b) => rank[a.reason] - rank[b.reason]);
}

export const isStrongDuplicate = (d) => d.reason !== 'titulo';

/**
 * Clasificación sugerida: el número más usado en registros con las mismas
 * materias, más el Cutter que la base ya usa para ese autor y la letra del
 * título. El Cutter nunca se inventa: si el autor no está, queda sin él.
 */
export function suggestClassification(index, fields) {
  if (!index) return { options: [], cutter: '', cutterSource: null };
  const tally = new Map();
  splitSubjects(fields.materia).forEach((term) => {
    const inner = index.classBySubject.get(normalize(term));
    if (inner) inner.forEach((count, number) => tally.set(number, (tally.get(number) || 0) + count));
  });

  const top = (map) => (map ? [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '' : '');
  const exact = top(index.cutterByAuthor.get(authorKey(fields.autor)));
  const bySurname = exact ? '' : top(index.cutterBySurname.get(surnameKey(fields.autor)));
  const cutter = exact || bySurname;
  const letter = titleLetter(fields.titulo);

  const options = [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([number, count]) => ({
      number,
      count,
      value: cutter ? `${number} ${cutter}${letter}` : number,
    }));

  return { options, cutter, cutterSource: exact ? 'autor' : (bySurname ? 'apellido' : null) };
}

/** Búsqueda de la vista Catálogo: todas las palabras deben aparecer. */
export function searchCatalog(index, query, limit = 50) {
  const words = normalize(query).split(' ').filter(Boolean);
  if (!index || words.length === 0) return { results: [], total: 0 };
  const hits = index.records.filter((rec) => words.every((w) => rec._search.includes(w)));
  return { results: hits.slice(0, limit), total: hits.length };
}
