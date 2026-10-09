/**
 * Pomelo y Trufa, dibujados con figuras simples.
 *
 * Este módulo es solo datos (sin React) para que lo usen tanto los componentes de la app
 * como el script que genera los íconos (`pnpm icons`). Si cambiás un dibujo, regenerá los íconos.
 */

export type DogName = 'pomelo' | 'trufa';

export type Coat = {
  coat: string;
  dark: string;
  tan: string;
  nose: string;
  eye: string;
  collar: string;
  tag: string;
};

/** Pomelo: negro y fuego, collar color pomelo. Trufa: chocolate y fuego, collar celeste. */
export const COATS: Record<DogName, Coat> = {
  pomelo: {
    coat: '#2B2624',
    dark: '#181412',
    tan: '#D9893B',
    nose: '#0F0D0C',
    eye: '#16100E',
    collar: '#F07A7F',
    tag: '#F5C04A',
  },
  trufa: {
    coat: '#7B4527',
    dark: '#5A3019',
    tan: '#DE9447',
    nose: '#4A2615',
    eye: '#2A160C',
    collar: '#5B9BD5',
    tag: '#F5C04A',
  },
};

type Paint = {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeLinecap?: 'round' | 'butt' | 'square';
  opacity?: number;
};

export type Shape =
  | ({ type: 'rect'; x: number; y: number; width: number; height: number; rx: number } & Paint)
  | ({ type: 'circle'; cx: number; cy: number; r: number } & Paint)
  | ({ type: 'ellipse'; cx: number; cy: number; rx: number; ry: number } & Paint)
  | ({ type: 'path'; d: string } & Paint)
  | { type: 'group'; transform: string; children: Shape[] };

/** La silueta define el contorno (para el borde tipo sticker); los detalles van encima. */
export type Drawing = {
  viewBox: [number, number, number, number];
  silhouette: Shape[];
  details: Shape[];
};

const rect = (
  x: number,
  y: number,
  width: number,
  height: number,
  rx: number,
  fill: string,
  opacity?: number,
): Shape => ({
  type: 'rect',
  x,
  y,
  width,
  height,
  rx,
  fill,
  opacity,
});
const circle = (cx: number, cy: number, r: number, fill: string, opacity?: number): Shape => ({
  type: 'circle',
  cx,
  cy,
  r,
  fill,
  opacity,
});
const ellipse = (cx: number, cy: number, rx: number, ry: number, fill: string): Shape => ({
  type: 'ellipse',
  cx,
  cy,
  rx,
  ry,
  fill,
});
const path = (d: string, fill: string): Shape => ({ type: 'path', d, fill });
const line = (d: string, stroke: string, strokeWidth: number): Shape => ({
  type: 'path',
  d,
  fill: 'none',
  stroke,
  strokeWidth,
  strokeLinecap: 'round',
});
const group = (transform: string, children: Shape[]): Shape => ({
  type: 'group',
  transform,
  children,
});

/** Las piezas del perro de perfil, mirando a la derecha (viewBox 0 0 240 130). */
function anatomy(k: Coat, eyesClosed: boolean) {
  return {
    tail: path('M44 62 C30 58 20 46 14 30 C13 27 17 25 19 28 C25 41 34 50 47 53 Z', k.coat),
    farLegs: [rect(64, 78, 15, 32, 7, k.dark), rect(160, 78, 15, 32, 7, k.dark)],
    farPaws: [rect(64, 97, 15, 13, 6.5, k.tan, 0.75), rect(160, 97, 15, 13, 6.5, k.tan, 0.75)],
    body: rect(38, 46, 150, 46, 23, k.coat),
    chest: path(
      'M187 50 C193 60 193 78 184 88 C178 93 170 94 163 92 C172 84 177 72 177 58 Z',
      k.tan,
    ),
    nearLegs: [rect(50, 80, 16, 32, 8, k.coat), rect(148, 80, 16, 32, 8, k.coat)],
    nearPaws: [rect(50, 98, 16, 14, 7, k.tan), rect(148, 98, 16, 14, 7, k.tan)],
    head: [
      path('M150 52 C160 34 172 24 186 22 L196 42 C186 46 178 56 174 70 Z', k.coat),
      circle(190, 34, 19, k.coat),
      path('M196 26 C210 24 226 28 233 34 C236 37 235 42 231 44 C222 48 208 49 197 46 Z', k.coat),
    ],
    face: [
      path('M200 41 C212 42 224 41 233 38 C235 41 234 43 231 44 C222 48 208 49 199 46 Z', k.tan),
      ellipse(196, 42, 7, 5, k.tan),
      ellipse(232, 33.5, 4.2, 3.6, k.nose),
      ...(eyesClosed
        ? [line('M195 30 Q199 34 203 30', k.eye, 2.4)]
        : [circle(199, 30, 2.9, k.eye), circle(200, 29, 0.9, '#FFFFFF', 0.9)]),
      ellipse(200, 23.5, 3.2, 2.2, k.tan),
      path('M181 20 C171 24 168 40 172 54 C174 60 182 60 184 54 C188 42 189 28 186 21 Z', k.dark),
    ],
    collar: [
      path('M168 41 C173 47 176 55 177 63 L170 66 C169 58 166 50 161 45 Z', k.collar),
      circle(172, 69, 4, k.tag),
    ],
  };
}

/** Parado, de perfil. */
export function standingDog(dog: DogName): Drawing {
  const a = anatomy(COATS[dog], false);
  return {
    viewBox: [0, 0, 240, 130],
    silhouette: [a.tail, ...a.farLegs, a.body, ...a.head, ...a.nearLegs],
    details: [...a.farPaws, ...a.nearPaws, a.chest, ...a.face, ...a.collar],
  };
}

/** Acostado y dormido, con las patitas delanteras estiradas. */
export function sleepingDog(dog: DogName): Drawing {
  const k = COATS[dog];
  const a = anatomy(k, true);
  const headPose = 'translate(10 30) rotate(12 175 62)';
  const zzz = '#9FB7CC';
  return {
    viewBox: [0, 0, 250, 130],
    silhouette: [
      path('M44 88 C30 92 18 94 8 92 C5 91 6 87 9 87 C18 88 28 86 40 80 Z', k.coat),
      rect(38, 56, 150, 42, 21, k.coat),
      rect(166, 86, 40, 12, 6, k.coat),
      group(headPose, a.head),
    ],
    details: [
      rect(192, 86, 14, 12, 6, k.tan),
      group(headPose, [...a.face, ...a.collar]),
      line('M214 30 H224 L214 42 H224', zzz, 3),
      line('M230 12 H237 L230 21 H237', zzz, 2.5),
    ],
  };
}

/** La cara de frente, para avatares (viewBox 0 0 120 120). */
export function dogFace(dog: DogName): Drawing {
  const k = COATS[dog];
  return {
    viewBox: [0, 0, 120, 120],
    silhouette: [
      path('M30 34 C16 38 10 58 14 78 C16 88 28 90 32 80 C36 66 38 48 36 36 Z', k.dark),
      path('M90 34 C104 38 110 58 106 78 C104 88 92 90 88 80 C84 66 82 48 84 36 Z', k.dark),
      path(
        'M60 18 C82 18 92 36 90 56 C88 76 76 96 60 98 C44 96 32 76 30 56 C28 36 38 18 60 18 Z',
        k.coat,
      ),
    ],
    details: [
      path(
        'M60 62 C72 62 80 72 78 84 C76 94 68 99 60 99 C52 99 44 94 42 84 C40 72 48 62 60 62 Z',
        k.tan,
      ),
      path('M52 74 C52 70 68 70 68 74 C68 79 63 82 60 82 C57 82 52 79 52 74 Z', k.nose),
      line('M60 82 L60 88', k.nose, 2),
      line('M54 89 Q60 93 66 89', k.nose, 2),
      circle(47, 54, 4.6, k.eye),
      circle(73, 54, 4.6, k.eye),
      circle(48.6, 52.6, 1.4, '#FFFFFF', 0.9),
      circle(74.6, 52.6, 1.4, '#FFFFFF', 0.9),
      ellipse(46, 43, 4.5, 3, k.tan),
      ellipse(74, 43, 4.5, 3, k.tan),
    ],
  };
}

/** Espeja un dibujo horizontalmente (para que mire a la izquierda). */
export function mirror(drawing: Drawing): Drawing {
  const [x, , width] = drawing.viewBox;
  const transform = `translate(${2 * x + width} 0) scale(-1 1)`;
  return {
    viewBox: drawing.viewBox,
    silhouette: [group(transform, drawing.silhouette)],
    details: [group(transform, drawing.details)],
  };
}

/**
 * El logo: Pomelo y Trufa acostados uno arriba del otro forman un signo igual.
 * Cuentas claras: quedar a mano.
 */
export function logoMark(): Drawing {
  const top = standingDog('pomelo');
  const bottom = mirror(standingDog('trufa'));
  return {
    viewBox: [0, 0, 240, 236],
    silhouette: [
      group('translate(0 0)', top.silhouette),
      group('translate(0 104)', bottom.silhouette),
    ],
    details: [group('translate(0 0)', top.details), group('translate(0 104)', bottom.details)],
  };
}

export type MascotStyle = 'plano' | 'sticker';

/** Las capas a dibujar, en orden, según el estilo. */
export function layers(
  drawing: Drawing,
  style: MascotStyle,
): { shapes: Shape[]; outline?: { color: string; width: number; dy: number; opacity: number } }[] {
  const base = [{ shapes: drawing.silhouette }, { shapes: drawing.details }];
  if (style === 'plano') return base;
  return [
    { shapes: drawing.silhouette, outline: { color: '#1D3B57', width: 14, dy: 4, opacity: 0.18 } },
    { shapes: drawing.silhouette, outline: { color: '#FFFFFF', width: 14, dy: 0, opacity: 1 } },
    ...base,
  ];
}

/** Repinta una figura con un solo color y trazo (para los bordes). */
export function outlined(shape: Shape, color: string, width: number): Shape {
  if (shape.type === 'group') {
    return { ...shape, children: shape.children.map((child) => outlined(child, color, width)) };
  }
  const isLine = shape.fill === 'none';
  return {
    ...shape,
    fill: isLine ? 'none' : color,
    stroke: color,
    strokeWidth: isLine ? (shape.strokeWidth ?? 0) + width : width,
    strokeLinecap: 'round',
    opacity: 1,
  };
}

/** SVG como texto (para generar íconos fuera de la app). */
export function toSvgString(drawing: Drawing, style: MascotStyle = 'plano'): string {
  const attrs = (s: Shape): string => {
    const paint = s.type === 'group' ? '' : paintAttrs(s);
    switch (s.type) {
      case 'rect':
        return `<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="${s.rx}"${paint}/>`;
      case 'circle':
        return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}"${paint}/>`;
      case 'ellipse':
        return `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}"${paint}/>`;
      case 'path':
        return `<path d="${s.d}"${paint}/>`;
      case 'group':
        return `<g transform="${s.transform}">${s.children.map(attrs).join('')}</g>`;
    }
  };
  return layers(drawing, style)
    .map(({ shapes, outline }) => {
      const drawn = outline ? shapes.map((s) => outlined(s, outline.color, outline.width)) : shapes;
      const open = outline
        ? `<g transform="translate(0 ${outline.dy})" opacity="${outline.opacity}" stroke-linejoin="round">`
        : '<g>';
      return `${open}${drawn.map(attrs).join('')}</g>`;
    })
    .join('');
}

function paintAttrs(s: Paint): string {
  let out = ` fill="${s.fill ?? 'none'}"`;
  if (s.stroke) out += ` stroke="${s.stroke}" stroke-width="${s.strokeWidth ?? 1}"`;
  if (s.strokeLinecap) out += ` stroke-linecap="${s.strokeLinecap}"`;
  if (s.opacity !== undefined && s.opacity !== 1) out += ` opacity="${s.opacity}"`;
  return out;
}
