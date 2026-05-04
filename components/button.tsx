import { Inter_400Regular, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from "react-native";
export const buttonStyles = StyleSheet.create({
    baseButtonStyle: {
        width: 256,
        height: 64,
        backgroundColor: "black",
    },
    baseTextStyle: {
        color: "white"
    }
})
interface MyButtonProps {
    text: string
    onClick: () => void
    buttonStyle?: StyleProp<ViewStyle>
    textStyle?: StyleProp<TextStyle>
}

const MyButton = ({ text, onClick, buttonStyle, textStyle }: MyButtonProps) => {
    const [fontsLoaded] = useFonts({
        Inter_400Regular,
        Inter_700Bold,
    });
    return (
        <TouchableOpacity
            onPress={() => onClick()}
            className={`rounded-full justify-center items-center`}
            style={[buttonStyles.baseButtonStyle, buttonStyle]}
        >
            <Text
                style={[buttonStyles.baseTextStyle, textStyle]}
            >
                {text}
            </Text>
        </TouchableOpacity>
    );
};

export default MyButton