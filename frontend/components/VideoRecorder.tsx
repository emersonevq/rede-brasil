import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Video } from 'expo-av';
import { Video as VideoIcon, Square, Play, Send, X } from 'lucide-react-native';

interface VideoRecorderProps {
  onVideoRecorded: (uri: string, duration: number) => void;
}

const MAX_DURATION_MS = 20000; // 20 seconds

export default function VideoRecorder({ onVideoRecorded }: VideoRecorderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const videoRef = useRef<Video>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout>();

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

  const handlePermission = async () => {
    if (!permission) {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert('Permissão', 'Câmera necessária para gravar vídeo');
        return false;
      }
    }
    return permission?.granted ?? false;
  };

  const startRecording = async () => {
    try {
      const hasPermission = await handlePermission();
      if (!hasPermission) return;

      if (!cameraRef.current) return;

      setIsRecording(true);
      setRecordingDuration(0);

      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_DURATION_MS / 1000,
        maxFileSize: 50 * 1024 * 1024,
        quality: '720p' as any,
      });

      setRecordingUri(video.uri);
      setIsRecording(false);
    } catch (error) {
      console.error('Error recording video:', error);
      setIsRecording(false);
      Alert.alert('Erro', 'Erro ao gravar vídeo');
    }
  };

  const stopRecording = async () => {
    try {
      if (!cameraRef.current) return;
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  useEffect(() => {
    if (!isRecording) return;

    durationIntervalRef.current = setInterval(() => {
      setRecordingDuration((prev) => {
        if (prev >= 20) {
          stopRecording();
          return 20;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isRecording]);

  const playVideo = async () => {
    try {
      if (!recordingUri || !videoRef.current) return;

      setIsPlaying(true);
      await videoRef.current.playAsync();
    } catch (error) {
      console.error('Error playing video:', error);
      Alert.alert('Erro', 'Erro ao reproduzir vídeo');
    }
  };

  const sendVideo = async () => {
    try {
      if (!recordingUri) return;

      setIsSaving(true);
      onVideoRecorded(recordingUri, recordingDuration);

      setRecordingUri(null);
      setRecordingDuration(0);
      setIsVisible(false);
    } catch (error) {
      console.error('Error sending video:', error);
      Alert.alert('Erro', 'Erro ao enviar vídeo');
    } finally {
      setIsSaving(false);
    }
  };

  const resetRecording = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    setRecordingUri(null);
    setRecordingDuration(0);
    setIsPlaying(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const hasPermission = permission?.granted ?? false;

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
          if (isRecording) {
            stopRecording();
          }
          setIsVisible(false);
          resetRecording();
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          {!recordingUri && hasPermission ? (
            <>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Gravar Vídeo</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (isRecording) {
                      stopRecording();
                    }
                    setIsVisible(false);
                    resetRecording();
                  }}
                >
                  <X size={24} color="#fff" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <CameraView ref={cameraRef} style={styles.camera} />

              <View style={styles.bottomControls}>
                <View style={styles.durationContainer}>
                  <Text style={styles.durationText}>
                    {formatDuration(recordingDuration)} / 00:20
                  </Text>
                  {isRecording && (
                    <View style={styles.recordingDot} />
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.recordButton,
                    isRecording && styles.recordButtonActive,
                  ]}
                  onPress={
                    isRecording
                      ? stopRecording
                      : startRecording
                  }
                  disabled={recordingDuration >= 20}
                >
                  {isRecording ? (
                    <Square size={32} color="#fff" strokeWidth={2} fill="#ef4444" />
                  ) : (
                    <VideoIcon size={32} color="#fff" strokeWidth={2} />
                  )}
                </TouchableOpacity>

                <Text style={styles.hint}>
                  {isRecording ? 'Toque para parar' : 'Toque para gravar'}
                </Text>
              </View>
            </>
          ) : !recordingUri ? (
            <View style={styles.permissionContainer}>
              <VideoIcon size={48} color="#cbd5e1" strokeWidth={1.5} />
              <Text style={styles.permissionText}>
                Permissão de câmera necessária
              </Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={() => requestCameraPermission()}
              >
                <Text style={styles.permissionButtonText}>
                  Conceder Permissão
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Preview</Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsVisible(false);
                    resetRecording();
                  }}
                >
                  <X size={24} color="#0f172a" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <View style={styles.videoPreviewContainer}>
                <Video
                  ref={videoRef}
                  source={{ uri: recordingUri }}
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

              <View style={styles.previewControls}>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={playVideo}
                  disabled={isPlaying}
                >
                  <Play size={32} color="#fff" strokeWidth={2} fill="#fff" />
                </TouchableOpacity>

                <View style={styles.previewActionButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      resetRecording();
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
                        <Send size={20} color="#fff" strokeWidth={2} />
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  bottomControls: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 16,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  recordButtonActive: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  hint: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  permissionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    marginTop: 8,
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  videoPreviewContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
  },
  previewControls: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 16,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  previewActionButtons: {
    flexDirection: 'row',
    gap: 12,
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
