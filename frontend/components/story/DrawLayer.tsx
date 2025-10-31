import React from 'react';
import { Path } from 'react-native-svg';
import type { Stroke } from '../StoryEditorTypes';

export default function DrawLayer({ strokes }: { strokes: Stroke[] }) {
  return (
    <>
      {strokes.map((s, idx) => {
        const d = s.points.length ? `M ${s.points.map((p) => `${p.x} ${p.y}`).join(' L ')}` : '';
        return (
          <Path
            key={`${idx}_${s.points.length}`}
            d={d}
            stroke={s.color}
            strokeWidth={s.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        );
      })}
    </>
  );
}
