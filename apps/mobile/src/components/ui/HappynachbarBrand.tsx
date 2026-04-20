import { Text, View } from 'react-native';
import { HappynachbarLogoIcon } from './HappynachbarLogoIcon';

type HappynachbarBrandProps = {
  size?: number;
};

export function HappynachbarBrand({ size = 40 }: HappynachbarBrandProps) {
  return (
    <View className="flex-row items-center gap-3">
      <HappynachbarLogoIcon size={size} />
      <Text className="text-xl font-extrabold text-app-dark-text">happynachbar</Text>
    </View>
  );
}
