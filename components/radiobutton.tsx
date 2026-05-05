import { Text, View } from "react-native";
import MyButton from "./button";

interface RadiobuttonProps {
  options: string[];
  onClick: (val: string) => void;
  value: string;
}
const Radiobutton = ({ options, onClick, value }: RadiobuttonProps) => {
  return (
    <View style={{ gap: 16 }}>
      {options.map((option, index) => {
        const isSelected = option === value;
        return (
          <MyButton
            key={index}
            onClick={() => {
              onClick(options[index]);
            }}
            style={{ backgroundColor: isSelected ? "black" : "#e4e2dd" }}
          >
            <Text style={{ color: isSelected ? "white" : "#1b1c19" }}>
              {option}
            </Text>
          </MyButton>
        );
      })}
    </View>
  );
};

export default Radiobutton;
