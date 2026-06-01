import { useAuth } from "@/context/AuthContext";
import { useSession } from "@/context/SessionContext";
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
import AvatarPicker from "@/components/AvatarPicker";
import { parsePresetKey, presetKey } from "@/components/PresetAvatars";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE = "http://10.0.0.129:5000";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const DIETARY_OPTIONS = [
  { idx: 0, label: "Vegan" },
  { idx: 1, label: "Vegetarian" },
  { idx: 2, label: "Gluten-Free" },
  { idx: 3, label: "Halal" },
  { idx: 4, label: "Nut Allergy" },
  { idx: 5, label: "Kosher" },
];

const ACCOUNT_ROWS = [
  { icon: "edit-2",    label: "Edit Profile",     action: "edit" },
  { icon: "shield",    label: "Privacy Policy",   action: "privacy" },
  { icon: "file-text", label: "Terms of Service", action: "terms" },
];

type Profile = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  diningAlias: string;
  profilePicture: string | null;
  dealbreakers: number[];
};

export default function ProfileScreen() {
  const router = useRouter();
  const { userId, token, isGuest, clearAuth } = useAuth();
  const { clearSession } = useSession();

  const [profile, setProfile]       = useState<Profile | null>(null);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [saving, setSaving]         = useState(false);

  // Edit form state
  const [editFirstName,  setEditFirstName]  = useState("");
  const [editLastName,   setEditLastName]   = useState("");
  const [editAlias,      setEditAlias]      = useState("");
  const [editDietary,    setEditDietary]    = useState<number[]>([]);
  const [editPhotoUri,   setEditPhotoUri]   = useState<string | null>(null);
  const [editPhotoMime,  setEditPhotoMime]  = useState<string>("image/jpeg");
  const [editPreset,     setEditPreset]     = useState<number | null>(null);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_600SemiBold,
    Newsreader_400Regular_Italic,
  });

  // ── Fetch profile ────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setFetchError(false);
    try {
      const res = await fetch(`${API_BASE}/api/profile/${userId}`);
      const json = await res.json();
      if (json.success) setProfile(json.data);
      else setFetchError(true);
    } catch (err) {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Open edit modal, pre-fill form ──────────────────────────────────────
  const openEdit = () => {
    if (!profile) return;
    setEditFirstName(profile.firstName);
    setEditLastName(profile.lastName);
    setEditAlias(profile.diningAlias);
    setEditDietary([...profile.dealbreakers]);
    setEditPhotoUri(null);
    setEditPreset(parsePresetKey(profile.profilePicture));
    setEditVisible(true);
  };

  // ── Pick photo from library ──────────────────────────────────────────────
  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setEditPhotoUri(result.assets[0].uri);
      setEditPhotoMime(result.assets[0].mimeType ?? "image/jpeg");
      setEditPreset(null);
    }
  };

  // ── Toggle dietary chip ──────────────────────────────────────────────────
  const toggleDietary = (idx: number) => {
    setEditDietary(prev =>
      prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
    );
  };

  // ── Save profile changes ─────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!userId || !token) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("firstName",  editFirstName);
      formData.append("lastName",   editLastName);
      formData.append("diningAlias", editAlias);
      formData.append("dealbreakers", JSON.stringify(editDietary));

      if (editPhotoUri) {
        const ext = editPhotoMime.split("/")[1] ?? "jpeg";
        formData.append("photo", {
          uri: editPhotoUri,
          type: editPhotoMime,
          name: `profile.${ext}`,
        } as any);
      } else if (editPreset !== null) {
        formData.append("presetAvatar", presetKey(editPreset));
      }

      const res = await fetch(`${API_BASE}/api/profile/${userId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setProfile(json.data);
        setEditVisible(false);
      } else {
        Alert.alert("Error", json.message ?? "Failed to save changes.");
      }
    } catch (err) {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Log out ──────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => {
          clearSession();
          clearAuth();
          router.dismissAll();
          router.replace("/");
        },
      },
    ]);
  };

  // ── Delete account ───────────────────────────────────────────────────────
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete account",
      "This permanently deletes your account and all data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!userId || !token) return;
            try {
              const res  = await fetch(`${API_BASE}/api/profile/${userId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              const json = await res.json();
              if (!json.success) {
                Alert.alert("Error", json.message ?? "Could not delete account. Try again.");
                return;
              }
              clearSession();
              clearAuth();
              router.dismissAll();
              router.replace("/");
            } catch {
              Alert.alert("Error", "Could not delete account. Try again.");
            }
          },
        },
      ]
    );
  };

  const handleRowAction = (action: string) => {
    if (action === "edit")    openEdit();
    if (action === "privacy") router.push("/privacy");
    if (action === "terms")   router.push("/terms");
  };

  if (!fontsLoaded) return null;

  // ── Guest view ───────────────────────────────────────────────────────────
  if (isGuest) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.pageTitle}>Profile</Text>
          <View style={styles.guestCard}>
            <View style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                <Feather name="user" size={40} color="#888" />
              </View>
            </View>
            <Text style={styles.guestTitle}>You're browsing as a guest</Text>
            <Text style={styles.guestSub}>
              Create an account to save your sessions, connect with friends,
              and keep your dining preferences.
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

  // ── Loading / error ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1b1b1b" />
        </View>
      </SafeAreaView>
    );
  }

  if (fetchError || (!profile && !isGuest)) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingContainer}>
          <Feather name="wifi-off" size={40} color="#ba1a1a" style={{ marginBottom: 16 }} />
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#1b1b1b", marginBottom: 8 }}>
            Couldn't load profile
          </Text>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: "#666", textAlign: "center", marginBottom: 24, lineHeight: 20 }}>
            Check your connection and try again.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: "#1b1b1b", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 }}
            onPress={fetchProfile}
          >
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const photoUrl = buildAvatarUrl(profile?.profilePicture, API_BASE);

  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : "—";

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Profile</Text>

        {/* ── Identity card ── */}
        <View style={styles.identityCard}>
          <TouchableOpacity onPress={openEdit} activeOpacity={0.8}>
            <View style={styles.avatarRing}>
              <Avatar
                firstName={profile?.firstName}
                lastName={profile?.lastName}
                photoUrl={photoUrl}
                colorSeed={profile?.userId}
                size={76}
              />
              <View style={styles.avatarEditBadge}>
                <Feather name="camera" size={11} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.identityText}>
            <Text style={styles.displayName}>{displayName}</Text>
            <Text style={styles.alias}>@{profile?.diningAlias ?? "—"}</Text>
            <Text style={styles.email}>{profile?.email ?? ""}</Text>
          </View>
        </View>

        {/* ── Dietary preferences ── */}
        {(profile?.dealbreakers?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DIETARY PREFERENCES</Text>
            <View style={styles.chipsRow}>
              {(profile!.dealbreakers).map(idx => (
                <View key={idx} style={styles.chip}>
                  <Text style={styles.chipText}>
                    {DIETARY_OPTIONS.find(d => d.idx === idx)?.label ?? idx}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Account settings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.menuCard}>
            {ACCOUNT_ROWS.map((row, i) => (
              <TouchableOpacity
                key={row.label}
                style={[styles.menuRow, i < ACCOUNT_ROWS.length - 1 && styles.menuRowBorder]}
                activeOpacity={0.7}
                onPress={() => handleRowAction(row.action)}
              >
                <View style={styles.menuRowLeft}>
                  <View style={styles.menuIconBox}>
                    <Feather name={row.icon as any} size={16} color="#1b1b1b" />
                  </View>
                  <Text style={styles.menuRowLabel}>{row.label}</Text>
                </View>
                <Feather name="chevron-right" size={16} color="#bbb" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Log out ── */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.75}>
            <Feather name="log-out" size={16} color="#1b1b1b" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* ── Danger zone ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DANGER ZONE</Text>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount} activeOpacity={0.75}>
            <Feather name="trash-2" size={15} color="#ba1a1a" />
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Veto · v1.0.0</Text>
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={styles.modalRoot}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setEditVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
              <Text style={styles.sheetTitle}>Edit Profile</Text>

              {/* Avatar picker */}
              <Text style={styles.fieldLabel}>CHOOSE AVATAR</Text>
              <AvatarPicker
                selected={editPreset}
                onSelect={i => { setEditPreset(i); setEditPhotoUri(null); }}
              />

              {/* Upload own photo */}
              <TouchableOpacity style={styles.photoRow} onPress={pickPhoto} activeOpacity={0.8}>
                <View style={styles.editAvatarRing}>
                  <Avatar
                    firstName={profile?.firstName}
                    lastName={profile?.lastName}
                    photoUrl={editPhotoUri ?? (editPreset !== null ? presetKey(editPreset) : photoUrl)}
                    colorSeed={profile?.userId}
                    size={56}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.photoRowLabel}>
                    {editPhotoUri ? "Photo selected ✓" : "Or upload your own photo"}
                  </Text>
                  <Text style={styles.photoRowSub}>Tap to pick from library</Text>
                </View>
                <Feather name="chevron-right" size={16} color="#bbb" />
              </TouchableOpacity>

              <View style={styles.formDivider} />

              {/* Name fields */}
              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>FIRST NAME</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={editFirstName}
                    onChangeText={setEditFirstName}
                    placeholder="Jane"
                    placeholderTextColor="#bbb"
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>LAST NAME</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={editLastName}
                    onChangeText={setEditLastName}
                    placeholder="Doe"
                    placeholderTextColor="#bbb"
                  />
                </View>
              </View>

              {/* Alias */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>DINING ALIAS</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editAlias}
                  onChangeText={setEditAlias}
                  placeholder="SpicyTaco"
                  placeholderTextColor="#bbb"
                  autoCapitalize="none"
                />
              </View>

              {/* Dietary preferences */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>DIETARY PREFERENCES</Text>
                <View style={styles.chipsRow}>
                  {DIETARY_OPTIONS.map(opt => {
                    const active = editDietary.includes(opt.idx);
                    return (
                      <TouchableOpacity
                        key={opt.idx}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => toggleDietary(opt.idx)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Save button */}
              <TouchableOpacity
                style={[styles.saveButton, saving && { opacity: 0.5 }]}
                onPress={saveProfile}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 48 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  pageTitle: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 44,
    lineHeight: 50,
    color: "#1b1b1b",
    marginBottom: 28,
    letterSpacing: -0.5,
  },

  // ── Identity card ──
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    backgroundColor: "#f0eeea",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#e4e2dd",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#e8e6e1",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#1b1b1b",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#f0eeea",
  },
  identityText: { flex: 1, gap: 3 },
  displayName: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 22,
    color: "#1b1b1b",
    lineHeight: 28,
  },
  alias: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#888" },
  email: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#bbb" },

  // ── Guest card ──
  guestCard: {
    alignItems: "center",
    backgroundColor: "#f0eeea",
    borderRadius: 20,
    padding: 28,
    gap: 12,
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

  // ── Sections ──
  section: { marginBottom: 24 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 2,
    color: "#999",
    marginBottom: 12,
  },

  // ── Dietary chips ──
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#f0eeea",
    borderWidth: 0.5,
    borderColor: "#d8d5cf",
  },
  chipActive: {
    backgroundColor: "#1b1b1b",
    borderColor: "#1b1b1b",
  },
  chipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#1b1b1b",
    letterSpacing: 0.4,
  },
  chipTextActive: { color: "#fff" },

  // ── Menu rows ──
  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e8e6e1",
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f0eeea" },
  menuRowLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#f0eeea",
    alignItems: "center",
    justifyContent: "center",
  },
  menuRowLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#1b1b1b",
  },

  // ── Buttons ──
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "#1b1b1b",
    backgroundColor: "#fff",
  },
  logoutText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#1b1b1b",
    letterSpacing: 0.5,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "#ffd6d6",
    backgroundColor: "#fff4f4",
  },
  deleteText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#ba1a1a",
    letterSpacing: 0.5,
  },

  version: {
    fontFamily: "Newsreader_400Regular_Italic",
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
    marginTop: 8,
  },

  // ── Edit Modal ──
  modalRoot: { flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.92,
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
  sheetScroll: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
  sheetTitle: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 30,
    color: "#1b1b1b",
    marginBottom: 20,
  },

  // Photo row
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#f0eeea",
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  editAvatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#e8e6e1",
    alignItems: "center",
    justifyContent: "center",
  },
  editAvatarImage: { width: 56, height: 56, borderRadius: 28 },
  photoRowLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#1b1b1b",
  },
  photoRowSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },

  formDivider: { height: 1, backgroundColor: "#f0eeea", marginVertical: 16 },

  // Form fields
  fieldRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  fieldHalf: { flex: 1 },
  field: { marginBottom: 16 },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.8,
    color: "#999",
    marginBottom: 8,
  },
  fieldInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#1b1b1b",
    borderBottomWidth: 1.5,
    borderBottomColor: "#e8e6e1",
    paddingVertical: 8,
  },

  // Save
  saveButton: {
    backgroundColor: "#1b1b1b",
    borderRadius: 32,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    letterSpacing: 1.5,
    color: "#fff",
  },
});
