import React, { Component } from 'react'
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Card } from '../../common/NativeBaseShim';

import Text from '../../common/TextFix';
import DropDownPicker from 'react-native-dropdown-picker';
import InputFix from '../../common/InputFix'
import Lang from '../../../assets/language/menu/lang_profile';
import { getLocalizedText } from '../../../assets/language/langUtils';

export default class card_profile extends Component {
    constructor(props) {
        super(props);

        this.state = {
            open: false,
            value: props.inputValueGender,
        };

        this.setValue = this.setValue.bind(this);
    }

    setOpen(open) {
        this.setState({
            open: open
        });
    }

    setValue(callback) {
        const currentValue = this.props.inputValueGender ?? this.state.value;
        const nextValue = callback(currentValue);
        this.props.inputGender(nextValue)
        this.setState({ value: nextValue });
    }

    renderField(label, value, onChangeText, keyboardType) {
        return (
            <View style={styles.field}>
                <Text styles={styles.label}>{label}</Text>
                <InputFix
                    value={value}
                    rounded={true}
                    secure={false}
                    placeholder={''}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    styleView={styles.inputWrapper}
                />
            </View>
        );
    }

    render() {
        const { open } = this.state;
        const genderList = [
            { label: getLocalizedText(this.props.lang, Lang.male), value: 0 },
            { label: getLocalizedText(this.props.lang, Lang.female), value: 1 },
            { label: getLocalizedText(this.props.lang, Lang.other), value: 2 },
        ];

        return (
            <View style={styles.container}>
                <Card style={styles.card}>
                    <View style={styles.cardBody}>
                        {this.renderField(
                            this.props.labelFirstName,
                            this.props.inputValueFirstName,
                            this.props.inputFirstName,
                        )}

                        {this.renderField(
                            this.props.labelLastName,
                            this.props.inputValueLastName,
                            this.props.inputLastName,
                        )}

                        <View style={[styles.field, styles.dropdownField]}>
                            <Text styles={styles.label}>{this.props.labelGender}</Text>
                        <DropDownPicker
                            open={open}
                            setOpen={(open) => this.setOpen(open)}
                            items={genderList}
                            searchablePlaceholder="Search"
                            containerStyle={styles.dropdownContainer}
                            style={styles.dropdown}
                            textStyle={styles.dropdownText}
                            labelStyle={styles.dropdownText}
                            placeholderStyle={styles.dropdownPlaceholder}
                            dropDownContainerStyle={styles.dropdownList}
                            placeholder={this.props.labelGender}
                            value={this.props.inputValueGender}
                            dropDownMaxHeight={300}
                            setValue={(item) => this.setValue(item)}
                            listMode="SCROLLVIEW"
                            zIndex={3000}
                            zIndexInverse={1000}
                        />
                        </View>

                        {this.props.type === "mod_customer" &&
                            <>
                                {this.renderField(
                                    this.props.labelWeigth,
                                    this.props.inputValueWeigth,
                                    this.props.inputWeigth,
                                    'decimal-pad',
                                )}

                                {this.renderField(
                                    this.props.labelHeight,
                                    this.props.inputValueHeight,
                                    this.props.inputHeigth,
                                    'decimal-pad',
                                )}

                                {this.renderField(
                                    this.props.labelAge,
                                    this.props.inputValueAge,
                                    this.props.inputAge,
                                    'decimal-pad',
                                )}

                                {this.renderField(
                                    this.props.labelGripStrength,
                                    this.props.inputValueGripStrength,
                                    this.props.inputGripStrength,
                                    'decimal-pad',
                                )}
                            </>
                        }

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                disabled={this.props.loading}
                                onPress={this.props.onUpdate}
                                style={[
                                    styles.actionButton,
                                    styles.primaryButton,
                                    this.props.loading && styles.disabledButton,
                                ]}>
                                {this.props.loading ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text styles={styles.primaryButtonText}>
                                        {getLocalizedText(this.props.lang, Lang.updateLabel)}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={this.props.onNote}
                                style={[styles.actionButton, styles.secondaryButton]}>
                                <Text styles={styles.secondaryButtonText}>
                                    {getLocalizedText(this.props.lang, Lang.noteLabel)}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Card>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 24,
    },
    card: {
        marginHorizontal: 0,
        marginVertical: 0,
        borderRadius: 8,
    },
    cardBody: {
        paddingHorizontal: 16,
        paddingTop: 18,
        paddingBottom: 18,
    },
    field: {
        marginBottom: 14,
    },
    dropdownField: {
        zIndex: 3000,
    },
    label: {
        color: '#4a4a4a',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
        paddingHorizontal: 4,
    },
    inputWrapper: {
        padding: 0,
    },
    dropdownContainer: {
        width: '100%',
        minHeight: 48,
    },
    dropdown: {
        minHeight: 48,
        borderRadius: 24,
        borderColor: '#cccccc',
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
    },
    dropdownText: {
        color: '#222222',
        fontSize: 15,
    },
    dropdownPlaceholder: {
        color: '#777777',
        fontSize: 15,
    },
    dropdownList: {
        borderColor: '#cccccc',
        borderRadius: 16,
        backgroundColor: '#ffffff',
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        marginTop: 8,
    },
    actionButton: {
        flex: 1,
        minHeight: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    primaryButton: {
        backgroundColor: '#00A651',
        marginRight: 6,
    },
    secondaryButton: {
        backgroundColor: '#6c757d',
        marginLeft: 6,
    },
    disabledButton: {
        opacity: 0.72,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'center',
    },
    secondaryButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'center',
    },
});
