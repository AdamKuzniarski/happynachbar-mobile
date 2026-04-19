import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { AuthButton } from '@/components/auth/AuthButton';
import { AuthField } from '@/components/auth/AuthField';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { ApiError } from '@/lib/api';
import { requestPasswordReset } from '@/lib/auth';
import { EMAIL_REGEX } from '@/lib/format';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const normalizedEmail = email.trim().toLowerCase();
  const isEmailValid = EMAIL_REGEX.test(normalizedEmail);
  const showEmailError = submitted && !isEmailValid;

  async function handleSubmit() {
    setSubmitted(true);
    setSubmitError(null);

    if (!isEmailValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await requestPasswordReset({ email: normalizedEmail });
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Anfrage fehlgeschlagen. Bitte erneut versuchen.');
      }
      return;
    } finally {
      setIsSubmitting(false);
    }

    setSubmitted(false);
    setEmail('');
    alert('Wenn ein Konto existiert, wurde eine E-Mail gesendet.');
  }

  return (
    <AuthScreen
      title="Passwort vergessen"
      subtitle="Gib deine E-Mail ein. Wenn ein Konto existiert, senden wir dir einen Reset-Link."
      footer={
        <Text className="text-center text-sm leading-6 text-app-dark-brand">
          Zurück zum Login?{' '}
          <Text onPress={() => router.push('/login')} className="font-semibold underline">
            Anmelden
          </Text>
        </Text>
      }
    >
      <AuthField
        value={email}
        onChangeText={setEmail}
        placeholder="E-Mail"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        error={showEmailError ? 'Bitte gib eine gültige E-Mail-Adresse ein.' : null}
      />

      {submitError ? <Text className="text-sm text-red-400">{submitError}</Text> : null}

      <AuthButton
        label={isSubmitting ? 'Senden...' : 'Reset-Link senden'}
        onPress={handleSubmit}
        disabled={isSubmitting}
      />
    </AuthScreen>
  );
}
