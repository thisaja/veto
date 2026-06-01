import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ToastType = "error" | "warning" | "success" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

// ── Single animated toast pill ──────────────────────────────────────────────
function ToastPill({
  item,
  topInset,
  onDismiss,
}: {
  item: ToastItem;
  topInset: number;
  onDismiss: (id: number) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(3400),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onDismiss(item.id));
  }, []);

  const bg =
    item.type === "error"
      ? "#ba1a1a"
      : item.type === "warning"
      ? "#8a5a00"
      : item.type === "success"
      ? "#1b6b3a"
      : "#1b4b8a";

  return (
    <Animated.View
      style={[
        styles.pill,
        { backgroundColor: bg, marginTop: topInset + 12, opacity },
      ]}
    >
      <Text style={styles.pillText} numberOfLines={3}>
        {item.message}
      </Text>
      <TouchableOpacity onPress={() => onDismiss(item.id)} hitSlop={12}>
        <Text style={styles.pillClose}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const insets = useSafeAreaInsets();

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "error") => {
    const id = nextId.current++;
    // Replace any existing toast of the same type to avoid stacking
    setToasts((prev) => [...prev.filter((t) => t.type !== type), { id, message, type }]);
  }, []);

  const showError   = useCallback((msg: string) => showToast(msg, "error"),   [showToast]);
  const showSuccess = useCallback((msg: string) => showToast(msg, "success"), [showToast]);
  const showWarning = useCallback((msg: string) => showToast(msg, "warning"), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showError, showSuccess, showWarning }}>
      {children}
      {/* Render toasts above everything */}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((item) => (
          <ToastPill key={item.id} item={item} topInset={insets.top} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  pill: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: 400,
    width: "100%",
  },
  pillText: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  pillClose: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 2,
  },
});
