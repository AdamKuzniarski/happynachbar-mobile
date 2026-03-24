import { Pressable, ScrollView, Text, View } from 'react-native';

import { ActivityCategory, activityCategories, activityCategoryLabels } from '@/lib/enums';

type Props = {
  value: ActivityCategory;
  onChange: (value: ActivityCategory) => void;
};

export function ActivityCategoryPicker({ value, onChange }: Props) {
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
