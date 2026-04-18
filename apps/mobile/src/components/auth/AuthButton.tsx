import { Pressable, Text } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  disabled: boolean;
  variant?: 'primary' | 'secondary';
};

export function AuthButton({ label, onPress, disabled = false, variant = 'primary' }: Props) {
  const bgClass =
    variant === 'primary'
      ? disabled
        ? 'bg-app-dark-card opacity-70'
        : 'bg-app-dark-accent'
      : 'bg-app-dark-card';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`h-12  items-center justify-center rounded-md ${bgClass}`}
    >
      <Text className={'text-base font-semibold text-app-dark-text'}>{label}</Text>
    </Pressable>
  );
}
