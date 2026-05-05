import { Inter_400Regular } from "@expo-google-fonts/inter";
import { Newsreader_400Regular } from "@expo-google-fonts/newsreader";
import { useFonts } from "expo-font";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

interface MyCardProps {
  onClick?: () => void;
  width?: number;
  height?: number;
  backgroundColour?: string;
  header?: string;
  imageURL?: string;
  label?: string;
  description?: string;
}

const Card = ({
  onClick,
  header,
  imageURL,
  label,
  description,
}: MyCardProps) => {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Newsreader_400Regular,
  });
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {imageURL && <Image source={{ uri: imageURL }} style={styles.image} />}

        <View style={styles.label}>
          <Text style={styles.labelText}>{label}</Text>
        </View>
        <Text style={styles.headerText}>{header}</Text>
        <Text
          style={styles.descriptionText}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {description}
        </Text>
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  image: {
    width: 350,
    height: 250,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    resizeMode: "cover",
  },
  container: {
    marginTop: 50,
    marginBottom: 50,
    marginLeft: 28,
    marginRight: 50,
    backgroundColor: "#FFFFFF",
    borderColor: "#aaaaaa80",
    borderRadius: 50,
    borderWidth: 1,
    width: 350,
    height: 400,
  },
  label: {
    marginTop: 7,
    marginBottom: 7,
    marginLeft: 7,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#000000",
    borderRadius: 30,
    width: 80,
    height: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  labelText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  headerText: {
    fontSize: 30,
    marginLeft: 7,
    fontWeight: "bold",
    fontFamily: "Inter_400Regular",
  },
  descriptionText: {
    fontFamily: "Inter_400Regular",
    marginLeft: 7,
    marginTop: 7,
    marginRight: 7,
  },
});

export default Card;
