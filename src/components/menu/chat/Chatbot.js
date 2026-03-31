// src/components/menu/chat/Chatbot.js

import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StyleSheet, Dimensions, Platform, KeyboardAvoidingView,
    Image, PermissionsAndroid, ActivityIndicator, RefreshControl
} from 'react-native';
import { connect } from 'react-redux';
import { Player } from '@react-native-community/audio-toolkit';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import HeaderFix from '../../common/HeaderFix';
import { ToastAndroid } from 'react-native'; // Replaced simple-toast
import langChatbot from '../../../assets/language/menu/lang_chatbot';
import {getLocalizedText} from '../../../assets/language/langUtils';
import RNFS from 'react-native-fs';

const { width } = Dimensions.get('window');
const audioRecorderPlayer = new AudioRecorderPlayer();

function Chatbot({ navigation, user, token, lang, impersonating, patient_token }) {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [inputDisabled, setInputDisabled] = useState(false);

    // ✅ New state for audio playback control
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPlayingMessageId, setCurrentPlayingMessageId] = useState(null);

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

    const guessFileMeta = (path) => {
        const lower = path.toLowerCase();
        if (lower.endsWith('.m4a')) return { name: 'voice.m4a', type: 'audio/m4a' };
        if (lower.endsWith('.mp4')) return { name: 'voice.mp4', type: 'audio/mp4' };
        if (lower.endsWith('.aac')) return { name: 'voice.aac', type: 'audio/aac' };
        if (lower.endsWith('.wav')) return { name: 'voice.wav', type: 'audio/wav' };
        // Fallback: most mobile recorders = AAC in M4A/MP4
        return { name: 'voice.m4a', type: 'audio/m4a' };
    };


    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    async function ensureNonEmpty(path) {
        // Normalize URI → absolute file path for RNFS.stat
        const abs = path.startsWith('file://') ? path.replace('file://', '') : path;

        for (let i = 0; i < 5; i++) {
            try {
                const stat = await RNFS.stat(abs);
                if (stat.isFile() && Number(stat.size) > 0) return true;
            } catch {}
            await sleep(120); // brief backoff; total ~600ms
        }
        return false;
    }


    const scrollToEnd = () => {
        scrollRef.current?.scrollToEnd({ animated: true });
    };

    // ✅ Updated addMessage to include unique IDs
    const addMessage = (type, text, audio = null) => {
        setMessages(prev => {
            const messageId = `${Date.now()}-${Math.random()}`;
            const updated = [...prev, {
                id: messageId,
                type,
                text,
                audio,
                timestamp: new Date().toISOString()
            }];
            setTimeout(scrollToEnd, 100);
            return updated;
        });
    };

    const getAuthFormData = () => {
        if (!user?.id_customer) {
            ToastAndroid.show('Missing user info', ToastAndroid.SHORT);
            return null;
        }

        const effectiveToken = impersonating && patient_token ? patient_token : token;

        if (!effectiveToken) {
            ToastAndroid.show('Missing token', ToastAndroid.SHORT);
            return null;
        }

        return {
            token: effectiveToken,
            userId: user.id_customer,
            securityToken: user.security_token || effectiveToken
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
                security_token: auth.securityToken,
                user_id: auth.userId,
                skip: skip,
                limit: 20
            };

            const response = await fetch('https://app.surasole.com/chat/history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.token}`
                },
                body: JSON.stringify(requestBody),
            });

            const status = response.status;
            const rawText = await response.text();

            console.log('📨 History API status:', status);
            console.log('📨 Raw history response:', rawText);

            let data;
            try {
                data = JSON.parse(rawText);
            } catch (e) {
                console.error('❌ Failed to parse History JSON:', e);
                // If it fails to parse, we can't continue with the data
                return;
            }

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
                ToastAndroid.show('Failed to load chat history', ToastAndroid.SHORT);
            }
        } catch (error) {
            console.error('❌ History fetch error:', error);
            ToastAndroid.show('Failed to load chat history', ToastAndroid.SHORT);
        } finally {
            setIsLoadingHistory(false);
            setIsRefreshing(false);
        }
    };

    // ✅ Updated convertHistoryToMessages to include unique IDs
    const convertHistoryToMessages = (historyData) => {
        const messages = [];

        // Sort by created_at in ascending order (oldest first)
        const sortedHistory = historyData.sort((a, b) =>
            new Date(a.created_at) - new Date(b.created_at)
        );

        sortedHistory.forEach((item) => {
            const rowUniqueId = Math.random().toString(36).substring(7);
            // Add user message
            messages.push({
                id: `history-${item.id}-user-${rowUniqueId}`,
                type: 'user',
                text: item.message,
                timestamp: item.created_at,
                historyId: item.id
            });

            // Add bot response
            messages.push({
                id: `history-${item.id}-bot-${rowUniqueId}`,
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
                // headers: { 'Content-Type': 'multipart/form-data' },
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
                ToastAndroid.show('Invalid server response', ToastAndroid.SHORT);
                return;
            }

            if (status !== 200) {
                console.error('❌ Server returned error status:', status, data);
                ToastAndroid.show(data?.message || 'Server error', ToastAndroid.SHORT);
                return;
            }

            if (data?.text_response) {
                addMessage('bot', data.text_response, data.voice_url);
            } else {
                ToastAndroid.show('No response from server', ToastAndroid.SHORT);
            }
        } catch (error) {
            console.error('Chatbot API error:', error);
            ToastAndroid.show('Chatbot API failed', ToastAndroid.SHORT);
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
                ToastAndroid.show('Microphone permission denied', ToastAndroid.SHORT);
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
                ToastAndroid.show('Recording failed', ToastAndroid.SHORT);
                return;
            }

            const ready = await ensureNonEmpty(filePath);
            if (!ready) {
                ToastAndroid.show('Audio not ready. Please try again.', ToastAndroid.SHORT);
                return;
            }

            addMessage('user', '🎤 Voice message sent');

            const auth = getAuthFormData();
            if (!auth) return;

            const uri = Platform.OS === 'android' ? (filePath.startsWith('file://') ? filePath : 'file://' + filePath) : filePath;
            const meta = guessFileMeta(filePath);

            const formData = new FormData();
            formData.append('audio_file', {
                uri: Platform.OS === 'android' ? 'file://' + filePath : filePath,
                name: 'voice.mp4',
                type: 'audio/mp4',
            });
            formData.append('audio_file', { uri, ...meta });
            formData.append('security_token', auth.token);
            formData.append('user_id', auth.userId);

            await sendMessageToAPI(formData);
        } catch (err) {
            console.error('Stop recording error:', err);
        }
    };

    // ✅ Updated playAudio function using audio-toolkit
    const playAudio = (url, messageId) => {
        // If already playing this audio, stop it
        if (isPlaying && currentPlayingMessageId === messageId) {
            stopAudio();
            return;
        }

        // Stop any currently playing audio
        stopAudio();

        setIsPlaying(true);
        setCurrentPlayingMessageId(messageId);

        try {
            const player = new Player(url, {
                autoDestroy: true,
                continuesToPlayInBackground: true
            });

            soundRef.current = player;

            player.play((err) => {
                if (err) {
                    console.error('Playback error:', err);
                    setIsPlaying(false);
                    setCurrentPlayingMessageId(null);
                    ToastAndroid.show('Playback failed', ToastAndroid.SHORT);
                    return;
                }
            });

            player.on('ended', () => {
                setIsPlaying(false);
                setCurrentPlayingMessageId(null);
                soundRef.current = null;
            });

            player.on('error', (err) => {
                console.error('Player error:', err);
                setIsPlaying(false);
                setCurrentPlayingMessageId(null);
                soundRef.current = null;
            });

        } catch (e) {
            console.error('❌ Player constructor error:', e);
            setIsPlaying(false);
            setCurrentPlayingMessageId(null);
            ToastAndroid.show('Audio system error', ToastAndroid.SHORT);
        }
    };

    // ✅ Updated function to stop audio playback using audio-toolkit
    const stopAudio = () => {
        if (soundRef.current) {
            soundRef.current.stop();
            soundRef.current.destroy();
            soundRef.current = null;
        }
        setIsPlaying(false);
        setCurrentPlayingMessageId(null);
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

    // ✅ Updated cleanup effect
    useEffect(() => {
        return () => {
            stopAudio(); // Clean up on unmount
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

            {/* ✅ Removed global stop button */}

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

                    const isCurrentlyPlaying = isPlaying && currentPlayingMessageId === msg.id;

                    return (
                        <View key={msg.id}>
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
                                    // ✅ Removed red border style
                                ]}
                            >
                                <Text style={msg.type === 'user' ? styles.userText : styles.botText}>
                                    {msg.text}
                                </Text>

                                {/* ✅ Updated audio button with better stop icon */}
                                {msg.type === 'bot' && msg.audio && (
                                    <TouchableOpacity
                                        style={[
                                            styles.volumeIcon,
                                            isCurrentlyPlaying && styles.playingIcon
                                        ]}
                                        onPress={() => playAudio(msg.audio, msg.id)}
                                    >
                                        {isCurrentlyPlaying ? (
                                            // ✅ Better stop icon - using pause symbol
                                            <View style={styles.pauseIcon}>
                                                <View style={styles.pauseBar} />
                                                <View style={styles.pauseBar} />
                                            </View>
                                        ) : (
                                            <Image
                                                source={require('../../../assets/image/Chat/mediumVolume.png')}
                                                style={{ width: 18, height: 18, tintColor: '#fff' }}
                                                resizeMode="contain"
                                            />
                                        )}
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

// ✅ Updated styles - removed global stop and red border, added better pause icon
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
    // ✅ Removed globalStopContainer, globalStopButton, globalStopIcon, globalStopText, playingBubble
    playingIcon: {
        backgroundColor: '#4CAF50', // ✅ Changed to green background when playing
        borderRadius: 12,
        padding: 4,
    },
    // ✅ Better pause icon using two bars
    pauseIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: 18,
        height: 18,
    },
    pauseBar: {
        width: 3,
        height: 12,
        backgroundColor: '#fff',
        marginHorizontal: 1.5,
        borderRadius: 1,
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