import { Text, TextStyle, View } from "react-native";
import MyButton from "./button";

interface RadiobuttonProps {
  options: string[];
  onClick: (val: string) => void;
  value: string;
  fontFamily?: string;
}

const Radiobutton = ({
  options,
  onClick,
  value,
  fontFamily = "YourFontName",
}: RadiobuttonProps) => {
  return (
    <View style={{ gap: 16 }}>
      {options.map((option, index) => {
        const isSelected = option === value;

        const textStyle: TextStyle = {
          fontFamily: fontFamily,
          color: isSelected ? "white" : "#1b1c19",
          fontSize: 17,
        };

        return (
          <MyButton
            key={index}
            onClick={() => {
              onClick(options[index]);
            }}
            style={{ backgroundColor: isSelected ? "black" : "#e4e2dd" }}
          >
            <Text style={textStyle}>{option}</Text>
          </MyButton>
        );
      })}
    </View>
  );
};

export default Radiobutton;
