import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { HappynachbarBrand } from '@/components/ui/HappynachbarBrand';

export default function LandingPage() {
  async function handleContinue() {
    router.push('/login');
  }

  return (
    <SafeAreaView className="flex-1 bg-app-dark-bg">
      <View className="flex-1 items-center px-6 pt-20">
        <View className="w-full max-w-[420px] items-center">
          <Text className="mb-4 text-center text-[28px] font-extrabold leading-[36px] text-app-dark-text">
            Herzlich Willkommen bei
          </Text>

          <View className="mb-8">
            <HappynachbarBrand size={44} />
          </View>

          <Text className="mb-12 text-center text-base leading-8 text-app-dark-brand">
            Erstelle eigene Aktivitäten oder finde{'\n'} Events und Hilfsangebote in deiner Nähe.
            {'\n'}Ganz unkompliziert.
          </Text>

          <Pressable
            testID="landing-continue"
            onPress={handleContinue}
            className="mt-5 h-12 w-full items-center justify-center rounded-md bg-app-dark-accent"
          >
            <Text className="text-center font-semibold text-app-dark-text">
              Entdecke deine Nachbarschaft!
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
