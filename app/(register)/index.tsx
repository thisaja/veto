import MyButton from "@/components/button";
import { globalStyles } from "@/constants/global";
import { UserError } from "@/types/user";
import {
  validateEmail,
  validateName,
  validatePassword,
  validatePhoneNumber,
} from "@/utils/validator";
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
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserDetailsContext } from "./_layout";

const Step1Screen = () => {
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

  const handleContinue = () => {
    const newUserErrors: UserError = {
      ...userErrors,
      FirstName: validateName(userDetails?.FirstName),
      LastName: validateName(userDetails?.LastName),
      PhoneNumber: validatePhoneNumber(userDetails?.PhoneNumber),
      Email: validateEmail(userDetails?.Email),
      Password: validatePassword(userDetails?.Password),
    };
    setUserErrors(newUserErrors);
    if (
      newUserErrors.FirstName &&
      newUserErrors.LastName &&
      newUserErrors.PhoneNumber &&
      newUserErrors.Email &&
      newUserErrors.Password
    ) {
      router.push("/(register)/step2");
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
            STEP 1 OF 3
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
              Create Account
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
              Join to curate and share your culinary experiences.
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <View style={{ gap: 16, flex: 1 }}>
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#4C4546" }}>
                FIRST NAME
              </Text>
              <TextInput
                keyboardType="default"
                placeholder="Jane"
                style={userErrors?.FirstName ? styles.textInput : styles.textInputError}
                placeholderTextColor={"#5E5E5E"}
                onChangeText={(newFirstName) =>
                  setUserDetails({
                    ...userDetails,
                    FirstName: newFirstName,
                  })
                }
                defaultValue={userDetails?.FirstName}
              />
            </View>
            <View style={{ gap: 16, flex: 1 }}>
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#4C4546" }}>
                LAST NAME
              </Text>
              <TextInput
                keyboardType="default"
                placeholder="Doe"
                style={userErrors?.LastName ? styles.textInput : styles.textInputError}
                placeholderTextColor={"#5E5E5E"}
                onChangeText={(newLastName) =>
                  setUserDetails({
                    ...userDetails,
                    LastName: newLastName,
                  })
                }
                defaultValue={userDetails?.LastName}
              />
            </View>
          </View>
          <View style={{ gap: 16 }}>
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#4C4546" }}>
              PHONE NUMBER
            </Text>
            <TextInput
              keyboardType="phone-pad"
              placeholder="555-555-5555"
              style={userErrors?.PhoneNumber ? styles.textInput : styles.textInputError}
              placeholderTextColor={"#5E5E5E"}
              onChangeText={(newNumber) =>
                setUserDetails({
                  ...userDetails,
                  PhoneNumber: newNumber,
                })
              }
              defaultValue={userDetails?.PhoneNumber}
            />
          </View>
          <View style={{ gap: 16 }}>
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#4C4546" }}>
              EMAIL ADDRESS
            </Text>
            <TextInput
              keyboardType="email-address"
              placeholder="hello@example.com"
              style={userErrors?.Email ? styles.textInput : styles.textInputError}
              placeholderTextColor={"#5E5E5E"}
              onChangeText={(newEmail) =>
                setUserDetails({
                  ...userDetails,
                  Email: newEmail,
                })
              }
              defaultValue={userDetails?.Email}
            />
          </View>
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#4C4546" }}>
                PASSWORD
              </Text>
            </View>
            <TextInput
              placeholder="••••••••"
              textContentType="password"
              secureTextEntry={true}
              style={userErrors?.Password ? styles.textInput : styles.textInputError}
              placeholderTextColor={"#5E5E5E"}
              onChangeText={(newPassword) =>
                setUserDetails({
                  ...userDetails,
                  Password: newPassword,
                })
              }
              defaultValue={userDetails?.Password}
            />
          </View>
          <MyButton onClick={handleContinue} style={{ height: 48, width: "100%" }}>
            <Text style={{ color: "white" }}>CONTINUE</Text>
            <Feather name="arrow-right" size={16} color="white" />
          </MyButton>
        </View>
        {/* Footer */}
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
export default Step1Screen;
