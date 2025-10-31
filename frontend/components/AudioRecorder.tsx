import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { Mic, Square, Play, Send, X } from 'lucide-react-native';

interface AudioRecorderProps {
  onAudioRecorded: (uri: string, duration: number) => void;
}

export default function AudioRecorder({ onAudioRecorded }: AudioRecorderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout>();

  const requestAudioPermission = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      return permission.granted;
    } catch (error) {
      console.error('Error requesting audio permission:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestAudioPermission();
      if (!hasPermission) {
        alert('Permissão de áudio necessária');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });

      const recording = new Audio.Recording();
      recordingRef.current = recording;

      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      await recording.startAsync();

      setIsRecording(true);
      setRecordingDuration(0);

      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Erro ao iniciar gravação');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      setIsRecording(false);
      setRecordingUri(uri);
    } catch (error) {
      console.error('Error stopping recording:', error);
      alert('Erro ao parar gravação');
    }
  };

  const playRecording = async () => {
    try {
      if (!recordingUri) return;

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        {},
        onPlaybackStatusUpdate,
      );
      soundRef.current = sound;

      setIsPlaying(true);
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing recording:', error);
      alert('Erro ao reproduzir áudio');
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.didJustFinish) {
      setIsPlaying(false);
    }
  };

  const sendAudio = async () => {
    try {
      if (!recordingUri) return;

      setIsSaving(true);
      onAudioRecorded(recordingUri, recordingDuration);

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      setRecordingUri(null);
      setRecordingDuration(0);
      setIsVisible(false);
    } catch (error) {
      console.error('Error sending audio:', error);
      alert('Erro ao enviar áudio');
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

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsVisible(true)}
        style={styles.button}
        activeOpacity={0.7}
      >
        <Mic size={20} color="#3b82f6" strokeWidth={2} />
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
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Gravar Áudio</Text>
            <TouchableOpacity
              onPress={() => {
                if (isRecording) {
                  stopRecording();
                }
                setIsVisible(false);
                resetRecording();
              }}
            >
              <X size={24} color="#0f172a" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {!recordingUri ? (
              <>
                <Text style={styles.durationDisplay}>
                  {formatDuration(recordingDuration)}
                </Text>

                {isRecording && (
                  <View style={styles.recordingIndicator}>
                    <View style={[styles.recordingDot, styles.recordingDotActive]} />
                    <Text style={styles.recordingText}>Gravando...</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.recordButton,
                    isRecording && styles.recordButtonActive,
                  ]}
                  onPress={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? (
                    <Square size={32} color="#fff" strokeWidth={2} fill="#ef4444" />
                  ) : (
                    <Mic size={32} color="#fff" strokeWidth={2} />
                  )}
                </TouchableOpacity>

                <Text style={styles.hint}>
                  {isRecording
                    ? 'Toque para parar'
                    : 'Toque para começar a gravar'}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.previewTitle}>Preview</Text>
                <Text style={styles.durationDisplay}>
                  {formatDuration(recordingDuration)}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.playButton,
                    isPlaying && styles.playButtonActive,
                  ]}
                  onPress={playRecording}
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
                      resetRecording();
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Refazer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={sendAudio}
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
  durationDisplay: {
    fontSize: 48,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#cbd5e1',
  },
  recordingDotActive: {
    backgroundColor: '#ef4444',
    animation: 'pulse',
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  recordButton: {
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
  recordButtonActive: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
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
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
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
