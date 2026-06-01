import MyButton from "@/components/button";
import { globalStyles } from "@/constants/global";
import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import {
  Newsreader_600SemiBold,
  Newsreader_600SemiBold_Italic,
} from "@expo-google-fonts/newsreader";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE = "http://10.0.0.129:5000";

type Step = "email" | "otp" | "password";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [step,       setStep]       = useState<Step>("email");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Step 1 — email
  const [email,      setEmail]      = useState("");

  // Step 2 — OTP
  const [otp,        setOtp]        = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Step 3 — new password
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [done,       setDone]       = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_600SemiBold,
    Newsreader_600SemiBold_Italic,
  });

  if (!fontsLoaded) return null;

  // ── Step 1: request OTP ────────────────────────────────────────────────────
  const handleRequestCode = async () => {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const json = await res.json();
      if (json.success) {
        setStep("otp");
      } else {
        setError(json.message ?? "Something went wrong. Try again.");
      }
    } catch {
      setError("Could not connect. Check your network.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP ─────────────────────────────────────────────────────
  const handleVerifyCode = async () => {
    setError(null);
    if (otp.trim().length !== 6) {
      setError("Enter the 6-digit code from your email");
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setResetToken(json.resetToken);
        setStep("password");
      } else {
        setError(json.message ?? "Incorrect code. Try again.");
      }
    } catch {
      setError("Could not connect. Check your network.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: reset password ─────────────────────────────────────────────────
  const handleResetPassword = async () => {
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword: password }),
      });
      const json = await res.json();
      if (json.success) {
        setDone(true);
      } else {
        setError(json.message ?? "Something went wrong. Try again.");
      }
    } catch {
      setError("Could not connect. Check your network.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (done) {
    return (
      <SafeAreaView style={globalStyles.screen}>
        <View style={styles.centerContent}>
          <View style={styles.successIcon}>
            <Feather name="check" size={32} color="#3a7a4a" />
          </View>
          <Text style={styles.successTitle}>Password updated!</Text>
          <Text style={styles.successSub}>
            Your password has been changed. You can now log in with your new password.
          </Text>
          <MyButton
            onClick={() => { router.dismissAll(); router.replace("/login"); }}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>BACK TO LOG IN</Text>
          </MyButton>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (step === "otp")      { setStep("email"); setError(null); setOtp(""); }
              else if (step === "password") { setStep("otp"); setError(null); }
              else                    router.back();
            }}
          >
            <Feather name="arrow-left" size={22} color="#1b1b1b" />
          </TouchableOpacity>
          <Text style={styles.stepLabel}>
            {step === "email" ? "STEP 1 OF 3" : step === "otp" ? "STEP 2 OF 3" : "STEP 3 OF 3"}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.body}>
          {/* ── Step 1 — email ── */}
          {step === "email" && (
            <>
              <Text style={styles.title}>Forgot password?</Text>
              <Text style={styles.subtitle}>
                Enter your account email and we'll send you a 6-digit reset code.
              </Text>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="hello@example.com"
                  placeholderTextColor="#bbb"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                  value={email}
                  onChangeText={t => { setEmail(t); setError(null); }}
                  onSubmitEditing={handleRequestCode}
                  returnKeyType="send"
                />
              </View>
            </>
          )}

          {/* ── Step 2 — OTP ── */}
          {step === "otp" && (
            <>
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit code to{" "}
                <Text style={{ fontFamily: "Inter_600SemiBold", color: "#1b1b1b" }}>
                  {email}
                </Text>
                . It expires in 15 minutes.
              </Text>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>RESET CODE</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="000000"
                  placeholderTextColor="#bbb"
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  value={otp}
                  onChangeText={t => { setOtp(t.replace(/\D/g, "")); setError(null); }}
                  onSubmitEditing={handleVerifyCode}
                  returnKeyType="done"
                />
              </View>
              <TouchableOpacity
                onPress={() => { setError(null); setOtp(""); handleRequestCode(); }}
                style={styles.resendBtn}
              >
                <Text style={styles.resendText}>Didn't get a code? Resend</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Step 3 — new password ── */}
          {step === "password" && (
            <>
              <Text style={styles.title}>Create new password</Text>
              <Text style={styles.subtitle}>
                Choose a new password for your Veto account. At least 6 characters.
              </Text>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>NEW PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#bbb"
                  secureTextEntry
                  autoFocus
                  value={password}
                  onChangeText={t => { setPassword(t); setError(null); }}
                  returnKeyType="next"
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>CONFIRM PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#bbb"
                  secureTextEntry
                  value={confirm}
                  onChangeText={t => { setConfirm(t); setError(null); }}
                  onSubmitEditing={handleResetPassword}
                  returnKeyType="done"
                />
              </View>
            </>
          )}

          {/* ── Error ── */}
          {error && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color="#ba1a1a" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ── Action button ── */}
          <MyButton
            onClick={
              step === "email"    ? handleRequestCode  :
              step === "otp"      ? handleVerifyCode    :
                                    handleResetPassword
            }
            style={styles.primaryBtn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>
                  {step === "email"    ? "SEND CODE"        :
                   step === "otp"      ? "VERIFY CODE"      :
                                         "RESET PASSWORD"}
                </Text>
                <Feather name="arrow-right" size={16} color="#fff" />
              </>
            )}
          </MyButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 52,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    letterSpacing: 1.5,
    color: "#999",
  },

  body: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 40,
    gap: 20,
  },

  title: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 32,
    color: "#1b1b1b",
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#666",
    lineHeight: 21,
    marginTop: -8,
  },

  fieldGroup: { gap: 8 },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.8,
    color: "#999",
  },
  input: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#1b1b1b",
    borderBottomWidth: 1.5,
    borderBottomColor: "#1b1b1b",
    paddingVertical: 8,
  },
  otpInput: {
    fontSize: 28,
    letterSpacing: 10,
    fontFamily: "Inter_600SemiBold",
  },

  resendBtn: { alignSelf: "flex-start" },
  resendText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#888",
    textDecorationLine: "underline",
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff4f4",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ffd6d6",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#ba1a1a",
    flex: 1,
  },

  primaryBtn: {
    width: "100%",
    height: 52,
  },
  primaryBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    letterSpacing: 1.5,
    color: "#fff",
  },

  // ── Success ──
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingBottom: 40,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#e8f0ea",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successTitle: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 28,
    color: "#1b1b1b",
  },
  successSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 16,
  },
});
