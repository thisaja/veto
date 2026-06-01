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
import AvatarPicker from "@/components/AvatarPicker";
import { presetKey } from "@/components/PresetAvatars";
import React from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserDetailsContext } from "./_layout";

const ALIAS_ADJECTIVES = ["crispy","golden","spicy","savory","smoky","tangy","silky","zesty","bold","midnight","salty","sweet","crunchy","melty","fluffy","fiery","creamy"];
const ALIAS_FOODS      = ["noodle","truffle","dumpling","ramen","taco","sushi","brisket","croissant","gyoza","kimchi","fondue","pretzel","waffle","burrito","tempura","risotto","nacho"];

function generateAlias(): string {
  const adj  = ALIAS_ADJECTIVES[Math.floor(Math.random() * ALIAS_ADJECTIVES.length)];
  const food = ALIAS_FOODS[Math.floor(Math.random() * ALIAS_FOODS.length)];
  const num  = Math.floor(1000 + Math.random() * 9000);
  return `${adj}-${food}-${num}`;
}

const ALIAS_SUGGESTIONS = ["SpicyTaco", "PastaQueen", "MidnightSnacker"];

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
  const router = useRouter();
  const [selectedPreset, setSelectedPreset] = React.useState<number | null>(null);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setSelectedPreset(null);
      setUserDetails({ ...userDetails, ProfilePicture: result, PresetAvatar: undefined });
    }
  };

  const handleContinue = (skipAlias = false) => {
    const raw = userDetails?.DiningAlias?.trim() ?? "";

    if (skipAlias || raw.length === 0) {
      // Auto-generate and move on — backend will also generate if this is empty
      const generated = generateAlias();
      setUserDetails({ ...userDetails, DiningAlias: generated });
      setUserErrors({ ...userErrors, DiningAlias: true });
      router.push("/(register)/step3");
      return;
    }

    // Validate manually entered alias
    const isValid = raw.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(raw);
    if (!isValid) {
      setUserErrors({ ...userErrors, DiningAlias: false });
      Alert.alert(
        "Invalid username",
        "Username must be at least 3 characters and contain only letters, numbers, underscores, or hyphens. No spaces."
      );
      return;
    }

    setUserErrors({ ...userErrors, DiningAlias: true });
    router.push("/(register)/step3");
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={globalStyles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: "center" }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Header */}
        <View style={{ flexDirection: "column", justifyContent: "center", height: 60, width: "100%" }}>
          <MyButton
            style={{ position: "absolute", left: 0, width: 24, height: 24, backgroundColor: "none" }}
            onClick={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color="black" />
          </MyButton>
          <Text style={{ fontSize: 16, fontFamily: "Inter_400Regular", color: "#4C4546", alignSelf: "center" }}>
            STEP 2 OF 3
          </Text>
        </View>

        {/* Body */}
        <View style={{ flexDirection: "column", gap: 24, width: "100%", flex: 1, justifyContent: "center" }}>
          <View style={{ alignItems: "center", gap: 4 }}>
            <Text style={{ fontFamily: "Newsreader_600SemiBold", fontSize: 28 }}>
              Personalize your profile
            </Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "#5F5E5B", textAlign: "center" }}>
              Pick a photo and choose your @username. Others will use this to add you as a friend.
            </Text>
          </View>

          {/* Avatar selection */}
          <View style={{ gap: 14 }}>
            <Text style={{ fontFamily: "Newsreader_400Regular", fontSize: 18 }}>
              Choose an avatar
            </Text>

            <AvatarPicker
              selected={selectedPreset}
              onSelect={i => {
                setSelectedPreset(i);
                setUserDetails({ ...userDetails, ProfilePicture: undefined, PresetAvatar: presetKey(i) });
              }}
            />

            <TouchableOpacity style={styles.uploadRow} onPress={pickImage} activeOpacity={0.75}>
              <Feather name="upload" size={16} color="#1b1b1b" />
              <Text style={styles.uploadText}>
                {userDetails?.ProfilePicture
                  ? "Photo selected ✓ — tap to change"
                  : "Or upload your own photo"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Username / DiningAlias */}
          <View style={{ gap: 12 }}>
            <View>
              <Text style={{ fontFamily: "Newsreader_400Regular", fontSize: 18 }}>
                Choose your @username
              </Text>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "#5F5E5B", marginTop: 4 }}>
                Letters, numbers, and underscores only. No spaces.
              </Text>
            </View>

            {/* Input with @ prefix */}
            <View style={styles.usernameRow}>
              <Text style={styles.atSign}>@</Text>
              <TextInput
                placeholder="spicytaco"
                style={[styles.usernameInput, !userErrors.DiningAlias && styles.inputError]}
                placeholderTextColor="#9E9E9E"
                autoCapitalize="none"
                autoCorrect={false}
                defaultValue={userDetails?.DiningAlias}
                onChangeText={val =>
                  setUserDetails({ ...userDetails, DiningAlias: val.replace(/\s/g, "") })
                }
              />
            </View>

            {/* Quick suggestions */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              {ALIAS_SUGGESTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setUserDetails({ ...userDetails, DiningAlias: opt })}
                  style={styles.suggestionChip}
                >
                  <Text style={styles.suggestionText}>@{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <MyButton onClick={() => handleContinue(false)} style={{ height: 48, width: "100%" }}>
          <Text style={{ color: "white" }}>CONTINUE</Text>
          <Feather name="arrow-right" size={16} color="white" />
        </MyButton>

        <TouchableOpacity onPress={() => handleContinue(true)} style={{ paddingVertical: 14, alignItems: "center" }}>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: "#999" }}>
            Skip — I'll get a random username
          </Text>
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  uploadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e8e6e1",
    backgroundColor: "#fafaf9",
  },
  uploadText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#666",
    flex: 1,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "#1b1b1b",
    paddingBottom: 6,
  },
  atSign: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: "#1b1b1b",
    marginRight: 2,
  },
  usernameInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 18,
    color: "#1b1b1b",
    flex: 1,
  },
  inputError: { borderBottomColor: "red" },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#EEEEEE",
  },
  suggestionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#4C4546",
  },
});

export default Step2Screen;
