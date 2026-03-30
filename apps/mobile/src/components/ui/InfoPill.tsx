import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type Props = {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  textClassName?: string;
};

export function InfoPill({ icon, children, className = '', textClassName = '' }: Props) {
  return (
    <View
      className={`flex-row items-center gap-2 rounded-full bg-app-dark-card px-3 py-2 ${className}`.trim()}
    >
      {icon}
      <Text className={`text-sm font-semibold text-app-dark-text ${textClassName}`.trim()}>
        {children}
      </Text>
    </View>
  );
}
