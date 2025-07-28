import React, { Component } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, BackHandler, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Card } from 'native-base';
import InputFix from '../../common/InputFix';
import ButtonFix from '../../common/ButtonFix';
import CheckBox from '@react-native-community/checkbox';
import UI from '../../../config/styles/CommonStyles';
import { connect } from 'react-redux';
import langNotes from '../../../assets/language/menu/lang_notes';
import { getLocalizedText } from '../../../assets/language/langUtils'; // Import the utility
import Text from '../../common/TextFix'; // Import custom TextFix component

class NotesPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            saving: false,
            medicalConditions: {
                diabetes: false,
                diabetesDuration: '',
                hypertension: false,
                hypertensionDuration: '',
                dyslipidemia: false,
                dyslipidemiaDuration: '',
                other: '',
            },
            injuries: {
                ankleLeft: false,
                ankleRight: false,
                kneeLeft: false,
                kneeRight: false,
                hipLeft: false,
                hipRight: false,
                other: '',
            },
        };
    }

    componentDidMount() {
        console.log('[NotesPage] componentDidMount: Adding hardwareBackPress listener');
        BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);

        const { userId } = this.props;
        if (!userId) {
            console.log('[ERROR] userId is missing!');
            return;
        }

        console.log('[INFO] Fetching data for userId:', userId);
        this.setState({ loading: true });

        fetch(`https://api1.suratec.co.th/medical-records?user_id=${userId}`)
            .then(res => res.json())
            .then(data => {
                console.log('[INFO] Fetched data:', data);
                if (data) {
                    console.log('[INFO] Setting state from API data...');
                    this.setState({
                        medicalConditions: {
                            diabetes: !!data.diabetes,
                            diabetesDuration: data.diabetes_duration || '',
                            hypertension: !!data.hypertension,
                            hypertensionDuration: data.hypertension_duration || '',
                            dyslipidemia: !!data.dyslipidemia,
                            dyslipidemiaDuration: data.dyslipidemia_duration || '',
                            other: data.other_diseases || '',
                        },
                        injuries: {
                            ankleLeft: !!data.injury_ankle_left,
                            ankleRight: !!data.injury_ankle_right,
                            kneeLeft: !!data.injury_knee_left,
                            kneeRight: !!data.injury_knee_right,
                            hipLeft: !!data.injury_hip_left,
                            hipRight: !!data.injury_hip_right,
                            other: data.other_injuries || '',
                        },
                    });
                } else {
                    console.log('[WARN] No valid data found in API response.');
                }
            })
            .catch(err => console.error('[ERROR] Fetch failed:', err))
            .finally(() => this.setState({ loading: false }));
    }

    componentWillUnmount() {
        console.log('[NotesPage] componentWillUnmount: Removing hardwareBackPress listener');
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
    }

    handleBackPress = () => {
        console.log('[NotesPage] handleBackPress called');
        if (this.props.navigation && typeof this.props.navigation.reset === 'function') {
            console.log('[NotesPage] handleBackPress: resetting to Profile');
            this.props.navigation.reset({
                index: 0,
                routes: [{ name: 'Profile' }],
            });
            return true;
        }
        console.log('[NotesPage] handleBackPress: navigation.reset not available');
        return false;
    }

    handleUpdate = () => {
        const { userId } = this.props;
        if (!userId) {
            console.log('[ERROR] Cannot update. userId is missing.');
            Alert.alert('Error', 'User ID is missing');
            return;
        }

        const { medicalConditions, injuries } = this.state;
        const payload = {
            user_id: userId,
            diabetes: medicalConditions.diabetes,
            diabetes_duration: medicalConditions.diabetes ? medicalConditions.diabetesDuration : null,
            hypertension: medicalConditions.hypertension,
            hypertension_duration: medicalConditions.hypertension ? medicalConditions.hypertensionDuration : null,
            dyslipidemia: medicalConditions.dyslipidemia,
            dyslipidemia_duration: medicalConditions.dyslipidemia ? medicalConditions.dyslipidemiaDuration : null,
            other_diseases: medicalConditions.other,
            injury_ankle_left: injuries.ankleLeft,
            injury_ankle_right: injuries.ankleRight,
            injury_knee_left: injuries.kneeLeft,
            injury_knee_right: injuries.kneeRight,
            injury_hip_left: injuries.hipLeft,
            injury_hip_right: injuries.hipRight,
            other_injuries: injuries.other,
        };

        console.log('[INFO] Submitting payload:', payload);

        this.setState({ saving: true });

        fetch('https://api1.suratec.co.th/medical-records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(res => res.json())
            .then(data => {
                console.log('[SUCCESS] Update response:', data);
                Alert.alert('Success', 'Medical record saved successfully');
            })
            .catch(err => {
                console.error('[ERROR] Update failed:', err);
                Alert.alert('Error', 'Failed to save medical record');
            })
            .finally(() => this.setState({ saving: false }));
    };

    renderDurationPicker = (durationValue, onDurationChange, enabled) => {
        return (
            <View style={styles.durationContainer}>
                <TouchableOpacity
                    style={[
                        styles.durationButton,
                        durationValue === '<1yr' ? styles.durationButtonSelected : styles.durationButtonUnselected,
                        !enabled && styles.durationButtonDisabled,
                    ]}
                    onPress={() => enabled && onDurationChange('<1yr')}
                    disabled={!enabled}
                    activeOpacity={enabled ? 0.6 : 1}
                >
                    <Text style={[
                        styles.durationText,
                        durationValue === '<1yr' ? styles.durationTextSelected : styles.durationTextUnselected,
                        !enabled && styles.durationTextDisabled,
                    ]}>
                        {'<1yr'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.durationButton,
                        durationValue === '>1yr' ? styles.durationButtonSelected : styles.durationButtonUnselected,
                        !enabled && styles.durationButtonDisabled,
                    ]}
                    onPress={() => enabled && onDurationChange('>1yr')}
                    disabled={!enabled}
                    activeOpacity={enabled ? 0.6 : 1}
                >
                    <Text style={[
                        styles.durationText,
                        durationValue === '>1yr' ? styles.durationTextSelected : styles.durationTextUnselected,
                        !enabled && styles.durationTextDisabled,
                    ]}>
                        {'>1yr'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    renderConditionBlock = (label, key, durationKey) => {
        const condition = this.state.medicalConditions;
        const enabled = condition[key];

        return (
            <View style={styles.conditionBlock}>
                <View style={styles.conditionRow}>
                    <CheckBox
                        value={enabled}
                        onValueChange={(value) => this.setState({
                            medicalConditions: { ...condition, [key]: value }
                        })}
                        style={styles.checkbox}
                        tintColors={{ true: '#4ECDC4', false: '#E0E0E0' }}
                        boxType="square"
                    />
                    <Text style={styles.conditionText}>{label}</Text>
                </View>
                <View style={styles.spacer} />
                {this.renderDurationPicker(
                    condition[durationKey],
                    (duration) => this.setState({
                        medicalConditions: { ...condition, [durationKey]: duration }
                    }),
                    enabled
                )}
            </View>
        );
    };

    renderInjuryRow = (label, leftKey, rightKey) => {
        const injury = this.state.injuries;
        return (
            <View style={styles.injuryRow}>
                <Text style={styles.injuryLabel}>{label}</Text>
                <View style={styles.injuryCheckboxContainer}>
                    <View style={styles.injuryCheckboxGroup}>
                        <Text style={styles.sideLabel}>L</Text>
                        <CheckBox
                            value={injury[leftKey]}
                            onValueChange={(value) => this.setState({
                                injuries: { ...injury, [leftKey]: value }
                            })}
                            style={styles.injuryCheckbox}
                            tintColors={{ true: '#4ECDC4', false: '#E0E0E0' }}
                            boxType="square"
                        />
                    </View>

                    <View style={styles.injuryCheckboxGroup}>
                        <Text style={styles.sideLabel}>R</Text>
                        <CheckBox
                            value={injury[rightKey]}
                            onValueChange={(value) => this.setState({
                                injuries: { ...injury, [rightKey]: value }
                            })}
                            style={styles.injuryCheckbox}
                            tintColors={{ true: '#4ECDC4', false: '#E0E0E0' }}
                            boxType="square"
                        />
                    </View>
                </View>
            </View>
        );
    };

    render() {
        const { loading, saving, medicalConditions, injuries } = this.state;

        return (
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>
                            {getLocalizedText(this.props.lang, langNotes.medicalCondition)}
                        </Text>

                        {this.renderConditionBlock(
                            getLocalizedText(this.props.lang, langNotes.diabetes),
                            'diabetes',
                            'diabetesDuration'
                        )}
                        {this.renderConditionBlock(
                            getLocalizedText(this.props.lang, langNotes.hypertension),
                            'hypertension',
                            'hypertensionDuration'
                        )}
                        {this.renderConditionBlock(
                            getLocalizedText(this.props.lang, langNotes.dyslipidemia),
                            'dyslipidemia',
                            'dyslipidemiaDuration'
                        )}

                        <TextInput
                            style={styles.textInput}
                            value={medicalConditions.other}
                            placeholder={getLocalizedText(this.props.lang, langNotes.otherDiseasesPlaceholder)}
                            placeholderTextColor="#B0B0B0"
                            onChangeText={(text) => this.setState({
                                medicalConditions: { ...medicalConditions, other: text }
                            })}
                            multiline={true}
                        />

                        <View style={styles.separator} />

                        <Text style={styles.sectionTitle}>
                            {getLocalizedText(this.props.lang, langNotes.injuries)}
                        </Text>
                        {this.renderInjuryRow(
                            getLocalizedText(this.props.lang, langNotes.ankle),
                            'ankleLeft',
                            'ankleRight'
                        )}
                        {this.renderInjuryRow(
                            getLocalizedText(this.props.lang, langNotes.knee),
                            'kneeLeft',
                            'kneeRight'
                        )}
                        {this.renderInjuryRow(
                            getLocalizedText(this.props.lang, langNotes.hip),
                            'hipLeft',
                            'hipRight'
                        )}

                        <TextInput
                            style={styles.textInput}
                            value={injuries.other}
                            placeholder={getLocalizedText(this.props.lang, langNotes.otherInjuriesPlaceholder)}
                            placeholderTextColor="#B0B0B0"
                            onChangeText={(text) => this.setState({
                                injuries: { ...injuries, other: text }
                            })}
                            multiline={true}
                        />

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.updateButton}
                                onPress={this.handleUpdate}
                                disabled={saving}>
                                <Text style={styles.updateButtonText}>
                                    {saving ?
                                        getLocalizedText(this.props.lang, langNotes.saving) :
                                        getLocalizedText(this.props.lang, langNotes.updateBtn)
                                    }
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => this.props.navigation?.navigate('Profile')}>
                                <Text style={styles.cancelButtonText}>
                                    {getLocalizedText(this.props.lang, langNotes.cancelBtn)}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {(loading || saving) && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#4ECDC4" />
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
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
        fontSize: 18,
        fontWeight: 'normal',
        color: '#666666',
        marginBottom: 20,
        fontFamily: 'System',
    },
    conditionBlock: {
        marginBottom: 24,
    },
    conditionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    checkbox: {
        width: 24,
        height: 24,
        marginRight: 12,
    },
    conditionText: {
        fontSize: 16,
        color: '#333333',
        fontWeight: 'normal',
        flex: 1,
        fontFamily: 'System',
    },
    spacer: {
        height: 8,
    },
    durationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    durationButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    durationButtonSelected: {
        backgroundColor: '#4ECDC4',
        borderColor: '#4ECDC4',
    },
    durationButtonUnselected: {
        backgroundColor: '#F8F8F8',
        borderColor: '#E0E0E0',
    },
    durationButtonDisabled: {
        backgroundColor: '#F0F0F0',
        borderColor: '#E0E0E0',
        opacity: 0.6,
    },
    durationText: {
        fontSize: 14,
        fontWeight: '500',
        fontFamily: 'System',
    },
    durationTextSelected: {
        color: '#FFFFFF',
    },
    durationTextUnselected: {
        color: '#666666',
    },
    durationTextDisabled: {
        color: '#AAAAAA',
    },
    textInput: {
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#333333',
        minHeight: 80,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginBottom: 8,
        fontFamily: 'System',
    },
    separator: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 24,
    },
    injuryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    injuryLabel: {
        fontSize: 16,
        color: '#333333',
        fontWeight: 'normal',
        flex: 1,
        fontFamily: 'System',
    },
    injuryCheckboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    injuryCheckboxGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 20,
    },
    sideLabel: {
        fontSize: 14,
        color: '#666666',
        marginRight: 8,
        fontWeight: 'normal',
        fontFamily: 'System',
    },
    injuryCheckbox: {
        width: 24,
        height: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        marginTop: 32,
        gap: 16,
    },
    updateButton: {
        flex: 1,
        backgroundColor: '#4ECDC4',
        paddingVertical: 16,
        borderRadius: 25,
        alignItems: 'center',
    },
    updateButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'System',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#F0F0F0',
        paddingVertical: 16,
        borderRadius: 25,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#666666',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'System',
    },
    loadingContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
});

const mapStateToProps = (state) => ({ lang: state.lang });

export default connect(mapStateToProps)(NotesPage);