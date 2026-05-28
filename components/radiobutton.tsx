import { StyleSheet, Text, TextStyle, TouchableOpacity, View } from "react-native";

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
  fontFamily = "Inter_400Regular",
}: RadiobuttonProps) => {
  return (
    <View style={styles.container}>
      {options.map((option, index) => {
        const isSelected = option === value;
        const textStyle: TextStyle = {
          fontFamily,
          color: isSelected ? "white" : "#1b1c19",
          fontSize: 17,
          textAlign: "center",
        };

        return (
          <TouchableOpacity
            key={index}
            onPress={() => onClick(option)}
            style={[styles.button, { backgroundColor: isSelected ? "black" : "#e4e2dd" }]}
          >
            <Text style={textStyle}>{option}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
    alignItems: "center",
  },
  button: {
    width: 260,
    minHeight: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
});

export default Radiobutton;
