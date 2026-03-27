import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/lib/api';
import { getAuthToken } from '@/lib/auth-token';
import { formatDate } from '@/lib/format';
import { getConversations, getUnreadCount, type ConversationListItem } from '@/lib/chat';
import { onChatEvent } from '@/lib/chat-events';

function getConversationTitle(item: ConversationListItem) {
  if (item.type === 'GROUP') {
    return item.activityTitle?.trim() || 'Gruppenchat';
  }

  return item.participantDisplayName?.trim() || 'Nachbar';
}

function getConversationSubline(item: ConversationListItem) {
  return item.lastMessageBody?.trim() || 'Noch keine Nachrichten';
}

export default function MessagesPage() {
  const isFocused = useIsFocused();
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const hasLoadedRef = useRef(false);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);
  const socketRef = useRef<Socket | null>(null);
  const conversationIdsRef = useRef<string[]>([]);
  const joinedConversationIdsRef = useRef(new Set<string>());

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const joinConversationRooms = useCallback((conversationIds: string[]) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;

    for (const conversationId of conversationIds) {
      if (!conversationId || joinedConversationIdsRef.current.has(conversationId)) continue;
      joinedConversationIdsRef.current.add(conversationId);
      socket.emit('chat:join', { conversationId });
    }
  }, []);

  const loadInbox = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (!silent) {
        setLoading(true);
      }

      setError(null);

      try {
        const [conversations, unread] = await Promise.all([getConversations(), getUnreadCount()]);
        if (!mountedRef.current || requestId !== requestIdRef.current) return;

        const nextItems = conversations.items ?? [];
        const conversationIds = nextItems.map((item) => item.id);

        setItems(nextItems);
        setUnreadCount(unread.count ?? 0);
        conversationIdsRef.current = conversationIds;
        joinConversationRooms(conversationIds);
        hasLoadedRef.current = true;
      } catch (nextError) {
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Nachrichten konnten nicht geladen werden.',
        );
      } finally {
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        if (!silent) {
          setLoading(false);
        }
        setRefreshing(false);
      }
    },
    [joinConversationRooms],
  );

  useEffect(() => {
    if (!isFocused) return;
    loadInbox({ silent: hasLoadedRef.current }).catch(() => {});
  }, [isFocused, loadInbox]);

  useEffect(() => {
    let cancelled = false;

    async function connectInboxSocket() {
      const token = await getAuthToken();
      if (cancelled) return;

      const socket = io(`${API_BASE_URL}/chat`, {
        withCredentials: true,
        auth: token ? { token } : undefined,
      });

      const handleConnect = () => {
        joinedConversationIdsRef.current.clear();
        joinConversationRooms(conversationIdsRef.current);
      };

      const handleMessageChange = () => {
        loadInbox({ silent: true }).catch(() => {});
      };
      const messageEvents = ['message:new', 'message:updated', 'message:deleted'] as const;

      socket.on('connect', handleConnect);
      messageEvents.forEach((eventName) => socket.on(eventName, handleMessageChange));
      socketRef.current = socket;
    }

    connectInboxSocket().catch(() => {});

    return () => {
      cancelled = true;
      joinedConversationIdsRef.current.clear();
      const socket = socketRef.current;
      if (!socket) return;
      socket.off('connect');
      ['message:new', 'message:updated', 'message:deleted'].forEach((eventName) =>
        socket.off(eventName),
      );
      socket.disconnect();
      socketRef.current = null;
    };
  }, [joinConversationRooms, loadInbox]);

  useEffect(() => {
    const refresh = () => {
      loadInbox({ silent: true }).catch(() => {});
    };
    const unsubRefresh = onChatEvent('chat:refresh', refresh);
    const unsubRead = onChatEvent('chat:read', refresh);

    return () => {
      unsubRefresh();
      unsubRead();
    };
  }, [loadInbox]);

  function onRefresh() {
    setRefreshing(true);
    loadInbox({ silent: true }).catch(() => {});
  }

  function openConversation(conversationId: string) {
    router.push({
      pathname: '/(app)/messages/[id]',
      params: { id: conversationId },
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-app-dark-bg">
      <View className="px-4 pb-3 pt-4">
        <Text className="text-2xl font-bold text-app-dark-text">Nachrichten</Text>
        <Text className="mt-1 text-sm text-app-dark-brand">Ungelesen: {unreadCount}</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-app-dark-brand">Nachrichten werden geladen...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-10">
              <Text className="text-center text-base text-app-dark-brand">Noch keine Chats.</Text>
            </View>
          }
          ListHeaderComponent={
            error ? (
              <View className="mb-3 rounded-md border border-red-400/40 bg-red-950/40 px-3 py-2">
                <Text className="text-sm text-red-300">{error}</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openConversation(item.id)}
              className={`rounded-md border p-4 ${
                item.hasUnread
                  ? 'border-app-dark-accent bg-app-dark-card'
                  : 'border-app-dark-card bg-app-dark-bg'
              }`}
            >
              <View className="flex-row items-center justify-between">
                <Text className="mr-3 flex-1 text-base font-semibold text-app-dark-text">
                  {getConversationTitle(item)}
                </Text>
                {item.lastMessageAt ? (
                  <Text className="text-xs text-app-dark-brand">
                    {formatDate(item.lastMessageAt)}
                  </Text>
                ) : null}
              </View>

              <Text className="mt-2 text-sm text-app-dark-brand" numberOfLines={2}>
                {getConversationSubline(item)}
              </Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
