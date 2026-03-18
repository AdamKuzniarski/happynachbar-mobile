import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuthToken } from '@/lib/auth-token';
import { useEffect, useState } from 'react';

export default function Index() {
  const [isBooting, setIsBooting] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    async function resolveSession() {
      try {
        const token = await getAuthToken();
        setHasToken(Boolean(token));
      } finally {
        setIsBooting(false);
      }
    }

    resolveSession().catch(() => {
      setHasToken(false);
      setIsBooting(false);
    });
  }, []);

  if (isBooting) {
    return (
      <SafeAreaView className="flex-1 bg-app-dark-bg">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-app-dark-brand">App wird gestartet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return <Redirect href={hasToken ? '/home' : '/landing'} />;
}
