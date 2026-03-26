import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, FlatList, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { io, type Socket } from 'socket.io-client';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { ChatRoomHeader } from '@/components/chat/ChatRoomHeader';
import { API_BASE_URL } from '@/lib/api';
import { getAuthToken } from '@/lib/auth-token';
import {
  createLocalId,
  getConversationSubtitle,
  getConversationTitle,
  getSocketErrorText,
  mergeMessages,
  sortMessagesDesc,
  type RoomMessage,
  upsertMessage,
} from '@/lib/chat-room';
import { emitChatEvent } from '@/lib/chat-events';
import {
  emitDeleteMessage,
  emitEditMessage,
  emitSendMessage,
  getConversation,
  getConversationMessages,
  markConversationAsRead,
  type ConversationListItem,
  type Message,
} from '@/lib/chat';
import { getMe } from '@/lib/users';

export default function MessageRoomPage() {
  const params = useLocalSearchParams<{ id?: string }>();
  const conversationId = typeof params.id === 'string' ? params.id : '';
  const isFocused = useIsFocused();

  const [conversation, setConversation] = useState<ConversationListItem | null>(null);
  const [items, setItems] = useState<RoomMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const hasLoadedInitialRef = useRef(false);
  const readInFlightRef = useRef(false);
  const pendingSendTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    getMe()
      .then((me) => setCurrentUserId(me.id))
      .catch(() => setCurrentUserId(null));
  }, []);

  useEffect(() => {
    let active = true;

    async function loadRoom() {
      if (!conversationId) {
        setError('Ungültige Conversation-ID.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setActionError(null);

      try {
        const [messagesResponse, conversationResponse] = await Promise.all([
          getConversationMessages(conversationId),
          getConversation(conversationId).catch(() => null),
        ]);

        if (!active) return;

        setItems(sortMessagesDesc((messagesResponse.items ?? []) as RoomMessage[]));
        setNextCursor(messagesResponse.nextCursor ?? null);
        setConversation(conversationResponse);
        hasLoadedInitialRef.current = true;
      } catch (nextError) {
        if (!active) return;
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Nachrichten konnten nicht geladen werden.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadRoom().catch(() => {});

    return () => {
      active = false;
    };
  }, [conversationId]);

  const markReadBestEffort = useCallback(async () => {
    if (!conversationId || !isFocused || !hasLoadedInitialRef.current || readInFlightRef.current) {
      return;
    }

    readInFlightRef.current = true;

    try {
      await markConversationAsRead(conversationId);
      emitChatEvent('chat:read', { conversationId });
    } catch {
      // best effort
    } finally {
      readInFlightRef.current = false;
    }
  }, [conversationId, isFocused]);

  useEffect(() => {
    markReadBestEffort().catch(() => {});
  }, [loading, markReadBestEffort]);

  useEffect(() => {
    let disposed = false;
    const pendingTimeouts = pendingSendTimeoutsRef.current;

    async function connectSocket() {
      if (!conversationId) return;

      const token = await getAuthToken();
      if (disposed) return;

      const socket = io(`${API_BASE_URL}/chat`, {
        withCredentials: true,
        auth: token ? { token } : undefined,
      });

      const replaceOptimisticMessage = (nextMessage: Message) => {
        if (!currentUserId || nextMessage.senderId !== currentUserId) {
          return false;
        }

        const incomingBody = (nextMessage.body ?? '').trim();
        if (!incomingBody) {
          return false;
        }

        let matchedLocalId: string | null = null;

        setItems((prev) => {
          const optimisticItem = prev.find(
            (item) => item.optimistic && (item.body ?? '').trim() === incomingBody,
          );

          if (!optimisticItem) {
            return prev;
          }

          matchedLocalId = optimisticItem.localId ?? null;

          return mergeMessages([
            ...prev.filter((item) => item.id !== optimisticItem.id),
            nextMessage as RoomMessage,
          ]);
        });

        if (matchedLocalId) {
          const timeoutId = pendingTimeouts.get(matchedLocalId);
          if (timeoutId) {
            clearTimeout(timeoutId);
            pendingTimeouts.delete(matchedLocalId);
          }
        }

        return !!matchedLocalId;
      };

      const handleConnect = () => {
        setSocketConnected(true);
        setSendError(null);
        socket.emit('chat:join', { conversationId });
      };

      const handleDisconnect = () => {
        setSocketConnected(false);
      };

      const handleConnectError = (nextError: unknown) => {
        setSocketConnected(false);
        setSendError(getSocketErrorText(nextError));
      };

      const handleMessageNew = (nextMessage: Message) => {
        if (nextMessage.conversationId !== conversationId) return;

        const replaced = replaceOptimisticMessage(nextMessage);
        if (!replaced) {
          setItems((prev) => upsertMessage(prev, nextMessage as RoomMessage));
        }

        emitChatEvent('chat:message:new', { conversationId });
        markReadBestEffort().catch(() => {});
      };

      const handleMessageUpdated = (nextMessage: Message) => {
        if (nextMessage.conversationId !== conversationId) return;
        setItems((prev) => upsertMessage(prev, nextMessage as RoomMessage));
        emitChatEvent('chat:message:updated', { conversationId });
      };

      const handleMessageDeleted = (nextMessage: Message) => {
        if (nextMessage.conversationId !== conversationId) return;
        setItems((prev) => upsertMessage(prev, nextMessage as RoomMessage));
        emitChatEvent('chat:message:deleted', { conversationId });
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connect_error', handleConnectError);
      socket.on('message:new', handleMessageNew);
      socket.on('message:updated', handleMessageUpdated);
      socket.on('message:deleted', handleMessageDeleted);

      socketRef.current = socket;
    }

    connectSocket().catch(() => {});

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && socketRef.current && !socketRef.current.connected) {
        socketRef.current.connect();
      }
    });

    return () => {
      disposed = true;
      appStateSubscription.remove();

      for (const timeoutId of pendingTimeouts.values()) {
        clearTimeout(timeoutId);
      }
      pendingTimeouts.clear();

      const socket = socketRef.current;
      if (!socket) return;

      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('message:new');
      socket.off('message:updated');
      socket.off('message:deleted');
      socket.disconnect();

      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [conversationId, currentUserId, markReadBestEffort]);

  async function loadOlderMessages() {
    if (!conversationId || !nextCursor || loading || loadingOlder) {
      return;
    }

    setLoadingOlder(true);

    try {
      const response = await getConversationMessages(conversationId, { cursor: nextCursor });
      setItems((prev) => mergeMessages([...prev, ...((response.items ?? []) as RoomMessage[])]));
      setNextCursor(response.nextCursor ?? null);
    } catch {
      setActionError('Ältere Nachrichten konnten nicht geladen werden.');
    } finally {
      setLoadingOlder(false);
    }
  }

  function onSendMessage() {
    const body = text.trim();
    const socket = socketRef.current;

    if (!body) return;

    if (!conversationId) {
      setSendError('Ungültige Conversation-ID.');
      return;
    }

    if (!socket?.connected) {
      setSendError('Chat ist gerade offline. Bitte kurz erneut versuchen.');
      return;
    }

    const localId = createLocalId();
    const optimisticMessage: RoomMessage = {
      id: localId,
      localId,
      optimistic: true,
      conversationId,
      senderId: currentUserId ?? 'me',
      senderDisplayName: 'Du',
      body,
      createdAt: new Date().toISOString(),
      editedAt: null,
      deletedAt: null,
    };

    setItems((prev) => upsertMessage(prev, optimisticMessage));
    setText('');
    setSendError(null);
    setActionError(null);
    emitSendMessage(socket, conversationId, body);

    const timeoutId = setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== localId));
      pendingSendTimeoutsRef.current.delete(localId);
      setSendError('Senden fehlgeschlagen. Bitte erneut versuchen.');
    }, 8000);

    pendingSendTimeoutsRef.current.set(localId, timeoutId);
  }

  function startEdit(item: RoomMessage) {
    if (item.deletedAt) return;
    setEditingId(item.id);
    setEditingText(item.body ?? '');
    setActionError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingText('');
  }

  function submitEdit(messageId: string) {
    const body = editingText.trim();
    const socket = socketRef.current;

    if (!body) return;

    if (!socket?.connected) {
      setActionError('Bearbeiten fehlgeschlagen: Chat ist offline.');
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === messageId
          ? {
              ...item,
              body,
              editedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
    emitEditMessage(socket, messageId, body);
    emitChatEvent('chat:message:updated', { conversationId });
    cancelEdit();
  }

  function submitDelete(messageId: string) {
    const socket = socketRef.current;

    if (!socket?.connected) {
      setActionError('Löschen fehlgeschlagen: Chat ist offline.');
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === messageId
          ? {
              ...item,
              body: null,
              deletedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
    emitDeleteMessage(socket, messageId);
    emitChatEvent('chat:message:deleted', { conversationId });

    if (editingId === messageId) {
      cancelEdit();
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView className="flex-1 bg-app-dark-bg">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ChatRoomHeader
            title={getConversationTitle(conversation)}
            subtitle={getConversationSubtitle(conversation) ?? undefined}
            isOnline={socketConnected}
          />

          {loading ? (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-base text-app-dark-brand">Nachrichten werden geladen...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-center text-sm text-red-300">{error}</Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              inverted
              onEndReachedThreshold={0.25}
              onEndReached={() => {
                loadOlderMessages().catch(() => {});
              }}
              maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
              contentContainerStyle={{ paddingBottom: 16, gap: 10, flexGrow: 1 }}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center py-10">
                  <Text className="text-center text-base text-app-dark-brand">
                    Noch keine Nachrichten.
                  </Text>
                </View>
              }
              ListFooterComponent={
                loadingOlder ? (
                  <Text className="px-4 pt-2 text-center text-xs text-app-dark-brand">
                    Ältere Nachrichten werden geladen...
                  </Text>
                ) : null
              }
              renderItem={({ item }) => {
                const isMine = !!currentUserId && item.senderId === currentUserId;

                return (
                  <ChatMessageBubble
                    item={item}
                    isMine={isMine}
                    isEditing={editingId === item.id}
                    editingText={editingText}
                    onChangeEditingText={setEditingText}
                    onStartEdit={() => startEdit(item)}
                    onCancelEdit={cancelEdit}
                    onSubmitEdit={() => submitEdit(item.id)}
                    onDelete={() => submitDelete(item.id)}
                  />
                );
              }}
            />
          )}

          <ChatComposer
            value={text}
            onChange={(nextValue) => {
              setText(nextValue);
              if (sendError) {
                setSendError(null);
              }
            }}
            onSend={onSendMessage}
            sendError={sendError}
            actionError={actionError}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
