import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuthToken } from '@/lib/auth-token';

export default function AppTabsLayout() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const token = await getAuthToken();

        if (!token) {
          router.replace('/landing');
          return;
        }
      } finally {
        setIsCheckingSession(false);
      }
    }

    checkSession().catch(() => {
      router.replace('/landing');
      setIsCheckingSession(false);
    });
  }, []);

  if (isCheckingSession) {
    return (
      <SafeAreaView className="flex-1 bg-app-dark-bg">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-app-dark-brand">Session wird geprüft...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#CDEB95',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#1f1f1f',
          height: Platform.OS === 'ios' ? 88 : 72,
          paddingTop: Platform.OS === 'ios' ? 8 : 6,
          paddingBottom: Platform.OS === 'ios' ? 16 : 10,
        },
        tabBarLabelStyle: {
          fontSize: Platform.OS === 'ios' ? 12 : 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favoriten',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Inserieren',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Meins',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activities/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile/edit"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
