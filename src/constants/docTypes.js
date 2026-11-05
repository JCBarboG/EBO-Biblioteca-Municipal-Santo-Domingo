// Esquema de campos de EBO para la Biblioteca Municipal Santo Domingo.
// Sigue la base de la biblioteca: los libros y demás documentos usan las
// columnas de la hoja principal; las revistas, las de la hoja REVISTA.
// No llevan etiqueta MARC: los encabezados del Excel salen tal cual.
//
// La clave de la columna "id" es `registroId` porque cada fila ya usa `id`
// internamente (UUID) para editar y borrar filas.

function field(key, colEs, es, en, colEn = en.toUpperCase()) {
  return {
    key,
    marcTag: '',
    label: { es, en },
    fieldLabel: { es, en },
    colLabel: { es: colEs, en: colEn },
  };
}

const ID = field('registroId', 'id', 'id', 'id', 'id');
const CLASIFICACION = field('clasificacion', 'CLASIFICACION', 'Clasificación', 'Classification');
const IDIOMA = field('idioma', 'IDIOMA', 'Idioma', 'Language');
const TITULO = field('titulo', 'TITULO', 'Título', 'Title');
const AUTOR = field('autor', 'AUTOR', 'Autor', 'Author');
const MATERIA = field('materia', 'MATERIA', 'Materia', 'Subject');
const DESC_FISICA = field('descFisica', 'DESCRIPCIÓN FÍSICA', 'Descripción física', 'Physical description');
const EJEMPLARES = field('ejemplares', 'EJEMPLARES', 'Ejemplares', 'Copies');

export const EBO_CATEGORIES = [
  ID,
  CLASIFICACION,
  IDIOMA,
  field('anioEdicion', 'AÑO EDICIÓN', 'Año edición', 'Edition year'),
  TITULO,
  AUTOR,
  MATERIA,
  field('lugarEditorial', 'LUGAR Y CASA EDITORIAL', 'Lugar y casa editorial', 'Place and publisher'),
  DESC_FISICA,
  field('isbn', 'ISBN', 'ISBN', 'ISBN'),
  EJEMPLARES,
  field('nota', 'NOTA', 'Nota', 'Note'),
  field('edicion', 'EDICIÓN', 'Edición', 'Edition'),
];

export const LIBRO_CATEGORIES = EBO_CATEGORIES;
export const REVISTA_CATEGORIES = [
  ID,
  CLASIFICACION,
  IDIOMA,
  field('anioEdicion', 'AÑO', 'Año', 'Year'),
  TITULO,
  AUTOR,
  MATERIA,
  field('lugarEditorial', 'DATOS DE PUBLICACIÓN', 'Datos de publicación', 'Publication data'),
  DESC_FISICA,
  field('isbn', 'ISSN / ISBN', 'ISSN / ISBN', 'ISSN / ISBN'),
  EJEMPLARES,
  field('numeroRevista', 'NUMERO REVISTA', 'Número de revista', 'Issue number'),
  field('fechaRevista', 'FECHA REVISTA', 'Fecha de revista', 'Issue date'),
  field('volumenes', 'VOLUMENES', 'Volúmenes', 'Volumes'),
  field('numeroVolumen', 'NUMERO DE VOLUMEN', 'Número de volumen', 'Volume number'),
];
export const TESIS_CATEGORIES = EBO_CATEGORIES;
export const ARTICULO_REVISTA_CATEGORIES = EBO_CATEGORIES;
export const ARTICULOS_LIBRO_CATEGORIES = EBO_CATEGORIES;

export const CATEGORIES_BY_TYPE = {
  libro: LIBRO_CATEGORIES,
  revista: REVISTA_CATEGORIES,
  tesis: TESIS_CATEGORIES,
  articuloRevista: ARTICULO_REVISTA_CATEGORIES,
  articulosLibro: ARTICULOS_LIBRO_CATEGORIES,
};

// El 96 % de la base está en español: el idioma ya viene marcado.
export const DEFAULT_LANGUAGE = 'Español';
export const LANGUAGES = ['Español', 'Inglés', 'Francés', 'Español-Inglés'];

export function emptyFieldsForType(type) {
  const cats = CATEGORIES_BY_TYPE[type] || LIBRO_CATEGORIES;
  return cats.reduce((acc, { key }) => {
    acc[key] = key === 'idioma' ? DEFAULT_LANGUAGE : '';
    return acc;
  }, {});
}

// Legacy export so existing imports of CATEGORIES / EMPTY_FIELDS still work
export const CATEGORIES = LIBRO_CATEGORIES;
export const EMPTY_FIELDS = emptyFieldsForType('libro');
