import { useAuth } from "@/context/AuthContext";
import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import {
  Newsreader_400Regular,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import { Feather, MaterialIcons } from "@expo/vector-icons";
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

  const [recentGroups, setRecentGroups] = useState<RecentGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Join-by-code modal
  const [codeModal,    setCodeModal]    = useState(false);
  const [sessionCode,  setSessionCode]  = useState("");
  const [joiningCode,  setJoiningCode]  = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_400Regular,
    Newsreader_600SemiBold,
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
        {/* ── Page title ── */}
        <Text style={styles.pageTitle}>{"Start a\nSession"}</Text>

        {/* ── Join a Lobby card ── */}
        <View style={styles.joinCard}>
          <View style={styles.qrIconBox}>
            <MaterialIcons name="qr-code-2" size={36} color="#c25a2a" />
          </View>
          <Text style={styles.joinCardTitle}>Join a Lobby</Text>
          <Text style={styles.joinCardSub}>
            Scan a friend's code or enter a deep link to enter an active curation room.
          </Text>

          <TouchableOpacity
            style={styles.scanQrBtn}
            activeOpacity={0.8}
            onPress={() => router.push("/scanQR")}
          >
            <Feather name="camera" size={15} color="#1b1b1b" />
            <Text style={styles.scanQrText}>SCAN QR CODE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setCodeModal(true)}
            style={styles.enterCodeLink}
          >
            <Text style={styles.enterCodeText}>Enter a code instead →</Text>
          </TouchableOpacity>
        </View>

        {/* ── Host a New Lobby ── */}
        <View style={styles.hostSection}>
          <Text style={styles.hostTitle}>Host a New Lobby</Text>
          <Text style={styles.hostSub}>
            Create a fresh session, set your filters, and invite the group to start tasting.
          </Text>
          <TouchableOpacity
            style={styles.createBtn}
            activeOpacity={0.85}
            onPress={handleHostSession}
          >
            <Text style={styles.createBtnText}>CREATE SESSION</Text>
          </TouchableOpacity>
        </View>

        {/* ── Recent Groups ── */}
        {userId && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionLabel}>RECENT GROUPS</Text>

            {loadingGroups ? (
              <ActivityIndicator size="small" color="#999" style={{ marginTop: 16 }} />
            ) : recentGroups.length === 0 ? (
              <Text style={styles.emptyText}>No past sessions yet.</Text>
            ) : (
              <View style={styles.groupList}>
                {recentGroups.map((g, i) => (
                  <TouchableOpacity
                    key={g.sessionId}
                    style={[
                      styles.groupRow,
                      i < recentGroups.length - 1 && styles.groupRowBorder,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleGroupPress(g)}
                    disabled={!g.matchedRestaurant}
                  >
                    {/* Avatar */}
                    {g.imageURL ? (
                      <Image source={{ uri: g.imageURL }} style={styles.groupAvatar} />
                    ) : (
                      <View style={styles.groupAvatarPlaceholder}>
                        <Feather name="coffee" size={18} color="#bbb" />
                      </View>
                    )}

                    {/* Info */}
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName} numberOfLines={1}>
                        {g.matchedRestaurant ?? "Session"}
                      </Text>
                      <Text style={styles.groupMeta}>
                        {g.memberCount} member{g.memberCount !== 1 ? "s" : ""} · {relativeTime(g.createdAt)}
                      </Text>
                    </View>

                    <Feather name="chevron-right" size={18} color="#bbb" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Enter-code modal ── */}
      <Modal
        visible={codeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCodeModal(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setCodeModal(false)} />
          <View style={styles.codeSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.codeSheetTitle}>Enter Session Code</Text>
            <Text style={styles.codeSheetSub}>
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
                style={[styles.codeJoinBtn, (!sessionCode.trim() || joiningCode) && styles.codeJoinBtnOff]}
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
  screen: { flex: 1, backgroundColor: "#f9f9f9" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },

  // ── Page title ──
  pageTitle: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 44,
    lineHeight: 50,
    color: "#1b1b1b",
    letterSpacing: -1,
    marginBottom: 24,
  },

  // ── Join card ──
  joinCard: {
    backgroundColor: "#edeae4",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  qrIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  joinCardTitle: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 22,
    color: "#1b1b1b",
    marginBottom: 6,
  },
  joinCardSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  scanQrBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 14,
  },
  scanQrText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 1.5,
    color: "#1b1b1b",
  },
  enterCodeLink: { paddingVertical: 4 },
  enterCodeText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#888",
  },

  // ── Host section ──
  hostSection: { marginBottom: 32 },
  hostTitle: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 26,
    color: "#1b1b1b",
    marginBottom: 6,
  },
  hostSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#666",
    lineHeight: 19,
    marginBottom: 16,
  },
  createBtn: {
    backgroundColor: "#1b1b1b",
    borderRadius: 999,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  createBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    letterSpacing: 1.5,
    color: "#fff",
  },

  // ── Recent groups ──
  recentSection: { gap: 4 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 2,
    color: "#999",
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#bbb",
    marginTop: 8,
  },
  groupList: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e8e6e1",
    overflow: "hidden",
  },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  groupRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0eeea",
  },
  groupAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0eeea",
  },
  groupAvatarPlaceholder: {
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

  // ── Code modal ──
  modalRoot: { flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  codeSheet: {
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
  codeSheetTitle: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 26,
    color: "#1b1b1b",
    marginBottom: 6,
  },
  codeSheetSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#888",
    marginBottom: 20,
    lineHeight: 19,
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
  codeJoinBtn: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: "#1b1b1b", alignItems: "center", justifyContent: "center",
  },
  codeJoinBtnOff: { backgroundColor: "#ccc" },
});
