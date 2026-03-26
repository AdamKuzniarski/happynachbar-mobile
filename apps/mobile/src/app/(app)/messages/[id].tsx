import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { io, type Socket } from 'socket.io-client';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { ChatRoomHeader } from '@/components/chat/ChatRoomHeader';
import { API_BASE_URL } from '@/lib/api';
import { getAuthToken } from '@/lib/auth-token';
import { emitChatEvent } from '@/lib/chat-events';
import {
  createLocalId,
  getConversationTitle,
  getSocketErrorText,
  mergeMessages,
  sortMessagesDesc,
  type RoomMessage,
  upsertMessage,
} from '@/lib/chat-room';
import {
  emitDeleteMessage,
  emitEditMessage,
  emitSendMessage,
  getConversationMessages,
  getConversation,
  markConversationAsRead,
  type ConversationListItem,
  type Message,
} from '@/lib/chat';
import { formatDate } from '@/lib/format';
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

      setLoadingOlder(true);
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
            : 'Nachrichten konnten nicht gelesen werden.',
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
    if (!conversationId || !isFocused || !hasLoadedInitialRef.current || readInFlightRef.current)
      return;
    readInFlightRef.current = true;
    try {
      await markConversationAsRead(conversationId);
      emitChatEvent('chat:read', { conversationId });
    } catch {
      // Best effort.
    } finally {
      readInFlightRef.current = false;
    }
  }, [conversationId, isFocused]);

  useEffect(() => {
    markReadBestEffort().catch(() => {});
  }, [isFocused, conversationId, loading, markReadBestEffort]);

  useEffect(() => {
    let disposed = false;
    const pendingTimeoutMap = pendingSendTimeoutsRef.current;

    async function connectSocket() {
      if (!conversationId) return;

      const token = await getAuthToken();
      if (disposed) return;

      const socket = io(`${API_BASE_URL}/chat`, {
        withCredentials: true,
        auth: token ? { token } : undefined,
      });

      function handleConnect() {
        setSocketConnected(true);
        setSendError(null);
        socket.emit('chat:join', { conversationId });
      }

      function handleDisconnect() {
        setSocketConnected(false);
      }

      function handleConnectError(nextError: unknown) {
        setSocketConnected(false);
        setSendError(getSocketErrorText(nextError));
      }

      function consumeOptimisticIfMatching(nextMessage: Message) {
        if (!currentUserId || nextMessage.senderId !== currentUserId) return false;
        const incomingBody = (nextMessage.body ?? '').trim();
        if (!incomingBody) return false;

        let matchedLocalId: string | null = null;

        setItems((prev) => {
          for (const item of prev) {
            if (!item.optimistic) continue;
            if ((item.body ?? '').trim() !== incomingBody) continue;
            matchedLocalId = item.localId ?? null;
            return mergeMessages([
              ...prev.filter((row) => row.id !== item.id),
              nextMessage as RoomMessage,
            ]);
          }

          return upsertMessage(prev, nextMessage as RoomMessage);
        });

        if (matchedLocalId) {
          const timeoutId = pendingTimeoutMap.get(matchedLocalId);
          if (timeoutId) {
            clearTimeout(timeoutId);
            pendingTimeoutMap.delete(matchedLocalId);
          }
        }

        return !!matchedLocalId;
      }

      function handleMessageNew(nextMessage: Message) {
        if (nextMessage.conversationId !== conversationId) return;
        consumeOptimisticIfMatching(nextMessage);
        emitChatEvent('chat:message:new', { conversationId });
        markReadBestEffort().catch(() => {});
      }

      function handleMessageUpdated(nextMessage: Message) {
        if (nextMessage.conversationId !== conversationId) return;
        setItems((prev) => upsertMessage(prev, nextMessage as RoomMessage));
        emitChatEvent('chat:message:updated', { conversationId });
      }

      function handleMessageDeleted(nextMessage: Message) {
        if (nextMessage.conversationId !== conversationId) return;
        setItems((prev) => upsertMessage(prev, nextMessage as RoomMessage));
        emitChatEvent('chat:message:deleted', { conversationId });
      }

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connect_error', handleConnectError);
      socket.on('message:new', handleMessageNew);
      socket.on('message:updated', handleMessageUpdated);
      socket.on('message:deleted', handleMessageDeleted);

      socketRef.current = socket;
    }

    connectSocket().catch(() => {});

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      const socket = socketRef.current;
      if (!socket) return;

      if (nextState === 'active' && !socket.connected) {
        socket.connect();
      }
    });

    return () => {
      disposed = true;
      appStateSub.remove();

      for (const timeoutId of pendingTimeoutMap.values()) {
        clearTimeout(timeoutId);
      }
      pendingTimeoutMap.clear();

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
  }, [conversationId, currentUserId, isFocused, markReadBestEffort]);

  async function loadOlderMessages() {
    if (!conversationId || !nextCursor || loadingOlder || loading) return;

    setLoadingOlder(true);

    try {
      const response = await getConversationMessages(conversationId, { cursor: nextCursor });
      const olderPage = (response.items ?? []) as RoomMessage[];
      setItems((prev) => mergeMessages([...prev, ...olderPage]));
      setNextCursor(response.nextCursor ?? null);
    } catch {
      setActionError('Ältere Nachrichten konnten nicht geladen werden.');
    } finally {
      setLoadingOlder(false);
    }
  }

  function onSendMessage() {
    const body = text.trim();
    if (!body) return;

    if (!conversationId) {
      setSendError('Ungültige Conversation-ID.');
      return;
    }

    const socket = socketRef.current;
    if (!socket || !socket.connected) {
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
    setSendError(null);
    setActionError(null);
    setText('');
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
    if (!body) return;

    const socket = socketRef.current;
    if (!socket || !socket.connected) {
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
    if (!socket || !socket.connected) {
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
          <View className="px-4 pb-3 pt-4">
            <Text className="text-lg font-bold text-app-dark-text">Chat</Text>
            <Text className="mt-1 text-xs text-app-dark-brand">
              {socketConnected ? 'Verbunden' : 'Offline'}
            </Text>
          </View>

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
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 16,
                gap: 10,
                flexGrow: 1,
              }}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center py-10">
                  <Text className="text-center text-base text-app-dark-brand">
                    Noch keine Nachrichten.
                  </Text>
                </View>
              }
              ListFooterComponent={
                loadingOlder ? (
                  <Text className="pt-2 text-center text-xs text-app-dark-brand">
                    Ältere Nachrichten werden geladen...
                  </Text>
                ) : null
              }
              renderItem={({ item }) => {
                const isMine = !!currentUserId && item.senderId === currentUserId;
                const isEditing = editingId === item.id;

                return (
                  <View className="rounded-md border border-app-dark-card bg-app-dark-bg p-3">
                    <Text className="text-xs text-app-dark-brand">
                      {isMine ? 'Du' : item.senderDisplayName?.trim() || 'Nachbar'} ·{' '}
                      {formatDate(item.createdAt)}
                    </Text>

                    {isEditing ? (
                      <View className="mt-2 gap-2">
                        <TextInput
                          value={editingText}
                          onChangeText={setEditingText}
                          placeholder="Nachricht bearbeiten..."
                          placeholderTextColor="#B8C3AF"
                          className="h-11 rounded-md border border-app-dark-card bg-app-dark-bg px-3 text-base text-app-dark-text"
                        />
                        <View className="flex-row gap-2">
                          <Pressable
                            onPress={() => submitEdit(item.id)}
                            className="h-9 min-w-[80px] items-center justify-center rounded-md bg-app-dark-accent px-3"
                          >
                            <Text className="text-xs font-semibold text-app-dark-text">
                              Speichern
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={cancelEdit}
                            className="h-9 min-w-[80px] items-center justify-center rounded-md border border-app-dark-card px-3"
                          >
                            <Text className="text-xs font-semibold text-app-dark-text">
                              Abbrechen
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <>
                        <Text className="mt-1 text-sm text-app-dark-text">
                          {item.deletedAt ? 'Nachricht gelöscht' : item.body || '—'}
                        </Text>

                        <View className="mt-1 flex-row items-center gap-2">
                          {item.editedAt && !item.deletedAt ? (
                            <Text className="text-xs italic text-app-dark-brand">Bearbeitet</Text>
                          ) : null}
                          {item.optimistic ? (
                            <Text className="text-xs italic text-app-dark-brand">
                              Wird gesendet…
                            </Text>
                          ) : null}
                        </View>
                      </>
                    )}

                    {isMine && !item.deletedAt && !item.optimistic && !isEditing ? (
                      <View className="mt-2 flex-row gap-2">
                        <Pressable
                          onPress={() => startEdit(item)}
                          className="h-8 min-w-[70px] items-center justify-center rounded-md border border-app-dark-card px-2"
                        >
                          <Text className="text-xs text-app-dark-text">Bearbeiten</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => submitDelete(item.id)}
                          className="h-8 min-w-[70px] items-center justify-center rounded-md border border-red-500/60 px-2"
                        >
                          <Text className="text-xs text-red-300">Löschen</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                );
              }}
            />
          )}

          <View className="border-t border-app-dark-card px-4 pb-4 pt-3">
            {sendError ? <Text className="mb-2 text-sm text-red-300">{sendError}</Text> : null}
            {actionError ? <Text className="mb-2 text-sm text-red-300">{actionError}</Text> : null}
            <View className="flex-row items-center gap-2">
              <TextInput
                value={text}
                onChangeText={(nextValue) => {
                  setText(nextValue);
                  if (sendError) {
                    setSendError(null);
                  }
                }}
                placeholder="Nachricht schreiben..."
                placeholderTextColor="#B8C3AF"
                className="h-11 flex-1 rounded-md border border-app-dark-card bg-app-dark-bg px-3 text-base text-app-dark-text"
              />
              <Pressable
                onPress={onSendMessage}
                disabled={!text.trim()}
                className={`h-11 min-w-[84px] items-center justify-center rounded-md px-3 ${
                  text.trim() ? 'bg-app-dark-accent' : 'bg-app-dark-card'
                }`}
              >
                <Text className="text-sm font-semibold text-app-dark-text">Senden</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
