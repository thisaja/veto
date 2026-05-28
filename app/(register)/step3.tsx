import MyButton from "@/components/button";
import Multiselect from "@/components/multiselect";
import { globalStyles } from "@/constants/global";
import { Inter_400Regular, Inter_600SemiBold } from "@expo-google-fonts/inter";
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_600SemiBold,
  Newsreader_600SemiBold_Italic,
  useFonts,
} from "@expo-google-fonts/newsreader";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserDetailsContext } from "./_layout";
const Step3Screen = () => {
  let [fontsLoaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_600SemiBold_Italic,
  });
  const { userDetails, setUserDetails } = useUserDetailsContext();
  const { setAuth } = useAuth();
  const router = useRouter();

  const handleContinue = async () => {
    const formData = new FormData();
    formData.append("user", JSON.stringify(userDetails));
    if (userDetails?.ProfilePicture) {
      const image = {
        uri: userDetails.ProfilePicture.assets[0].uri,
        type: userDetails.ProfilePicture.assets[0].mimeType!,
        name: `profile.${userDetails.ProfilePicture.assets[0].uri.split(/[. ]+/).pop()}`,
      };
      formData.append("photo", image as any);
    }
    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const e = new Error();
        e.message = await response.json();
        throw e;
      }
      const json = await response.json();
      setAuth({ userId: json.userId, token: json.access_token, isGuest: false, guestId: null });
      router.dismissAll();
      router.replace("/(tabs)");
    } catch (error) {
      if (error instanceof Error) console.log(error.message);
    }
  };

  return (
    <SafeAreaView style={globalStyles.screen}>
      <View
        style={{
          height: "100%",
          width: "100%",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "column",
            justifyContent: "center",
            height: 60,
            width: "100%",
          }}
        >
          <MyButton
            style={{
              position: "absolute",
              left: 0,
              width: 24,
              height: 24,
              backgroundColor: "none",
            }}
            onClick={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color="black" />
          </MyButton>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Inter_400Regular",
              color: "#4C4546",
              alignSelf: "center",
            }}
          >
            STEP 3 OF 3
          </Text>
        </View>
        {/* Body */}
        <View
          style={{
            flexDirection: "column",
            gap: 24,
            width: "100%",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <Image
            style={{
              width: "100%",
              aspectRatio: 1.5,
              borderWidth: 1,
              borderColor: "black",
              borderRadius: 16,
            }}
            source={require("../../assets/images/placeholder.png")}
            contentFit="cover"
          />
          <View style={{ alignItems: "center", gap: 4 }}>
            <Text
              style={{
                fontFamily: "Newsreader_600SemiBold",
                fontSize: 28,
              }}
            >
              Dietary Dealbreakers
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                color: "#5F5E5B",
                textAlign: "center",
                width: "auto",
              }}
            >
              Select any hard limits. We'll curate your group's options so these are never suggested
              to the table.
            </Text>
          </View>
          <Multiselect
            options={["Vegan", "Vegetarian", "Gluten-Free", "Halal", "Nut Allergy", "Kosher"]}
            onClick={(selectedOptions) =>
              setUserDetails({ ...userDetails, Dealbreakers: selectedOptions })
            }
            defaultValue={userDetails?.Dealbreakers}
          />
        </View>

        <MyButton onClick={handleContinue} style={{ height: 48, width: "100%" }}>
          <Text style={{ color: "white" }}>CONTINUE</Text>
          <Feather name="arrow-right" size={16} color="white" />
        </MyButton>
      </View>
    </SafeAreaView>
  );
};
export default Step3Screen;
