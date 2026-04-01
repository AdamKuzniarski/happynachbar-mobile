import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { hasValidStoredSession } from '@/lib/auth-session';
import { getUnreadCount } from '@/lib/chat';
import { onChatEvent } from '@/lib/chat-events';

export default function AppTabsLayout() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const insets = useSafeAreaInsets();

  const refreshUnreadCount = useCallback(async () => {
    try {
      const result = await getUnreadCount();
      setUnreadCount(result.count ?? 0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const hasValidSession = await hasValidStoredSession();
        if (!hasValidSession) {
          router.replace('/landing');
          return;
        }

        await refreshUnreadCount();
      } catch {
        router.replace('/landing');
      } finally {
        if (mounted) {
          setIsCheckingSession(false);
        }
      }
    }

    checkSession().catch(() => {
      router.replace('/landing');
      if (mounted) {
        setIsCheckingSession(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (isCheckingSession) {
      return;
    }

    const interval = setInterval(() => {
      refreshUnreadCount().catch(() => {});
    }, 10000);

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshUnreadCount().catch(() => {});
      }
    });

    const unsubscribeRead = onChatEvent('chat:read', () => {
      refreshUnreadCount().catch(() => {});
    });

    const unsubscribeNew = onChatEvent('chat:message:new', () => {
      refreshUnreadCount().catch(() => {});
    });

    const unsubscribeUpdated = onChatEvent('chat:message:updated', () => {
      refreshUnreadCount().catch(() => {});
    });

    const unsubscribeDeleted = onChatEvent('chat:message:deleted', () => {
      refreshUnreadCount().catch(() => {});
    });

    return () => {
      clearInterval(interval);
      appStateSubscription.remove();
      unsubscribeRead();
      unsubscribeNew();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [isCheckingSession, refreshUnreadCount]);

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
          height: Platform.OS === 'ios' ? 72 + insets.bottom : 62 + Math.max(insets.bottom, 10),
          paddingTop: Platform.OS === 'ios' ? 8 : 6,
          paddingBottom:
            Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : Math.max(insets.bottom, 10),
        },
        tabBarLabelStyle: {
          fontSize: Platform.OS === 'ios' ? 12 : 11,
          fontWeight: '600',
        },
        tabBarBadgeStyle: {
          backgroundColor: '#CDEB95',
          color: '#000000',
          fontSize: 11,
          fontWeight: '700',
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
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
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
      <Tabs.Screen
        name="messages/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
