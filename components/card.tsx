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
  description?: string;
}

const Card = ({ header, imageURL, label, description }: MyCardProps) => {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Newsreader_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {imageURL && <Image source={{ uri: imageURL }} style={styles.image} />}

        <View style={styles.label}>
          <Text style={styles.labelText}>{label}</Text>
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
  label: {
    marginTop: 20,
    marginLeft: 25,
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: "#000000",
    borderRadius: 30,
    alignSelf: "flex-start",
  },
  labelText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
    textTransform: "uppercase",
  },
  headerText: {
    fontSize: 32,
    marginLeft: 25,
    marginTop: 15,
    fontFamily: "Newsreader_400Regular",
    color: "#000000",
  },
  descriptionText: {
    fontFamily: "Inter_400Regular",
    marginLeft: 25,
    marginRight: 25,
    marginTop: 10,
    fontSize: 15,
    lineHeight: 20,
    color: "#444444",
  },
});

export default Card;
