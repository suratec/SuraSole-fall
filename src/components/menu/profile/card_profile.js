import React, { Component } from 'react'
import { View, TouchableOpacity, ScrollView, Text as RNText } from 'react-native'
import { Card, CardItem } from 'native-base';

import Text from '../../common/TextFix';
import ButtonFix from '../../common/ButtonFix'
import DropDownPicker from 'react-native-dropdown-picker';
import InputFix from '../../common/InputFix'
import Lang from '../../../assets/language/menu/lang_profile';
import {getLocalizedText} from '../../../assets/language/langUtils';

export default class card_profile extends Component {
    constructor(props) {
        super(props);

        this.state = {
            open: false,
            value: props.inputValueGender,
            genderList: [
                { label: 'Male', value: 0 },
                { label: 'Female', value: 1 },
                { label: 'Other', value: 2 },
            ]
        };

        this.setValue = this.setValue.bind(this);
    }

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
            <View style={{ flex: 1, padding: 15 }}>
                <Card style={{ borderRadius: 12 }}>
                    <View style={{ flex: 1, marginLeft: 17, marginRight: 17 }}>

                        <View style={{ height: '3%' }}></View>

                        <Text styles={{ padding: 15, paddingTop: 5, paddingBottom: 5 }}>{this.props.labelFirstName}</Text>
                        <InputFix value={this.props.inputValueFirstName} rounded={true} placeholder={''} onChangeText={this.props.inputFirstName} />

                        <Text styles={{ padding: 15, paddingTop: 5, paddingBottom: 10 }}>{this.props.labelLastName}</Text>
                        <InputFix value={this.props.inputValueLastName} rounded={true} placeholder={''} onChangeText={this.props.inputLastName} />

                        <Text styles={{ padding: 15, paddingTop: 10, paddingBottom: 10 }}>{this.props.labelGender}</Text>
                        <DropDownPicker
                            open={open}
                            setOpen={(open) => this.setOpen(open)}
                            items={genderList}
                            searchablePlaceholder="Search"
                            containerStyle={{ height: 45, borderRadius: 50, width: '98%' }}
                            style={{
                                borderTopEndRadius: 30, borderTopLeftRadius: 30, borderBottomStartRadius: 30, borderBottomRightRadius: 30,
                                backgroundColor: '#fff', borderRadius: 50, padding: 15, paddingTop: 5, paddingBottom: 5
                            }}
                            placeholder={'Gender'}
                            value={this.props.inputValueGender}
                            dropDownMaxHeight={300}
                            dropDownStyle={{ backgroundColor: '#fafafa' }}
                            setValue={(item) => this.setValue(item)}
                        />

                        {this.props.type === "mod_customer" &&
                            <>
                                <Text styles={{ padding: 15, paddingTop: 5, paddingBottom: 5 }}>{this.props.labelWeigth}</Text>
                                <InputFix value={this.props.inputValueWeigth} rounded={true} secure={false} placeholder={''} onChangeText={this.props.inputWeigth} keyboardType={'decimal-pad'} />

                                <Text styles={{ padding: 15, paddingTop: 5, paddingBottom: 5 }}>{this.props.labelHeight}</Text>
                                <InputFix value={this.props.inputValueHeight} rounded={true} secure={false} placeholder={''} onChangeText={this.props.inputHeigth} keyboardType={'decimal-pad'} />

                                <Text styles={{ padding: 15, paddingTop: 5, paddingBottom: 5 }}>{this.props.labelAge}</Text>
                                <InputFix value={this.props.inputValueAge} rounded={true} secure={false} placeholder={''} onChangeText={this.props.inputAge} keyboardType={'decimal-pad'} />
                            </>
                        }

                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginTop: 20,
                            marginBottom: 30,
                            paddingHorizontal: 0,
                            paddingBottom: 10
                        }}>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#00c3cc',
                                    borderRadius: 25,
                                    paddingVertical: 12,
                                    paddingHorizontal: 20,
                                    flex: 1,
                                    marginRight: 18,
                                    alignItems: 'center',
                                }}
                                onPress={this.props.onUpdate}
                            >
                                <RNText style={{
                                    color: '#FFFFFF',
                                    fontSize: 16,
                                    fontWeight: 'bold',
                                    textAlign: 'center'
                                }}>
                                    {getLocalizedText(this.props.lang, Lang.updateLabel)}
                                </RNText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#00c3cc',
                                    borderRadius: 25,
                                    paddingVertical: 12,
                                    paddingHorizontal: 20,
                                    flex: 1,
                                    marginLeft: 18,
                                    alignItems: 'center',
                                }}
                                onPress={this.props.onNotes}
                            >
                                <RNText style={{
                                    color: '#FFFFFF',
                                    fontSize: 16,
                                    fontWeight: 'bold',
                                    textAlign: 'center'
                                }}>
                                    {getLocalizedText(this.props.lang, Lang.note)}
                                </RNText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Card>
            </View>
        )
    }
}