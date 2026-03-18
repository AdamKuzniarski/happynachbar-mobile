import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clearAuthToken } from '@/lib/auth-token';

export default function ProfilePage() {
  async function handleLogout() {
    try {
      await clearAuthToken();
      router.replace('/landing');
    } catch {
      alert('Logout fehlgeschlagen. Bitte erneut versuchen.');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-app-dark-bg">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl font-bold text-app-dark-text">Meins</Text>
        <Text className="mt-2 text-center text-sm text-app-dark-brand">
          Dieser Bereich wird im nächsten Schritt umgesetzt.
        </Text>
        <Pressable
          onPress={handleLogout}
          className="mt-6 h-11 min-w-32 items-center justify-center rounded-md bg-app-dark-accent px-5"
        >
          <Text className="font-semibold text-app-dark-text">Logout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
