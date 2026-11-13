// src/components/menu/assessment/FallRiskScreen.js

import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
    ScrollView,
} from 'react-native';
import HeaderFix from '../../common/HeaderFix';
import MultiSelectCheckbox from '../../MultiSelectCheckbox';
import { useSelector } from 'react-redux';
import { useLayout } from '../../../utils/responsive';
import langAssessment from '../../../assets/language/menu/lang_assessmentTests';
import {getLocalizedText} from '../../../assets/language/langUtils';


const FallRiskScreen = ({ navigation }) => {
    const [select, setSelect] = useState('yes');
    const [selectedOptions, setSelectedOptions] = useState([]);
    const L = useLayout();
    const user = useSelector(state => state?.user);
    const lang = useSelector(state => state?.lang);
    const localizedTitle = getLocalizedText(lang, langAssessment.fallRiskScreening);

    const options = [
        getLocalizedText(lang, langAssessment.injury),
        getLocalizedText(lang, langAssessment.fallLastYear),
        getLocalizedText(lang, langAssessment.frailty),
        getLocalizedText(lang, langAssessment.lyingOnFloor),
        getLocalizedText(lang, langAssessment.lossOfConsciousness),
    ];

    const handleCheckboxChange = option => {
        if (selectedOptions.includes(option)) {
            setSelectedOptions(prev => prev.filter(item => item !== option));
        } else {
            setSelectedOptions(prev => [...prev, option]);
        }
    };

    const onSubmit = () => {
        const payload = {
            user_id: user?.id_customer,
            q1: select === 'yes' ? '1' : '0',
            q1_1: selectedOptions.includes(options[0]) ? '1' : '0',
            q1_2: selectedOptions.includes(options[1]) ? '1' : '0',
            q1_3: selectedOptions.includes(options[2]) ? '1' : '0',
            q1_4: selectedOptions.includes(options[3]) ? '1' : '0',
            q1_5: selectedOptions.includes(options[4]) ? '1' : '0',
        };

        fetch('https://api1.suratec.co.th/member/get_add_data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(res => res.json())
            .then(result => {
                console.log('result-', result?.status);
                if (result?.status === 200) {
                    Alert.alert(getLocalizedText(lang, langAssessment.success), getLocalizedText(lang, langAssessment.formSubmitSuccess), [
                        {
                            text: 'OK',
                            onPress: () => {
                                navigation.navigate('StandOpenEyes');
                            },
                        },
                    ]);
                } else {
                    Alert.alert(getLocalizedText(lang, langAssessment.failed), getLocalizedText(lang, langAssessment.formSubmitFail));
                }
            })
            .catch(error => {
                console.log('error', error);
                Alert.alert(getLocalizedText(lang, langAssessment.error), getLocalizedText(lang, langAssessment.submissionFailed));
            });
    };


    return (
        <View style={styles.container}>
            <HeaderFix
                icon_left="left"
                onpress_left={() => navigation.goBack()}
                title={localizedTitle}
            />

            <ScrollView
                contentContainerStyle={[
                    { flexGrow: 1, padding: 20 },
                    L.isTablet && { maxWidth: Math.min(L.contentWidth, 680), width: '100%', alignSelf: 'center', paddingTop: 40 },
                ]}
                showsVerticalScrollIndicator={false}
            >
            <Text style={[styles.text, { marginTop: L.isTablet ? 40 : '10%', textAlign: 'center', fontSize: L.fs(20) }]}>
                {getLocalizedText(lang, langAssessment.fallPast12Months)}
            </Text>

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.optionBtn, L.isTablet && styles.optionBtnTablet, select === 'yes' && styles.optionSelected]}
                    onPress={() => setSelect('yes')}
                >
                    <Text
                        style={[styles.optionText, select === 'yes' && styles.textSelected]}
                    >
                        {getLocalizedText(lang, langAssessment.Yes)}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.optionBtn, L.isTablet && styles.optionBtnTablet, select === 'no' && styles.optionSelected]}
                    onPress={() => setSelect('no')}
                >
                    <Text
                        style={[styles.optionText, select === 'no' && styles.textSelected]}
                    >
                        {getLocalizedText(lang, langAssessment.No)}
                    </Text>
                </TouchableOpacity>
            </View>

            {select === 'yes' && (
                <>
                    <Text style={[styles.text, { marginTop: L.isTablet ? 48 : '10%', textAlign: 'center', fontSize: L.fs(20) }]}>
                        {getLocalizedText(lang, langAssessment.assessFallSeverity)}
                    </Text>
                    <MultiSelectCheckbox
                        options={options}
                        selectedOptions={selectedOptions}
                        onChange={handleCheckboxChange}
                    />
                </>
            )}

                <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 60 }}>
                <TouchableOpacity
                    style={[styles.submitBtn, L.isTablet && { paddingVertical: 16, borderRadius: 28 }]}
                    onPress={() => {
                        if (select === 'no') setSelectedOptions([]);
                        onSubmit();
                    }}
                >
                    <Text style={[styles.submitText, { fontSize: L.fs(18) }]}>{getLocalizedText(lang, langAssessment.submit)}</Text>
                </TouchableOpacity>
            </View>
            </ScrollView>
        </View>
    );
};

export default FallRiskScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    text: {
        width: '90%',
        fontSize: 20,
        color: '#00A2A2',
        fontWeight: '700',
        alignSelf: 'center',
    },
    buttonRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginTop: '5%',
    },
    optionBtn: {
        width: 130,
        height: 55,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: '#00A2A2',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    optionBtnTablet: {
        width: 180,
        height: 68,
        borderRadius: 34,
    },
    optionSelected: {
        backgroundColor: '#00A2A2',
    },
    optionText: {
        fontSize: 32,
        color: '#00A2A2',
        fontWeight: '600',
    },
    textSelected: {
        color: '#fff',
    },
    submitWrapper: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 5,
    },
    submitBtn: {
        width: '60%',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#00A2A2',
        borderRadius: 20,
        marginVertical: 40,
        alignItems: 'center',
    },
    submitText: {
        fontSize: 18,
        color: '#fff',
    },
});
