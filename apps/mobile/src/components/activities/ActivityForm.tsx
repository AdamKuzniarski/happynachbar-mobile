import { useEffect, useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';

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

const MAX_IMAGE_URLS = 5;

type AddImageUrlStatus = 'none' | 'added' | 'invalid' | 'duplicate' | 'limit';

type AddImageUrlResult = {
  status: AddImageUrlStatus;
  nextUrls: string[];
};

type UnsplashPhotoResponse = {
  urls?: {
    regular?: string;
    full?: string;
    small?: string;
    raw?: string;
  };
};

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function extractUnsplashPhotoId(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname !== 'unsplash.com' && url.hostname !== 'www.unsplash.com') {
      return null;
    }

    const segments = url.pathname.split('/').filter(Boolean);
    const photosIdx = segments.findIndex((segment) => segment === 'photos');
    if (photosIdx >= 0 && segments[photosIdx + 1]) {
      return segments[photosIdx + 1];
    }

    const fotosIdx = segments.findIndex((segment) => segment === 'fotos');
    if (fotosIdx >= 0 && segments[fotosIdx + 1]) {
      const slug = segments[fotosIdx + 1];
      const match = /-([A-Za-z0-9_-]{8,})$/.exec(slug);
      if (match?.[1]) {
        return match[1];
      }
    }
  } catch {}

  return null;
}

async function resolveImageUrl(value: string) {
  const trimmed = value.trim();
  if (!isValidHttpUrl(trimmed)) {
    return trimmed;
  }

  const unsplashId = extractUnsplashPhotoId(trimmed);
  if (!unsplashId) {
    return trimmed;
  }

  const unsplashDownloadUrl = `https://unsplash.com/photos/${encodeURIComponent(
    unsplashId,
  )}/download?force=true&w=1600`;

  try {
    const response = await fetch(`https://unsplash.com/napi/photos/${encodeURIComponent(unsplashId)}`);
    if (!response.ok) {
      return trimmed;
    }

    const payload = (await response.json()) as UnsplashPhotoResponse;
    const directUrl =
      payload?.urls?.regular ?? payload?.urls?.full ?? payload?.urls?.small ?? payload?.urls?.raw;

    if (typeof directUrl === 'string' && isValidHttpUrl(directUrl)) {
      return directUrl;
    }
  } catch {}

  return unsplashDownloadUrl;
}

function getAddImageUrlResult(rawInput: string, currentUrls: string[]): AddImageUrlResult {
  const normalized = rawInput.trim();

  if (!normalized) {
    return { status: 'none', nextUrls: currentUrls };
  }

  if (!isValidHttpUrl(normalized)) {
    return { status: 'invalid', nextUrls: currentUrls };
  }

  if (currentUrls.includes(normalized)) {
    return { status: 'duplicate', nextUrls: currentUrls };
  }

  if (currentUrls.length >= MAX_IMAGE_URLS) {
    return { status: 'limit', nextUrls: currentUrls };
  }

  return { status: 'added', nextUrls: [...currentUrls, normalized] };
}

function toValidDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateInput(value?: string) {
  const date = toValidDate(value);
  if (!date) return '';

  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

function formatTimeInput(value?: string) {
  const date = toValidDate(value);
  if (!date) return '';

  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function normalizeDateInput(value: string) {
  const digits = value.replace(/\D+/g, '').slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

function normalizeTimeInput(value: string) {
  const digits = value.replace(/\D+/g, '').slice(0, 4);

  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function parseStartAt(dateInput: string, timeInput: string) {
  const dateValue = dateInput.trim();
  const timeValue = timeInput.trim();

  if (!dateValue && !timeValue) {
    return { iso: undefined as string | undefined, error: null as string | null };
  }

  if (!dateValue || !timeValue) {
    return {
      iso: undefined as string | undefined,
      error: 'Bitte Datum und Uhrzeit vollständig ausfüllen.',
    };
  }

  const dateMatch = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(dateValue);
  if (!dateMatch) {
    return {
      iso: undefined as string | undefined,
      error: 'Datum muss im Format TT.MM.JJJJ sein.',
    };
  }

  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue);
  if (!timeMatch) {
    return {
      iso: undefined as string | undefined,
      error: 'Uhrzeit muss im Format HH:mm sein.',
    };
  }

  const day = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const year = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    return {
      iso: undefined as string | undefined,
      error: 'Datum oder Uhrzeit ist ungültig.',
    };
  }

  const parsed = new Date(year, month - 1, day, hour, minute, 0, 0);
  const isSameDate =
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day &&
    parsed.getHours() === hour &&
    parsed.getMinutes() === minute;

  if (!isSameDate) {
    return {
      iso: undefined as string | undefined,
      error: 'Datum oder Uhrzeit ist ungültig.',
    };
  }

  return { iso: parsed.toISOString(), error: null as string | null };
}

export function ActivityForm({
  initialValues,
  submitLabel,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: Props) {
  const initialTitle = initialValues?.title ?? '';
  const initialDescription = initialValues?.description ?? '';
  const initialPlz = initialValues?.plz ?? '';
  const initialCategory = initialValues?.category ?? ActivityCategory.OUTDOOR;
  const initialStartAt = initialValues?.startAt;
  const initialImageUrlsSignature = (initialValues?.imageUrls ?? []).join('\n');

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [plz, setPlz] = useState(initialPlz);
  const [category, setCategory] = useState<ActivityCategory>(initialCategory);
  const [startDateInput, setStartDateInput] = useState(formatDateInput(initialStartAt));
  const [startTimeInput, setStartTimeInput] = useState(formatTimeInput(initialStartAt));
  const [imageUrls, setImageUrls] = useState<string[]>(initialValues?.imageUrls ?? []);
  const [urlInput, setUrlInput] = useState('');
  const [urlStatus, setUrlStatus] = useState<'added' | 'duplicate' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [failedPreviewUrls, setFailedPreviewUrls] = useState<Record<string, boolean>>({});
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);

  useEffect(() => {
    setTitle(initialTitle);
    setDescription(initialDescription);
    setPlz(initialPlz);
    setCategory(initialCategory);
    setStartDateInput(formatDateInput(initialStartAt));
    setStartTimeInput(formatTimeInput(initialStartAt));
    setImageUrls(initialImageUrlsSignature ? initialImageUrlsSignature.split('\n') : []);
    setFailedPreviewUrls({});
  }, [
    initialTitle,
    initialDescription,
    initialPlz,
    initialCategory,
    initialStartAt,
    initialImageUrlsSignature,
  ]);

  useEffect(() => {
    const initialUrls = initialImageUrlsSignature ? initialImageUrlsSignature.split('\n') : [];
    if (!initialUrls.length) return;

    let cancelled = false;

    async function resolveInitialUrls() {
      const resolved = await Promise.all(initialUrls.map((url) => resolveImageUrl(url)));
      if (cancelled) return;

      const deduplicated = Array.from(
        new Set(resolved.map((url) => url.trim()).filter((url) => url.length > 0)),
      );
      setImageUrls(deduplicated);
      setFailedPreviewUrls({});
    }

    resolveInitialUrls().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [initialImageUrlsSignature]);

  useEffect(() => {
    if (!urlStatus) return;
    const timeout = setTimeout(() => setUrlStatus(null), 2000);
    return () => clearTimeout(timeout);
  }, [urlStatus]);

  const hasValidTitle = title.trim().length >= 3;
  const hasValidPlz = /^\d{5}$/.test(plz);
  const isValid = hasValidTitle && hasValidPlz;

  function applyAddImageUrlResult(result: AddImageUrlResult) {
    if (result.status === 'invalid') {
      setFormError('Bitte eine gültige Bild-URL mit http:// oder https:// eingeben.');
      return false;
    }

    if (result.status === 'limit') {
      setFormError(`Maximal ${MAX_IMAGE_URLS} Bild-URLs sind erlaubt.`);
      return false;
    }

    if (result.status === 'duplicate') {
      setUrlStatus('duplicate');
      return false;
    }

    if (result.status === 'added') {
      setImageUrls(result.nextUrls);
      setUrlInput('');
      setUrlStatus('added');
      setFailedPreviewUrls({});
    }

    return true;
  }

  async function resolveAndApplyUrlInput(baseUrls: string[]) {
    const raw = urlInput.trim();
    if (!raw) {
      return { ok: true, nextUrls: baseUrls };
    }

    setIsResolvingUrl(true);
    try {
      const resolvedInput = await resolveImageUrl(raw);
      const result = getAddImageUrlResult(resolvedInput, baseUrls);
      const ok = applyAddImageUrlResult(result);
      return { ok, nextUrls: result.status === 'added' ? result.nextUrls : baseUrls };
    } finally {
      setIsResolvingUrl(false);
    }
  }

  async function handleSubmit() {
    if (!isValid || isSubmitting || isResolvingUrl) return;
    setFormError(null);

    const urlResult = await resolveAndApplyUrlInput(imageUrls);
    if (!urlResult.ok) return;
    const nextImageUrls = urlResult.nextUrls;
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
      imageUrls: nextImageUrls.length ? nextImageUrls : undefined,
    });
  }

  return (
    <View className="gap-4">
      <View className="gap-2">
        <Text className="text-sm font-semibold text-app-dark-text">Titel</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Was möchtest du veröffentlichen?"
          placeholderTextColor="#B8C3AF"
          className="rounded-md border border-app-dark-card bg-app-dark-bg px-4 py-3 text-base text-app-dark-text"
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold text-app-dark-text">PLZ</Text>
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
        <Text className="text-sm font-semibold text-app-dark-text">Kategorie</Text>
        <ActivityCategoryPicker value={category} onChange={setCategory} />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold text-app-dark-text">Beschreibung</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Füge eine kurze Beschreibung hinzu"
          placeholderTextColor="#B8C3AF"
          multiline
          textAlignVertical="top"
          className="min-h-32 rounded-md border border-app-dark-card bg-app-dark-bg px-4 py-3 text-base text-app-dark-text"
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold text-app-dark-text">Startzeit (optional)</Text>
        <View className="flex-row gap-2">
          <TextInput
            value={startDateInput}
            onChangeText={(value) => setStartDateInput(normalizeDateInput(value))}
            placeholder="TT.MM.JJJJ"
            placeholderTextColor="#B8C3AF"
            keyboardType="number-pad"
            className="flex-1 rounded-md border border-app-dark-card bg-app-dark-bg px-4 py-3 text-base text-app-dark-text"
          />
          <TextInput
            value={startTimeInput}
            onChangeText={(value) => setStartTimeInput(normalizeTimeInput(value))}
            placeholder="HH:mm"
            placeholderTextColor="#B8C3AF"
            keyboardType="number-pad"
            className="w-28 rounded-md border border-app-dark-card bg-app-dark-bg px-4 py-3 text-base text-app-dark-text"
          />
        </View>
        <Text className="text-xs text-app-dark-brand">Optional, Format: TT.MM.JJJJ und HH:mm</Text>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold text-app-dark-text">
          Bild-URLs (optional, max. {MAX_IMAGE_URLS})
        </Text>
        <View className="flex-row items-center gap-2">
          <TextInput
            value={urlInput}
            onChangeText={setUrlInput}
            placeholder="https://beispiel.de/bild.jpg"
            placeholderTextColor="#B8C3AF"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={() => {
              setFormError(null);
              resolveAndApplyUrlInput(imageUrls).catch(() => {});
            }}
            className="flex-1 rounded-md border border-app-dark-card bg-app-dark-bg px-4 py-3 text-base text-app-dark-text"
          />
          <Pressable
            onPress={() => {
              setFormError(null);
              resolveAndApplyUrlInput(imageUrls).catch(() => {});
            }}
            disabled={isResolvingUrl}
            className="h-11 items-center justify-center rounded-md border border-app-dark-card px-3"
          >
            <Text className="text-sm font-semibold text-app-dark-text">
              {isResolvingUrl ? 'Prüfe...' : 'Hinzufügen'}
            </Text>
          </Pressable>
        </View>
        {urlStatus === 'added' ? (
          <Text className="text-xs text-app-dark-brand">Bild-URL hinzugefügt.</Text>
        ) : null}
        {urlStatus === 'duplicate' ? (
          <Text className="text-xs text-red-300">Diese URL ist bereits in der Liste.</Text>
        ) : null}

        {imageUrls.length > 0 ? (
          <View className="gap-2">
            {imageUrls.map((url, idx) => (
              <View
                key={`${url}-${idx}`}
                className="overflow-hidden rounded-md border border-app-dark-card bg-app-dark-bg"
              >
                {failedPreviewUrls[url] ? (
                  <View className="h-28 items-center justify-center bg-app-dark-card px-3">
                    <Text className="text-xs text-red-300">
                      Bildvorschau konnte nicht geladen werden.
                    </Text>
                  </View>
                ) : (
                  <Image
                    source={{ uri: url }}
                    resizeMode="cover"
                    className="h-28 w-full bg-app-dark-card"
                    onError={() => {
                      setFailedPreviewUrls((prev) => ({ ...prev, [url]: true }));
                    }}
                  />
                )}
                <View className="flex-row items-center gap-2 px-3 py-2">
                  <Text className="flex-1 text-xs text-app-dark-brand" numberOfLines={1}>
                    {url}
                  </Text>
                  <Pressable
                    onPress={() => {
                      setImageUrls((prev) => prev.filter((_, i) => i !== idx));
                      setFailedPreviewUrls((prev) => {
                        const next = { ...prev };
                        delete next[url];
                        return next;
                      });
                    }}
                    className="rounded-md border border-app-dark-card px-2 py-1"
                  >
                    <Text className="text-xs font-semibold text-app-dark-text">Entfernen</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {formError ? <Text className="text-sm text-red-300">{formError}</Text> : null}

      <View className="gap-3 pt-2">
        <Pressable
          onPress={() => handleSubmit().catch(() => {})}
          disabled={!isValid || isSubmitting || isResolvingUrl}
          className={`h-12 items-center justify-center rounded-md ${
            isValid && !isSubmitting && !isResolvingUrl
              ? 'bg-app-dark-accent'
              : 'bg-app-dark-card opacity-70'
          }`}
        >
          <Text className="text-base font-semibold text-app-dark-text">
            {isSubmitting ? 'Wird gespeichert...' : submitLabel}
          </Text>
        </Pressable>

        {onCancel ? (
          <Pressable
            onPress={onCancel}
            className="h-12 items-center justify-center rounded-md border border-app-dark-card"
          >
            <Text className="text-base font-semibold text-app-dark-text">Abbrechen</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
