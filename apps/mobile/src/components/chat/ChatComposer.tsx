import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sendError?: string | null;
  actionError?: string | null;
};

export function ChatComposer({
  value,
  onChange,
  onSend,
  sendError,
  actionError,
}: ChatComposerProps) {
  const isDisabled = !value;
  return (
    <View className="border-t border-app-dark-card px-4 pb-4 pt-3">
      {sendError ? <Text className="mb-2 text-sm text-red-300">{sendError}</Text> : null}
      {actionError ? <Text className="mb-2 text-sm text-red-300">{actionError}</Text> : null}

      <View className="flex-row items-center gap-2">
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Nachricht..."
          placeholderTextColor="#B8C3AF"
          className="h-11 flex-1 rounded-2xl border border-app-dark-card bg-app-dark-bg px-4 text-base text-app-dark-text"
        />

        <Pressable
          onPress={onSend}
          disabled={isDisabled}
          className={`h-11 w-11 items-center justify-center rounded-2xl ${
            isDisabled ? 'bg-app-dark-card' : 'bg-app-dark-accent'
          }`}
        >
          <Ionicons name="send" size={18} color="#F3F6EE" />
        </Pressable>
      </View>
    </View>
  );
}
