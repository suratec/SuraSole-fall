import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Dimensions, View, Text, TouchableOpacity, Alert, ScrollView, PanResponder } from 'react-native';
import HeaderFix from '../../common/HeaderFix';
import { useSelector } from 'react-redux';
import langTraining from '../../../assets/language/menu/lang_training';
import { getLocalizedText } from "../../../assets/language/langUtils";

const { width, height } = Dimensions.get('window');

export default function ModerateRiskExercise({ navigation }) {
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [exercises, setExercises] = useState([]);
    const lang = useSelector(state => state.lang);
    const scrollViewRef = useRef(null);

    const days = [
        { key: 'monday', label: getLocalizedText(lang, langTraining.days.monday), emoji: '🚶‍♂️' },
        { key: 'wednesday', label: getLocalizedText(lang, langTraining.days.wednesday), emoji: '🪑' },
        { key: 'friday', label: getLocalizedText(lang, langTraining.days.friday), emoji: '⚖️' }
    ];

    // Fetch exercises from API to enable linking
    useEffect(() => {
        fetchExercises();
    }, []);

    const fetchExercises = async () => {
        try {
            const response = await fetch('https://api1.suratec.co.th/exercise-videos');
            const result = await response.json();
            if (result.status === 'success' && result.data) {
                setExercises(result.data);
            }
        } catch (error) {
            console.error('Error fetching exercises:', error);
        }
    };

    // Exercise linking logic - checks if exercise exists in API
    const findExerciseInAPI = (exerciseName) => {
        return exercises.find(ex =>
            ex.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim() ===
            exerciseName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim() ||
            ex.title.toLowerCase().includes(exerciseName.toLowerCase()) ||
            exerciseName.toLowerCase().includes(ex.title.toLowerCase())
        );
    };

    const handleExercisePress = (exerciseName) => {
        console.log('🔗 ModerateRiskExercise - Exercise clicked:', exerciseName);
        const matchedExercise = findExerciseInAPI(exerciseName);
        console.log('🔗 ModerateRiskExercise - Matched exercise:', matchedExercise);

        if (matchedExercise) {
            const selectedExerciseData = {
                exercise_id: matchedExercise.exercise_id,
                title: matchedExercise.title,
                video: convertToEmbedUrl(matchedExercise.youtube_url)
            };

            console.log('🔗 ModerateRiskExercise - Navigating with data:', selectedExerciseData);

            navigation.navigate('ExerciseWorkOut', {
                selectedExercise: selectedExerciseData
            });
        } else {
            console.log('❌ ModerateRiskExercise - Exercise not found in API');
            Alert.alert(
                getLocalizedText(lang, langTraining.exerciseNotFound.title),
                getLocalizedText(lang, langTraining.exerciseNotFound.message)
            );
        }
    };

    const convertToEmbedUrl = (youtubeUrl) => {
        let videoId = '';
        if (youtubeUrl.includes('youtu.be/')) {
            videoId = youtubeUrl.split('youtu.be/')[1].split('?')[0];
        } else if (youtubeUrl.includes('youtube.com/watch?v=')) {
            videoId = youtubeUrl.split('v=')[1].split('&')[0];
        }
        return `https://www.youtube.com/embed/${videoId}`;
    };

    // Enhanced Exercise Item component with selective linking
    const ExerciseItem = ({ children, exerciseName, isTitle = false }) => {
        const exerciseExists = findExerciseInAPI(exerciseName);

        if (isTitle && exerciseExists) {
            return (
                <TouchableOpacity onPress={() => handleExercisePress(exerciseName)} style={styles.exerciseButton}>
                    <Text style={[styles.exerciseItem, styles.clickableExercise]}>
                        {children} 📹
                    </Text>
                </TouchableOpacity>
            );
        }
        return <Text style={styles.exerciseItem}>{children}</Text>;
    };

    // Swipe gesture handling
    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: (evt, gestureState) => {
            return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
        },
        onPanResponderMove: (evt, gestureState) => {},
        onPanResponderRelease: (evt, gestureState) => {
            if (gestureState.dx > 50 && selectedDayIndex > 0) {
                // Swipe right - go to previous day
                handleDayChange(selectedDayIndex - 1);
            } else if (gestureState.dx < -50 && selectedDayIndex < days.length - 1) {
                // Swipe left - go to next day
                handleDayChange(selectedDayIndex + 1);
            }
        },
    });

    const handleDayChange = (newIndex) => {
        setSelectedDayIndex(newIndex);
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ x: newIndex * width, animated: true });
        }
    };

    const renderMondayContent = () => (
        <ScrollView style={styles.pageContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.dayHeader}>🗓️ {getLocalizedText(lang, langTraining.mondayModerate.title)}</Text>

            {/* Warm Up */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔹 {getLocalizedText(lang, langTraining.warmUp.title)} (5 min)</Text>
                <Text style={styles.simpleText}>• {getLocalizedText(lang, langTraining.mondayModerate.warmUp.slowWalk)}</Text>
                <Text style={styles.simpleText}>• {getLocalizedText(lang, langTraining.mondayModerate.warmUp.armCircles)}</Text>
                <Text style={styles.simpleText}>• {getLocalizedText(lang, langTraining.mondayModerate.warmUp.lightStretch)}</Text>
            </View>

            {/* Walk */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🚶‍♂️ {getLocalizedText(lang, langTraining.mondayModerate.walk.title)} (15 min)</Text>
                <Text style={styles.simpleText}>• {getLocalizedText(lang, langTraining.mondayModerate.walk.instruction)}</Text>
                <Text style={styles.simpleText}>• {getLocalizedText(lang, langTraining.mondayModerate.walk.pace)}</Text>
                <Text style={styles.simpleText}>• {getLocalizedText(lang, langTraining.mondayModerate.walk.rest)}</Text>
            </View>

            {/* Cool Down */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🧘 {getLocalizedText(lang, langTraining.coolDown.title)} (5 min)</Text>
                <Text style={styles.subText}>{getLocalizedText(lang, langTraining.coolDown.instruction)}</Text>
                <Text style={styles.simpleText}>• {getLocalizedText(lang, langTraining.coolDown.thighStretch)}</Text>
                <Text style={styles.simpleText}>• {getLocalizedText(lang, langTraining.coolDown.hamstringStretch)}</Text>
                <Text style={styles.simpleText}>• {getLocalizedText(lang, langTraining.coolDown.calfStretch)}</Text>
                <Text style={styles.simpleText}>• {getLocalizedText(lang, langTraining.coolDown.backStretch)}</Text>
            </View>
        </ScrollView>
    );

    const renderWednesdayContent = () => (
        <ScrollView style={styles.pageContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.dayHeader}>🗓️ {getLocalizedText(lang, langTraining.wednesdayModerate.title)}</Text>

            {/* Warm Up */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔹 {getLocalizedText(lang, langTraining.warmUp.title)} (5 min)</Text>
                <Text style={styles.simpleText}>• {getLocalizedText(lang, langTraining.wednesdayModerate.warmUp)}</Text>
            </View>

            {/* Strength Exercises */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>💪 {getLocalizedText(lang, langTraining.wednesdayModerate.strength.title)}</Text>
                <Text style={styles.subText}>10 reps × 3 sets each</Text>

                <View style={styles.exerciseGroup}>
                    <ExerciseItem exerciseName="Seated Dead Bug" isTitle={true}>
                        🪑 Seated Dead Bug
                    </ExerciseItem>
                    <Text style={styles.instructionText}>{getLocalizedText(lang, langTraining.wednesdayModerate.strength.seatedDeadBug)}</Text>

                    <ExerciseItem exerciseName="Seated Side Bends" isTitle={true}>
                        ↔️ Seated Side Bends
                    </ExerciseItem>
                    <Text style={styles.instructionText}>{getLocalizedText(lang, langTraining.wednesdayModerate.strength.seatedSideBends)}</Text>

                    <ExerciseItem exerciseName="Seated Forward Roll-Ups" isTitle={true}>
                        ↘️ Seated Forward Roll
                    </ExerciseItem>
                    <Text style={styles.instructionText}>{getLocalizedText(lang, langTraining.wednesdayModerate.strength.seatedForwardRoll)}</Text>

                    <ExerciseItem exerciseName="Wood Chops" isTitle={true}>
                        🪓 Wood Chops
                    </ExerciseItem>
                    <Text style={styles.instructionText}>{getLocalizedText(lang, langTraining.wednesdayModerate.strength.woodChops)}</Text>

                    <ExerciseItem exerciseName="Wall Planks" isTitle={true}>
                        🧱 Wall Planks (10s hold)
                    </ExerciseItem>
                    <Text style={styles.instructionText}>{getLocalizedText(lang, langTraining.wednesdayModerate.strength.wallPlank)}</Text>
                </View>
            </View>

            {/* Cool Down */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🧘 {getLocalizedText(lang, langTraining.coolDown.title)} (5 min)</Text>
                <Text style={styles.subText}>{getLocalizedText(lang, langTraining.coolDown.instruction)}</Text>
                <Text style={styles.simpleText}>• {getLocalizedText(lang, langTraining.coolDown.thighStretch)}</Text>
                <Text style={styles.simpleText}>• {getLocalizedText(lang, langTraining.coolDown.hamstringStretch)}</Text>
                <Text style={styles.simpleText}>• {getLocalizedText(lang, langTraining.coolDown.calfStretch)}</Text>
                <Text style={styles.simpleText}>• {getLocalizedText(lang, langTraining.coolDown.backStretch)}</Text>
            </View>
        </ScrollView>
    );

    const renderFridayContent = () => (
        <ScrollView style={styles.pageContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.dayHeader}>🗓️ {getLocalizedText(lang, langTraining.fridayModerate.title)}</Text>

            {/* Warm Up */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔹 {getLocalizedText(lang, langTraining.warmUp.title)} (5 min)</Text>
                <Text style={styles.simpleText}>• {getLocalizedText(lang, langTraining.fridayModerate.warmUp)}</Text>
            </View>

            {/* Balance Exercises */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚖️ {getLocalizedText(lang, langTraining.fridayModerate.balance.title)}</Text>
                <Text style={styles.subText}>10 reps × 3 sets each</Text>

                <View style={styles.exerciseGroup}>
                    <ExerciseItem exerciseName="Single Limb Stance" isTitle={true}>
                        🦵 One-Leg Stand
                    </ExerciseItem>
                    <Text style={styles.instructionText}>{getLocalizedText(lang, langTraining.fridayModerate.balance.oneLegStand)}</Text>

                    <ExerciseItem exerciseName="Rock the Boat" isTitle={true}>
                        🚤 Rock the Boat
                    </ExerciseItem>
                    <Text style={styles.instructionText}>{getLocalizedText(lang, langTraining.fridayModerate.balance.rockTheBoat)}</Text>

                    <ExerciseItem exerciseName="Back Leg Raises" isTitle={true}>
                        🔙 Back Leg Raises
                    </ExerciseItem>
                    <Text style={styles.instructionText}>{getLocalizedText(lang, langTraining.fridayModerate.balance.backLegRaises)}</Text>

                    <ExerciseItem exerciseName="Side Leg Raise" isTitle={true}>
                        ➡️ Side Leg Raises
                    </ExerciseItem>
                    <Text style={styles.instructionText}>{getLocalizedText(lang, langTraining.fridayModerate.balance.sideLegRaises)}</Text>

                    <ExerciseItem exerciseName="Toe Lifts" isTitle={true}>
                        📏 Tiptoe Lifts
                    </ExerciseItem>
                    <Text style={styles.instructionText}>{getLocalizedText(lang, langTraining.fridayModerate.balance.tiptoeLifts)}</Text>

                    <ExerciseItem exerciseName="Wall Pushups" isTitle={true}>
                        🧱 Wall Push-ups
                    </ExerciseItem>
                    <Text style={styles.instructionText}>{getLocalizedText(lang, langTraining.fridayModerate.balance.wallPushUps)}</Text>
                </View>
            </View>

            {/* Cool Down */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🧘 {getLocalizedText(lang, langTraining.coolDown.title)} (5 min)</Text>
                <Text style={styles.subText}>{getLocalizedText(lang, langTraining.coolDown.instruction)}</Text>
                <Text style={styles.simpleText}>• {getLocalizedText(lang, langTraining.coolDown.thighStretch)}</Text>
                <Text style={styles.simpleText}>• {getLocalizedText(lang, langTraining.coolDown.hamstringStretch)}</Text>
                <Text style={styles.simpleText}>• {getLocalizedText(lang, langTraining.coolDown.calfStretch)}</Text>
                <Text style={styles.simpleText}>• {getLocalizedText(lang, langTraining.coolDown.backStretch)}</Text>
            </View>
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            <HeaderFix
                icon_left="left"
                onpress_left={() => navigation.goBack()}
                title={getLocalizedText(lang, langTraining.moderateRiskProgram)}
            />

            {/* Day Tabs */}
            <View style={styles.tabContainer}>
                {days.map((day, index) => (
                    <TouchableOpacity
                        key={day.key}
                        style={[
                            styles.tab,
                            selectedDayIndex === index && styles.activeTab
                        ]}
                        onPress={() => handleDayChange(index)}
                    >
                        <Text style={styles.tabEmoji}>{day.emoji}</Text>
                        <Text style={[
                            styles.tabText,
                            selectedDayIndex === index && styles.activeTabText
                        ]}>
                            {day.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Swipeable Content */}
            <View style={styles.contentWrapper} {...panResponder.panHandlers}>
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(event) => {
                        const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
                        setSelectedDayIndex(newIndex);
                    }}
                    scrollEventThrottle={16}
                >
                    {renderMondayContent()}
                    {renderWednesdayContent()}
                    {renderFridayContent()}
                </ScrollView>
            </View>

            {/* Swipe Indicator */}
            <View style={styles.indicatorContainer}>
                <Text style={styles.swipeIndicator}>← Swipe to navigate between days →</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        marginHorizontal: 4,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    activeTab: {
        backgroundColor: '#00A499',
        borderColor: '#00A499',
    },
    tabEmoji: {
        fontSize: 20,
        marginBottom: 4,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6c757d',
        textAlign: 'center',
    },
    activeTabText: {
        color: '#ffffff',
    },
    contentWrapper: {
        flex: 1,
    },
    pageContainer: {
        width: width,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 40,
    },
    dayHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: '#00A499',
        marginBottom: 16,
        textAlign: 'center',
    },
    section: {
        marginBottom: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#00A499',
        marginBottom: 8,
    },
    subText: {
        fontSize: 13,
        color: '#6c757d',
        fontStyle: 'italic',
        marginBottom: 8,
    },
    simpleText: {
        fontSize: 14,
        color: '#495057',
        marginVertical: 2,
        lineHeight: 18,
    },
    exerciseGroup: {
        marginTop: 6,
    },
    exerciseButton: {
        marginVertical: 4,
        padding: 10,
        backgroundColor: '#ffffff',
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#007bff',
    },
    exerciseItem: {
        fontSize: 15,
        fontWeight: '600',
        color: '#495057',
        lineHeight: 20,
    },
    instructionText: {
        fontSize: 13,
        color: '#6c757d',
        marginTop: 4,
        marginLeft: 6,
        lineHeight: 18,
        fontStyle: 'italic',
    },
    clickableExercise: {
        color: '#007bff',
        fontWeight: '700',
    },
    indicatorContainer: {
        paddingVertical: 8,
        backgroundColor: '#f8f9fa',
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    swipeIndicator: {
        textAlign: 'center',
        fontSize: 12,
        color: '#6c757d',
        fontStyle: 'italic',
    },
});