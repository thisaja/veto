import MyButton from "@/components/button";
import Card from "@/components/card";
import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
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

const CARD_WIDTH = 340;
const CARD_MARGIN = 12;
const CARD_SLOT = CARD_WIDTH + CARD_MARGIN * 2;
const SCROLL_PADDING = (width - CARD_WIDTH) / 2 - CARD_MARGIN;
const GALLERY_HEIGHT = 260;

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

const ResultScreen = () => {
  const router = useRouter();
  const { restaurants: restaurantsParam } = useLocalSearchParams<{ restaurants: string }>();
  const [selectedCard, setSelectedCard] = useState<Restaurant | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const galleryRef = useRef<ScrollView>(null);

  const restaurants: Restaurant[] = useMemo(() => {
    try {
      return restaurantsParam ? JSON.parse(restaurantsParam) : [];
    } catch {
      return [];
    }
  }, [restaurantsParam]);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_400Regular,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    Newsreader_400Regular_Italic,
  });

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
    ? (selectedCard.imageURLs?.length ? selectedCard.imageURLs : [selectedCard.imageURL]).filter(Boolean)
    : [];

  return (
    <SafeAreaView style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <MyButton style={styles.sideButton} onClick={() => router.back()}>
          <Feather name="arrow-left" size={24} color="black" />
        </MyButton>
        <View style={styles.titleContainer}>
          <Text style={styles.topText}>FRIDAY NIGHT DINNER</Text>
          <Text style={styles.bottomText}>{restaurants.length} Matches Found</Text>
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
          Your group has agreed on these spots. Review the options before locking in your choice.
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
          {restaurants.length === 0 ? (
            <View style={[styles.emptyState, { width: CARD_WIDTH }]}>
              <Text style={styles.emptyText}>No matches found. Try adjusting your filters.</Text>
            </View>
          ) : (
            restaurants.map((card) => (
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
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>

      {/* ── Footer ── */}
      <View style={styles.bottomContainer}>
        <Text style={styles.topText}>Waiting for others...</Text>
        <View style={styles.imageStack}>
          <Image
            style={[styles.userImage, { zIndex: 1 }]}
            source={require("../assets/images/sam.jpg")}
          />
          <Image
            style={[styles.userImage, { zIndex: 2 }]}
            source={require("../assets/images/tt.png")}
          />
        </View>
      </View>

      <View style={styles.buttonWrapper}>
        <MyButton onClick={() => router.push("/matched")} style={styles.readyButton}>
          <Text style={styles.readyButtonText}>I'm Ready</Text>
          <Feather name="user-check" size={16} color="white" />
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
          {/* Dim backdrop */}
          <Pressable style={styles.backdrop} onPress={() => setSelectedCard(null)} />

          {/* Bottom sheet */}
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
                    <View key={idx} style={[styles.dot, idx === activeImageIdx && styles.dotActive]} />
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
              </View>

              <Text style={styles.modalName}>{selectedCard?.header}</Text>
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
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },

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

  // ── Footer ──
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 8,
  },
  userImage: { width: 38, height: 38, borderRadius: 19, borderColor: "white", borderWidth: 4 },
  imageStack: { flexDirection: "row" },
  buttonWrapper: { paddingHorizontal: 16, paddingBottom: 8 },
  readyButton: { width: "100%", height: 56, justifyContent: "center" },
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

  // Gallery
  galleryContainer: { position: "relative" },
  galleryPlaceholder: { backgroundColor: "#F0EEEA", justifyContent: "center", alignItems: "center" },
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
  dotActive: {
    backgroundColor: "#fff",
    width: 18,
    borderRadius: 3,
  },
  closeBtn: { position: "absolute", top: 14, right: 14 },
  closeBtnInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Detail content
  detailContent: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#000",
    borderRadius: 20,
  },
  chipOutline: {
    backgroundColor: "#efefef",
  },
  chipText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  chipTextDark: {
    color: "#888",
  },
  modalName: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 34,
    color: "#1B1B1B",
    lineHeight: 40,
    marginBottom: 16,
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

  // Popular items
  popularRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
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
