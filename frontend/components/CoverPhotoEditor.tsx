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
  ScrollView,
  TextInput,
  Animated,
  Keyboard,
  Pressable,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import {
  Download,
  X,
  RotateCcw,
  FileText,
  ChevronDown,
} from 'lucide-react-native';

export type CoverTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export type CoverData = CoverTransform & {
  imageUri: string;
  description?: string;
};

type Props = {
  imageUri: string;
  isVisible: boolean;
  height?: number;
  initial?: Partial<CoverData>;
  onSave: (data: CoverData) => void;
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

// Modal de descrição
const DescriptionModal = ({
  visible,
  description,
  onClose,
  onSave,
}: {
  visible: boolean;
  description: string;
  onClose: () => void;
  onSave: (description: string) => void;
}) => {
  const [text, setText] = useState(description);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSave = () => {
    onSave(text);
    onClose();
  };

  const handleClose = () => {
    setText(description);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="none" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.descModalContainer}
      >
        <Pressable style={styles.descBackdrop} onPress={handleClose}>
          <Animated.View
            style={[styles.descBackdropFill, { opacity: fadeAnim }]}
            pointerEvents="none"
          />
        </Pressable>

        <Animated.View
          style={[
            styles.descModal,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.descHeader}>
            <Text style={styles.descTitle}>Descrição da Capa</Text>
            <TouchableOpacity onPress={handleClose} style={styles.descCloseBtn}>
              <X size={22} color="#6b7280" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.descContent}>
            <TextInput
              style={styles.descInput}
              placeholder="Adicione uma descrição bonita para sua capa..."
              placeholderTextColor="#9ca3af"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
            <Text style={styles.descCharCount}>
              {text.length}/1.000 caracteres
            </Text>
          </View>

          <View style={styles.descActions}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.descCancelBtn}
            >
              <Text style={styles.descCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.descSaveBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.descSaveText}>Concluído</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

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
  const [description, setDescription] = useState(initial?.description ?? '');
  const [descriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

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
    onSave({ imageUri, scale, offsetX, offsetY, description });
  };

  const descriptionPreview =
    description.length > 0
      ? description.length > 60
        ? description.substring(0, 60) + '...'
        : description
      : 'Adicione uma descrição';

  return (
    <>
      <Modal visible={isVisible} animationType="slide">
        <SafeAreaView style={styles.container}>
          {/* Header Melhorado */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onCancel}
              style={styles.headerBtn}
              activeOpacity={0.7}
            >
              <X size={24} color="#475569" strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Editar Capa</Text>
              <Text style={styles.headerSubtitle}>
                Ajuste o enquadramento perfeito
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.headerBtnSave}
              activeOpacity={0.7}
            >
              <Download size={24} color="#ffffff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Editor de Imagem */}
            <View style={styles.editorCard}>
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Prévia da Capa</Text>

                <View
                  style={[styles.rectContainer, { height }]}
                  onLayout={() => setImageLoaded(true)}
                >
                  <View
                    style={[styles.rectMask, { height, width: SCREEN_WIDTH }]}
                  >
                    {imageLoaded && (
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
                        resizeMode="contain"
                      />
                    )}
                    <View
                      style={styles.gestureOverlay}
                      {...panResponder.panHandlers}
                    />

                    {/* Overlay de Instruções */}
                    <View style={styles.instructionOverlay}>
                      <Text style={styles.instructionText}>Use dois dedos para ampliar</Text>
                    </View>
                  </View>

                  {/* Grade Visual */}
                  <View style={styles.gridLines}>
                    <View style={styles.gridLine} />
                    <View style={styles.gridLine} />
                  </View>
                </View>

                {/* Controles */}
                <View style={styles.controls}>
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
                      color={scale === 1 ? '#cbd5e1' : '#ffffff'}
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

                  <View style={styles.scaleInfo}>
                    <Text style={styles.scaleLabel}>Zoom</Text>
                    <Text style={styles.scaleValue}>
                      {Math.round(scale * 100)}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Card de Descrição */}
            <View style={styles.descriptionCard}>
              <View style={styles.descriptionHeader}>
                <View style={styles.descriptionTitleContainer}>
                  <FileText size={18} color="#3b82f6" strokeWidth={2} />
                  <Text style={styles.descriptionCardTitle}>Descrição</Text>
                </View>
                <Text style={styles.descriptionCharLimit}>
                  {description.length}/1.000
                </Text>
              </View>

              <TouchableOpacity
                style={styles.descriptionInput}
                onPress={() => setDescriptionModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.descriptionText,
                    !description && styles.descriptionPlaceholder,
                  ]}
                >
                  {descriptionPreview}
                </Text>
                <ChevronDown size={20} color="#94a3b8" strokeWidth={2} />
              </TouchableOpacity>

              <Text style={styles.descriptionHint}>
                Adicione uma descrição bonita para sua capa (opcional)
              </Text>
            </View>

            {/* Espaçamento */}
            <View style={{ height: 20 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal de Descrição */}
      <DescriptionModal
        visible={descriptionModalVisible}
        description={description}
        onClose={() => setDescriptionModalVisible(false)}
        onSave={(newDescription) => setDescription(newDescription)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 32,
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
    zIndex: 100,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  headerBtnSave: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  editorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  previewSection: {
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  rectContainer: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    marginBottom: 12,
  },
  rectMask: {
    overflow: 'hidden',
    position: 'relative',
  },
  image: {},
  gestureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  instructionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  gridLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resetBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  resetBtnTextDisabled: {
    color: '#ffffff',
  },
  scaleInfo: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  scaleLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  scaleValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  descriptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  descriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  descriptionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  descriptionCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  descriptionCharLimit: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  descriptionInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  descriptionText: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 20,
  },
  descriptionPlaceholder: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  descriptionHint: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },

  // Descrição Modal
  descModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  descBackdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  descBackdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  descModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  descHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  descTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  descCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  descContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: 300,
  },
  descInput: {
    fontSize: 16,
    color: '#111827',
    minHeight: 150,
    paddingVertical: 12,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  descCharCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
  },
  descActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  descCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  descCancelText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '700',
  },
  descSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#0856d6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  descSaveText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
