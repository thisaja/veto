import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SessionProvider } from "@/context/SessionContext";
import { ToastProvider, useToast } from "@/context/ToastContext";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { Alert } from "react-native";
import "react-native-reanimated";
import { io } from "socket.io-client";
import "../global.css";

const SERVER_URL = "http://10.0.0.129:5000";

function NotificationListener() {
  const { userId } = useAuth();
  const router = useRouter();
  const { showWarning } = useToast();

  useEffect(() => {
    if (!userId) return;
    const socket = io(`${SERVER_URL}/notifications`, { transports: ["websocket"] });

    socket.on("connect", () => { socket.emit("register", { userId }); });

    socket.on("connect_error", () => {
      // Notification socket failing is non-critical — the app still works
    });

    socket.on(
      "session_invite",
      ({ sessionId, hostAlias }: { sessionId: string; hostAlias: string }) => {
        Alert.alert(
          "Session Invite",
          `${hostAlias} invited you to a Veto session!`,
          [
            { text: "Not now", style: "cancel" },
            { text: "Join", onPress: () => router.push(`/join/${sessionId}` as any) },
          ],
          { cancelable: true }
        );
      }
    );

    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        showWarning("Disconnected from server. Some features may be unavailable.");
      }
    });

    return () => { socket.disconnect(); };
  }, [userId]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SessionProvider>
        <ToastProvider>
          <NotificationListener />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(register)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="createSession" options={{ headerShown: false }} />
            <Stack.Screen name="invite" options={{ headerShown: false }} />
            <Stack.Screen name="questionnaire" options={{ headerShown: false }} />
            <Stack.Screen name="questionResults" options={{ headerShown: false }} />
            <Stack.Screen name="pickBan" options={{ headerShown: false }} />
            <Stack.Screen name="matched" options={{ headerShown: false }} />
            <Stack.Screen name="terms" options={{ headerShown: false }} />
            <Stack.Screen name="privacy" options={{ headerShown: false }} />
            <Stack.Screen name="joinLobby" options={{ headerShown: false }} />
            <Stack.Screen name="join/[sessionId]" options={{ headerShown: false }} />
          </Stack>
        </ToastProvider>
      </SessionProvider>
    </AuthProvider>
  );
}
