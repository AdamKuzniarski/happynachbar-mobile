import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordValid = password.length >= 8;
  const isValid = isEmailValid && isPasswordValid;

  const emailError = submitted && !isEmailValid ? 'Please enter a valid email address.' : null;
  const passwordError =
    submitted && !isPasswordValid ? 'Password must be at least 8 characters.' : null;

  async function handleCreateAccount() {
    setSubmitted(true);

    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await AsyncStorage.setItem('authToken', 'demo-token');

      if (displayName.trim().length > 0) {
        await AsyncStorage.setItem('displayName', displayName.trim());
      }

      router.replace('/home');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-app-dark-bg">
      <View className="flex-1 items-center px-6 pt-20">
        <View className="w-full max-w-[420px] items-center">
          <Text className="mb-6 text-center text-[32px] font-extrabold leading-[40px] text-app-dark-text">
            Create account
          </Text>
          <Text className="mb-10 text-center text-base leading-7 text-app-dark-brand">
            Sign up to connect with activities in your neighborhood.
          </Text>

          <View className="w-full gap-4">
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Display name (optional)"
              placeholderTextColor={colors.dark.brand}
              autoCapitalize="words"
              className="h-12 rounded-md border border-app-dark-card bg-app-dark-bg px-4 text-base text-app-dark-text"
            />

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.dark.brand}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="h-12 rounded-md border border-app-dark-card bg-app-dark-bg px-4 text-base text-app-dark-text"
            />
            {emailError ? (
              <Text className="-mt-2 text-sm text-app-dark-brand">{emailError}</Text>
            ) : null}

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.dark.brand}
              secureTextEntry
              className="h-12 rounded-md border border-app-dark-card bg-app-dark-bg px-4 text-base text-app-dark-text"
            />
            {passwordError ? (
              <Text className="-mt-2 text-sm text-app-dark-brand">{passwordError}</Text>
            ) : null}

            <Pressable
              onPress={handleCreateAccount}
              disabled={!isValid || isSubmitting}
              className={`h-12 items-center justify-center rounded-md ${
                isValid && !isSubmitting ? 'bg-app-dark-accent' : 'bg-app-dark-card opacity-70'
              }`}
            >
              <Text className="text-base font-semibold text-app-dark-text">
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </Text>
            </Pressable>
          </View>

          <Text className="mt-5 text-center text-sm leading-6 text-app-dark-brand">
            Already have an account?{' '}
            <Text onPress={() => router.push('/login')} className="font-semibold underline">
              Log in
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
