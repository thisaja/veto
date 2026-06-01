import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import { Newsreader_600SemiBold } from "@expo-google-fonts/newsreader";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: "By downloading or using Veto, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.",
  },
  {
    title: "2. Use of the Service",
    body: "Veto is a group restaurant decision-making app. You may use the service for personal, non-commercial purposes. You must not misuse or abuse the platform, including sending spam, impersonating others, or attempting to gain unauthorised access to any part of the service.",
  },
  {
    title: "3. User Accounts",
    body: "You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately of any unauthorised use of your account.",
  },
  {
    title: "4. Content",
    body: "You retain ownership of any content you submit. By submitting content, you grant Veto a non-exclusive, royalty-free licence to use, display, and distribute that content within the app. We reserve the right to remove content that violates these terms.",
  },
  {
    title: "5. Privacy",
    body: "Your use of Veto is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review it to understand our practices.",
  },
  {
    title: "6. Third-Party Services",
    body: "Veto integrates with third-party services including Google Places and Google Maps. Your use of those services is subject to their respective terms and policies.",
  },
  {
    title: "7. Disclaimers",
    body: "The service is provided \"as is\" without warranties of any kind. We do not guarantee the accuracy, completeness, or availability of restaurant information. Veto is not responsible for any dining experiences that result from using the app.",
  },
  {
    title: "8. Limitation of Liability",
    body: "To the fullest extent permitted by law, Veto shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.",
  },
  {
    title: "9. Changes to Terms",
    body: "We may update these Terms from time to time. Continued use of the app after changes constitutes acceptance of the new Terms.",
  },
  {
    title: "10. Contact",
    body: "If you have questions about these Terms, please contact us at support@vetodining.com.",
  },
];

export default function TermsScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Newsreader_600SemiBold });
  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#1b1b1b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Terms of{"\n"}Service</Text>
        <Text style={styles.lastUpdated}>Last updated: May 2026</Text>

        {SECTIONS.map(s => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0eeea",
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#1b1b1b" },
  scroll: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  pageTitle: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 40,
    lineHeight: 46,
    color: "#1b1b1b",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  lastUpdated: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#aaa", marginBottom: 32 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#1b1b1b",
    marginBottom: 8,
  },
  sectionBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#4c4546",
    lineHeight: 22,
  },
});
