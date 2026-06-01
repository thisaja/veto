import Progress from "@/components/progress";
import Radiobutton from "@/components/radiobutton";
import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import {
  Newsreader_400Regular_Italic,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useSession } from "@/context/SessionContext";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const API_BASE = "http://10.0.0.129:5000";
const PROGRESS_BAR_WIDTH = SCREEN_WIDTH - 96;

const LOADING_MESSAGES = [
  "Curating your questions…",
  "Checking your preferences…",
  "Personalising your experience…",
  "Almost ready…",
];

const SUBMIT_MESSAGES = [
  "Analysing your answers…",
  "Checking the neighbourhood…",
  "Consulting the critics…",
  "Finding the best match…",
  "Almost there…",
];

type QAPair = {
  id: number;
  question: string;
  answer: string[];
};

// Last-resort fallback — only used if the backend never returns questions
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
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [submitMsgIdx, setSubmitMsgIdx] = useState(0);

  const router = useRouter();
  const { sessionId: ctxSessionId } = useSession();
  const { userId } = useAuth();
  const { sessionId: paramSessionId } = useLocalSearchParams<{ sessionId?: string }>();
  // Read from context first, fall back to nav param (guests / deep-link)
  const sessionId = ctxSessionId ?? paramSessionId ?? "";

  const progressAnim = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const msgTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_600SemiBold,
    Newsreader_400Regular_Italic,
  });

  // Step the bar to a target value smoothly
  const stepAnim = (toValue: number, duration: number) => {
    animRef.current?.stop();
    animRef.current = Animated.timing(progressAnim, {
      toValue,
      duration,
      useNativeDriver: false,
    });
    animRef.current.start();
  };

  const startAnim = (duration: number, setIdx: (fn: (i: number) => number) => void, messages: string[]) => {
    progressAnim.setValue(0);
    stepAnim(0.9, duration);
    if (msgTimerRef.current) clearInterval(msgTimerRef.current);
    msgTimerRef.current = setInterval(() => setIdx(i => (i + 1) % messages.length), 2500);
  };

  const stopAnim = () => {
    animRef.current?.stop();
    if (msgTimerRef.current) { clearInterval(msgTimerRef.current); msgTimerRef.current = null; }
  };

  // ── Parse the backend response into a QAPair[] ────────────────────────────
  const parseQuestions = (json: any): QAPair[] =>
    Array.isArray(json?.data) ? json.data :
    Array.isArray(json) ? json :
    Array.isArray(json?.questions) ? json.questions :
    [];

  // ── Retrieve questions from DB (generation was triggered by invite screen) ─
  // invite.tsx calls GET /api/gemini/question on mount to run Gemini and store
  // questions. Here we poll GET /api/gemini/getQA until they land in the DB.
  useEffect(() => {
    let cancelled = false;
    startAnim(28000, setLoadingMsgIdx, LOADING_MESSAGES);

    const url = sessionId
      ? `${API_BASE}/api/gemini/getQA?sessionId=${sessionId}`
      : `${API_BASE}/api/gemini/getQA`;

    const loadQuestions = async () => {
      console.log("[getQA] polling for sessionId:", sessionId || "(none)", "→", url);

      // Poll every 3 s for up to ~30 s — Gemini generation (triggered in invite)
      // can take several seconds; we keep checking until the DB has the questions.
      for (let attempt = 1; attempt <= 10; attempt++) {
        if (cancelled) return;
        try {
          console.log(`[getQA] attempt ${attempt}…`);
          const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          console.log(`[getQA] attempt ${attempt} status:`, res.status);
          const json = await res.json();
          console.log(`[getQA] attempt ${attempt} body:`, JSON.stringify(json));

          const questions = parseQuestions(json);
          console.log(`[getQA] attempt ${attempt} parsed count:`, questions.length);

          if (questions.length > 0) {
            if (cancelled) return;
            console.log("[getQA] ✓ got backend questions");
            stopAnim();
            setQaPair(questions);
            setLoading(false);
            return;
          }
          console.warn(`[getQA] attempt ${attempt} — not ready yet, retrying in 3 s…`);
        } catch (err) {
          console.error(`[getQA] attempt ${attempt} failed:`, err);
        }
        if (attempt < 10) await new Promise(r => setTimeout(r, 3000));
      }

      if (cancelled) return;
      console.error("[getQA] ✗ questions never arrived — using SAMPLE_QUESTIONS fallback");
      stopAnim();
      setQaPair(SAMPLE_QUESTIONS);
      setLoading(false);
    };

    loadQuestions();
    return () => { cancelled = true; stopAnim(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ── Loading overlay ───────────────────────────────────────────────────────
  if (!fontsLoaded || loading) {
    return (
      <View style={styles.overlay}>
        <Text style={styles.overlayLogo}>Veto</Text>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, PROGRESS_BAR_WIDTH],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.overlayMsg}>{LOADING_MESSAGES[loadingMsgIdx]}</Text>
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

    // ── Last question: submit answers + fetch restaurants ─────────────────
    const finalAnswers = [...userAnswers];
    finalAnswers[counter] = selectedAnswer;

    const formattedAnswers = qaPair.map((q, i) => ({
      id: q.id,
      question: q.question,
      answer: finalAnswers[i] || q.answer[0],
    }));

    console.log("[submit] answers:", JSON.stringify(formattedAnswers));

    setIsSubmitting(true);
    // Step 1: show bar at 0, start cycling messages
    progressAnim.setValue(0);
    if (msgTimerRef.current) clearInterval(msgTimerRef.current);
    msgTimerRef.current = setInterval(() => setSubmitMsgIdx(i => (i + 1) % SUBMIT_MESSAGES.length), 2500);

    // Step 2: jump to 20% instantly — answers are being sent
    stepAnim(0.2, 400);

    try {
      const submitRes = await fetch(`${API_BASE}/api/gemini/submitAnswer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          answers: formattedAnswers.map(a => ({ id: a.id, value: a.answer })),
        }),
      });
      console.log("[submitAnswer] status:", submitRes.status);
    } catch (err) {
      console.error("[submitAnswer] failed:", err);
    }

    // Step 3: 40% — answers submitted, Gemini is now working
    stepAnim(0.4, 300);

    try {
      console.log("[restaurant] fetching recommendations…");
      // Step 4: crawl slowly to 85% while Gemini generates (up to ~35s)
      stepAnim(0.85, 33000);

      const restaurantRes = await fetch(`${API_BASE}/api/gemini/restaurant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAnswers: formattedAnswers, sessionId }),
      });
      console.log("[restaurant] status:", restaurantRes.status);

      const restaurantJson = await restaurantRes.json();
      console.log("[restaurant] body:", JSON.stringify(restaurantJson));

      const restaurants = Array.isArray(restaurantJson.data) ? restaurantJson.data : [];
      console.log("[restaurant] count:", restaurants.length);

      // Step 5: snap to 100% on success
      stopAnim();
      Animated.timing(progressAnim, { toValue: 1, duration: 250, useNativeDriver: false }).start(() => {
        setIsSubmitting(false);
        router.push({
          pathname: "/questionResults",
          params: { restaurants: JSON.stringify(restaurants), sessionId: sessionId ?? "" },
        });
      });
    } catch (err) {
      console.error("[restaurant] fetch failed:", err);
      stopAnim();
      setIsSubmitting(false);
      router.push({
        pathname: "/questionResults",
        params: { restaurants: JSON.stringify([]), sessionId: sessionId ?? "" },
      });
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

        <View style={styles.headerRow}>
          {counter !== 0 ? (
            <Pressable onPress={handleBack} disabled={isSubmitting}>
              <Image style={styles.navButton} source={require("../assets/images/backButton.png")} />
            </Pressable>
          ) : (
            <View style={styles.navButton} />
          )}
          <Text style={styles.curatingText}>CURATING</Text>
          <Pressable onPress={handleNext} disabled={isSubmitting}>
            <Image style={styles.navButton} source={require("../assets/images/nextButton.png")} />
          </Pressable>
        </View>

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
        <View style={styles.overlay}>
          <Text style={styles.overlayLogo}>Veto</Text>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, PROGRESS_BAR_WIDTH],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.overlayMsg}>{SUBMIT_MESSAGES[submitMsgIdx]}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  screen:   { flex: 1, backgroundColor: "#fff" },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
    zIndex: 200,
    justifyContent: "center",
    alignItems: "center",
    gap: 28,
    paddingHorizontal: 48,
  },
  overlayLogo: {
    fontFamily: "Newsreader_400Regular_Italic",
    fontSize: 56,
    color: "#1b1b1b",
    letterSpacing: -1,
  },
  progressTrack: {
    width: PROGRESS_BAR_WIDTH,
    height: 2,
    backgroundColor: "#e8e6e1",
    borderRadius: 1,
    overflow: "hidden",
  },
  progressFill: {
    height: 2,
    backgroundColor: "#1b1b1b",
    borderRadius: 1,
  },
  overlayMsg: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#999",
    letterSpacing: 0.2,
    textAlign: "center",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    paddingTop: 8,
  },
  navButton:    { width: 60, height: 60, borderRadius: 30 },
  curatingText: { fontFamily: "Inter_400Regular", fontSize: 12, letterSpacing: 2, color: "#666" },
  cardWrapper:  { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 12 },
  card: {
    width: 340,
    minHeight: 360,
    backgroundColor: "#fff",
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
  iconContainer: { alignItems: "center", marginTop: 28 },
  icon:          { width: 35, height: 35, resizeMode: "cover" },
  question: {
    color: "#1A1A1A",
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 26,
    textAlign: "center",
    marginTop: 16,
    marginHorizontal: 28,
    lineHeight: 32,
  },
  answersContainer:  { marginTop: 20, paddingHorizontal: 24, paddingBottom: 16, alignItems: "center" },
  progressContainer: { alignItems: "center", paddingBottom: 8 },
});
