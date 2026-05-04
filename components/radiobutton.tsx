import { useState } from "react";
import { Text, View } from "react-native";
import MyButton from "./button";

interface RadiobuttonProps {
  options: string[]
}
const Radiobutton = ({ options }: RadiobuttonProps) => {
  const [selectedOption, setSelectedOption] = useState(0);

  return (
    <View style={{ gap: 16 }}>
      {options.map((value, index) => {
        return (
          <MyButton
            key={index}
            onClick={() => setSelectedOption(index)}
            style={{ backgroundColor: selectedOption === index ? "black" : "#e4e2dd" }}
          >
            <Text style={{ color: selectedOption === index ? "white" : "#1b1c19" }}>{value}</Text>
          </MyButton>
        )
      })}
    </View>
  );
};


export default Radiobutton;
