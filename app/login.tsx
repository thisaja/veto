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
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const LoginScreen = () => {
  let [fontsLoaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_600SemiBold_Italic,
  });
  const [email, setEmail] = useState<string>();
  const [password, setPassword] = useState<string>();
  const router = useRouter();
  const handleLogin = () => {
    console.log(`e-mail: ${email}\npassword: ${password}`);
    router.navigate("/(tabs)");
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
          paddingBlock: 48,
        }}
      >
        <Text
          style={{
            fontFamily: "Newsreader_600SemiBold_Italic",
            fontSize: 28,
            alignSelf: "center",
          }}
        >
          Welcome Back
        </Text>
        <View style={{ flexDirection: "column", gap: 48, width: "100%" }}>
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
              <TouchableOpacity>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "#5F5E5B" }}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
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
            <Text style={{ color: "white" }}>LOG IN</Text>
          </MyButton>
        </View>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              color: "#4C4546",
            }}
          >
            New to Veto?
          </Text>
          <TouchableOpacity
            onPress={() => {
              router.dismissAll();
              router.push("/register");
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
              Create Account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};
export default LoginScreen;
