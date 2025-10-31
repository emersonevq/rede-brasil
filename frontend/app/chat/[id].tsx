import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Send, Plus, Smile, Mic, X } from 'lucide-react-native';
import {
  getCurrentUser,
  getConversationMessages,
  uploadChatFile,
  API_BASE_URL,
  getToken,
  sendChatMessage,
} from '../../utils/api';
import { getSocket } from '../../utils/websocket';
import * as ImagePicker from 'expo-image-picker';
import AudioRecorder from '../../components/AudioRecorder';
import AudioPicker from '../../components/AudioPicker';
import VideoRecorder from '../../components/VideoRecorder';
import VideoPicker from '../../components/VideoPicker';

const getDimensions = () => {
  if (Platform.OS === 'web') {
    return { width: typeof window !== 'undefined' ? window.innerWidth : 375 };
  }
  return Dimensions.get('window');
};
const { width } = getDimensions();

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  profile_photo?: string;
}

interface Reaction {
  emoji: string;
  users: User[];
}

interface Message {
  id: number;
  conversation_id: number;
  content: string;
  content_type: 'text' | 'image' | 'audio' | 'gif';
  media_url?: string;
  is_read: boolean;
  created_at: string;
  sender: User;
  reactions?: Reaction[];
}

interface Conversation {
  id: number;
  name?: string;
  is_group: boolean;
  participants: User[];
  created_at: string;
  updated_at: string;
}

const MessageBubble = ({
  message,
  isOwn,
  onEdit,
  onDelete,
  onReact,
  isSelected,
  onSelect,
  showEmojiPicker,
  onShowEmojiPicker,
  emojis,
}: {
  message: Message;
  isOwn: boolean;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: number) => void;
  onReact?: (emoji: string, messageId: number) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  showEmojiPicker?: boolean;
  onShowEmojiPicker?: (messageId: number | null) => void;
  emojis?: string[];
}) => {
  const messageTime = new Date(message.created_at);
  const timeStr = messageTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const [showActions, setShowActions] = useState(false);

  return (
    <View
      style={[
        styles.messageBubbleContainer,
        isOwn && styles.messageBubbleContainerOwn,
      ]}
    >
      {!isOwn && (
        <Image
          source={{
            uri:
              message.sender.profile_photo ||
              `https://i.pravatar.cc/150?u=${message.sender.id}`,
          }}
          style={styles.messageSenderAvatar}
        />
      )}

      <TouchableOpacity
        style={[
          styles.messageBubble,
          isOwn && styles.messageBubbleOwn,
          isSelected && styles.messageBubbleSelected,
        ]}
        onLongPress={() => setShowActions(!showActions)}
        activeOpacity={0.8}
      >
        {message.content_type === 'text' && (
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
            {message.content}
          </Text>
        )}

        {message.content_type === 'image' && message.media_url && (
          <Image
            source={{ uri: message.media_url }}
            style={styles.messageImage}
            onError={(e) => console.log('Image load error:', e)}
          />
        )}

        {message.content_type === 'audio' && (
          <View style={styles.audioMessageContainer}>
            <Mic size={20} color={isOwn ? '#fff' : '#3b82f6'} />
            <Text style={[styles.audioLabel, isOwn && styles.audioLabelOwn]}>
              {message.content}
            </Text>
          </View>
        )}

        {message.content_type === 'gif' && message.media_url && (
          <Image
            source={{ uri: message.media_url }}
            style={styles.messageGif}
            onError={(e) => console.log('GIF load error:', e)}
          />
        )}

        <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
          {timeStr}
        </Text>

        {message.reactions && message.reactions.length > 0 && (
          <View style={styles.reactionsContainer}>
            {message.reactions.map((reaction, idx) => (
              <View key={idx} style={styles.reactionBubble}>
                <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                <Text style={styles.reactionCount}>
                  {reaction.users.length}
                </Text>
              </View>
            ))}
          </View>
        )}

        {showActions && (
          <View style={styles.messageActions}>
            {onReact && (
              <View style={styles.emojiRow}>
                {emojis?.slice(0, 5).map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={styles.emojiBtn}
                    onPress={() => {
                      onReact(emoji, message.id);
                      setShowActions(false);
                    }}
                  >
                    <Text style={styles.emoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {isOwn && onEdit && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  onEdit(message);
                  setShowActions(false);
                }}
              >
                <Text style={styles.actionBtnText}>Editar</Text>
              </TouchableOpacity>
            )}
            {isOwn && onDelete && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnDelete]}
                onPress={() => {
                  onDelete(message.id);
                  setShowActions(false);
                }}
              >
                <Text style={styles.actionBtnTextDelete}>Deletar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<User[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const flatListRef = useRef<FlatList>(null);
  const socket = getSocket();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(
    null,
  );
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionTargetId, setReactionTargetId] = useState<number | null>(null);

  const emojis = ['👍', '❤️', '😂', '😢', '😱', '👎', '🔥', '⭐', '🎉', '💯'];

  // Get current user
  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    })();
  }, []);

  // Load conversation and messages
  useEffect(() => {
    const loadConversation = async () => {
      try {
        setIsLoading(true);
        const messages = await getConversationMessages(parseInt(id as string));

        // Create a mock conversation object (in production this would come from API)
        setConversation({
          id: parseInt(id as string),
          is_group: false,
          participants: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        setMessages(messages);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadConversation();
    }
  }, [id]);

  // Setup websocket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      if (data.conversation_id === parseInt(id as string)) {
        // Map the data to Message format
        const message: Message = {
          id: data.id,
          conversation_id: data.conversation_id,
          content: data.content,
          content_type: data.content_type || 'text',
          media_url: data.media_url,
          is_read: data.is_read || false,
          created_at: data.created_at,
          sender: {
            id: data.sender?.id || 0,
            username: data.sender?.name || '',
            first_name: data.sender?.name?.split(' ')[0] || '',
            last_name: data.sender?.name?.split(' ')[1] || '',
            profile_photo: data.sender?.avatar,
          },
        };
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleMessageSent = (data: any) => {
      if (data.conversation_id === parseInt(id as string)) {
        // Message was successfully sent and confirmed by server
        console.log('Message sent confirmation:', data);
      }
    };

    const handleTypingStart = (data: any) => {
      if (data.conversation_id === parseInt(id as string)) {
        const typingUser: User = {
          id: data.user_id,
          username: data.user_name,
          first_name: data.user_name?.split(' ')[0] || '',
          last_name: data.user_name?.split(' ')[1] || '',
        };
        setTypingUsers((prev) => {
          if (!prev.find((u) => u.id === data.user_id)) {
            return [...prev, typingUser];
          }
          return prev;
        });
      }
    };

    const handleTypingStop = (data: any) => {
      if (data.conversation_id === parseInt(id as string)) {
        setTypingUsers((prev) => prev.filter((u) => u.id !== data.user_id));
      }
    };

    const handleMessageReaction = (data: any) => {
      if (data.conversation_id === parseInt(id as string)) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === data.message_id) {
              const reactions = msg.reactions || [];
              const existingReaction = reactions.find(
                (r) => r.emoji === data.emoji,
              );
              if (existingReaction) {
                existingReaction.users.push({
                  id: data.user_id,
                  username: '',
                  first_name: '',
                  last_name: '',
                });
              } else {
                reactions.push({
                  emoji: data.emoji,
                  users: [
                    {
                      id: data.user_id,
                      username: '',
                      first_name: '',
                      last_name: '',
                    },
                  ],
                });
              }
              return { ...msg, reactions };
            }
            return msg;
          }),
        );
      }
    };

    socket.on('chat_message', handleNewMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);
    socket.on('message_reaction', handleMessageReaction);

    return () => {
      socket.off('chat_message', handleNewMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
      socket.off('message_reaction', handleMessageReaction);
    };
  }, [socket, id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    try {
      setIsSending(true);

      if (editingMessageId) {
        // Edit existing message
        if (socket) {
          const messageData = {
            message_id: editingMessageId,
            content: inputText,
          };
          socket.emit('edit_message', messageData);
        }
        setEditingMessageId(null);
        setEditingContent('');
      } else {
        // Send new message via WebSocket or fallback to REST
        if (socket) {
          const messageData = {
            conversation_id: parseInt(id as string),
            content: inputText,
            content_type: 'text',
          };
          socket.emit('chat_message', messageData);
        } else {
          // Fallback to REST API
          await sendChatMessage(parseInt(id as string), inputText, 'text');
        }
      }

      setInputText('');
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (text: string) => {
    setInputText(text);

    if (!socket) return;

    if (!isTyping && text.length > 0) {
      setIsTyping(true);
      socket.emit('typing', {
        conversation_id: parseInt(id as string),
        typing: true,
      });
    } else if (isTyping && text.length === 0) {
      setIsTyping(false);
      socket.emit('typing', {
        conversation_id: parseInt(id as string),
        typing: false,
      });
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socket?.emit('typing', {
          conversation_id: parseInt(id as string),
          typing: false,
        });
      }
    }, 3000);
  };

  const handleAddMedia = async (type: 'image' | 'audio' | 'gif') => {
    if (!socket) return;

    try {
      setIsSending(true);

      if (type === 'image') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          const filename = asset.fileName || 'image.jpg';

          const uploadData = await uploadChatFile({
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: filename,
          });

          const messageData = {
            conversation_id: parseInt(id as string),
            content: '📷 Imagem',
            content_type: 'image',
            media_url: uploadData.media_url,
          };
          socket.emit('chat_message', messageData);
        }
      } else if (type === 'audio') {
        // For audio, show a simple message for now
        const messageData = {
          conversation_id: parseInt(id as string),
          content: '🎙️ Mensagem de áudio',
          content_type: 'audio',
        };
        socket.emit('chat_message', messageData);
      }
    } catch (error) {
      console.error('Error adding media:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleAudioRecorded = async (uri: string, duration: number) => {
    try {
      setIsSending(true);

      const uploadData = await uploadChatFile({
        uri,
        type: 'audio/m4a',
        name: `audio_${Date.now()}.m4a`,
      });

      const messageData = {
        conversation_id: parseInt(id as string),
        content: `🎙️ Áudio (${Math.floor(duration)}s)`,
        content_type: 'audio',
        media_url: uploadData.media_url,
      };

      if (socket) {
        socket.emit('chat_message', messageData);
      } else {
        await sendChatMessage(
          parseInt(id as string),
          messageData.content,
          'audio',
          uploadData.media_url,
        );
      }
    } catch (error) {
      console.error('Error sending audio:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleAudioSelected = async (
    uri: string,
    duration: number,
    filename: string,
  ) => {
    try {
      setIsSending(true);

      const uploadData = await uploadChatFile({
        uri,
        type: 'audio/mpeg',
        name: filename,
      });

      const messageData = {
        conversation_id: parseInt(id as string),
        content: `🎵 ${filename.replace(/\.[^/.]+$/, '')} (${Math.floor(duration)}s)`,
        content_type: 'audio',
        media_url: uploadData.media_url,
      };

      if (socket) {
        socket.emit('chat_message', messageData);
      } else {
        await sendChatMessage(
          parseInt(id as string),
          messageData.content,
          'audio',
          uploadData.media_url,
        );
      }
    } catch (error) {
      console.error('Error sending audio:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleVideoRecorded = async (uri: string, duration: number) => {
    try {
      setIsSending(true);

      const uploadData = await uploadChatFile({
        uri,
        type: 'video/mp4',
        name: `video_${Date.now()}.mp4`,
      });

      const messageData = {
        conversation_id: parseInt(id as string),
        content: `🎥 Vídeo (${Math.floor(duration)}s)`,
        content_type: 'image',
        media_url: uploadData.media_url,
      };

      if (socket) {
        socket.emit('chat_message', messageData);
      } else {
        await sendChatMessage(
          parseInt(id as string),
          messageData.content,
          'image',
          uploadData.media_url,
        );
      }
    } catch (error) {
      console.error('Error sending video:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleVideoSelected = async (uri: string, duration: number) => {
    try {
      setIsSending(true);

      const uploadData = await uploadChatFile({
        uri,
        type: 'video/mp4',
        name: `video_${Date.now()}.mp4`,
      });

      const messageData = {
        conversation_id: parseInt(id as string),
        content: `🎥 Vídeo (${Math.floor(duration)}s)`,
        content_type: 'image',
        media_url: uploadData.media_url,
      };

      if (socket) {
        socket.emit('chat_message', messageData);
      } else {
        await sendChatMessage(
          parseInt(id as string),
          messageData.content,
          'image',
          uploadData.media_url,
        );
      }
    } catch (error) {
      console.error('Error sending video:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleAddReaction = (emoji: string, messageId: number) => {
    if (!socket) return;
    socket.emit('message_reaction', {
      message_id: messageId,
      emoji: emoji,
    });
    setShowEmojiPicker(false);
    setReactionTargetId(null);
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
    setInputText(message.content);
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!socket) return;
    try {
      socket.emit('delete_message', { message_id: messageId });
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const getConversationTitle = useMemo(() => {
    if (!conversation) return 'Carregando...';
    if (conversation.name) return conversation.name;

    const otherParticipants = conversation.participants.filter(
      (p) => p.id !== currentUserId,
    );
    if (otherParticipants.length === 1) {
      return `${otherParticipants[0].first_name} ${otherParticipants[0].last_name}`;
    }

    return `${otherParticipants.length} participantes`;
  }, [conversation, currentUserId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color="#0f172a" strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{getConversationTitle}</Text>
            {conversation?.is_group && (
              <Text style={styles.headerSubtitle}>
                {conversation.participants.length} participantes
              </Text>
            )}
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity activeOpacity={0.7}>
              <Smile size={24} color="#0f172a" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOwn={item.sender.id === currentUserId}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              onReact={handleAddReaction}
              isSelected={selectedMessageId === item.id}
              onSelect={() => setSelectedMessageId(item.id)}
              showEmojiPicker={showEmojiPicker && reactionTargetId === item.id}
              onShowEmojiPicker={setReactionTargetId}
              emojis={emojis}
            />
          )}
          contentContainerStyle={styles.messagesList}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Nenhuma mensagem ainda</Text>
              <Text style={styles.emptySubtext}>Comece uma conversa!</Text>
            </View>
          }
        />

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>
              {typingUsers.map((u) => u.first_name).join(', ')}{' '}
              {'está digitando...'}
            </Text>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          {editingMessageId && (
            <View style={styles.editingIndicator}>
              <Text style={styles.editingText}>Editando mensagem...</Text>
              <TouchableOpacity
                onPress={() => {
                  setEditingMessageId(null);
                  setEditingContent('');
                  setInputText('');
                }}
              >
                <X size={20} color="#64748b" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.mediaBar}>
            <TouchableOpacity
              onPress={() => handleAddMedia('image')}
              style={styles.mediaButton}
              activeOpacity={0.7}
            >
              <Plus size={20} color="#3b82f6" strokeWidth={2} />
            </TouchableOpacity>

            <AudioRecorder onAudioRecorded={handleAudioRecorded} />
            <AudioPicker onAudioSelected={handleAudioSelected} />
            <VideoRecorder onVideoRecorded={handleVideoRecorded} />
            <VideoPicker onVideoSelected={handleVideoSelected} />
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder={
                editingMessageId
                  ? 'Edite a mensagem...'
                  : 'Escreva uma mensagem...'
              }
              placeholderTextColor="#94a3b8"
              value={inputText}
              onChangeText={handleTyping}
              multiline
              maxLength={1000}
            />

            {inputText.trim().length > 0 ? (
              <TouchableOpacity
                onPress={handleSendMessage}
                style={[
                  styles.sendButton,
                  isSending && styles.sendButtonDisabled,
                ]}
                activeOpacity={0.7}
                disabled={isSending}
              >
                <Send size={20} color="#fff" strokeWidth={2} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.micButton}
                activeOpacity={0.7}
                disabled
              >
                <Mic size={20} color="#cbd5e1" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  headerActions: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 6,
    gap: 8,
  },
  messageBubbleContainerOwn: {
    justifyContent: 'flex-end',
  },
  messageSenderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messageBubbleOwn: {
    backgroundColor: '#3b82f6',
  },
  messageBubbleSelected: {
    backgroundColor: '#dbeafe',
  },
  messageActions: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  emojiRow: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
  },
  emojiBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  emoji: {
    fontSize: 18,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 6,
  },
  actionBtnDelete: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  actionBtnText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  actionBtnTextDelete: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  editingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#fcd34d',
  },
  editingText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
  },
  reactionsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  messageText: {
    fontSize: 15,
    color: '#0f172a',
    lineHeight: 20,
  },
  messageTextOwn: {
    color: '#fff',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  messageGif: {
    width: 150,
    height: 150,
    borderRadius: 12,
    marginBottom: 4,
  },
  audioMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  audioLabel: {
    fontSize: 13,
    color: '#0f172a',
  },
  audioLabelOwn: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  messageTimeOwn: {
    color: '#e0f2fe',
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  mediaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  mediaButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
});
