import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { IconActionButton } from '@/components/ui/IconActionButton';

type Props = {
  onArchive: () => void;
  onEdit: () => void;
};

export function ActivityOwnerActions({ onArchive, onEdit }: Props) {
  return (
    <View className="flex-row items-center gap-3">
      <IconActionButton onPress={onArchive}>
        <Ionicons name="trash-outline" size={16} color="#F3F6EE" />
      </IconActionButton>

      <IconActionButton onPress={onEdit}>
        <Ionicons name="create-outline" size={16} color="#F3F6EE" />
      </IconActionButton>
    </View>
  );
}
