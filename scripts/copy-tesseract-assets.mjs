// Copia los archivos binarios de Tesseract.js (worker, núcleo WASM y datos de
// idioma) a /public para que se sirvan desde el mismo origen que la app, con
// rutas absolutas predecibles tanto en desarrollo (vite dev) como en
// producción (vite build + cualquier hosting estático). Esto evita el fallo
// típico de Tesseract.js en producción: el worker o el WASM no cargan porque
// las rutas se resolvieron contra un CDN externo o un build path incorrecto.

import { existsSync, mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const publicTesseractDir = path.join(root, 'public', 'tesseract');
const publicTessdataDir = path.join(root, 'public', 'tessdata');

mkdirSync(publicTesseractDir, { recursive: true });
mkdirSync(publicTessdataDir, { recursive: true });

const workerSrc = path.join(root, 'node_modules', 'tesseract.js', 'dist', 'worker.min.js');
const coreDir = path.join(root, 'node_modules', 'tesseract.js-core');

// Variantes del núcleo WASM: con/sin SIMD, solo motor LSTM (el que usa esta
// app para reconocimiento). Se copian ambas para que el worker elija la
// correcta según el soporte de SIMD del navegador del usuario.
//
// También se copian las variantes "combinadas" (Legacy + LSTM, sin sufijo
// "-lstm"). Son necesarias exclusivamente para el worker de detección de
// orientación (OSD): `worker.detect()` requiere el motor Legacy, que el
// núcleo "-lstm" no incluye.
const coreFiles = [
  'tesseract-core-simd-lstm.wasm.js',
  'tesseract-core-simd-lstm.wasm',
  'tesseract-core-lstm.wasm.js',
  'tesseract-core-lstm.wasm',
  'tesseract-core-simd.wasm.js',
  'tesseract-core-simd.wasm',
  'tesseract-core.wasm.js',
  'tesseract-core.wasm',
];

function copyIfExists(src, destDir) {
  if (!existsSync(src)) {
    console.warn(`[copy-tesseract-assets] No se encontró ${src}, se omite.`);
    return false;
  }
  const dest = path.join(destDir, path.basename(src));
  copyFileSync(src, dest);
  console.log(`[copy-tesseract-assets] Copiado ${path.basename(src)}`);
  return true;
}

copyIfExists(workerSrc, publicTesseractDir);
for (const file of coreFiles) {
  copyIfExists(path.join(coreDir, file), publicTesseractDir);
}

// Datos de idioma (español + inglés, modelo LSTM "best_int") y de OSD
// (Orientation and Script Detection, paquete independiente del idioma que
// solo detecta el ángulo del texto). Vienen de los paquetes npm
// @tesseract.js-data/* (devDependencies), así que se instalan con el resto
// de dependencias, sin depender de una descarga aparte. Si el paquete no
// estuviera, se intenta bajar el archivo desde el CDN oficial.
//
// Antes solo se descargaban del CDN y, si la descarga fallaba, el script
// apenas mostraba un aviso: el sitio se publicaba sin los datos de idioma y
// la extracción de texto fallaba siempre. Ahora la instalación falla con un
// error claro si faltan los datos de español o inglés.
const DATA = [
  { file: 'spa.traineddata.gz', pkg: 'spa', variant: '4.0.0_best_int', required: true },
  { file: 'eng.traineddata.gz', pkg: 'eng', variant: '4.0.0_best_int', required: true },
  { file: 'osd.traineddata.gz', pkg: 'osd', variant: '4.0.0', required: false },
];

async function provide({ file, pkg, variant }) {
  const dest = path.join(publicTessdataDir, file);
  const fromPackage = path.join(root, 'node_modules', '@tesseract.js-data', pkg, variant, file);
  if (copyIfExists(fromPackage, publicTessdataDir)) return true;
  if (existsSync(dest)) {
    console.log(`[copy-tesseract-assets] ${file} ya existe, se omite descarga.`);
    return true;
  }
  const url = `https://cdn.jsdelivr.net/npm/@tesseract.js-data/${pkg}/${variant}/${file}`;
  try {
    console.log(`[copy-tesseract-assets] Descargando ${file}...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(dest, buf);
    console.log(`[copy-tesseract-assets] Listo: ${file} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
    return true;
  } catch (err) {
    console.warn(`[copy-tesseract-assets] No se pudo descargar ${file} (${err.message}).`);
    return false;
  }
}

const results = await Promise.all(DATA.map(provide));
const missing = DATA.filter((d, i) => d.required && !results[i]).map((d) => d.file);
if (missing.length) {
  console.error(`[copy-tesseract-assets] ERROR: faltan ${missing.join(', ')}. Sin estos archivos el OCR no funciona; ejecuta "npm install" con conexión a internet.`);
  process.exit(1);
}
