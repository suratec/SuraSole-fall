import React, { Component } from 'react'
import { View, TouchableOpacity, ScrollView } from 'react-native'
import { Card, CardItem } from 'native-base';

import Text from '../../common/TextFix';
import ButtonFix from '../../common/ButtonFix'
import DropDownPicker from 'react-native-dropdown-picker';
import InputFix from '../../common/InputFix'
import Lang from '../../../assets/language/menu/lang_profile';

export default class card_profile extends Component {
    constructor(props) {
        super(props);

        this.state = {
            open: false,
            value: props.inputValueGender,
            genderList: []
        };

        this.setValue = this.setValue.bind(this);
    }

    componentDidMount() {
        // Set localized gender list based on language
        this.updateGenderList();
    }

    componentDidUpdate(prevProps) {
        // Update gender list when language changes
        if (prevProps.lang !== this.props.lang) {
            this.updateGenderList();
        }
    }

    // Utility to get localized text
    getLocalizedText = (textObject) => {
        const langKey = ['eng', 'thai', 'japanese'][this.props.lang] || 'eng';
        return textObject[langKey] || textObject.eng || '';
    };

    updateGenderList = () => {
        const localizedGenderList = [
            {
                label: this.getLocalizedText(Lang.genderMale),
                value: 0
            },
            {
                label: this.getLocalizedText(Lang.genderFemale),
                value: 1
            },
            {
                label: this.getLocalizedText(Lang.genderOther),
                value: 2
            },
        ];

        this.setState({ genderList: localizedGenderList });
    };

    setOpen(open) {
        this.setState({
            open: open
        });
    }

    setValue(callback) {
        console.log("callback", callback(this.state.value))
        this.props.inputGender(callback(this.state.value))
        this.setState(state => ({
            value: callback(state.value)
        }));
    }

    render() {
        const { open, value, genderList } = this.state;

        console.log(this.props)
        return (
            <View style={{ flex: 1, padding: 15, marginBottom: 10 }}>
                <Card style={{ borderRadius: 12, minHeight: 550 }}>
                    <View style={{ flex: 1, marginLeft: 17, marginRight: 17 }}>

                        <View style={{ height: '3%' }}></View>

                        <Text styles={{ padding: 15, paddingTop: 5, paddingBottom: 5 }}>
                            {this.props.labelFirstName}
                        </Text>
                        <InputFix
                            value={this.props.inputValueFirstName}
                            rounded={true}
                            placeholder={this.getLocalizedText(Lang.firstNamePlaceholder)}
                            onChangeText={this.props.inputFirstName}
                        />

                        <Text styles={{ padding: 15, paddingTop: 5, paddingBottom: 10 }}>
                            {this.props.labelLastName}
                        </Text>
                        <InputFix
                            value={this.props.inputValueLastName}
                            rounded={true}
                            placeholder={this.getLocalizedText(Lang.lastNamePlaceholder)}
                            onChangeText={this.props.inputLastName}
                        />

                        <Text styles={{ padding: 15, paddingTop: 10, paddingBottom: 10 }}>
                            {this.props.labelGender}
                        </Text>
                        <DropDownPicker
                            open={open}
                            setOpen={(open) => this.setOpen(open)}
                            items={genderList}
                            searchablePlaceholder={this.getLocalizedText(Lang.genderMale)}
                            containerStyle={{ height: 45, borderRadius: 50, width: '98%' }}
                            style={{
                                borderTopEndRadius: 30,
                                borderTopLeftRadius: 30,
                                borderBottomStartRadius: 30,
                                borderBottomRightRadius: 30,
                                backgroundColor: '#fff',
                                borderRadius: 50,
                                padding: 15,
                                paddingTop: 5,
                                paddingBottom: 5
                            }}
                            placeholder={this.getLocalizedText(Lang.genderlabel)}
                            value={this.props.inputValueGender}
                            dropDownMaxHeight={300}
                            dropDownStyle={{ backgroundColor: '#fafafa' }}
                            setValue={(item) => this.setValue(item)}
                        />

                        {/* Customer-specific fields */}
                        {this.props.type === "mod_customer" &&
                            <>
                                <Text styles={{ padding: 15, paddingTop: 5, paddingBottom: 5 }}>
                                    {this.props.labelWeigth}
                                </Text>
                                <InputFix
                                    value={this.props.inputValueWeigth}
                                    rounded={true}
                                    secure={false}
                                    placeholder={this.getLocalizedText(Lang.weightPlaceholder)}
                                    onChangeText={this.props.inputWeigth}
                                    keyboardType={'decimal-pad'}
                                />

                                <Text styles={{ padding: 15, paddingTop: 5, paddingBottom: 5 }}>
                                    {this.props.labelHeight}
                                </Text>
                                <InputFix
                                    value={this.props.inputValueHeight}
                                    rounded={true}
                                    secure={false}
                                    placeholder={this.getLocalizedText(Lang.heightPlaceholder)}
                                    onChangeText={this.props.inputHeigth}
                                    keyboardType={'decimal-pad'}
                                />

                                <Text styles={{ padding: 15, paddingTop: 5, paddingBottom: 5 }}>
                                    {this.props.labelAge}
                                </Text>
                                <InputFix
                                    value={this.props.inputValueAge}
                                    rounded={true}
                                    secure={false}
                                    placeholder={this.getLocalizedText(Lang.agePlaceholder)}
                                    onChangeText={this.props.inputAge}
                                    keyboardType={'decimal-pad'}
                                    style={{ marginBottom: 24 }}
                                />
                            </>
                        }

                        <View style={{ height: '3%' }}></View>

                    </View>
                </Card>
            </View>
        )
    }
}