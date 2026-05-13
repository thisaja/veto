import { router } from "expo-router";
import { Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView className="h-full bg-white">
      <Button title="Create session" onPress={() => router.push("/createSession")} />
    </SafeAreaView>
  );
}
