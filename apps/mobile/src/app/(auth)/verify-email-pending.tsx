import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { AuthButton } from '@/components/auth/AuthButton';
import { AuthField } from '@/components/auth/AuthField';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { ApiError } from '@/lib/api';
import { resendVerification } from '@/lib/auth';
import { EMAIL_REGEX } from '@/lib/format';

export default function VarifyEmailPendingPage() {
  const params = useLocalSearchParams<{ email?: string }>();
  const initialEmail = typeof params.email === 'string' ? params.email : '';

  const [email, setEmail] = useState(initialEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const normalizedEmail = email.trim().toLowerCase();
  const isEmailValid = EMAIL_REGEX.test(normalizedEmail);
  const showEmailError = submitted && !isEmailValid;

  async function handleResend() {
    setSubmitted(true);
    setSubmitError(null);
    setSuccessMessage(null);

    if (!isEmailValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await resendVerification({ email: normalizedEmail });
      setSuccessMessage('Bestätigungs-Mail wurde erneut gesendet.');
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Konnte E-Mail nicht senden. Bitte erneut versuchen.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="E-Mail bestätigen"
      subtitle="Bitte bestätige zuerst deine E-Mail-Adresse. Danach kannst du dich in der App anmelden."
      footer={
        <Text className="text-center text-sm leading-6 text-app-dark-brand">
          Schon bestätigt?{' '}
          <Text onPress={() => router.replace('/login')} className="font-semibold underline">
            Zum Login
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
      {successMessage ? (
        <Text className="text-sm text-app-dark-brand">{successMessage}</Text>
      ) : null}

      <AuthButton
        label={isSubmitting ? 'Wird gesendet...' : 'Bestätigungs-Mail erneut senden'}
        onPress={handleResend}
        disabled={isSubmitting}
      />
    </AuthScreen>
  );
}
