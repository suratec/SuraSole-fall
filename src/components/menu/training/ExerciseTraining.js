import React, { Component } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import HeaderFix from '../../common/HeaderFix';
import UI from '../../../config/styles/CommonStyles';
import { connect } from 'react-redux';

const { width } = Dimensions.get('window');
import langTraining from '../../../assets/language/menu/lang_training';
import {getLocalizedText} from '../../../assets/language/langUtils';

class ExerciseTraining extends Component {
    handleNavigate = route => {
        this.props.navigation.navigate(route);
    };

    render() {

        return (
            <View style={styles.container}>
                <HeaderFix
                    icon_left={'left'}
                    onpress_left={() => {
                        this.props.navigation.goBack();
                    }}
                    title={getLocalizedText(this.props.lang, langTraining.title)}
                />
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: '#d2f6fb' }]}
                        onPress={() => this.handleNavigate('LowRiskExercise')}>
                        <Text style={[styles.cardText, { color: '#007b8a' }]}>
                            {getLocalizedText(this.props.lang, langTraining.lowRiskProgramCard)}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: '#fef8cb' }]}
                        onPress={() => this.handleNavigate('ModerateRiskExercise')}>
                        <Text style={[styles.cardText, { color: '#027b57' }]}>
                            {getLocalizedText(this.props.lang, langTraining.moderateRiskProgramCard)}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: '#fff' }]}
                        onPress={() => this.handleNavigate('ExerciseWorkOut')}>
                        <Text style={[styles.cardText, { color: '#00a4cc' }]}>
                            {getLocalizedText(this.props.lang, langTraining.exerciseWorkOut)}
                        </Text>
                    </TouchableOpacity>



                </ScrollView>
            </View>
        );
    }
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e6fafd', // subtle gradient like in your image
    },
    scrollContainer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    card: {
        height: 101,
        width: width * 0.9,
        padding: 18,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
        elevation: 3,
        borderWidth: 1.5,
        borderColor: '#00a4cc',
        justifyContent: 'center',
    },
    cardText: {
        fontSize: 20,
        textAlign: 'center',
        fontWeight: '600',
        verticalAlign: 'center',
    },
});


const mapStateToProps = state => ({
    lang: state.lang,
});

export default connect(mapStateToProps)(ExerciseTraining);

