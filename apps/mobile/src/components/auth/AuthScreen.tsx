import type { PropsWithChildren, ReactNode } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HappynachbarBrand } from '@/components/ui/HappynachbarBrand';

type Props = PropsWithChildren<{
  title: string;
  subtitle?: string;
  footer?: ReactNode;
}>;

export function AuthScreen({ title, subtitle, footer, children }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-app-dark-bg">
      <View className="flex-1 items-center px-6 pt-20">
        <View className="w-full max-w-[420px]">
          <View className="mb-8 items-center">
            <HappynachbarBrand size={36} />
          </View>

          <Text className="mb-6 text-center text-[32px] font-extrabold leading-[40px] text-app-dark-text">
            {title}
          </Text>

          {subtitle ? (
            <Text className="mb-10 text-center text-base leading-7 text-app-dark-brand">
              {subtitle}
            </Text>
          ) : null}

          <View className="gap-4">{children}</View>
          {footer ? <View className="mt-5">{footer}</View> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
