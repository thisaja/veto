import MyButton from "@/components/button";
import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { io, Socket } from "socket.io-client";

const SERVER_URL = "http://10.0.0.129:5000";

type Restaurant = {
  id: number;
  header: string;
  imageURL: string;
  imageURLs?: string[];
  label: string;
  priceRange?: string;
  rating?: string;
  caption: string;
  popularItems?: string[];
};

type GamePhase = "connecting" | "active" | "round_end" | "game_over";

const PickBanScreen = () => {
  const router = useRouter();
  const { restaurants: restaurantsParam, sessionId } =
    useLocalSearchParams<{ restaurants: string; sessionId: string }>();

  // ── Parse restaurants ────────────────────────────────────────────────────
  const allRestaurants: Restaurant[] = useMemo(() => {
    try {
      return restaurantsParam ? JSON.parse(restaurantsParam) : [];
    } catch {
      return [];
    }
  }, [restaurantsParam]);

  // ── Game state ───────────────────────────────────────────────────────────
  const [activeRestaurants, setActiveRestaurants] = useState<Restaurant[]>([]);
  const [eliminatedIds, setEliminatedIds] = useState<number[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<number, number>>({});
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [myVoteId, setMyVoteId] = useState<number | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>("connecting");
  const [justEliminatedId, setJustEliminatedId] = useState<number | null>(null);
  const [winner, setWinner] = useState<Restaurant | null>(null);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
  });

  // ── Socket setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ["websocket"],
      forceNew: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[pickBan] socket connected");
      socket.emit("join_room", {
        sessionId,
        restaurants: allRestaurants,
      });
    });

    socket.on(
      "round_start",
      (data: {
        round: number;
        restaurants: Restaurant[];
        eliminatedIds: number[];
        timeLeft: number;
      }) => {
        setRound(data.round);
        setActiveRestaurants(data.restaurants);
        setEliminatedIds(data.eliminatedIds);
        setVoteCounts({});
        setMyVoteId(null);
        setJustEliminatedId(null);
        setGamePhase("active");
        startLocalTimer(data.timeLeft);
      }
    );

    socket.on(
      "vote_update",
      (data: { voteCounts: Record<number, number> }) => {
        setVoteCounts(data.voteCounts);
      }
    );

    socket.on(
      "round_end",
      (data: {
        round: number;
        eliminatedId: number;
        eliminatedRestaurant: Restaurant;
        voteCounts: Record<number, number>;
      }) => {
        stopLocalTimer();
        setVoteCounts(data.voteCounts);
        setJustEliminatedId(data.eliminatedId);
        setEliminatedIds((prev) => [...prev, data.eliminatedId]);
        setGamePhase("round_end");
      }
    );

    socket.on("game_over", (data: { winner: Restaurant }) => {
      stopLocalTimer();
      setWinner(data.winner);
      setGamePhase("game_over");
      // Navigate to matched after a short celebration delay
      setTimeout(() => {
        router.replace({
          pathname: "/matched",
          params: { restaurant: JSON.stringify(data.winner) },
        });
      }, 2000);
    });

    socket.on("connect_error", (err) => {
      console.error("[pickBan] socket error:", err.message);
    });

    return () => {
      stopLocalTimer();
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ── Local countdown ──────────────────────────────────────────────────────
  const startLocalTimer = (seconds: number) => {
    stopLocalTimer();
    setTimeLeft(seconds);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          stopLocalTimer();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const stopLocalTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleVeto = (restaurantId: number) => {
    if (gamePhase !== "active") return;

    if (myVoteId === restaurantId) {
      // Tapping the same card again removes the vote
      setMyVoteId(null);
      socketRef.current?.emit("cast_vote", { sessionId, restaurantId: null });
    } else {
      // Switch vote to this restaurant (server removes old vote automatically)
      setMyVoteId(restaurantId);
      socketRef.current?.emit("cast_vote", { sessionId, restaurantId });
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!fontsLoaded) return null;

  // Merge all restaurants: show active + eliminated together for visual continuity
  const displayRestaurants = allRestaurants.length > 0 ? allRestaurants : activeRestaurants;

  return (
    <SafeAreaView style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <MyButton style={styles.sideButton} onClick={() => router.back()}>
          <Feather name="arrow-left" size={24} color="black" />
        </MyButton>
        <Text style={styles.appName}>Veto</Text>
        <MyButton style={styles.sideButton} onClick={() => {}}>
          <View style={styles.profileCircle}>
            <Feather name="user" size={20} color="#5b5b5b" />
          </View>
        </MyButton>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── Hero section ── */}
        <View style={styles.heroSection}>
          {gamePhase === "game_over" ? (
            <View style={[styles.timerPill, styles.timerPillWinner]}>
              <Feather name="award" size={14} color="#5a3800" />
              <Text style={[styles.timerText, { color: "#5a3800" }]}>THE WINNER</Text>
            </View>
          ) : gamePhase === "connecting" ? (
            <View style={styles.timerPill}>
              <Feather name="wifi" size={14} color="#444" />
              <Text style={[styles.timerText, { color: "#444" }]}>CONNECTING…</Text>
            </View>
          ) : gamePhase === "round_end" ? (
            <View style={[styles.timerPill, styles.timerPillEnded]}>
              <Feather name="check-circle" size={14} color="#1b6b3a" />
              <Text style={[styles.timerText, { color: "#1b6b3a" }]}>ROUND {round} COMPLETE</Text>
            </View>
          ) : (
            <View style={[styles.timerPill, timeLeft <= 10 && styles.timerPillUrgent]}>
              <Feather name="clock" size={14} color="#93000a" />
              <Text style={styles.timerText}>{formatTime(timeLeft)} REMAINING</Text>
            </View>
          )}

          <Text style={styles.title}>
            {gamePhase === "game_over"
              ? winner?.header ?? "The Verdict"
              : gamePhase === "round_end"
              ? "Elimination"
              : "Elimination Phase"}
          </Text>
          <Text style={styles.subtitle}>
            {gamePhase === "game_over"
              ? "Taking you to your result…"
              : gamePhase === "round_end"
              ? `Round ${round} is over. Next round starting soon…`
              : `Round ${round} of 4 — Cast your veto. The restaurant with the most votes will be eliminated.`}
          </Text>
        </View>

        {/* ── Cards ── */}
        <View style={styles.cardsList}>
          {displayRestaurants.map((r) => {
            const isEliminated = eliminatedIds.includes(r.id);
            const heroImage = r.imageURLs?.[0] ?? r.imageURL;
            const voteCount = voteCounts[r.id] ?? 0;
            const isMyVote = myVoteId === r.id;
            const isGameOver = gamePhase === "game_over";
            const isWinner = isGameOver && winner?.id === r.id;
            // Stamps are red during play, flip to black at game_over
            const stampStyle = isGameOver ? styles.bannedStampFinal : styles.bannedStamp;
            const stampTextStyle = isGameOver ? styles.bannedTextFinal : styles.bannedText;

            return (
              <View
                key={r.id}
                style={[
                  styles.card,
                  isEliminated && styles.cardBanned,
                  isWinner && styles.cardWinner,
                ]}
              >
                {/* Full-card BANNED overlay: server-confirmed eliminations only */}
                {isEliminated && (
                  <View style={styles.bannedOverlay} pointerEvents="none">
                    <View style={stampStyle}>
                      <Text style={stampTextStyle}>BANNED</Text>
                    </View>
                  </View>
                )}

                {/* Winner crown overlay at game_over */}
                {isWinner && (
                  <View style={styles.winnerOverlay} pointerEvents="none">
                    <View style={styles.winnerBadge}>
                      <Feather name="award" size={18} color="#5a3800" />
                      <Text style={styles.winnerBadgeText}>WINNER</Text>
                    </View>
                  </View>
                )}

                {/* Image */}
                <View style={styles.imageBox}>
                  <Image source={{ uri: heroImage }} style={styles.cardImage} />
                  <View style={styles.imageGradient} />

                  {/* Image-only BANNED overlay for user's current tentative vote */}
                  {isMyVote && !isEliminated && (
                    <View style={styles.imageBannedOverlay} pointerEvents="none">
                      <View style={stampStyle}>
                        <Text style={stampTextStyle}>BANNED</Text>
                      </View>
                    </View>
                  )}

                  {/* Badges on top of everything */}
                  <View style={styles.badgesRow}>
                    {r.rating ? (
                      <View style={styles.ratingPill}>
                        <Feather name="star" size={11} color="#1b1b1b" />
                        <Text style={styles.ratingText}>{r.rating}</Text>
                      </View>
                    ) : (
                      <View />
                    )}
                    {/* Live vote count — always visible */}
                    <View style={[styles.voteDot, voteCount > 0 && styles.voteDotActive]}>
                      <Text style={[styles.voteCount, voteCount > 0 && styles.voteCountActive]}>
                        {voteCount}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Content — full opacity for active cards, dimmed only when eliminated */}
                <View style={[styles.cardBody, isEliminated && styles.cardBodyBanned]}>
                  <Text style={[styles.cardTitle, isEliminated && styles.cardTitleBanned]}>
                    {r.header}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {r.label}
                    {r.priceRange ? ` • ${r.priceRange}` : ""}
                  </Text>
                  <View style={styles.divider} />

                  {isEliminated ? (
                    /* Server-confirmed — locked label */
                    <View style={styles.eliminatedButton}>
                      <Text style={styles.eliminatedText}>
                        Eliminated — {voteCount} Vote{voteCount !== 1 ? "s" : ""}
                      </Text>
                    </View>
                  ) : isMyVote ? (
                    /* User's current vote — visible count, tap to unvote or switch */
                    <TouchableOpacity
                      style={styles.myVoteButton}
                      onPress={() => handleVeto(r.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.vetoButtonContent}>
                        <Ionicons name="ban-outline" size={18} color="#ba1a1a" />
                        <Text style={styles.myVoteButtonText}>
                          Your Veto · {voteCount} Vote{voteCount !== 1 ? "s" : ""}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ) : gamePhase !== "active" ? (
                    /* Round over — locked */
                    <View style={[styles.vetoButton, styles.vetoButtonDisabled]}>
                      <View style={styles.vetoButtonContent}>
                        <Ionicons name="ban-outline" size={18} color="#c0c0c0" />
                        <Text style={[styles.vetoButtonText, styles.vetoButtonTextDisabled]}>
                          Veto This Option
                        </Text>
                      </View>
                    </View>
                  ) : (
                    /* Active — always tappable, switch vote freely */
                    <TouchableOpacity
                      style={styles.vetoButton}
                      onPress={() => handleVeto(r.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.vetoButtonContent}>
                        <Ionicons name="ban-outline" size={18} color="#1b1b1b" />
                        <Text style={styles.vetoButtonText}>Veto This Option</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f9f9f9" },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  sideButton: {
    width: 50,
    height: 50,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontFamily: "Newsreader_400Regular_Italic",
    fontSize: 26,
    color: "#1b1b1b",
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#d9d9d9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#a7a7a7",
  },

  // ── Scroll ──
  scrollContent: { paddingBottom: 48 },

  // ── Hero ──
  heroSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 8,
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#ffdad6",
    marginBottom: 16,
  },
  timerPillUrgent: {
    backgroundColor: "#ffdad6",
  },
  timerPillEnded: {
    backgroundColor: "#d6f0e0",
  },
  timerPillWinner: {
    backgroundColor: "#fdf3dc",
  },
  timerText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 1.5,
    color: "#93000a",
  },
  title: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 40,
    lineHeight: 44,
    color: "#1b1b1b",
    textAlign: "center",
    letterSpacing: -0.8,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 24,
    color: "#4c4546",
    textAlign: "center",
    maxWidth: 320,
  },

  // ── Cards ──
  cardsList: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e4e2dd",
    overflow: "hidden",
    position: "relative",
  },
  cardBanned: {
    opacity: 0.75,
    borderColor: "rgba(186,26,26,0.25)",
    backgroundColor: "#f3f3f3",
  },
  cardWinner: {
    borderColor: "#c8920a",
    borderWidth: 2,
  },

  // BANNED overlay — full-card version (server-confirmed eliminations)
  bannedOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249,249,249,0.30)",
  },
  // Image-only BANNED overlay (user's current tentative vote)
  imageBannedOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  // Red stamp — used during active gameplay
  bannedStamp: {
    transform: [{ rotate: "-15deg" }],
    borderWidth: 3,
    borderColor: "#ba1a1a",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  bannedText: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 36,
    letterSpacing: 5,
    color: "#ba1a1a",
  },
  // Black stamp — used at game_over
  bannedStampFinal: {
    transform: [{ rotate: "-15deg" }],
    borderWidth: 3,
    borderColor: "#1b1b1b",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  bannedTextFinal: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 36,
    letterSpacing: 5,
    color: "#1b1b1b",
  },

  // Winner overlay
  winnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(253,243,220,0.30)",
  },
  winnerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fdf3dc",
    borderWidth: 2,
    borderColor: "#c8920a",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  winnerBadgeText: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 28,
    letterSpacing: 3,
    color: "#5a3800",
  },

  // Image
  imageBox: { height: 192, position: "relative" },
  cardImage: { width: "100%", height: "100%", resizeMode: "cover" },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "rgba(0,0,0,0.38)",
  },

  // Badges — z-index above both overlay types so count is always readable
  badgesRow: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 6,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(249,249,249,0.92)",
  },
  ratingText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#1b1b1b",
  },
  voteDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e8e8e8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  voteDotActive: { backgroundColor: "#1b1b1b" },
  voteCount: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#4c4546" },
  voteCountActive: { color: "#fff" },

  // Card body
  cardBody: { padding: 20 },
  cardBodyBanned: { backgroundColor: "#f3f3f3" },
  cardTitle: {
    fontFamily: "Newsreader_500Medium",
    fontSize: 26,
    lineHeight: 32,
    color: "#1b1b1b",
    marginBottom: 4,
  },
  cardTitleBanned: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  cardMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#4c4546",
    marginBottom: 16,
  },
  divider: { height: 1, backgroundColor: "#e4e2dd", marginBottom: 16 },

  // Veto button — border/shape lives here, NOT on a Pressable style callback
  vetoButton: {
    width: "100%",
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "#1b1b1b",
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  // Inner row: icon + label side-by-side (explicit View so flexDirection is reliable)
  vetoButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  vetoButtonDisabled: {
    borderColor: "#d0d0d0",
    backgroundColor: "#fafafa",
  },
  vetoButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#1b1b1b",
  },
  vetoButtonTextDisabled: {
    color: "#c0c0c0",
  },

  // Server-confirmed eliminated label (non-interactive)
  eliminatedButton: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 32,
    backgroundColor: "#ebebeb",
  },
  eliminatedText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#888",
  },

  // User's current tentative vote — shows live count, always tappable
  myVoteButton: {
    width: "100%",
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "#ba1a1a",
    backgroundColor: "#fff8f8",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  myVoteButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#ba1a1a",
  },
});

export default PickBanScreen;
