import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

type ChatRoomHeaderProps = {
  title: string;
  subtitle?: string;
  isOnline: boolean;
};

export function ChatRoomHeader({ title, isOnline, subtitle }: ChatRoomHeaderProps) {
  return (
    <View className={'flex-row items-start gap-3 py-4 pb-3 pt-4'}>
      <Pressable
        onPress={() => {
          router.back();
        }}
        className={'mt-0.5 h-10 w-10 items-center justify-center rounded-full bg-app-dark-card'}
      >
        <Ionicons name="chevron-back" size={20} color="#F3F6EE" />
      </Pressable>

      <View className={'flex-1'}>
        <Text className={'text-lg font-semibold text-app-dark-text'}>{title}</Text>
        <View className={'mt-1 flex-row items-center gap-2'}>
          <View className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-app-dark-brand'}`} />
          <Text className={"text-xs text-app-dark-brand"}>{isOnline?'Verbunden':'Offline'}{subtitle? ` · ${subtitle}` : ''}</Text>
        </View>
      </View>
    </View>
  );
}
