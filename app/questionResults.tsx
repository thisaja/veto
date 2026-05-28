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
import React, { useMemo } from "react";
import { Dimensions, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Card is 340px wide (see card.tsx). Each card slot = card + side margins.
const CARD_WIDTH = 340;
const CARD_MARGIN = 12; // each side → 24px total gap between cards
const CARD_SLOT = CARD_WIDTH + CARD_MARGIN * 2;
// Center the first and last card by padding the scroll content
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
      {/* Header */}
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

      {/* Title */}
      <View style={styles.middleContainer}>
        <Text style={styles.shortList}>The Shortlist</Text>
        <Text style={styles.shortDesc}>
          Your group has agreed on these spots. Review the options before locking in your choice.
        </Text>
      </View>

      {/* Card scroll — snaps one card at a time, centered */}
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
              <View key={card.id} style={{ marginHorizontal: CARD_MARGIN }}>
                <Card
                  header={card.header}
                  imageURL={card.imageURL}
                  label={card.label}
                  description={card.caption}
                />
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Footer */}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
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
  scrollWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  scrollContainer: {
    alignItems: "flex-start",
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
});

export default ResultScreen;
