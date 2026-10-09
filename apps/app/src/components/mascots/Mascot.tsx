import { memo, type ReactNode } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import {
  dogFace,
  layers,
  logoMark,
  outlined,
  sleepingDog,
  standingDog,
  type DogName,
  type Drawing,
  type MascotStyle,
  type Shape,
} from './shapes';

function renderShape(shape: Shape, key: string): ReactNode {
  switch (shape.type) {
    case 'group':
      return (
        <G key={key} transform={shape.transform}>
          {shape.children.map((child, i) => renderShape(child, `${key}.${i}`))}
        </G>
      );
    case 'rect':
      return (
        <Rect
          key={key}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          rx={shape.rx}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          strokeLinejoin="round"
          opacity={shape.opacity}
        />
      );
    case 'circle':
      return (
        <Circle
          key={key}
          cx={shape.cx}
          cy={shape.cy}
          r={shape.r}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          opacity={shape.opacity}
        />
      );
    case 'ellipse':
      return (
        <Ellipse
          key={key}
          cx={shape.cx}
          cy={shape.cy}
          rx={shape.rx}
          ry={shape.ry}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          opacity={shape.opacity}
        />
      );
    case 'path':
      return (
        <Path
          key={key}
          d={shape.d}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          strokeLinecap={shape.strokeLinecap}
          strokeLinejoin="round"
          opacity={shape.opacity}
        />
      );
  }
}

type DrawingProps = {
  drawing: Drawing;
  width: number;
  style?: MascotStyle;
  accessibilityLabel?: string;
};

/** Dibuja cualquier ilustración de `shapes.ts` con el ancho pedido (el alto sale solo). */
export const MascotDrawing = memo(function MascotDrawing({
  drawing,
  width,
  style = 'plano',
  accessibilityLabel,
}: DrawingProps) {
  // El borde tipo sticker sobresale del dibujo: se agranda el lienzo para que no se corte.
  const pad = style === 'sticker' ? 10 : 2;
  const [x, y, w, h] = drawing.viewBox;
  const viewBox = `${x - pad} ${y - pad} ${w + pad * 2} ${h + pad * 2}`;
  const height = (width * (h + pad * 2)) / (w + pad * 2);

  return (
    <Svg
      width={width}
      height={height}
      viewBox={viewBox}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
    >
      {layers(drawing, style).map(({ shapes, outline }, i) =>
        outline ? (
          <G key={i} transform={`translate(0 ${outline.dy})`} opacity={outline.opacity}>
            {shapes.map((s, j) =>
              renderShape(outlined(s, outline.color, outline.width), `${i}.${j}`),
            )}
          </G>
        ) : (
          <G key={i}>{shapes.map((s, j) => renderShape(s, `${i}.${j}`))}</G>
        ),
      )}
    </Svg>
  );
});

const NAMES: Record<DogName, string> = { pomelo: 'Pomelo', trufa: 'Trufa' };

export function Dachshund({
  dog,
  pose = 'parado',
  width,
  style,
}: {
  dog: DogName;
  pose?: 'parado' | 'durmiendo';
  width: number;
  style?: MascotStyle;
}) {
  const drawing = pose === 'parado' ? standingDog(dog) : sleepingDog(dog);
  const label = `${NAMES[dog]}, ${pose === 'parado' ? 'parado' : 'durmiendo'}`;
  return <MascotDrawing drawing={drawing} width={width} style={style} accessibilityLabel={label} />;
}

export function DogFace({ dog, size }: { dog: DogName; size: number }) {
  return <MascotDrawing drawing={dogFace(dog)} width={size} accessibilityLabel={NAMES[dog]} />;
}

/** Pomelo y Trufa formando un signo igual. */
export function LogoMark({ width, style = 'sticker' }: { width: number; style?: MascotStyle }) {
  return (
    <MascotDrawing
      drawing={logoMark()}
      width={width}
      style={style}
      accessibilityLabel="Pomelo y Trufa"
    />
  );
}
