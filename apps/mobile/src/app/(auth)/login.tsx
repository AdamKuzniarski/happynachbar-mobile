import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { login } from '@/lib/auth';
import { setAuthToken } from '@/lib/auth-token';
import { colors } from '@/theme/colors';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = email.length > 0 && password.length > 0;

  async function handleLogin() {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await login({
        email: email.trim(),
        password,
      });

      await setAuthToken(response.access_token);
      router.replace('/home');
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please check your credentials and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-app-dark-bg">
      <View className="flex-1 items-center px-6 pt-20">
        <View className="w-full max-w-[420px] items-center">
          <Text className="mb-6 text-center text-[32px] font-extrabold leading-[40px] text-app-dark-text">
            Log in
          </Text>
          <Text className="mb-10  text-center text-base leading-7 text-app-dark-brand">
            Melde dich an, um deine Nachbarschaft zu entdecken.
          </Text>

          <View className={'w-full gap-4'}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="E-Mail"
              placeholderTextColor={colors.dark.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className={
                'h-12 rounded-md border border-app-dark-card bg-app-dark-bg px-4 text-base text-app-dark-text'
              }
            />

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.dark.placeholder}
              secureTextEntry
              className={
                'h-12 rounded-md border border-app-dark-card bg-app-dark-bg px-4 text-base text-app-dark-text'
              }
            />
            <Pressable
              onPress={handleLogin}
              disabled={!isValid || isSubmitting}
              className={`h-12 items-center justify-center rounded-md ${
                isValid && !isSubmitting ? 'bg-app-dark-accent' : 'bg-app-dark-card opacity-70'
              }`}
            >
              <Text className={'text-base font-semibold text-app-dark-text'}>
                {isSubmitting ? 'Anmeldung läuft...' : 'Anmelden'}
              </Text>
            </Pressable>
          </View>
          <Pressable className={'mt-5'}>
            <Text className={'text-sm font-semibold text-app-dark-brand underline'}>
              Password vergessen?
            </Text>
          </Pressable>

          <Text className={'mt-5 text-center text-sm leading-6 text-app-dark-brand'}>
            Du hast noch keinen Account?{' '}
            <Text onPress={() => router.push('/register')} className={'font-semibold underline'}>
              Zum Registrieren.
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
