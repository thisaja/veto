import { Feather } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";
import { parsePresetKey, PresetAvatar } from "./PresetAvatars";

const PALETTE = ["#e4e2dd", "#ede8f0", "#e8f0ea", "#f0e8e8", "#e8ecf0"];

function bgColor(seed: string): string {
  const sum = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return PALETTE[sum % PALETTE.length];
}

function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

type Props = {
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  /** Seed for the background colour (userId or any stable string). Defaults to name. */
  colorSeed?: string;
  size?: number;
};

/**
 * Shows a profile photo if available, initials on a tinted background if name
 * is known, or a generic person icon as the final fallback.
 */
export default function Avatar({
  firstName,
  lastName,
  photoUrl,
  colorSeed,
  size = 48,
}: Props) {
  const radius = size / 2;
  const seed = colorSeed ?? `${firstName ?? ""}${lastName ?? ""}`;
  const bg   = bgColor(seed);
  const ini  = firstName && lastName ? initials(firstName, lastName) : null;
  const fontSize = Math.round(size * 0.33);

  // Preset avatar key stored in profilePicture field
  const presetIndex = parsePresetKey(photoUrl);
  if (presetIndex !== null) {
    return <PresetAvatar index={presetIndex} size={size} />;
  }

  if (photoUrl) {
    return (
      <Image
        key={photoUrl}
        source={{ uri: photoUrl }}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: radius, backgroundColor: bg }]}>
      {ini ? (
        <Text style={[styles.initials, { fontSize }]}>{ini}</Text>
      ) : (
        <Feather name="user" size={Math.round(size * 0.45)} color="#888" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  initials: { fontFamily: "Inter_600SemiBold", color: "#1b1b1b" },
});

/**
 * Converts a raw profilePicture DB value to the correct value for <Avatar photoUrl=...>.
 * Preset keys (e.g. "__preset_3") are returned as-is.
 * Real filenames get the uploads base URL prepended.
 */
export function buildAvatarUrl(raw: string | null | undefined, apiBase: string): string | null {
  if (!raw) return null;
  if (raw.startsWith("__preset_")) return raw;
  return `${apiBase}/uploads/${raw}`;
}
