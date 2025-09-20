import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Button,
    ScrollView,
} from 'react-native';
import * as Speech from 'expo-speech';
import { Picker } from '@react-native-picker/picker';
import Header from '@/components/header';

type Voice = Speech.Voice;

const TTSScreen: React.FC = () => {
    const [text, setText] = useState<string>('Hello world');
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    const [voices, setVoices] = useState<Voice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<string | null>(null);

    useEffect(() => {
        const loadVoices = async () => {
            const availableVoices: Voice[] = await Speech.getAvailableVoicesAsync();
            setVoices(availableVoices);
            const defaultVoice = availableVoices.find(v => v.language.startsWith("en"));
            setSelectedVoice(defaultVoice ? defaultVoice.identifier : null);
        };

        loadVoices();
    }, []);

    const speak = () => {
        if (text) {
            setIsSpeaking(true);
            const options: Speech.SpeechOptions = {
                language: 'en-US',
                pitch: 1,
                rate: 1,
                voice: selectedVoice ?? undefined,
                onDone: () => setIsSpeaking(false),
                onError: () => setIsSpeaking(false),
            };
            Speech.speak(text, options);
        }
    };

    const stop = () => {
        Speech.stop();
        setIsSpeaking(false);
    };

    return (
        <View style={styles.container}>
            <Header/>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Text-to-Speech 🗣️</Text>
                <Text style={styles.instructions}>
                    Type something in the box, pick a voice, then press "Speak".
                </Text>

                <TextInput
                    style={styles.input}
                    onChangeText={setText}
                    value={text}
                    placeholder="Enter text to speak..."
                    multiline
                />

                <View style={styles.buttonContainer}>
                    <Button
                        title={isSpeaking ? 'Speaking...' : 'Speak'}
                        onPress={speak}
                        disabled={isSpeaking || !text}
                    />
                    <Button
                        title="Stop"
                        onPress={stop}
                        disabled={!isSpeaking}
                        color="red"
                    />
                </View>

                <Text style={styles.voicesTitle}>Select Voice</Text>
                <Picker
                    selectedValue={selectedVoice}
                    onValueChange={(itemValue) => setSelectedVoice(itemValue)}
                    style={styles.picker}
                >
                    {voices
                        .filter(v => v.language.startsWith("en"))
                        .map((voice) => (
                            voices.map((voice) => (
                                <Picker.Item
                                    key={voice.identifier}
                                    label={`${voice.name} (${voice.language})`}
                                    value={voice.identifier}
                                />
                            ))

                        ))}
                </Picker>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#171717',
    },
    content: {
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#fff',
    },
    instructions: {
        fontSize: 16,
        color: '#ccc',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        backgroundColor: 'white',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        padding: 15,
        fontSize: 18,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 20,
        marginBottom: 20,
    },
    voicesTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 10,
        color: '#fff',
        alignSelf: 'flex-start',
    },
    picker: {
        width: '100%',
        backgroundColor: '#333',
        color: 'white',
        borderRadius: 8,
    },
});

export default TTSScreen;
