import React, { Component } from 'react';
import {
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    BackHandler,
    ScrollView,
    Dimensions,
} from 'react-native';
import { connect } from 'react-redux';
import HeaderFix from '../../common/HeaderFix';

import UI from '../../../config/styles/CommonStyles';
import Lang from '../../../assets/language/menu/lang_profile';
import { getLocalizedText } from '../../../assets/language/langUtils';

const { width } = Dimensions.get('window');

class MedicalNotes extends Component {
    state = {
        loading: false,
        saving: false,
        currentPage: 0,
        // Medical conditions
        medicalConditions: {
            stroke: false,
            strokeSide: '',
            diabetes: false,
            diabetesDuration: '',
            hypertension: false,
            hypertensionLevel: '',
            dyslipidemia: false,
            dyslipidemiaLevel: '',
            otherDiseases: '',
            dyslipidemiaNone: false,
            medicalConditionNone: false,
        },
        // Walking aids and movement disorders
        walkingAids: {
            cane: false,
            caneSide: '',
            caneDuration: '',
            crutch: false,
            crutchSide: '',
            crutchDuration: '',
            walker: false,
            walkerDuration: '',
            wheelchair: false,
            wheelchairDuration: '',
            walkingAidNone: false,
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

    componentDidMount = async () => {
        this.fetchMedicalRecord();
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
        this.scrollViewRef = React.createRef();
    };

    componentWillUnmount() {
        if (this.backHandler) this.backHandler.remove();
    }

    getUserId = () => {
        const user = this.props.user;
        return user?.user_info?.id_customer ||
            user?.id_customer ||
            user?.member_info?.id_member ||
            user?.id_member ||
            user?.id_data_role;
    };

    handleBackPress = () => {
        this.navigateBack();
        return true;
    };

    navigateBack = () => {
        if (this.props.navigation?.goBack) this.props.navigation.goBack();
        else if (this.props.navigation?.navigate) this.props.navigation.navigate('Profile');
    };

    hasUnsavedChanges = () => false;

    fetchMedicalRecord = async () => {
        this.setState({ loading: true });
        try {
            const userId = this.getUserId();
            if (!userId) throw new Error('User ID not found');
            const response = await fetch(`https://api1.suratec.co.th/medical-records?user_id=${userId}`, {
            method: 'GET',
                headers: {
                'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.props.token}`,
            },
        });
        let result;
        if (response.status === 404) {
            result = {};
        } else if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        } else {
            result = await response.json();
        }
        const data = result?.data || result || {};

        // Create the medical conditions object
        const mc = {
            stroke: !!data.stroke,
            strokeSide: data.stroke_side || '',
            diabetes: !!data.diabetes,
            diabetesDuration: data.diabetes_duration || '',
            hypertension: !!data.hypertension,
            hypertensionLevel: data.hypertension_status || '',
            dyslipidemia: !!data.dyslipidemia,
            dyslipidemiaLevel: data.dyslipidemia_level || '',
            otherDiseases: data.other_diseases || '',
            dyslipidemiaNone: !!data.dyslipidemia_none,
            medicalConditionNone: !!data.medical_condition_none,
        };

        // Create the walking aids object
        const wa = {
            cane: !!data.uses_cane,
            caneSide: data.cane_side || '',
            caneDuration: data.cane_duration || '',
            crutch: !!data.uses_crutch,
            crutchSide: data.crutch_side || '',
            crutchDuration: data.crutch_duration || '',
            walker: !!data.uses_walker,
            walkerDuration: data.walker_duration || '',
            wheelchair: !!data.uses_wheelchair,
            wheelchairDuration: data.wheelchair_duration || '',
            walkingAidNone: !!data.walking_aid_none,
        };

        // Check if no medical conditions are selected, then set dyslipidemiaNone to true
        const mcKeys = ['stroke', 'diabetes', 'hypertension', 'dyslipidemia'];
        const waKeys = ['cane', 'crutch', 'walker', 'wheelchair'];

        // If no medical conditions are checked and dyslipidemiaNone is not explicitly true, set it to true
        if (mcKeys.every(k => !mc[k]) && !mc.dyslipidemiaNone) {
            mc.dyslipidemiaNone = true;
        }

        // If no walking aids are checked and walkingAidNone is not explicitly true, set it to true
        if (waKeys.every(k => !wa[k]) && !wa.walkingAidNone) {
            wa.walkingAidNone = true;
        }

        this.setState({
            medicalConditions: mc,
            walkingAids: wa,
            movementDisorders: {
                ankleLeft: !!data.injury_ankle_left,
                ankleRight: !!data.injury_ankle_right,
                kneeLeft: !!data.injury_knee_left,
                kneeRight: !!data.injury_knee_right,
                hipLeft: !!data.injury_hip_left,
                hipRight: !!data.injury_hip_right,
                otherInjuries: data.other_injuries || '',
            }
        });
    } catch (error) {
        Alert.alert(
            getLocalizedText(this.props.lang, Lang.alertErrorTitle),
            String(error)
        );
    } finally {
    this.setState({ loading: false });
}
};

validateForm = () => {
    const { medicalConditions, walkingAids, movementDisorders } = this.state;
    const medicalKeys = [
        'stroke', 'diabetes', 'hypertension', 'dyslipidemia'
    ];
    const anyMedicalChecked = medicalKeys.some(k => medicalConditions[k]);
    if (!anyMedicalChecked && !medicalConditions.dyslipidemiaNone) {
        this.setState(state => ({
            medicalConditions: { ...state.medicalConditions, dyslipidemiaNone: true }
        }));

        return true;
    }
    if (medicalConditions.dyslipidemiaNone) {

        return true;
    }

    if (medicalConditions.diabetes && !medicalConditions.diabetesDuration) {
        Alert.alert(getLocalizedText(this.props.lang, Lang.alertErrorTitle), 'Please select duration for diabetes.');
        return false;
    }
    if (medicalConditions.hypertension && !medicalConditions.hypertensionLevel) {
        Alert.alert(getLocalizedText(this.props.lang, Lang.alertErrorTitle), 'Please select level for hypertension.');
        return false;
    }
    if (medicalConditions.dyslipidemia && !medicalConditions.dyslipidemiaLevel) {
        Alert.alert(getLocalizedText(this.props.lang, Lang.alertErrorTitle), 'Please select level for dyslipidemia.');
        return false;
    }
    if (medicalConditions.stroke && !medicalConditions.strokeSide) {
        Alert.alert(getLocalizedText(this.props.lang, Lang.alertErrorTitle), 'Please select side for stroke.');
        return false;
    }
    return true;
};

saveMedicalRecord = async () => {
    if (!this.validateForm()) return;
    const userId = this.getUserId();
    if (!userId) {
        Alert.alert(getLocalizedText(this.props.lang, Lang.alertErrorTitle), getLocalizedText(this.props.lang, Lang.userIdMissing));
        return;
    }
    const { medicalConditions, walkingAids, movementDisorders } = this.state;

    const medicalKeys = [
        'stroke', 'diabetes', 'hypertension', 'dyslipidemia'
    ];
    const anyMedicalChecked = medicalKeys.some(k => medicalConditions[k]);
    const walkingAidKeys = ['cane', 'crutch', 'walker', 'wheelchair'];
    const walkingChecked = walkingAidKeys.some(k => walkingAids[k]);
    const movementKeys = ['ankleLeft', 'ankleRight', 'kneeLeft', 'kneeRight', 'hipLeft', 'hipRight'];
    const movementChecked = movementKeys.some(k => movementDisorders[k]);

    const dyslipidemiaNone = !anyMedicalChecked || !!medicalConditions.dyslipidemiaNone;
    const walkingAidNone = !walkingChecked || !!walkingAids.walkingAidNone;
    const movementDisorderNone = !movementChecked;

    const payload = {
        user_id: userId,
        stroke: medicalConditions.stroke,
        stroke_side: medicalConditions.stroke ? medicalConditions.strokeSide : null,
        diabetes: medicalConditions.diabetes,
        diabetes_duration: medicalConditions.diabetes ? medicalConditions.diabetesDuration : null,
        hypertension: medicalConditions.hypertension,
        hypertension_status: medicalConditions.hypertension ? medicalConditions.hypertensionLevel : null,
        dyslipidemia: medicalConditions.dyslipidemia,
        dyslipidemia_level: medicalConditions.dyslipidemia ? medicalConditions.dyslipidemiaLevel : null,
        dyslipidemia_none: dyslipidemiaNone,
        medical_condition_none: dyslipidemiaNone,
        other_diseases: medicalConditions.otherDiseases || null,

        uses_cane: walkingAids.cane,
        cane_side: walkingAids.cane ? walkingAids.caneSide : null,
        cane_duration: walkingAids.cane ? walkingAids.caneDuration : null,
        uses_crutch: walkingAids.crutch,
        crutch_side: walkingAids.crutch ? walkingAids.crutchSide : null,
        crutch_duration: walkingAids.crutch ? walkingAids.crutchDuration : null,
        uses_walker: walkingAids.walker,
        walker_duration: walkingAids.walker ? walkingAids.walkerDuration : null,
        uses_wheelchair: walkingAids.wheelchair,
        wheelchair_duration: walkingAids.wheelchair ? walkingAids.wheelchairDuration : null,
        walking_aid_none: walkingAidNone,

        injury_ankle_left: movementDisorders.ankleLeft,
        injury_ankle_right: movementDisorders.ankleRight,
        injury_knee_left: movementDisorders.kneeLeft,
        injury_knee_right: movementDisorders.kneeRight,
        injury_hip_left: movementDisorders.hipLeft,
        injury_hip_right: movementDisorders.hipRight,
        movement_disorder_none: movementDisorderNone,
        other_injuries: movementDisorders.otherInjuries || null,
    };
    Object.keys(payload).forEach(key => {
        if (payload[key] === null || payload[key] === '') delete payload[key];
    });

    this.setState({ saving: true });

    try {
        const response = await fetch('https://api1.suratec.co.th/medical-records', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.props.token}`,
            },
            body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (response.ok) {
            Alert.alert(
                getLocalizedText(this.props.lang, Lang.alertSuccessTitle),
                getLocalizedText(this.props.lang, Lang.medicalRecordSavedSuccess),
                [{ text: 'OK', onPress: () => this.navigateBack() }]
            );
        } else {
            if (result.errors) {
                const errorMessages = Object.keys(result.errors).map(key =>
                    `${key}: ${result.errors[key].join(', ')}`
            ).join('\n');
                Alert.alert(getLocalizedText(this.props.lang, Lang.alertErrorTitle), `Validation errors:\n${errorMessages}`);
            } else {
                Alert.alert(getLocalizedText(this.props.lang, Lang.alertErrorTitle), result.message || getLocalizedText(this.props.lang, Lang.failedToSaveMedicalRecord));
            }
        }
    } catch (error) {
        Alert.alert(getLocalizedText(this.props.lang, Lang.alertErrorTitle), getLocalizedText(this.props.lang, Lang.networkError));
    } finally {
        this.setState({ saving: false });
    }
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

handleMainOptionToggle = (category, mainKey, subKeys = []) => {
    this.setState((prevState) => {
        const newState = {
            [category]: {
                ...prevState[category],
                [mainKey]: !prevState[category][mainKey],
            }
        };

        if (!prevState[category][mainKey]) {
            if (category === 'medicalConditions') {
                newState[category].dyslipidemiaNone = false;
            }
            if (category === 'walkingAids') {
                newState[category].walkingAidNone = false;
            }
        }

        if (prevState[category][mainKey]) {
            subKeys.forEach(subKey => { newState[category][subKey] = ''; });
        }
        return newState;
    });
};

handleNoneOptionToggle = (category, noneKey, mainKeys = [], subKeys = []) => {
    this.setState((prevState) => {
        const newState = {
            [category]: {
                ...prevState[category],
                [noneKey]: !prevState[category][noneKey],
            }
        };

        if (!prevState[category][noneKey]) {
            mainKeys.forEach(key => { newState[category][key] = false; });
            subKeys.forEach(subKey => { newState[category][subKey] = ''; });
        }
        return newState;
    });
};

renderMedicalCondition = (title, mainKey, subOptions = []) => {
    const { medicalConditions } = this.state;
    const isChecked = Boolean(medicalConditions[mainKey]);
    return (
        <View style={styles.conditionContainer}>
            <View style={styles.conditionMainRow}>
                <TouchableOpacity
                    style={[styles.customCheckbox, isChecked && styles.customCheckboxChecked]}
                    onPress={() => {
                        const subKeys = subOptions.map(opt => opt.key);
                        this.handleMainOptionToggle('medicalConditions', mainKey, subKeys);
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
                                ]}>{option.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
        </View>
    );
};

renderWalkingAid = (title, mainKey, subOptions = []) => {
    const { walkingAids } = this.state;
    const isChecked = Boolean(walkingAids[mainKey]);
    return (
        <View style={styles.conditionContainer}>
            <View style={styles.conditionMainRow}>
                <TouchableOpacity
                    style={[styles.customCheckbox, isChecked && styles.customCheckboxChecked]}
                    onPress={() => {
                        const subKeys = subOptions.map(opt => opt.key);
                        this.handleMainOptionToggle('walkingAids', mainKey, subKeys);
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
                                ]}>{option.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
        </View>
    );
};

renderMovementDisorderRow = (title, leftKey, rightKey) => {
    const { movementDisorders } = this.state;
    return (
        <View style={styles.movementRow}>
            <Text style={styles.movementLabel}>{title}</Text>
            <View style={styles.movementCheckboxes}>
                <View style={styles.movementCheckboxGroup}>
                    <Text style={styles.sideLabel}>
                        {getLocalizedText(this.props.lang, Lang.leftSide) || 'Left'}
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
                        {getLocalizedText(this.props.lang, Lang.rightSide) || 'Right'}
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

renderPageIndicator = () => (
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

render() {
    const { loading, saving, medicalConditions, walkingAids, movementDisorders } = this.state;
    if (loading) {
        return (
            <View style={styles.loadingScreen}>
                <ActivityIndicator size="large" color={UI.color_Gradient[1]} />
                <Text style={styles.loadingText}>
                    {getLocalizedText(this.props.lang, Lang.loadingRecords) || 'Loading medical records...'}
                </Text>
            </View>
        );
    }
    return (
        <View style={styles.container}>
            <HeaderFix
                icon_left={'left'}
                title={getLocalizedText(this.props.lang, Lang.medicalNotesTitle)}
                navigation={this.props.navigation}
                onpress_left={() => this.navigateBack()}
                backEnabled={true}
                onBackPress={() => this.navigateBack()}
            />

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
                                {getLocalizedText(this.props.lang, Lang.medicalCondition) || 'Medical condition'}
                            </Text>
                            {this.renderMedicalCondition(
                                getLocalizedText(this.props.lang, Lang.stroke) || 'Stroke',
                                'stroke',
                                [
                                    { label: getLocalizedText(this.props.lang, Lang.leftSide) || 'Left', key: 'strokeSide', value: 'left' },
                                    { label: getLocalizedText(this.props.lang, Lang.rightSide) || 'Right', key: 'strokeSide', value: 'right' },
                                ]
                            )}
                            {this.renderMedicalCondition(
                                getLocalizedText(this.props.lang, Lang.diabetes) || 'Diabetes',
                                'diabetes',
                                [
                                    { label: getLocalizedText(this.props.lang, Lang.lessThanOneYear) || '<1yr', key: 'diabetesDuration', value: '<1yr' },
                                    { label: getLocalizedText(this.props.lang, Lang.moreThanOneYear) || '>1yr', key: 'diabetesDuration', value: '>1yr' },
                                    { label: getLocalizedText(this.props.lang, Lang.moreThanFiveYears) || '>5yr', key: 'diabetesDuration', value: '>5yr' },
                                ]
                            )}
                            {this.renderMedicalCondition(
                                getLocalizedText(this.props.lang, Lang.hypertension) || 'Hypertension',
                                'hypertension',
                                [
                                    { label: getLocalizedText(this.props.lang, Lang.controllable) || 'Controllable', key: 'hypertensionLevel', value: 'controllable' },
                                    { label: getLocalizedText(this.props.lang, Lang.uncontrollable) || 'Uncontrollable', key: 'hypertensionLevel', value: 'uncontrollable' },
                                ]
                            )}
                            {this.renderMedicalCondition(
                                getLocalizedText(this.props.lang, Lang.dyslipidemia) || 'Dyslipidemia',
                                'dyslipidemia',
                                [
                                    { label: getLocalizedText(this.props.lang, Lang.normal) || 'Normal', key: 'dyslipidemiaLevel', value: 'normal' },
                                    { label: getLocalizedText(this.props.lang, Lang.high) || 'High', key: 'dyslipidemiaLevel', value: 'high' },
                                    { label: getLocalizedText(this.props.lang, Lang.veryHigh) || 'Very high', key: 'dyslipidemiaLevel', value: 'veryHigh' },
                                ]
                            )}
                            {/* Dyslipidemia None main checkbox: clears all MC */}
                            <View style={styles.conditionContainer}>
                                <View style={styles.conditionMainRow}>
                                    <TouchableOpacity
                                        style={[styles.customCheckbox, medicalConditions.dyslipidemiaNone && styles.customCheckboxChecked]}
                                        onPress={() => this.handleNoneOptionToggle(
                                            'medicalConditions',
                                            'dyslipidemiaNone',
                                            ['stroke', 'diabetes', 'hypertension', 'dyslipidemia'],
                                            ['strokeSide', 'diabetesDuration', 'hypertensionLevel', 'dyslipidemiaLevel']
                                        )}
                                    >
                                        {medicalConditions.dyslipidemiaNone && <Text style={styles.checkmark}>✓</Text>}
                                    </TouchableOpacity>
                                    <Text style={styles.conditionTitle}>
                                        {getLocalizedText(this.props.lang, Lang.none) || 'None'}
                                    </Text>
                                </View>
                            </View>
                            <TextInput
                                style={styles.textInput}
                                value={medicalConditions.otherDiseases}
                                placeholder={getLocalizedText(this.props.lang, Lang.otherDiseases) || 'Other diseases'}
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
                                {getLocalizedText(this.props.lang, Lang.walkingAidType) || 'Walking Aid type'}
                            </Text>
                            {this.renderWalkingAid(
                                getLocalizedText(this.props.lang, Lang.cane) || 'Cane',
                                'cane',
                                [
                                    { label: getLocalizedText(this.props.lang, Lang.leftSide) || 'Left', key: 'caneSide', value: 'left' },
                                    { label: getLocalizedText(this.props.lang, Lang.rightSide) || 'Right', key: 'caneSide', value: 'right' },
                                    { label: getLocalizedText(this.props.lang, Lang.lessThanOneYear) || '<1yr', key: 'caneDuration', value: '<1yr' },
                                    { label: getLocalizedText(this.props.lang, Lang.moreThanOneYear) || '>1yr', key: 'caneDuration', value: '>1yr' },
                                ]
                            )}
                            {this.renderWalkingAid(
                                getLocalizedText(this.props.lang, Lang.crutch) || 'Crutch',
                                'crutch',
                                [
                                    { label: getLocalizedText(this.props.lang, Lang.leftSide) || 'Left', key: 'crutchSide', value: 'left' },
                                    { label: getLocalizedText(this.props.lang, Lang.rightSide) || 'Right', key: 'crutchSide', value: 'right' },
                                    { label: getLocalizedText(this.props.lang, Lang.both) || 'Both', key: 'crutchSide', value: 'both' },
                                    { label: getLocalizedText(this.props.lang, Lang.lessThanOneYear) || '<1yr', key: 'crutchDuration', value: '<1yr' },
                                    { label: getLocalizedText(this.props.lang, Lang.moreThanOneYear) || '>1yr', key: 'crutchDuration', value: '>1yr' },
                                ]
                            )}
                            {this.renderWalkingAid(
                                getLocalizedText(this.props.lang, Lang.walker) || 'Walker',
                                'walker',
                                [
                                    { label: getLocalizedText(this.props.lang, Lang.lessThanOneYear) || '<1yr', key: 'walkerDuration', value: '<1yr' },
                                    { label: getLocalizedText(this.props.lang, Lang.moreThanOneYear) || '>1yr', key: 'walkerDuration', value: '>1yr' },
                                ]
                            )}
                            {this.renderWalkingAid(
                                getLocalizedText(this.props.lang, Lang.wheelchair) || 'Wheelchair',
                                'wheelchair',
                                [
                                    { label: getLocalizedText(this.props.lang, Lang.lessThanOneYear) || '<1yr', key: 'wheelchairDuration', value: '<1yr' },
                                    { label: getLocalizedText(this.props.lang, Lang.moreThanOneYear) || '>1yr', key: 'wheelchairDuration', value: '>1yr' },
                                ]
                            )}
                            {/* WalkingAid None main checkbox: clears all WA */}
                            <View style={styles.conditionContainer}>
                                <View style={[styles.conditionMainRow, { marginBottom: 4 }]}>
                                    <TouchableOpacity
                                        style={[styles.customCheckbox, walkingAids.walkingAidNone && styles.customCheckboxChecked]}
                                        onPress={() => this.handleNoneOptionToggle(
                                            'walkingAids',
                                            'walkingAidNone',
                                            ['cane', 'crutch', 'walker', 'wheelchair'],
                                            ['caneSide', 'caneDuration', 'crutchSide', 'crutchDuration', 'walkerDuration', 'wheelchairDuration']
                                        )}
                                    >
                                        {walkingAids.walkingAidNone && <Text style={styles.checkmark}>✓</Text>}
                                    </TouchableOpacity>
                                    <Text style={styles.conditionTitle}>
                                        {getLocalizedText(this.props.lang, Lang.none) || 'None'}
                                    </Text>
                                </View>
                            </View>
                            <View style={[styles.separator, { marginVertical: 12 }]} />
                            <Text style={styles.sectionTitle}>
                                {getLocalizedText(this.props.lang, Lang.injuries) || 'Movement disorders'}
                            </Text>
                            {this.renderMovementDisorderRow(getLocalizedText(this.props.lang, Lang.ankle) || 'Ankle', 'ankleLeft', 'ankleRight')}
                            {this.renderMovementDisorderRow(getLocalizedText(this.props.lang, Lang.knee) || 'Knee', 'kneeLeft', 'kneeRight')}
                            {this.renderMovementDisorderRow(getLocalizedText(this.props.lang, Lang.hip) || 'Hip', 'hipLeft', 'hipRight')}
                            <TextInput
                                style={styles.textInput}
                                value={movementDisorders.otherInjuries}
                                placeholder={getLocalizedText(this.props.lang, Lang.otherInjuries) || 'Other injuries'}
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
            {this.renderPageIndicator()}
            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={styles.updateButton}
                    onPress={this.saveMedicalRecord}
                    disabled={saving}
                >
                    <Text style={styles.updateButtonText}>
                        {saving ?
                            (getLocalizedText(this.props.lang, Lang.saving) || 'Saving...') :
                            (getLocalizedText(this.props.lang, Lang.updateLabel) || 'Update')
                        }
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.noteButton}
                    onPress={() => this.navigateBack()}
                >
                    <Text style={styles.noteButtonText}>
                        {getLocalizedText(this.props.lang, Lang.cancelLabel) || 'Cancel'}
                    </Text>
                </TouchableOpacity>
            </View>
            {saving && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={UI.color_Gradient[1]} />
                </View>
            )}
        </View>
    );
}
}

const styles = {
    container: { flex: 1, backgroundColor: '#F5F5F5', },
    loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5', },
    loadingText: { marginTop: 16, fontSize: 16, color: '#666666', fontFamily: 'System', },
    horizontalScroll: { flex: 1, },
    page: { flex: 1, backgroundColor: '#F5F5F5', },
    pageContent: { padding: 20, paddingBottom: 120, },
    card: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 25, borderTopRightRadius: 25,
        borderBottomLeftRadius: 25, borderBottomRightRadius: 25,
        padding: 24, minHeight: '85%',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333333', marginBottom: 24, fontFamily: 'System', },
    conditionContainer: { marginBottom: 20 },
    conditionMainRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, },
    customCheckbox: {
        width: 24, height: 24, marginRight: 12,
        borderWidth: 2, borderColor: '#E0E0E0', borderRadius: 4, backgroundColor: '#FFFFFF',
        justifyContent: 'center', alignItems: 'center',
    },
    customCheckboxChecked: { backgroundColor: UI.color_Gradient[1], borderColor: UI.color_Gradient[1], },
    checkmark: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', },
    conditionTitle: { fontSize: 16, color: '#333333', fontWeight: '500', flex: 1, fontFamily: 'System', },
    subOptionsContainer: {
        flexDirection: 'row', flexWrap: 'wrap', marginLeft: 36,
        justifyContent: 'flex-start', width: '92%', gap: 8
    },
    subOptionButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#F8F8F8', minWidth: '32%', alignItems: 'center', marginBottom: 8, marginRight: 8 },
    subOptionSelected: { backgroundColor: UI.color_Gradient[1], borderColor: UI.color_Gradient[1], },
    subOptionText: { fontSize: 12, color: '#666666', fontFamily: 'System', },
    subOptionTextSelected: { color: '#FFFFFF', },
    textInput: { backgroundColor: '#F8F8F8', borderRadius: 12, padding: 16, fontSize: 14, color: '#333333', minHeight: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E0E0E0', marginTop: 20, fontFamily: 'System', },
    separator: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 12, },
    movementRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingVertical: 8, },
    movementLabel: { fontSize: 16, color: '#333333', fontWeight: '500', flex: 1, fontFamily: 'System', },
    movementCheckboxes: { flexDirection: 'row', alignItems: 'center', },
    movementCheckboxGroup: { flexDirection: 'row', alignItems: 'center', marginLeft: 16, },
    sideLabel: { fontSize: 14, color: '#666666', marginRight: 8, fontFamily: 'System', },
    pageIndicatorContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, gap: 8, backgroundColor: '#F5F5F5', },
    pageIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D0D0D0', },
    pageIndicatorActive: { backgroundColor: UI.color_Gradient[1], width: 12, height: 8, borderRadius: 4, },
    bottomContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10, backgroundColor: '#F5F5F5', gap: 12, },
    updateButton: { flex: 1, backgroundColor: UI.color_Gradient[1], paddingVertical: 16, borderRadius: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, },
    updateButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', fontFamily: 'System', },
    noteButton: { flex: 1, backgroundColor: '#999999', paddingVertical: 16, borderRadius: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, },
    noteButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', fontFamily: 'System', },
    loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.3)', justifyContent: 'center', alignItems: 'center', },
};

const mapStateToProps = state => ({
    token: state.token,
    user: state.user,
    lang: state.lang,
});

export default connect(mapStateToProps)(MedicalNotes);