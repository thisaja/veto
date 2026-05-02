import Touchables from "@/components/button";
import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="bg-white h-full">
      <Text>Home Screen</Text>
      <Touchables />
    </View>
  );
}
