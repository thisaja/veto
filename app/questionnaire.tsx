import Progress from "@/components/progress";
import Radiobutton from "@/components/radiobutton";
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
          <View style={styles.container}>
            <View style={styles.imageCon}>
              {<Image source={{ uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQe7IvVawuaP6C6YC3wKwavLj9rLTV5s7EdDQ&s" }} style={styles.image} />}
            </View>
            <Text style={styles.questionStyle} numberOfLines={2}>
              {currentQuestion.question}
            </Text>
            <View style={styles.buttonCon}>
              <Radiobutton options={currentQuestion.answer} onClick={(val) => setCurrentSelection(val)} />
            </View>
          </View>
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
    height: 500,
    boxShadow: "0 10px 25px 18px rgba(0, 0, 0, 0.1)",
  },
  imageCon: {
    marginLeft: 150,
    marginTop: 30,
  },
  image: {
    width: 50,
    height: 50,
    resizeMode: "cover",
  },
  questionStyle: {
    color: "black",
    fontFamily: "Inter_700Bold",
    fontSize: 25,
    textAlign: "justify",
    marginTop: 15,
    marginLeft: 50,
    marginRight: 50,
  },
  buttonCon: {
    marginTop: 60,
    marginLeft: 40,
  },
});
