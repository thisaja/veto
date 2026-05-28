import { useSession } from '@/context/SessionContext';
import { globalStyles } from '@/constants/global';
import { Feather } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Circle, LatLng, Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import MyButton from '@/components/button';
import Multiselect from '@/components/multiselect';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Newsreader_400Regular, Newsreader_600SemiBold, useFonts } from '@expo-google-fonts/newsreader';
import { router } from 'expo-router';

const CreateSessionScreen = () => {
    let [fontsLoaded] = useFonts({
        Newsreader_400Regular,
        Newsreader_600SemiBold,
        Inter_400Regular,
        Inter_600SemiBold,
    });
    const [marker, setMarker] = useState<LatLng>({
        latitude: 37.78825,
        longitude: -122.4324,
    })
    // The radius is in KM
    const [radius, setRadius] = useState<number>(3)
    const { startSession } = useSession();

    const handleSetFilters = async () => {
        await startSession();
        router.push("/invite");
    };

    return (
        <SafeAreaView style={globalStyles.screen}>
            <Text style={{ fontFamily: "Newsreader_600SemiBold", fontSize: 24, color: "#1B1B1B" }}>
                Where are we eating?
            </Text>
            <View style={styles.mapContainer}>
                <MapView style={styles.map}
                    mapType="hybrid"
                    showsMyLocationButton={true}
                    initialRegion={{
                        latitude: 37.78825,
                        longitude: -122.4324,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}>
                    <Marker draggable
                        coordinate={marker}
                        onDragEnd={(e) => setMarker(e.nativeEvent.coordinate)}
                    />
                    <Circle center={marker} radius={1000 * radius} strokeColor="#053ffc" fillColor="rgba(36, 87, 255, 0.3)" />
                </MapView>
            </View>
            <View style={styles.sliderContainer}>
                <View style={styles.distanceContainer}>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: "#4C4546" }}>Distance</Text>
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#1B1B1B" }}>{radius} Kilometers</Text>
                </View>
                <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={20}
                    thumbImage={require("../assets/images/slider-circle.png")}
                    trackImage={require("../assets/images/minimum-track.png")}
                    maximumTrackImage={require("../assets/images/maximum-track.png")}
                    step={0.5}
                    onValueChange={(newRadius) => setRadius(newRadius)}
                />
            </View>
            <View style={styles.dealbreakerContainer}>
                <Text style={{ fontFamily: "Newsreader_400Regular", fontSize: 24, color: "#1B1B1B" }}>Any Dealbreakers?</Text>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "#4C4546", paddingInlineEnd: 25 }}>Select dietary restrictions for the group.
                    We'll only show places that accommodate
                    everyone.</Text>
                <Multiselect options={["Vegan", "Vegetarian", "Gluten-Free", "Halal", "Nut Allergy", "Kosher"]} />
            </View>
            <MyButton onClick={handleSetFilters} style={{ width: "100%", height: 56 }} >
                <Text style={{ color: "white", fontSize: 16 }}>Set Filters</Text>
                <Feather name="arrow-right" size={16} color="white" />
            </MyButton>
        </SafeAreaView >
    )
}
const styles = StyleSheet.create({
    mapContainer: {
        width: "100%",
        flex: 1,
        borderRadius: 16
    },
    map: {
        width: '100%',
        height: '100%',
        borderRadius: 16
    },
    sliderContainer: {
        width: "100%",
        gap: 24
    },
    distanceContainer: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between"
    },
    slider: {
        width: "100%",
        height: 0,
    },
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
})
export default CreateSessionScreen