import React, { useState, useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Modal,
  View,
  Text,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Video } from 'expo-av';
import { Video as VideoIcon, X, Send, Play, Square } from 'lucide-react-native';

interface VideoMediaProps {
  onVideoSelected: (uri: string, duration: number) => void;
}

const MAX_DURATION_MS = 20000; // 20 seconds

export default function VideoMedia({ onVideoSelected }: VideoMediaProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mode, setMode] = useState<'gallery' | 'camera' | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{
    uri: string;
    duration?: number;
  } | null>(null);
  
  // Camera recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const videoRef = useRef<Video>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    const result = await requestPermission();
    return result.granted;
  };

  const pickFromGallery = async () => {
    try {
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
        setMode('gallery');
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Erro', 'Falha ao selecionar vídeo');
    }
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert('Permissão necessária', 'Câmera não autorizada');
        return;
      }

      if (!cameraRef.current) return;

      setIsRecording(true);
      setRecordingDuration(0);
      setMode('camera');

      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= MAX_DURATION_MS / 1000) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_DURATION_MS / 1000,
      });

      if (video?.uri) {
        setRecordingUri(video.uri);
        setIsRecording(false);
        setSelectedVideo({
          uri: video.uri,
          duration: recordingDuration,
        });
      }
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Erro', 'Falha ao gravar vídeo');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (cameraRef.current) {
        await cameraRef.current.stopAndPausePreview();
      }
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const playVideo = async () => {
    try {
      if (!selectedVideo || !videoRef.current) return;
      await videoRef.current.playAsync();
    } catch (error) {
      console.error('Error playing video:', error);
      Alert.alert('Erro', 'Falha ao reproduzir vídeo');
    }
  };

  const sendVideo = async () => {
    try {
      if (!selectedVideo) return;

      setIsSaving(true);
      onVideoSelected(selectedVideo.uri, selectedVideo.duration || 0);

      setSelectedVideo(null);
      setMode(null);
      setIsVisible(false);
    } catch (error) {
      console.error('Error sending video:', error);
      Alert.alert('Erro', 'Falha ao enviar vídeo');
    } finally {
      setIsSaving(false);
    }
  };

  const resetAndChooseMode = () => {
    setSelectedVideo(null);
    setMode(null);
  };

  const showMediaOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Câmera', 'Galeria'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            startRecording();
            setIsVisible(true);
          } else if (buttonIndex === 2) {
            pickFromGallery().then(() => {
              setIsVisible(true);
            });
          }
        },
      );
    } else {
      Alert.alert('Enviar vídeo', 'Escolha uma opção', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Câmera',
          onPress: () => {
            setIsVisible(true);
            startRecording();
          },
        },
        {
          text: 'Galeria',
          onPress: () => {
            pickFromGallery().then(() => {
              setIsVisible(true);
            });
          },
        },
      ]);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <>
      <TouchableOpacity
        onPress={showMediaOptions}
        style={styles.button}
        activeOpacity={0.7}
      >
        <VideoIcon size={20} color="#3b82f6" strokeWidth={2} />
      </TouchableOpacity>

      <Modal visible={isVisible} transparent animationType="slide">
        <SafeAreaView style={styles.container}>
          {/* Camera Mode */}
          {mode === 'camera' && !selectedVideo && (
            <>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Gravar Vídeo</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (isRecording) {
                      stopRecording();
                    }
                    setIsVisible(false);
                    resetAndChooseMode();
                  }}
                >
                  <X size={24} color="#0f172a" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <View style={styles.cameraContainer}>
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing="front"
                  videoStabilizationMode="auto"
                />
              </View>

              <View style={styles.controls}>
                <Text style={styles.duration}>
                  {formatDuration(recordingDuration)}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.recordButton,
                    isRecording && styles.recordButtonActive,
                  ]}
                  onPress={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? (
                    <Square
                      size={32}
                      color="#fff"
                      fill="#ef4444"
                      strokeWidth={0}
                    />
                  ) : (
                    <VideoIcon size={32} color="#fff" strokeWidth={2} />
                  )}
                </TouchableOpacity>

                <Text style={styles.hint}>
                  {isRecording ? 'Toque para parar' : 'Toque para gravar'}
                </Text>
              </View>
            </>
          )}

          {/* Preview Mode */}
          {selectedVideo && (
            <>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Prévia</Text>
                <TouchableOpacity
                  onPress={() => {
                    resetAndChooseMode();
                  }}
                >
                  <X size={24} color="#0f172a" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <View style={styles.previewContainer}>
                <Video
                  ref={videoRef}
                  source={{ uri: selectedVideo.uri }}
                  style={styles.video}
                  useNativeControls
                  isLooping
                />
              </View>

              <View style={styles.previewControls}>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={playVideo}
                >
                  <Play size={24} color="#fff" fill="#fff" strokeWidth={0} />
                </TouchableOpacity>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      resetAndChooseMode();
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Refazer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={sendVideo}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Send size={18} color="#fff" strokeWidth={2} />
                        <Text style={styles.sendButtonText}>Enviar</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
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
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  controls: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 20,
    backgroundColor: '#0f172a',
  },
  duration: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: {
    backgroundColor: '#ef4444',
  },
  hint: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
    width: '100%',
  },
  previewControls: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
    backgroundColor: '#0f172a',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  sendButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
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
