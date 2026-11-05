// Presets de puntuación ISBD por tipo de documento (paso 03).
//
// EBO: las columnas de este repositorio no llevan etiqueta MARC (ver
// constants/docTypes.js), así que estos presets, heredados de
// EBO-Biblioteca.Cliente, no aplican a ninguna columna. La puntuación se
// asigna a mano por columna desde el triángulo del encabezado. Se conservan
// por si se agregan columnas propias con etiqueta MARC.
//
// Fuente: Excel de puntuación entregado por la catalogadora (2026-09).
// Reglas:
//  - La puntuación es TERMINAL: se agrega al final del valor de la celda.
//  - Solo se puntúan los campos listados aquí; el resto sale tal cual.
//  - Cada tipo tiene sus propias reglas (no se uniforman entre tipos).
//  - Nunca se puntúa una celda vacía y nunca se duplica un símbolo que el
//    texto ya trae al final.
//
// Las claves son etiquetas MARC (campo$subcampo), no claves de campo, para
// que la regla se lea igual que en el Excel fuente. Un valor puede ser:
//  - un string: símbolo terminal fijo (el espacio inicial es parte de la regla)
//  - { conditional: { ifFilled, then, else } }: se evalúa fila por fila según
//    si el subcampo `ifFilled` de esa misma fila tiene texto.
//
// `separators` define cómo se unen varios valores dentro de una misma celda
// (varios autores, varios términos). Los fragmentos asignados en el paso 02
// se acumulan separados por ';' (ver handleAssign en App.jsx), así que se
// parte por ';' y se vuelve a unir con el separador del tipo.

import { CATEGORIES_BY_TYPE } from '../constants/docTypes';

const TITLE_IF_SUBTITLE = { conditional: { ifFilled: '245$b', then: ' :', else: '' } };

export const PUNCTUATION_PRESETS = {
  libro: {
    terminal: {
      '245$a': TITLE_IF_SUBTITLE,
      '260$a': ' :',
      '260$b': ',',
    },
    separators: {
      '100$a': '; ',
      '700$a': '; ',
      '650$a': ', ',
      '653$a': ', ',
    },
  },
  articulosLibro: {
    terminal: {
      '245$a': TITLE_IF_SUBTITLE,
      '260$a': ' :',
      '260$b': ',',
    },
    separators: {
      '100$a': ' ; ',
      '700$a': ' ; ',
      '650$a': ', ',
      '653$a': ', ',
    },
  },
  articuloRevista: {
    terminal: {
      '245$a': TITLE_IF_SUBTITLE,
      '245$b': '.',
      '260$a': ' :',
      '260$b': ',',
    },
    separators: {
      '100$a': ' ; ',
      '700$a': '; ',
      '650$a': ', ',
      '653$a': ', ',
    },
  },
  tesis: {
    terminal: {
      '245$a': TITLE_IF_SUBTITLE,
      '245$b': '.',
      '260$a': ' :',
      '260$b': ',',
      // El " -- " interno entre grado e institución lo escribe la persona.
      '502$a': '.',
    },
    separators: {
      '100$a': '; ',
      '700$a': '; ',
      '650$a': ', ',
      '653$a': ', ',
    },
  },
  revista: {
    terminal: {
      '245$a': { conditional: { ifFilled: '245$b', then: ' :', else: '.' } },
      '260$a': ' :',
      '260$b': ',', // en el Excel fuente figuraba como 206$b (errata)
      '260$c': ' -', // fecha de publicación abierta: "1988 -"
      '310$a': '.',
      '541$a': '.',
    },
    separators: {
      '650$a': ', ',
      '653$a': ', ',
    },
  },
};

function presetFor(docType) {
  return PUNCTUATION_PRESETS[docType] || { terminal: {}, separators: {} };
}

function valueByTag(row, docType, tag) {
  const cats = CATEGORIES_BY_TYPE[docType] || [];
  const cat = cats.find((c) => c.marcTag === tag);
  return cat ? String(row[cat.key] || '').trim() : '';
}

/**
 * Regla del preset para una columna (string, objeto condicional o undefined).
 * Las columnas propias (field.custom) no tienen preset: siempre "sin
 * puntuación", aunque su etiqueta MARC coincida con una del preset. Solo se
 * puntúan con el override manual de la columna.
 */
export function presetRuleFor(field, docType) {
  if (!field || field.custom) return undefined;
  return presetFor(docType).terminal[field.marcTag];
}

export function separatorFor(field, docType) {
  if (!field || field.custom) return undefined;
  return presetFor(docType).separators[field.marcTag];
}

export function hasOverride(overrides, key) {
  return Boolean(overrides) && Object.prototype.hasOwnProperty.call(overrides, key);
}

/**
 * Devuelve { body, suffix } para una celda: `body` es el texto (con los
 * separadores internos normalizados) y `suffix` la puntuación terminal que
 * corresponde. Separarlos permite pintar el símbolo en color en la vista
 * previa; la exportación usa `body + suffix` (ver applyPunctuation).
 */
export function punctuationParts(row, field, docType, overrides = {}) {
  const raw = String(row[field.key] ?? '');
  if (!raw.trim()) return { body: '', suffix: '' };

  const sep = separatorFor(field, docType);
  let symbol;
  if (hasOverride(overrides, field.key)) {
    symbol = overrides[field.key] || '';
  } else {
    const rule = presetRuleFor(field, docType);
    if (typeof rule === 'string') symbol = rule;
    else if (rule && rule.conditional) {
      const { ifFilled, then, else: otherwise } = rule.conditional;
      symbol = valueByTag(row, docType, ifFilled) ? then : otherwise;
    } else symbol = '';
  }

  // Campo sin regla: sale tal cual, sin tocar.
  if (!sep && !symbol) return { body: raw, suffix: '' };

  let body = raw.trim();
  if (sep) {
    body = body.split(';').map((p) => p.trim()).filter(Boolean).join(sep);
  }

  const mark = symbol.trim();
  if (!mark || body.endsWith(mark)) return { body, suffix: '' };
  return { body, suffix: symbol };
}

/** Valor final de la celda. Única fuente de verdad para vista previa y Excel. */
export function applyPunctuation(row, field, docType, overrides = {}) {
  const { body, suffix } = punctuationParts(row, field, docType, overrides);
  return body + suffix;
}
