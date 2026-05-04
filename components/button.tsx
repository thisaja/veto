import { Inter_400Regular, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
const buttonStyles = StyleSheet.create({
    baseButtonStyle: {
        width: 256,
        height: 64,
        backgroundColor: "black",
        flexDirection: "row",
        gap: 8,
        borderRadius: 32,
        justifyContent: "center",
        alignItems: "center"
    },
})
interface MyButtonProps {
    onClick: () => void
    children?: ReactNode
    style?: StyleProp<ViewStyle>
}

const MyButton = ({ children, onClick, style }: MyButtonProps) => {
    const [fontsLoaded] = useFonts({
        Inter_400Regular,
        Inter_700Bold,
    });
    return (
        <TouchableOpacity
            onPress={() => onClick()}
            style={[buttonStyles.baseButtonStyle, style]}
        >
            {children}
        </TouchableOpacity>
    );
};

export default MyButton