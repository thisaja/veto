import MyButton from "@/components/button";
import { globalStyles } from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import { useSession } from "@/context/SessionContext";
import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { io, Socket } from "socket.io-client";

const SERVER_URL = "http://10.0.0.129:5000";
const API_BASE   = "http://10.0.0.129:5000";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ── Update this once the app is live on the App Store ──────────────────────
const APP_STORE_URL = "https://apps.apple.com/app/veto/id000000000";
// ──────────────────────────────────────────────────────────────────────────

type LobbyMember = { alias: string; isHost: boolean; hasAnswered: boolean };
type Friend = {
  friendshipId: string;
  userId: string;
  firstName: string;
  lastName: string;
  diningAlias: string;
  profilePicture: string | null;
};

function avatarInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

const AVATAR_COLORS = ["#e4e2dd", "#ede8f0", "#e8f0ea", "#f0e8e8", "#e8ecf0"];
function avatarColor(id: string) {
  const sum = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

const InviteScreen = () => {
  const router = useRouter();
  const { userId, guestId, isGuest: authIsGuest } = useAuth();
  const { sessionId: ctxSessionId } = useSession();

  const { sessionId: paramSessionId, isGuest: paramIsGuest } =
    useLocalSearchParams<{ sessionId?: string; isGuest?: string }>();

  const sessionId  = ctxSessionId ?? paramSessionId ?? null;
  const isGuestMode = paramIsGuest === "true";

  const [members,  setMembers]  = useState<LobbyMember[]>([]);
  const [status,   setStatus]   = useState<"waiting" | "in_questions" | "generating" | "done">("waiting");
  const [copied,   setCopied]   = useState(false);
  const [starting, setStarting] = useState(false);

  // Friends invite
  const [friends,        setFriends]        = useState<Friend[]>([]);
  const [friendsModal,   setFriendsModal]   = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_600SemiBold,
  });

  // Deep link embedded in QR and share messages
  const deepLink   = sessionId ? `veto://join/${sessionId}` : "veto://join/pending";
  // Web fallback: if they don't have the app this URL goes to the App Store
  const shareLink  = sessionId
    ? `${APP_STORE_URL}?sessionId=${sessionId}`
    : APP_STORE_URL;

  // ── Fetch current members via REST (fallback / initial load) ─────────────
  const refreshMembers = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res  = await fetch(`${API_BASE}/session/${sessionId}/members`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMembers(json.data.map((m: any) => ({
          alias:       m.alias,
          isHost:      m.isHost,
          hasAnswered: m.hasAnswered ?? false,
        })));
      }
    } catch {}
  }, [sessionId]);

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;

    // Seed the member list immediately via REST so the UI isn't empty on load
    refreshMembers();

    const socket = io(`${SERVER_URL}/lobby`, {
      transports: ["websocket"],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_lobby", {
        sessionId,
        alias:   isGuestMode ? (authIsGuest ? "Guest" : "Member") : "Host",
        isHost:  !isGuestMode,
        userId:  userId  ?? undefined,
        guestId: guestId ?? undefined,
      });
      // Re-seed after reconnect so we never miss a join that happened offline
      refreshMembers();
    });

    socket.on("lobby_update", (data: { members: LobbyMember[]; status: string }) => {
      setMembers(data.members);
      setStatus(data.status as any);
    });

    socket.on("questions_started", () => {
      router.replace({ pathname: "/questionnaire", params: { sessionId: sessionId ?? "" } });
    });

    socket.on("connect_error", (err) => console.error("[invite] socket error:", err.message));
    return () => { socket.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ── Fetch friends list ────────────────────────────────────────────────────
  const fetchFriends = useCallback(async () => {
    if (!userId) return;
    setLoadingFriends(true);
    try {
      const res  = await fetch(`${API_BASE}/api/friends/${userId}`);
      const json = await res.json();
      if (json.success) setFriends(json.data);
    } catch (err) {
      console.error("fetchFriends:", err);
    } finally {
      setLoadingFriends(false);
    }
  }, [userId]);

  const openFriendsModal = () => {
    fetchFriends();
    setFriendsModal(true);
  };

  // ── Share helpers ─────────────────────────────────────────────────────────
  const buildShareMessage = (friendName?: string) => {
    const greeting = friendName ? `Hey ${friendName}, ` : "";
    return (
      `${greeting}join my Veto session and help pick where we eat!\n\n` +
      `📱 Open in app: ${deepLink}\n\n` +
      `Don't have Veto? Download it here:\n${APP_STORE_URL}`
    );
  };

  const handleShareWithFriend = async (friend: Friend) => {
    try {
      await Share.share({
        message: buildShareMessage(`${friend.firstName}`),
        title:   "Join my Veto session",
      });
    } catch {}
  };

  const handleCopyLink = async () => {
    if (!sessionId) return;
    await Clipboard.setStringAsync(deepLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!sessionId) return;
    try {
      await Share.share({
        message: buildShareMessage(),
        title:   "Join my Veto session",
      });
    } catch {}
  };

  const handleStartQuestions = () => {
    if (!socketRef.current || !sessionId) return;
    setStarting(true);
    socketRef.current.emit("start_questions", { sessionId });
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={globalStyles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.dismissAll()}>
          <Feather name="x" size={22} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isGuestMode ? "JOINING SESSION" : "INVITE"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── QR code card (host only) ── */}
        {!isGuestMode && (
          <View style={styles.qrCard}>
            <View style={styles.qrWrapper}>
              {sessionId ? (
                <QRCode value={deepLink} size={180} color="#1b1b1b" backgroundColor="#fff" />
              ) : (
                <ActivityIndicator size="large" color="#999" />
              )}
            </View>
            <Text style={styles.scanLabel}>SCAN TO JOIN</Text>
            {sessionId && (
              <Text style={styles.sessionCode}>
                {sessionId.split("-")[0].toUpperCase()}
              </Text>
            )}
          </View>
        )}

        {/* ── Guest pending banner ── */}
        {isGuestMode && (
          <View style={styles.pendingBanner}>
            <View style={styles.pendingIconBox}>
              <Feather name="clock" size={28} color="#8B5A83" />
            </View>
            <Text style={styles.pendingTitle}>Waiting for host</Text>
            <Text style={styles.pendingSub}>
              The host will start the questionnaire when everyone's here.
              You'll be taken there automatically.
            </Text>
          </View>
        )}

        {/* ── Share / invite actions (host only) ── */}
        {!isGuestMode && (
          <View style={styles.actionsSection}>
            <Text style={styles.sectionLabel}>INVITE FRIENDS</Text>

            {/* Add from friends list */}
            <TouchableOpacity
              style={styles.inviteRow}
              activeOpacity={0.75}
              onPress={openFriendsModal}
            >
              <View style={styles.inviteRowIcon}>
                <Feather name="users" size={18} color="#1b1b1b" />
              </View>
              <View style={styles.inviteRowText}>
                <Text style={styles.inviteRowLabel}>Invite from friends</Text>
                <Text style={styles.inviteRowSub}>Pick from your Veto friends list</Text>
              </View>
              <Feather name="chevron-right" size={16} color="#bbb" />
            </TouchableOpacity>

            {/* Copy link */}
            <TouchableOpacity
              style={styles.inviteRow}
              activeOpacity={0.75}
              onPress={handleCopyLink}
            >
              <View style={styles.inviteRowIcon}>
                <Feather name={copied ? "check" : "link-2"} size={18} color={copied ? "#3a7a4a" : "#1b1b1b"} />
              </View>
              <View style={styles.inviteRowText}>
                <Text style={[styles.inviteRowLabel, copied && { color: "#3a7a4a" }]}>
                  {copied ? "Link copied!" : "Copy invite link"}
                </Text>
                <Text style={styles.inviteRowSub}>
                  Opens the app · includes App Store link if not installed
                </Text>
              </View>
            </TouchableOpacity>

            {/* Share sheet */}
            <TouchableOpacity
              style={styles.inviteRow}
              activeOpacity={0.75}
              onPress={handleShare}
            >
              <View style={styles.inviteRowIcon}>
                <Feather name="share-2" size={18} color="#1b1b1b" />
              </View>
              <View style={styles.inviteRowText}>
                <Text style={styles.inviteRowLabel}>Share via messages / other</Text>
                <Text style={styles.inviteRowSub}>Opens your native share sheet</Text>
              </View>
              <Feather name="chevron-right" size={16} color="#bbb" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Live member list ── */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionLabel}>
            IN THE LOBBY ({members.length})
          </Text>
          {members.length === 0 ? (
            <Text style={styles.membersEmpty}>Connecting…</Text>
          ) : (
            <View style={styles.membersList}>
              {members.map((m, i) => (
                <View key={i} style={styles.memberRow}>
                  <View style={[styles.memberDot, m.isHost && styles.memberDotHost]} />
                  <Text style={styles.memberAlias}>{m.alias}</Text>
                  {m.isHost && (
                    <View style={styles.hostBadge}>
                      <Text style={styles.hostBadgeText}>HOST</Text>
                    </View>
                  )}
                  {status === "in_questions" && (
                    <View style={[styles.statusBadge, m.hasAnswered && styles.statusBadgeDone]}>
                      <Text style={[styles.statusBadgeText, m.hasAnswered && styles.statusBadgeTextDone]}>
                        {m.hasAnswered ? "Done" : "Answering…"}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      {/* ── Guest hint ── */}
      {isGuestMode && (
        <View style={styles.guestHint}>
          <Feather name="wifi" size={14} color="#8B5A83" />
          <Text style={styles.guestHintText}>
            Connected · questionnaire opens automatically when host starts
          </Text>
        </View>
      )}

      {/* ── Host CTA ── */}
      {!isGuestMode && (
        <View style={styles.footer}>
          <MyButton
            onClick={handleStartQuestions}
            style={[styles.startBtn, starting && { opacity: 0.5 }]}
            disabled={starting}
          >
            {starting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.startBtnText}>Start Questions</Text>
                <Feather name="arrow-right" size={16} color="white" />
              </>
            )}
          </MyButton>
        </View>
      )}

      {/* ── Friends picker modal ── */}
      <Modal
        visible={friendsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setFriendsModal(false)}
      >
        <View style={styles.modalRoot}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setFriendsModal(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Invite a Friend</Text>
              <TouchableOpacity onPress={() => setFriendsModal(false)}>
                <Feather name="x" size={20} color="#1b1b1b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetSub}>
              Tap a friend to open your share sheet — the link works even if
              they don't have Veto installed yet.
            </Text>

            {loadingFriends ? (
              <View style={styles.friendsLoading}>
                <ActivityIndicator size="large" color="#1b1b1b" />
              </View>
            ) : friends.length === 0 ? (
              <View style={styles.friendsEmpty}>
                <Feather name="users" size={36} color="#e4e2dd" />
                <Text style={styles.friendsEmptyText}>No friends yet</Text>
                <Text style={styles.friendsEmptySubText}>
                  Add friends on the Friends tab, then invite them to sessions.
                </Text>
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={styles.friendsList}
                showsVerticalScrollIndicator={false}
              >
                {friends.map(friend => (
                  <TouchableOpacity
                    key={friend.friendshipId}
                    style={styles.friendRow}
                    activeOpacity={0.75}
                    onPress={() => { handleShareWithFriend(friend); setFriendsModal(false); }}
                  >
                    {/* Avatar */}
                    <View style={[styles.friendAvatar, { backgroundColor: avatarColor(friend.userId) }]}>
                      {friend.profilePicture ? (
                        <Image
                          source={{ uri: `${API_BASE}/uploads/${friend.profilePicture}` }}
                          style={styles.friendAvatarImg}
                        />
                      ) : (
                        <Text style={styles.friendInitials}>
                          {avatarInitials(friend.firstName, friend.lastName)}
                        </Text>
                      )}
                    </View>

                    {/* Info */}
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>
                        {friend.firstName} {friend.lastName}
                      </Text>
                      <Text style={styles.friendAlias}>@{friend.diningAlias}</Text>
                    </View>

                    {/* CTA */}
                    <View style={styles.inviteChip}>
                      <Feather name="send" size={13} color="#fff" />
                      <Text style={styles.inviteChipText}>Invite</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 52,
    marginBottom: 8,
  },
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    letterSpacing: 2,
    color: "#4C4546",
  },

  scroll: { paddingBottom: 16 },

  // ── QR card ──
  qrCard: {
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e8e6e1",
    paddingVertical: 24,
    marginBottom: 16,
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0eeea",
  },
  scanLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 2.5,
    color: "#999",
  },
  sessionCode: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: "#1b1b1b",
    letterSpacing: 4,
  },

  // ── Guest pending banner ──
  pendingBanner: {
    alignItems: "center",
    backgroundColor: "#faf8fd",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e8e0f0",
    padding: 28,
    gap: 10,
    marginBottom: 16,
  },
  pendingIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f0e8f8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  pendingTitle: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 22,
    color: "#1b1b1b",
  },
  pendingSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    lineHeight: 19,
  },

  // ── Sections ──
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 2,
    color: "#999",
    marginBottom: 10,
  },

  // ── Invite actions ──
  actionsSection: { marginBottom: 20 },
  inviteRow: {
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
  inviteRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f0eeea",
    alignItems: "center",
    justifyContent: "center",
  },
  inviteRowText: { flex: 1, gap: 2 },
  inviteRowLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#1b1b1b",
  },
  inviteRowSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#999",
  },

  // ── Member list ──
  membersSection: { marginBottom: 16 },
  membersEmpty: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#bbb" },
  membersList: { gap: 8 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#f0eeea",
    borderRadius: 12,
  },
  memberDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ccc" },
  memberDotHost: { backgroundColor: "#1b1b1b" },
  memberAlias: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#1b1b1b",
    flex: 1,
  },
  hostBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: "#1b1b1b",
  },
  hostBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: "#fff",
    letterSpacing: 1.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: "#e8e6e1",
  },
  statusBadgeDone: { backgroundColor: "#e8f0ea" },
  statusBadgeText: { fontFamily: "Inter_400Regular", fontSize: 11, color: "#888" },
  statusBadgeTextDone: { color: "#3a7a4a" },

  // ── Footer ──
  footer: { paddingBottom: 8 },
  startBtn: { width: "100%", height: 56 },
  startBtnText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },

  // ── Guest hint ──
  guestHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#faf8fd",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e8e0f0",
    marginBottom: 8,
  },
  guestHintText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#8B5A83",
    flex: 1,
    lineHeight: 18,
  },

  // ── Friends modal ──
  modalRoot: { flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.75,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d0d0d0",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  sheetTitle: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 26,
    color: "#1b1b1b",
  },
  sheetSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#888",
    lineHeight: 19,
    marginBottom: 16,
  },

  friendsLoading: { paddingVertical: 48, alignItems: "center" },
  friendsEmpty:   { paddingVertical: 40, alignItems: "center", gap: 10 },
  friendsEmptyText: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 20,
    color: "#1b1b1b",
  },
  friendsEmptySubText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    lineHeight: 19,
  },

  friendsList: { gap: 8 },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e8e6e1",
    gap: 12,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  friendAvatarImg: { width: 44, height: 44, borderRadius: 22 },
  friendInitials: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#1b1b1b",
  },
  friendInfo: { flex: 1, gap: 2 },
  friendName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#1b1b1b",
  },
  friendAlias: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#888",
  },
  inviteChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#1b1b1b",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  inviteChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#fff",
  },
});

export default InviteScreen;
