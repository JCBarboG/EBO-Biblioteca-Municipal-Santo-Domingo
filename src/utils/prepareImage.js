// Prepara una foto para el OCR, todo en el navegador (sin subirla a ningún
// servidor). Las fotos de celular fallaban por tres motivos que se corrigen
// aquí antes de entregar la imagen a Tesseract:
//
// 1. Orientación EXIF: el celular guarda los píxeles apaisados y una etiqueta
//    "rotar 90°". El navegador la respeta al mostrar la foto (por eso se ve
//    vertical), pero el lector EXIF de Tesseract.js solo reconoce uno de los
//    dos formatos posibles (big-endian), así que muchas fotos de Android
//    llegaban acostadas y el OCR devolvía basura o nada. Dibujar la imagen en
//    un canvas aplica la orientación tal como se ve en pantalla.
// 2. Tamaño: una foto de 12–48 MP es enorme para el motor WASM (lento y, en
//    celulares, puede quedarse sin memoria). Se reduce el lado mayor a
//    MAX_SIDE, suficiente para el texto de una portada. Las imágenes muy
//    pequeñas se amplían a MIN_SIDE para que las letras tengan tamaño legible.
// 3. Formato y contraste: se entrega siempre un PNG en escala de grises con
//    los niveles estirados, que Tesseract lee sin problemas (WebP, PNG con
//    transparencia, etc.) y con mejor contraste en fotos con poca luz.

const MAX_SIDE = 2400;
const MIN_SIDE = 1400;

export class UnsupportedImageError extends Error {}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new UnsupportedImageError('No se pudo leer la imagen.'));
    };
    img.src = url;
  });
}

// Pasa a escala de grises y estira el histograma entre los percentiles 1 y 99
// (ignora unos pocos píxeles extremos: reflejos, sombras puntuales).
function grayscaleAndStretch(imageData) {
  const d = imageData.data;
  const n = d.length / 4;
  const gray = new Uint8ClampedArray(n);
  const hist = new Uint32Array(256);
  for (let i = 0, p = 0; p < n; i += 4, p += 1) {
    // Píxeles transparentes se tratan como fondo blanco.
    const a = d[i + 3] / 255;
    const y = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) * a + 255 * (1 - a);
    gray[p] = y;
    hist[gray[p]] += 1;
  }
  const cut = n * 0.01;
  let lo = 0; let acc = 0;
  while (lo < 255 && acc + hist[lo] <= cut) { acc += hist[lo]; lo += 1; }
  let hi = 255; acc = 0;
  while (hi > 0 && acc + hist[hi] <= cut) { acc += hist[hi]; hi -= 1; }
  const range = hi - lo;
  for (let i = 0, p = 0; p < n; i += 4, p += 1) {
    const v = range > 32 ? ((gray[p] - lo) * 255) / range : gray[p];
    d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
  }
  return imageData;
}

export async function prepareImageForOcr(source) {
  const img = await loadImage(source);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) throw new UnsupportedImageError('La imagen está vacía.');

  const longSide = Math.max(w, h);
  let scale = 1;
  if (longSide > MAX_SIDE) scale = MAX_SIDE / longSide;
  else if (longSide < MIN_SIDE) scale = Math.min(3, MIN_SIDE / longSide);

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  ctx.putImageData(grayscaleAndStretch(data), 0, 0);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  // Libera la memoria del canvas de inmediato (importante en iOS).
  canvas.width = 0;
  canvas.height = 0;
  if (!blob) throw new Error('No se pudo preparar la imagen.');
  return blob;
}
