/**
 * Handles the veto://join/{sessionId} deep link.
 * expo-router maps this URL to this file automatically via the scheme in app.json.
 */
import { useAuth } from "@/context/AuthContext";
// Uses diningAlias so the lobby shows the user's real name
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const API_BASE = "http://10.0.0.129:5000";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function JoinDeepLinkScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { userId, guestId, diningAlias, setAuth } = useAuth();
  const router = useRouter();
  const didJoin = useRef(false);

  useEffect(() => {
    if (!sessionId || didJoin.current) return;
    didJoin.current = true;

    const join = async () => {
      let resolvedUserId: string | null = userId ?? null;
      let resolvedGuestId: string | null = guestId ?? null;

      if (!resolvedUserId && !resolvedGuestId) {
        resolvedGuestId = generateUUID();
        setAuth({ isGuest: true, guestId: resolvedGuestId });
      }

      // For logged-in users whose alias isn't cached yet, fetch it before joining
      // so the lobby shows their real name rather than "Guest".
      let alias = diningAlias;
      if (!alias && resolvedUserId) {
        try {
          const p = await fetch(`${API_BASE}/api/profile/${resolvedUserId}`);
          const pj = await p.json();
          if (pj.success && pj.data?.diningAlias) alias = pj.data.diningAlias;
        } catch {}
      }

      try {
        const res = await fetch(`${API_BASE}/session/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            userId:  resolvedUserId  ?? undefined,
            guestId: resolvedGuestId ?? undefined,
            alias:   alias ?? "Guest",
          }),
        });
        const json = await res.json();

        if (json.success) {
          router.replace({
            pathname: "/invite",
            params: { sessionId, isGuest: "true" },
          });
        } else {
          router.replace({
            pathname: "/joinLobby",
            params: { error: json.message ?? "Session not found or has ended." },
          });
        }
      } catch {
        router.replace({ pathname: "/joinLobby", params: { error: "Network error." } });
      }
    };

    join();
  }, [sessionId]);

  return (
    <View style={styles.screen}>
      <ActivityIndicator size="large" color="#1b1b1b" />
      <Text style={styles.label}>Joining session…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", gap: 16 },
  label: { fontSize: 15, color: "#888", fontFamily: "System" },
});
