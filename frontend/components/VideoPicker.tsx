import React, { useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  View,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { Video as VideoIcon, X, Send, Play } from 'lucide-react-native';

interface VideoPickerProps {
  onVideoSelected: (uri: string, duration: number) => void;
}

export default function VideoPicker({ onVideoSelected }: VideoPickerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{
    uri: string;
    duration?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const videoRef = React.useRef<Video>(null);

  const pickVideo = async () => {
    try {
      setIsLoading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const durationSeconds = asset.duration
          ? Math.floor(asset.duration / 1000)
          : 0;

        setSelectedVideo({
          uri: asset.uri,
          duration: durationSeconds,
        });
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Erro', 'Falha ao selecionar vídeo');
    } finally {
      setIsLoading(false);
    }
  };

  const playVideo = async () => {
    try {
      if (!selectedVideo || !videoRef.current) return;
      setIsPlaying(true);
      await videoRef.current.playAsync();
    } catch (error) {
      console.error('Error playing video:', error);
      Alert.alert('Erro', 'Falha ao reproduzir vídeo');
    }
  };

  const sendVideo = async () => {
    try {
      if (!selectedVideo) return;

      setIsSending(true);

      onVideoSelected(selectedVideo.uri, selectedVideo.duration || 0);

      setSelectedVideo(null);
      setIsVisible(false);
    } catch (error) {
      console.error('Error sending video:', error);
      Alert.alert('Erro', 'Falha ao enviar vídeo');
    } finally {
      setIsSending(false);
    }
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsVisible(true)}
        style={styles.button}
        activeOpacity={0.7}
      >
        <VideoIcon size={20} color="#3b82f6" strokeWidth={2} />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setIsVisible(false);
          setSelectedVideo(null);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Selecionar Vídeo</Text>
            <TouchableOpacity
              onPress={() => {
                setIsVisible(false);
                setSelectedVideo(null);
              }}
            >
              <X size={24} color="#0f172a" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {!selectedVideo ? (
              <>
                <View style={styles.emptyState}>
                  <VideoIcon size={48} color="#cbd5e1" strokeWidth={1.5} />
                  <Text style={styles.emptyText}>
                    Selecione um vídeo da sua galeria
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={pickVideo}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <VideoIcon size={20} color="#fff" strokeWidth={2} />
                      <Text style={styles.selectButtonText}>
                        Escolher Vídeo
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.videoPreviewContainer}>
                  <Video
                    ref={videoRef}
                    source={{ uri: selectedVideo.uri }}
                    style={styles.videoPreview}
                    useNativeControls
                    resizeMode="contain"
                    onPlaybackStatusUpdate={(status) => {
                      if (status.isLoaded && status.didJustFinish) {
                        setIsPlaying(false);
                      }
                    }}
                  />
                </View>

                <View style={styles.videoDurationContainer}>
                  <Text style={styles.videoDuration}>
                    Duração: {formatDuration(selectedVideo.duration)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.playButton}
                  onPress={playVideo}
                  disabled={isPlaying}
                >
                  <Play size={32} color="#fff" strokeWidth={2} fill="#fff" />
                </TouchableOpacity>

                <Text style={styles.hint}>
                  {isPlaying ? 'Reproduzindo...' : 'Toque para ouvir'}
                </Text>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setSelectedVideo(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Trocar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={sendVideo}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Send size={20} color="#fff" strokeWidth={2} />
                        <Text style={styles.sendButtonText}>Enviar</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 24,
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    gap: 8,
    width: '100%',
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  videoPreviewContainer: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
  },
  videoDurationContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  videoDuration: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  playButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  hint: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  sendButton: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
