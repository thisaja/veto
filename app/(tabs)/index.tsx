import Radiobutton from "@/components/radiobutton";
import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="bg-white h-full">
      <Text>Home Screen</Text>
      <Radiobutton options={["Yes", "No", "Don't Care"]} />
      <Button title="Create Session" onPress={() => router.push("/createSession")} />
    </View>
  );
}
