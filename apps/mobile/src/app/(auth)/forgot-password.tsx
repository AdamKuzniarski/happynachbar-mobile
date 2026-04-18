import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { AuthButton } from '@/components/auth/AuthButton';
import { AuthField } from '@/components/auth/AuthField';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { ApiError } from '@/lib/api';
import { requestPasswordReset } from '@/lib/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const normalizedEmail = email.trim().toLowerCase();
  const isEmailValid = EMAIL_REGEX.test(normalizedEmail);
  const showEmailError = submitted && !isEmailValid;

  async function handleSubmit() {
    setIsSubmitting(true);
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
      setEmail('');
      alert('Wenn ein Konto existiert, wurde eine E-Mail gesendet.');
    }

    return (
      <AuthScreen
        title="Passwort vergessen"
        subtitle={'Gib deine E-Mail ein. Wenn ein Konto existiert, senden wir dir eine Reset-Link.'}
        footer={
          <Text className={'text-center text-sm leading-6 text-app-dark-brand'}>
            Zurück zum Login?
            <Text onPress={() => router.push('//login')} className={'font-semibold underline'}>
              Anmelden
            </Text>
          </Text>
        }
      />
    );
  }
}
