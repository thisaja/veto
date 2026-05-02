import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const Touchables = () => {
  const [activeButton, setActiveButton] = useState("Yes");

  const handlePress = (buttonName: string) => {
    setActiveButton(buttonName);
  };

  const renderButton = (label: string) => {
    const isActive = activeButton === label;

    return (
      <TouchableOpacity
        onPress={() => handlePress(label)}
        style={[styles.button, !isActive && styles.secondaryButton]}
      >
        <Text
          style={[styles.buttonText, !isActive && styles.secondaryButtonText]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {renderButton("Yes")}
      {renderButton("No")}
      {renderButton("Don't Care")}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 100,
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 16,
    alignItems: "center",
  },
  button: {
    width: 276,
    height: 60,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 9999,
    backgroundColor: "#000000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "400",
    textAlign: "center",
  },
  secondaryButton: {
    backgroundColor: "#E8E8E8",
  },
  secondaryButtonText: {
    color: "#1B1B1B",
  },
});

export default Touchables;
