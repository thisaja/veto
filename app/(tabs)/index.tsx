import MyButton from "@/components/button";
import { useAuth } from "@/context/AuthContext";
import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import {
  Newsreader_400Regular_Italic,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  const router = useRouter();
  const { userId, loginAsGuest } = useAuth();

  const [recentGroups,  setRecentGroups]  = useState<RecentGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [codeModal,     setCodeModal]     = useState(false);
  const [sessionCode,   setSessionCode]   = useState("");
  const [joiningCode,   setJoiningCode]   = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_600SemiBold,
    Newsreader_400Regular_Italic,
  });

  const fetchHistory = useCallback(async () => {
    if (!userId) return;
    setLoadingGroups(true);
    try {
      const res  = await fetch(`${API_BASE}/session/history/${userId}`);
      const json = await res.json();
      if (json.success) setRecentGroups(json.data ?? []);
    } catch {}
    finally { setLoadingGroups(false); }
  }, [userId]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

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
        setCodeModal(false);
        setSessionCode("");
        router.push({ pathname: "/invite", params: { sessionId: json.sessionId, isGuest: "true" } });
      } else {
        alert("Session not found. Check the code and try again.");
      }
    } catch {
      alert("Couldn't connect. Please try again.");
    } finally {
      setJoiningCode(false);
    }
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

        {/* ── Wordmark + title ── */}
        <View style={styles.titleBlock}>
          <Text style={styles.wordmark}>Veto</Text>
          <Text style={styles.pageTitle}>Start a Session</Text>
        </View>

        {/* ══════════════════════════════════════
            JOIN AN EXISTING LOBBY
        ══════════════════════════════════════ */}
        <Text style={styles.sectionLabel}>JOIN AN EXISTING LOBBY</Text>
        <Text style={styles.sectionHeading}>Jump into a friend's room</Text>
        <Text style={styles.sectionSub}>
          Scan a host's QR code or enter their invite link to join an active session.
        </Text>

        {/* Scan QR row */}
        <TouchableOpacity
          style={styles.actionRow}
          activeOpacity={0.75}
          onPress={() => router.push("/scanQR")}
        >
          <View style={styles.actionIcon}>
            <Feather name="camera" size={19} color="#1b1b1b" />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionLabel}>Scan QR Code</Text>
            <Text style={styles.actionSub}>Point your camera at the host's code</Text>
          </View>
          <Feather name="chevron-right" size={16} color="#bbb" />
        </TouchableOpacity>

        {/* Enter code row */}
        <TouchableOpacity
          style={[styles.actionRow, { marginBottom: 0 }]}
          activeOpacity={0.75}
          onPress={() => setCodeModal(true)}
        >
          <View style={styles.actionIcon}>
            <Feather name="link" size={19} color="#1b1b1b" />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionLabel}>Enter Invite Code</Text>
            <Text style={styles.actionSub}>Type or paste a session code or link</Text>
          </View>
          <Feather name="chevron-right" size={16} color="#bbb" />
        </TouchableOpacity>

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ══════════════════════════════════════
            HOST A NEW LOBBY
        ══════════════════════════════════════ */}
        <Text style={styles.sectionLabel}>HOST A NEW LOBBY</Text>
        <Text style={styles.sectionHeading}>Start something new</Text>
        <Text style={styles.sectionSub}>
          Choose a location, set filters, and invite your group to start tasting.
        </Text>

        <MyButton onClick={handleHostSession} style={styles.createBtn}>
          <Feather name="plus" size={17} color="white" />
          <Text style={styles.createBtnText}>Create Session</Text>
        </MyButton>

        {/* ══════════════════════════════════════
            RECENT GROUPS
        ══════════════════════════════════════ */}
        {userId && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>RECENT GROUPS</Text>

            {loadingGroups ? (
              <ActivityIndicator size="small" color="#999" style={{ marginTop: 12 }} />
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
                        {g.memberCount} member{g.memberCount !== 1 ? "s" : ""}
                        {" · "}
                        {relativeTime(g.createdAt)}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color="#bbb" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

      </ScrollView>

      {/* ── Enter-code bottom sheet ── */}
      <Modal
        visible={codeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCodeModal(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setCodeModal(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Enter Invite Code</Text>
            <Text style={styles.sheetSub}>
              Paste the invite link or type the short code from the host's screen.
            </Text>
            <View style={styles.codeRow}>
              <TextInput
                style={styles.codeInput}
                placeholder="Code or invite link"
                placeholderTextColor="#bbb"
                value={sessionCode}
                onChangeText={setSessionCode}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleJoinByCode}
              />
              <Pressable
                style={[
                  styles.codeSubmitBtn,
                  (!sessionCode.trim() || joiningCode) && styles.codeSubmitBtnOff,
                ]}
                onPress={handleJoinByCode}
                disabled={!sessionCode.trim() || joiningCode}
              >
                {joiningCode
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Feather name="arrow-right" size={20} color="#fff" />}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingHorizontal: 24, paddingBottom: 48, paddingTop: 8 },

  // ── Title block ──
  titleBlock: { marginBottom: 32, gap: 2 },
  wordmark: {
    fontFamily: "Newsreader_400Regular_Italic",
    fontSize: 18,
    color: "#999",
  },
  pageTitle: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 38,
    lineHeight: 44,
    color: "#1b1b1b",
    letterSpacing: -0.5,
  },

  // ── Section labels ──
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 2,
    color: "#999",
    marginBottom: 6,
  },
  sectionHeading: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 24,
    color: "#1b1b1b",
    marginBottom: 4,
  },
  sectionSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#666",
    lineHeight: 19,
    marginBottom: 16,
  },

  // ── Action rows (same style as invite.tsx) ──
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e8e6e1",
    marginBottom: 8,
    gap: 14,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#f0eeea",
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { flex: 1, gap: 2 },
  actionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#1b1b1b",
  },
  actionSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#999",
  },

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: "#f0eeea",
    marginVertical: 28,
  },

  // ── Create session button ──
  createBtn: { width: "100%", height: 56 },
  createBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },

  // ── Recent groups ──
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#bbb",
    marginTop: 8,
  },
  groupList: {
    marginTop: 4,
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

  // ── Code sheet ──
  modalRoot: { flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: "#d0d0d0",
    alignSelf: "center", marginTop: 12, marginBottom: 20,
  },
  sheetTitle: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 26,
    color: "#1b1b1b",
    marginBottom: 6,
  },
  sheetSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#888",
    lineHeight: 19,
    marginBottom: 20,
  },
  codeRow: { flexDirection: "row", gap: 10 },
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
  codeSubmitBtn: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: "#1b1b1b", alignItems: "center", justifyContent: "center",
  },
  codeSubmitBtnOff: { backgroundColor: "#ccc" },
});
