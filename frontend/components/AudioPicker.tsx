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
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Music, X, Send, Play, Pause } from 'lucide-react-native';
import { Audio } from 'expo-av';

interface AudioPickerProps {
  onAudioSelected: (uri: string, duration: number, filename: string) => void;
}

export default function AudioPicker({ onAudioSelected }: AudioPickerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<{
    uri: string;
    name: string;
    duration?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const soundRef = React.useRef<Audio.Sound | null>(null);

  const pickAudio = async () => {
    try {
      setIsLoading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Audio,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        let duration = 0;
        try {
          const sound = new Audio.Sound();
          await sound.loadAsync({ uri: asset.uri });
          const status = await sound.getStatusAsync();
          duration = Math.floor((status.durationMillis || 0) / 1000);
          await sound.unloadAsync();
        } catch (e) {
          console.warn('Could not get audio duration:', e);
        }

        const filename = asset.fileName || 'audio.mp3';

        setSelectedAudio({
          uri: asset.uri,
          name: filename,
          duration,
        });
      }
    } catch (error) {
      console.error('Error picking audio:', error);
      Alert.alert('Erro', 'Falha ao selecionar áudio');
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = async () => {
    try {
      if (!selectedAudio) return;

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const sound = new Audio.Sound();
      soundRef.current = sound;

      await sound.loadAsync({ uri: selectedAudio.uri });
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });

      await sound.playAsync();
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Erro', 'Falha ao reproduzir áudio');
    }
  };

  const stopAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
      }
      setIsPlaying(false);
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const sendAudio = async () => {
    try {
      if (!selectedAudio) return;

      setIsSending(true);

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      onAudioSelected(
        selectedAudio.uri,
        selectedAudio.duration || 0,
        selectedAudio.name,
      );

      setSelectedAudio(null);
      setIsVisible(false);
    } catch (error) {
      console.error('Error sending audio:', error);
      Alert.alert('Erro', 'Falha ao enviar áudio');
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
        <Music size={20} color="#3b82f6" strokeWidth={2} />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setIsVisible(false);
          setSelectedAudio(null);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Selecionar Música</Text>
            <TouchableOpacity
              onPress={() => {
                setIsVisible(false);
                setSelectedAudio(null);
              }}
            >
              <X size={24} color="#0f172a" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {!selectedAudio ? (
              <>
                <View style={styles.emptyState}>
                  <Music size={48} color="#cbd5e1" strokeWidth={1.5} />
                  <Text style={styles.emptyText}>
                    Selecione uma música da sua galeria
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={pickAudio}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Music size={20} color="#fff" strokeWidth={2} />
                      <Text style={styles.selectButtonText}>
                        Escolher Música
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.previewContainer}>
                  <View style={styles.audioIcon}>
                    <Music size={32} color="#3b82f6" strokeWidth={2} />
                  </View>

                  <View style={styles.audioInfo}>
                    <Text style={styles.audioName} numberOfLines={2}>
                      {selectedAudio.name}
                    </Text>
                    <Text style={styles.audioDuration}>
                      {formatDuration(selectedAudio.duration)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.playButton,
                    isPlaying && styles.playButtonActive,
                  ]}
                  onPress={isPlaying ? stopAudio : playAudio}
                >
                  {isPlaying ? (
                    <Pause size={32} color="#fff" strokeWidth={2} />
                  ) : (
                    <Play size={32} color="#fff" strokeWidth={2} fill="#fff" />
                  )}
                </TouchableOpacity>

                <Text style={styles.hint}>
                  {isPlaying ? 'Reproduzindo...' : 'Toque para ouvir'}
                </Text>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setSelectedAudio(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Trocar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={sendAudio}
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
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    width: '100%',
  },
  audioIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioInfo: {
    flex: 1,
    gap: 4,
  },
  audioName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  audioDuration: {
    fontSize: 12,
    color: '#64748b',
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
  playButtonActive: {
    opacity: 0.7,
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
