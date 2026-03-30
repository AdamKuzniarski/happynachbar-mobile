import { Image, Pressable, Text, View } from 'react-native';

import { MAX_IMAGE_URLS } from '@/components/activities/activity-form-utils';

type Props = {
  imageUrls: string[];
  failedPreviewUrls: Record<string, boolean>;
  isUploadingImage: boolean;
  onPickImage: () => void;
  onTakePhoto: () => void;
  onImageError: (url: string) => void;
  onRemoveImage: (url: string, index: number) => void;
};

export function ActivityImagesField({
  imageUrls,
  failedPreviewUrls,
  isUploadingImage,
  onPickImage,
  onTakePhoto,
  onImageError,
  onRemoveImage,
}: Props) {
  const canAddMore = imageUrls.length < MAX_IMAGE_URLS;

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-app-dark-brand">
        Bilder (optional, max. {MAX_IMAGE_URLS})
      </Text>

      <View className="flex-row flex-wrap gap-2">
        <Pressable
          onPress={onPickImage}
          disabled={!canAddMore || isUploadingImage}
          className={`rounded-md px-3 py-3 ${
            canAddMore && !isUploadingImage ? 'bg-app-dark-card' : 'bg-app-dark-card opacity-60'
          }`}
        >
          <Text className="text-sm font-semibold text-app-dark-text">
            {isUploadingImage ? 'Lädt...' : 'Foto wählen'}
          </Text>
        </Pressable>

        <Pressable
          onPress={onTakePhoto}
          disabled={!canAddMore || isUploadingImage}
          className={`rounded-md px-3 py-3 ${
            canAddMore && !isUploadingImage ? 'bg-app-dark-card' : 'bg-app-dark-card opacity-60'
          }`}
        >
          <Text className="text-sm font-semibold text-app-dark-text">Foto aufnehmen</Text>
        </Pressable>
      </View>

      {!canAddMore ? (
        <Text className="text-xs text-app-dark-brand">
          Maximale Anzahl an Bildern erreicht.
        </Text>
      ) : (
        <Text className="text-xs text-app-dark-brand">
          Bilder direkt aus der Mediathek oder Kamera hinzufügen.
        </Text>
      )}

      {imageUrls.length > 0 ? (
        <View className="gap-3">
          {imageUrls.map((url, index) => (
            <View
              key={`${url}-${index}`}
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
                  onError={() => onImageError(url)}
                />
              )}

              <View className="gap-3 px-3 py-3">
                <Pressable
                  onPress={() => onRemoveImage(url, index)}
                  className="self-start rounded-md border border-app-dark-card px-3 py-2"
                >
                  <Text className="text-xs font-semibold text-app-dark-text">Entfernen</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
