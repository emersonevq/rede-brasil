export type DrawPoint = { x: number; y: number };
export type Stroke = { color: string; width: number; points: DrawPoint[] };
export type OverlayText = {
  id: string;
  type: 'text' | 'tag';
  text: string;
  color: string;
  fontFamily?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
};
