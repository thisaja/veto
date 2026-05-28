import Progress from "@/components/progress";
import Radiobutton from "@/components/radiobutton";
import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import { Newsreader_600SemiBold } from "@expo-google-fonts/newsreader";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useSession } from "@/context/SessionContext";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type QAPair = {
  id: number;
  question: string;
  answer: string[];
};

const SAMPLE_QUESTIONS: QAPair[] = [
  { id: 1, question: "How much are we spending tonight?", answer: ["Under $20", "$20-$50", "$50+", "Don't mind"] },
  { id: 2, question: "What type of cuisine?", answer: ["Italian", "Asian", "American", "Mexican"] },
  { id: 3, question: "How many people in party?", answer: ["2-3", "4-5", "6-8", "8+", "Just me"] },
  { id: 4, question: "Any dietary restrictions?", answer: ["Vegan", "Vegetarian", "Gluten-free", "Halal", "Nut allergy", "None"] },
  { id: 5, question: "Time preference?", answer: ["Breakfast", "Lunch", "Dinner", "Late night"] },
  { id: 6, question: "Ambiance important?", answer: ["Very important", "Somewhat important", "Not important"] },
  { id: 7, question: "Indoor or outdoor?", answer: ["Indoor", "Outdoor", "Either is fine"] },
  { id: 8, question: "Max travel distance?", answer: ["Less than 1 mile", "1-3 miles", "3-5 miles", "5+ miles"] },
];

export default function Questionnaire() {
  const [qaPair, setQaPair] = useState<QAPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [counter, setCounter] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Newsreader_600SemiBold });
  const { sessionId } = useSession();
  const { userId } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = sessionId
          ? `http://10.0.0.129:5000/api/gemini/getQA?sessionId=${sessionId}`
          : "http://10.0.0.129:5000/api/gemini/getQA";
        const response = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const json = await response.json();
        const questions =
          Array.isArray(json) ? json :
          Array.isArray(json?.data) ? json.data :
          Array.isArray(json?.questions) ? json.questions :
          [];
        setQaPair(questions.length > 0 ? questions : SAMPLE_QUESTIONS);
      } catch {
        setQaPair(SAMPLE_QUESTIONS);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);


  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  const currentQuestion = qaPair[counter];

  const handleBack = () => {
    if (counter > 0) setCounter(c => c - 1);
  };

  const handleNext = async () => {
    const selectedAnswer = userAnswers[counter]?.trim()
      ? userAnswers[counter]
      : qaPair[counter].answer[0];

    if (!userAnswers[counter]?.trim()) {
      setUserAnswers(prev => {
        const next = [...prev];
        next[counter] = selectedAnswer;
        return next;
      });
    }

    if (counter < qaPair.length - 1) {
      setCounter(c => c + 1);
      return;
    }

    // Last question — build final answers, submit, and fetch restaurant recommendations
    const finalAnswers = [...userAnswers];
    finalAnswers[counter] = selectedAnswer;

    const formattedAnswers = qaPair.map((q, i) => ({
      id: q.id,
      question: q.question,
      answer: finalAnswers[i] || q.answer[0],
    }));

    setIsSubmitting(true);

    try {
      // Save answers to DB (best-effort — guests skip DB write on the backend)
      await fetch("http://10.0.0.129:5000/api/gemini/submitAnswer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          answers: formattedAnswers.map(a => ({ id: a.id, value: a.answer })),
        }),
      });
    } catch (err) {
      console.error("submitAnswer failed:", err);
    }

    try {
      const restaurantRes = await fetch("http://10.0.0.129:5000/api/gemini/restaurant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAnswers: formattedAnswers }),
      });
      const restaurantJson = await restaurantRes.json();
      const restaurants = Array.isArray(restaurantJson.data) ? restaurantJson.data : [];

      router.push({
        pathname: "/questionResults",
        params: { restaurants: JSON.stringify(restaurants) },
      });
    } catch (err) {
      console.error("getRestaurant failed:", err);
      router.push({
        pathname: "/questionResults",
        params: { restaurants: JSON.stringify([]) },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateAnswer = (val: string) => {
    setUserAnswers(prev => {
      const next = [...prev];
      next[counter] = val;
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>

        {/* Header */}
        <View style={styles.headerRow}>
          {counter !== 0 ? (
            <Pressable onPress={handleBack}>
              <Image style={styles.navButton} source={require("../assets/images/backButton.png")} />
            </Pressable>
          ) : (
            <View style={styles.navButton} />
          )}
          <Text style={styles.curatingText}>CURATING</Text>
          <Pressable onPress={handleNext}>
            <Image style={styles.navButton} source={require("../assets/images/nextButton.png")} />
          </Pressable>
        </View>

        {/* Centering wrapper — card sits in the middle of available vertical space */}
        <View style={styles.cardWrapper}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Image source={require("../assets/images/fireButton.png")} style={styles.icon} />
          </View>
          <Text style={styles.question}>{currentQuestion.question}</Text>
          <View style={styles.answersContainer}>
            <Radiobutton
              options={currentQuestion.answer}
              value={userAnswers[counter]}
              onClick={updateAnswer}
            />
          </View>
        </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <Progress
            size={350}
            currentPage={counter + 1}
            pageTotal={qaPair.length}
            color="black"
          />
        </View>

      </View>

      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4C4546" />
          <Text style={styles.loadingText}>Finding your matches...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    paddingTop: 8,
  },
  navButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  curatingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    letterSpacing: 2,
    color: "#666",
  },
  cardWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  card: {
    width: 340,
    minHeight: 360,
    backgroundColor: "#FFFFFF",
    borderColor: "#aaaaaa80",
    borderRadius: 50,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    paddingBottom: 24,
  },
  iconContainer: {
    alignItems: "center",
    marginTop: 28,
  },
  icon: {
    width: 35,
    height: 35,
    resizeMode: "cover",
  },
  question: {
    color: "#1A1A1A",
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 26,
    textAlign: "center",
    marginTop: 16,
    marginHorizontal: 28,
    lineHeight: 32,
  },
  answersContainer: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: "center",
  },
  progressContainer: {
    alignItems: "center",
    paddingBottom: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.88)",
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
