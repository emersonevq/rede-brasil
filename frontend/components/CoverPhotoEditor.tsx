import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
} from 'react-native';
import { Download, X, RotateCcw } from 'lucide-react-native';

export type CoverTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

type Props = {
  imageUri: string;
  isVisible: boolean;
  height?: number;
  initial?: Partial<CoverTransform>;
  onSave: (data: { imageUri: string } & CoverTransform) => void;
  onCancel: () => void;
};

const getDimensions = () => {
  if (Platform.OS === 'web') {
    return { width: typeof window !== 'undefined' ? window.innerWidth : 375 };
  }
  return Dimensions.get('window');
};
const { width: SCREEN_WIDTH } = getDimensions();
const MIN_SCALE = 1;
const MAX_SCALE = 3;

export default function CoverPhotoEditor({
  imageUri,
  isVisible,
  height = 200,
  initial,
  onSave,
  onCancel,
}: Props) {
  const [scale, setScale] = useState(initial?.scale ?? 1);
  const [offsetX, setOffsetX] = useState(initial?.offsetX ?? 0);
  const [offsetY, setOffsetY] = useState(initial?.offsetY ?? 0);

  const gestureState = useRef({
    initialDistance: 0,
    initialScale: initial?.scale ?? 1,
    initialOffsetX: initial?.offsetX ?? 0,
    initialOffsetY: initial?.offsetY ?? 0,
    lastTouchX: 0,
    lastTouchY: 0,
    isPinching: false,
  }).current;

  const getDistance = (touches: any[]) => {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,

        onPanResponderGrant: (evt) => {
          const touches = evt.nativeEvent.touches as any[];
          if (touches.length === 2) {
            gestureState.isPinching = true;
            gestureState.initialDistance = getDistance(touches);
            gestureState.initialScale = scale;
          } else if (touches.length === 1) {
            gestureState.isPinching = false;
            gestureState.lastTouchX = touches[0].pageX;
            gestureState.lastTouchY = touches[0].pageY;
            gestureState.initialOffsetX = offsetX;
            gestureState.initialOffsetY = offsetY;
          }
        },

        onPanResponderMove: (evt) => {
          const touches = evt.nativeEvent.touches as any[];
          if (touches.length === 2) {
            if (!gestureState.isPinching) {
              gestureState.isPinching = true;
              gestureState.initialDistance = getDistance(touches);
              gestureState.initialScale = scale;
            }
            const currentDistance = getDistance(touches);
            const scaleFactor = currentDistance / gestureState.initialDistance;
            const newScale = Math.max(
              MIN_SCALE,
              Math.min(MAX_SCALE, gestureState.initialScale * scaleFactor),
            );
            setScale(newScale);
            if (newScale <= MIN_SCALE) {
              setOffsetX(0);
              setOffsetY(0);
            }
          } else if (touches.length === 1 && !gestureState.isPinching) {
            if (scale > MIN_SCALE) {
              const currentX = touches[0].pageX;
              const currentY = touches[0].pageY;
              const deltaX = currentX - gestureState.lastTouchX;
              const deltaY = currentY - gestureState.lastTouchY;

              const maxOffsetX = (SCREEN_WIDTH * (scale - 1)) / 2;
              const maxOffsetY = (height * (scale - 1)) / 2;

              const newOffsetX = Math.max(
                -maxOffsetX,
                Math.min(maxOffsetX, gestureState.initialOffsetX + deltaX),
              );
              const newOffsetY = Math.max(
                -maxOffsetY,
                Math.min(maxOffsetY, gestureState.initialOffsetY + deltaY),
              );
              setOffsetX(newOffsetX);
              setOffsetY(newOffsetY);
            }
          }
        },

        onPanResponderRelease: () => {
          gestureState.isPinching = false;
          gestureState.initialDistance = 0;
        },
      }),
    [scale, offsetX, offsetY, height],
  );

  const handleReset = () => {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  const handleSave = () => {
    onSave({ imageUri, scale, offsetX, offsetY });
  };

  return (
    <Modal visible={isVisible} animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerBtn}>
            <X size={24} color="#0f172a" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Capa</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
            <Download size={24} color="#0f172a" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View style={styles.editorSection}>
          <Text style={styles.sectionLabel}>Posicione sua capa</Text>
          <Text style={styles.instructionHint}>
            {scale > 1
              ? 'Arraste para posicionar'
              : 'Use dois dedos para ampliar'}
          </Text>

          <View style={[styles.rectContainer, { height }]}>
            <View style={[styles.rectMask, { height, width: SCREEN_WIDTH }]}>
              <Image
                source={{ uri: imageUri }}
                style={[
                  styles.image,
                  { height, width: SCREEN_WIDTH },
                  {
                    transform: [
                      { scale },
                      { translateX: offsetX },
                      { translateY: offsetY },
                    ],
                  },
                ]}
                resizeMode="cover"
              />
              <View
                style={styles.gestureOverlay}
                {...panResponder.panHandlers}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleReset}
            style={[styles.resetBtn, scale === 1 && styles.resetBtnDisabled]}
            activeOpacity={scale === 1 ? 1 : 0.7}
            disabled={scale === 1}
          >
            <RotateCcw
              size={16}
              color={scale === 1 ? '#cbd5e1' : '#64748b'}
              strokeWidth={2.5}
            />
            <Text
              style={[
                styles.resetBtnText,
                scale === 1 && styles.resetBtnTextDisabled,
              ]}
            >
              Resetar
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    zIndex: 100,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  headerBtn: {
    padding: 8,
    borderRadius: 20,
    zIndex: 100,
  },
  editorSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    alignSelf: 'flex-start',
  },
  instructionHint: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
    marginBottom: 12,
    alignSelf: 'flex-start',
    fontStyle: 'italic',
  },
  rectContainer: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  rectMask: {
    overflow: 'hidden',
    position: 'relative',
  },
  gestureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  image: {},
  resetBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resetBtnDisabled: { borderColor: '#f1f5f9' },
  resetBtnText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  resetBtnTextDisabled: { color: '#cbd5e1' },
});
