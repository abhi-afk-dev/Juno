import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

type SpeakProps = {
    response: string;
};

const Speak: React.FC<SpeakProps> = ({ response }) => {
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

    useEffect(() => {
        const speakResponse = async () => {
            if (response && response.trim() !== '') {
                const isAvailable = await Speech.isSpeakingAsync();
                if (isAvailable) {
                    Speech.stop();
                }

                Speech.speak(response, {
                    language: 'en-US',
                    onStart: () => setIsSpeaking(true),
                    onDone: () => setIsSpeaking(false),
                    onError: () => setIsSpeaking(false),
                    onStopped: () => setIsSpeaking(false),
                });
            } else {
                Speech.stop();
                setIsSpeaking(false);
            }
        };

        speakResponse();

        return () => {
            Speech.stop();
        };
    }, [response]);

    const handlePress = () => {
        if (isSpeaking) {
            Speech.stop();
        } else {
            if (response && response.trim() !== '') {
                Speech.speak(response, {
                    language: 'en-US',
                    onStart: () => setIsSpeaking(true),
                    onDone: () => setIsSpeaking(false),
                    onError: () => setIsSpeaking(false),
                    onStopped: () => setIsSpeaking(false),
                });
            }
        }
    };

    return (
        <TouchableOpacity style={styles.container} onPress={handlePress}>
            <View style={styles.menuButton}>
                <Ionicons
                    name={isSpeaking ? "stop-circle" : "volume-high"}
                    size={24}
                    color={isSpeaking ? "#ff6347" : "white"}
                />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
        borderRadius: 40,
        borderWidth: 2,
        backgroundColor: '#2c2c2c7c',
        borderColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 8,
    },
    menuButton: {
        backgroundColor: 'rgba(128, 128, 128, 0.5)',
        width: 44,
        height: 44,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Speak;
