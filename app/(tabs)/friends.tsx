import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import {
  Inter_400Regular,
  Inter_600SemiBold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  Newsreader_400Regular_Italic,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import Avatar, { buildAvatarUrl } from "@/components/Avatar";
import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { io } from "socket.io-client";

const API_BASE   = "http://10.0.0.129:5000";
const SERVER_URL = "http://10.0.0.129:5000";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const DIETARY_LABELS: Record<number, string> = {
  0: "Vegan", 1: "Vegetarian", 2: "Gluten-Free",
  3: "Halal", 4: "Nut Allergy", 5: "Kosher",
};

type Friend = {
  friendshipId: string;
  userId: string;
  firstName: string;
  lastName: string;
  diningAlias: string;
  profilePicture: string | null;
  dealbreakers: number[];
  friendsSince: string;
};

type FriendRequest = {
  friendshipId: string;
  userId: string;
  firstName: string;
  lastName: string;
  diningAlias: string;
  profilePicture: string | null;
  dealbreakers: number[];
  requestedAt: string;
};

type SentRequest = {
  friendshipId: string;
  userId: string;
  firstName: string;
  lastName: string;
  diningAlias: string;
  profilePicture: string | null;
  sentAt: string;
};

type SearchResult = {
  userId: string;
  firstName: string;
  lastName: string;
  diningAlias: string;
  profilePicture: string | null;
  dealbreakers: number[];
  friendshipStatus: string | null;
  friendshipId: string | null;
  requesterId: string | null;
};


export default function FriendsScreen() {
  const { userId, token, isGuest } = useAuth();
  const router = useRouter();

  const [friends, setFriends]           = useState<Friend[]>([]);
  const [requests, setRequests]         = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [loadingFriends, setLoadingFriends]   = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingSent, setLoadingSent]         = useState(true);
  const [cancellingId, setCancellingId]       = useState<string | null>(null);

  // Add-friend modal
  const [addVisible, setAddVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching]   = useState(false);
  const [sendingId, setSendingId]   = useState<string | null>(null);

  // Remove friend in-flight
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_600SemiBold,
    Newsreader_400Regular_Italic,
  });

  // ── Fetch friends ────────────────────────────────────────────────────────
  const fetchFriends = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/api/friends/${userId}`);
      const json = await res.json();
      if (json.success) setFriends(json.data);
    } catch (err) { console.error("fetchFriends:", err); }
    finally { setLoadingFriends(false); }
  }, [userId]);

  // ── Fetch requests ───────────────────────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/api/friends/${userId}/requests`);
      const json = await res.json();
      if (json.success) setRequests(json.data);
    } catch (err) { console.error("fetchRequests:", err); }
    finally { setLoadingRequests(false); }
  }, [userId]);

  // ── Fetch sent (outgoing pending) requests ───────────────────────────────
  const fetchSentRequests = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/api/friends/${userId}/sent`);
      const json = await res.json();
      if (json.success) setSentRequests(json.data);
    } catch (err) { console.error("fetchSentRequests:", err); }
    finally { setLoadingSent(false); }
  }, [userId]);

  useEffect(() => {
    fetchFriends();
    fetchRequests();
    fetchSentRequests();
  }, [fetchFriends, fetchRequests, fetchSentRequests]);

  // ── Real-time friend request notifications ───────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const socket = io(`${SERVER_URL}/notifications`, {
      transports: ["websocket"],
      forceNew: true,
    });
    socket.on("connect", () => {
      socket.emit("register", { userId });
    });
    socket.on("friend_request", () => {
      fetchRequests();
    });
    return () => { socket.disconnect(); };
  }, [userId, fetchRequests]);

  // ── Search users ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!addVisible) return;
    const stripped = searchQuery.trim().replace(/^@/, "");
    if (stripped.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/friends/search?q=${encodeURIComponent(searchQuery)}&userId=${userId}`
        );
        const json = await res.json();
        if (json.success) setSearchResults(json.data);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, addVisible, userId]);

  // ── Send friend request ──────────────────────────────────────────────────
  const sendRequest = async (addresseeId: string) => {
    if (!token) return;
    setSendingId(addresseeId);
    try {
      const res = await fetch(`${API_BASE}/api/friends/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ addresseeId }),
      });
      const json = await res.json();
      if (json.success) {
        setSearchResults(prev =>
          prev.map(u =>
            u.userId === addresseeId
              ? { ...u, friendshipStatus: "pending", requesterId: userId }
              : u
          )
        );
        fetchSentRequests();
      } else {
        Alert.alert("Could not send request", json.message);
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setSendingId(null);
    }
  };

  // ── Accept / decline request ─────────────────────────────────────────────
  const handleRequest = async (friendshipId: string, action: "accept" | "decline") => {
    if (!token) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/friends/request/${friendshipId}/${action}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const json = await res.json();
      if (json.success) {
        setRequests(prev => prev.filter(r => r.friendshipId !== friendshipId));
        if (action === "accept") fetchFriends(); // refresh friend list
      } else {
        Alert.alert("Error", json.message);
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    }
  };

  // ── Remove friend ────────────────────────────────────────────────────────
  const removeFriend = (friend: Friend) => {
    Alert.alert(
      "Remove friend",
      `Remove ${friend.firstName} ${friend.lastName} from your friends?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            if (!token) return;
            setRemovingId(friend.friendshipId);
            try {
              const res = await fetch(
                `${API_BASE}/api/friends/${friend.friendshipId}`,
                {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              const json = await res.json();
              if (json.success) {
                setFriends(prev => prev.filter(f => f.friendshipId !== friend.friendshipId));
              } else {
                Alert.alert("Error", json.message);
              }
            } catch {
              Alert.alert("Error", "Network error.");
            } finally {
              setRemovingId(null);
            }
          },
        },
      ]
    );
  };

  // ── Cancel outgoing request ──────────────────────────────────────────────
  const cancelRequest = async (req: SentRequest) => {
    if (!token) return;
    setCancellingId(req.friendshipId);
    try {
      const res = await fetch(`${API_BASE}/api/friends/request/${req.friendshipId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setSentRequests(prev => prev.filter(r => r.friendshipId !== req.friendshipId));
        setSearchResults(prev =>
          prev.map(u =>
            u.userId === req.userId
              ? { ...u, friendshipStatus: null, requesterId: null }
              : u
          )
        );
      } else {
        Alert.alert("Error", json.message);
      }
    } catch {
      Alert.alert("Error", "Network error.");
    } finally {
      setCancellingId(null);
    }
  };

  if (!fontsLoaded) return null;

  // ── Guest view ───────────────────────────────────────────────────────────
  if (isGuest) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.pageTitle}>Friends</Text>
          <View style={styles.guestCard}>
            <View style={styles.guestIconRing}>
              <Feather name="users" size={40} color="#888" />
            </View>
            <Text style={styles.guestTitle}>Friends are for members</Text>
            <Text style={styles.guestSub}>
              Create an account to add friends, send invites to sessions, and see who's dining with you.
            </Text>
            <TouchableOpacity
              style={styles.createAccountBtn}
              onPress={() => router.push("/(register)")}
              activeOpacity={0.85}
            >
              <Text style={styles.createAccountText}>CREATE ACCOUNT</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/login")} activeOpacity={0.7}>
              <Text style={styles.loginLink}>Already have an account? Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const loading = loadingFriends || loadingRequests || loadingSent;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Title row ── */}
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Friends</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => { setSearchQuery(""); setSearchResults([]); setAddVisible(true); }}
            activeOpacity={0.8}
          >
            <Feather name="user-plus" size={15} color="#fff" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#1b1b1b" />
          </View>
        ) : (
          <>
            {/* ── Pending requests ── */}
            {requests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  REQUESTS ({requests.length})
                </Text>
                {requests.map(req => (
                  <View key={req.friendshipId} style={styles.requestRow}>
                    <Avatar
                      firstName={req.firstName}
                      lastName={req.lastName}
                      photoUrl={buildAvatarUrl(req.profilePicture, API_BASE)}
                      colorSeed={req.userId}
                      size={48}
                    />
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>
                        {req.firstName} {req.lastName}
                      </Text>
                      <Text style={styles.friendAlias}>@{req.diningAlias}</Text>
                    </View>
                    <View style={styles.requestActions}>
                      <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => handleRequest(req.friendshipId, "accept")}
                        activeOpacity={0.8}
                      >
                        <Feather name="check" size={14} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.declineBtn}
                        onPress={() => handleRequest(req.friendshipId, "decline")}
                        activeOpacity={0.8}
                      >
                        <Feather name="x" size={14} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ── Sent / pending requests ── */}
            {sentRequests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  PENDING ({sentRequests.length})
                </Text>
                {sentRequests.map(req => (
                  <View key={req.friendshipId} style={styles.sentRow}>
                    <Avatar
                      firstName={req.firstName}
                      lastName={req.lastName}
                      photoUrl={buildAvatarUrl(req.profilePicture, API_BASE)}
                      colorSeed={req.userId}
                      size={48}
                    />
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>
                        {req.firstName} {req.lastName}
                      </Text>
                      <Text style={styles.friendAlias}>@{req.diningAlias}</Text>
                    </View>
                    <View style={styles.pendingChip}>
                      <Text style={styles.pendingChipText}>Awaiting</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => cancelRequest(req)}
                      disabled={cancellingId === req.friendshipId}
                      activeOpacity={0.7}
                    >
                      {cancellingId === req.friendshipId
                        ? <ActivityIndicator size="small" color="#ccc" />
                        : <Feather name="x" size={13} color="#999" />
                      }
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* ── Friends list ── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                MY FRIENDS ({friends.length})
              </Text>

              {friends.length === 0 ? (
                <View style={styles.emptyState}>
                  <Feather name="users" size={36} color="#e4e2dd" />
                  <Text style={styles.emptyTitle}>No friends yet</Text>
                  <Text style={styles.emptySub}>
                    Tap "Add" to find friends and invite them to sessions.
                  </Text>
                </View>
              ) : (
                friends.map(friend => (
                  <View
                    key={friend.friendshipId}
                    style={[styles.friendRow, removingId === friend.friendshipId && { opacity: 0.4 }]}
                  >
                    <Avatar
                      firstName={friend.firstName}
                      lastName={friend.lastName}
                      photoUrl={buildAvatarUrl(friend.profilePicture, API_BASE)}
                      colorSeed={friend.userId}
                      size={48}
                    />
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>
                        {friend.firstName} {friend.lastName}
                      </Text>
                      <Text style={styles.friendAlias}>@{friend.diningAlias}</Text>
                      {friend.dealbreakers.length > 0 && (
                        <View style={styles.dietaryRow}>
                          {friend.dealbreakers.map(d => (
                            <View key={d} style={styles.dietaryChip}>
                              <Text style={styles.dietaryChipText}>
                                {DIETARY_LABELS[d] ?? d}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.trashBtn}
                      onPress={() => removeFriend(friend)}
                      disabled={removingId === friend.friendshipId}
                      activeOpacity={0.7}
                    >
                      {removingId === friend.friendshipId
                        ? <ActivityIndicator size="small" color="#ccc" />
                        : <Feather name="trash-2" size={16} color="#ccc" />
                      }
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

          </>
        )}
      </ScrollView>

      {/* ── Add Friend Modal ── */}
      <Modal
        visible={addVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setAddVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Add Friend</Text>
              <TouchableOpacity onPress={() => setAddVisible(false)}>
                <Feather name="x" size={20} color="#1b1b1b" />
              </TouchableOpacity>
            </View>

            {/* Search input */}
            <View style={styles.searchBar}>
              <Feather name="search" size={16} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by username…"
                placeholderTextColor="#bbb"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                autoCapitalize="none"
                returnKeyType="search"
              />
              {searching && <ActivityIndicator size="small" color="#999" />}
              {!searching && searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Feather name="x" size={15} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.searchResults}
            >
              {searchQuery.trim().replace(/^@/, "").length >= 2 && searchResults.length === 0 && !searching && (
                <Text style={styles.noResults}>No users found for "{searchQuery}"</Text>
              )}

              {searchResults.map(user => {
                const alreadyFriends = user.friendshipStatus === "accepted";
                const pending        = user.friendshipStatus === "pending";
                const isSending      = sendingId === user.userId;

                return (
                  <View key={user.userId} style={styles.searchResultRow}>
                    <Avatar
                      firstName={user.firstName}
                      lastName={user.lastName}
                      photoUrl={buildAvatarUrl(user.profilePicture, API_BASE)}
                      colorSeed={user.userId}
                      size={36}
                    />

                    <Text style={styles.searchResultAlias}>@{user.diningAlias}</Text>

                    {alreadyFriends ? (
                      <View style={styles.statusChip}>
                        <Text style={styles.statusChipText}>Friends</Text>
                      </View>
                    ) : pending ? (
                      <View style={[styles.statusChip, styles.statusChipPending]}>
                        <Text style={[styles.statusChipText, { color: "#888" }]}>Sent</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.sendBtn, isSending && { opacity: 0.5 }]}
                        onPress={() => sendRequest(user.userId)}
                        disabled={isSending}
                        activeOpacity={0.8}
                      >
                        {isSending
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Feather name="user-plus" size={14} color="#fff" />
                        }
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 48 },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80 },

  // ── Guest card ──
  guestCard: {
    alignItems: "center",
    backgroundColor: "#f0eeea",
    borderRadius: 20,
    padding: 28,
    gap: 12,
  },
  guestIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#e4e2dd",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  guestTitle: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 22,
    color: "#1b1b1b",
    textAlign: "center",
  },
  guestSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  createAccountBtn: {
    backgroundColor: "#1b1b1b",
    borderRadius: 32,
    paddingHorizontal: 32,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    width: "100%",
  },
  createAccountText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    letterSpacing: 1.5,
    color: "#fff",
  },
  loginLink: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#888",
    textDecorationLine: "underline",
  },

  // ── Title ──
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  pageTitle: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 44,
    lineHeight: 50,
    color: "#1b1b1b",
    letterSpacing: -0.5,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1b1b1b",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 32,
    marginBottom: 6,
  },
  addButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#fff",
    letterSpacing: 0.3,
  },

  // ── Sections ──
  section: { marginBottom: 28 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 2,
    color: "#999",
    marginBottom: 12,
  },

  // ── Request row ──
  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f0eeea",
    borderRadius: 16,
    marginBottom: 10,
    gap: 12,
  },
  requestActions: { flexDirection: "row", gap: 8 },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1b1b1b",
    alignItems: "center",
    justifyContent: "center",
  },
  declineBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e8e6e1",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Friend row ──
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e8e6e1",
    marginBottom: 10,
    gap: 14,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: 48, height: 48, borderRadius: 24 },
  friendInitials: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
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
  dietaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  dietaryChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: "#f0eeea",
    borderWidth: 0.5,
    borderColor: "#d8d5cf",
  },
  dietaryChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#555",
    letterSpacing: 0.4,
  },

  // ── Empty state ──
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 10,
    backgroundColor: "#f0eeea",
    borderRadius: 20,
  },
  emptyTitle: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 22,
    color: "#1b1b1b",
  },
  emptySub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 20,
  },

  hint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#bbb",
    textAlign: "center",
    marginTop: -12,
    marginBottom: 8,
  },

  // ── Add Friend Modal ──
  modalRoot: { flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.88,
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
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  sheetTitle: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 28,
    color: "#1b1b1b",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f0eeea",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#1b1b1b",
    padding: 0,
  },
  searchResults: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 10,
  },
  noResults: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#bbb",
    textAlign: "center",
    paddingTop: 24,
  },
  searchResultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e8e6e1",
    gap: 12,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#e8f0ea",
  },
  statusChipPending: { backgroundColor: "#f0eeea" },
  statusChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#3a7a4a",
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1b1b1b",
    alignItems: "center",
    justifyContent: "center",
  },
  searchResultAlias: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#1b1b1b",
  },
  trashBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Sent / pending rows ──
  sentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e8e6e1",
    marginBottom: 10,
    gap: 12,
  },
  pendingChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#f0eeea",
    borderWidth: 0.5,
    borderColor: "#d8d5cf",
  },
  pendingChipText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#888",
    letterSpacing: 0.3,
  },
  cancelBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
});
