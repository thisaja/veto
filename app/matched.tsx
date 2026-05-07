import MyButton from "@/components/button";
import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const MatchScreen = () => {
  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_400Regular,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    Newsreader_400Regular_Italic,
  });
  const router = useRouter();
  const CARDS = [
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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView className="#fdfcfb h-full">
      <View style={styles.header}>
        <MyButton style={styles.sideButton} onClick={() => router.back()}>
          <Feather name="arrow-left" size={24} color="black" />
        </MyButton>

        <View style={styles.titleContainer}>
          <Text style={styles.bottomText}>Veto</Text>
        </View>

        <MyButton style={styles.sideButton} onClick={() => {}}>
          <View style={styles.profileCircle}>
            <Feather name="user" size={20} color="#5b5b5b" />
          </View>
        </MyButton>
      </View>
      <View style={styles.middleContainer}>
        <Text style={styles.shortDesc}>THE VERDICT</Text>
        <Text style={styles.shortList}>L'Artusi</Text>
      </View>

      <View style={styles.scrollContent}>
        <View style={styles.card}>
          <Image
            style={styles.cardImage}
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKvTy_KJ2gsdd6rU7JAaWU4m_HxoR837Eo5DAwfGl90jv_VMy0SOKOVYiLycJ9jM1sNvmadq_69DJCtkrLGLew92M_mDloSo1uOq5OgEGrZ7BXR8RTR7Xdlsv4bvxIvFrPDHhI_UzCmNY1K5cXKFGkBzdEknG3vOz0CiROd2ShK_REyaYYITBSwO6qh2AVLzVZCvoss_eCcBF6ipJLFiiyej0bOmlEtLHW0JaSwACjQoCBieMdR_Li2q-1Fi1tUTFihaTWG4Kyt1DF",
            }}
          />

          <Text style={styles.headerText}>{"Italian • West Village "}</Text>

          <View style={{ flexDirection: "row", gap: 8, marginLeft: 18, marginTop: 10 }}>
            <Feather name="map-pin" size={16} color="black" />
            <Text style={styles.descriptionText}>{"228 W 10th St, New York, NY 10014"}</Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <View style={styles.label}>
              <Text style={styles.labelText}>{"$$$$"}</Text>
            </View>
            <View style={styles.label}>
              <Text style={styles.labelText}>{"Pasta"}</Text>
            </View>
            <View style={styles.label}>
              <Text style={styles.labelText}>{"Wine Bar"}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={{ marginLeft: 30, marginTop: 50 }}>
        <MyButton
          onClick={() => router.push("/matched")}
          style={{ width: 350, height: 60, justifyContent: "center" }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>GET DIRECTIONS</Text>
          <Feather name="corner-up-right" size={16} color="white" />
        </MyButton>
      </View>
      <View style={{ flexDirection: "row", marginLeft: 15, marginTop: 15 }}>
        <TouchableOpacity style={styles.reserveButton}>
          <Text style={{ color: "black", fontSize: 16, fontWeight: "bold" }}>RESERVE A TABLE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.callButton}>
          <Feather name="phone" size={16} color="black" />
        </TouchableOpacity>
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
    justifyContent: "center",
  },
  middleContainer: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 15,
  },
  shortList: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 45,
    color: "#000",
    textAlign: "center",
    marginTop: 5,
  },
  shortDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#8B5A83",
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
    marginTop: 40,
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
  reserveButton: {
    backgroundColor: "white",
    width: 275,
    height: 60,
    justifyContent: "center",
    borderRadius: 32,
    borderColor: "black",
    borderWidth: 1,
    //justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 15,
  },
  callButton: {
    marginLeft: 15,
    backgroundColor: "white",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "black",
  },
  card: {
    marginTop: 35,
    marginLeft: 10,
    marginRight: 10,
    backgroundColor: "#FFFFFF",
    borderColor: "#aaaaaa80",
    borderRadius: 50,
    borderWidth: 1,
    width: 350,
    height: 385,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 250,
    resizeMode: "cover",
  },
  label: {
    marginTop: 10,
    marginLeft: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#dedede",
    borderRadius: 30,
    alignSelf: "flex-start",
    borderColor: "#9d9a9a",
    borderWidth: 0.75,
    justifyContent: "center",
  },
  labelText: {
    fontFamily: "Inter_400Regular",
    color: "#000000",
    fontSize: 12,
  },
  headerText: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 25,
    color: "#000",
    marginTop: 15,
    marginLeft: 20,
  },
  location: {},
  description: {},
  descriptionText: {},
});

export default MatchScreen;
