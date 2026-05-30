/**
 * 8 illustrated preset avatars built with react-native-svg.
 * All share the same circular style; they differ in palette, eyes, mouth, and one
 * optional accent (glasses / blush / cap / freckles).
 *
 * Usage:
 *   import { PresetAvatar, PRESET_COUNT } from "@/components/PresetAvatars";
 *   <PresetAvatar index={3} size={64} />
 */
import React from "react";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";

export const PRESET_COUNT = 8;

type Config = {
  bg: string;
  face: string;
  pupil: string;
  eyeStyle: "normal" | "wide" | "sleepy" | "dot";
  mouthStyle: "smile" | "grin" | "neutral";
  extra?: "glasses" | "blush" | "cap" | "freckles";
  accentColor?: string;
};

const CONFIGS: Config[] = [
  // 0 — Coral · calm
  { bg: "#F4845F", face: "#FFDBB4", pupil: "#1b1b1b", eyeStyle: "normal",  mouthStyle: "smile",   },
  // 1 — Lavender · happy
  { bg: "#A78BCA", face: "#FFDBB4", pupil: "#1b1b1b", eyeStyle: "wide",    mouthStyle: "grin",    },
  // 2 — Sage · glasses
  { bg: "#6DAA8A", face: "#FFDBB4", pupil: "#1b1b1b", eyeStyle: "normal",  mouthStyle: "smile",   extra: "glasses", accentColor: "#1b1b1b" },
  // 3 — Amber · blushing
  { bg: "#E8A835", face: "#FFDBB4", pupil: "#1b1b1b", eyeStyle: "normal",  mouthStyle: "smile",   extra: "blush",   accentColor: "#F4A0A0" },
  // 4 — Sky · round eyes
  { bg: "#5BAED6", face: "#FFDBB4", pupil: "#1b1b1b", eyeStyle: "dot",     mouthStyle: "neutral", },
  // 5 — Rose · sleepy
  { bg: "#DC8B8B", face: "#FFDBB4", pupil: "#1b1b1b", eyeStyle: "sleepy",  mouthStyle: "smile",   },
  // 6 — Teal · cap
  { bg: "#3FADA8", face: "#FFDBB4", pupil: "#1b1b1b", eyeStyle: "normal",  mouthStyle: "grin",    extra: "cap",     accentColor: "#1b1b1b" },
  // 7 — Warm stone · freckles
  { bg: "#C28B60", face: "#FFE0BD", pupil: "#1b1b1b", eyeStyle: "normal",  mouthStyle: "smile",   extra: "freckles", accentColor: "#C06030" },
];

type Props = { index: number; size?: number };

export function PresetAvatar({ index, size = 64 }: Props) {
  const cfg = CONFIGS[index % PRESET_COUNT];
  const s   = 100; // internal viewBox units

  // ── Eyes ──────────────────────────────────────────────────────────────────
  const Eyes = () => {
    switch (cfg.eyeStyle) {
      case "wide":
        return (
          <>
            <Circle cx="37" cy="47" r="6"  fill={cfg.pupil} />
            <Circle cx="63" cy="47" r="6"  fill={cfg.pupil} />
            <Circle cx="39" cy="45" r="2"  fill="#fff" />
            <Circle cx="65" cy="45" r="2"  fill="#fff" />
          </>
        );
      case "sleepy":
        // half-arc eyes (closed/droopy)
        return (
          <>
            <Path d="M 31 47 A 6 5 0 0 1 43 47" stroke={cfg.pupil} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <Path d="M 57 47 A 6 5 0 0 1 69 47" stroke={cfg.pupil} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        );
      case "dot":
        // big round sparkly eyes
        return (
          <>
            <Circle cx="37" cy="47" r="7"  fill={cfg.pupil} />
            <Circle cx="63" cy="47" r="7"  fill={cfg.pupil} />
            <Circle cx="40" cy="44" r="2.5" fill="#fff" />
            <Circle cx="66" cy="44" r="2.5" fill="#fff" />
          </>
        );
      default: // normal
        return (
          <>
            <Circle cx="37" cy="47" r="5"  fill={cfg.pupil} />
            <Circle cx="63" cy="47" r="5"  fill={cfg.pupil} />
            <Circle cx="39" cy="45" r="1.8" fill="#fff" />
            <Circle cx="65" cy="45" r="1.8" fill="#fff" />
          </>
        );
    }
  };

  // ── Mouth ─────────────────────────────────────────────────────────────────
  const Mouth = () => {
    switch (cfg.mouthStyle) {
      case "grin":
        return <Path d="M 34 64 Q 50 76 66 64" stroke={cfg.pupil} strokeWidth="2.5" fill="none" strokeLinecap="round" />;
      case "neutral":
        return <Path d="M 38 64 L 62 64" stroke={cfg.pupil} strokeWidth="2.5" strokeLinecap="round" />;
      default: // smile
        return <Path d="M 37 63 Q 50 72 63 63" stroke={cfg.pupil} strokeWidth="2.5" fill="none" strokeLinecap="round" />;
    }
  };

  // ── Extra accent ──────────────────────────────────────────────────────────
  const Extra = () => {
    if (!cfg.extra) return null;
    const c = cfg.accentColor ?? "#1b1b1b";
    switch (cfg.extra) {
      case "glasses":
        return (
          <>
            {/* left lens */}
            <Rect x="28" y="41" width="18" height="12" rx="5" ry="5" stroke={c} strokeWidth="2" fill="none" />
            {/* right lens */}
            <Rect x="54" y="41" width="18" height="12" rx="5" ry="5" stroke={c} strokeWidth="2" fill="none" />
            {/* bridge */}
            <Path d="M 46 47 L 54 47" stroke={c} strokeWidth="2" />
            {/* arms */}
            <Path d="M 28 47 L 22 47" stroke={c} strokeWidth="2" />
            <Path d="M 72 47 L 78 47" stroke={c} strokeWidth="2" />
          </>
        );
      case "blush":
        return (
          <>
            <Ellipse cx="28" cy="60" rx="8" ry="5" fill={c} opacity={0.45} />
            <Ellipse cx="72" cy="60" rx="8" ry="5" fill={c} opacity={0.45} />
          </>
        );
      case "cap":
        return (
          <>
            {/* brim */}
            <Rect x="22" y="30" width="56" height="6"  rx="3" fill={c} />
            {/* crown */}
            <Rect x="28" y="10" width="44" height="22" rx="8" fill={c} />
          </>
        );
      case "freckles":
        return (
          <>
            <Circle cx="27" cy="58" r="2" fill={c} opacity={0.5} />
            <Circle cx="33" cy="62" r="2" fill={c} opacity={0.5} />
            <Circle cx="29" cy="64" r="2" fill={c} opacity={0.5} />
            <Circle cx="73" cy="58" r="2" fill={c} opacity={0.5} />
            <Circle cx="67" cy="62" r="2" fill={c} opacity={0.5} />
            <Circle cx="71" cy="64" r="2" fill={c} opacity={0.5} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${s} ${s}`}>
      {/* background */}
      <Circle cx="50" cy="50" r="50" fill={cfg.bg} />
      {/* face */}
      <Circle cx="50" cy="56" r="30" fill={cfg.face} />
      {/* cap must render before face features if it sits on top */}
      {cfg.extra === "cap" && <Extra />}
      <Eyes />
      {cfg.extra !== "cap" && <Extra />}
      <Mouth />
    </Svg>
  );
}

/** Returns the storage key for a preset index, e.g. "__preset_3" */
export function presetKey(index: number): string {
  return `__preset_${index}`;
}

/** Parses a storage key back to an index, or returns null if it's not a preset. */
export function parsePresetKey(value: string | null | undefined): number | null {
  if (!value?.startsWith("__preset_")) return null;
  const n = parseInt(value.replace("__preset_", ""), 10);
  return isNaN(n) ? null : n;
}
