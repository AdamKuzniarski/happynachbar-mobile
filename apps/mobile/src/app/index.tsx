import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { hasValidStoredSession } from '@/lib/auth-session';

export default function Index() {
  const [isBooting, setIsBooting] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    async function resolveSession() {
      try {
        setHasToken(await hasValidStoredSession());
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
