import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ActivityForm } from '@/components/activities/ActivityForm';
import { ScreenScrollView } from '@/components/ui/ScreenScrollView';
import { createActivity, type ActivityWritePayload } from '@/lib/activities';

export default function CreatePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formResetKey, setFormResetKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setError(null);
      setFormResetKey((prev) => prev + 1);
    }, []),
  );

  async function handleCreate(payload: ActivityWritePayload) {
    setIsSubmitting(true);
    setError(null);

    try {
      const created = await createActivity(payload);
      router.replace(`/activities/${created.id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Aktivität konnte nicht erstellt werden.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenScrollView keyboardAware bottomPadding={0}>
      <Text className="mb-2 text-2xl font-bold text-app-dark-text">Aktivität erstellen</Text>
      <Text className="mb-6 text-sm text-app-dark-brand">
        Erstelle einen Beitrag mit Titel, Kategorie, PLZ, Beschreibung sowie optionaler Startzeit
        und Bild-URLs.
      </Text>

      {error ? <Text className="mb-4 text-sm text-red-300">{error}</Text> : null}

      <ActivityForm
        key={formResetKey}
        submitLabel="Aktivität erstellen"
        isSubmitting={isSubmitting}
        onSubmit={handleCreate}
      />
    </ScreenScrollView>
  );
}
