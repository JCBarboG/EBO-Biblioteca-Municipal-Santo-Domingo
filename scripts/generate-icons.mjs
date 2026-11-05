import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = join(__dirname, '..', 'public', 'icons');
mkdirSync(outputDir, { recursive: true });

const sizes = [48, 96, 192, 512];

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const radius = size * 0.18;

  // Rounded rectangle background navy-deep
  ctx.fillStyle = '#0d2842';
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  // EBO text
  const fontSize = Math.round(size * 0.38);
  ctx.font = `italic bold ${fontSize}px Georgia, serif`;
  ctx.fillStyle = '#f2ede1';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textY = size * 0.48;
  ctx.fillText('EBO', size / 2, textY);

  // Gold underline
  const metrics = ctx.measureText('EBO');
  const textWidth = metrics.width;
  const lineY = textY + fontSize * 0.36;
  const lineThickness = Math.max(2, Math.round(size * 0.035));

  ctx.fillStyle = '#a9812f';
  ctx.fillRect((size - textWidth) / 2, lineY, textWidth, lineThickness);

  const buffer = canvas.toBuffer('image/png');
  writeFileSync(join(outputDir, `ebo-${size}.png`), buffer);
  console.log(`✓ ebo-${size}.png`);
}
