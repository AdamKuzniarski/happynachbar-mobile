import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TextInput, Pressable } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../../theme/colors";

export default function LandingPage() {
  const [postalCode, setPostalCode] = useState("");
  const isValid = postalCode.length === 5;

  function handlePostalCodeChange(value: string) {
    setPostalCode(value.replace(/\D/g, "").slice(0, 5));
  }

  async function handleContinue() {
    isValid && setPostalCode("");

    await AsyncStorage.setItem("postalCode", postalCode);
    //router.push("/login");
  }

  return (
    <SafeAreaView className="flex-1 bg-app-dark-bg">
      <View className="flex-1 items-center px-6 pt-20">
        <View className="w-full max-w-[420px] items-center">
          <Text className="mb-8 text-center text-[32px] font-extrabold leading-[40px] text-app-dark-text">
            Herzlich Willkommen bei happynachbar
          </Text>
          <Text className="mb-12 text-center text-base leading-8 text-app-dark-brand">
            Erstelle eigene Aktivitäten oder finde Events und Hilfsangebote in deiner Nähe. Ganz
            unkompliziert.
          </Text>
          <View className="w-full items-center">
            <Text className="mb-3 text-[15px] font-semibold text-app-dark-text">Postleitzahl</Text>
          </View>

          <TextInput
            value={postalCode}
            onChangeText={handleContinue}
            keyboardType="number-pad"
            placeholder="z.B. 10115"
            placeholderTextColor={colors.dark.brand}
            maxLength={5}
            className="h-12 w-40 rounded-md border border-app-dark-brand bg-app-light-bg px-4 text-center text-base text-app-dark-text"
          />

          <Pressable
            onPress={handleContinue}
            disabled={!isValid}
            className={`mt-5 h-12 w-full items-center justify-center rounded-md ${
              isValid ? "bg-app-dark-accent" : "bg-app-dark-card opacity-70"
            }`}
          >
            <Text className="text-base font-semibold text-app-dark-text">Weiter</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
