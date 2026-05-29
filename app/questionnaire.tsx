import Progress from "@/components/progress";
import Radiobutton from "@/components/radiobutton";
import { useAuth } from "@/context/AuthContext";
import { useSession } from "@/context/SessionContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import {
  Newsreader_400Regular_Italic,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { io, Socket } from "socket.io-client";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const API_BASE     = "http://10.0.0.129:5000";
const SERVER_URL   = "http://10.0.0.129:5000";
const PROGRESS_BAR_WIDTH = SCREEN_WIDTH - 96;

const LOADING_MESSAGES = [
  "Analysing your preferences…",
  "Checking the neighbourhood…",
  "Consulting the critics…",
  "Finding the best compromise…",
  "Almost there…",
];

const WAITING_MESSAGES = [
  "Your answers are in!",
  "Waiting for your group…",
  "Almost everyone is done…",
  "Just one more member…",
];

type QAPair = {
  id: number;
  question: string;
  answer: string[];
};

const SAMPLE_QUESTIONS: QAPair[] = [
  { id: 1, question: "How much are we spending tonight?", answer: ["Under $20", "$20-$50", "$50+", "Don't mind"] },
  { id: 2, question: "What type of cuisine?",            answer: ["Italian", "Asian", "American", "Mexican"] },
  { id: 3, question: "How many people in party?",        answer: ["2-3", "4-5", "6-8", "8+", "Just me"] },
  { id: 4, question: "Any dietary restrictions?",        answer: ["Vegan", "Vegetarian", "Gluten-free", "Halal", "Nut allergy", "None"] },
  { id: 5, question: "Time preference?",                 answer: ["Breakfast", "Lunch", "Dinner", "Late night"] },
  { id: 6, question: "Ambiance important?",              answer: ["Very important", "Somewhat important", "Not important"] },
  { id: 7, question: "Indoor or outdoor?",               answer: ["Indoor", "Outdoor", "Either is fine"] },
  { id: 8, question: "Max travel distance?",             answer: ["Less than 1 mile", "1-3 miles", "3-5 miles", "5+ miles"] },
];

export default function Questionnaire() {
  const [qaPair, setQaPair]       = useState<QAPair[]>([]);
  const [loading, setLoading]     = useState(true);
  const [counter, setCounter]     = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);

  // Overlay states
  const [isSubmitting, setIsSubmitting] = useState(false);   // "generating…" overlay
  const [isWaiting,    setIsWaiting]    = useState(false);   // "waiting for group" overlay
  const [waitProgress, setWaitProgress] = useState({ answered: 0, total: 1 });
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [waitingMsgIdx, setWaitingMsgIdx] = useState(0);

  const router    = useRouter();
  const { sessionId: ctxSessionId } = useSession();
  const { userId, guestId }         = useAuth();
  const { sessionId: paramSessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const sessionId = ctxSessionId ?? paramSessionId ?? "";

  // ── Refs ─────────────────────────────────────────────────────────────────
  const progressAnim     = useRef(new Animated.Value(0)).current;
  const progressAnimRef  = useRef<Animated.CompositeAnimation | null>(null);
  const msgTimerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef        = useRef<Socket | null>(null);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_600SemiBold,
    Newsreader_400Regular_Italic,
  });

  // ── Question fetch helpers ────────────────────────────────────────────────
  const CACHE_KEY = `veto:questions:${sessionId || "default"}`;

  /** Single attempt with 12s AbortController timeout */
  const fetchOnce = async (url: string): Promise<QAPair[]> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const res  = await fetch(url, { signal: controller.signal });
      const json = await res.json();
      const qs: QAPair[] =
        Array.isArray(json?.data)      ? json.data :
        Array.isArray(json?.questions) ? json.questions :
        Array.isArray(json)            ? json : [];
      return qs;
    } finally {
      clearTimeout(timer);
    }
  };

  /** Up to 2 attempts with 1.5s back-off */
  const fetchWithRetry = async (): Promise<QAPair[]> => {
    const url = sessionId
      ? `${API_BASE}/api/gemini/getQA?sessionId=${sessionId}`
      : `${API_BASE}/api/gemini/getQA`;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const qs = await fetchOnce(url);
        if (qs.length > 0) return qs;
      } catch {}
      if (attempt < 1) await new Promise(r => setTimeout(r, 1500));
    }
    return [];
  };

  // ── Fetch questions ───────────────────────────────────────────────────────
  useEffect(() => {
    const loadQuestions = async () => {
      // 1. Show cached questions immediately (instant UX)
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed: QAPair[] = JSON.parse(cached);
          if (parsed.length > 0) {
            setQaPair(parsed);
            setLoading(false);
          }
        }
      } catch {}

      // 2. Fetch fresh from API (with retry + timeout)
      const fresh = await fetchWithRetry();

      if (fresh.length > 0) {
        setQaPair(fresh);
        // Persist for offline use
        try { await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh)); } catch {}
      } else if (!(await AsyncStorage.getItem(CACHE_KEY))) {
        // Nothing from API and no cache — silent fallback
        setQaPair(SAMPLE_QUESTIONS);
      }

      setLoading(false);
    };
    loadQuestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Connect to lobby socket to receive restaurants_ready ──────────────────
  useEffect(() => {
    if (!sessionId) return;

    const socket = io(`${SERVER_URL}/lobby`, {
      transports: ["websocket"],
      forceNew: false, // reuse connection if lobby socket already open
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[questionnaire] lobby socket connected");
    });

    // Progress update while waiting for others
    socket.on("answers_progress", ({ answered, total }: { answered: number; total: number }) => {
      setWaitProgress({ answered, total });
    });

    // All answers in — server is generating restaurants
    socket.on("generating_restaurants", () => {
      setIsWaiting(false);
      setIsSubmitting(true);
      setLoadingMsgIdx(0);
      startLoadingAnimation();
    });

    // Results ready — navigate to question results
    socket.on("restaurants_ready", ({ restaurants }: { restaurants: any[] }) => {
      finishLoadingAnimation(() => {
        router.push({
          pathname: "/questionResults",
          params: { restaurants: JSON.stringify(restaurants) },
        });
      });
    });

    socket.on("restaurants_error", ({ message }: { message: string }) => {
      console.error("[questionnaire] restaurants_error:", message);
      setIsSubmitting(false);
      setIsWaiting(false);
    });

    return () => {
      socket.disconnect();
      if (msgTimerRef.current) clearInterval(msgTimerRef.current);
      progressAnimRef.current?.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ── Cycling waiting message ───────────────────────────────────────────────
  useEffect(() => {
    if (!isWaiting) return;
    const timer = setInterval(() => {
      setWaitingMsgIdx(i => (i + 1) % WAITING_MESSAGES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [isWaiting]);

  // ── Progress bar helpers ──────────────────────────────────────────────────
  const startLoadingAnimation = () => {
    progressAnim.setValue(0);
    progressAnimRef.current = Animated.timing(progressAnim, {
      toValue: 0.87,
      duration: 10000,
      useNativeDriver: false,
    });
    progressAnimRef.current.start();

    let idx = 0;
    msgTimerRef.current = setInterval(() => {
      idx = (idx + 1) % LOADING_MESSAGES.length;
      setLoadingMsgIdx(idx);
    }, 2400);
  };

  const finishLoadingAnimation = (callback: () => void) => {
    if (msgTimerRef.current) { clearInterval(msgTimerRef.current); msgTimerRef.current = null; }
    progressAnimRef.current?.stop();
    Animated.timing(progressAnim, { toValue: 1, duration: 350, useNativeDriver: false }).start(
      () => setTimeout(callback, 120)
    );
  };

  if (!fontsLoaded || loading) return null;

  const currentQuestion = qaPair[counter];

  const handleBack = () => { if (counter > 0) setCounter(c => c - 1); };

  // ── Submit answers via lobby socket ──────────────────────────────────────
  const handleNext = async () => {
    if (isSubmitting || isWaiting) return;

    const selectedAnswer = userAnswers[counter]?.trim()
      ? userAnswers[counter]
      : qaPair[counter].answer[0];

    if (!userAnswers[counter]?.trim()) {
      setUserAnswers(prev => { const n = [...prev]; n[counter] = selectedAnswer; return n; });
    }

    if (counter < qaPair.length - 1) {
      setCounter(c => c + 1);
      return;
    }

    // ── Last question ──
    const finalAnswers = [...userAnswers];
    finalAnswers[counter] = selectedAnswer;

    const formattedAnswers = qaPair.map((q, i) => ({
      id:       q.id,
      question: q.question,
      answer:   finalAnswers[i] || q.answer[0],
    }));

    // Show "waiting for group" overlay immediately
    setIsWaiting(true);
    setWaitProgress({ answered: 1, total: 1 }); // optimistic

    // Emit answers to the lobby socket — server handles Gemini when all are in
    if (socketRef.current && sessionId) {
      socketRef.current.emit("submit_answers", {
        sessionId,
        answers: formattedAnswers,
        alias:   "You",
        userId:  userId  ?? undefined,
        guestId: guestId ?? undefined,
      });
    } else {
      // No socket / solo mode — call Gemini directly
      setIsWaiting(false);
      setIsSubmitting(true);
      setLoadingMsgIdx(0);
      startLoadingAnimation();

      try {
        const res = await fetch(`${API_BASE}/api/gemini/restaurant`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userAnswers: formattedAnswers, sessionId }),
        });
        const json = await res.json();
        const restaurants = Array.isArray(json.data) ? json.data : [];
        finishLoadingAnimation(() => {
          router.push({
            pathname: "/questionResults",
            params: { restaurants: JSON.stringify(restaurants) },
          });
        });
      } catch (err) {
        console.error("getRestaurant failed:", err);
        finishLoadingAnimation(() => {
          setIsSubmitting(false);
          router.push({ pathname: "/questionResults", params: { restaurants: JSON.stringify([]) } });
        });
      }
    }
  };

  const updateAnswer = (val: string) => {
    setUserAnswers(prev => { const n = [...prev]; n[counter] = val; return n; });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.headerRow}>
          {counter !== 0 ? (
            <Pressable onPress={handleBack} disabled={isSubmitting || isWaiting}>
              <Image style={styles.navButton} source={require("../assets/images/backButton.png")} />
            </Pressable>
          ) : (
            <View style={styles.navButton} />
          )}
          <Text style={styles.curatingText}>CURATING</Text>
          <Pressable onPress={handleNext} disabled={isSubmitting || isWaiting}>
            <Image style={styles.navButton} source={require("../assets/images/nextButton.png")} />
          </Pressable>
        </View>

        {/* Question card */}
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

      {/* ── Waiting for group overlay ── */}
      {isWaiting && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingLogo}>Veto</Text>
          <View style={styles.waitingCard}>
            <Text style={styles.waitingTitle}>{WAITING_MESSAGES[waitingMsgIdx]}</Text>
            <Text style={styles.waitingCount}>
              {waitProgress.answered} of {waitProgress.total} answered
            </Text>
            {/* Member dots */}
            <View style={styles.waitingDots}>
              {Array.from({ length: waitProgress.total }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.waitingDot, i < waitProgress.answered && styles.waitingDotDone]}
                />
              ))}
            </View>
          </View>
          <Text style={styles.loadingMsg}>Sit tight while your group finishes…</Text>
        </View>
      )}

      {/* ── Generating restaurants overlay ── */}
      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingLogo}>Veto</Text>
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
          <Text style={styles.loadingMsg}>{LOADING_MESSAGES[loadingMsgIdx]}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  screen:   { flex: 1, backgroundColor: "#fff" },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    paddingTop: 8,
  },
  navButton:    { width: 60, height: 60, borderRadius: 30 },
  curatingText: { fontFamily: "Inter_400Regular", fontSize: 12, letterSpacing: 2, color: "#666" },

  cardWrapper: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 12 },
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
  iconContainer:    { alignItems: "center", marginTop: 28 },
  icon:             { width: 35, height: 35, resizeMode: "cover" },
  question: {
    color: "#1A1A1A",
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 26,
    textAlign: "center",
    marginTop: 16,
    marginHorizontal: 28,
    lineHeight: 32,
  },
  answersContainer: { marginTop: 20, paddingHorizontal: 24, paddingBottom: 16, alignItems: "center" },
  progressContainer: { alignItems: "center", paddingBottom: 8 },

  // ── Loading overlays ──
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
    zIndex: 200,
    justifyContent: "center",
    alignItems: "center",
    gap: 28,
    paddingHorizontal: 40,
  },
  loadingLogo: {
    fontFamily: "Newsreader_400Regular_Italic",
    fontSize: 56,
    color: "#1b1b1b",
    letterSpacing: -1,
  },

  // Waiting for group
  waitingCard: {
    width: "100%",
    backgroundColor: "#f0eeea",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  waitingTitle: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 22,
    color: "#1b1b1b",
    textAlign: "center",
  },
  waitingCount: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#888" },
  waitingDots: { flexDirection: "row", gap: 8, marginTop: 4 },
  waitingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#d0d0d0",
  },
  waitingDotDone: { backgroundColor: "#1b1b1b" },

  // Generating restaurants
  progressTrack: {
    width: PROGRESS_BAR_WIDTH,
    height: 2,
    backgroundColor: "#e8e6e1",
    borderRadius: 1,
    overflow: "hidden",
  },
  progressFill: { height: 2, backgroundColor: "#1b1b1b", borderRadius: 1 },
  loadingMsg: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#999",
    letterSpacing: 0.2,
    textAlign: "center",
  },
});
