import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Animated,
  PanResponder,
  Vibration,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  X,
  Plus,
  Camera,
  Trash2,
  Check,
  Image as ImageIcon,
  Sparkles,
  GripVertical,
} from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');
const PHOTO_SIZE = (screenWidth - 48) / 3 - 8;

export type Highlight = {
  id: string;
  name: string;
  cover: string;
  photos: string[];
  icon?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (highlight: Highlight) => void;
  highlight?: Highlight;
};

// Componente para foto arrastável
const DraggablePhoto = ({
  photo,
  index,
  onRemove,
  onReplace,
  onDragEnd,
  isDragging,
  totalPhotos,
  layouts,
  onItemLayout,
}: {
  photo: string;
  index: number;
  onRemove: () => void;
  onReplace: () => void;
  onDragEnd: (fromIndex: number, toIndex: number) => void;
  isDragging: boolean;
  totalPhotos: number;
  layouts: Record<number, { x: number; y: number; width: number; height: number }>;
  onItemLayout: (idx: number, layout: { x: number; y: number; width: number; height: number }) => void;
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [isBeingDragged, setIsBeingDragged] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        setIsBeingDragged(true);
        if (Platform.OS === 'ios') {
          Vibration.vibrate(10);
        }
        Animated.spring(scale, {
          toValue: 1.1,
          useNativeDriver: true,
        }).start();
      },

      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),

      onPanResponderRelease: () => {
        setIsBeingDragged(false);

        try {
          const start = layouts[index];
          const dx = (pan.x as any).__getValue ? (pan.x as any).__getValue() : 0;
          const dy = (pan.y as any).__getValue ? (pan.y as any).__getValue() : 0;
          const centerX = (start?.x || 0) + dx + (start?.width || PHOTO_SIZE) / 2;
          const centerY = (start?.y || 0) + dy + (start?.height || PHOTO_SIZE) / 2;

          let targetIndex: number | null = null;
          Object.entries(layouts).forEach(([key, rect]) => {
            const i = Number(key);
            if (i === index) return;
            if (
              centerX >= rect.x &&
              centerX <= rect.x + rect.width &&
              centerY >= rect.y &&
              centerY <= rect.y + rect.height
            ) {
              targetIndex = i;
            }
          });

          if (targetIndex !== null && targetIndex !== index) {
            onDragEnd(index, targetIndex);
          }
        } catch {}

        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
          }),
        ]).start();
      },
    }),
  ).current;

  return (
    <Animated.View
      onLayout={(e) => onItemLayout(index, e.nativeEvent.layout)}
      {...panResponder.panHandlers}
      style={[
        styles.photoContainer,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale }],
          zIndex: isBeingDragged ? 1000 : 1,
          opacity: isBeingDragged ? 0.9 : 1,
        },
      ]}
    >
      <Image source={{ uri: photo }} style={styles.photoGrid} />

      <View style={styles.dragIndicator}>
        <GripVertical size={16} color="#ffffff" strokeWidth={2} />
      </View>

      <View style={styles.photoNumber}>
        <Text style={styles.photoNumberText}>{index + 1}</Text>
      </View>

      <View style={styles.photoActions}>
        <TouchableOpacity
          style={styles.photoActionBtn}
          onPress={onReplace}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Camera size={14} color="#ffffff" strokeWidth={2.5} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.photoActionBtn, styles.deleteBtn]}
          onPress={onRemove}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={14} color="#ffffff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {isBeingDragged && <View style={styles.draggingOverlay} />}
    </Animated.View>
  );
};

export default function HighlightManager({
  visible,
  onClose,
  onSave,
  highlight,
}: Props) {
  const [name, setName] = useState('');
  const [cover, setCover] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [itemLayouts, setItemLayouts] = useState<Record<number, { x: number; y: number; width: number; height: number }>>({});
  const handleItemLayout = (idx: number, layout: { x: number; y: number; width: number; height: number }) => {
    setItemLayouts((prev) => ({ ...prev, [idx]: layout }));
  };

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (highlight) {
      setName(highlight.name);
      setCover(highlight.cover);
      setPhotos([...highlight.photos]);
    } else {
      setName('');
      setCover('');
      setPhotos([]);
    }
  }, [highlight, visible]);

  const pickImage = async (isCover: boolean = false, replaceIndex?: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Permitir acesso à galeria para selecionar fotos.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: isCover,
      aspect: isCover ? [1, 1] : undefined,
      allowsMultiple: !isCover && replaceIndex === undefined,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      if (isCover) {
        setCover(result.assets[0].uri);
      } else if (replaceIndex !== undefined) {
        const newPhotos = [...photos];
        newPhotos[replaceIndex] = result.assets[0].uri;
        setPhotos(newPhotos);
      } else {
        const newPhotos = result.assets.map((asset) => asset.uri);
        setPhotos([...photos, ...newPhotos]);
      }
    }
  };

  const removePhoto = (index: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setPhotos(photos.filter((_, i) => i !== index));
  };

  const reorderPhotos = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newPhotos = [...photos];
    const temp = newPhotos[fromIndex];
    newPhotos[fromIndex] = newPhotos[toIndex];
    newPhotos[toIndex] = temp;
    setPhotos(newPhotos);

    if (Platform.OS === 'ios') {
      Vibration.vibrate(10);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Atenção', 'Digite o nome do destaque');
      return;
    }
    if (!cover) {
      Alert.alert('Atenção', 'Selecione uma capa para o destaque');
      return;
    }
    if (photos.length === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos uma foto');
      return;
    }

    setLoading(true);
    try {
      const newHighlight: Highlight = {
        id: highlight?.id || `highlight_${Date.now()}`,
        name: name.trim(),
        cover,
        photos,
      };
      onSave(newHighlight);
      onClose();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao salvar destaque');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <X size={24} color="#475569" strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <Sparkles size={20} color="#3b82f6" strokeWidth={2} />
            <Text style={styles.title}>
              {highlight ? 'Editar Destaque' : 'Novo Destaque'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={loading || !name || !cover || photos.length === 0}
            style={[
              styles.headerBtn,
              styles.saveBtn,
              {
                opacity:
                  loading || !name || !cover || photos.length === 0 ? 0.3 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#3b82f6" size="small" />
            ) : (
              <Check size={24} color="#3b82f6" strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Nome do Destaque</Text>
              <Text style={styles.charCount}>{name.length}/30</Text>
            </View>
            <TextInput
              placeholder="Ex: Viagens, Família, Trabalho..."
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
              style={styles.input}
              maxLength={30}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Capa do Destaque</Text>
            <TouchableOpacity
              onPress={() => pickImage(true)}
              style={styles.coverButton}
              activeOpacity={0.8}
            >
              {cover ? (
                <>
                  <Image source={{ uri: cover }} style={styles.coverImage} />
                  <View style={styles.coverOverlay}>
                    <View style={styles.coverEditBtn}>
                      <Camera size={20} color="#ffffff" strokeWidth={2} />
                      <Text style={styles.coverEditText}>Alterar</Text>
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Camera size={32} color="#94a3b8" strokeWidth={1.5} />
                  <Text style={styles.coverPlaceholderText}>
                    Toque para adicionar capa
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.photosHeader}>
              <Text style={styles.cardTitle}>Fotos ({photos.length})</Text>
              <TouchableOpacity
                onPress={() => pickImage(false)}
                style={styles.addPhotoBtn}
                activeOpacity={0.7}
              >
                <Plus size={18} color="#ffffff" strokeWidth={2.5} />
                <Text style={styles.addPhotoBtnText}>Adicionar</Text>
              </TouchableOpacity>
            </View>

            {photos.length === 0 ? (
              <TouchableOpacity
                style={styles.emptyState}
                onPress={() => pickImage(false)}
                activeOpacity={0.7}
              >
                <ImageIcon size={48} color="#cbd5e1" strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>Nenhuma foto ainda</Text>
                <Text style={styles.emptyText}>
                  Toque para adicionar suas primeiras fotos
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.dragHint}>
                  💡 Segure e arraste para reorganizar
                </Text>
                <View style={styles.photosGrid}>
                  {photos.map((photo, index) => (
                    <DraggablePhoto
                      key={`photo_${index}_${photo}`}
                      photo={photo}
                      index={index}
                      onRemove={() => removePhoto(index)}
                      onReplace={() => pickImage(false, index)}
                      onDragEnd={reorderPhotos}
                      isDragging={false}
                      totalPhotos={photos.length}
                      layouts={itemLayouts}
                      onItemLayout={handleItemLayout}
                    />
                  ))}

                  {photos.length < 30 && (
                    <TouchableOpacity
                      style={styles.addPhotoInline}
                      onPress={() => pickImage(false)}
                      activeOpacity={0.7}
                    >
                      <Plus size={24} color="#94a3b8" strokeWidth={2} />
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
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
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  saveBtn: {
    backgroundColor: '#eff6ff',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  coverButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#e2e8f0',
  },
  coverOverlay: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEditBtn: {
    alignItems: 'center',
    gap: 4,
  },
  coverEditText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  coverPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    gap: 8,
  },
  coverPlaceholderText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  photosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addPhotoBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  dragHint: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
    textAlign: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoContainer: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  photoGrid: {
    width: '100%',
    height: '100%',
  },
  dragIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    padding: 4,
  },
  photoNumber: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  photoNumberText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  photoActions: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    gap: 4,
  },
  photoActionBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 6,
  },
  deleteBtn: {
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
  },
  draggingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 12,
  },
  addPhotoInline: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
