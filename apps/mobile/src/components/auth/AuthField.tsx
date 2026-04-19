import type { TextInputProps } from 'react-native';
import { Text, TextInput, View } from 'react-native';
import { colors } from '@/theme/colors';

type Props = TextInputProps & {
  error?: string | null;
  className?: string;
};

export function AuthField({ error, className = '', ...props }: Props) {
  const borderClass = error ? 'border-red-500' : 'border-app-dark-card';

  return (
    <View className={'w-full'}>
      <TextInput
        placeholderTextColor={colors.dark.placeholder}
        className={`h-12 rounded-md border bg-app-dark-bg px-4 text-base text-app-dark-text ${borderClass} ${className}`.trim()}
        {...props}
      />
      {error ? <Text className={'mt-2 text-sm text-red-400'}>{error}</Text> : null}
    </View>
  );
}
