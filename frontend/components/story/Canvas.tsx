import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Svg } from 'react-native-svg';
import DrawLayer from './DrawLayer';
import type { Stroke, OverlayText } from '../StoryEditorTypes';

type CanvasProps = {
  style?: ViewStyle;
  strokes: Stroke[];
  activeStroke?: Stroke | null;
  onTouchStart?: (e: any) => void;
  onTouchMove?: (e: any) => void;
  onTouchEnd?: () => void;
  overlays: OverlayText[];
  renderOverlay: (o: OverlayText) => React.ReactNode;
  backgroundUri?: string | null;
};

export default function Canvas({
  style,
  strokes,
  activeStroke,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  overlays,
  renderOverlay,
  backgroundUri,
}: CanvasProps) {
  return (
    <View style={[styles.container, style]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPressIn={onTouchStart as any}
        onPressOut={onTouchEnd}
        onResponderMove={onTouchMove as any}
        onStartShouldSetResponder={() => true}
      >
        {/* Background image is expected to be rendered by parent (ImageBackground or Image) */}
        <Svg style={StyleSheet.absoluteFill}>
          <DrawLayer strokes={[...strokes, ...(activeStroke ? [activeStroke] : [])]} />
        </Svg>

        {/* overlays */}
        {overlays.map((o) => (
          <React.Fragment key={o.id}>{renderOverlay(o)}</React.Fragment>
        ))}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
});
