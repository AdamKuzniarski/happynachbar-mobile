import { Text, View } from 'react-native';

import { ActivityForm } from '@/components/activities/ActivityForm';
import type { ActivityDetail, ActivityWritePayload } from '@/lib/activities';

type Props = {
  activity: ActivityDetail;
  isSaving: boolean;
  onSubmit: (payload: ActivityWritePayload) => Promise<void> | void;
  onCancel: () => void;
};

export function ActivityEditPanel({ activity, isSaving, onSubmit, onCancel }: Props) {
  return (
    <View className="rounded-md bg-app-dark-bg p-4">
      <Text className="mb-4 text-center text-lg font-bold text-app-dark-text">
        Aktivität bearbeiten
      </Text>
      <ActivityForm
        initialValues={{
          title: activity.title,
          description: activity.description,
          plz: activity.plz,
          category: activity.category as ActivityWritePayload['category'],
          startAt: activity.startAt,
          imageUrls: activity.images?.map((image) => image.url) ?? [],
        }}
        submitLabel="Änderungen speichern"
        isSubmitting={isSaving}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </View>
  );
}
