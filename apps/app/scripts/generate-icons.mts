/**
 * Genera los íconos de la app a partir del logo (Pomelo y Trufa formando un signo igual).
 * Si cambiás los dibujos de src/components/mascots/shapes.ts, corré `pnpm icons` y commiteá las imágenes.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import {
  dogFace,
  logoMark,
  outlined,
  toSvgString,
  type Drawing,
  type MascotStyle,
} from '../src/components/mascots/shapes.ts';
import palette from '../src/theme/palette.js';

const IMAGES = fileURLToPath(new URL('../assets/images/', import.meta.url));
const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
mkdirSync(PUBLIC, { recursive: true });

const CIELO = palette.cielo[400];
const FONDO = palette.cielo[50];

type Options = {
  size: number;
  /** Qué parte del ancho ocupa el dibujo (0 a 1). */
  scale: number;
  background?: string;
  style?: MascotStyle;
  /** Todo de un solo color (para el ícono monocromo de Android). */
  monochrome?: string;
  drawing?: Drawing;
};

function svg({
  size,
  scale,
  background,
  style = 'sticker',
  monochrome,
  drawing = logoMark(),
}: Options) {
  const pad = style === 'sticker' ? 10 : 2;
  const [vx, vy, vw, vh] = drawing.viewBox;
  const width = vw + pad * 2;
  const height = vh + pad * 2;
  const factor = (size * scale) / Math.max(width, height);
  const x = (size - width * factor) / 2;
  const y = (size - height * factor) / 2;
  const content = monochrome
    ? toSvgString(
        {
          ...drawing,
          silhouette: drawing.silhouette.map((s) => outlined(s, monochrome, 2)),
          details: [],
        },
        'plano',
      )
    : toSvgString(drawing, style);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : ''}
  <g transform="translate(${x} ${y}) scale(${factor}) translate(${pad - vx} ${pad - vy})">${content}</g>
</svg>`;
}

async function png(file: string, options: Options) {
  await sharp(Buffer.from(svg(options)))
    .png()
    .toFile(file);
  console.log('✓', file.replace(process.cwd() + '/', ''));
}

// App nativa (app.json)
await png(`${IMAGES}icon.png`, { size: 1024, scale: 0.8, background: CIELO });
await png(`${IMAGES}android-icon-foreground.png`, { size: 1024, scale: 0.56 });
await png(`${IMAGES}android-icon-background.png`, {
  size: 1024,
  scale: 0,
  background: CIELO,
  drawing: { viewBox: [0, 0, 1, 1], silhouette: [], details: [] },
});
await png(`${IMAGES}android-icon-monochrome.png`, {
  size: 1024,
  scale: 0.56,
  monochrome: '#FFFFFF',
});
await png(`${IMAGES}splash-icon.png`, { size: 1024, scale: 0.9 });
// En chiquito se leen mejor las caras que los perros enteros.
const faces: Drawing = {
  viewBox: [0, 0, 236, 120],
  silhouette: [],
  details: [],
};
const pomelo = dogFace('pomelo');
const trufa = dogFace('trufa');
faces.silhouette = [
  { type: 'group', transform: 'translate(0 0)', children: pomelo.silhouette },
  { type: 'group', transform: 'translate(116 0)', children: trufa.silhouette },
];
faces.details = [
  { type: 'group', transform: 'translate(0 0)', children: pomelo.details },
  { type: 'group', transform: 'translate(116 0)', children: trufa.details },
];
await png(`${IMAGES}favicon.png`, { size: 64, scale: 1, drawing: faces, style: 'plano' });

// PWA (public/)
await png(`${PUBLIC}icon-192.png`, { size: 192, scale: 0.8, background: CIELO });
await png(`${PUBLIC}icon-512.png`, { size: 512, scale: 0.8, background: CIELO });
// "maskable": el sistema puede recortarlo en círculo, así que el dibujo va más adentro.
await png(`${PUBLIC}icon-maskable-512.png`, { size: 512, scale: 0.62, background: CIELO });
await png(`${PUBLIC}apple-touch-icon.png`, { size: 180, scale: 0.8, background: CIELO });

writeFileSync(
  `${PUBLIC}manifest.webmanifest`,
  `${JSON.stringify(
    {
      name: 'Cuentas Claras',
      short_name: 'Cuentas Claras',
      description: 'Los gastos de la casa, en orden y entre los dos.',
      lang: 'es-AR',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      background_color: FONDO,
      theme_color: FONDO,
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    null,
    2,
  )}\n`,
);
console.log('✓ public/manifest.webmanifest');
