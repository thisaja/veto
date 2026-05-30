import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import { Newsreader_600SemiBold } from "@expo-google-fonts/newsreader";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: "We collect information you provide directly to us, including your name, email address, username, profile photo, and dietary preferences when you create an account.\n\nWhen you use the app, we also collect usage data such as session history, restaurant selections, and voting patterns to improve the service.",
  },
  {
    title: "2. How We Use Your Information",
    body: "We use the information we collect to:\n• Provide, maintain, and improve the Veto service\n• Personalise restaurant recommendations for your group\n• Connect you with friends on the platform\n• Send you service-related notifications\n• Detect and prevent fraud or misuse",
  },
  {
    title: "3. Information Sharing",
    body: "We do not sell your personal information. We may share limited information with:\n• Other users: your username, display name, and dietary preferences are visible to friends and group members\n• Service providers: third-party vendors who help us operate the app (e.g. Google Maps for restaurant data)\n• Legal requirements: if required by law or to protect rights and safety",
  },
  {
    title: "4. Profile Photo",
    body: "Your profile photo is stored securely on our servers and visible to your friends and group members within the app. You can update or remove your photo at any time from your profile settings.",
  },
  {
    title: "5. Dietary and Preference Data",
    body: "Your dietary restrictions and preferences are used exclusively to filter and personalise restaurant recommendations. This data is shared with other members of your group session so the app can find suitable options for everyone.",
  },
  {
    title: "6. Data Retention",
    body: "We retain your account data for as long as your account is active. You can request deletion of your account and associated data at any time through the Profile screen. Upon deletion, your personal information is removed within 30 days.",
  },
  {
    title: "7. Security",
    body: "We use industry-standard encryption and security practices to protect your data. Passwords are hashed using Argon2 and are never stored in plain text. However, no method of transmission over the internet is 100% secure.",
  },
  {
    title: "8. Children's Privacy",
    body: "Veto is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us.",
  },
  {
    title: "9. Changes to This Policy",
    body: "We may update this Privacy Policy periodically. We will notify you of significant changes through the app. Your continued use after changes constitutes acceptance.",
  },
  {
    title: "10. Contact Us",
    body: "If you have questions about this Privacy Policy or your data, contact us at privacy@vetodining.com.",
  },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Newsreader_600SemiBold });
  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#1b1b1b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Privacy{"\n"}Policy</Text>
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
