import { Feather } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { PRESET_COUNT, PresetAvatar } from "./PresetAvatars";

type Props = {
  selected: number | null;
  onSelect: (index: number) => void;
};

/**
 * Horizontal/wrapped grid of all 8 preset avatars.
 * Tapping one calls onSelect with its index.
 */
export default function AvatarPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: PRESET_COUNT }, (_, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => onSelect(i)}
          activeOpacity={0.8}
          style={[styles.cell, selected === i && styles.cellSelected]}
        >
          <PresetAvatar index={i} size={56} />
          {selected === i && (
            <View style={styles.checkBadge}>
              <Feather name="check" size={10} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  cell: {
    borderRadius: 32,
    padding: 3,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cellSelected: {
    borderColor: "#1b1b1b",
  },
  checkBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#1b1b1b",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
});
