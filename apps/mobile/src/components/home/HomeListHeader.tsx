import { Ionicons } from '@expo/vector-icons';
import { Pressable, TextInput, View } from 'react-native';

import { ActivityCategory } from '@/lib/enums';
import { CategoryFilterBar } from '@/components/home/CategoryFilterBar';

type Props = {
  searchValue: string;
  onChangeSearch: (value: string) => void;
  selectedCategory: ActivityCategory | null;
  onChangeCategory: (value: ActivityCategory | null) => void;
};

export function HomeListHeader({
  searchValue,
  onChangeSearch,
  selectedCategory,
  onChangeCategory,
}: Props) {
  return (
    <View className="mb-4 gap-3">
      <View className="flex-row items-center rounded-full border border-app-dark-card bg-app-dark-bg px-4 py-3">
        <Ionicons name="search-outline" size={20} color="#B8C3AF" />

        <TextInput
          value={searchValue}
          onChangeText={onChangeSearch}
          placeholder="Search activities"
          placeholderTextColor="#B8C3AF"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          className="ml-3 flex-1 text-base text-app-dark-text"
        />

        {searchValue.length > 0 ? (
          <Pressable onPress={() => onChangeSearch('')}>
            <Ionicons name="close-circle" size={20} color="#B8C3AF" />
          </Pressable>
        ) : null}
      </View>

      <CategoryFilterBar value={selectedCategory} onChange={onChangeCategory} />
    </View>
  );
}
