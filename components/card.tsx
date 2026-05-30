import { Inter_400Regular } from "@expo-google-fonts/inter";
import { Newsreader_400Regular } from "@expo-google-fonts/newsreader";
import { useFonts } from "expo-font";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

interface MyCardProps {
  header?: string;
  imageURL?: string;
  label?: string;
  priceRange?: string;
  rating?: string;
  description?: string;
  distance?: string;
}

const Card = ({ header, imageURL, label, priceRange, rating, description, distance }: MyCardProps) => {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Newsreader_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <View style={styles.container}>

        {imageURL ? (
          <Image source={{ uri: imageURL }} style={styles.image} />
        ) : null}

        <View style={styles.labelsRow}>
          {label && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{label}</Text>
            </View>
          )}
          {priceRange && (
            <View style={[styles.chip, styles.chipOutline]}>
              <Text style={[styles.chipText, styles.chipTextDark]}>{priceRange}</Text>
            </View>
          )}
          {rating && (
            <View style={[styles.chip, styles.chipOutline]}>
              <Text style={[styles.chipText, styles.chipTextDark]}>★ {rating}</Text>
            </View>
          )}
          {distance && (
            <View style={[styles.chip, styles.chipOutline]}>
              <Text style={[styles.chipText, styles.chipTextDark]}>📍 {distance}</Text>
            </View>
          )}
        </View>

        <Text style={styles.headerText}>{header}</Text>

        <Text style={styles.descriptionText} numberOfLines={3} ellipsizeMode="tail">
          {description}
        </Text>
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderColor: "#aaaaaa80",
    borderRadius: 50,
    borderWidth: 1,
    width: 340,
    height: 450,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 220,
    resizeMode: "cover",
  },
  labelsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 16,
    marginLeft: 25,
    marginRight: 25,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "#000",
    borderRadius: 20,
  },
  chipOutline: {
    backgroundColor: "#efefef",
  },
  chipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipTextDark: {
    color: "#888",
  },
  headerText: {
    fontSize: 32,
    marginLeft: 25,
    marginTop: 12,
    fontFamily: "Newsreader_400Regular",
    color: "#000000",
  },
  descriptionText: {
    fontFamily: "Inter_400Regular",
    marginLeft: 25,
    marginRight: 25,
    marginTop: 8,
    fontSize: 15,
    lineHeight: 20,
    color: "#444444",
  },
});

export default Card;
