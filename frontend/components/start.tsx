import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type WelcomeScreenProps = {
    onSetupComplete: () => void;
};

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSetupComplete }) => {
    const [userName, setUserName] = useState('');
    const [geminiApiKey, setGeminiApiKey] = useState(''); // State for the Gemini API Key
    const [tavilyApiKey, setTavilyApiKey] = useState(''); // State for the Tavily API Key

    const handleStartPress = async () => {
        const trimmedName = userName.trim();
        const trimmedGeminiKey = geminiApiKey.trim();
        const trimmedTavilyKey = tavilyApiKey.trim();

        // Validate all three fields
        if (!trimmedName || !trimmedGeminiKey || !trimmedTavilyKey) {
            Alert.alert('All Fields Required', 'Please enter your name, Gemini API key, and Tavily API key.');
            return;
        }

        try {
            // Save all three items to storage
            await AsyncStorage.setItem('userName', trimmedName);
            await AsyncStorage.setItem('geminiApiKey', trimmedGeminiKey);
            await AsyncStorage.setItem('tavilyApiKey', trimmedTavilyKey);
            onSetupComplete(); // Signal that setup is done
        } catch (error) {
            console.error("Failed to save user data.", error);
            Alert.alert('Error', 'Could not save your details. Please try again.');
        }
    };

    return (
        <View style={styles.overlayContainer}>
            <ScrollView contentContainerStyle={styles.modalView}>
                <Text style={styles.title}>Welcome!</Text>
                <Text style={styles.subtitle}>Let's set up your name and API keys to get started.</Text>
                
                <TextInput
                    style={styles.input}
                    placeholder="Please enter your name"
                    placeholderTextColor={'#a1a1a1'}
                    value={userName}
                    onChangeText={setUserName}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Enter your Gemini API Key"
                    placeholderTextColor={'#a1a1a1'}
                    value={geminiApiKey}
                    onChangeText={setGeminiApiKey}
                    secureTextEntry // Hides the API key characters
                />
                
                <TextInput
                    style={styles.input}
                    placeholder="Enter your Tavily API Key (for search)"
                    placeholderTextColor={'#a1a1a1'}
                    value={tavilyApiKey}
                    onChangeText={setTavilyApiKey}
                    secureTextEntry // Hides the API key characters
                />
                
                <TouchableOpacity style={styles.button} onPress={handleStartPress}>
                    <Text style={styles.buttonText}>Get Started</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    overlayContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingVertical: 40,
    },
    modalView: {
        width: '90%',
        backgroundColor: '#1e1e1e',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 15,
    },
    subtitle: {
        fontSize: 16,
        color: '#b1b1b1',
        textAlign: 'center',
        marginBottom: 25,
    },
    input: {
        width: '100%',
        backgroundColor: '#333333',
        color: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 15,
        fontSize: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#555555',
    },
    button: {
        width: '100%',
        backgroundColor: '#6a25ebff',
        paddingVertical: 18,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '500',
    },
});

export default WelcomeScreen;