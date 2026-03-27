import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { InfoPill } from '@/components/ui/InfoPill';
import { SectionCard } from '@/components/ui/SectionCard';

type Props = {
  startAt?: string;
  plz?: string;
  creatorName: string;
  updatedAt?: string;
  formatDate: (value?: string) => string;
};

export function ActivityMetaSection({
  startAt,
  plz,
  creatorName,
  updatedAt,
  formatDate,
}: Props) {
  return (
    <SectionCard>
      <View className="flex-row flex-wrap justify-center gap-2">
        <InfoPill icon={<Ionicons name="calendar-outline" size={14} color="#B8C3AF" />}>
          {formatDate(startAt)}
        </InfoPill>

        <InfoPill icon={<Ionicons name="location-outline" size={14} color="#B8C3AF" />}>
          {plz || '—'}
        </InfoPill>
      </View>

      <View className="mt-4 items-center gap-2">
        <View className="flex-row items-center gap-2">
          <Ionicons name="person-outline" size={13} color="#8F9B87" />
          <Text className="text-sm text-app-dark-brand">{creatorName}</Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Ionicons name="time-outline" size={13} color="#8F9B87" />
          <Text className="text-xs tracking-[0.3px] text-app-dark-brand">
            aktualisiert {formatDate(updatedAt)}
          </Text>
        </View>
      </View>
    </SectionCard>
  );
}
