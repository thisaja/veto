import React from "react";
import { StyleSheet, Text, View } from "react-native";
import * as ProgressIndicator from "react-native-progress";

interface MyProgressProp {
  size?: number;
  currentPage: number;
  pageTotal: number;
  color?: string;
}

const Progress = ({ size, currentPage, pageTotal, color }: MyProgressProp) => {
  const progressAmount = pageTotal > 0 ? currentPage / pageTotal : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {currentPage} of {pageTotal}
      </Text>
      <ProgressIndicator.Bar
        progress={progressAmount}
        color={color}
        width={size ?? null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  text: {
    fontFamily: "Inter_400Regular",
    marginBottom: 10,
    marginLeft: 155,
    justifyContent: "center",
    fontSize: 15,
  },
});

export default Progress;
