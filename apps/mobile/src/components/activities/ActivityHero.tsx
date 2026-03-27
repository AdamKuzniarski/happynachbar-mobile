import { Image, ScrollView, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

type Props = {
  title: string;
  category?: string;
  galleryImages: string[];
  galleryImageWidth: number;
  currentImageIndex: number;
  onGalleryScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

export function ActivityHero({
  title,
  category,
  galleryImages,
  galleryImageWidth,
  currentImageIndex,
  onGalleryScroll,
}: Props) {
  return (
    <>
      <Text className={'text-center text-2xl font-bold text-app-dark-text'}>{title}</Text>

      {galleryImages.length > 0 ? (
        <View className="gap-2">
          <View className="absolute left-3 top-3 z-10 self-start rounded-full bg-app-dark-accent px-3 py-1">
            <Text className="text-xs font-semibold text-[#203321]">{category || '—'}</Text>
          </View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onGalleryScroll}
          >
            {galleryImages.map((url, index) => (
              <View key={`${url}-${index}`} style={{ width: galleryImageWidth }}>
                <Image
                  source={{ uri: url }}
                  resizeMode={'cover'}
                  className={'h-64 w-full rounded-md bg-app-dark-card'}
                />
              </View>
            ))}
          </ScrollView>

          {galleryImages.length > 1 ? (
            <View className="flex-row items-center justify-center gap-2">
              {galleryImages.map((_, index) => (
                <View
                  key={`dot-${index}`}
                  className={`h-2 w-2 rounded-full ${
                    index === currentImageIndex ? 'bg-app-dark-accent' : 'bg-app-dark-card'
                  }`}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : (
        <View className={'h-64 w-full rounded-md bg-app-dark-card'}>
          <View className="absolute left-3 top-3 z-10 self-start rounded-full bg-app-dark-accent px-3 py-1">
            <Text className="text-xs font-semibold text-[#203321]">{category || '—'}</Text>
          </View>
        </View>
      )}
    </>
  );
}
