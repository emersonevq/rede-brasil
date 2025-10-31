import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import { Audio } from 'expo-av';
import { Mic, Square, Send, X, Trash2 } from 'lucide-react-native';

interface AudioRecorderProps {
  onAudioRecorded: (uri: string, duration: number) => void;
}

export default function AudioRecorder({ onAudioRecorded }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const panResponderRef = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderMove: () => {},
      onPanResponderRelease: () => {
        if (isRecording) {
          stopRecording();
        }
      },
      onPanResponderTerminate: () => {
        if (isRecording) {
          stopRecording();
        }
      },
    }),
  );

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

  const sendAudio = async () => {
    try {
      if (!recordingUri) return;

      setIsSaving(true);
      onAudioRecorded(recordingUri, recordingDuration);

      setRecordingUri(null);
      setRecordingDuration(0);
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
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Show inline recording UI when recording or has a recording
  if (isRecording || recordingUri) {
    return (
      <View style={styles.inlineContainer}>
        <View style={styles.inlineRecordingBar}>
          <View style={styles.recordingIndicator}>
            <View
              style={[styles.recordingDot, styles.recordingDotActive]}
            />
            <Text style={styles.recordingText}>
              {isRecording ? `Gravando... ${formatDuration(recordingDuration)}` : `Áudio: ${formatDuration(recordingDuration)}`}
            </Text>
          </View>

          <View style={styles.inlineActionButtons}>
            {recordingUri && !isRecording && (
              <>
                <TouchableOpacity
                  style={styles.inlineButton}
                  onPress={resetRecording}
                >
                  <Trash2 size={18} color="#ef4444" strokeWidth={2} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.inlineButton, styles.sendInlineButton]}
                  onPress={sendAudio}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Send size={18} color="#fff" strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      {...panResponderRef.current.panHandlers}
      onPress={startRecording}
      onLongPress={startRecording}
      style={styles.button}
      activeOpacity={0.7}
    >
      <Mic size={20} color="#3b82f6" strokeWidth={2} />
    </TouchableOpacity>
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
  inlineContainer: {
    width: '100%',
  },
  inlineRecordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#cbd5e1',
  },
  recordingDotActive: {
    backgroundColor: '#ef4444',
  },
  recordingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ef4444',
  },
  inlineActionButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  inlineButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  sendInlineButton: {
    backgroundColor: '#3b82f6',
  },
});
