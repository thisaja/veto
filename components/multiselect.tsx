import { Inter_400Regular, Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { useState } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import MyButton from "./button";

interface MultiselectProps {
  options: string[];
  style?: StyleProp<ViewStyle>;
}
const multiselectStyles = StyleSheet.create({
  baseMultiselectStyle: {
    width: "80%",
    height: "auto",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
const Multiselect = ({ style, options }: MultiselectProps) => {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
  });
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);

  const clickOption = (index: number) => {
    if (selectedOptions.includes(index)) {
      setSelectedOptions(
        selectedOptions.flatMap((num, _) => {
          if (num === index) return [];
          return [num];
        }),
      );
    } else {
      setSelectedOptions([...selectedOptions, index]);
    }
  };
  return (
    <View style={[multiselectStyles.baseMultiselectStyle, style]}>
      {options.map((value, index) => {
        return (
          <MyButton
            key={index}
            style={{
              alignSelf: "flex-start",
              width: "auto",
              height: "auto",
              paddingInline: 16,
              paddingBlock: 12,
              backgroundColor: selectedOptions.includes(index) ? "black" : "white",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: selectedOptions.includes(index) ? "black" : "#CFC4C5",
            }}
            onClick={() => clickOption(index)}
          >
            <Text
              style={{
                color: selectedOptions.includes(index) ? "white" : "black",
                fontFamily: "Inter_400Regular",
                fontSize: 12,
              }}
            >
              {value}
            </Text>
          </MyButton>
        );
      })}
    </View>
  );
};
export default Multiselect;
