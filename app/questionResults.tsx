import MyButton from "@/components/button";
import Card from "@/components/card";
import { useSession } from "@/context/SessionContext";
import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

function getSessionLabel() {
  const h = new Date().getHours();
  if (h >= 5  && h < 11) return "WEEKEND BRUNCH";
  if (h >= 11 && h < 14) return "LUNCH OUTING";
  if (h >= 14 && h < 17) return "AFTERNOON BITE";
  if (h >= 17 && h < 20) return "DINNER TONIGHT";
  if (h >= 20 && h < 23) return "EVENING OUT";
  return "LATE NIGHT EATS";
}

const CARD_WIDTH = 340;
const CARD_MARGIN = 12;
const CARD_SLOT = CARD_WIDTH + CARD_MARGIN * 2;
const SCROLL_PADDING = (width - CARD_WIDTH) / 2 - CARD_MARGIN;
const GALLERY_HEIGHT = 260;
const API_BASE = "http://10.0.0.129:5000";
// ── Haversine distance (km) ──────────────────────────────────────────────────
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function formatDist(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

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
  address?: string;
  latitude?: number;
  longitude?: number;
};

// ── Skeleton card ────────────────────────────────────────────────────────────
const SkeletonCard = ({ pulse }: { pulse: Animated.Value }) => (
  <View style={[skeletonStyles.card, { width: CARD_WIDTH }]}>
    <Animated.View style={[skeletonStyles.image, { opacity: pulse }]} />
    <View style={skeletonStyles.body}>
      <Animated.View style={[skeletonStyles.line, { width: "60%", opacity: pulse }]} />
      <Animated.View style={[skeletonStyles.line, { width: "40%", opacity: pulse }]} />
      <Animated.View style={[skeletonStyles.line, { width: "80%", opacity: pulse }]} />
    </View>
  </View>
);

const skeletonStyles = StyleSheet.create({
  card: {
    marginHorizontal: CARD_MARGIN,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e8e6e1",
  },
  image: { height: 200, backgroundColor: "#ebebeb" },
  body: { padding: 16, gap: 10 },
  line: { height: 14, borderRadius: 7, backgroundColor: "#ebebeb" },
});

// ── Main component ────────────────────────────────────────────────────────────
const ResultScreen = () => {
  const router = useRouter();
  const { sessionId: ctxSessionId, userLocation } = useSession();

  // Params: new flow sends `answers` + `sessionId`; legacy sends `restaurants`
  const {
    restaurants: restaurantsParam,
    answers: answersParam,
    sessionId: paramSessionId,
  } = useLocalSearchParams<{
    restaurants?: string;
    answers?: string;
    sessionId?: string;
  }>();

  const sessionId = ctxSessionId ?? paramSessionId ?? "";

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Restaurant | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const galleryRef = useRef<ScrollView>(null);

  // Skeleton pulse
  const skeletonPulse = useRef(new Animated.Value(0.4)).current;

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_400Regular,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    Newsreader_400Regular_Italic,
  });

  // ── Skeleton pulse loop ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonPulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(skeletonPulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isLoading]);

  // ── Fetch restaurants ────────────────────────────────────────────────────
  useEffect(() => {
    // Primary: restaurants JSON passed directly from questionnaire
    if (restaurantsParam) {
      try {
        setRestaurants(JSON.parse(restaurantsParam));
      } catch { /* ignore */ }
      return;
    }

    // Fallback: answers passed, fetch from Gemini here
    if (!answersParam) return;

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const formattedAnswers = JSON.parse(answersParam);
        const res = await fetch(`${API_BASE}/api/gemini/restaurant`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userAnswers: formattedAnswers, sessionId }),
        });
        const json = await res.json();
        const data: Restaurant[] = Array.isArray(json.data) ? json.data : [];
        if (!cancelled) {
          setRestaurants(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("getRestaurant failed:", err);
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answersParam, restaurantsParam, sessionId]);

  if (!fontsLoaded) return null;

  const openCard = (card: Restaurant) => {
    setActiveImageIdx(0);
    setSelectedCard(card);
    galleryRef.current?.scrollTo({ x: 0, animated: false });
  };

  const onGalleryScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveImageIdx(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const modalImages: string[] = selectedCard
    ? (selectedCard.imageURLs?.length ? selectedCard.imageURLs : [selectedCard.imageURL]).filter(
        Boolean,
      )
    : [];

  const getDistance = (r: Restaurant): string | null => {
    if (!userLocation || !r.latitude || !r.longitude) return null;
    const km = distanceKm(userLocation.latitude, userLocation.longitude, r.latitude, r.longitude);
    return formatDist(km);
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <MyButton style={styles.sideButton} onClick={() => router.back()}>
          <Feather name="arrow-left" size={24} color="black" />
        </MyButton>
        <View style={styles.titleContainer}>
          <Text style={styles.topText}>{getSessionLabel()}</Text>
          <Text style={styles.bottomText}>
            {isLoading ? "Finding matches…" : `${restaurants.length} Matches Found`}
          </Text>
        </View>
        <MyButton style={styles.sideButton} onClick={() => {}}>
          <View style={styles.profileCircle}>
            <Feather name="user" size={20} color="#5b5b5b" />
          </View>
        </MyButton>
      </View>

      {/* ── Title ── */}
      <View style={styles.middleContainer}>
        <Text style={styles.shortList}>The Shortlist</Text>
        <Text style={styles.shortDesc}>
          {isLoading
            ? "Curating the best options for your group…"
            : "Your group has agreed on these spots. Review the options before locking in your choice."}
        </Text>
      </View>

      {/* ── Card scroll ── */}
      <View style={styles.scrollWrapper}>
        <ScrollView
          horizontal
          decelerationRate="fast"
          snapToAlignment="start"
          snapToInterval={CARD_SLOT}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingHorizontal: Math.max(SCROLL_PADDING, 8) },
          ]}
        >
          {isLoading ? (
            // Skeleton placeholders
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} pulse={skeletonPulse} />)
          ) : restaurants.length === 0 ? (
            <View style={[styles.emptyState, { width: CARD_WIDTH }]}>
              <Text style={styles.emptyText}>No matches found. Try adjusting your filters.</Text>
            </View>
          ) : (
            restaurants.map((card) => {
              const dist = getDistance(card);
              return (
                <Pressable
                  key={card.id}
                  style={{ marginHorizontal: CARD_MARGIN }}
                  onPress={() => openCard(card)}
                >
                  <Card
                    header={card.header}
                    imageURL={card.imageURLs?.[0] ?? card.imageURL}
                    label={card.label}
                    priceRange={card.priceRange}
                    rating={card.rating}
                    description={card.caption}
                  />
                  {dist ? (
                    <View style={styles.distancePill}>
                      <Feather name="map-pin" size={11} color="#555" />
                      <Text style={styles.distanceText}>{dist}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* ── Footer ── */}
      <View style={styles.bottomContainer}>
        <Text style={styles.topText}>Waiting for others...</Text>
        <View style={styles.imageStack}>
          {/* Two participants already ready */}
          <View style={[styles.userAvatar, styles.userAvatarReady]}>
            <Feather name="check" size={15} color="white" />
          </View>
          <View style={[styles.userAvatar, styles.userAvatarReady, styles.userAvatarOffset]}>
            <Feather name="check" size={15} color="white" />
          </View>
          {/* One participant still pending */}
          <Image
            style={[styles.userImage, styles.userAvatarOffset]}
            source={require("../assets/images/sam.jpg")}
          />
          {/* More participants indicator */}
          <View style={[styles.userAvatar, styles.userAvatarMore, styles.userAvatarOffset]}>
            <Text style={styles.moreDotsText}>···</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonWrapper}>
        {/* No-results nudge — only shown once loading is done and list is empty */}
        {!isLoading && restaurants.length === 0 && (
          <View style={styles.noResultsHint}>
            <Feather name="alert-circle" size={15} color="#ba1a1a" />
            <Text style={styles.noResultsHintText}>
              No restaurants found near you. Go back and widen your search radius or remove filters.
            </Text>
          </View>
        )}
        <MyButton
          onClick={() =>
            router.push({
              pathname: "/pickBan",
              params: { restaurants: JSON.stringify(restaurants), sessionId: sessionId ?? "" },
            })
          }
          style={[
            styles.readyButton,
            (isLoading || restaurants.length === 0) && styles.readyButtonDisabled,
          ]}
          disabled={isLoading || restaurants.length === 0}
        >
          <Text style={styles.readyButtonText}>{isLoading ? "Loading…" : "I'm Ready"}</Text>
          {!isLoading && restaurants.length > 0 && (
            <Feather name="user-check" size={16} color="white" />
          )}
        </MyButton>
      </View>

      {/* ── Detail modal ── */}
      <Modal
        visible={!!selectedCard}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedCard(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setSelectedCard(null)} />

          <View style={styles.sheet}>
            <View style={styles.handle} />

            {/* Image gallery */}
            <View style={styles.galleryContainer}>
              <ScrollView
                ref={galleryRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onGalleryScroll}
                scrollEventThrottle={16}
                style={{ height: GALLERY_HEIGHT }}
              >
                {modalImages.length > 0 ? (
                  modalImages.map((uri, idx) => (
                    <Image
                      key={idx}
                      source={{ uri }}
                      style={{ width, height: GALLERY_HEIGHT, resizeMode: "cover" }}
                    />
                  ))
                ) : (
                  <View style={[{ width, height: GALLERY_HEIGHT }, styles.galleryPlaceholder]}>
                    <Feather name="image" size={48} color="#ccc" />
                  </View>
                )}
              </ScrollView>

              {modalImages.length > 1 && (
                <View style={styles.dotsRow}>
                  {modalImages.map((_, idx) => (
                    <View
                      key={idx}
                      style={[styles.dot, idx === activeImageIdx && styles.dotActive]}
                    />
                  ))}
                </View>
              )}

              <Pressable style={styles.closeBtn} onPress={() => setSelectedCard(null)}>
                <View style={styles.closeBtnInner}>
                  <Feather name="x" size={18} color="white" />
                </View>
              </Pressable>
            </View>

            {/* Scrollable content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.detailContent}
            >
              {/* Chips */}
              <View style={styles.chipRow}>
                {selectedCard?.label && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{selectedCard.label}</Text>
                  </View>
                )}
                {selectedCard?.priceRange && (
                  <View style={[styles.chip, styles.chipOutline]}>
                    <Text style={[styles.chipText, styles.chipTextDark]}>
                      {selectedCard.priceRange}
                    </Text>
                  </View>
                )}
                {selectedCard?.rating && (
                  <View style={[styles.chip, styles.chipOutline]}>
                    <Text style={[styles.chipText, styles.chipTextDark]}>
                      ★ {selectedCard.rating}
                    </Text>
                  </View>
                )}
                {selectedCard &&
                  (() => {
                    const d = getDistance(selectedCard);
                    return d ? (
                      <View style={[styles.chip, styles.chipOutline]}>
                        <Text style={[styles.chipText, styles.chipTextDark]}>📍 {d}</Text>
                      </View>
                    ) : null;
                  })()}
              </View>

              <Text style={styles.modalName}>{selectedCard?.header}</Text>

              {selectedCard?.address ? (
                <Text style={styles.modalAddress}>{selectedCard.address}</Text>
              ) : null}

              <View style={styles.divider} />

              <Text style={styles.sectionLabel}>ABOUT</Text>
              <Text style={styles.modalDesc}>{selectedCard?.caption}</Text>

              {(selectedCard?.popularItems?.length ?? 0) > 0 && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.sectionLabel}>POPULAR ITEMS</Text>
                  {selectedCard!.popularItems!.map((item, idx) => (
                    <View key={idx} style={styles.popularRow}>
                      <View style={styles.popularDot} />
                      <Text style={styles.popularItem}>{item}</Text>
                    </View>
                  ))}
                </>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    width: "100%",
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
  titleContainer: { alignItems: "center", justifyContent: "center" },
  topText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    letterSpacing: 1.5,
    color: "#444",
    textAlign: "center",
  },
  bottomText: {
    fontFamily: "Newsreader_400Regular_Italic",
    fontSize: 22,
    color: "#000",
    textAlign: "center",
    marginTop: 2,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 30,
    backgroundColor: "#d9d9d9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#a7a7a7",
  },

  // ── Title block ──
  middleContainer: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 16,
    paddingBottom: 4,
  },
  shortList: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 40,
    color: "#000",
    textAlign: "center",
  },
  shortDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#444",
    marginTop: 6,
    lineHeight: 19,
    textAlign: "center",
  },

  // ── Scroll ──
  scrollWrapper: { flex: 1, justifyContent: "center" },
  scrollContainer: { alignItems: "center" },
  emptyState: { justifyContent: "center", alignItems: "center", paddingVertical: 60 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 15, color: "#888", textAlign: "center" },

  // Distance pill
  distancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    marginTop: 6,
    marginLeft: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#f0eeea",
  },
  distanceText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#444",
  },

  // ── Footer ──
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 8,
  },
  userImage: { width: 38, height: 38, borderRadius: 19, borderColor: "white", borderWidth: 2.5 },
  imageStack: { flexDirection: "row", alignItems: "center" },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2.5,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarOffset: { marginLeft: -10 },
  userAvatarReady: { backgroundColor: "#1b1b1b" },
  userAvatarMore: { backgroundColor: "#d9d9d9" },
  moreDotsText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#555",
    letterSpacing: 2,
  },

  buttonWrapper: { paddingHorizontal: 16, paddingBottom: 8 },
  readyButton: { width: "100%", height: 56, justifyContent: "center" },
  readyButtonDisabled: { opacity: 0.4 },
  noResultsHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fff4f4",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ffd6d6",
  },
  noResultsHintText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#ba1a1a",
    flex: 1,
    lineHeight: 18,
  },
  readyButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },

  // ── Modal ──
  modalRoot: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.93,
    overflow: "hidden",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D0D0D0",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  galleryContainer: { position: "relative" },
  galleryPlaceholder: {
    backgroundColor: "#F0EEEA",
    justifyContent: "center",
    alignItems: "center",
  },
  dotsRow: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: { backgroundColor: "#fff", width: 18, borderRadius: 3 },
  closeBtn: { position: "absolute", top: 14, right: 14 },
  closeBtnInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  detailContent: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "#000",
    borderRadius: 20,
  },
  chipOutline: { backgroundColor: "#efefef" },
  chipText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  chipTextDark: { color: "#888" },
  modalName: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 34,
    color: "#1B1B1B",
    lineHeight: 40,
    marginBottom: 4,
  },
  modalAddress: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#888",
    marginBottom: 4,
    lineHeight: 18,
  },
  divider: { height: 1, backgroundColor: "#EBEBEB", marginVertical: 16 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 2,
    color: "#888",
    marginBottom: 10,
  },
  modalDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 24,
    color: "#3A3A3A",
  },
  popularRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  popularDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#1B1B1B",
    marginTop: 8,
    marginRight: 12,
  },
  popularItem: {
    fontFamily: "Newsreader_400Regular",
    fontSize: 18,
    color: "#1B1B1B",
    lineHeight: 24,
    flex: 1,
  },
});

export default ResultScreen;
