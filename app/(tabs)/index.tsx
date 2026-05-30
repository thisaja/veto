import { useAuth } from "@/context/AuthContext";
import { useSession } from "@/context/SessionContext";
import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import {
  Newsreader_400Regular_Italic,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE = "http://10.0.0.129:5000";

type RecentGroup = {
  sessionId: string;
  createdAt: string;
  restaurantId: number | null;
  matchedRestaurant: string | null;
  imageURL: string | null;
  label: string | null;
  caption: string | null;
  memberCount: number;
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = diff / 86_400_000;
  if (days < 1)  return "Today";
  if (days < 2)  return "Yesterday";
  if (days < 7)  return `${Math.floor(days)} days ago`;
  if (days < 14) return "Last week";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export default function HomeScreen() {
  const router   = useRouter();
  const { userId, isGuest, loginAsGuest } = useAuth();
  const { sessionId, resumePath } = useSession();

  const [recentGroups,    setRecentGroups]    = useState<RecentGroup[]>([]);
  const [loadingGroups,   setLoadingGroups]   = useState(false);
  const [historyError,    setHistoryError]    = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_600SemiBold,
    Newsreader_400Regular_Italic,
  });

  const fetchHistory = useCallback(async () => {
    if (!userId) return;
    setLoadingGroups(true);
    setHistoryError(false);
    try {
      const res  = await fetch(`${API_BASE}/session/history/${userId}`);
      const json = await res.json();
      if (json.success) setRecentGroups(json.data ?? []);
      else setHistoryError(true);
    } catch {
      setHistoryError(true);
    } finally {
      setLoadingGroups(false);
    }
  }, [userId]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  if (!fontsLoaded) return null;

  const handleHostSession = () => {
    if (sessionId) {
      Alert.alert(
        "Session in Progress",
        "You already have an active session. Resume it or finish it before starting a new one.",
        [{ text: "OK" }]
      );
      return;
    }
    if (!userId) loginAsGuest();
    router.push("/createSession");
  };

  const handleJoinLobby = () => {
    if (sessionId) {
      Alert.alert(
        "Session in Progress",
        "You already have an active session. Resume it or finish it before joining another.",
        [{ text: "OK" }]
      );
      return;
    }
    router.push("/joinLobby");
  };

  const handleResumeSession = () => {
    if (!resumePath) return;
    router.push({
      pathname: resumePath as any,
      params: { sessionId: sessionId! },
    });
  };

  const handleGroupPress = (g: RecentGroup) => {
    if (!g.matchedRestaurant) return;
    router.push({
      pathname: "/matched",
      params: {
        restaurant: JSON.stringify({
          id:       g.restaurantId,
          header:   g.matchedRestaurant,
          imageURL: g.imageURL ?? "",
          label:    g.label ?? "",
          caption:  g.caption ?? "",
        }),
      },
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Wordmark + tagline ── */}
        <Text style={styles.wordmark}>Veto</Text>
        <Text style={styles.tagline}>Group dining,{"\n"}decided together.</Text>

        {/* ════════════════════════════
            ACTIVE SESSION BANNER
        ════════════════════════════ */}
        {sessionId && resumePath && (
          <TouchableOpacity
            style={styles.resumeBanner}
            activeOpacity={0.8}
            onPress={handleResumeSession}
          >
            <View style={styles.resumeBannerLeft}>
              <Feather name="activity" size={16} color="#c8920a" />
              <Text style={styles.resumeBannerText}>Session in progress</Text>
            </View>
            <View style={styles.resumeButton}>
              <Text style={styles.resumeButtonText}>RESUME</Text>
              <Feather name="arrow-right" size={14} color="#5a3800" />
            </View>
          </TouchableOpacity>
        )}

        {/* ════════════════════════════
            HOST A SESSION CARD (authenticated only)
        ════════════════════════════ */}
        {!isGuest && (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardTexts}>
                <Text style={styles.cardHeading}>Host a Session</Text>
                <Text style={styles.cardDesc}>
                  Lead the way. Choose a location, set your filters, and invite your circle.
                </Text>
              </View>
              <MaterialIcons name="restaurant" size={56} color="#d4cfc8" style={styles.decorIcon} />
            </View>
            <TouchableOpacity style={styles.cardBtn} activeOpacity={0.8} onPress={handleHostSession}>
              <Text style={styles.cardBtnText}>CREATE SESSION</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ════════════════════════════
            JOIN A LOBBY CARD
        ════════════════════════════ */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.cardTexts}>
              <Text style={styles.cardHeading}>Join a Lobby</Text>
              <Text style={styles.cardDesc}>
                Received an invite? Enter the code or scan the host's QR to jump straight in.
              </Text>
            </View>
            <Feather name="users" size={52} color="#d4cfc8" style={styles.decorIcon} />
          </View>
          <TouchableOpacity style={styles.cardBtn} activeOpacity={0.8} onPress={handleJoinLobby}>
            <Text style={styles.cardBtnText}>SCAN QR OR ENTER CODE</Text>
          </TouchableOpacity>
        </View>

        {/* ════════════════════════════
            GUEST UPSELL / RECENT GROUPS
        ════════════════════════════ */}
        {isGuest ? (
          <View style={styles.guestUpsell}>
            <Text style={styles.guestUpsellTitle}>Want to host your own session?</Text>
            <Text style={styles.guestUpsellSub}>
              Create a free account to host sessions, invite friends, and track your dining history.
            </Text>
            <TouchableOpacity
              style={styles.guestUpsellBtn}
              onPress={() => router.push("/(register)")}
              activeOpacity={0.85}
            >
              <Text style={styles.guestUpsellBtnText}>CREATE ACCOUNT</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/login")} activeOpacity={0.7}>
              <Text style={styles.guestLoginLink}>Already have an account? Log in</Text>
            </TouchableOpacity>
          </View>
        ) : (
        <View style={styles.recentSection}>
          <Text style={styles.sectionLabel}>RECENT GROUPS</Text>

          {!userId ? (
            <Text style={styles.emptyText}>Sign in to see your past sessions here.</Text>
          ) : loadingGroups ? (
            <ActivityIndicator size="small" color="#999" style={{ marginTop: 12 }} />
          ) : historyError ? (
            <TouchableOpacity onPress={fetchHistory} style={{ marginTop: 8, alignItems: "flex-start" }}>
              <Text style={[styles.emptyText, { color: "#ba1a1a" }]}>
                Couldn't load sessions. Tap to retry.
              </Text>
            </TouchableOpacity>
          ) : recentGroups.length === 0 ? (
            <Text style={styles.emptyText}>Your past sessions will appear here.</Text>
          ) : (
            <View style={styles.groupList}>
              {recentGroups.map((g, i) => (
                <TouchableOpacity
                  key={g.sessionId}
                  style={[
                    styles.groupRow,
                    i < recentGroups.length - 1 && styles.groupRowDivider,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleGroupPress(g)}
                  disabled={!g.matchedRestaurant}
                >
                  {g.imageURL ? (
                    <Image source={{ uri: g.imageURL }} style={styles.groupAvatar} />
                  ) : (
                    <View style={styles.groupAvatarFallback}>
                      <Feather name="coffee" size={18} color="#bbb" />
                    </View>
                  )}
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName} numberOfLines={1}>
                      {g.matchedRestaurant ?? "Session"}
                    </Text>
                    <Text style={styles.groupMeta}>
                      {g.memberCount} member{g.memberCount !== 1 ? "s" : ""}{" · "}{relativeTime(g.createdAt)}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="#bbb" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 4 },

  wordmark: {
    fontFamily: "Newsreader_400Regular_Italic",
    fontSize: 52,
    color: "#1b1b1b",
    letterSpacing: -1,
    marginBottom: 12,
  },
  tagline: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 36,
    lineHeight: 42,
    color: "#1b1b1b",
    letterSpacing: -0.5,
    marginBottom: 32,
  },

  // ── Active session banner ──
  resumeBanner: {
    backgroundColor: "#fdf3dc",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#f0d98a",
  },
  resumeBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resumeBannerText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#5a3800",
  },
  resumeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#c8920a",
  },
  resumeButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1,
    color: "#5a3800",
  },

  // ── Cards ──
  card: {
    backgroundColor: "#F0EEEA",
    borderRadius: 20,
    padding: 22,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 8,
  },
  cardTexts: { flex: 1 },
  cardHeading: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 24,
    color: "#1b1b1b",
    marginBottom: 6,
    lineHeight: 28,
  },
  cardDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#666",
    lineHeight: 19,
  },
  decorIcon: {
    marginTop: 2,
    opacity: 0.9,
  },

  cardBtn: {
    width: "100%",
    height: 52,
    borderRadius: 32,
    backgroundColor: "#1b1b1b",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 1.5,
    color: "#fff",
  },

  // ── Guest upsell ──
  guestUpsell: {
    marginTop: 10,
    backgroundColor: "#f0eeea",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  guestUpsellTitle: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 20,
    color: "#1b1b1b",
    textAlign: "center",
    lineHeight: 26,
  },
  guestUpsellSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 19,
  },
  guestUpsellBtn: {
    backgroundColor: "#1b1b1b",
    borderRadius: 32,
    height: 52,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  guestUpsellBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 1.5,
    color: "#fff",
  },
  guestLoginLink: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#888",
    textDecorationLine: "underline",
  },

  // ── Recent groups ──
  recentSection: { marginTop: 10 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 2,
    color: "#999",
    marginBottom: 10,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#bbb",
  },
  groupList: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e8e6e1",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  groupRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0eeea",
  },
  groupAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  groupAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0eeea",
    alignItems: "center",
    justifyContent: "center",
  },
  groupInfo: { flex: 1, gap: 3 },
  groupName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#1b1b1b",
  },
  groupMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#999",
  },
});
