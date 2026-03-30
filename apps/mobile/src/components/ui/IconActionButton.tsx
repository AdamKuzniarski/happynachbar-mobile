import type { ReactNode } from 'react';
import { Pressable } from 'react-native';

type Props = {
  children: ReactNode;
  onPress: () => void;
  className?: string;
};

export function IconActionButton({ children, onPress, className = '' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={`items-center justify-center self-start rounded-md border border-app-dark-card p-2 ${className}`.trim()}
    >
      {children}
    </Pressable>
  );
}
