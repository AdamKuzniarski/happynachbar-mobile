import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { ActivityCategory } from '@/lib/enums';
import type { ActivityWritePayload } from '@/lib/activities';
import { ActivityCategoryPicker } from '@/components/activities/ActivityCategoryPicker';

type Props = {
  initialValues?: Partial<ActivityWritePayload>;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (payload: ActivityWritePayload) => Promise<void> | void;
  onCancel?: () => void;
};

function normalizePostalCode(value: string) {
  return value.replace(/\D+/g, '').slice(0, 5);
}

export function ActivityForm({
  initialValues,
  submitLabel,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [plz, setPlz] = useState(initialValues?.plz ?? '');
  const [category, setCategory] = useState<ActivityCategory>(
    initialValues?.category ?? ActivityCategory.OUTDOOR,
  );

  useEffect(() => {
    setTitle(initialValues?.title ?? '');
    setDescription(initialValues?.description ?? '');
    setPlz(initialValues?.plz ?? '');
    setCategory(initialValues?.category ?? ActivityCategory.OUTDOOR);
  }, [initialValues]);

  const hasValidTitle = title.trim().length >= 3;
  const hasValidPlz = /^\d{5}$/.test(plz);
  const isValid = hasValidTitle && hasValidPlz;

  async function handleSubmit() {
    if (!isValid || isSubmitting) return;

    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      plz,
    });
  }

  return (
    <View className="gap-4">
      <View className="gap-2">
        <Text className="text-sm font-semibold text-app-dark-text">Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="What do you want to post?"
          placeholderTextColor="#B8C3AF"
          className="rounded-md border border-app-dark-card bg-app-dark-bg px-4 py-3 text-base text-app-dark-text"
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold text-app-dark-text">Postal code</Text>
        <TextInput
          value={plz}
          onChangeText={(value) => setPlz(normalizePostalCode(value))}
          placeholder="63073"
          placeholderTextColor="#B8C3AF"
          keyboardType="number-pad"
          className="rounded-md border border-app-dark-card bg-app-dark-bg px-4 py-3 text-base text-app-dark-text"
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold text-app-dark-text">Category</Text>
        <ActivityCategoryPicker value={category} onChange={setCategory} />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold text-app-dark-text">Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Add a short description"
          placeholderTextColor="#B8C3AF"
          multiline
          textAlignVertical="top"
          className="min-h-32 rounded-md border border-app-dark-card bg-app-dark-bg px-4 py-3 text-base text-app-dark-text"
        />
      </View>

      <View className="gap-3 pt-2">
        <Pressable
          onPress={() => handleSubmit().catch(() => {})}
          disabled={!isValid || isSubmitting}
          className={`h-12 items-center justify-center rounded-md ${
            isValid && !isSubmitting ? 'bg-app-dark-accent' : 'bg-app-dark-card opacity-70'
          }`}
        >
          <Text className="text-base font-semibold text-app-dark-text">
            {isSubmitting ? 'Saving...' : submitLabel}
          </Text>
        </Pressable>

        {onCancel ? (
          <Pressable
            onPress={onCancel}
            className="h-12 items-center justify-center rounded-md border border-app-dark-card"
          >
            <Text className="text-base font-semibold text-app-dark-text">Cancel</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
