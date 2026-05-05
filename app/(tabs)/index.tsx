import Radiobutton from "@/components/radiobutton";
import { router } from "expo-router";
import { Button, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView className="bg-white h-full">
      <Text>Home Screen</Text>
      <Radiobutton options={["Yes", "No", "Don't Care"]} />
      <Button title="Create invite" onPress={() => router.push("/invite")} />
      <Button
        title="Create session"
        onPress={() => router.push("/createSession")}
      />
    </SafeAreaView>
  );
}
