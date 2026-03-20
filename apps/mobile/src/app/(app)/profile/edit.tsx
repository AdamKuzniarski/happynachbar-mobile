import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiErrorMessage, validateProfileForm } from '@/lib/profile';
import { getMe, updateMe } from '@/lib/users';

export default function ProfileEditPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [plz, setPlz] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const me = await getMe();
        if (cancelled) return;
        setDisplayName(me.profile?.displayName ?? '');
        setPlz(me.profile?.plz ?? '');
        setBio(me.profile?.bio ?? '');
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
  }, []);

  async function handleSaveProfile() {
    setError(null);

    const validation = validateProfileForm({ displayName, plz, bio });
    if (!validation.isValid || saving) return;

    setSaving(true);

    try {
      await updateMe({
        displayName: validation.normalized.displayName,
        plz: validation.normalized.plz,
        bio: validation.normalized.bio,
      });
      router.replace('/profile');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Profil konnte nicht gespeichert werden.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-app-dark-bg">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-app-dark-brand">Bearbeiten wird geladen...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-app-dark-bg">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-app-dark-text">Profil bearbeiten</Text>
          <Pressable
            onPress={() => router.replace('/profile')}
            className="rounded-md border border-app-dark-card px-4 py-2"
          >
            <Text className="text-sm font-semibold text-app-dark-text">Zurück</Text>
          </Pressable>
        </View>

        {error ? (
          <View className="rounded-md border border-red-500/30 bg-red-500/10 p-3">
            <Text className="text-sm text-red-400">{error}</Text>
          </View>
        ) : null}

        <View className="gap-3">
          <View>
            <Text className="mb-1 text-sm text-app-dark-brand">Display Name</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              className="h-12 rounded-md border border-app-dark-card bg-app-dark-bg px-4 text-base text-app-dark-text"
            />
          </View>

          <View>
            <Text className="mb-1 text-sm text-app-dark-brand">PLZ</Text>
            <TextInput
              value={plz}
              onChangeText={setPlz}
              keyboardType="number-pad"
              maxLength={5}
              className="h-12 rounded-md border border-app-dark-card bg-app-dark-bg px-4 text-base text-app-dark-text"
            />
          </View>

          <View>
            <Text className="mb-1 text-sm text-app-dark-brand">Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              className="min-h-36 rounded-md border border-app-dark-card bg-app-dark-bg px-4 py-3 text-base text-app-dark-text"
            />
          </View>
        </View>

        <View className="gap-2">
          <Pressable
            onPress={handleSaveProfile}
            disabled={saving}
            className={`h-11 w-56 items-center justify-center self-center rounded-md px-8 ${
              saving ? 'bg-app-dark-card opacity-70' : 'bg-app-dark-accent'
            }`}
          >
            <Text className="font-semibold text-app-dark-text">{saving ? 'Speichern...' : 'Speichern'}</Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/profile')}
            className="h-11 w-56 items-center justify-center self-center rounded-md border border-app-dark-card px-8"
          >
            <Text className="font-semibold text-app-dark-text">Abbrechen</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
