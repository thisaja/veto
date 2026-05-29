import MyButton from "@/components/button";
import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Restaurant = {
  id: number;
  header: string;
  imageURL: string;
  imageURLs?: string[];
  label: string;
  priceRange?: string;
  rating?: string;
  caption: string;
  popularItems?: string[];
};

const MatchScreen = () => {
  const router = useRouter();
  const { restaurant: restaurantParam } = useLocalSearchParams<{ restaurant: string }>();

  const restaurant: Restaurant | null = useMemo(() => {
    try {
      return restaurantParam ? JSON.parse(restaurantParam) : null;
    } catch {
      return null;
    }
  }, [restaurantParam]);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_400Regular,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    Newsreader_400Regular_Italic,
  });

  if (!fontsLoaded) return null;

  const heroImage = restaurant?.imageURLs?.[0] ?? restaurant?.imageURL;

  const handleDirections = () => {
    if (!restaurant) return;
    const query = encodeURIComponent(restaurant.header);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <MyButton style={styles.sideButton} onClick={() => router.back()}>
          <Feather name="arrow-left" size={24} color="black" />
        </MyButton>
        <Text style={styles.appName}>Veto</Text>
        <MyButton style={styles.sideButton} onClick={() => {}}>
          <View style={styles.profileCircle}>
            <Feather name="user" size={20} color="#5b5b5b" />
          </View>
        </MyButton>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── Verdict label ── */}
        <View style={styles.verdictSection}>
          <Text style={styles.verdictLabel}>THE VERDICT</Text>
          <Text style={styles.restaurantName}>{restaurant?.header ?? "—"}</Text>
          {restaurant?.label ? (
            <Text style={styles.cuisineLabel}>{restaurant.label}</Text>
          ) : null}
        </View>

        {/* ── Hero image card ── */}
        {heroImage ? (
          <View style={styles.card}>
            <Image style={styles.cardImage} source={{ uri: heroImage }} />

            {/* Chips row */}
            <View style={styles.chipsRow}>
              {restaurant?.label ? (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{restaurant.label}</Text>
                </View>
              ) : null}
              {restaurant?.priceRange ? (
                <View style={[styles.chip, styles.chipOutline]}>
                  <Text style={[styles.chipText, styles.chipTextDark]}>{restaurant.priceRange}</Text>
                </View>
              ) : null}
              {restaurant?.rating ? (
                <View style={[styles.chip, styles.chipOutline]}>
                  <Feather name="star" size={11} color="#888" />
                  <Text style={[styles.chipText, styles.chipTextDark]}>{restaurant.rating}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* ── About ── */}
        {restaurant?.caption ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ABOUT</Text>
            <Text style={styles.sectionText}>{restaurant.caption}</Text>
          </View>
        ) : null}

        {/* ── Popular items ── */}
        {(restaurant?.popularItems?.length ?? 0) > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>POPULAR ITEMS</Text>
            {restaurant!.popularItems!.map((item, idx) => (
              <View key={idx} style={styles.popularRow}>
                <View style={styles.popularDot} />
                <Text style={styles.popularItem}>{item}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* ── Actions ── */}
        <View style={styles.actionsSection}>
          <MyButton onClick={handleDirections} style={styles.directionsButton}>
            <Text style={styles.directionsButtonText}>GET DIRECTIONS</Text>
            <Feather name="corner-up-right" size={16} color="white" />
          </MyButton>

          <View style={styles.secondaryRow}>
            <TouchableOpacity style={styles.reserveButton}>
              <Text style={styles.reserveButtonText}>RESERVE A TABLE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.callButton}>
              <Feather name="phone" size={16} color="black" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fdfcfb" },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  sideButton: {
    width: 50,
    height: 50,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontFamily: "Newsreader_400Regular_Italic",
    fontSize: 26,
    color: "#1b1b1b",
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#d9d9d9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#a7a7a7",
  },

  // ── Scroll ──
  scrollContent: { paddingBottom: 48 },

  // ── Verdict ──
  verdictSection: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 20,
  },
  verdictLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 2.5,
    color: "#8B5A83",
    marginBottom: 10,
  },
  restaurantName: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 44,
    lineHeight: 50,
    color: "#1b1b1b",
    textAlign: "center",
    letterSpacing: -0.8,
  },
  cuisineLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#777",
    marginTop: 6,
    textAlign: "center",
  },

  // ── Card ──
  card: {
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e4e2dd",
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  cardImage: {
    width: "100%",
    height: 260,
    resizeMode: "cover",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 16,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#000",
  },
  chipOutline: {
    backgroundColor: "#efefef",
  },
  chipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  chipTextDark: {
    color: "#888",
  },

  // ── Sections ──
  section: {
    marginHorizontal: 24,
    marginBottom: 20,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#ebebeb",
    paddingBottom: 4,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 2,
    color: "#888",
    marginTop: 16,
    marginBottom: 10,
  },
  sectionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 24,
    color: "#3a3a3a",
  },
  popularRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  popularDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#1b1b1b",
    marginTop: 8,
    marginRight: 12,
  },
  popularItem: {
    fontFamily: "Newsreader_400Regular",
    fontSize: 18,
    color: "#1b1b1b",
    lineHeight: 24,
    flex: 1,
  },

  // ── Actions ──
  actionsSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  directionsButton: {
    width: "100%",
    height: 56,
    justifyContent: "center",
    gap: 10,
  },
  directionsButtonText: {
    color: "white",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    letterSpacing: 1,
  },
  secondaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  reserveButton: {
    flex: 1,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 32,
    borderColor: "black",
    borderWidth: 1,
    backgroundColor: "white",
  },
  reserveButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    letterSpacing: 0.8,
    color: "#1b1b1b",
  },
  callButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "black",
    backgroundColor: "white",
  },
});

export default MatchScreen;
