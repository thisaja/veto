import MyButton from "@/components/button";
import Multiselect from "@/components/multiselect";
import { globalStyles } from "@/constants/global";
import { useSession } from "@/context/SessionContext";
import { useToast } from "@/context/ToastContext";
import { apiFetch } from "@/lib/api";
import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import {
  Newsreader_400Regular,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import { Feather } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Circle, LatLng, Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE = "http://10.0.0.129:5000";
const DIETARY_OPTIONS = [
  "Vegan",
  "Vegetarian",
  "Gluten-Free",
  "Halal",
  "Nut Allergy",
  "Kosher",
];

const CreateSessionScreen = () => {
  const [fontsLoaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  const [marker, setMarker] = useState<LatLng>({
    latitude: 37.78825,
    longitude: -122.4324,
  });
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  });
  const [radius, setRadius] = useState<number>(3);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<number[]>([]);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const { startSession, setUserLocation } = useSession();
  const { showError } = useToast();

  // ── Auto-locate ────────────────────────────────────────────────────────────
  const handleUseMyLocation = async () => {
    setLocationError(null);
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Location permission denied. Enable it in Settings or drag the pin.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;
      setMarker({ latitude, longitude });
      setMapRegion({ latitude, longitude, latitudeDelta: 0.04, longitudeDelta: 0.04 });
      setUserLocation({ latitude, longitude });
    } catch (err) {
      console.error("Location error:", err);
      setLocationError("Couldn't get your location. Drag the pin instead.");
    } finally {
      setLocating(false);
    }
  };

  const [creating, setCreating] = useState(false);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSetFilters = async () => {
    setCreateError(null);
    setCreating(true);
    try {
      const newSessionId = await startSession();
      if (!newSessionId) {
        setCreateError("Couldn't create a session. Check your connection and try again.");
        return;
      }

      setUserLocation({ latitude: marker.latitude, longitude: marker.longitude });

      try {
        await apiFetch(`${API_BASE}/api/places/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: marker.latitude,
            longitude: marker.longitude,
            radius,
            dietaryRestrictions,
            sessionId: newSessionId,
          }),
        });
      } catch (err) {
        // Non-fatal — Gemini falls back to cached data, but warn the user
        showError("Couldn't load nearby restaurants. Results may be limited.");
      }

      router.push("/invite");
    } catch (err) {
      setCreateError("Couldn't create a session. Check your connection and try again.");
    } finally {
      setCreating(false);
    }
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={globalStyles.screen}>
      <Text
        style={{ fontFamily: "Newsreader_600SemiBold", fontSize: 24, color: "#1B1B1B" }}
      >
        Where are we eating?
      </Text>

      {/* ── Map ── */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          mapType="hybrid"
          region={mapRegion}
          onRegionChangeComplete={(r) => setMapRegion(r)}
          showsMyLocationButton={false}
        >
          <Marker
            draggable
            coordinate={marker}
            onDragEnd={(e) => {
              setMarker(e.nativeEvent.coordinate);
              setUserLocation(e.nativeEvent.coordinate);
            }}
          />
          <Circle
            center={marker}
            radius={1000 * radius}
            strokeColor="#053ffc"
            fillColor="rgba(36,87,255,0.18)"
          />
        </MapView>

        {/* "Use my location" button floating over the map */}
        <TouchableOpacity
          style={styles.locateMeButton}
          onPress={handleUseMyLocation}
          activeOpacity={0.8}
        >
          {locating ? (
            <ActivityIndicator size="small" color="#1b1b1b" />
          ) : (
            <>
              <Feather name="crosshair" size={15} color="#1b1b1b" />
              <Text style={styles.locateMeText}>Use my location</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {locationError && (
        <View style={styles.locationErrorRow}>
          <Feather name="alert-circle" size={14} color="#ba1a1a" />
          <Text style={styles.locationErrorText}>{locationError}</Text>
        </View>
      )}

      {/* ── Radius slider ── */}
      <View style={styles.sliderContainer}>
        <View style={styles.distanceContainer}>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: "#4C4546" }}>
            Distance
          </Text>
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#1B1B1B" }}>
            {radius} km
          </Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0.5}
          maximumValue={20}
          thumbImage={require("../assets/images/slider-circle.png")}
          trackImage={require("../assets/images/minimum-track.png")}
          maximumTrackImage={require("../assets/images/maximum-track.png")}
          step={0.5}
          value={radius}
          onValueChange={(v) => setRadius(v)}
        />
      </View>

      {/* ── Dealbreakers ── */}
      <View style={styles.dealbreakerContainer}>
        <Text
          style={{ fontFamily: "Newsreader_400Regular", fontSize: 24, color: "#1B1B1B" }}
        >
          Any Dealbreakers?
        </Text>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            color: "#4C4546",
            paddingInlineEnd: 25,
          }}
        >
          Select dietary restrictions for the group. We'll only show places that
          accommodate everyone.
        </Text>
        <Multiselect options={DIETARY_OPTIONS} onClick={setDietaryRestrictions} />
      </View>

      {createError && (
        <View style={styles.locationErrorRow}>
          <Feather name="alert-circle" size={14} color="#ba1a1a" />
          <Text style={styles.locationErrorText}>{createError}</Text>
        </View>
      )}

      <MyButton onClick={handleSetFilters} style={{ width: "100%", height: 56 }} disabled={creating}>
        {creating
          ? <ActivityIndicator size="small" color="#fff" />
          : <>
              <Text style={{ color: "white", fontSize: 16 }}>Set Filters</Text>
              <Feather name="arrow-right" size={16} color="white" />
            </>
        }
      </MyButton>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    width: "100%",
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  map: { width: "100%", height: "100%" },
  locateMeButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  locateMeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#1b1b1b",
  },
  sliderContainer: { width: "100%", gap: 24 },
  distanceContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  slider: { width: "100%", height: 0 },
  dealbreakerContainer: {
    width: "100%",
    flex: 1,
    padding: 24,
    gap: 16,
    backgroundColor: "#E4E2DD",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#CFC4C5",
    borderRadius: 24,
  },
  locationErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  locationErrorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#ba1a1a",
    flex: 1,
    lineHeight: 18,
  },
});

export default CreateSessionScreen;
