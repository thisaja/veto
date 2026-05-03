import { Text, View } from "react-native";
import MapView from 'react-native-maps';
const CreateSessionScreen = () => {
    return (
        <View>
            <Text>
                Create Session Screen.
            </Text>
            <View className="w-full h-96 mt-4 rounded-xl overflow-hidden">
                <MapView
                    style={{ width: '100%', height: '100%' }}
                    initialRegion={{
                        latitude: 37.78825,
                        longitude: -122.4324,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                />
            </View>
        </View>
    )
}
export default CreateSessionScreen