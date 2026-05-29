import MyButton from "@/components/button";
import { useAuth } from "@/context/AuthContext";
import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import {
  Newsreader_400Regular_Italic,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE = "http://10.0.0.129:5000";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

type RecentGroup = {
  sessionId: string;
  createdAt: string;
  matchedRestaurant: string | null;
  imageURL: string | null;
};

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning,";
  if (h >= 12 && h < 17) return "Good afternoon,";
  if (h >= 17 && h < 21) return "Good evening,";
  return "Late night cravings?";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const LandingScreen = () => {
  const router = useRouter();
  const { loginAsGuest, userId } = useAuth();

  const [joinModal, setJoinModal]     = useState(false);
  const [sessionCode, setSessionCode] = useState("");
  const [joiningCode, setJoiningCode] = useState(false);
  const [recentGroups, setRecentGroups] = useState<RecentGroup[]>([]);

  const [fontsLoaded] = useFonts({
    Newsreader_400Regular_Italic,
    Newsreader_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  // Fetch recent sessions for logged-in users
  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE}/session/history/${userId}`)
      .then((r) => r.json())
      .then((json) => { if (json.success) setRecentGroups(json.data ?? []); })
      .catch(() => {});
  }, [userId]);

  if (!fontsLoaded) return null;

  const handleHostSession = () => {
    if (!userId) loginAsGuest();
    router.push("/createSession");
  };

  const handleJoinByCode = async () => {
    const code = sessionCode.trim();
    if (!code) return;
    setJoiningCode(true);
    try {
      const res  = await fetch(`${API_BASE}/session/validate/${code}`);
      const json = await res.json();
      if (json.success && json.sessionId) {
        setJoinModal(false);
        setSessionCode("");
        router.push({
          pathname: "/invite",
          params: { sessionId: json.sessionId, isGuest: "true" },
        });
      } else {
        alert("Session not found. Check the code and try again.");
      }
    } catch {
      alert("Couldn't connect. Please try again.");
    } finally {
      setJoiningCode(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.logo}>Veto</Text>
        {userId ? (
          <Pressable style={styles.accountBtn} onPress={() => router.push("/(tabs)")}>
            <Feather name="user" size={18} color="#1b1b1b" />
          </Pressable>
        ) : (
          <Pressable style={styles.signInPill} onPress={() => router.push("/login")}>
            <Text style={styles.signInText}>Sign in</Text>
          </Pressable>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Hero greeting ── */}
        <View style={styles.heroSection}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.heroText}>
            what are we{"\n"}eating tonight?
          </Text>
        </View>

        {/* ── Recent Groups ── */}
        {recentGroups.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionLabel}>RECENT GROUPS</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentList}
            >
              {recentGroups.map((g) => (
                <View key={g.sessionId} style={styles.recentCard}>
                  {g.imageURL ? (
                    <Image source={{ uri: g.imageURL }} style={styles.recentImage} />
                  ) : (
                    <View style={[styles.recentImage, styles.recentImagePlaceholder]}>
                      <Feather name="coffee" size={22} color="#ccc" />
                    </View>
                  )}
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName} numberOfLines={1}>
                      {g.matchedRestaurant ?? "Session"}
                    </Text>
                    <Text style={styles.recentDate}>{formatDate(g.createdAt)}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── CTAs ── */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaHeading}>Start something new</Text>

          <MyButton onClick={handleHostSession} style={styles.primaryBtn}>
            <Feather name="plus" size={17} color="white" />
            <Text style={styles.primaryBtnText}>Host a new session</Text>
          </MyButton>

          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed]}
            onPress={() => setJoinModal(true)}
          >
            <Text style={styles.secondaryBtnText}>Join a session</Text>
          </Pressable>

          {!userId && (
            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => router.push("/(register)")}
            >
              <Text style={styles.registerLinkText}>
                New here?{"  "}
                <Text style={styles.registerLinkUnderline}>Create an account →</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>

      {/* ── Join Session modal ── */}
      <Modal
        visible={joinModal}
        transparent
        animationType="slide"
        onRequestClose={() => setJoinModal(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setJoinModal(false)} />
          <View style={styles.joinSheet}>
            <View style={styles.sheetHandle} />

            <Text style={styles.joinTitle}>Join a Session</Text>
            <Text style={styles.joinSub}>
              Enter the code from the host's screen
            </Text>

            {/* Code input row */}
            <View style={styles.codeRow}>
              <TextInput
                style={styles.codeInput}
                placeholder="Session code"
                placeholderTextColor="#bbb"
                value={sessionCode}
                onChangeText={setSessionCode}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={36}
                onSubmitEditing={handleJoinByCode}
              />
              <Pressable
                style={[
                  styles.codeJoinBtn,
                  (!sessionCode.trim() || joiningCode) && styles.codeJoinBtnDisabled,
                ]}
                onPress={handleJoinByCode}
                disabled={!sessionCode.trim() || joiningCode}
              >
                {joiningCode ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Feather name="arrow-right" size={20} color="#fff" />
                )}
              </Pressable>
            </View>

            {/* Divider */}
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.orLine} />
            </View>

            {/* QR scan */}
            <Pressable
              style={styles.scanBtn}
              onPress={() => { setJoinModal(false); router.push("/scanQR"); }}
            >
              <Feather name="camera" size={18} color="#1b1b1b" />
              <Text style={styles.scanBtnText}>Scan QR Code</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 12,
  },
  logo: {
    fontFamily: "Newsreader_400Regular_Italic",
    fontSize: 32,
    color: "#1b1b1b",
  },
  accountBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  signInPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  signInText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#1b1b1b",
  },

  // ── Scroll ──
  scroll: { paddingBottom: 48 },

  // ── Hero ──
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  greeting: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#888",
    marginBottom: 6,
  },
  heroText: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 42,
    lineHeight: 48,
    color: "#1b1b1b",
    letterSpacing: -1,
  },

  // ── Recent Groups ──
  recentSection: { marginBottom: 32 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 2,
    color: "#999",
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  recentList: { paddingHorizontal: 24, gap: 12 },
  recentCard: {
    width: 140,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e8e6e1",
    overflow: "hidden",
  },
  recentImage: {
    width: "100%",
    height: 90,
    resizeMode: "cover",
  },
  recentImagePlaceholder: {
    backgroundColor: "#f0eeea",
    alignItems: "center",
    justifyContent: "center",
  },
  recentInfo: { padding: 10, gap: 3 },
  recentName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#1b1b1b",
  },
  recentDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#999",
  },

  // ── CTAs ──
  ctaSection: {
    paddingHorizontal: 24,
    gap: 12,
  },
  ctaHeading: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 22,
    color: "#1b1b1b",
    marginBottom: 4,
  },
  primaryBtn: { width: "100%", height: 56 },
  primaryBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  secondaryBtn: {
    width: "100%",
    height: 56,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "#1b1b1b",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  secondaryBtnPressed: { backgroundColor: "#f0f0f0" },
  secondaryBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#1b1b1b",
  },
  registerLink: { alignItems: "center", paddingTop: 8 },
  registerLinkText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#888",
  },
  registerLinkUnderline: {
    fontFamily: "Inter_600SemiBold",
    color: "#1b1b1b",
    textDecorationLine: "underline",
  },

  // ── Join Modal ──
  modalRoot: { flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  joinSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d0d0d0",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  joinTitle: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 28,
    color: "#1b1b1b",
    marginBottom: 6,
  },
  joinSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#888",
    marginBottom: 20,
  },
  codeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  codeInput: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    paddingHorizontal: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#1b1b1b",
    backgroundColor: "#fafafa",
  },
  codeJoinBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#1b1b1b",
    alignItems: "center",
    justifyContent: "center",
  },
  codeJoinBtnDisabled: { backgroundColor: "#ccc" },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  orLine: { flex: 1, height: 1, backgroundColor: "#e8e8e8" },
  orText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#bbb",
  },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    backgroundColor: "#fafafa",
  },
  scanBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#1b1b1b",
  },
});

export default LandingScreen;
