import React, { Component } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, BackHandler, TextInput, ActivityIndicator, Alert, Dimensions, Text } from 'react-native';
import { Card } from 'native-base';
import InputFix from '../../common/InputFix';
import ButtonFix from '../../common/ButtonFix';
import UI from '../../../config/styles/CommonStyles';
import { connect } from 'react-redux';
import langNotes from '../../../assets/language/menu/lang_notes';

const { width } = Dimensions.get('window');

class NotesPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            saving: false,
            currentPage: 0, // 0 for medical conditions, 1 for walking aids/movement disorders

            // Medical conditions
            medicalConditions: {
                stroke: false,
                strokeSide: '', // 'left' or 'right'
                diabetes: false,
                diabetesDuration: '', // '<1yr' or '>1yr'
                hypertension: false,
                hypertensionLevel: '', // 'controllable', 'uncontrollable'
                dyslipidemia: false,
                dyslipidemiaLevel: '', // 'normal', 'high', 'veryHigh'
                otherDiseases: '',
            },

            // Walking aids and movement disorders
            walkingAids: {
                cane: false,
                caneSide: '', // 'left' or 'right'
                caneDuration: '', // '<1yr' or '>1yr'
                crutch: false,
                crutchSide: '', // 'left' or 'right'
                crutchDuration: '', // '<1yr' or '>1yr'
                walker: false,
                walkerDuration: '', // '<1yr' or '>1yr'
                wheelchair: false,
                wheelchairDuration: '', // '<1yr' or '>1yr'
                otherAids: '',
            },

            movementDisorders: {
                ankleLeft: false,
                ankleRight: false,
                kneeLeft: false,
                kneeRight: false,
                hipLeft: false,
                hipRight: false,
                otherInjuries: '',
            },
        };

        this.scrollViewRef = React.createRef();
    }

    componentDidMount() {
        console.log('[NotesPage] componentDidMount: Adding hardwareBackPress listener');
        // BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);

        // userId is passed as prop from parent component
        const { userId } = this.props;
        console.log('[NotesPage] userId from props:', userId);

        if (!userId) {
            console.log('[ERROR] userId is missing!');
            Alert.alert(
                this.getLocalizedText(langNotes.alertErrorTitle),
                this.getLocalizedText(langNotes.userIdMissing)
            );
            return;
        }

        this.loadUserData();
    }

    componentWillUnmount() {
        console.log('[NotesPage] componentWillUnmount: Removing hardwareBackPress listener');
        // BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
    }

    loadUserData = () => {
        // userId is passed as prop from parent component
        const { userId } = this.props;
        console.log('[INFO] Fetching data for userId:', userId);
        this.setState({ loading: true });

        fetch(`https://api1.suratec.co.th/medical-records?user_id=${userId}`)
            .then(res => res.json())
            .then(data => {
                console.log('[INFO] Fetched data:', data);
                if (data && Object.keys(data).length > 0) {
                    console.log('[INFO] Setting state from API data...');
                    const newState = {
                        medicalConditions: {
                            stroke: !!data.stroke,
                            strokeSide: data.stroke_side || '',
                            diabetes: !!data.diabetes,
                            diabetesDuration: data.diabetes_duration || '',
                            hypertension: !!data.hypertension,
                            hypertensionLevel: data.hypertension_status || '', // API uses hypertension_status
                            dyslipidemia: !!data.dyslipidemia,
                            dyslipidemiaLevel: data.dyslipidemia_level || '',
                            otherDiseases: data.other_diseases || '',
                        },
                        walkingAids: {
                            cane: !!data.uses_cane, // API uses uses_cane
                            caneSide: data.cane_side || '',
                            caneDuration: data.cane_duration || '',
                            crutch: !!data.uses_crutch, // API uses uses_crutch
                            crutchSide: data.crutch_side || '',
                            crutchDuration: data.crutch_duration || '',
                            walker: !!data.uses_walker, // API uses uses_walker
                            walkerDuration: data.walker_duration || '',
                            wheelchair: !!data.uses_wheelchair, // API uses uses_wheelchair
                            wheelchairDuration: data.wheelchair_duration || '',
                            otherAids: data.other_aids || '',
                        },
                        movementDisorders: {
                            ankleLeft: !!data.injury_ankle_left,
                            ankleRight: !!data.injury_ankle_right,
                            kneeLeft: !!data.injury_knee_left,
                            kneeRight: !!data.injury_knee_right,
                            hipLeft: !!data.injury_hip_left,
                            hipRight: !!data.injury_hip_right,
                            otherInjuries: data.other_injuries || '',
                        },
                    };

                    console.log('[INFO] New state to be set:', newState);
                    this.setState(newState, () => {
                        // Log state after it's been set
                        console.log('[INFO] State after setState:', this.state);
                    });
                } else {
                    console.log('[WARN] No valid data found in API response.');
                }
            })
            .catch(err => {
                console.error('[ERROR] Fetch failed:', err);
                if (!err.message?.includes('404')) {
                    Alert.alert(
                        this.getLocalizedText(langNotes.alertErrorTitle),
                        this.getLocalizedText(langNotes.fetchRecordFailed)
                    );
                }
            })
            .finally(() => this.setState({ loading: false }));
    };

    // handleBackPress = () => {
    //     console.log('[NotesPage] handleBackPress called');
    //     const hasChanges = this.hasUnsavedChanges();
    //
    //     if (hasChanges) {
    //         Alert.alert(
    //             this.getLocalizedText(langNotes.alertWarningTitle),
    //             this.getLocalizedText(langNotes.confirmNavigation),
    //             [
    //                 {
    //                     text: this.getLocalizedText(langNotes.no),
    //                     style: 'cancel',
    //                 },
    //                 {
    //                     text: this.getLocalizedText(langNotes.yes),
    //                     onPress: () => this.navigateBack(),
    //                 },
    //             ]
    //         );
    //         return true;
    //     } else {
    //         this.navigateBack();
    //         return true;
    //     }
    // };

    navigateBack = () => {
        if (this.props.navigation && typeof this.props.navigation.reset === 'function') {
            this.props.navigation.navigate('Profile');
        } else if (this.props.navigation && typeof this.props.navigation.goBack === 'function') {
            this.props.navigation.goBack();
        }
    };

    hasUnsavedChanges = () => {
        // Simplified check - you might want to compare with initial loaded state
        return true;
    };

    handleUpdate = () => {
        // userId is passed as prop from parent component
        const { userId } = this.props;
        if (!userId) {
            Alert.alert(
                this.getLocalizedText(langNotes.alertErrorTitle),
                this.getLocalizedText(langNotes.userIdMissing)
            );
            return;
        }

        const { medicalConditions, walkingAids, movementDisorders } = this.state;
        const payload = {
            user_id: userId,
            // Medical conditions
            stroke: medicalConditions.stroke,
            stroke_side: medicalConditions.strokeSide,
            diabetes: medicalConditions.diabetes,
            diabetes_duration: medicalConditions.diabetesDuration,
            hypertension: medicalConditions.hypertension,
            hypertension_status: medicalConditions.hypertensionLevel, // API expects hypertension_status
            dyslipidemia: medicalConditions.dyslipidemia,
            dyslipidemia_level: medicalConditions.dyslipidemiaLevel,
            other_diseases: medicalConditions.otherDiseases,

            // Walking aids - API expects uses_* format
            uses_cane: walkingAids.cane,
            cane_side: walkingAids.caneSide,
            cane_duration: walkingAids.caneDuration,
            uses_crutch: walkingAids.crutch,
            crutch_side: walkingAids.crutchSide,
            crutch_duration: walkingAids.crutchDuration,
            uses_walker: walkingAids.walker,
            walker_duration: walkingAids.walkerDuration,
            uses_wheelchair: walkingAids.wheelchair,
            wheelchair_duration: walkingAids.wheelchairDuration,
            other_aids: walkingAids.otherAids,

            // Movement disorders - API expects injury_* format
            injury_ankle_left: movementDisorders.ankleLeft,
            injury_ankle_right: movementDisorders.ankleRight,
            injury_knee_left: movementDisorders.kneeLeft,
            injury_knee_right: movementDisorders.kneeRight,
            injury_hip_left: movementDisorders.hipLeft,
            injury_hip_right: movementDisorders.hipRight,
            other_injuries: movementDisorders.otherInjuries,
        };

        console.log('[INFO] Submitting payload:', payload);
        this.setState({ saving: true });

        fetch('https://api1.suratec.co.th/medical-records', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.props.token}`,
            },
            body: JSON.stringify(payload),
        })
            .then(res => res.json())
            .then(data => {
                console.log('[SUCCESS] Update response:', data);
                Alert.alert(
                    this.getLocalizedText(langNotes.alertSuccessTitle),
                    this.getLocalizedText(langNotes.recordSavedSuccess),
                    [{ text: 'OK', onPress: () => this.navigateBack() }]
                );
            })
            .catch(err => {
                console.error('[ERROR] Update failed:', err);
                Alert.alert(
                    this.getLocalizedText(langNotes.alertErrorTitle),
                    this.getLocalizedText(langNotes.networkError)
                );
            })
            .finally(() => this.setState({ saving: false }));
    };

    getLocalizedText = (textObject) => {
        // Safety check for undefined textObject
        if (!textObject || typeof textObject !== 'object') {
            console.warn('[NotesPage] getLocalizedText: textObject is undefined or invalid');
            return '';
        }

        const langKey = ['eng', 'thai', 'japanese'][this.props.lang] || 'eng';
        return textObject[langKey] || textObject.eng || textObject.english || '';
    };

    handleScroll = (event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const page = Math.round(offsetX / width);
        this.setState({ currentPage: page });
    };

    scrollToPage = (page) => {
        this.scrollViewRef.current?.scrollTo({ x: page * width, animated: true });
        this.setState({ currentPage: page });
    };

    // Render medical condition item with checkbox and sub-options
    renderMedicalCondition = (title, mainKey, subOptions = []) => {
        const { medicalConditions } = this.state;
        const isChecked = Boolean(medicalConditions[mainKey]); // Ensure it's a boolean

        return (
            <View style={styles.conditionContainer}>
                <View style={styles.conditionMainRow}>
                    <TouchableOpacity
                        style={[styles.customCheckbox, isChecked && styles.customCheckboxChecked]}
                        onPress={() => {
                            this.setState((prevState) => ({
                                medicalConditions: {
                                    ...prevState.medicalConditions,
                                    [mainKey]: !prevState.medicalConditions[mainKey]
                                }
                            }));
                        }}
                    >
                        {isChecked && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                    <Text style={styles.conditionTitle}>{title}</Text>
                </View>

                {isChecked && subOptions.length > 0 && (
                    <View style={styles.subOptionsContainer}>
                        {subOptions.map((option, index) => {
                            const isSelected = medicalConditions[option.key] === option.value;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.subOptionButton,
                                        isSelected && styles.subOptionSelected
                                    ]}
                                    onPress={() => {
                                        this.setState((prevState) => ({
                                            medicalConditions: {
                                                ...prevState.medicalConditions,
                                                [option.key]: option.value
                                            }
                                        }));
                                    }}
                                >
                                    <Text style={[
                                        styles.subOptionText,
                                        isSelected && styles.subOptionTextSelected
                                    ]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </View>
        );
    };

    // Render walking aid item with checkbox and sub-options
    renderWalkingAid = (title, mainKey, subOptions = []) => {
        const { walkingAids } = this.state;
        const isChecked = Boolean(walkingAids[mainKey]);

        return (
            <View style={styles.conditionContainer}>
                <View style={styles.conditionMainRow}>
                    <TouchableOpacity
                        style={[styles.customCheckbox, isChecked && styles.customCheckboxChecked]}
                        onPress={() => {
                            this.setState((prevState) => ({
                                walkingAids: {
                                    ...prevState.walkingAids,
                                    [mainKey]: !prevState.walkingAids[mainKey]
                                }
                            }));
                        }}
                    >
                        {isChecked && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                    <Text style={styles.conditionTitle}>{title}</Text>
                </View>

                {isChecked && subOptions.length > 0 && (
                    <View style={styles.subOptionsContainer}>
                        {subOptions.map((option, index) => {
                            const isSelected = walkingAids[option.key] === option.value;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.subOptionButton,
                                        isSelected && styles.subOptionSelected
                                    ]}
                                    onPress={() => {
                                        this.setState((prevState) => ({
                                            walkingAids: {
                                                ...prevState.walkingAids,
                                                [option.key]: option.value
                                            }
                                        }));
                                    }}
                                >
                                    <Text style={[
                                        styles.subOptionText,
                                        isSelected && styles.subOptionTextSelected
                                    ]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </View>
        );
    };

    // Render movement disorder row (Left/Right checkboxes)
    renderMovementDisorderRow = (title, leftKey, rightKey) => {
        const { movementDisorders } = this.state;

        return (
            <View style={styles.movementRow}>
                <Text style={styles.movementLabel}>{title}</Text>
                <View style={styles.movementCheckboxes}>
                    <View style={styles.movementCheckboxGroup}>
                        <Text style={styles.sideLabel}>
                            {this.getLocalizedText(langNotes.left) || 'Left'}
                        </Text>
                        <TouchableOpacity
                            style={[styles.customCheckbox, movementDisorders[leftKey] && styles.customCheckboxChecked]}
                            onPress={() => this.setState((prevState) => ({
                                movementDisorders: {
                                    ...prevState.movementDisorders,
                                    [leftKey]: !prevState.movementDisorders[leftKey]
                                }
                            }))}
                        >
                            {movementDisorders[leftKey] && <Text style={styles.checkmark}>✓</Text>}
                        </TouchableOpacity>
                    </View>
                    <View style={styles.movementCheckboxGroup}>
                        <Text style={styles.sideLabel}>
                            {this.getLocalizedText(langNotes.right) || 'Right'}
                        </Text>
                        <TouchableOpacity
                            style={[styles.customCheckbox, movementDisorders[rightKey] && styles.customCheckboxChecked]}
                            onPress={() => this.setState((prevState) => ({
                                movementDisorders: {
                                    ...prevState.movementDisorders,
                                    [rightKey]: !prevState.movementDisorders[rightKey]
                                }
                            }))}
                        >
                            {movementDisorders[rightKey] && <Text style={styles.checkmark}>✓</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    renderPageIndicator = () => {
        return (
            <View style={styles.pageIndicatorContainer}>
                <TouchableOpacity
                    style={[styles.pageIndicator, this.state.currentPage === 0 && styles.pageIndicatorActive]}
                    onPress={() => this.scrollToPage(0)}
                />
                <TouchableOpacity
                    style={[styles.pageIndicator, this.state.currentPage === 1 && styles.pageIndicatorActive]}
                    onPress={() => this.scrollToPage(1)}
                />
            </View>
        );
    };

    render() {
        const { loading, saving, medicalConditions, walkingAids, movementDisorders } = this.state;

        if (loading) {
            return (
                <View style={styles.loadingScreen}>
                    <ActivityIndicator size="large" color="#4ECDC4" />
                    <Text style={styles.loadingText}>
                        {this.getLocalizedText(langNotes.loadingRecords) || 'Loading medical records...'}
                    </Text>
                </View>
            );
        }

        return (
            <View style={styles.container}>
                <ScrollView
                    ref={this.scrollViewRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={this.handleScroll}
                    scrollEventThrottle={16}
                    style={styles.horizontalScroll}
                >
                    {/* Page 1: Medical Conditions */}
                    <View style={[styles.page, { width }]}>
                        <ScrollView contentContainerStyle={styles.pageContent}>
                            <View style={styles.card}>
                                <Text style={styles.sectionTitle}>
                                    {this.getLocalizedText(langNotes.medicalCondition) || 'Medical condition'}
                                </Text>

                                {this.renderMedicalCondition(
                                    this.getLocalizedText(langNotes.stroke) || 'Stroke',
                                    'stroke',
                                    [
                                        { label: this.getLocalizedText(langNotes.left) || 'Left', key: 'strokeSide', value: 'left' },
                                        { label: this.getLocalizedText(langNotes.right) || 'Right', key: 'strokeSide', value: 'right' },
                                    ]
                                )}

                                {this.renderMedicalCondition(
                                    this.getLocalizedText(langNotes.diabetes) || 'Diabetes',
                                    'diabetes',
                                    [
                                        { label: this.getLocalizedText(langNotes.lessThanOneYear) || '<1yr', key: 'diabetesDuration', value: '<1yr' },
                                        { label: this.getLocalizedText(langNotes.moreThanOneYear) || '>1yr', key: 'diabetesDuration', value: '>1yr' },
                                    ]
                                )}

                                {this.renderMedicalCondition(
                                    this.getLocalizedText(langNotes.hypertension) || 'Hypertension',
                                    'hypertension',
                                    [
                                        { label: this.getLocalizedText(langNotes.controllable) || 'Controllable', key: 'hypertensionLevel', value: 'controllable' },
                                        { label: this.getLocalizedText(langNotes.uncontrollable) || 'Uncontrollable', key: 'hypertensionLevel', value: 'uncontrollable' },
                                    ]
                                )}

                                {this.renderMedicalCondition(
                                    this.getLocalizedText(langNotes.dyslipidemia) || 'Dyslipidemia',
                                    'dyslipidemia',
                                    [
                                        { label: this.getLocalizedText(langNotes.normal) || 'Normal', key: 'dyslipidemiaLevel', value: 'normal' },
                                        { label: this.getLocalizedText(langNotes.high) || 'High', key: 'dyslipidemiaLevel', value: 'high' },
                                        { label: this.getLocalizedText(langNotes.veryHigh) || 'Very high', key: 'dyslipidemiaLevel', value: 'veryHigh' },
                                    ]
                                )}
                                <TextInput
                                    style={styles.textInput}
                                    value={medicalConditions.otherDiseases}
                                    placeholder={this.getLocalizedText(langNotes.otherDiseasesPlaceholder) || 'Other diseases'}
                                    placeholderTextColor="#B0B0B0"
                                    onChangeText={(text) => this.setState({
                                        medicalConditions: { ...medicalConditions, otherDiseases: text }
                                    })}
                                    multiline
                                />
                            </View>
                        </ScrollView>
                    </View>

                    {/* Page 2: Walking Aids & Movement Disorders */}
                    <View style={[styles.page, { width }]}>
                        <ScrollView contentContainerStyle={styles.pageContent}>
                            <View style={styles.card}>
                                <Text style={styles.sectionTitle}>
                                    {this.getLocalizedText(langNotes.walkingAidType) || 'Walking Aid type'}
                                </Text>

                                {this.renderWalkingAid(
                                    this.getLocalizedText(langNotes.cane) || 'Cane',
                                    'cane',
                                    [
                                        { label: this.getLocalizedText(langNotes.left) || 'Left', key: 'caneSide', value: 'left' },
                                        { label: this.getLocalizedText(langNotes.right) || 'Right', key: 'caneSide', value: 'right' },
                                        { label: this.getLocalizedText(langNotes.lessThanOneYear) || '<1yr', key: 'caneDuration', value: '<1yr' },
                                        { label: this.getLocalizedText(langNotes.moreThanOneYear) || '>1yr', key: 'caneDuration', value: '>1yr' },
                                    ]
                                )}

                                {this.renderWalkingAid(
                                    this.getLocalizedText(langNotes.crutch) || 'Crutch',
                                    'crutch',
                                    [
                                        { label: this.getLocalizedText(langNotes.left) || 'Left', key: 'crutchSide', value: 'left' },
                                        { label: this.getLocalizedText(langNotes.right) || 'Right', key: 'crutchSide', value: 'right' },
                                        { label: this.getLocalizedText(langNotes.lessThanOneYear) || '<1yr', key: 'crutchDuration', value: '<1yr' },
                                        { label: this.getLocalizedText(langNotes.moreThanOneYear) || '>1yr', key: 'crutchDuration', value: '>1yr' },
                                    ]
                                )}

                                {this.renderWalkingAid(
                                    this.getLocalizedText(langNotes.walker) || 'Walker',
                                    'walker',
                                    [
                                        { label: this.getLocalizedText(langNotes.lessThanOneYear) || '<1yr', key: 'walkerDuration', value: '<1yr' },
                                        { label: this.getLocalizedText(langNotes.moreThanOneYear) || '>1yr', key: 'walkerDuration', value: '>1yr' },
                                    ]
                                )}

                                {this.renderWalkingAid(
                                    this.getLocalizedText(langNotes.wheelchair) || 'Wheelchair',
                                    'wheelchair',
                                    [
                                        { label: this.getLocalizedText(langNotes.lessThanOneYear) || '<1yr', key: 'wheelchairDuration', value: '<1yr' },
                                        { label: this.getLocalizedText(langNotes.moreThanOneYear) || '>1yr', key: 'wheelchairDuration', value: '>1yr' },
                                    ]
                                )}

                                <TextInput
                                    style={styles.textInput}
                                    value={walkingAids.otherAids}
                                    placeholder={this.getLocalizedText(langNotes.otherWalkingAidsPlaceholder)}
                                    placeholderTextColor="#B0B0B0"
                                    onChangeText={(text) => this.setState({
                                        walkingAids: { ...walkingAids, otherAids: text }
                                    })}
                                    multiline
                                />

                                <View style={styles.separator} />

                                <Text style={styles.sectionTitle}>{this.getLocalizedText(langNotes.movementDisorders)}</Text>

                                {this.renderMovementDisorderRow(this.getLocalizedText(langNotes.ankle), 'ankleLeft', 'ankleRight')}
                                {this.renderMovementDisorderRow(this.getLocalizedText(langNotes.knee), 'kneeLeft', 'kneeRight')}
                                {this.renderMovementDisorderRow(this.getLocalizedText(langNotes.hip), 'hipLeft', 'hipRight')}

                                <TextInput
                                    style={styles.textInput}
                                    value={movementDisorders.otherInjuries}
                                    placeholder={this.getLocalizedText(langNotes.otherInjuriesPlaceholder)}
                                    placeholderTextColor="#B0B0B0"
                                    onChangeText={(text) => this.setState({
                                        movementDisorders: { ...movementDisorders, otherInjuries: text }
                                    })}
                                    multiline
                                />
                            </View>
                        </ScrollView>
                    </View>
                </ScrollView>

                {/* Page Indicator */}
                {this.renderPageIndicator()}

                {/* Bottom Buttons */}
                <View style={styles.bottomContainer}>
                    <TouchableOpacity
                        style={styles.updateButton}
                        onPress={this.handleUpdate}
                        disabled={saving}
                    >
                        <Text style={styles.updateButtonText}>
                            {saving ?
                                (this.getLocalizedText(langNotes.saving) || 'Saving...') :
                                (this.getLocalizedText(langNotes.updateBtn) || 'Update')
                            }
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.noteButton}
                        onPress={() => this.navigateBack()}
                    >
                        <Text style={styles.noteButtonText}>
                            {this.getLocalizedText(langNotes.noteBtn) || 'Note'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {saving && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#4ECDC4" />
                    </View>
                )}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    loadingScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666666',
        fontFamily: 'System',
    },
    horizontalScroll: {
        flex: 1,
    },
    page: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    pageContent: {
        padding: 20,
        paddingBottom: 120,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        padding: 24,
        minHeight: '85%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 24,
        fontFamily: 'System',
    },
    conditionContainer: {
        marginBottom: 20,
    },
    conditionMainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    mainCheckbox: {
        width: 24,
        height: 24,
        marginRight: 12,
    },
    customCheckbox: {
        width: 24,
        height: 24,
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    customCheckboxChecked: {
        backgroundColor: '#4ECDC4',
        borderColor: '#4ECDC4',
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    conditionTitle: {
        fontSize: 16,
        color: '#333333',
        fontWeight: '500',
        flex: 1,
        fontFamily: 'System',
    },
    subOptionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginLeft: 36,
        justifyContent: 'space-between',
        width: '75%', // Fixed width to control wrapping
    },
    subOptionButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#F8F8F8',
        width: '47%', // Exactly 2 per row with small gap
        alignItems: 'center',
        marginBottom: 8,
    },
    subOptionSelected: {
        backgroundColor: '#4ECDC4',
        borderColor: '#4ECDC4',
    },
    subOptionText: {
        fontSize: 12,
        color: '#666666',
        fontFamily: 'System',
    },
    subOptionTextSelected: {
        color: '#FFFFFF',
    },
    textInput: {
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        padding: 16,
        fontSize: 14,
        color: '#999999',
        minHeight: 120,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginTop: 20,
        fontFamily: 'System',
    },
    separator: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 24,
    },
    movementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingVertical: 8,
    },
    movementLabel: {
        fontSize: 16,
        color: '#333333',
        fontWeight: '500',
        flex: 1,
        fontFamily: 'System',
    },
    movementCheckboxes: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    movementCheckboxGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 16,
    },
    sideLabel: {
        fontSize: 14,
        color: '#666666',
        marginRight: 8,
        fontFamily: 'System',
    },
    movementCheckbox: {
        width: 24,
        height: 24,
    },
    pageIndicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 8,
        backgroundColor: '#F5F5F5',
    },
    pageIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D0D0D0',
    },
    pageIndicatorActive: {
        backgroundColor: '#4ECDC4',
        width: 12,
        height: 8,
        borderRadius: 4,
    },
    bottomContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 10,
        backgroundColor: '#F5F5F5',
        gap: 12,
    },
    updateButton: {
        flex: 1,
        backgroundColor: '#4ECDC4',
        paddingVertical: 16,
        borderRadius: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    updateButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'System',
    },
    noteButton: {
        flex: 1,
        backgroundColor: '#999999',
        paddingVertical: 16,
        borderRadius: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    noteButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'System',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

const mapStateToProps = (state) => ({
    lang: state.lang,
    token: state.token,
});

export default connect(mapStateToProps)(NotesPage);