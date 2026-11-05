// Todos los assets de Tesseract (worker, núcleo WASM y datos de idioma) se
// sirven desde /public en el mismo origen que la app, evitando problemas de
// resolución de rutas o de CORS contra un CDN externo en producción.
//
// Importante: se construyen como URLs absolutas (con origin) y no relativas.
// El worker de Tesseract se crea a partir de un Blob (`importScripts(...)`
// dentro de un worker con location "blob:"), y en ese contexto los
// navegadores no resuelven correctamente rutas relativas a la raíz como
// "/tesseract/worker.min.js" — lanzan "The URL is invalid". Resolverlas aquí
// mismo contra `window.location.href` evita depender de la resolución
// interna de la librería frente a esa particularidad de los blob workers.
const absoluteUrl = (path) => new URL(path, window.location.href).href;
const BASE = import.meta.env.BASE_URL;

export const WORKER_PATH = absoluteUrl(`${BASE}tesseract/worker.min.js`);
export const CORE_PATH = absoluteUrl(`${BASE}tesseract/`);
export const LANG_PATH = absoluteUrl(`${BASE}tessdata/`);
