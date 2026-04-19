import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AuthButton } from '@/components/auth/AuthButton';
import { AuthField } from '@/components/auth/AuthField';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { ApiError } from '@/lib/api';
import { login } from '@/lib/auth';
import { setAuthToken } from '@/lib/auth-token';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const normalizedEmail = email.trim().toLowerCase();
  const isValid = normalizedEmail.length > 0 && password.length > 0;

  async function handleLogin() {
    if (!isValid || isSubmitting) return;

    setSubmitError(null);
    setUnverifiedEmail(null);
    setIsSubmitting(true);

    try {
      const response = await login({
        email: normalizedEmail,
        password,
      });

      await setAuthToken(response.access_token);
      router.replace('/home');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 403 && error.message === 'Email not verified') {
          setSubmitError('Bitte bestätige zuerst deine E-Mail-Adresse.');
          setUnverifiedEmail(normalizedEmail);
          return;
        }

        setSubmitError(error.message);
      } else {
        setSubmitError('Login fehlgeschlagen. Bitte erneut versuchen.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function goToVerifyPending() {
    if (!unverifiedEmail) return;
    router.push({
      pathname: '/verify-email-pending',
      params: { email: unverifiedEmail },
    } as unknown as Href);
  }

  return (
    <AuthScreen
      title="Log in"
      subtitle="Melde dich an, um deine Nachbarschaft zu entdecken."
      footer={
        <>
          <Pressable onPress={() => router.push('/forgot-password' as Href)}>
            <Text className="text-center text-sm font-semibold text-app-dark-brand underline">
              Passwort vergessen?
            </Text>
          </Pressable>

          <Text className="mt-5 text-center text-sm leading-6 text-app-dark-brand">
            Du hast noch keinen Account?{' '}
            <Text onPress={() => router.push('/register')} className="font-semibold underline">
              Zum Registrieren
            </Text>
          </Text>
        </>
      }
    >
      <AuthField
        value={email}
        onChangeText={setEmail}
        placeholder="E-Mail"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <AuthField
        value={password}
        onChangeText={setPassword}
        placeholder="Passwort"
        secureTextEntry
      />

      {submitError ? <Text className="text-sm text-red-400">{submitError}</Text> : null}

      {unverifiedEmail ? (
        <View className="rounded-md border border-app-dark-card p-4">
          <Text className="text-sm leading-6 text-app-dark-brand">
            Dein Konto existiert schon, aber die E-Mail ist noch nicht bestätigt.
          </Text>

          <Pressable onPress={goToVerifyPending} className="mt-3">
            <Text className="text-sm font-semibold text-app-dark-text underline">
              Bestätigungs-Mail erneut senden
            </Text>
          </Pressable>
        </View>
      ) : null}

      <AuthButton
        label={isSubmitting ? 'Anmeldung läuft...' : 'Anmelden'}
        onPress={handleLogin}
        disabled={!isValid || isSubmitting}
      />
    </AuthScreen>
  );
}
