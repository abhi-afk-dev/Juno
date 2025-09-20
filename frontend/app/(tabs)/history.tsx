import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    StatusBar,
    Button,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchConversationsByPage } from '../../components/historyApi';
import { HistoryScreenNavigationProp } from '../../src/types';
import Header from '@/components/header';
import { useTheme } from '../../components/themeProvider';

interface Conversation {
    id: string;
    last_message_time: string;
}

const HistoryScreen: React.FC = () => {
    const { theme } = useTheme();
    const [allConversations, setAllConversations] = useState<Conversation[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const navigation = useNavigation<HistoryScreenNavigationProp>();

    const loadConversations = async (page: number) => {
        if (page === 1) {
            setIsLoading(true);
        } else {
            setIsFetchingMore(true);
        }
        setFetchError(null);

        try {
            const result = await fetchConversationsByPage(page);

            setAllConversations(prev => page === 1 ? result.conversations : [...prev, ...result.conversations]);
            setTotalPages(result.totalPages);
            setCurrentPage(result.currentPage);
        } catch (error) {
            setFetchError('Failed to load chat history. Please try again.');
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    };

    useEffect(() => {
        loadConversations(1);
    }, []);

    useEffect(() => {
        const results = allConversations.filter(conversation =>
            conversation.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredConversations(results);
    }, [searchQuery, allConversations]);

    const handleConversationPress = (conversation: Conversation) => {
        navigation.navigate('home', { conversation_Name: conversation.id });
    };

    const handleLoadMore = () => {
        if (isFetchingMore || currentPage >= totalPages) return;
        loadConversations(currentPage + 1);
    };

    const renderFooter = () => {
        if (isFetchingMore) {
            return <ActivityIndicator style={{ margin: 20 }} size="large" color={theme === 'dark' ? "#FFFFFF" : "#000000"} />;
        }
        if (currentPage < totalPages && !searchQuery) {
            return <Button title="Load More" onPress={handleLoadMore} color={theme === 'dark' ? "#000000ff" : "#555555"} />;
        }
        return null;
    };

    const dynamicStyles = StyleSheet.create({
        container: {
            backgroundColor: theme === 'dark' ? '#121212' : '#f5f5f5',
        },
        searchBar: {
            backgroundColor: theme === 'dark' ? '#282828' : '#e0e0e0',
            color: theme === 'dark' ? '#FFFFFF' : '#000000',
        },
        card: {
            backgroundColor: theme === 'dark' ? '#282828' : '#ffffff',
            shadowColor: theme === 'dark' ? '#000' : '#ccc',
        },
        cardTitle: {
            color: theme === 'dark' ? '#FFFFFF' : '#000000',
        },
        cardDate: {
            color: theme === 'dark' ? '#B0B0B0' : '#888888',
        },
        errorContainer: {
            backgroundColor: theme === 'dark' ? '#4B3F3F' : '#F8D7DA',
        },
        errorText: {
            color: theme === 'dark' ? '#F87171' : '#721C24',
        },
        emptyText: {
            color: theme === 'dark' ? '#A0A0A0' : '#666666',
        },
    });

    if (isLoading) {
        return (
            <View style={[styles.centered, dynamicStyles.container]}>
                <ActivityIndicator size="large" color="#38C6F4" />
            </View>
        );
    }

    if (fetchError) {
        return (
            <View style={[styles.centered, dynamicStyles.container]}>
                <View style={[styles.errorContainer, dynamicStyles.errorContainer]}>
                    <Text style={[styles.errorText, dynamicStyles.errorText]}>{fetchError}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            <Header />
            <View style={styles.searchContainer}>
                <TextInput
                    style={[styles.searchBar, dynamicStyles.searchBar]}
                    placeholder="Search conversations..."
                    placeholderTextColor={theme === 'dark' ? "#888" : "#999"}
                    value={searchQuery}
                    onChangeText={setSearchQuery} />
            </View>
            <FlatList
                data={filteredConversations}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.card, dynamicStyles.card]}
                        onPress={() => handleConversationPress(item)}
                    >
                        <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>{item.id}</Text>
                        <Text style={[styles.cardDate, dynamicStyles.cardDate]}>
                            {new Date(item.last_message_time).toLocaleString()}
                        </Text>
                    </TouchableOpacity>
                )}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={() => (
                    <View style={styles.centered}>
                        <Text style={[styles.emptyText, dynamicStyles.emptyText]}>
                            {allConversations.length > 0
                                ? 'No conversations match your search.'
                                : 'No past conversations to display.'}
                        </Text>
                    </View>
                )}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                contentContainerStyle={styles.listContentContainer}
            />
        </View>
    );
};

export default HistoryScreen;
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    searchBar: {
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 8,
        fontSize: 16,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginTop: 50,
    },
    listContentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    errorContainer: {
        padding: 16,
        borderRadius: 8,
    },
    errorText: {
        textAlign: 'center',
        fontSize: 16,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    },
    card: {
        padding: 16,
        borderRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    cardDate: {
        fontSize: 14,
        marginTop: 4,
    },
});