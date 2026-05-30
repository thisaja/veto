import { useAuth } from "@/context/AuthContext";
import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import {
  Newsreader_400Regular_Italic,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE = "http://10.0.0.129:5000";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function JoinLobbyScreen() {
  const router = useRouter();
  const { userId, guestId, diningAlias, setAuth } = useAuth();
  const { error: routeError } = useLocalSearchParams<{ error?: string }>();

  const [code,    setCode]    = useState("");
  const [joining, setJoining] = useState(false);
  const [error,   setError]   = useState<string | null>(routeError ?? null);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_600SemiBold,
    Newsreader_400Regular_Italic,
  });

  if (!fontsLoaded) return null;

  const handleJoin = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    Keyboard.dismiss();
    setError(null);
    setJoining(true);

    // Resolve identity locally so we don't depend on a React re-render
    let resolvedUserId: string | null = userId ?? null;
    let resolvedGuestId: string | null = guestId ?? null;
    if (!resolvedUserId && !resolvedGuestId) {
      resolvedGuestId = generateUUID();
      setAuth({ isGuest: true, guestId: resolvedGuestId });
    }

    try {
      // Step 1: resolve the short code / full UUID to a canonical session ID
      const validateRes  = await fetch(`${API_BASE}/session/validate/${trimmed}`);
      const validateJson = await validateRes.json();
      if (!validateJson.success || !validateJson.sessionId) {
        setError("Session not found. Check the code and try again.");
        setJoining(false);
        return;
      }
      const sessionId = validateJson.sessionId;

      // Step 2: register this user in SessionMembers
      const joinRes  = await fetch(`${API_BASE}/session/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          userId:  resolvedUserId  ?? undefined,
          guestId: resolvedGuestId ?? undefined,
          alias:   diningAlias ?? "Guest",
        }),
      });
      const joinJson = await joinRes.json();
      if (!joinJson.success) {
        setError(joinJson.message ?? "Couldn't join session.");
        setJoining(false);
        return;
      }

      router.replace({
        pathname: "/invite",
        params: { sessionId, isGuest: "true" },
      });
    } catch {
      setError("Couldn't connect. Please check your connection and try again.");
      setJoining(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color="#1b1b1b" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ── Title ── */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Join a Lobby</Text>
          <Text style={styles.subtitle}>
            Enter the code from the host's screen, or scan their QR code to be taken straight in.
          </Text>
        </View>

        {/* ── Scan QR option ── */}
        <TouchableOpacity
          style={styles.qrCard}
          activeOpacity={0.8}
          onPress={() => Linking.openURL("camera://").catch(() => Linking.openSettings())}
        >
          <View style={styles.qrIconCircle}>
            <Feather name="camera" size={26} color="#1b1b1b" />
          </View>
          <View style={styles.qrCardText}>
            <Text style={styles.qrCardHeading}>Scan QR Code</Text>
            <Text style={styles.qrCardSub}>Point your camera at the host's screen</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#bbb" />
        </TouchableOpacity>

        {/* ── Divider ── */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or enter a code</Text>
          <View style={styles.orLine} />
        </View>

        {/* ── Code input ── */}
        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>INVITE CODE OR LINK</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, !!error && styles.inputError]}
              placeholder="e.g. a1b2c3d4 or veto://join/..."
              placeholderTextColor="#bbb"
              value={code}
              onChangeText={v => { setCode(v); setError(null); }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleJoin}
              editable={!joining}
            />
          </View>
          {error && (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={13} color="#ba1a1a" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {/* ── Join button ── */}
        <Pressable
          style={({ pressed }) => [
            styles.joinBtn,
            (!code.trim() || joining) && styles.joinBtnOff,
            pressed && code.trim() && styles.joinBtnPressed,
          ]}
          onPress={handleJoin}
          disabled={!code.trim() || joining}
        >
          {joining ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.joinBtnText}>Join Session</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </>
          )}
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },

  // ── Header ──
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Body ──
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  // ── Title ──
  titleBlock: { marginBottom: 32 },
  title: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 36,
    lineHeight: 42,
    color: "#1b1b1b",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#666",
    lineHeight: 21,
  },

  // ── QR card ──
  qrCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 18,
    backgroundColor: "#F0EEEA",
    borderRadius: 16,
    marginBottom: 28,
  },
  qrIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  qrCardText: { flex: 1 },
  qrCardHeading: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#1b1b1b",
    marginBottom: 3,
  },
  qrCardSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#888",
  },

  // ── OR divider ──
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  },
  orLine: { flex: 1, height: 1, backgroundColor: "#ebebeb" },
  orText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#aaa",
  },

  // ── Input ──
  inputBlock: { marginBottom: 20 },
  inputLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.8,
    color: "#999",
    marginBottom: 10,
  },
  inputRow: {},
  input: {
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
  inputError: { borderColor: "#ba1a1a", backgroundColor: "#fff8f8" },
  errorRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 8 },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#ba1a1a", flex: 1, lineHeight: 18 },

  // ── Join button ──
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 32,
    backgroundColor: "#1b1b1b",
  },
  joinBtnOff: { backgroundColor: "#d0d0d0" },
  joinBtnPressed: { opacity: 0.85 },
  joinBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});
