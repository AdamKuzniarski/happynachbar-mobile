import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreatePage() {
  return (
    <SafeAreaView className="flex-1 bg-app-dark-bg">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl font-bold text-app-dark-text">Inserieren</Text>
        <Text className="mt-2 text-center text-sm text-app-dark-brand">
          Der Create-Flow folgt im nächsten Ticket.
        </Text>
      </View>
    </SafeAreaView>
  );
}
