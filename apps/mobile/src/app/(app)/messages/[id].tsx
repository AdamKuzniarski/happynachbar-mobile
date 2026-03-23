import { Stack, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MessageRoomPage() {
  const params = useLocalSearchParams<{ id?: string }>();
  const conversationId = typeof params.id === 'string' ? params.id : '';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-app-dark-bg">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-base text-app-dark-brand">
            Chat-Raum wird aufgebaut.
          </Text>
          <Text className="mt-2 text-center text-xs text-app-dark-brand">
            ID: {conversationId || '—'}
          </Text>
        </View>
      </SafeAreaView>
    </>
  );
}
