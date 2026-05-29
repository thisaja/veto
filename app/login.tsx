import MyButton from "@/components/button";
import { globalStyles } from "@/constants/global";
import { UserLoginDetails, UserLoginErrors } from "@/types/user";
import { validateEmail, validatePassword } from "@/utils/validator";
import { Inter_400Regular, Inter_600SemiBold } from "@expo-google-fonts/inter";
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_600SemiBold,
  Newsreader_600SemiBold_Italic,
  useFonts,
} from "@expo-google-fonts/newsreader";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
  const [userDetails, setUserDetails] = useState<UserLoginDetails>();
  const [userErrors, setUserErrors] = useState<UserLoginErrors>({
    Email: true,
    Password: true,
  });
  const router = useRouter();
  const { setAuth } = useAuth();

  const handleLogin = async () => {
    const newUserErrors: UserLoginErrors = {
      Email: validateEmail(userDetails?.Email),
      Password: validatePassword(userDetails?.Password),
    };
    setUserErrors(newUserErrors);
    if (newUserErrors.Email && newUserErrors.Password) {
      console.log(`e-mail: ${userDetails?.Email}\npassword: ${userDetails?.Password}`);
      try {
        const response = await fetch("http://10.0.0.129:5000/login", {
          method: "POST",
          body: JSON.stringify(userDetails),
          headers: { "Content-Type": "application/json" },
        });
        const json = await response.json();
        if (response.ok) {
          setAuth({ userId: json.userId, token: json.access_token, isGuest: false, guestId: null, diningAlias: json.diningAlias ?? null });
          router.navigate("/(tabs)");
        }
      } catch (error) {
        console.error("Login error:", error);
      }
    }
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
              style={userErrors.Email ? styles.textInput : styles.textInputError}
              placeholderTextColor={"#5E5E5E"}
              onChangeText={(newEmail) => setUserDetails({ ...userDetails, Email: newEmail })}
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
              style={userErrors.Password ? styles.textInput : styles.textInputError}
              placeholderTextColor={"#5E5E5E"}
              onChangeText={(newPassword) =>
                setUserDetails({ ...userDetails, Password: newPassword })
              }
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
              router.push("/(register)");
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
const styles = StyleSheet.create({
  textInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    height: 36,
  },
  textInputError: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    height: 36,
    borderColor: "red",
    borderWidth: 1,
  },
});
export default LoginScreen;
