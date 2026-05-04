import Progress from "@/components/progress";
import QuestionBox from "@/components/questionBox";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
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
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [currentSelection, setCurrentSelection] = useState<string>("");

  React.useEffect(() => {
    console.log("Current Selection:", currentSelection);
    console.log("Answers Array:", userAnswers);
  }, [currentSelection, userAnswers]);

  const currentQuestion = qaPair[counter];

  const handleNext = (selectedAnswer?: string) => {
    if (currentSelection) {
      setUserAnswers([...userAnswers, currentSelection]);
    }

    if (counter < qaPair.length - 1) {
      setCounter(counter + 1);
      setCurrentSelection("");
    }
    /** 
    else {
      router.push({
        pathname: "/questionResults",
        params: { answers: JSON.stringify(userAnswers) },
      });
    }
      


  /** 
  const handleBack = () => {
    if (counter > 0) {
      setCounter(counter - 1);
    } else {
      router.back();
    }
  };
  */
  };
  return (
    <SafeAreaView className="bg-white h-full">
      <View className="bg-white h-full">
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.push("/")}>
            <Image
              style={styles.xButton}
              source={require("../assets/images/closeButton.png")}
            />
          </Pressable>
          <Text style={styles.curatingText}>CURATING</Text>
          <Pressable onPress={() => handleNext()}>
            <Image
              style={styles.nextButton}
              source={require("../assets/images/nextButton.png")}
            />
          </Pressable>
        </View>
        <View style={styles.qBoxStyle}>
          <QuestionBox
            key={counter}
            question={currentQuestion.question}
            iconURL={
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQe7IvVawuaP6C6YC3wKwavLj9rLTV5s7EdDQ&s"
            }
            answerOptions={currentQuestion.answer}
            onSelect={(value) => setCurrentSelection(value)}
          />
        </View>
        <View style={{ marginLeft: 30, marginTop: 15 }}>
          <Progress
            size={350}
            currentPage={counter}
            pageTotal={4}
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
  xButton: {
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
  },
  qBoxStyle: {
    marginTop: 75,
    marginLeft: 5,
  },
});
