import MyButton from "@/components/button";
import Card from "@/components/card";
import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Dimensions, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const CARDS = [
  {
    id: 1,
    header: "Osteria Bianca",
    imageURL:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBHnkYKOAbep7frBylAtCBiv3d_UfuMpT8I3PdX_C65LLgCJ_QUqyG9JsMLTmIcispI4rbXnIS4hDzamuFtTdXEloFfGxI1mIbsoXfOVJKNBTVd7qEn7jit9yq_X8EOp2wlAAyIy7YZ46eKuXpnAHQUM8zmh09F1xjcUrl-8KDhnibdU-YDA7ddmiCXKjWubxQ5fZ0x_4hkNqqTFcxAUc6NfF53Q3qxk-yUJmQrCmalct501KheeHwNZqo0Krc-ryISjiMeBuulyrwZ",
    label: "Italian",
    description:
      "Handmade pasta and rare regional wines in an intimate, candlelit setting that feels miles away from the city noise.",
  },
  {
    id: 2,
    header: "Kinjo",
    imageURL:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCYyTDcikdaLElkYOAQ510ZSxU5_vZg_N6VTPSvOYhY9LDgEKiJifRgGBAzBLtdWZH5rNTO1BtThQJAhiCL_0Mf99ZSQK73rkv0mWQnbFq9sqOgccdwoao9hxLqqVr-k-B4TfrlMxry-2IMY9F4byBP4pjGv9IOLbf83lrHg5IKnfrFKGGH3Z7GtmTLdjX_2IfNWmrF3fU2quvDlpgpe2wWvR6CoW0Jzy-D2XMqL3qrqfR9SKuZJLWl2r_yx66sJP00arbl-1f0Hgqs",
    label: "OMAKASE",
    description:
      "A transcendent 15-course omakase experience crafted by a master chef, focusing on seasonal ingredients.",
  },
];

const ResultScreen = () => {
  const router = useRouter();
  const { qa } = useLocalSearchParams<{ qa: string }>();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_400Regular,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    Newsreader_400Regular_Italic,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView className="h-full bg-white" style={{ justifyContent: "center" }}>
      <View style={styles.header}>
        <MyButton style={styles.sideButton} onClick={() => router.back()}>
          <Feather name="arrow-left" size={24} color="black" />
        </MyButton>

        <View style={styles.titleContainer}>
          <Text style={styles.topText}>FRIDAY NIGHT DINNER</Text>
          <Text style={styles.bottomText}>5 Matches Found</Text>
        </View>

        <MyButton style={styles.sideButton} onClick={() => {}}>
          <View style={styles.profileCircle}>
            <Feather name="user" size={20} color="#5b5b5b" />
          </View>
        </MyButton>
      </View>

      <View style={styles.middleContainer}>
        <Text style={styles.shortList}>The Shortlist</Text>
        <Text style={styles.shortDesc}>
          Your group has agreed on these spots. Review the options before locking in your choice.
        </Text>
      </View>

      <View style={styles.scrollContent}>
        <ScrollView
          horizontal={true}
          decelerationRate="fast"
          snapToAlignment="start"
          snapToInterval={width * 0.8 + 20}
          showsHorizontalScrollIndicator={false}
          style={styles.scrollSettings}
        >
          {CARDS.map((card) => (
            <View key={card.id} style={{ flexDirection: "row" }}>
              <Card
                header={card.header}
                imageURL={card.imageURL}
                label={card.label}
                description={card.description}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.bottomContainer}>
        <Text style={styles.topText}>Waiting for others...</Text>
        <View style={styles.imageStack}>
          <Image style={[styles.userImage, { zIndex: 1 }]} source={require("../assets/images/sam.jpg")} />
          <Image style={[styles.userImage, { zIndex: 2 }]} source={require("../assets/images/tt.png")} />
        </View>
      </View>

      <View style={{ marginLeft: 15 }}>
        <MyButton
          onClick={() => router.push("/matched")}
          style={{ width: 370, height: 56, justifyContent: "center" }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>I'm Ready</Text>
          <Feather name="user-check" size={16} color="white" />
        </MyButton>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  sideButton: {
    width: 50,
    height: 50,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  topText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    letterSpacing: 1.5,
    color: "#444",
    textAlign: "center",
  },
  bottomText: {
    fontFamily: "Newsreader_400Regular_Italic",
    fontSize: 23,
    color: "#000",
    textAlign: "center",
    marginTop: 3,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 30,
    backgroundColor: "#d9d9d9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#a7a7a7",
  },
  scrollContent: {
    alignItems: "center",
  },
  middleContainer: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 30,
  },
  shortList: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 45,
    color: "#000",
    textAlign: "center",
  },
  shortDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#444",
    marginTop: 10,
    lineHeight: 22,
    textAlign: "center",
  },
  scrollSettings: {
    paddingLeft: 3,
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    alignItems: "center",
    marginTop: 50,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderColor: "white",
    borderWidth: 5,
  },
  imageStack: {
    flexDirection: "row",
  },
});

export default ResultScreen;
