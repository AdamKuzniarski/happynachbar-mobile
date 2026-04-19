import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { AuthButton } from '@/components/auth/AuthButton';
import { AuthField } from '@/components/auth/AuthField';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { ApiError } from '@/lib/api';
import { signup } from '@/lib/auth';
import { EMAIL_REGEX } from '@/lib/format';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const normalizedEmail = email.trim().toLowerCase();
  const trimmedDisplayName = displayName.trim();

  const isEmailValid = EMAIL_REGEX.test(normalizedEmail);
  const isPasswordValid = password.length >= 8;
  const isDisplayNameValid = trimmedDisplayName.length === 0 || trimmedDisplayName.length >= 2;
  const isValid = isEmailValid && isPasswordValid && isDisplayNameValid;

  async function handleCreateAccount() {
    setSubmitted(true);
    setSubmitError(null);

    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await signup({
        email: normalizedEmail,
        password,
        displayName: trimmedDisplayName.length > 0 ? trimmedDisplayName : undefined,
      });

      router.replace(`/verify-email-pending?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Registrierung fehlgeschlagen. Bitte erneut versuchen.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Konto erstellen"
      subtitle="Registriere dich, um Aktivitäten in deiner Nachbarschaft zu entdecken."
      footer={
        <Text className="text-center text-sm leading-6 text-app-dark-brand">
          Du hast bereits einen Account?{' '}
          <Text onPress={() => router.push('/login')} className="font-semibold underline">
            Anmelden
          </Text>
        </Text>
      }
    >
      <AuthField
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Anzeigename (optional)"
        autoCapitalize="words"
        error={
          submitted && !isDisplayNameValid
            ? 'Wenn du einen Anzeigenamen angibst, dann bitte mindestens 2 Zeichen.'
            : null
        }
      />

      <AuthField
        value={email}
        onChangeText={setEmail}
        placeholder="E-Mail"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        error={submitted && !isEmailValid ? 'Bitte gib eine gültige E-Mail-Adresse ein.' : null}
      />

      <AuthField
        value={password}
        onChangeText={setPassword}
        placeholder="Passwort"
        secureTextEntry
        error={
          submitted && !isPasswordValid ? 'Das Passwort muss mindestens 8 Zeichen lang sein.' : null
        }
      />

      {submitError ? <Text className="text-sm text-red-400">{submitError}</Text> : null}

      <AuthButton
        label={isSubmitting ? 'Konto wird erstellt...' : 'Konto erstellen'}
        onPress={handleCreateAccount}
        disabled={isSubmitting}
      />
    </AuthScreen>
  );
}
