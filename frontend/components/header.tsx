import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    TouchableOpacity,
    Platform,
    Modal,
    Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from 'react-native-webview';
import React, { useRef, useState } from "react";
import { useTheme } from "./themeProvider";

type TimerProps = {
    timeLeft?: number;
};
const Header: React.FC<TimerProps> = ({ timeLeft }) => {
    const { theme, toggleTheme } = useTheme();
    const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const YOUTUBE_VIDEO_ID = "iicfmXFALM8";
    const videoUrl = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&loop=1&playlist=${YOUTUBE_VIDEO_ID}`;

    const handleSettingsPress = () => {
        const isOverlayOpen = !showSettingsOverlay;
        setShowSettingsOverlay(isOverlayOpen);
        Animated.timing(rotateAnim, {
            toValue: isOverlayOpen ? 1 : 0,
            duration: 200,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start();
    };

    const closeSettings = () => {
        setShowSettingsOverlay(false);
        Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 200,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start();
    };

    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "-90deg"],
    });

    const animatedStyle = {
        transform: [{ rotate: rotateInterpolate }],
    };

    const handleNotePress = () => {
        setIsActive(!isActive);
    };

    const formatTimerDisplay = (ms: number): string => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const noteIconColor = isActive
        ? '#38C6F4'
        : theme === 'dark'
        ? '#fff'
        : '#000';

    const themeStyles = StyleSheet.create({
        header: {
            backgroundColor: theme === 'dark' ? '#1d1d1dff' : '#f3f3f3ff',
            borderBottomColor: theme === 'dark' ? '#333' : '#e0e0e0',
        },
        logo: {
            color: theme === 'dark' ? '#fff' : '#000',
        },
        timerText: {
            color: theme === 'dark' ? '#fff' : '#000',
        },
        settingsOverlay: {
            backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.89)' : 'rgba(255, 255, 255, 0.89)',
        },
        overlayText: {
            color: theme === 'dark' ? '#969696ff' : '#444444ff',
        },
        overlaySeparator: {
            backgroundColor: theme === 'dark' ? '#514d4dff' : '#ccc',
        },
    });

    return (
        <SafeAreaView>
            <View style={[styles.header, themeStyles.header]}>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.logo, themeStyles.logo]}>JUNO</Text>
                </View>
                {timeLeft !== undefined ? (
                    <View>
                        <Text style={[styles.timerText, themeStyles.timerText]}>{formatTimerDisplay(timeLeft)}</Text>
                    </View>
                ) : null}
                <View style={styles.iconContainer}>
                    <TouchableOpacity onPress={handleNotePress}>
                        <Ionicons name="musical-notes" size={30} color={noteIconColor} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSettingsPress}>
                        <Animated.View style={animatedStyle}>
                            <Ionicons name="settings" size={30} color={theme === 'dark' ? '#fff' : '#000'} />
                        </Animated.View>
                    </TouchableOpacity>
                </View>
            </View>

            {isActive && (
                <WebView
                    style={styles.hiddenWebView}
                    source={{ uri: videoUrl }}
                    mediaPlaybackRequiresUserAction={false}
                    allowsInlineMediaPlayback={true}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                />
            )}

            <Modal
                transparent={true}
                visible={showSettingsOverlay}
                animationType="fade"
                onRequestClose={closeSettings}
            >
                <Pressable style={styles.overlayBackground} onPress={closeSettings}>
                    <View style={[styles.settingsOverlay, themeStyles.settingsOverlay]}>
                        <TouchableOpacity style={styles.overlayOption} onPress={toggleTheme}>
                            <Text style={[styles.overlayText, themeStyles.overlayText]}>Account</Text>
                        </TouchableOpacity>
                        <View style={[styles.overlaySeparator, themeStyles.overlaySeparator]} />
                        <TouchableOpacity style={styles.overlayOption} onPress={toggleTheme}>
                            <Text style={[styles.overlayText, themeStyles.overlayText]}>Change Theme</Text>
                        </TouchableOpacity>
                        <View style={[styles.overlaySeparator, themeStyles.overlaySeparator]} />
                        <TouchableOpacity style={styles.overlayOption}>
                            <Text style={[styles.overlayText, themeStyles.overlayText]}>Log Out</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
};

export default Header;

const styles = StyleSheet.create({
    logo: {
        fontFamily: 'Plaster',
        fontSize: 30,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 2,
    },
    headerTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    timerText: {
        fontSize: 20,
        fontFamily: 'monospace',
    },
    iconContainer: {
        flexDirection: "row",
        gap: 20,
        alignItems: "center",
    },
    overlayBackground: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
    settingsOverlay: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    overlayOption: {
        paddingVertical: 10,
        justifyContent: "center",
    },
    overlayText: {
        fontSize: 24,
        justifyContent: "center",
    },
    overlaySeparator: {
        height: 1,
        marginVertical: 5,
    },
    hiddenWebView: {
        height: 0,
        width: 0,
        position: 'absolute',
        top: -1000,
    },
});