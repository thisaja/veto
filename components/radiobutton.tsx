import { useState } from "react";
import { View } from "react-native";
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
            text={value}
            onClick={() => setSelectedOption(index)}
            buttonStyle={{ backgroundColor: selectedOption == index ? "black" : "#e4e2dd" }}
            textStyle={{ color: selectedOption == index ? "white" : "#1b1c19" }}
          />
        )
      })}
    </View>
  );
};


export default Radiobutton;
