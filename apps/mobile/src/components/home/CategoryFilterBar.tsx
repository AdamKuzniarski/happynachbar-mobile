import { Ionicons } from '@expo/vector-icons';
import { Pressable, View, ScrollView, Text } from 'react-native';
import { ActivityCategory, activityCategories, activityCategoryLabels } from '@/lib/enums';

type Props = {
  value: ActivityCategory | null;
  onChange: (value: ActivityCategory | null) => void;
};

function getCategoryIcon(category: ActivityCategory) {
  switch (category) {
    case ActivityCategory.OUTDOOR:
      return 'leaf-outline';
    case ActivityCategory.SPORT:
      return 'fitness-outline';
    case ActivityCategory.SOCIAL:
      return 'people-outline';
    case ActivityCategory.INDOOR:
      return 'home-outline';
    case ActivityCategory.HELP:
      return 'hand-left-outline';
    case ActivityCategory.OTHER:
      return 'apps-outline';
    default:
      return 'help-circle-outline';
  }
}

export function CategoryFilterBar({ value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingRight: 16 }}
    >
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => onChange(null)}
          className={`flex-row items-center rounded-full px-4 py-3 ${
            value === null ? 'bg-app-dark-accent' : 'bg-app-dark-card'
          }`}
        >
          <Ionicons name="grid-outline" size={16} color="#F3F6EE" />
          <Text className="ml-2 font-medium text-app-dark-text">All</Text>
        </Pressable>

        {activityCategories.map((category) => {
          const isActive = value === category;

          return (
            <Pressable
              key={category}
              onPress={() => onChange(category)}
              className={`flex-row items-center rounded-full px-4 py-3 ${
                isActive ? 'bg-app-dark-accent' : 'bg-app-dark-card'
              }`}
            >
              <Ionicons name={getCategoryIcon(category)} size={16} color="#F3F6EE" />
              <Text className="ml-2 font-medium text-app-dark-text">
                {activityCategoryLabels[category]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
