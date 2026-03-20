import React, { Component } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Card, CardItem, Right, Left, Radio } from '../../common/NativeBaseShim';
import { Col, Row, Grid } from '../../common/NativeBaseShim';

import RadioForm, { RadioButton, RadioButtonInput, RadioButtonLabel } from 'react-native-simple-radio-button';

import Text from '../../common/TextFix';
import ButtonFix from '../../common/ButtonFix'
import InputFix from '../../common/InputFix'
import DropdownFix from '../../common/DropdownFix'

export default class card_register extends Component {

    radio_props = [
        { label: this.props.labelMale, value: 0 },
        { label: this.props.labelFemale, value: 1 }
    ];

    state = {
        value: -1
    }

    onPressRadioButton = (value) => {
        this.setState({value});
        this.props.onPressRadio(value);
    }

    render() {
        return (
            <Card style={{ borderRadius: 12 }}>
                <CardItem header>
                    <Left>
                        <Text type={'bold'} styles={{ fontSize: 30 }} >{this.props.labelTitle}</Text>
                    </Left>


                    <Right>
                        <TouchableOpacity onPress={() => this.props.navigation.goBack()}>
                            <Text type={'bold'} styles={{ fontSize: 15 }} >{this.props.labelBack}</Text>
                        </TouchableOpacity>
                    </Right>
                </CardItem>
                <View style={{ marginLeft: 17, marginRight: 17 }}>

                    <Text>{this.props.labelUsername}</Text>
                    <InputFix value={this.props.valueUsername} rounded={true} placeholder={''} onChangeText={this.props.inputUsername} />

                    <Text>{this.props.labelEmail}</Text>
                    <InputFix value={this.props.valueEmail} rounded={true} placeholder={''} onChangeText={this.props.inputEmail} />

                    <Text>{this.props.labelPassword}</Text>
                    <InputFix value={this.props.valuePassword} rounded={true} secure={true} placeholder={''} onChangeText={this.props.inputPassword} />

                    <Text>{this.props.labelCmPassword}</Text>
                    <InputFix value={this.props.valueCmPassword} rounded={true} secure={true} placeholder={''} onChangeText={this.props.inputConfirmPassword} />

                    <View style={{ height: '7%' }}>
                        <RadioForm formHorizontal={true}
                            animation={true}>
                            {
                                this.radio_props.map((obj, i) => (
                                    <View style={{paddingLeft: '13%'}} key={i}>
                                        <RadioButton labelHorizontal={true}>
                                            <RadioButtonLabel
                                                obj={obj}
                                                index={i}
                                                labelHorizontal={true}
                                                onPress={this.onPressRadioButton}
                                                labelStyle={{ fontSize: 15, color: '#000000' }}
                                                labelWrapStyle={{}} />
                                            <RadioButtonInput
                                                obj={obj}
                                                index={i}
                                                isSelected={this.state.value === i}
                                                onPress={this.onPressRadioButton}
                                                borderWidth={1}
                                                buttonInnerColor={'#22D0D0'}
                                                buttonOuterColor={this.state.value === i ? '#1EC8C8' : '#000'}
                                                buttonSize={20}
                                                buttonOuterSize={25}
                                                buttonStyle={{}}
                                                buttonWrapStyle={{ marginLeft: 10 }}
                                            />
                                        </RadioButton>
                                    </View>
                                ))
                            }
                        </RadioForm>
                        {/* <Grid>
                            <Col><Text>{this.props.labelMale}</Text></Col>
                            <Col><Radio color={'#1EC8C8'} selected={this.props.isMale} onPress={this.props.onPressMaleRadio}/></Col>
                            <Col><Text>{this.props.labelFemale}</Text></Col>
                            <Col><Radio color={'#1EC8C8'} selected={!this.props.isMale} onPress={this.props.onPressFemaleRadio}/></Col>
                        </Grid> */}
                    </View>


                    {/* <DropdownFix
                        title={this.props.titleDropdown}
                        placeholder={this.props.placeholderDropdown}
                        onValueChange={this.props.onValueChangeDropdown}
                        items={this.props.itemsDropdown}
                    /> */}

                    <ButtonFix rounded={true} title={this.props.labelBtn} onPress={this.props.onRegister} />

                </View>
            </Card>
        )
    }
}
