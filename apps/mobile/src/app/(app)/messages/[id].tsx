import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/lib/api';
import { getAuthToken } from '@/lib/auth-token';
import { formatDate } from '@/lib/format';
import {
  emitSendMessage,
  getConversationMessages,
  markConversationAsRead,
  type Message,
} from '@/lib/chat';

function sortMessages(messages: Message[]) {
  return messages
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

function mergeMessages(messages: Message[]) {
  const byId = new Map<string, Message>();

  for (const message of messages) {
    byId.set(message.id, message);
  }

  return sortMessages(Array.from(byId.values()));
}

function upsertMessage(items: Message[], message: Message) {
  return mergeMessages([...items, message]);
}

export default function MessageRoomPage() {
  const params = useLocalSearchParams<{ id?: string }>();
  const conversationId = typeof params.id === 'string' ? params.id : '';
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialMessages() {
      if (!conversationId) {
        setError('Ungültige Conversation-ID.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await getConversationMessages(conversationId);
        if (cancelled) return;

        const latestFirst = response.items ?? [];
        setItems(sortMessages(latestFirst));
      } catch (nextError) {
        if (cancelled) return;
        setError(nextError instanceof Error ? nextError.message : 'Nachrichten konnten nicht geladen werden.');
      } finally {
        if (cancelled) return;
        setLoading(false);
      }

      try {
        await markConversationAsRead(conversationId);
      } catch {
        // Best effort; room should still render if read-marking fails.
      }
    }

    loadInitialMessages().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    let disposed = false;

    async function connectSocket() {
      if (!conversationId) return;

      const token = await getAuthToken();
      if (disposed) return;

      const socket = io(`${API_BASE_URL}/chat`, {
        transports: ['websocket'],
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

      function handleConnectError() {
        setSocketConnected(false);
      }

      function handleMessageNew(nextMessage: Message) {
        if (nextMessage.conversationId !== conversationId) return;
        setItems((prev) => upsertMessage(prev, nextMessage));
      }

      function handleMessageUpdated(nextMessage: Message) {
        if (nextMessage.conversationId !== conversationId) return;
        setItems((prev) => upsertMessage(prev, nextMessage));
      }

      function handleMessageDeleted(nextMessage: Message) {
        if (nextMessage.conversationId !== conversationId) return;
        setItems((prev) => upsertMessage(prev, nextMessage));
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

    return () => {
      disposed = true;

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
  }, [conversationId]);

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

    setSendError(null);
    emitSendMessage(socket, conversationId, body);
    setText('');
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
              renderItem={({ item }) => (
                <View className="rounded-md border border-app-dark-card bg-app-dark-bg p-3">
                  <Text className="text-xs text-app-dark-brand">
                    {item.senderDisplayName?.trim() || 'Nachbar'} · {formatDate(item.createdAt)}
                  </Text>
                  <Text className="mt-1 text-sm text-app-dark-text">
                    {item.deletedAt ? 'Nachricht gelöscht' : item.body || '—'}
                  </Text>
                  {item.editedAt && !item.deletedAt ? (
                    <Text className="mt-1 text-xs italic text-app-dark-brand">Bearbeitet</Text>
                  ) : null}
                </View>
              )}
            />
          )}

          <View className="border-t border-app-dark-card px-4 pb-4 pt-3">
            {sendError ? <Text className="mb-2 text-sm text-red-300">{sendError}</Text> : null}
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
