import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Animated,
  ScrollView,
  Keyboard,
} from 'react-native';
import {
  Image as ImageIcon,
  Mic,
  X,
  Globe,
  Lock,
  Users,
  MapPin,
  Smile,
} from 'lucide-react-native';

type CreatePostProps = {
  onCreate: (content: string) => void;
};

type Privacy = 'public' | 'friends' | 'private';

const PRIVACY_OPTIONS = [
  { value: 'public' as Privacy, label: 'Público', icon: Globe, color: '#10b981' },
  { value: 'friends' as Privacy, label: 'Amigos', icon: Users, color: '#0856d6' },
  { value: 'private' as Privacy, label: 'Privado', icon: Lock, color: '#6b7280' },
];

export default function CreatePost({ onCreate }: CreatePostProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [text, setText] = useState('');
  const [privacy, setPrivacy] = useState<Privacy>('public');

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const openModal = useCallback(() => {
    setModalVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const closeModal = useCallback(() => {
    Keyboard.dismiss();
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setText('');
      setShowPrivacy(false);
    });
  }, [fadeAnim]);

  const handlePublish = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    closeModal();
  }, [closeModal, onCreate, text]);

  const selectPrivacy = useCallback((value: Privacy) => {
    setPrivacy(value);
    setShowPrivacy(false);
  }, []);

  const canPublish = text.trim().length > 0;
  const currentPrivacy = PRIVACY_OPTIONS.find(p => p.value === privacy) || PRIVACY_OPTIONS[0];
  const PrivacyIcon = currentPrivacy.icon;

  return (
    <>
      {/* Trigger */}
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={openModal}
        style={styles.trigger}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>V</Text>
        </View>
        <View style={styles.triggerInput}>
          <Text style={styles.placeholder}>No que você está pensando?</Text>
        </View>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="none"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* Backdrop */}
          <Pressable
            style={styles.backdrop}
            onPress={closeModal}
          >
            <Animated.View
              style={[styles.backdropFill, { opacity: fadeAnim }]}
              pointerEvents="none"
            />
          </Pressable>

          {/* Modal Content */}
          <Animated.View
            style={[
              styles.modal,
              {
                opacity: fadeAnim,
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                }],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Criar publicação</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                <X size={22} color="#6b7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              {/* User & Privacy */}
              <View style={styles.user}>
                <View style={styles.avatarLarge}>
                  <Text style={styles.avatarLargeText}>V</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>Você</Text>
                  <TouchableOpacity
                    style={styles.privacyBtn}
                    onPress={() => setShowPrivacy(!showPrivacy)}
                    activeOpacity={0.7}
                  >
                    <PrivacyIcon size={12} color={currentPrivacy.color} strokeWidth={2} />
                    <Text style={[styles.privacyText, { color: currentPrivacy.color }]}>
                      {currentPrivacy.label}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Privacy Options */}
              {showPrivacy && (
                <View style={styles.privacyList}>
                  {PRIVACY_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = privacy === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.privacyItem,
                          isSelected && {
                            backgroundColor: `${option.color}10`,
                            borderColor: `${option.color}30`,
                          }
                        ]}
                        onPress={() => selectPrivacy(option.value)}
                        activeOpacity={0.7}
                      >
                        <Icon
                          size={16}
                          color={option.color}
                          strokeWidth={2}
                        />
                        <Text style={[
                          styles.privacyLabel,
                          isSelected && { color: option.color, fontWeight: '600' }
                        ]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Input */}
              <TextInput
                style={styles.input}
                placeholder="Escreva algo..."
                placeholderTextColor="#9ca3af"
                multiline
                value={text}
                onChangeText={setText}
                textAlignVertical="top"
              />
            </ScrollView>

            {/* Actions - Fixed at bottom */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                <View style={styles.iconWrapper}>
                  <ImageIcon size={20} color="#3b82f6" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                <View style={[styles.iconWrapper, styles.iconWrapperAudio]}>
                  <Mic size={20} color="#ec4899" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                <View style={[styles.iconWrapper, styles.iconWrapperEmoji]}>
                  <Smile size={20} color="#f59e0b" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                <View style={[styles.iconWrapper, styles.iconWrapperLocation]}>
                  <MapPin size={20} color="#10b981" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>

              <View style={styles.spacer} />

              <TouchableOpacity
                style={[styles.publishBtn, !canPublish && styles.publishBtnDisabled]}
                onPress={handlePublish}
                disabled={!canPublish}
                activeOpacity={0.8}
              >
                <Text style={styles.publishText}>Publicar</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Trigger
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#0856d6',
    fontSize: 16,
    fontWeight: '700',
  },
  triggerInput: {
    flex: 1,
    marginLeft: 12,
    height: 40,
    justifyContent: 'center',
  },
  placeholder: {
    fontSize: 15,
    color: '#9ca3af',
  },

  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  user: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  avatarLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    color: '#0856d6',
    fontSize: 18,
    fontWeight: '700',
  },
  userInfo: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  privacyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  privacyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  privacyList: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  privacyLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    color: '#111827',
    minHeight: 120,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  actionBtn: {
    borderRadius: 20,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperAudio: {
    backgroundColor: '#fdf2f8',
  },
  iconWrapperEmoji: {
    backgroundColor: '#fffbeb',
  },
  iconWrapperLocation: {
    backgroundColor: '#f0fdf4',
  },
  spacer: {
    flex: 1,
  },
  publishBtn: {
    backgroundColor: '#0856d6',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: '#0856d6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  publishBtnDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
  },
  publishText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});