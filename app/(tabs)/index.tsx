import Radiobutton from "@/components/radiobutton";
import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="bg-white h-full">
      <Text>Home Screen</Text>
      <Radiobutton options={["Yes", "No", "Don't Care"]} />
    </View>
  );
}
