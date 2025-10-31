import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image as RNImage,
  Dimensions,
} from 'react-native';
import { Image } from 'react-native';
import { Video } from 'expo-av';
import { X } from 'lucide-react-native';

export type MediaType = 'image' | 'video';

type Props = {
  visible: boolean;
  type: MediaType;
  uri: string;
  onClose: () => void;
};

type ImageDimensions = {
  width: number;
  height: number;
};

export default function MediaViewer({ visible, type, uri, onClose }: Props) {
  const [imageDimensions, setImageDimensions] =
    useState<ImageDimensions | null>(null);

  useEffect(() => {
    if (!visible || type !== 'image' || !uri) return;

    RNImage.getSize(
      uri,
      (width, height) => {
        setImageDimensions({ width, height });
      },
      () => {
        setImageDimensions(null);
      },
    );
  }, [visible, type, uri]);

  const getImageStyle = () => {
    if (!imageDimensions) {
      return styles.media;
    }

    const getScreenDimensions = () => {
      if (Platform.OS === 'web') {
        return { width: typeof window !== 'undefined' ? window.innerWidth : 375, height: typeof window !== 'undefined' ? window.innerHeight : 812 };
      }
      return Dimensions.get('window');
    };
    const { width: screenWidth, height: screenHeight } = getScreenDimensions();
    const aspectRatio = imageDimensions.width / imageDimensions.height;

    // Limitar a no máximo 80% da largura e 70% da altura da tela
    const maxWidth = screenWidth * 0.8;
    const maxHeight = screenHeight * 0.7;

    let width = maxWidth;
    let height = maxWidth / aspectRatio;

    // Se a altura exceder o máximo, ajustar pela altura
    if (height > maxHeight) {
      height = maxHeight;
      width = maxHeight * aspectRatio;
    }

    return {
      width,
      height,
      resizeMode: 'contain' as const,
    };
  };
  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      transparent
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          style={styles.closeBtn}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <X size={22} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.mediaContainer}>
          {type === 'image' && uri ? (
            <Image
              source={{ uri }}
              style={getImageStyle()}
              resizeMode="contain"
            />
          ) : type === 'video' && uri ? (
            <Video
              source={{ uri }}
              style={getImageStyle()}
              resizeMode={
                Platform.OS === 'web' ? ('contain' as any) : undefined
              }
              shouldPlay
              useNativeControls
              isLooping
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 16,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
});
