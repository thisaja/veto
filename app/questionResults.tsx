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
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
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

type Restaurant = {
  id: number;
  header: string;
  imageURL: string;
  label: string;
  caption: string;
};

const ResultScreen = () => {
  const router = useRouter();
  const { restaurants: restaurantsParam } = useLocalSearchParams<{ restaurants: string }>();
  const [selectedCard, setSelectedCard] = useState<Restaurant | null>(null);

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

      {/* ── Card scroll — vertically centred, snaps one card at a time ── */}
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
                onPress={() => setSelectedCard(card)}
              >
                <Card
                  header={card.header}
                  imageURL={card.imageURL}
                  label={card.label}
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
          <Image style={[styles.userImage, { zIndex: 1 }]} source={require("../assets/images/sam.jpg")} />
          <Image style={[styles.userImage, { zIndex: 2 }]} source={require("../assets/images/tt.png")} />
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
          {/* Dim backdrop — tap to close */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedCard(null)}>
            <View style={styles.backdrop} />
          </Pressable>

          {/* Bottom sheet — absorbs taps so they don't reach the backdrop */}
          <Pressable style={styles.sheet} onPress={() => {}}>
            {/* Drag handle */}
            <View style={styles.handle} />

            {/* Hero image with close button */}
            <View style={styles.heroContainer}>
              {selectedCard?.imageURL ? (
                <Image source={{ uri: selectedCard.imageURL }} style={styles.heroImage} />
              ) : (
                <View style={[styles.heroImage, styles.heroPlaceholder]}>
                  <Feather name="image" size={40} color="#ccc" />
                </View>
              )}
              <Pressable style={styles.closeBtn} onPress={() => setSelectedCard(null)}>
                <View style={styles.closeBtnInner}>
                  <Feather name="x" size={18} color="white" />
                </View>
              </Pressable>
            </View>

            {/* Scrollable detail content */}
            <ScrollView
              style={styles.detailScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.detailContent}
            >
              {/* Label chip + name */}
              <View style={styles.chipRow}>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{selectedCard?.label}</Text>
                </View>
              </View>
              <Text style={styles.modalName}>{selectedCard?.header}</Text>

              {/* Divider */}
              <View style={styles.divider} />

              {/* About */}
              <Text style={styles.sectionLabel}>ABOUT</Text>
              <Text style={styles.modalDesc}>{selectedCard?.caption}</Text>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Action buttons */}
              <View style={styles.actionRow}>
                <View style={styles.actionBtn}>
                  <View style={styles.actionIcon}>
                    <Feather name="map-pin" size={20} color="#1B1B1B" />
                  </View>
                  <Text style={styles.actionLabel}>Directions</Text>
                </View>
                <View style={styles.actionBtn}>
                  <View style={styles.actionIcon}>
                    <Feather name="phone" size={20} color="#1B1B1B" />
                  </View>
                  <Text style={styles.actionLabel}>Call</Text>
                </View>
                <View style={styles.actionBtn}>
                  <View style={styles.actionIcon}>
                    <Feather name="share-2" size={20} color="#1B1B1B" />
                  </View>
                  <Text style={styles.actionLabel}>Share</Text>
                </View>
                <View style={styles.actionBtn}>
                  <View style={styles.actionIcon}>
                    <Feather name="bookmark" size={20} color="#1B1B1B" />
                  </View>
                  <Text style={styles.actionLabel}>Save</Text>
                </View>
              </View>

              <View style={{ height: 32 }} />
            </ScrollView>
          </Pressable>
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
  titleContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
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
  scrollWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  scrollContainer: {
    alignItems: "center",
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#888",
    textAlign: "center",
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
  userImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderColor: "white",
    borderWidth: 4,
  },
  imageStack: {
    flexDirection: "row",
  },
  buttonWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  readyButton: {
    width: "100%",
    height: 56,
    justifyContent: "center",
  },
  readyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  // ── Modal ──
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: height * 0.88,
    overflow: "hidden",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D0D0D0",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },

  // Hero image
  heroContainer: {
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: 240,
    resizeMode: "cover",
  },
  heroPlaceholder: {
    backgroundColor: "#F0EEEA",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 14,
  },
  closeBtnInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Detail content
  detailScroll: {
    flexGrow: 0,
  },
  detailContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: "#000",
    borderRadius: 30,
    alignSelf: "flex-start",
  },
  chipText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalName: {
    fontFamily: "Newsreader_600SemiBold",
    fontSize: 34,
    color: "#1B1B1B",
    lineHeight: 40,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#EBEBEB",
    marginVertical: 16,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 2,
    color: "#888",
    marginBottom: 8,
  },
  modalDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 24,
    color: "#3A3A3A",
  },

  // Action buttons
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F2F0EC",
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#1B1B1B",
  },
});

export default ResultScreen;
