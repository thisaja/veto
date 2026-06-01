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
import { PresetAvatar, parsePresetKey } from "@/components/PresetAvatars";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
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
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    const formData = new FormData();
    // Strip the ImagePickerResult from the JSON payload — it's sent as a file below
    const { ProfilePicture: _pic, ...rest } = userDetails ?? {};
    formData.append("user", JSON.stringify(rest));
    if (userDetails?.ProfilePicture) {
      const image = {
        uri: userDetails.ProfilePicture.assets[0].uri,
        type: userDetails.ProfilePicture.assets[0].mimeType!,
        name: `profile.${userDetails.ProfilePicture.assets[0].uri.split(/[. ]+/).pop()}`,
      };
      formData.append("photo", image as any);
    }
    try {
      const response = await fetch("http://10.0.0.129:5000/register", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const e = new Error();
        e.message = await response.json();
        throw e;
      }
      const json = await response.json();
      setAuth({ userId: json.userId, token: json.access_token, isGuest: false, guestId: null, diningAlias: json.diningAlias ?? null });
      router.dismissAll();
      router.replace("/(tabs)");
    } catch (error) {
      if (error instanceof Error) console.log(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.screen}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, alignItems: "center" }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
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
          {parsePresetKey(userDetails?.PresetAvatar) !== null ? (
            <View
              style={{
                width: "100%",
                aspectRatio: 1.5,
                borderWidth: 1,
                borderColor: "black",
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f0eeea",
                overflow: "hidden",
              }}
            >
              <PresetAvatar index={parsePresetKey(userDetails!.PresetAvatar)!} size={100} />
            </View>
          ) : (
            <Image
              style={{
                width: "100%",
                aspectRatio: 1.5,
                borderWidth: 1,
                borderColor: "black",
                borderRadius: 16,
              }}
              source={
                userDetails?.ProfilePicture?.assets?.[0]?.uri
                  ? { uri: userDetails.ProfilePicture.assets[0].uri }
                  : require("../../assets/images/placeholder.png")
              }
              contentFit="cover"
            />
          )}
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

        <MyButton onClick={handleContinue} style={{ height: 48, width: "100%", marginBottom: 16 }} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={{ color: "white" }}>CONTINUE</Text>
              <Feather name="arrow-right" size={16} color="white" />
            </>
          )}
        </MyButton>
      </ScrollView>
    </SafeAreaView>
  );
};
export default Step3Screen;
