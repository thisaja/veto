<<<<<<< Updated upstream
import Touchables from "@/components/button";
=======
import Card from "@/components/card";
import Radiobutton from "@/components/radiobutton";
>>>>>>> Stashed changes
import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="bg-white h-full">
      <Text>Home Screen</Text>
<<<<<<< Updated upstream
      <Touchables />
=======
      <Radiobutton options={["Yes", "No", "Don't Care"]} />
      <Text>Card</Text>
      <Card
        header={"Osteria Bianca"}
        imageURL={
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBHnkYKOAbep7frBylAtCBiv3d_UfuMpT8I3PdX_C65LLgCJ_QUqyG9JsMLTmIcispI4rbXnIS4hDzamuFtTdXEloFfGxI1mIbsoXfOVJKNBTVd7qEn7jit9yq_X8EOp2wlAAyIy7YZ46eKuXpnAHQUM8zmh09F1xjcUrl-8KDhnibdU-YDA7ddmiCXKjWubxQ5fZ0x_4hkNqqTFcxAUc6NfF53Q3qxk-yUJmQrCmalct501KheeHwNZqo0Krc-ryISjiMeBuulyrwZ"
        }
        label={"ITALIAN"}
        description={
          "Handmade pasta and rare regional wines in an intimate, candlelit setting that feels miles away from the city noise."
        }
      />
>>>>>>> Stashed changes
    </View>
  );
}
