import MyButton from "@/components/button";
import { globalStyles } from "@/constants/global";
import {
    Inter_400Regular,
    Inter_600SemiBold,
    useFonts,
} from "@expo-google-fonts/inter";
import {
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ResultScreen = () => {
  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_400Regular,
    Newsreader_600SemiBold,
    Newsreader_400Regular_Italic,
  });

  const router = useRouter();
  const [friends, setFriends] = useState([
    { id: 1, name: "Samuel", isInvited: false },
    { id: 2, name: "Thisaja", isInvited: false },
    { id: 3, name: "Hady", isInvited: true },
    { id: 4, name: "Thomas", isInvited: true },
  ]);

  return (
    <SafeAreaView style={globalStyles.screen}>
      <View style={styles.header}>
        <MyButton style={styles.backButton} onClick={() => router.back()}>
          <Feather name="arrow-left" size={28} color="black" />
        </MyButton>

        <View style={styles.titleContainer}>
          <Text style={styles.topText}>FRIDAY NIGHT DINNER</Text>
          <Text style={styles.bottomText}>5 Matches Found</Text>
        </View>

        <MyButton style={styles.profileButton} onClick={() => {}}>
          <View style={styles.profileCircle}>
            <Feather name="user" size={24} color="#5b5b5b" />
          </View>
        </MyButton>
      </View>
      <View style={styles.middleContainer}>
        <Text style={styles.topText}>The Shortlist</Text>
        <Text style={styles.bottomText}>
          Your group has agreed on these spots. Review the options before
          locking in your choice.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    height: 80,
    width: "100%",
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  titleContainer: {
    alignItems: "center",
    flex: 1,
  },
  topText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    letterSpacing: 1,
    color: "#444",
  },
  bottomText: {
    fontFamily: "Newsreader_400Regular_Italic",
    fontSize: 24,
    color: "#000",
    marginTop: 2,
  },
  profileButton: {
    width: 45,
    height: 45,
    backgroundColor: "transparent",
  },
  profileCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  middleContainer: {},
});

export default ResultScreen;
