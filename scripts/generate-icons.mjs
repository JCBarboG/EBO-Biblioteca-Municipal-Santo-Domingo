// Genera los íconos PNG a partir de public/logo.svg:
//   node scripts/generate-icons.mjs
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
mkdirSync(join(publicDir, 'icons'), { recursive: true });

const logo = readFileSync(join(publicDir, 'logo.svg'), 'utf8');

// Versión a sangre para los sistemas que recortan el ícono (Android, iOS): sin
// esquinas transparentes y con el dibujo dentro de la zona segura del 80 %.
const fullBleed = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#1F6FA3"/>
  <g transform="translate(100 100) scale(.72) translate(-100 -110)">
    <circle cx="100" cy="124" r="78" fill="#E5332A"/>
    <circle cx="100" cy="124" r="58" fill="#F7B02D"/>
    <circle cx="100" cy="124" r="36" fill="#FFF8EC"/>
  </g>
  <rect y="110" width="200" height="90" fill="#2E9E4F"/>
  <g transform="translate(100 100) scale(.72) translate(-100 -110)">
    <path d="M100 118C78 106 46 106 24 114V168C46 160 78 160 100 172C122 160 154 160 176 168V114C154 106 122 106 100 118Z" fill="#FFF8EC"/>
    <path d="M100 118V172" stroke="#1F6FA3" stroke-width="5"/>
    <path d="M40 128C56 124 72 125 86 130M40 146C56 142 72 143 86 148M160 128C144 124 128 125 114 130M160 146C144 142 128 143 114 148" fill="none" stroke="#8CC63F" stroke-width="5" stroke-linecap="round"/>
  </g>
</svg>`;

async function render(svg, size, file) {
  const image = await loadImage(Buffer.from(svg));
  const canvas = createCanvas(size, size);
  canvas.getContext('2d').drawImage(image, 0, 0, size, size);
  writeFileSync(join(publicDir, file), canvas.toBuffer('image/png'));
  console.log(`✓ ${file}`);
}

for (const size of [48, 96, 192, 512]) await render(logo, size, `icons/ebo-${size}.png`);
await render(logo, 192, 'pwa-192x192.png');
await render(logo, 512, 'pwa-512x512.png');
await render(fullBleed, 512, 'pwa-maskable-512x512.png');
await render(fullBleed, 192, 'icons/ebo-apple-192.png');
