// src/components/menu/chat/Chatbot.js

import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StyleSheet, Dimensions, Platform, KeyboardAvoidingView,
    Image, PermissionsAndroid, ActivityIndicator, RefreshControl
} from 'react-native';
import { connect } from 'react-redux';
import Sound from 'react-native-sound';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import HeaderFix from '../../common/HeaderFix';
import Toast from 'react-native-simple-toast';
import langChatbot from '../../../assets/language/menu/lang_chatbot';
import {getLocalizedText} from '../../../assets/language/langUtils';

const { width } = Dimensions.get('window');
const audioRecorderPlayer = new AudioRecorderPlayer();

function Chatbot({ navigation, user, token, lang, impersonating, patient_token }) {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [inputDisabled, setInputDisabled] = useState(false);

    // New state for chat history
    const [chatHistory, setChatHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [hasMoreHistory, setHasMoreHistory] = useState(true);
    const [historySkip, setHistorySkip] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);

    const scrollRef = useRef();
    const soundRef = useRef(null);

    const sendText = getLocalizedText(lang, langChatbot.send);

    // Helper to inspect formData
    const debugFormData = (formData) => {
        for (let pair of formData._parts) {
            console.log('📦 FormData -', pair[0], ':', pair[1]);
        }
    };

    const scrollToEnd = () => {
        scrollRef.current?.scrollToEnd({ animated: true });
    };

    const addMessage = (type, text, audio = null) => {
        setMessages(prev => {
            const updated = [...prev, { type, text, audio, timestamp: new Date().toISOString() }];
            setTimeout(scrollToEnd, 100);
            return updated;
        });
    };

    const getAuthFormData = () => {
        if (!user?.id_customer) {
            Toast.show('Missing user info');
            return null;
        }

        const effectiveToken = impersonating && patient_token ? patient_token : token;

        if (!effectiveToken) {
            Toast.show('Missing token');
            return null;
        }

        return {
            token: effectiveToken,
            userId: user.id_customer,
        };
    };

    // NEW FUNCTION: Fetch chat history from API
    const fetchChatHistory = async (skip = 0, isRefresh = false) => {
        const auth = getAuthFormData();
        if (!auth) return;

        if (isRefresh) {
            setIsRefreshing(true);
        } else {
            setIsLoadingHistory(true);
        }

        try {
            console.log('🔄 Fetching chat history with skip:', skip);

            const requestBody = {
                security_token: auth.token,
                user_id: auth.userId,
                skip: skip,
                limit: 20
            };

            const response = await fetch('https://app.surasole.com/chat/history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const status = response.status;
            const data = await response.json();

            console.log('📨 History API status:', status);
            console.log('📨 History response:', data);

            if (status === 200 && Array.isArray(data)) {
                // Convert API format to our message format
                const convertedHistory = convertHistoryToMessages(data);

                if (isRefresh || skip === 0) {
                    // Replace all history on refresh or initial load
                    setChatHistory(convertedHistory);
                    setHistorySkip(data.length);
                } else {
                    // Append to existing history for pagination
                    setChatHistory(prev => [...convertedHistory, ...prev]);
                    setHistorySkip(prev => prev + data.length);
                }

                // Check if there's more data
                setHasMoreHistory(data.length === 20);
                setHistoryLoaded(true);
            } else {
                console.error('❌ History API error:', status, data);
                Toast.show('Failed to load chat history');
            }
        } catch (error) {
            console.error('❌ History fetch error:', error);
            Toast.show('Failed to load chat history');
        } finally {
            setIsLoadingHistory(false);
            setIsRefreshing(false);
        }
    };

    // NEW FUNCTION: Convert API history format to our message format
    const convertHistoryToMessages = (historyData) => {
        const messages = [];

        // Sort by created_at in ascending order (oldest first)
        const sortedHistory = historyData.sort((a, b) =>
            new Date(a.created_at) - new Date(b.created_at)
        );

        sortedHistory.forEach(item => {
            // Add user message
            messages.push({
                type: 'user',
                text: item.message,
                timestamp: item.created_at,
                historyId: item.id
            });

            // Add bot response
            messages.push({
                type: 'bot',
                text: item.response,
                audio: item.is_voice === 1 ? item.voice_url : null,
                timestamp: item.created_at,
                historyId: item.id
            });
        });

        return messages;
    };

    // NEW FUNCTION: Load more history (pagination)
    const loadMoreHistory = async () => {
        if (!hasMoreHistory || isLoadingHistory) return;
        await fetchChatHistory(historySkip);
    };

    // NEW FUNCTION: Handle refresh
    const handleRefresh = async () => {
        setHistorySkip(0);
        setHasMoreHistory(true);
        await fetchChatHistory(0, true);
    };

    // NEW FUNCTION: Get all messages (history + current)
    const getAllMessages = () => {
        return [...chatHistory, ...messages];
    };

    // MODIFIED: Load history on component mount
    useEffect(() => {
        fetchChatHistory(0);
    }, []);

    const sendMessageToAPI = async (formData) => {
        setIsTyping(true);
        try {
            // debugFormData(formData);

            const res = await fetch('https://app.surasole.com/api/voice-chat/', {
                method: 'POST',
                headers: { 'Content-Type': 'multipart/form-data' },
                body: formData,
            });

            const status = res.status;
            const rawText = await res.text();

            console.log('📨 Chatbot API status:', status);
            console.log('📨 Raw response text:', rawText);

            let data;
            try {
                data = JSON.parse(rawText);
                console.log('✅ Parsed response:', data);
            } catch (e) {
                console.error('❌ Failed to parse JSON:', e);
                Toast.show('Invalid server response');
                return;
            }

            if (status !== 200) {
                console.error('❌ Server returned error status:', status, data);
                Toast.show(data?.message || 'Server error');
                return;
            }

            if (data?.text_response) {
                addMessage('bot', data.text_response, data.voice_url);
            } else {
                Toast.show('No response from server');
            }
        } catch (error) {
            console.error('Chatbot API error:', error);
            Toast.show('Chatbot API failed');
        } finally {
            setIsTyping(false);
        }
    };

    const handleSendText = async () => {
        if (!input.trim() || inputDisabled) return;

        const message = input.trim();
        setInput('');
        setInputDisabled(true);
        addMessage('user', message);

        const auth = getAuthFormData();
        if (!auth) return;

        const formData = new FormData();
        formData.append('text', message);
        formData.append('security_token', auth.token);
        formData.append('user_id', auth.userId);

        await sendMessageToAPI(formData);
        setTimeout(() => setInputDisabled(false), 1000);
    };

    const startRecording = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                Toast.show('Microphone permission denied');
                return;
            }
        }

        try {
            await audioRecorderPlayer.removeRecordBackListener();
            await audioRecorderPlayer.startRecorder();
            setIsRecording(true);
        } catch (err) {
            console.error('Recording error:', err);
        }
    };

    const stopRecording = async () => {
        try {
            const filePath = await audioRecorderPlayer.stopRecorder();
            await audioRecorderPlayer.removeRecordBackListener();
            setIsRecording(false);

            if (!filePath) {
                Toast.show('Recording failed');
                return;
            }

            addMessage('user', '🎤 Voice message sent');

            const auth = getAuthFormData();
            if (!auth) return;

            const formData = new FormData();
            formData.append('audio_file', {
                uri: Platform.OS === 'android' ? 'file://' + filePath : filePath,
                name: 'voice.mp4',
                type: 'audio/mp4',
            });
            formData.append('security_token', auth.token);
            formData.append('user_id', auth.userId);

            await sendMessageToAPI(formData);
        } catch (err) {
            console.error('Stop recording error:', err);
        }
    };

    const playAudio = (url) => {
        if (soundRef.current) {
            soundRef.current.stop(() => {
                soundRef.current.release();
                soundRef.current = null;
            });
        }

        const sound = new Sound(url, null, (error) => {
            if (error) {
                console.log('Sound load error:', error);
                return;
            }
            soundRef.current = sound;
            sound.play(success => {
                if (!success) {
                    Toast.show('Playback failed');
                }
                sound.release();
            });
        });
    };

    // NEW FUNCTION: Format timestamp for display (always show time only)
    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // NEW FUNCTION: Handle scroll to load more
    const handleScroll = (event) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

        // Check if user scrolled to top (with some threshold)
        if (contentOffset.y <= 50 && hasMoreHistory && !isLoadingHistory) {
            loadMoreHistory();
        }
    };

    useEffect(() => {
        return () => {
            if (soundRef.current) {
                soundRef.current.stop(() => {
                    soundRef.current.release();
                    soundRef.current = null;
                });
            }
        };
    }, []);

    const allMessages = getAllMessages();

    return (
        <View style={styles.container}>
            <HeaderFix
                icon_left={'left'}
                onpress_left={() => navigation.goBack()}
                title={getLocalizedText(lang, langChatbot.title)}
            />

            <ScrollView
                ref={scrollRef}
                style={styles.chatContainer}
                contentContainerStyle={{ padding: 12 }}
                onContentSizeChange={scrollToEnd}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={['#00A499']}
                        tintColor="#00A499"
                        title="Pull to refresh chat history"
                        titleColor="#00A499"
                    />
                }
            >
                {/* Loading indicator for fetching more history */}
                {isLoadingHistory && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color="#00A499" size="small" />
                        <Text style={styles.loadingText}>Loading chat history...</Text>
                    </View>
                )}

                {/* Load More button (alternative to auto-load) */}
                {hasMoreHistory && !isLoadingHistory && historyLoaded && (
                    <TouchableOpacity style={styles.loadMoreButton} onPress={loadMoreHistory}>
                        <Text style={styles.loadMoreText}>Load More Messages</Text>
                    </TouchableOpacity>
                )}

                {/* Chat messages */}
                {allMessages.map((msg, index) => {
                    const isNewDay = index === 0 ||
                        new Date(msg.timestamp).toDateString() !==
                        new Date(allMessages[index - 1].timestamp).toDateString();

                    return (
                        <View key={msg.historyId ? `history-${msg.historyId}-${msg.type}` : `current-${index}`}>
                            {/* Date separator */}
                            {isNewDay && (
                                <View style={styles.dateSeparator}>
                                    <Text style={styles.dateText}>
                                        {new Date(msg.timestamp).toLocaleDateString([], {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </Text>
                                </View>
                            )}

                            {/* Message bubble */}
                            <View
                                style={[
                                    styles.messageBubble,
                                    msg.type === 'user' ? styles.userBubble : styles.botBubble,
                                ]}
                            >
                                <Text style={msg.type === 'user' ? styles.userText : styles.botText}>
                                    {msg.text}
                                </Text>

                                {/* Audio button for bot messages */}
                                {msg.type === 'bot' && msg.audio && (
                                    <TouchableOpacity
                                        style={styles.volumeIcon}
                                        onPress={() => playAudio(msg.audio)}
                                    >
                                        <Image
                                            source={require('../../../assets/image/Chat/mediumVolume.png')}
                                            style={{ width: 18, height: 18, tintColor: '#fff' }}
                                            resizeMode="contain"
                                        />
                                    </TouchableOpacity>
                                )}

                                {/* Timestamp */}
                                <Text style={[
                                    styles.timestampText,
                                    msg.type === 'user' ? styles.userTimestamp : styles.botTimestamp
                                ]}>
                                    {formatMessageTime(msg.timestamp)}
                                </Text>
                            </View>
                        </View>
                    );
                })}

                {/* Typing indicator */}
                {isTyping && (
                    <View style={[styles.messageBubble, styles.botBubble]}>
                        <ActivityIndicator color="#fff" size="small" />
                    </View>
                )}
            </ScrollView>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.inputBox}
                        placeholder={getLocalizedText(lang, langChatbot.askAnything)}
                        placeholderTextColor="#A0A0A0"
                        value={input}
                        onChangeText={setInput}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, { opacity: input.trim() ? 1 : 0.5 }]}
                        onPress={handleSendText}
                        disabled={!input.trim() || inputDisabled}
                    >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{sendText}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.audioButton, { backgroundColor: isRecording ? 'red' : '#007D75' }]}
                        onPress={isRecording ? stopRecording : startRecording}
                    >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                            {isRecording ? '■' : '🎤'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E6FCFB' },
    chatContainer: {
        flex: 1,
        marginHorizontal: 16,
        marginTop: 20,
        borderWidth: 1.5,
        borderColor: '#00A499',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    messageBubble: {
        maxWidth: '85%',
        marginBottom: 12,
        padding: 10,
        borderRadius: 12,
        position: 'relative',
        paddingBottom: 25,
        minWidth: 50,
    },
    userBubble: {
        backgroundColor: '#F0F0F0',
        alignSelf: 'flex-end',
        borderTopRightRadius: 0,
    },
    botBubble: {
        backgroundColor: '#00A499',
        alignSelf: 'flex-start',
        borderTopLeftRadius: 0,
    },
    userText: { color: '#333333', fontSize: 15 },
    botText: { color: '#ffffff', fontSize: 15 },
    volumeIcon: {
        position: 'absolute',
        bottom: 6,
        right: 8,
    },
    timestampText: {
        position: 'absolute',
        bottom: 4,
        fontSize: 10,
        opacity: 0.7,
        maxWidth: '90%', // Prevent overflow
    },
    userTimestamp: {
        color: '#666666',
        right: 8,
        textAlign: 'right',
    },
    botTimestamp: {
        color: '#ffffff',
        left: 8,
        textAlign: 'left',
    },
    dateSeparator: {
        alignItems: 'center',
        marginVertical: 15,
    },
    dateText: {
        backgroundColor: '#E0E0E0',
        color: '#666666',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
        fontSize: 12,
        fontWeight: '500',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
    },
    loadingText: {
        color: '#00A499',
        marginLeft: 8,
        fontSize: 14,
    },
    loadMoreButton: {
        alignSelf: 'center',
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#00A499',
    },
    loadMoreText: {
        color: '#00A499',
        fontSize: 14,
        fontWeight: '500',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginVertical: 12,
    },
    inputBox: {
        flex: 1,
        height: 48,
        borderWidth: 1.5,
        borderColor: '#00A499',
        borderRadius: 25,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#333333',
        backgroundColor: '#FFFFFF',
    },
    sendButton: {
        backgroundColor: '#00A499',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginLeft: 8,
        borderRadius: 24,
    },
    audioButton: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        marginLeft: 6,
        borderRadius: 24,
    },
});

const mapStateToProps = state => ({
    user: state.user,
    token: state.token,
    patient_token: state.patient_token,
    impersonating: state.impersonating,
    lang: state.lang,
});

export default connect(mapStateToProps)(Chatbot);