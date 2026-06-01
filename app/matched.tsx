import MyButton from "@/components/button";
import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
  Linking,
  Platform,
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
  caption?: string;
  popularItems?: string[];
  address?: string;
  phone?: string;
};

const MatchScreen = () => {
  const router = useRouter();
  const { restaurant: restaurantParam } = useLocalSearchParams<{ restaurant: string }>();
  const [addressCopied, setAddressCopied] = useState(false);

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
    Newsreader_600SemiBold,
    Newsreader_400Regular_Italic,
  });

  if (!fontsLoaded) return null;

  const heroImage = restaurant?.imageURLs?.[0] ?? restaurant?.imageURL;

  const handleCopyAddress = async () => {
    const text = restaurant?.address ?? restaurant?.header;
    if (!text) return;
    await Clipboard.setStringAsync(text);
    setAddressCopied(true);
    setTimeout(() => setAddressCopied(false), 2000);
  };

  const handleDirections = async () => {
    if (!restaurant) return;
    const query = encodeURIComponent(restaurant.address ?? restaurant.header);

    // iOS → Apple Maps, Android → default geo handler, fallback → Google Maps web
    const nativeUrl = Platform.select({
      ios: `maps://0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
    }) as string;
    const webFallback = `https://maps.google.com/maps?q=${query}`;

    try {
      const canOpen = await Linking.canOpenURL(nativeUrl);
      await Linking.openURL(canOpen ? nativeUrl : webFallback);
    } catch {
      await Linking.openURL(webFallback);
    }
  };

  const handleCall = async () => {
    if (!restaurant?.phone) return;
    const url = `tel:${restaurant.phone}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
    } catch {}
  };

  const handleReserve = async () => {
    if (!restaurant) return;
    const name = encodeURIComponent(restaurant.header);
    // Try Yelp app first, fall back to Yelp website
    const yelpApp = `yelp:///search?terms=${name}`;
    const yelpWeb = `https://www.yelp.com/search?find_desc=${name}`;
    try {
      const canOpen = await Linking.canOpenURL(yelpApp);
      await Linking.openURL(canOpen ? yelpApp : yelpWeb);
    } catch {
      await Linking.openURL(yelpWeb);
    }
  };

  // Build chip labels: priceRange + label + up to 2 popularItems
  const chips: string[] = [
    ...(restaurant?.priceRange ? [restaurant.priceRange] : []),
    ...(restaurant?.label ? [restaurant.label] : []),
    ...(restaurant?.popularItems?.slice(0, 2) ?? []),
  ];

  return (
    <SafeAreaView style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Feather name="x" size={22} color="#1b1b1b" />
        </TouchableOpacity>

        <Text style={styles.appName}>Veto</Text>

        <TouchableOpacity style={styles.iconButton}>
          <Feather name="share" size={20} color="#1b1b1b" />
        </TouchableOpacity>
      </View>

      {/* ── Verdict heading ── */}
      <View style={styles.verdictSection}>
        <Text style={styles.verdictLabel}>THE VERDICT</Text>
        <Text style={styles.restaurantName}>{restaurant?.header ?? "—"}</Text>
      </View>

      {/* ── Restaurant card ── */}
      <View style={styles.card}>
        {/* Hero image */}
        <View style={styles.imageBox}>
          {heroImage ? (
            <Image style={styles.cardImage} source={{ uri: heroImage }} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Feather name="image" size={40} color="#ccc" />
            </View>
          )}

          {/* Rating badge — top right of image */}
          {restaurant?.rating ? (
            <View style={styles.ratingBadge}>
              <Feather name="star" size={11} color="#8B5A83" />
              <Text style={styles.ratingText}>{restaurant.rating}</Text>
            </View>
          ) : null}
        </View>

        {/* Card info */}
        <View style={styles.cardInfo}>
          {/* Cuisine line */}
          <Text style={styles.cuisineText}>
            {restaurant?.label ?? ""}
          </Text>

          {/* Location row — tap copies address to clipboard */}
          <TouchableOpacity
            style={styles.locationRow}
            onPress={handleCopyAddress}
            activeOpacity={0.75}
          >
            <Feather name="map-pin" size={14} color="#888" />
            <Text style={styles.locationText} numberOfLines={2}>
              {addressCopied
                ? "Copied to clipboard!"
                : restaurant?.address
                ? restaurant.address
                : `${restaurant?.header ?? "Restaurant"} — tap to copy`}
            </Text>
          </TouchableOpacity>

          {/* Chips */}
          {chips.length > 0 ? (
            <View style={styles.chipsRow}>
              {chips.map((chip, idx) => (
                <View key={idx} style={styles.chip}>
                  <Text style={styles.chipText}>{chip}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {/* ── Actions ── */}
      <View style={styles.actionsSection}>
        <MyButton onClick={handleDirections} style={styles.directionsButton}>
          <Feather name="navigation" size={16} color="white" />
          <Text style={styles.directionsButtonText}>GET DIRECTIONS</Text>
        </MyButton>

        <View style={styles.secondaryRow}>
          <TouchableOpacity style={styles.reserveButton} onPress={handleReserve} activeOpacity={0.8}>
            <Text style={styles.reserveButtonText}>RESERVE A TABLE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callButton} onPress={handleCall} activeOpacity={0.8}>
            <Feather name="phone" size={16} color="#1b1b1b" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontFamily: "Newsreader_400Regular_Italic",
    fontSize: 24,
    color: "#1b1b1b",
  },

  // ── Verdict heading ──
  verdictSection: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 8,
    paddingBottom: 20,
  },
  verdictLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 2.5,
    color: "#8B5A83",
    marginBottom: 8,
  },
  restaurantName: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 44,
    lineHeight: 50,
    color: "#1b1b1b",
    textAlign: "center",
    letterSpacing: -0.5,
  },

  // ── Card ──
  card: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e8e6e1",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageBox: {
    height: 220,
    position: "relative",
    backgroundColor: "#f0eeea",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#1b1b1b",
  },

  // Card info block
  cardInfo: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 10,
  },
  cuisineText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#1b1b1b",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#666",
    flex: 1,
    lineHeight: 20,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#f0eeea",
    borderWidth: 0.5,
    borderColor: "#d8d5cf",
  },
  chipText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#1b1b1b",
  },

  // ── Actions ──
  actionsSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  directionsButton: {
    width: "100%",
    height: 56,
    justifyContent: "center",
    gap: 10,
    borderRadius: 32,
  },
  directionsButtonText: {
    color: "white",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    letterSpacing: 1.2,
  },
  secondaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  reserveButton: {
    flex: 1,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 32,
    borderColor: "#1b1b1b",
    borderWidth: 1,
    backgroundColor: "white",
  },
  reserveButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 1.2,
    color: "#1b1b1b",
  },
  callButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1b1b1b",
    backgroundColor: "white",
  },
});

export default MatchScreen;
