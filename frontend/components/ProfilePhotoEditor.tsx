import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Modal,
  PanResponder,
  Animated,
  Platform,
} from 'react-native';
import { Download, X, RotateCcw, Check } from 'lucide-react-native';

interface ProfilePhotoEditorProps {
  imageUri: string;
  isVisible: boolean;
  onSave: (imageUri: string, caption: string) => void;
  onCancel: () => void;
}

const getDimensions = () => {
  if (Platform.OS === 'web') {
    return { width: typeof window !== 'undefined' ? window.innerWidth : 375 };
  }
  return Dimensions.get('window');
};
const { width } = getDimensions();
const CIRCLE_SIZE = 280;
const CIRCLE_RADIUS = CIRCLE_SIZE / 2;
const MIN_SCALE = 1;
const MAX_SCALE = 3;

export default function ProfilePhotoEditor({
  imageUri,
  isVisible,
  onSave,
  onCancel,
}: ProfilePhotoEditorProps) {
  const [caption, setCaption] = useState('');
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Animation values
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  // Refs for gesture tracking
  const gestureState = useRef({
    initialDistance: 0,
    initialScale: 1,
    initialOffsetX: 0,
    initialOffsetY: 0,
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
            // Start pinch
            gestureState.isPinching = true;
            gestureState.initialDistance = getDistance(touches);
            gestureState.initialScale = scale;
          } else if (touches.length === 1) {
            // Start pan
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
            // Pinch to zoom
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

            // Reset offset when scale goes back to 1
            if (newScale <= MIN_SCALE) {
              setOffsetX(0);
              setOffsetY(0);
            }
          } else if (touches.length === 1 && !gestureState.isPinching) {
            // Pan (only when zoomed in)
            if (scale > MIN_SCALE) {
              const currentX = touches[0].pageX;
              const currentY = touches[0].pageY;

              const deltaX = currentX - gestureState.lastTouchX;
              const deltaY = currentY - gestureState.lastTouchY;

              const maxOffset = (CIRCLE_SIZE * (scale - 1)) / 2;

              const newOffsetX = Math.max(
                -maxOffset,
                Math.min(maxOffset, gestureState.initialOffsetX + deltaX),
              );
              const newOffsetY = Math.max(
                -maxOffset,
                Math.min(maxOffset, gestureState.initialOffsetY + deltaY),
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
    [scale, offsetX, offsetY],
  );

  const handleReset = () => {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  const showSuccessAnimation = () => {
    setShowSuccessModal(true);

    successScale.setValue(0);
    successOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(successScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(successScale, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(successOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSuccessModal(false);
      });
    }, 1500);
  };

  const handleSave = () => {
    onSave(imageUri, caption);
    showSuccessAnimation();
  };

  return (
    <>
      <Modal visible={isVisible} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.headerBtn}>
              <X size={24} color="#0f172a" strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Editar Foto</Text>
            <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
              <Download size={24} color="#0f172a" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          >
            <View style={styles.editorSection}>
              <Text style={styles.sectionLabel}>Editar Foto</Text>
              <Text style={styles.instructionHint}>
                {scale > 1
                  ? 'Arraste com um dedo para posicionar'
                  : 'Use dois dedos para ampliar a imagem'}
              </Text>

              <View style={styles.circleContainer}>
                <View style={styles.circleMask}>
                  <Image
                    source={{ uri: imageUri }}
                    style={[
                      styles.image,
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
                </View>

                <View
                  style={styles.gestureOverlay}
                  {...panResponder.panHandlers}
                />

                <View
                  style={styles.circleBorderIndicator}
                  pointerEvents="none"
                />

                {scale > 1 && (
                  <View style={styles.zoomDisplay} pointerEvents="none">
                    <Text style={styles.zoomDisplayText}>
                      {Math.round(scale * 100)}%
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.debugInfo}>
                <Text style={styles.debugText}>Zoom: {scale.toFixed(2)}x</Text>
                <Text style={styles.debugText}>X: {offsetX.toFixed(0)}</Text>
                <Text style={styles.debugText}>Y: {offsetY.toFixed(0)}</Text>
              </View>

              <TouchableOpacity
                onPress={handleReset}
                style={[
                  styles.resetBtn,
                  scale === 1 && styles.resetBtnDisabled,
                ]}
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

            <View style={styles.captionSection}>
              <Text style={styles.sectionLabel}>Legenda (Opcional)</Text>
              <TextInput
                style={styles.captionInput}
                placeholder="Adicione uma legenda para sua foto..."
                placeholderTextColor="#94a3b8"
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={150}
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{caption.length}/150</Text>
            </View>

            <View style={styles.instructionsSection}>
              <Text style={styles.instructionsTitle}>Como usar:</Text>
              <Text style={styles.instructionText}>
                • Coloque dois dedos na imagem e afaste para ampliar
              </Text>
              <Text style={styles.instructionText}>
                • Aproxime dois dedos para reduzir
              </Text>
              <Text style={styles.instructionText}>
                • Arraste com um dedo para posicionar (quando ampliado)
              </Text>
              <Text style={styles.instructionText}>
                • Use "Resetar" para voltar ao tamanho original
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onCancel}
              style={styles.cancelBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Salvar Foto</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="none">
        <View style={styles.successOverlay}>
          <Animated.View
            style={[
              styles.successCircle,
              {
                transform: [{ scale: successScale }],
                opacity: successOpacity,
              },
            ]}
          >
            <Check size={60} color="#ffffff" strokeWidth={3} />
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerBtn: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  editorSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  instructionHint: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    alignSelf: 'flex-start',
    fontStyle: 'italic',
  },
  circleContainer: {
    position: 'relative',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    marginBottom: 16,
  },
  circleMask: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  gestureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_RADIUS,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  image: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  circleBorderIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_RADIUS,
    borderWidth: 3,
    borderColor: '#3b82f6',
    zIndex: 20,
  },
  zoomDisplay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 30,
  },
  zoomDisplayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  debugInfo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  debugText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  resetBtn: {
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
  resetBtnDisabled: {
    borderColor: '#f1f5f9',
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  resetBtnTextDisabled: {
    color: '#cbd5e1',
  },
  captionSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 8,
    maxHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
  },
  instructionsSection: {
    backgroundColor: '#fafbfc',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
