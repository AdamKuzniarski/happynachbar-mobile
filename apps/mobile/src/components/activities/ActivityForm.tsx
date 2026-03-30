import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { ActivityImagesField } from '@/components/activities/ActivityImagesField';
import { ActivityPickerModal } from '@/components/activities/ActivityPickerModal';
import { ActivityCategory, activityCategories, activityCategoryLabels } from '@/lib/enums';
import type { ActivityWritePayload } from '@/lib/activities';
import { uploadActivityImage } from '@/lib/uploads';
import {
  formatDateInput,
  formatTimeInput,
  getInitialActivityFormValues,
  getPickerBaseDate,
  normalizePostalCode,
  parseStartAt,
  MAX_IMAGE_URLS,
} from '@/components/activities/activity-form-utils';

type Props = {
  initialValues?: Partial<ActivityWritePayload>;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (payload: ActivityWritePayload) => Promise<void> | void;
  onCancel?: () => void;
};

const fieldWrapperClass = 'gap-2';
const inputClassName =
  'rounded-md border border-app-dark-card bg-app-dark-bg px-4 py-3 text-base text-app-dark-text';
const multilineInputClassName = `min-h-32 ${inputClassName}`;
const compactInputClassName =
  'h-12 rounded-md border border-app-dark-card bg-app-dark-bg px-4 text-base text-app-dark-text';

function CategoryPicker({
  value,
  onChange,
}: {
  value: ActivityCategory;
  onChange: (value: ActivityCategory) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2 pr-4">
        {activityCategories.map((category) => {
          const isActive = value === category;

          return (
            <Pressable
              key={category}
              onPress={() => onChange(category)}
              className={`rounded-full px-4 py-3 ${
                isActive ? 'bg-app-dark-accent' : 'bg-app-dark-card'
              }`}
            >
              <Text className="font-medium text-app-dark-text">
                {activityCategoryLabels[category]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

export function ActivityForm({
  initialValues,
  submitLabel,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: Props) {
  const initialForm = getInitialActivityFormValues(initialValues);
  const {
    title: initialTitle,
    description: initialDescription,
    plz: initialPlz,
    category: initialCategory,
    startDateInput: initialStartDateInput,
    startTimeInput: initialStartTimeInput,
    imageUrls: initialImageUrls,
  } = initialForm;
  const initialImageUrlsSignature = initialImageUrls.join('\n');
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [plz, setPlz] = useState(initialPlz);
  const [category, setCategory] = useState(initialCategory);
  const [startDateInput, setStartDateInput] = useState(initialStartDateInput);
  const [startTimeInput, setStartTimeInput] = useState(initialStartTimeInput);
  const [imageUrls, setImageUrls] = useState<string[]>(initialImageUrls);
  const [formError, setFormError] = useState<string | null>(null);
  const [failedPreviewUrls, setFailedPreviewUrls] = useState<Record<string, boolean>>({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [openIosPicker, setOpenIosPicker] = useState<'date' | 'time' | null>(null);
  const [iosPickerValue, setIosPickerValue] = useState<Date>(() =>
    getPickerBaseDate(initialStartDateInput, initialStartTimeInput),
  );

  useEffect(() => {
    setTitle(initialTitle);
    setDescription(initialDescription);
    setPlz(initialPlz);
    setCategory(initialCategory);
    setStartDateInput(initialStartDateInput);
    setStartTimeInput(initialStartTimeInput);
    setImageUrls(initialImageUrlsSignature ? initialImageUrlsSignature.split('\n') : []);
    setFailedPreviewUrls({});
    setOpenIosPicker(null);
    setIosPickerValue(getPickerBaseDate(initialStartDateInput, initialStartTimeInput));
  }, [
    initialTitle,
    initialDescription,
    initialPlz,
    initialCategory,
    initialStartDateInput,
    initialStartTimeInput,
    initialImageUrlsSignature,
  ]);

  const hasValidTitle = title.trim().length >= 3;
  const hasValidPlz = /^\d{5}$/.test(plz);
  const isValid = hasValidTitle && hasValidPlz;
  const canSubmit = isValid && !isSubmitting && !isUploadingImage;

  function addImageUrl(url: string) {
    setImageUrls((prev) => {
      if (prev.includes(url)) return prev;
      if (prev.length >= MAX_IMAGE_URLS) return prev;
      return [...prev, url];
    });
    setFailedPreviewUrls((prev) => {
      const next = { ...prev };
      delete next[url];
      return next;
    });
  }

  function handleRemoveImage(url: string, idx: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
    setFailedPreviewUrls((prev) => {
      const next = { ...prev };
      delete next[url];
      return next;
    });
  }

  function handleImagePreviewError(url: string) {
    setFailedPreviewUrls((prev) => ({ ...prev, [url]: true }));
  }

  async function uploadPickedAsset(asset: ImagePicker.ImagePickerAsset) {
    if (imageUrls.length >= MAX_IMAGE_URLS) {
      setFormError(`Maximal ${MAX_IMAGE_URLS} Bilder sind erlaubt.`);
      return;
    }

    setFormError(null);
    setIsUploadingImage(true);
    try {
      const uploadedUrl = await uploadActivityImage(asset);
      addImageUrl(uploadedUrl);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Bild konnte nicht hochgeladen werden.');
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError('Bitte erlaube den Zugriff auf deine Fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    await uploadPickedAsset(result.assets[0]);
  }

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setFormError('Bitte erlaube den Zugriff auf die Kamera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    await uploadPickedAsset(result.assets[0]);
  }

  function applySelectedTime(date: Date) {
    setStartTimeInput(formatTimeInput(date.toISOString()));
    if (!startDateInput.trim()) {
      setStartDateInput(formatDateInput(date.toISOString()));
    }
    setFormError(null);
  }

  function applySelectedDate(date: Date) {
    setStartDateInput(formatDateInput(date.toISOString()));
    setFormError(null);
  }

  function handleTimeChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android' && event.type === 'dismissed') {
      return;
    }

    if (!selectedDate) {
      return;
    }

    if (Platform.OS === 'ios') {
      setIosPickerValue(selectedDate);
      return;
    }

    applySelectedTime(selectedDate);
  }

  function handleDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android' && event.type === 'dismissed') {
      return;
    }

    if (!selectedDate) {
      return;
    }

    if (Platform.OS === 'ios') {
      setIosPickerValue(selectedDate);
      return;
    }

    applySelectedDate(selectedDate);
  }

  function confirmIosPicker() {
    if (openIosPicker === 'date') {
      applySelectedDate(iosPickerValue);
    }

    if (openIosPicker === 'time') {
      applySelectedTime(iosPickerValue);
    }

    setOpenIosPicker(null);
  }

  function closeIosPicker() {
    setOpenIosPicker(null);
  }

  function openDatePicker() {
    const pickerValue = getPickerBaseDate(startDateInput, startTimeInput);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: pickerValue,
        mode: 'date',
        onChange: handleDateChange,
      });
      return;
    }

    setIosPickerValue(pickerValue);
    setOpenIosPicker('date');
  }

  function openTimePicker() {
    const pickerValue = getPickerBaseDate(startDateInput, startTimeInput);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: pickerValue,
        mode: 'time',
        is24Hour: true,
        onChange: handleTimeChange,
      });
      return;
    }

    setIosPickerValue(pickerValue);
    setOpenIosPicker('time');
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setFormError(null);

    const parsedStartAt = parseStartAt(startDateInput, startTimeInput);

    if (parsedStartAt.error) {
      setFormError(parsedStartAt.error);
      return;
    }

    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      plz,
      startAt: parsedStartAt.iso,
      imageUrls: imageUrls.length ? imageUrls : undefined,
    });
  }

  return (
    <View className="gap-4">
      <View className={fieldWrapperClass}>
        <Text className="text-sm font-medium text-app-dark-brand">Titel</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Was möchtest du veröffentlichen?"
          placeholderTextColor="#B8C3AF"
          className={inputClassName}
        />
      </View>

      <View className={fieldWrapperClass}>
        <ActivityImagesField
          imageUrls={imageUrls}
          failedPreviewUrls={failedPreviewUrls}
          isUploadingImage={isUploadingImage}
          onPickImage={() => {
            handlePickImage().catch(() => {});
          }}
          onTakePhoto={() => {
            handleTakePhoto().catch(() => {});
          }}
          onImageError={handleImagePreviewError}
          onRemoveImage={handleRemoveImage}
        />
      </View>

      <View className={fieldWrapperClass}>
        <Text className="text-sm font-medium text-app-dark-brand">PLZ</Text>
        <TextInput
          value={plz}
          onChangeText={(value) => setPlz(normalizePostalCode(value))}
          placeholder="63073"
          placeholderTextColor="#B8C3AF"
          keyboardType="number-pad"
          className={`w-28 ${compactInputClassName}`}
        />
      </View>

      <View className={fieldWrapperClass}>
        <Text className="text-sm font-medium text-app-dark-brand">Kategorie</Text>
        <CategoryPicker value={category} onChange={setCategory} />
      </View>

      <View className={fieldWrapperClass}>
        <Text className="text-sm font-medium text-app-dark-brand">Beschreibung</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Füge eine kurze Beschreibung hinzu"
          placeholderTextColor="#B8C3AF"
          multiline
          textAlignVertical="top"
          className={multilineInputClassName}
        />
      </View>

      <View className={fieldWrapperClass}>
        <Text className="text-sm font-medium text-app-dark-brand">Startzeit</Text>
        <View className="flex-row gap-2 self-start">
          <Pressable
            onPress={openDatePicker}
            className={`w-36 items-start justify-center ${compactInputClassName}`}
          >
            <Text
              className={startDateInput ? 'text-base text-app-dark-text' : 'text-base text-app-dark-brand'}
            >
              {startDateInput || 'TT.MM.JJJJ'}
            </Text>
          </Pressable>
          <Pressable
            onPress={openTimePicker}
            className={`w-36 ${compactInputClassName}`}
          >
            <View className="h-full items-start justify-center">
              <Text
                className={startTimeInput ? 'text-base text-app-dark-text' : 'text-base text-app-dark-brand'}
              >
                {startTimeInput || 'HH:mm'}
              </Text>
            </View>
          </Pressable>
        </View>
        <Text className="text-xs text-app-dark-brand">Datum und Uhrzeit auswählen</Text>
      </View>

      {Platform.OS === 'ios' ? (
        <ActivityPickerModal
          mode={openIosPicker}
          value={iosPickerValue}
          onClose={closeIosPicker}
          onConfirm={confirmIosPicker}
          onChange={openIosPicker === 'date' ? handleDateChange : handleTimeChange}
        />
      ) : null}

      {formError ? <Text className="text-sm text-red-300">{formError}</Text> : null}

      <View className="gap-3 pt-2">
        <Pressable
          onPress={() => handleSubmit().catch(() => {})}
          disabled={!canSubmit}
          className={`items-center justify-center rounded-md px-4 py-3 ${
            canSubmit ? 'bg-app-dark-accent' : 'bg-app-dark-card opacity-70'
          }`}
        >
          <Text className="text-base font-semibold text-app-dark-text">
            {isSubmitting ? 'Wird gespeichert...' : submitLabel}
          </Text>
        </Pressable>

        {onCancel ? (
          <Pressable
            onPress={onCancel}
            className="items-center justify-center self-center rounded-md border border-app-dark-card px-4 py-2"
          >
            <Text className="text-sm font-semibold text-app-dark-text">Abbrechen</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
