import Avatar, { buildAvatarUrl } from "@/components/Avatar";
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
  Animated,
  Dimensions,
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
const APP_STORE_URL = "https://apps.apple.com/app/veto/id000000000";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type LobbyMember = { alias: string; isHost: boolean; hasAnswered: boolean };
type Friend = {
  friendshipId: string;
  userId: string;
  firstName: string;
  lastName: string;
  diningAlias: string;
  profilePicture: string | null;
};


const InviteScreen = () => {
  const router = useRouter();
  const { userId, guestId, diningAlias } = useAuth();
  const { sessionId: ctxSessionId } = useSession();

  const { sessionId: paramSessionId, isGuest: paramIsGuest } =
    useLocalSearchParams<{ sessionId?: string; isGuest?: string }>();

  const sessionId   = ctxSessionId ?? paramSessionId ?? null;
  const isGuestMode = paramIsGuest === "true";
  const shortCode   = sessionId?.split("-")[0].toUpperCase() ?? "";

  // ── Resolve the display alias before connecting the socket ──────────────
  // diningAlias may be null if auth state is stale — fall back to a profile fetch.
  const [resolvedAlias, setResolvedAlias] = useState<string | null>(
    diningAlias ?? (isGuestMode ? "Guest" : null)
  );

  useEffect(() => {
    if (resolvedAlias) return;             // already resolved
    if (isGuestMode) { setResolvedAlias("Guest"); return; }
    if (!userId)     { setResolvedAlias("Host");  return; }

    // Auth state missing diningAlias — fetch from profile as fallback
    fetch(`${API_BASE}/api/profile/${userId}`)
      .then(r => r.json())
      .then(json => {
        setResolvedAlias(
          json.success && json.data?.diningAlias
            ? json.data.diningAlias
            : "Host"
        );
      })
      .catch(() => setResolvedAlias("Host"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── State ─────────────────────────────────────────────────────────────────
  const [members,         setMembers]         = useState<LobbyMember[]>([]);
  const [status,          setStatus]          = useState<"waiting" | "in_questions" | "generating" | "done">("waiting");
  const [socketConnected, setSocketConnected] = useState(false);
  const [starting,        setStarting]        = useState(false);
  const [navigating,      setNavigating]      = useState(false);
  const [qrTimedOut,      setQrTimedOut]      = useState(false);
  // Host migration: tracks whether THIS device is the current host
  const [isCurrentHost,   setIsCurrentHost]   = useState(!isGuestMode);
  const [hostBanner,      setHostBanner]       = useState<string | null>(null);

  // Friends modal
  const [friends,        setFriends]        = useState<Friend[]>([]);
  const [friendsModal,   setFriendsModal]   = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Toast
  const [toastMsg,  setToastMsg]  = useState("");
  const toastAnim  = useRef(new Animated.Value(-56)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Guest pulse dot
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const socketRef = useRef<Socket | null>(null);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_600SemiBold,
  });

  const deepLink  = sessionId ? `veto://join/${sessionId}` : null;
  const shareText = sessionId
    ? `Join my Veto session and help pick where we eat!\n\n📱 Open in app: veto://join/${sessionId}\n\nDon't have Veto? Get it here:\n${APP_STORE_URL}`
    : "";

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastAnim.setValue(80);
    Animated.sequence([
      Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true, bounciness: 6 }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { toValue: 80, duration: 220, useNativeDriver: true }),
    ]).start();
    toastTimer.current = setTimeout(() => setToastMsg(""), 2500);
  };

  // ── Guest pulse animation ─────────────────────────────────────────────────
  useEffect(() => {
    if (isCurrentHost || !socketConnected) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isCurrentHost, socketConnected]);

  // ── QR timeout — if sessionId still null after 8s show retry ─────────────
  useEffect(() => {
    if (!isCurrentHost || sessionId) return;
    const t = setTimeout(() => setQrTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, [sessionId, isCurrentHost]);

  // ── Trigger Gemini question generation as soon as host has a sessionId ────
  // This matches the original flow: invite screen fires /api/gemini/question
  // (which runs Gemini against the session's places data and stores the questions
  // in the DB). The questionnaire then retrieves them via /api/gemini/getQA.
  useEffect(() => {
    if (!isCurrentHost || !sessionId) return;
    const url = `${API_BASE}/api/gemini/question?sessionId=${sessionId}`;
    console.log("[invite] triggering question generation →", url);
    fetch(url, { method: "GET", headers: { "Content-Type": "application/json" } })
      .then(r => r.json())
      .then(json => console.log("[invite] question generation response:", JSON.stringify(json)))
      .catch(err => console.error("[invite] question generation failed:", err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, isCurrentHost]);

  // ── REST seed ─────────────────────────────────────────────────────────────
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

  // ── Socket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || !resolvedAlias) return;   // wait until alias is ready
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
      setSocketConnected(true);
      socket.emit("join_lobby", {
        sessionId,
        alias:  resolvedAlias,
        isHost: !isGuestMode,
        userId:  userId  ?? undefined,
        guestId: guestId ?? undefined,
      });
      refreshMembers();
    });

    socket.on("disconnect", () => setSocketConnected(false));

    socket.on("lobby_update", (data: { members: LobbyMember[]; status: string }) => {
      setMembers(data.members);
      setStatus(data.status as any);
    });

    socket.on("questions_started", () => {
      setNavigating(true);
      router.replace({
        pathname: "/questionnaire",
        params: { sessionId: sessionId ?? "", isHost: isCurrentHost ? "true" : "false" },
      });
    });

    socket.on("host_disconnected", ({ timeoutSeconds }: { timeoutSeconds: number }) => {
      setHostBanner(`Host disconnected — finding a new host in ${timeoutSeconds}s…`);
    });

    socket.on("host_reconnected", ({ alias }: { alias: string }) => {
      setHostBanner(`${alias} (host) reconnected`);
      setTimeout(() => setHostBanner(null), 3000);
    });

    socket.on("host_migrated", ({ newHostAlias }: { newHostAlias: string }) => {
      setHostBanner(null);
      const myAlias = resolvedAlias ?? (isGuestMode ? "Guest" : "Host");
      if (newHostAlias === myAlias) {
        setIsCurrentHost(true);
        showToast("You are now the host!");
      } else {
        showToast(`${newHostAlias} is now the host`);
      }
    });

    socket.on("connect_error", () => {
      showToast("Can't reach the server. Check your connection.");
      setSocketConnected(false);
    });

    socket.on("disconnect", (reason) => {
      if (reason !== "io client disconnect") {
        setSocketConnected(false);
        showToast("Connection lost. Trying to reconnect…");
      }
    });

    return () => { socket.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, resolvedAlias]);

  // ── Friends ───────────────────────────────────────────────────────────────
  const fetchFriends = useCallback(async () => {
    if (!userId) return;
    setLoadingFriends(true);
    try {
      const res  = await fetch(`${API_BASE}/api/friends/${userId}`);
      const json = await res.json();
      if (json.success) setFriends(json.data);
      else showToast("Couldn't load friends list.");
    } catch {
      showToast("Couldn't load friends list. Check your connection.");
    } finally { setLoadingFriends(false); }
  }, [userId]);

  // ── Share helpers ─────────────────────────────────────────────────────────
  const handleCopyLink = async () => {
    if (!deepLink) return;
    await Clipboard.setStringAsync(deepLink);
    showToast("Invite link copied — paste it to your friends!");
  };

  const handleShare = async () => {
    if (!shareText) return;
    try {
      await Share.share({ message: shareText, title: "Join my Veto session" });
    } catch {}
  };

  const handleShareWithFriend = async (friend: Friend) => {
    if (sessionId && friend.userId) {
      try {
        await fetch(`${API_BASE}/session/invite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            hostAlias: resolvedAlias ?? "Host",
            friendUserId: friend.userId,
          }),
        });
        showToast(`Invite sent to ${friend.firstName}!`);
      } catch {
        showToast("Couldn't send invite. Check your connection.");
      }
    }
    setFriendsModal(false);
  };

  const handleStartQuestions = () => {
    if (!socketRef.current || !sessionId || !isCurrentHost) return;
    if (!socketConnected) {
      showToast("Not connected to server. Please wait or check your connection.");
      return;
    }
    setStarting(true);
    setNavigating(true);
    socketRef.current.emit("start_questions", { sessionId });
  };

  if (!fontsLoaded) return null;

  // ── Member list (shared between host + guest) ─────────────────────────────
  const MemberList = () => (
    <View style={styles.membersSection}>
      <Text style={styles.sectionLabel}>IN THE LOBBY ({members.length})</Text>
      {!socketConnected && members.length === 0 ? (
        <View style={styles.connectingRow}>
          <ActivityIndicator size="small" color="#bbb" />
          <Text style={styles.connectingText}>Connecting…</Text>
        </View>
      ) : members.length === 0 ? (
        <Text style={styles.membersEmpty}>No one here yet…</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.membersList}>
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
        </ScrollView>
      )}
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.screen}>

      {/* ── Toast pill ── */}
      {toastMsg !== "" && (
        <Animated.View style={[styles.toast, { transform: [{ translateY: toastAnim }] }]}>
          <Feather name="check-circle" size={16} color="#fff" />
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      )}

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.dismissAll()}>
          <Feather name="x" size={22} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isCurrentHost ? "INVITE" : "JOINING SESSION"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>

        {/* ── Host-disconnected banner ── */}
        {hostBanner && (
          <View style={styles.hostBanner}>
            <Feather name="wifi-off" size={14} color="#7a4800" />
            <Text style={styles.hostBannerText}>{hostBanner}</Text>
          </View>
        )}

        {/* ════════════════ HOST VIEW ════════════════ */}
        {isCurrentHost && (
          <>
            {/* QR code card */}
            <View style={styles.qrCard}>
              <View style={styles.qrWrapper}>
                {sessionId && deepLink ? (
                  <QRCode value={deepLink} size={150} color="#1b1b1b" backgroundColor="#fff" />
                ) : qrTimedOut ? (
                  <View style={styles.qrError}>
                    <Feather name="alert-circle" size={32} color="#e88" />
                    <Text style={styles.qrErrorText}>Couldn't load session.{"\n"}Go back and try again.</Text>
                  </View>
                ) : (
                  <View style={styles.qrLoading}>
                    <ActivityIndicator size="large" color="#ccc" />
                    <Text style={styles.qrLoadingText}>Creating session…</Text>
                  </View>
                )}
              </View>
              <Text style={styles.scanLabel}>SCAN TO JOIN</Text>
              {shortCode !== "" && (
                <Text style={styles.sessionCode}>{shortCode}</Text>
              )}
            </View>

            {/* Invite actions */}
            <View style={styles.actionsSection}>
              <Text style={styles.sectionLabel}>INVITE FRIENDS</Text>

              <TouchableOpacity
                style={styles.inviteRow}
                activeOpacity={0.75}
                onPress={() => { fetchFriends(); setFriendsModal(true); }}
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

              <TouchableOpacity
                style={[styles.inviteRow, !deepLink && styles.inviteRowDisabled]}
                activeOpacity={0.75}
                onPress={handleCopyLink}
                disabled={!deepLink}
              >
                <View style={styles.inviteRowIcon}>
                  <Feather name="link-2" size={18} color="#1b1b1b" />
                </View>
                <View style={styles.inviteRowText}>
                  <Text style={styles.inviteRowLabel}>Copy invite link</Text>
                  <Text style={styles.inviteRowSub}>Opens the app · App Store fallback included</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.inviteRow, !deepLink && styles.inviteRowDisabled]}
                activeOpacity={0.75}
                onPress={handleShare}
                disabled={!deepLink}
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

            <MemberList />
          </>
        )}

        {/* ════════════════ GUEST VIEW ════════════════ */}
        {!isCurrentHost && (
          <>
            {/* You're in card */}
            <View style={styles.guestCard}>
              <View style={styles.guestCardTop}>
                <Animated.View
                  style={[
                    styles.connectedDot,
                    socketConnected && { transform: [{ scale: pulseAnim }] },
                    !socketConnected && styles.connectedDotOff,
                  ]}
                />
                <Text style={styles.guestStatus}>
                  {socketConnected ? "You're in the lobby" : "Connecting…"}
                </Text>
              </View>

              {shortCode !== "" && (
                <View style={styles.guestCodeRow}>
                  <Text style={styles.guestCodeLabel}>SESSION</Text>
                  <Text style={styles.guestCodeValue}>{shortCode}</Text>
                </View>
              )}

              <Text style={styles.guestWaiting}>
                Waiting for the host to start the questionnaire.
                You'll be moved across automatically.
              </Text>
            </View>

            <MemberList />
          </>
        )}

      </View>

      {/* ── Host footer ── */}
      {isCurrentHost && (
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

      {/* ── Friends modal ── */}
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
              Tap a friend to share via messages. The link works even without the app installed.
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
                  Add friends on the Friends tab, then invite them here.
                </Text>
                {/* Copy fallback for zero-friends state */}
                {deepLink && (
                  <TouchableOpacity style={styles.copyFallback} onPress={() => { handleCopyLink(); setFriendsModal(false); }}>
                    <Feather name="link-2" size={14} color="#1b1b1b" />
                    <Text style={styles.copyFallbackText}>Copy invite link instead</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.friendsList} showsVerticalScrollIndicator={false}>
                {friends.map(friend => (
                  <TouchableOpacity
                    key={friend.friendshipId}
                    style={styles.friendRow}
                    activeOpacity={0.75}
                    onPress={() => { handleShareWithFriend(friend); setFriendsModal(false); }}
                  >
                    <Avatar
                      firstName={friend.firstName}
                      lastName={friend.lastName}
                      photoUrl={buildAvatarUrl(friend.profilePicture, API_BASE)}
                      colorSeed={friend.userId}
                      size={44}
                    />
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{friend.firstName} {friend.lastName}</Text>
                      <Text style={styles.friendAlias}>@{friend.diningAlias}</Text>
                    </View>
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

      {/* ── Loading mask — shown for all users when questions are starting ── */}
      {navigating && (
        <View style={styles.loadingMask}>
          <ActivityIndicator size="large" color="#1b1b1b" />
          <Text style={styles.loadingMaskText}>Starting…</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ── Loading mask ──
  loadingMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    zIndex: 999,
  },
  loadingMaskText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#888",
    letterSpacing: 0.5,
  },

  // ── Toast ──
  toast: {
    position: "absolute",
    bottom: 36,
    alignSelf: "center",
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1b1b1b",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  toastText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },

  // ── Host disconnected banner ──
  hostBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff3cd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ffe08a",
  },
  hostBannerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#7a4800",
    flex: 1,
  },

  // ── Header ──
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

  content: { flex: 1 },

  // ── QR card ──
  qrCard: {
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e8e6e1",
    paddingVertical: 16,
    marginBottom: 12,
  },
  qrWrapper: {
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0eeea",
    minHeight: 166,
    minWidth: 166,
    alignItems: "center",
    justifyContent: "center",
  },
  qrLoading: { alignItems: "center", gap: 12 },
  qrLoadingText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#bbb" },
  qrError: { alignItems: "center", gap: 10, padding: 8 },
  qrErrorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#888", textAlign: "center", lineHeight: 19 },
  scanLabel: { fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 2.5, color: "#999" },
  sessionCode: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: "#1b1b1b", letterSpacing: 4 },

  // ── Invite actions ──
  actionsSection: { marginBottom: 12 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 2, color: "#999", marginBottom: 8 },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e8e6e1",
    marginBottom: 6,
    gap: 12,
  },
  inviteRowDisabled: { opacity: 0.4 },
  inviteRowIcon: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: "#f0eeea", alignItems: "center", justifyContent: "center",
  },
  inviteRowText: { flex: 1, gap: 1 },
  inviteRowLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#1b1b1b" },
  inviteRowSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: "#999" },

  // ── Member list ──
  membersSection: { flex: 1, marginBottom: 8 },
  connectingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  connectingText: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#bbb" },
  membersEmpty: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#bbb" },
  membersList: { gap: 8 },
  memberRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: "#f0eeea", borderRadius: 12,
  },
  memberDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ccc" },
  memberDotHost: { backgroundColor: "#1b1b1b" },
  memberAlias: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#1b1b1b", flex: 1 },
  hostBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: "#1b1b1b" },
  hostBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 9, color: "#fff", letterSpacing: 1.5 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: "#e8e6e1" },
  statusBadgeDone: { backgroundColor: "#e8f0ea" },
  statusBadgeText: { fontFamily: "Inter_400Regular", fontSize: 11, color: "#888" },
  statusBadgeTextDone: { color: "#3a7a4a" },

  // ── Guest card ──
  guestCard: {
    backgroundColor: "#faf8fd",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e8e0f0",
    padding: 24,
    gap: 14,
    marginBottom: 20,
  },
  guestCardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  connectedDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: "#8B5A83",
  },
  connectedDotOff: { backgroundColor: "#ccc" },
  guestStatus: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 20,
    color: "#1b1b1b",
  },
  guestCodeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  guestCodeLabel: {
    fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 2, color: "#999",
  },
  guestCodeValue: {
    fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#1b1b1b", letterSpacing: 3,
  },
  guestWaiting: {
    fontFamily: "Inter_400Regular", fontSize: 13, color: "#888", lineHeight: 19,
  },

  // ── Footer ──
  footer: { paddingBottom: 8 },
  startBtn: { width: "100%", height: 56 },
  startBtnText: { color: "white", fontSize: 16, fontFamily: "Inter_600SemiBold" },

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
    width: 40, height: 4, borderRadius: 2, backgroundColor: "#d0d0d0",
    alignSelf: "center", marginTop: 10, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14,
  },
  sheetTitle: { fontFamily: "Newsreader_600SemiBold", fontSize: 26, color: "#1b1b1b" },
  sheetSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#888", lineHeight: 19, marginBottom: 16 },

  friendsLoading: { paddingVertical: 48, alignItems: "center" },
  friendsEmpty: { paddingVertical: 40, alignItems: "center", gap: 10 },
  friendsEmptyText: { fontFamily: "Newsreader_600SemiBold", fontSize: 20, color: "#1b1b1b" },
  friendsEmptySubText: {
    fontFamily: "Inter_400Regular", fontSize: 13, color: "#888", textAlign: "center", lineHeight: 19,
  },
  copyFallback: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 8, paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 12, borderWidth: 1, borderColor: "#e8e6e1",
  },
  copyFallbackText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#1b1b1b" },

  friendsList: { gap: 8 },
  friendRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: "#fff", borderRadius: 16,
    borderWidth: 1, borderColor: "#e8e6e1", gap: 12,
  },
  friendInfo: { flex: 1, gap: 2 },
  friendName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#1b1b1b" },
  friendAlias: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#888" },
  inviteChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#1b1b1b", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  inviteChipText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#fff" },
});

export default InviteScreen;
