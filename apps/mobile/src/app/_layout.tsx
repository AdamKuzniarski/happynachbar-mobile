import "../../global.css";
import {Stack} from "expo-router";
import {StatusBar} from "react-native";

export default function RootLayout() {
    return (
        <>
        <StatusBar style="light" />
        <Stack
    screenOptions={{
        headerShown: false,
    }}
    />
            </>);
}
