import MyButton from "@/components/button";
import { globalStyles } from "@/constants/global";
import { Inter_400Regular, Inter_600SemiBold } from "@expo-google-fonts/inter";
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_600SemiBold,
  useFonts,
} from "@expo-google-fonts/newsreader";
import { useAuth } from "@/context/AuthContext";
import { ImageBackground } from "expo-image";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const LandingScreen = () => {
  let [fontsLoaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
  });
  const router = useRouter();
  const { loginAsGuest } = useAuth();
  return (
    <View style={{ width: "100%", height: "100%" }}>
      <ImageBackground
        source={require("../assets/images/landing-background.png")}
        contentFit="cover"
        style={{ flex: 1 }}
      >
        <SafeAreaView
          style={[
            globalStyles.screen,
            {
              backgroundColor: "none",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 48,
              paddingBottom: 48,
            },
          ]}
        >
          <View style={{ alignItems: "center", gap: 12, width: "100%" }}>
            <Text
              style={{
                fontFamily: "Newsreader_400Regular_Italic",
                fontSize: 40,
                fontStyle: "italic",
              }}
            >
              Veto
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 17,
                color: "#4C4546",
                paddingInline: 50,
                textAlign: "center",
              }}
            >
              Curated culinary experiences for the discerning group.
            </Text>
          </View>
          <View style={{ gap: 12, width: "100%" }}>
            <MyButton
              onClick={() => router.push("/(register)")}
              style={{ height: 48, width: "100%" }}
            >
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: "white" }}>
                Register
              </Text>
            </MyButton>
            <MyButton onClick={() => router.push("/login")} style={{ height: 48, width: "100%" }}>
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: "white" }}>
                Login
              </Text>
            </MyButton>
            <TouchableOpacity
              onPress={() => { loginAsGuest(); router.push("/createSession"); }}
              style={{ paddingTop: 12 }}
            >
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 12,
                  color: "#4C4546",
                  textAlign: "center",
                }}
              >
                CONTINUE AS GUEST
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};
export default LandingScreen;
