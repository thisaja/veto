import MyButton from "@/components/button";
import { globalStyles } from "@/constants/global";
import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import { Newsreader_400Regular, Newsreader_600SemiBold } from "@expo-google-fonts/newsreader";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSession } from "@/context/SessionContext";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const InviteScreen = () => {
  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_400Regular,
    Newsreader_600SemiBold,
  });
  const router = useRouter();
  const { sessionId } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const fetchedDataRef = useRef<any>(null);
  const userWantsToProceedRef = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = sessionId
          ? `http://10.0.0.129:5000/api/gemini/question?sessionId=${sessionId}`
          : "http://10.0.0.129:5000/api/gemini/question";
        const response = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const jsonResponse = await response.json();

        const generatedContent = jsonResponse?.data;

        console.log("--- Data Received ---");
        console.log(generatedContent);

        if (generatedContent && Array.isArray(generatedContent)) {
          fetchedDataRef.current = generatedContent;

          if (userWantsToProceedRef.current) {
            setIsLoading(false);
            router.push("/questionnaire");
          }
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStartQuestionnaire = () => {
    if (fetchedDataRef.current) {
      router.push("/questionnaire");
    } else {
      userWantsToProceedRef.current = true;
      setIsLoading(true);
    }
  };

  const invitedFriends = ["sam", "hady", "thomas"];

  return (
    <SafeAreaView style={globalStyles.screen}>
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
          onClick={() => router.dismissAll()}
        >
          <Feather name="x" size={24} color="black" />
        </MyButton>
        <Text
          style={{
            fontSize: 16,
            fontFamily: "Inter_400Regular",
            color: "#4C4546",
            alignSelf: "center",
          }}
        >
          INVITE
        </Text>
      </View>
      <View style={{ flex: 3, gap: 16, alignItems: "center" }}>
        <View
          style={{
            width: "100%",
            flex: 1,
            justifyContent: "space-evenly",
            borderColor: "#CFC4C5",
            borderWidth: 1,
            borderStyle: "solid",
            alignItems: "center",
            paddingInline: 48,
            backgroundColor: "white",
            borderRadius: 32,
          }}
        >
          <View style={{ width: "100%", aspectRatio: 1 }}>
            <Image
              style={{ height: "100%", width: "100%" }}
              source={require("../assets/images/placeholder.png")}
              contentFit="cover"
            />
          </View>
          <Text
            style={{
              fontSize: 12,
              fontFamily: "Inter_400Regular",
              color: "#4C4546",
              alignSelf: "center",
            }}
          >
            SCAN TO JOIN
          </Text>
        </View>
        <MyButton
          style={{ backgroundColor: "#E1DFDA", width: "60%", height: 48 }}
          onClick={() => {}}
        >
          <Feather name="link-2" size={24} color="#63635F" />
          <Text style={{ color: "#63635F" }}>Copy Invite Link</Text>
        </MyButton>
      </View>
      <View style={{ flex: 1, gap: 12 }}>
        <Text
          style={{
            fontFamily: "Newsreader_400Regular",
            fontSize: 16,
            color: "black",
          }}
        >
          Waiting for friends...
        </Text>
        <ScrollView horizontal={true} contentContainerStyle={{ gap: 16 }}>
          <View style={{ alignItems: "center", gap: 4 }}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 32,
                borderColor: "black",
                borderWidth: 2,
                borderStyle: "solid",
              }}
            >
              <Image
                style={{ height: "100%", width: "100%", borderRadius: 32 }}
                source={require("../assets/images/placeholder.png")}
                contentFit="cover"
              />
            </View>
            <Text>You</Text>
          </View>
          {invitedFriends.map((name) => {
            return (
              <View key={name} style={{ alignItems: "center", gap: 4 }}>
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 32,
                    borderColor: "#CFC4C5",
                    borderWidth: 2,
                    borderStyle: "solid",
                  }}
                >
                  <Image
                    style={{ height: "100%", width: "100%", borderRadius: 32 }}
                    source={require("../assets/images/placeholder.png")}
                    contentFit="cover"
                  />
                </View>
                <Text>{name}</Text>
              </View>
            );
          })}
          <TouchableOpacity
            style={{
              width: 60,
              height: 60,
              borderRadius: 32,
              borderColor: "#CFC4C5",
              borderWidth: 2,
              borderStyle: "dashed",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Feather name="user-plus" size={16} color="grey" />
          </TouchableOpacity>
        </ScrollView>
      </View>
      <MyButton onClick={handleStartQuestionnaire} style={{ width: "100%", height: 56 }}>
        <Text style={{ color: "white", fontSize: 16 }}>Start Questionnaire</Text>
        <Feather name="arrow-right" size={16} color="white" />
      </MyButton>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4C4546" />
          <Text style={styles.loadingText}>Loading Questionnaire...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#4C4546",
    fontFamily: "Inter_600SemiBold",
  },
});

export default InviteScreen;
