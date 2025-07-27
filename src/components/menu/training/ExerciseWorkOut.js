import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import HeaderFix from '../../common/HeaderFix';
import UI from '../../../config/styles/CommonStyles';
import { useSelector } from 'react-redux';
import langTraining from '../../../assets/language/menu/lang_training';
import { getLocalizedText } from "../../../assets/language/langUtils";

const { width } = Dimensions.get('window');

// Helper function to convert YouTube URL to embed format
const convertToEmbedUrl = (youtubeUrl) => {
    // Handle different YouTube URL formats
    let videoId = '';

    if (youtubeUrl.includes('youtu.be/')) {
        // Format: https://youtu.be/VIDEO_ID
        videoId = youtubeUrl.split('youtu.be/')[1].split('?')[0];
    } else if (youtubeUrl.includes('youtube.com/watch?v=')) {
        // Format: https://youtube.com/watch?v=VIDEO_ID
        videoId = youtubeUrl.split('v=')[1].split('&')[0];
    } else if (youtubeUrl.includes('youtube.com/embed/')) {
        // Already in embed format
        return youtubeUrl;
    }

    return `https://www.youtube.com/embed/${videoId}`;
};

export default function ExerciseWorkOut({ navigation, route }) {
    const [selectedExercise, setSelectedExercise] = React.useState(null);
    const [exercises, setExercises] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    const lang = useSelector(state => state.lang);
    const localizedTitle = getLocalizedText(lang, langTraining.exerciseWorkOut) || 'Exercise Work Out';

    // Debug: Log navigation structure for react-navigation v4
    React.useEffect(() => {
        console.log('🔍 ExerciseWorkOut - Navigation object:', navigation);
        console.log('🔍 ExerciseWorkOut - Navigation state:', navigation.state);
        console.log('🔍 ExerciseWorkOut - Navigation params (v4):', navigation.state?.params);
        console.log('🔍 ExerciseWorkOut - Route params (v5+):', route?.params);
    }, [navigation, route]);

    // Check if exercise was passed from another screen and auto-navigate to video
    React.useEffect(() => {
        console.log('🎯 ExerciseWorkOut - Checking for pre-selected exercise...');

        // React Navigation v4 uses navigation.state.params
        const params = navigation.state?.params || route?.params;
        console.log('🎯 ExerciseWorkOut - Extracted params:', params);

        if (params?.selectedExercise) {
            console.log('✅ Pre-selected exercise found:', params.selectedExercise);
            // Set the selected exercise immediately to show the video player
            setSelectedExercise(params.selectedExercise);
            setLoading(false); // Skip the loading state since we already have the exercise
            console.log('✅ Set selectedExercise and loading to false');
        } else {
            console.log('❌ No pre-selected exercise found');
        }
    }, [navigation.state, route?.params]);

    // Fetch exercises from API (only if no exercise was pre-selected)
    React.useEffect(() => {
        console.log('🌐 ExerciseWorkOut - API fetch effect triggered');
        const params = navigation.state?.params || route?.params;

        if (!params?.selectedExercise) {
            console.log('🌐 No pre-selected exercise, fetching from API...');
            fetchExercises();
        } else {
            console.log('🌐 Pre-selected exercise exists, skipping API fetch');
        }
    }, [navigation.state, route?.params]);

    const fetchExercises = async () => {
        try {
            console.log('🌐 fetchExercises - Starting API call...');
            setLoading(true);
            setError(null);

            const response = await fetch('https://api1.suratec.co.th/exercise-videos');
            const result = await response.json();

            console.log('🌐 fetchExercises - API response:', result);

            if (result.status === 'success' && result.data) {
                // Transform API data to match component structure
                const transformedExercises = result.data.map(exercise => ({
                    exercise_id: exercise.exercise_id,
                    title: exercise.title,
                    video: convertToEmbedUrl(exercise.youtube_url)
                }));

                console.log('🌐 fetchExercises - Transformed exercises:', transformedExercises.length, 'exercises');
                setExercises(transformedExercises);
            } else {
                throw new Error('Failed to fetch exercises');
            }
        } catch (error) {
            console.error('❌ fetchExercises - Error:', error);
            setError(error.message);

            // Show error alert
            Alert.alert(
                'Error',
                'Failed to load exercises. Please check your internet connection and try again.',
                [
                    { text: 'Retry', onPress: fetchExercises },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        } finally {
            console.log('🌐 fetchExercises - Setting loading to false');
            setLoading(false);
        }
    };

    const getLocalizedExerciseTitle = (exerciseTitle) => {
        // Try to get localized title from langTraining.exercises.exerciseTitles
        const exerciseTitleObj = langTraining.exercises?.exerciseTitles?.[exerciseTitle];
        if (exerciseTitleObj) {
            return getLocalizedText(lang, exerciseTitleObj);
        }
        // Fallback to original title if no translation found
        return exerciseTitle;
    };

    // Debug: Log current state values
    React.useEffect(() => {
        console.log('📊 ExerciseWorkOut - Current state:');
        console.log('    selectedExercise:', selectedExercise);
        console.log('    loading:', loading);
        console.log('    exercises.length:', exercises.length);
        console.log('    error:', error);
    }, [selectedExercise, loading, exercises, error]);

    // Loading state (only show if we're not directly navigating to a video)
    const params = navigation.state?.params || route?.params;
    if (loading && !params?.selectedExercise) {
        console.log('🔄 ExerciseWorkOut - Showing loading state');
        return (
            <View style={{ flex: 1 }}>
                <HeaderFix
                    icon_left={'left'}
                    onpress_left={() => navigation.goBack()}
                    title={localizedTitle}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00BCD4" />
                    <Text style={styles.loadingText}>Loading exercises...</Text>
                </View>
            </View>
        );
    }

    // Error state (only show if we're not directly navigating to a video)
    if (error && exercises.length === 0 && !params?.selectedExercise) {
        console.log('❌ ExerciseWorkOut - Showing error state');
        return (
            <View style={{ flex: 1 }}>
                <HeaderFix
                    icon_left={'left'}
                    onpress_left={() => navigation.goBack()}
                    title={localizedTitle}
                />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Failed to load exercises</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchExercises}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Video player view
    if (selectedExercise) {
        console.log('🎥 ExerciseWorkOut - Showing video player for:', selectedExercise.title);
        const localizedExerciseTitle = getLocalizedExerciseTitle(selectedExercise.title);

        return (
            <View style={{ flex: 1 }}>
                <HeaderFix
                    icon_left={'left'}
                    onpress_left={() => {
                        console.log('⬅️ ExerciseWorkOut - Back button pressed');
                        const params = navigation.state?.params || route?.params;
                        // If came from another screen with pre-selected exercise, go back to that screen
                        if (params?.selectedExercise) {
                            console.log('⬅️ Going back to previous screen');
                            navigation.goBack();
                        } else {
                            // Otherwise, go back to exercise list
                            console.log('⬅️ Going back to exercise list');
                            setSelectedExercise(null);
                        }
                    }}
                    title={localizedExerciseTitle}
                />
                <WebView
                    source={{ uri: `${selectedExercise.video}?autoplay=1&controls=1` }}
                    style={{ flex: 1 }}
                    allowsFullscreenVideo
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                />
            </View>
        );
    }

    // Main exercise list view
    console.log('📋 ExerciseWorkOut - Showing exercise list');
    return (
        <View style={{ flex: 1 }}>
            <HeaderFix
                icon_left={'left'}
                onpress_left={() => navigation.goBack()}
                title={localizedTitle}
            />
            <ScrollView style={{ backgroundColor: '#E0F7FA' }} contentContainerStyle={styles.container}>
                {exercises.map((item, index) => (
                    <TouchableOpacity
                        key={item.exercise_id || index}
                        style={styles.button}
                        onPress={() => setSelectedExercise(item)}>
                        <Text style={styles.buttonText}>
                            {getLocalizedExerciseTitle(item.title)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: 16,
        paddingBottom: 60,
    },
    button: {
        borderColor: '#00BCD4',
        borderWidth: 2,
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginVertical: 6,
        width: width * 0.9,
        backgroundColor: '#fff',
    },
    buttonText: {
        color: '#00BCD4',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E0F7FA',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#00BCD4',
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E0F7FA',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#d32f2f',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#00BCD4',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});