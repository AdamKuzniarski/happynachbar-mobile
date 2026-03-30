import type { ReactNode } from 'react';
import { View } from 'react-native';

type Props = {
  children: ReactNode;
  className?: string;
};

export function SectionCard({ children, className = '' }: Props) {
  return <View className={`rounded-md bg-app-dark-bg p-4 ${className}`.trim()}>{children}</View>;
}
