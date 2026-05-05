import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "../global.css";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="createSession" options={{ headerShown: false }} />
        <Stack.Screen name="invite" options={{ headerShown: false }} />
        <Stack.Screen name="questionnaire" options={{ headerShown: false }} />
        <Stack.Screen name="questionResults" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
