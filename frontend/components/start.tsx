import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the type for the component's props
type WelcomeScreenProps = {
    onNameSubmitted: (name: string) => void;
};

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNameSubmitted }) => {
    const [userName, setUserName] = useState('');

    const handleStartPress = async () => {
        const trimmedName = userName.trim();
        if (!trimmedName) {
            Alert.alert('Name Required', 'Please enter your name to continue.');
            return;
        }
        try {
            await AsyncStorage.setItem('userName', trimmedName);
            onNameSubmitted(trimmedName); // Notify the parent component
        } catch (error) {
            console.error("Failed to save user's name.", error);
            Alert.alert('Error', 'Could not save your name. Please try again.');
        }
    };

    return (
        <View style={styles.overlayContainer}>
            <View style={styles.modalView}>
                <Text style={styles.title}>Welcome!</Text>
                <Text style={styles.subtitle}>Let's get started by setting up your name.</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Please enter your name"
                    placeholderTextColor={'#a1a1a1'}
                    value={userName}
                    onChangeText={setUserName}
                />
                <TouchableOpacity style={styles.button} onPress={handleStartPress}>
                    <Text style={styles.buttonText}>Get Started</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlayContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent background
    },
    modalView: {
        width: '90%',
        backgroundColor: '#1e1e1e',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
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
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#555555',
    },
    button: {
        width: '100%',
        backgroundColor: '#6a25ebff', 
        paddingVertical: 18,
        borderRadius: 15,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '500',
    },
});

export default WelcomeScreen;