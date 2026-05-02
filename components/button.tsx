import { Inter_400Regular, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Text, TouchableOpacity } from "react-native";
interface MyButtonProps {
    text: string
    onClick: () => void
    width?: number
    height?: number
    backgroundColour?: string
    textColour?: string
}

const MyButton = ({ text, onClick, width = 256, height = 64, backgroundColour = "black", textColour = "white" }: MyButtonProps) => {
    const [fontsLoaded] = useFonts({
        Inter_400Regular,
        Inter_700Bold,
    });
    return (
        <TouchableOpacity
            onPress={() => onClick()}
            className={`rounded-full justify-center items-center`}
            style={{ backgroundColor: backgroundColour, width: width, height: height }}
        >
            <Text
                style={{ color: textColour, fontFamily: "Inter_400Regular", fontSize: 16 }}
            >
                {text}
            </Text>
        </TouchableOpacity>
    );
};

export default MyButton