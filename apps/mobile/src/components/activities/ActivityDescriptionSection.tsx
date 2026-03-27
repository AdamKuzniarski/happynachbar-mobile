import { Text } from 'react-native';

import { SectionCard } from '@/components/ui/SectionCard';

type Props = {
  description?: string;
};

export function ActivityDescriptionSection({ description }: Props) {
  return (
    <SectionCard>
      <Text className={'mb-2 text-base font-semibold text-app-dark-text'}>Beschreibung</Text>

      <Text className={'leading-6 text-app-dark-brand'}>
        {description?.trim() || 'Keine Beschreibung vorhanden.'}
      </Text>
    </SectionCard>
  );
}
