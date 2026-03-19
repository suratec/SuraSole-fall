import React, { Component } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Card, CardItem } from '../../common/NativeBaseShim';

import Text from '../../common/TextFix';
import ButtonFix from '../../common/ButtonFix'
import InputFix from '../../common/InputFix'

export default class card_dailydata extends Component {
    render() {
        return (
            <Card style={{ borderRadius: 12 }}>
                <View style={{ marginLeft: 17, marginRight: 17 }}>

                    <View style={{ height: '3%' }}></View>

                    <Text>{this.props.labelCapillaty}</Text>
                    <InputFix rounded={true} placeholder={''} onChangeText={this.props.inputCapillaty} keyboardType={'decimal-pad'} value={this.props.capillatyValue}/>


                    <Text>{this.props.labelBreakfast}</Text>
                    <InputFix rounded={true} secure={false} placeholder={''} onChangeText={this.props.inputBreakfast} />

                    <Text>{this.props.labelLunch}</Text>
                    <InputFix rounded={true} secure={false} placeholder={''} onChangeText={this.props.inputLunch} />

                    <Text>{this.props.labelDinner}</Text>
                    <InputFix rounded={true} secure={false} placeholder={''} onChangeText={this.props.inputDinner} />

                    <Text>{this.props.labelSleep}</Text>
                    <InputFix rounded={true} secure={false} placeholder={''} onChangeText={this.props.inputSleep} keyboardType={'decimal-pad'} value={this.props.sleepValue}/>

                    <ButtonFix rounded={true} title={'Update'} onPress={this.props.onUpdate} />

                    <View style={{ height: '3%' }}></View>

                </View>
            </Card>
        )
    }
}
