import { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    Image,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Platform,
    Pressable,
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRoute, RouteProp } from "@react-navigation/native";
import Markdown from "react-native-markdown-display";
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Header from "../../components/header";
import { fetchConversationById } from "../../components/historyApi";
import Prompter from "../../components/prompter";
import Timer from "../../components/timer";
import Speak from "../../components/speak";
import WelcomeScreen from '../../components/start';
import StartD from '../../assets/images/start_.svg';
import StartW from '../../assets/images/start.svg';
import { useTheme } from "../../components/themeProvider";

type RootStackParamList = {
    InterfacePage: { conversation_Name?: string, name?: string };
};

type InterfacePageRouteProp = RouteProp<RootStackParamList, "InterfacePage">;

export type Message = {
    id: string ;
    type: "user" | "ai";
    content: any;
    date_time: string;
    conversation_name: string;
    attachments?: any[];
};
function InterfacePage() {
    const { theme } = useTheme();
    const route = useRoute<InterfacePageRouteProp>();
    const { conversation_Name: conversationIdFromParams } = route.params || {};
    const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPrePage, setShowPrePage] = useState(false);
    const [conversationName, setConversationName] = useState("New Conversation");
    const [selectedConversationState, setSelectedConversationState] = useState<any>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [initialTime, setInitialTime] = useState<number>(1500000);
    const [timeLeft, setTimeLeft] = useState<number>(initialTime);
    const [isActive, setIsActive] = useState<boolean>(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [toolStatus, setToolStatus] = useState<string | null>(null);
    const scrollViewRef = useRef<KeyboardAwareScrollView>(null);

    // State for user data
    const [userName, setUserName] = useState<string | null>(null);
    const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
    const [tavilyApiKey, setTavilyApiKey] = useState<string | null>(null);
    const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);

    useEffect(() => {
        const checkUserData = async () => {
            try {
                const storedName = await AsyncStorage.getItem('userName');
                const storedGeminiKey = await AsyncStorage.getItem('geminiApiKey');
                const storedTavilyKey = await AsyncStorage.getItem('tavilyApiKey');

                if (storedName && storedGeminiKey && storedTavilyKey) {
                    setUserName(storedName);
                    setGeminiApiKey(storedGeminiKey);
                    setTavilyApiKey(storedTavilyKey);
                    setShowWelcomeOverlay(false);
                } else {
                    setShowWelcomeOverlay(true);
                }
            } catch (error) {
                console.error("Failed to load user data.", error);
                setShowWelcomeOverlay(true);
            }
        };
        checkUserData();
    }, []);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prevTime => prevTime - 1000);
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timeLeft <= 0) {
                setIsActive(false);
                setShowPrePage(true);
            }
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, timeLeft]);

    const handleSetupComplete = async () => {
        try {
            const storedName = await AsyncStorage.getItem('userName');
            const storedGeminiKey = await AsyncStorage.getItem('geminiApiKey');
            const storedTavilyKey = await AsyncStorage.getItem('tavilyApiKey');

            setUserName(storedName);
            setGeminiApiKey(storedGeminiKey);
            setTavilyApiKey(storedTavilyKey);
            setShowWelcomeOverlay(false);
        } catch (error) {
            console.error("Failed to reload user data after setup.", error)
        }
    };

    const handleResetSettings = async () => {
        try {
            await AsyncStorage.multiRemove(['userName', 'geminiApiKey', 'tavilyApiKey']);
            setUserName(null);
            setGeminiApiKey(null);
            setTavilyApiKey(null);
            setShowWelcomeOverlay(true);
        } catch (error) {
            console.error("Failed to delete user data.", error);
        }
    };

    useEffect(() => {
        const fetchConversation = async () => {
            if (conversationIdFromParams) {
                if (!selectedConversationState || selectedConversationState.id !== conversationIdFromParams) {
                    setConversationHistory([]);
                    setSelectedConversationState(null);
                    setFetchError(null);

                    try {
                        const data = await fetchConversationById(conversationIdFromParams);
                        if (data) {
                            const correctedMessages = data.messages.map((m: any) => {
                                const userContentParts: any[] = [];
                                if (m.prompt) {
                                    userContentParts.push({ text: m.prompt });
                                }
                                if (m.inline_data) {
                                    userContentParts.push({ inline_data: m.inline_data });
                                }
                                const userMessage: Message = {
                                    id: `${m.id}_user`,
                                    type: "user" as const,
                                    content: userContentParts.length > 0 ? userContentParts : m.prompt,
                                    date_time: m.date_time,
                                    conversation_name: m.conversation_name,
                                };
                                const aiMessage: Message = {
                                    id: m.id,
                                    type: "ai" as const,
                                    content: m.result,
                                    date_time: m.date_time,
                                    conversation_name: m.conversation_name,
                                };
                                return [userMessage, aiMessage];
                            }).flat();

                            setSelectedConversationState(data);
                            setConversationHistory(correctedMessages);
                            setConversationName(data.id);
                        } else {
                            setFetchError("Conversation not found.");
                        }
                    } catch (err) {
                        setFetchError("Failed to load conversation. Please try again.");
                    }
                }
            } else {
                setConversationHistory([]);
                setSelectedConversationState(null);
                setConversationName("New Conversation");
                setFetchError(null);
            }
        };
        fetchConversation();
    }, [conversationIdFromParams, selectedConversationState]);

    useEffect(() => {
        if (conversationHistory.length > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd(true);
            }, 100);
        }
    }, [conversationHistory]);

    // Handler for name submission from WelcomeScreen
    const handleNameSubmitted = (name: string) => {
        setUserName(name);
        setShowWelcomeOverlay(false); // Hide the overlay after name is submitted
    };

    const handleStartPause = () => {
        if (timeLeft > 0) setIsActive(!isActive);
    };

    const handleReset = () => {
        setIsActive(false);
        setInitialTime(0);
        setTimeLeft(0);
    };

    const adjustTime = (amount: number) => {
        if (!isActive) {
            const newTime = Math.max(0, initialTime + amount);
            setInitialTime(newTime);
            setTimeLeft(newTime);
        } else if (isActive) {
            const newTime = Math.max(0, timeLeft + amount);
            setInitialTime(newTime);
            setTimeLeft(newTime);
        }
    };

    const handleNewMessage = (message: Message) => {
        setConversationHistory(prevMessages => {
            const messageExists = prevMessages.some(msg => msg.id === message.id);
            if (messageExists) {
                return prevMessages.map(msg => msg.id === message.id ? message : msg);
            } else {
                return [...prevMessages, message];
            }
        });
    };

    const handleConversationStart = () => {
        setShowPrePage(!showPrePage);
    };

    const closePrePage = () => {
        setShowPrePage(false);
    };

    const renderMessageContent = (message: Message) => {
        // ... (rest of the function is unchanged)
        const isUserMessage = message.type === "user";
        let contentParts;
        if (Array.isArray(message.content)) {
            contentParts = message.content;
        } else if (typeof message.content === 'string') {
            contentParts = [{ type: 'text', text: message.content }];
        } else if (message.content && typeof message.content === 'object') {
            contentParts = [message.content];
        } else {
            contentParts = [{ type: 'text', text: '' }];
        }

        return (
            <View
                key={message.id}
                style={[
                    styles.messageBubble,
                    {
                        alignSelf: isUserMessage ? "flex-end" : "flex-start",
                        backgroundColor: isUserMessage ? "#6a25ebff" : theme === 'dark' ? "rgba(80, 80, 80, 0.7)" : 'rgba(200, 200, 200, 0.7)'
                    },
                ]}
            >
                <View>
                    {contentParts.map((part: any, i: number) => {
                        if (part.text) {
                            return (
                                <Markdown key={`content-${i}`} style={theme === 'dark' ? markdownStylesDark : markdownStylesLight}>
                                    {part.text}
                                </Markdown>
                            );
                        }
                        if (part.inline_data?.mimeType && part.inline_data?.data) {
                            const imageUrl = `data:${part.inline_data.mimeType};base64,${part.inline_data.data}`;
                            return (
                                <TouchableOpacity
                                    key={`content-${i}`}
                                    onPress={() => setLightboxImage(imageUrl)}
                                >
                                    <Image
                                        source={{ uri: imageUrl }}
                                        style={styles.image}
                                    />
                                </TouchableOpacity>
                            );
                        }
                        return null;
                    })}
                </View>
            </View>
        );
    };

    const lastMessage = conversationHistory[conversationHistory.length - 1];
    let aiResponseText = "";
    if (lastMessage && lastMessage.type === 'ai' && lastMessage.content) {
        if (Array.isArray(lastMessage.content)) {
            aiResponseText = lastMessage.content
                .filter(part => part.text)
                .map(part => part.text)
                .join(' ');
        } else if (typeof lastMessage.content === 'string') {
            aiResponseText = lastMessage.content;
        }
    }

    return (
        <View style={theme === 'dark' ? stylesDark.container : stylesLight.container}>
            <Header timeLeft={timeLeft} />
            <TouchableOpacity style={styles.icon} onPress={handleConversationStart}>
                {theme === 'dark' ? <StartD height={80} style={{}} /> : <StartW height={80} style={{}} />}
            </TouchableOpacity>
            <KeyboardAwareScrollView
                style={styles.chatContainer}
                contentContainerStyle={styles.chatContentContainer}
                ref={scrollViewRef} >
                {fetchError && <Text style={theme === 'dark' ? stylesDark.errorText : stylesLight.errorText}>{fetchError}</Text>}

                {conversationHistory.length === 0 && userName ? (
                    <Text style={theme === 'dark' ? stylesDark.noConversation : stylesLight.noConversation}>
                        Welcome, {userName}
                    </Text>
                ) : (
                    <View style={{ width: '100%' }}>
                        {conversationHistory.map((message) => renderMessageContent(message))}
                    </View>
                )}

                {isLoading && (
                    <View style={theme === 'dark' ? stylesDark.thinkingBubble : stylesLight.thinkingBubble}>
                        <Text style={theme === 'dark' ? { color: '#9ca3af' } : { color: '#6b7280' }}>Thinking...</Text>
                    </View>
                )}
                {toolStatus && (
                    <View style={theme === 'dark' ? stylesDark.thinkingBubble : stylesLight.thinkingBubble}>
                        <Text style={theme === 'dark' ? { color: '#9ca3af' } : { color: '#6b7280' }}>{toolStatus}</Text>
                    </View>
                )}
                {lightboxImage && (
                    <TouchableOpacity style={styles.lightbox} onPress={() => setLightboxImage(null)}>
                        <Image
                            source={{ uri: lightboxImage }}
                            style={styles.lightboxImage}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                )}
            </KeyboardAwareScrollView >

            <View style={styles.prompterContainer}>
                <Speak response={aiResponseText} />
                <Prompter
                    onNewMessage={handleNewMessage}
                    conversationName={conversationName}
                    messages={conversationHistory}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    setToolStatus={setToolStatus}
                    // Add these two props
                    geminiApiKey={geminiApiKey}
                    tavilyApiKey={tavilyApiKey}
                />
            </View>

            <Modal
                transparent={true}
                visible={showPrePage}
                animationType="fade"
                onRequestClose={closePrePage}
            >
                <Pressable style={styles.overlayBackground} onPress={closePrePage}>
                    <View style={theme === 'dark' ? stylesDark.conversationOverlay : stylesLight.conversationOverlay}>
                        <View >
                            <View style={theme === 'dark' ? stylesDark.namecontainer : stylesLight.namecontainer}>
                                <TextInput
                                    style={theme === 'dark' ? stylesDark.input : stylesLight.input}
                                    placeholder="Name this project "
                                    placeholderTextColor={theme === 'dark' ? "#d1d1d1" : "#888"}
                                    value={conversationName}
                                    onChangeText={setConversationName}
                                    multiline
                                />
                            </View>
                        </View>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Timer
                                timeLeft={timeLeft}
                                isActive={isActive}
                                onStartPause={handleStartPause}
                                onReset={handleReset}
                                onAdjustTime={adjustTime}
                            />
                        </View>
                    </View>
                </Pressable>
            </Modal>

            {/* Welcome Screen Overlay Modal */}
            <Modal transparent={true} visible={showWelcomeOverlay} animationType="fade">
                <WelcomeScreen onSetupComplete={handleSetupComplete} />
            </Modal>
        </View >
    );
}

export default InterfacePage;

// --- STYLES ---
const stylesDark = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#171717" },
    conversationOverlay: {
        borderRadius: 20,
        backgroundColor: '#1f1f1fff',
        paddingVertical: 20,
        paddingHorizontal: 20,
        height: 400,
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6 },
            android: { elevation: 10 },
        }),
    },
    overlayText: { fontSize: 16, color: "#514d4dff" },
    namecontainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 2,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 8,
    },
    input: { flex: 1, color: 'white', fontSize: 16, paddingHorizontal: 10, maxHeight: 80 },
    errorText: { color: "red", textAlign: "center", marginBottom: 8 },
    noConversation: { color: "white", textAlign: "center", fontSize: 28 },
    thinkingBubble: {
        alignSelf: 'flex-start',
        backgroundColor: "rgba(80, 80, 80, 0.7)",
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        maxWidth: "85%",
    },
});

const stylesLight = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#ffffff" },
    conversationOverlay: {
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        paddingVertical: 20,
        paddingHorizontal: 20,
        height: 400,
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6 },
            android: { elevation: 10 },
        }),
    },
    overlayText: { fontSize: 16, color: "#d1d1d1" },
    namecontainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 2,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.2)',
        paddingHorizontal: 8,
    },
    input: { flex: 1, color: 'black', fontSize: 16, paddingHorizontal: 10, maxHeight: 80 },
    errorText: { color: "darkred", textAlign: "center", marginBottom: 8 },
    noConversation: { color: "black", textAlign: "center", fontSize: 28 },
    thinkingBubble: {
        alignSelf: 'flex-start',
        backgroundColor: "rgba(200, 200, 200, 0.7)",
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        maxWidth: "85%",
    },
});

const styles = StyleSheet.create({
    overlayBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: { position: 'absolute', top: 110, left: -180, zIndex: 10 },
    prompterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    chatContainer: { flex: 1, padding: 12 },
    chatContentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    messageBubble: { borderRadius: 12, padding: 12, marginBottom: 8, maxWidth: "85%" },
    image: { width: 200, height: 200, borderRadius: 8, marginVertical: 6 },
    lightbox: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.9)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    lightboxImage: { width: "90%", height: "90%", borderRadius: 12 },
});

const markdownStylesDark = {
    body: { color: "white" },
    code_inline: { backgroundColor: "#374151", color: "white", borderRadius: 4, paddingHorizontal: 4 },
    fence: { backgroundColor: "#1f2937", color: "white", borderRadius: 8, padding: 8 },
};

const markdownStylesLight = {
    body: { color: "black" },
    code_inline: { backgroundColor: "#d1d5db", color: "black", borderRadius: 4, paddingHorizontal: 4 },
    fence: { backgroundColor: "#e5e7eb", color: "black", borderRadius: 8, padding: 8 },
};