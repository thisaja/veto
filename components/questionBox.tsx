import Radiobutton from "@/components/radiobutton";
import { Inter_400Regular, Inter_700Bold } from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

interface QuestionBoxProps {
  question?: string;
  iconURL?: string;
  answerOptions?: string[];
  onSelect: (value: string) => void;
}
const QuestionBox = ({
  question,
  iconURL,
  answerOptions = ["1", "2", "3"],
  onSelect,
}: QuestionBoxProps) => {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });
  return (
    <View style={styles.container}>
      <View style={styles.imageCon}>
        {iconURL && <Image source={{ uri: iconURL }} style={styles.image} />}
      </View>
      <Text style={styles.questionStyle} numberOfLines={2}>
        {question}
      </Text>
      <View style={styles.buttonCon}>
        <Radiobutton options={answerOptions} onSelect={onSelect} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    height: 500,
    boxShadow: "0 10px 25px 18px rgba(0, 0, 0, 0.1)",
  },
  imageCon: {
    marginLeft: 150,
    marginTop: 30,
  },
  image: {
    width: 50,
    height: 50,
    resizeMode: "cover",
  },
  questionStyle: {
    color: "black",
    fontFamily: "Inter_700Bold",
    fontSize: 25,
    textAlign: "justify",
    marginTop: 15,
    marginLeft: 50,
    marginRight: 50,
  },
  buttonCon: {
    marginTop: 60,
    marginLeft: 40,
  },
});

export default QuestionBox;
