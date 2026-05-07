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
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const RegisterScreen = () => {
  let [fontsLoaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_600SemiBold_Italic,
  });
  const NUM_STEPS = 3;
  const [step, setStep] = useState<number>(1);
  const [email, setEmail] = useState<string>();
  const [password, setPassword] = useState<string>();
  const router = useRouter();
  const handleLogin = () => {
    console.log(`e-mail: ${email}\npassword: ${password}`);
    router.navigate("/(tabs)");
  };
  const footer = () => {
    return (
      <View style={{ flexDirection: "row", gap: 4 }}>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            color: "#4C4546",
          }}
        >
          Already have an account?
        </Text>
        <TouchableOpacity
          onPress={() => {
            router.dismissAll();
            router.push("/login");
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              color: "black",
              textDecorationLine: "underline",
            }}
          >
            Log In
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
  return (
    <SafeAreaView style={globalStyles.screen}>
      <View
        style={{
          height: "100%",
          width: "100%",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
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
            {`STEP ${step} OF 3`}
          </Text>
        </View>
        <View style={{ flexDirection: "column", gap: 48, width: "100%" }}>
          <View style={{ alignItems: "center", gap: 4 }}>
            <Text
              style={{
                fontFamily: "Newsreader_600SemiBold_Italic",
                fontSize: 28,
              }}
            >
              Create Account
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                color: "#5F5E5B",
                textAlign: "center",
                width: 196,
              }}
            >
              Join to curate and share your culinary experiences.
            </Text>
          </View>
          <View style={{ gap: 16 }}>
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#4C4546" }}>
              FULL NAME
            </Text>
            <TextInput
              keyboardType="default"
              placeholder="Jane Doe"
              style={{ fontFamily: "Inter_400Regular", fontSize: 14 }}
              placeholderTextColor={"#5E5E5E"}
              onChangeText={setEmail}
            />
          </View>
          <View style={{ gap: 16 }}>
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#4C4546" }}>
              EMAIL ADDRESS
            </Text>
            <TextInput
              keyboardType="email-address"
              placeholder="hello@example.com"
              style={{ fontFamily: "Inter_400Regular", fontSize: 14 }}
              placeholderTextColor={"#5E5E5E"}
              onChangeText={setEmail}
            />
          </View>
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#4C4546" }}>
                PASSWORD
              </Text>
            </View>
            <TextInput
              placeholder="••••••••"
              textContentType="password"
              secureTextEntry={true}
              style={{ fontFamily: "Inter_400Regular", fontSize: 14 }}
              placeholderTextColor={"#5E5E5E"}
              onChangeText={setPassword}
            />
          </View>
          <MyButton onClick={handleLogin} style={{ height: 48, width: "100%" }}>
            <Text style={{ color: "white" }}>CONTINUE</Text>
            <Feather name="arrow-right" size={16} color="white" />
          </MyButton>
        </View>
        {step === 1 && footer()}
      </View>
    </SafeAreaView>
  );
};
export default RegisterScreen;
