// Columnas visibles de la tabla y de los campos: las columnas MARC del tipo
// de documento (constants/docTypes.js, que no se modifica) más las columnas
// propias que la persona agrega durante la sesión. Las propias viven solo en
// el estado de App.jsx (por tipo de documento) y en los paquetes del
// historial; nunca en localStorage por separado.
import { CATEGORIES_BY_TYPE } from '../constants/docTypes';

/** Crea la definición de una columna propia: { key, label, marcTag, custom }. */
export function newCustomColumn(label, marcTag = '') {
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  return { key: `custom_${id}`, label: String(label).trim(), marcTag: String(marcTag || '').trim(), custom: true };
}

/** Convierte una columna propia a la forma que usan CategoryFields, BooksTable y exportExcel. */
export function customToField(col) {
  const label = col.label || '';
  return {
    key: col.key,
    marcTag: col.marcTag || '',
    custom: true,
    label: { es: label, en: label },
    fieldLabel: { es: label, en: label },
    colLabel: { es: label, en: label },
  };
}

/**
 * Lista final de columnas para un tipo de documento, en el orden visible.
 * `customColumns` y `columnOrder` son objetos por tipo: { libro: [...] }.
 * Sin orden guardado se usa el de docTypes.js con las propias al final.
 */
export function getColumns(docType, customColumns = {}, columnOrder = {}) {
  const base = CATEGORIES_BY_TYPE[docType] || CATEGORIES_BY_TYPE.libro;
  const customs = ((customColumns && customColumns[docType]) || []).map(customToField);
  const all = [...base, ...customs];
  const order = columnOrder && columnOrder[docType];
  if (!Array.isArray(order) || order.length === 0) return all;

  const byKey = new Map(all.map((c) => [c.key, c]));
  const seen = new Set();
  const out = [];
  order.forEach((k) => {
    const c = byKey.get(k);
    if (c && !seen.has(k)) { out.push(c); seen.add(k); }
  });
  // Cualquier columna que no figure en el orden (p. ej. un paquete viejo) va al final.
  all.forEach((c) => { if (!seen.has(c.key)) out.push(c); });
  return out;
}
