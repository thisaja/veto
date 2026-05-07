import Progress from "@/components/progress";
import Radiobutton from "@/components/radiobutton";
import { Inter_400Regular, useFonts } from "@expo-google-fonts/inter";
import { Newsreader_600SemiBold } from "@expo-google-fonts/newsreader";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const qaPair = [
  {
    id: 1,
    question: "How much are we balling out?",
    answer: ["$", "$$", "$$$"],
  },
  {
    id: 2,
    question: "Are we feeling spicy tonight?",
    answer: ["Yes", "No", "Don't Care"],
  },
  {
    id: 3,
    question: "What’s your current hunger vibe?",
    answer: ["Light & Fresh", "Total Comfort", "High Energy"],
  },
  {
    id: 4,
    question: "How far are you willing to go for the perfect bite?",
    answer: ["Right Next Door", "A Quick Drive", "It's a Pilgrimage"],
  },
];

export default function Questionnaire() {
  const router = useRouter();

  const [counter, setCounter] = useState(0);

  const [userAnswers, setUserAnswers] = useState<string[]>(new Array(qaPair.length).fill(""));

  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Newsreader_600SemiBold,
  });

  if (!fontsLoaded) {
    return <ActivityIndicator />;
  }

  const currentSelection = userAnswers[counter];

  const currentQuestion = qaPair[counter];

  const handleBack = () => {
    if (counter > 0) {
      setCounter(counter - 1);
    }
  };

  const handleNext = () => {
    if (counter < qaPair.length - 1) {
      setCounter(counter + 1);
    } else {
      router.push({
        pathname: "/questionResults",
        params: { answers: JSON.stringify(userAnswers) },
      });
    }
  };

  const updateAnswer = (val: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[counter] = val;
    setUserAnswers(newAnswers);
  };

  return (
    <SafeAreaView className="h-full bg-white">
      <View className="h-full bg-white">
        <View style={styles.headerRow}>
          {counter !== 0 ? (
            <Pressable onPress={() => handleBack()}>
              <Image
                style={styles.backButton}
                source={require("../assets/images/backButton.png")}
              />
            </Pressable>
          ) : (
            <View style={styles.backButton} />
          )}
          <Text style={styles.curatingText}>CURATING</Text>
          <Pressable onPress={() => handleNext()}>
            <Image style={styles.nextButton} source={require("../assets/images/nextButton.png")} />
          </Pressable>
        </View>
        <View style={styles.qBoxStyle}>
          <View style={styles.container}>
            <View style={styles.imageCon}>
              <Image source={require("../assets/images/fireButton.png")} style={styles.image} />
            </View>
            <Text style={styles.questionStyle}>{currentQuestion.question}</Text>
            <View style={styles.buttonCon}>
              <Radiobutton
                options={currentQuestion.answer}
                value={userAnswers[counter]}
                onClick={(val) => updateAnswer(val)}
              />
            </View>
          </View>
        </View>
        <View style={{ marginLeft: 30, marginTop: 15 }}>
          <Progress
            size={350}
            currentPage={counter + 1}
            pageTotal={qaPair.length}
            color={"black"}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 25,
  },
  backButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  nextButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginLeft: 80,
  },
  curatingText: {
    marginLeft: 85,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    letterSpacing: 2,
    color: "#666",
  },
  qBoxStyle: {
    marginTop: 75,
    marginLeft: 5,
  },
  container: {
    marginTop: 50,
    marginBottom: 50,
    marginLeft: 28,
    marginRight: 50,
    backgroundColor: "#FFFFFF",
    borderColor: "#aaaaaa80",
    borderRadius: 50,
    borderWidth: 1,
    width: 350,
    minHeight: 500,
    boxShadow: "0 10px 25px 18px rgba(0, 0, 0, 0.1)",
    paddingBottom: 40,
  },
  imageCon: {
    marginLeft: 160,
    marginTop: 30,
  },
  image: {
    width: 35,
    height: 35,
    resizeMode: "cover",
  },
  questionStyle: {
    color: "#1A1A1A",
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 32,
    textAlign: "center",
    marginTop: 15,
    marginLeft: 40,
    marginRight: 40,
    lineHeight: 38,
  },
  buttonCon: {
    marginTop: 40,
    marginLeft: 40,
  },
});
