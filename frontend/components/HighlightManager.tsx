import React, { useEffect, useState } from 'react';
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
  FlatList,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  X,
  Plus,
  Camera,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Check,
} from 'lucide-react-native';

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
  const [selectingCover, setSelectingCover] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null,
  );

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

  const pickImage = async (isCover: boolean = false) => {
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
      allowsEditing: false,
      allowsMultiple: !isCover,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      if (isCover) {
        setCover(result.assets[0].uri);
        setSelectingCover(false);
      } else {
        const newPhotos = result.assets.map((asset) => asset.uri);
        setPhotos([...photos, ...newPhotos]);
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    if (selectedPhotoIndex === index) setSelectedPhotoIndex(null);
  };

  const movePhotoUp = (index: number) => {
    if (index === 0) return;
    const newPhotos = [...photos];
    [newPhotos[index - 1], newPhotos[index]] = [
      newPhotos[index],
      newPhotos[index - 1],
    ];
    setPhotos(newPhotos);
  };

  const movePhotoDown = (index: number) => {
    if (index === photos.length - 1) return;
    const newPhotos = [...photos];
    [newPhotos[index + 1], newPhotos[index]] = [
      newPhotos[index],
      newPhotos[index + 1],
    ];
    setPhotos(newPhotos);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Digite o nome do destaque');
      return;
    }
    if (!cover) {
      Alert.alert('Erro', 'Selecione uma capa para o destaque');
      return;
    }
    if (photos.length === 0) {
      Alert.alert('Erro', 'Adicione pelo menos uma foto');
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

  const CoverPlaceholder = () => (
    <View
      style={{
        width: 120,
        height: 120,
        borderRadius: 12,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#cbd5e1',
        borderStyle: 'dashed',
      }}
    >
      <Camera size={32} color="#94a3b8" strokeWidth={2} />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#0f172a" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {highlight ? 'Editar Destaque' : 'Criar Destaque'}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading || !name || !cover || photos.length === 0}
            style={{
              opacity:
                loading || !name || !cover || photos.length === 0 ? 0.5 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#3b82f6" />
            ) : (
              <Check size={24} color="#3b82f6" strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Nome do Destaque */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Nome do Destaque</Text>
            <TextInput
              placeholder="Digite o nome (ex: Viagens, Família, Trabalho)"
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
              style={styles.input}
              maxLength={30}
            />
            <Text style={styles.charCount}>{name.length}/30 caracteres</Text>
          </View>

          {/* Capa */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Capa do Destaque</Text>
            <TouchableOpacity
              onPress={() => pickImage(true)}
              style={styles.coverSelector}
            >
              {cover ? (
                <Image source={{ uri: cover }} style={styles.coverImage} />
              ) : (
                <CoverPlaceholder />
              )}
              {cover && (
                <View style={styles.coverOverlay}>
                  <Camera size={24} color="#ffffff" strokeWidth={2} />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.hint}>Toque para alterar a capa</Text>
          </View>

          {/* Fotos */}
          <View style={styles.section}>
            <View style={styles.photosHeader}>
              <Text style={styles.sectionLabel}>Fotos do Destaque</Text>
              <TouchableOpacity
                onPress={() => pickImage(false)}
                style={styles.addPhotoBtn}
              >
                <Plus size={16} color="#ffffff" strokeWidth={2.5} />
                <Text style={styles.addPhotoBtnText}>Adicionar Foto</Text>
              </TouchableOpacity>
            </View>

            {photos.length === 0 ? (
              <View style={styles.emptyPhotos}>
                <Text style={styles.emptyText}>
                  Nenhuma foto adicionada. Toque em "Adicionar Foto" para
                  começar.
                </Text>
              </View>
            ) : (
              <FlatList
                data={photos}
                keyExtractor={(_, index) => `photo_${index}`}
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                  <View
                    style={[
                      styles.photoItem,
                      selectedPhotoIndex === index && styles.photoItemSelected,
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        setSelectedPhotoIndex(
                          selectedPhotoIndex === index ? null : index,
                        )
                      }
                      style={styles.photoThumbnail}
                    >
                      <Image source={{ uri: item }} style={styles.photo} />
                      <View style={styles.photoIndex}>
                        <Text style={styles.photoIndexText}>{index + 1}</Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.photoControls}>
                      <TouchableOpacity
                        onPress={() => movePhotoUp(index)}
                        disabled={index === 0}
                        style={{ opacity: index === 0 ? 0.3 : 1 }}
                      >
                        <ChevronUp
                          size={20}
                          color="#3b82f6"
                          strokeWidth={2.5}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => movePhotoDown(index)}
                        disabled={index === photos.length - 1}
                        style={{
                          opacity: index === photos.length - 1 ? 0.3 : 1,
                        }}
                      >
                        <ChevronDown
                          size={20}
                          color="#3b82f6"
                          strokeWidth={2.5}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => removePhoto(index)}>
                        <Trash2 size={20} color="#dc2626" strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}

            {photos.length > 0 && (
              <Text style={styles.photosCount}>
                Total: {photos.length} foto(s)
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
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
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  charCount: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
  },
  coverSelector: {
    alignItems: 'center',
    marginBottom: 12,
  },
  coverImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  coverOverlay: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addPhotoBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyPhotos: {
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  photoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  photoItemSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  photoThumbnail: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 6,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoIndex: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoIndexText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  photoControls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photosCount: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
  },
});
