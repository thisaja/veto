import MyButton from "@/components/button";
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
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserDetailsContext } from "./_layout";

const Step2Screen = () => {
  let [fontsLoaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_600SemiBold_Italic,
  });
  const { userDetails, setUserDetails, userErrors, setUserErrors } = useUserDetailsContext();
  const options = ["Spicy Taco", "Pasta Queen", "Midnight Snacker"];
  const router = useRouter();

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library.
    // Manually request permissions for videos on iOS when `allowsEditing` is set to `false`
    // and `videoExportPreset` is `'Passthrough'` (the default), ideally before launching the picker
    // so the app users aren't surprised by a system dialog after picking a video.
    // See "Invoke permissions for videos" sub section for more details.
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Permission to access the media library is required.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setUserDetails({ ...userDetails, ProfilePicture: result });
    }
  };

  const handleContinue = () => {
    if (userDetails?.DiningAlias) {
      setUserErrors({ ...userErrors, DiningAlias: true });
      router.push("/(register)/step3");
    } else setUserErrors({ ...userErrors, DiningAlias: false });
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
            STEP 2 OF 3
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
          <View style={{ alignItems: "center", gap: 4 }}>
            <Text
              style={{
                fontFamily: "Newsreader_600SemiBold",
                fontSize: 28,
              }}
            >
              Personalize your profile
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
              Let's put a face to the taste and pick a fun alias for group voting.
            </Text>
          </View>
          <View style={{ justifyContent: "center", alignItems: "center" }}>
            <MyButton
              onClick={pickImage}
              style={{
                flexDirection: "column",
                height: 128,
                width: 128,
                borderRadius: 128,
                backgroundColor: "#EEEEEE",
              }}
            >
              {userDetails?.ProfilePicture ? (
                <Image
                  source={{ uri: userDetails.ProfilePicture.assets[0].uri }}
                  style={styles.image}
                />
              ) : (
                <>
                  <Feather name="upload" size={32} color="#4C4546" />
                  <Text style={{ color: "#4C4546", fontSize: 16 }}>UPLOAD</Text>
                </>
              )}
            </MyButton>
          </View>
          <View style={{ gap: 24 }}>
            <Text style={{ fontFamily: "Newsreader_400Regular", fontSize: 16 }}>
              Choose your dining alias
            </Text>
            <TextInput
              placeholder={`e.g. ${options[0]}`}
              style={userErrors.DiningAlias ? styles.textInput : styles.textInputError}
              placeholderTextColor="#4C4546"
              defaultValue={userDetails?.DiningAlias}
              onChangeText={(newDiningAlias) =>
                setUserDetails({ ...userDetails, DiningAlias: newDiningAlias })
              }
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              {options.map((option, _) => {
                return (
                  <MyButton
                    key={option}
                    onClick={() => setUserDetails({ ...userDetails, DiningAlias: option })}
                    style={{
                      backgroundColor: "#EEEEEE",
                      height: "auto",
                      width: "auto",
                      alignSelf: "flex-start",
                      padding: 8,
                    }}
                  >
                    <Text
                      style={{ color: "#1B1B1B", fontFamily: "Inter_400Regular", fontSize: 12 }}
                    >
                      {option}
                    </Text>
                  </MyButton>
                );
              })}
            </View>
          </View>
        </View>
        <MyButton onClick={handleContinue} style={{ height: 48, width: "100%" }}>
          <Text style={{ color: "white" }}>CONTINUE</Text>
          <Feather name="arrow-right" size={16} color="white" />
        </MyButton>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 128,
    height: 128,
    borderRadius: 128,
  },
  textInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    height: 36,
    borderBottomWidth: 1,
  },
  textInputError: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    height: 36,
    borderColor: "red",
    borderWidth: 1,
  },
});

export default Step2Screen;
