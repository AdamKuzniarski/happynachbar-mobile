import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomePage() {
    return (
        <SafeAreaView className="flex-1 bg-app-dark-bg">
            <View className="flex-1 items-center justify-center">
                <Text className="text-[28px] font-extrabold text-app-dark-text">
                    Home
                </Text>
            </View>
        </SafeAreaView>
    );
}