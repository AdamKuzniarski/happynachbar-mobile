import { useIsFocused } from '@react-navigation/native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clearAuthToken } from '@/lib/auth-token';
import { formatDate } from '@/lib/format';
import { getApiErrorMessage, getInitials } from '@/lib/profile';
import { getMe, type MeResponse } from '@/lib/users';

export default function ProfilePage() {
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MeResponse | null>(null);

  useEffect(() => {
    if (!isFocused) return;

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const me = await getMe();
        if (cancelled) return;
        setData(me);
      } catch (err) {
        if (cancelled) return;
        setError(getApiErrorMessage(err, 'Profil konnte nicht geladen werden.'));
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }

    run().catch(() => {
      if (cancelled) return;
      setError('Profil konnte nicht geladen werden.');
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isFocused]);

  async function handleLogout() {
    try {
      await clearAuthToken();
      router.replace('/landing');
    } catch {
      alert('Logout fehlgeschlagen. Bitte erneut versuchen.');
    }
  }

  const completionPercent = Math.max(0, Math.min(100, data?.profileCompletion?.percent ?? 0));
  const joinedAt = formatDate(data?.createdAt);
  const avatarValue = data?.profile?.avatarUrl?.trim() ?? '';
  const canShowAvatar = avatarValue.length > 0;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-app-dark-bg">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-app-dark-brand">Profil wird geladen...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-app-dark-bg">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text className="text-2xl font-bold text-app-dark-text">Meins</Text>

        <View className="items-center">
          <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-app-dark-card bg-app-dark-card">
            {canShowAvatar ? (
              <Image source={{ uri: avatarValue }} className="h-full w-full" />
            ) : (
              <Text className="text-2xl font-bold text-app-dark-text">
                {getInitials(data?.profile?.displayName)}
              </Text>
            )}
          </View>

          <Text className="mt-3 text-lg font-semibold text-app-dark-text">
            {(data?.profile?.displayName || 'Neighbor').trim() || 'Neighbor'}
          </Text>
          <Text className="mt-1 text-sm text-app-dark-brand">{data?.email || '—'}</Text>
        </View>

        {error ? (
          <View className="rounded-md border border-red-500/30 bg-red-500/10 p-3">
            <Text className="text-sm text-red-400">{error}</Text>
          </View>
        ) : null}

        <View className="rounded-md border border-app-dark-card bg-app-dark-bg p-4">
          <Text className="mb-3 text-base font-semibold text-app-dark-text">Info</Text>

          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-app-dark-brand">Display Name</Text>
              <Text className="max-w-[60%] text-right text-sm text-app-dark-text">
                {data?.profile?.displayName || '—'}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-app-dark-brand">PLZ</Text>
              <Text className="max-w-[60%] text-right text-sm text-app-dark-text">
                {data?.profile?.plz || '—'}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-app-dark-brand">Mitglied seit</Text>
              <Text className="max-w-[60%] text-right text-sm text-app-dark-text">{joinedAt}</Text>
            </View>
          </View>
        </View>

        <View className="rounded-md border border-app-dark-card bg-app-dark-bg p-4">
          <Text className="mb-2 text-base font-semibold text-app-dark-text">Bio</Text>
          <Text className="text-sm leading-6 text-app-dark-brand">{data?.profile?.bio || '—'}</Text>
        </View>

        {data?.profileCompletion && !data.profileCompletion.isComplete ? (
          <View className="rounded-md border border-app-dark-card bg-app-dark-bg p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-app-dark-brand">Profil vollständig</Text>
              <Text className="text-sm font-semibold text-app-dark-text">{completionPercent}%</Text>
            </View>
          </View>
        ) : null}

        <View className="gap-2">
          <Pressable
            onPress={() => router.push('/profile/edit')}
            className="h-11 w-56 items-center justify-center self-center rounded-md bg-app-dark-accent px-8"
          >
            <Text className="font-semibold text-app-dark-text">Profil bearbeiten</Text>
          </Pressable>

          <Pressable
            onPress={handleLogout}
            className="h-11 w-56 items-center justify-center self-center rounded-md border border-app-dark-card px-8"
          >
            <Text className="font-semibold text-app-dark-text">Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
