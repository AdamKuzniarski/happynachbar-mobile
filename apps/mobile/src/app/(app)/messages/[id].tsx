import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDate } from '@/lib/format';
import {
  getConversationMessages,
  markConversationAsRead,
  type Message,
} from '@/lib/chat';

export default function MessageRoomPage() {
  const params = useLocalSearchParams<{ id?: string }>();
  const conversationId = typeof params.id === 'string' ? params.id : '';
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setItems(latestFirst.slice().reverse());
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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-app-dark-bg">
        <View className="px-4 pb-3 pt-4">
          <Text className="text-lg font-bold text-app-dark-text">Chat</Text>
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
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10, flexGrow: 1 }}
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
      </SafeAreaView>
    </>
  );
}
