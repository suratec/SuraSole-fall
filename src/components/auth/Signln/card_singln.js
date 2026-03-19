import React, { Component } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Card, CardItem, Right } from '../../common/NativeBaseShim';

import Text from '../../common/TextFix';
import ButtonFix from '../../common/ButtonFix'
import InputFix from '../../common/InputFix'
import ButtonLang from './button_lang'

export default class card_singln extends Component {
    render() {
        return (
            <Card style={{ borderRadius: 12 }}>
                <CardItem header>
                    <Text type={'bold'} styles={{ fontSize: 48 }} >{this.props.labelTitle}</Text>

                    <Right><ButtonLang labelLang={this.props.labelLang} onLang={this.props.onLang} /></Right>
                </CardItem>
                <View style={{ marginLeft: 17, marginRight: 17 }}>

                    <Text>{this.props.labelUsername}</Text>
                    <InputFix rounded={true} placeholder={''} onChangeText={this.props.inputUsername} />


                    <Text>{this.props.labelPassword}</Text>
                    <InputFix rounded={true} secure={true} placeholder={''} onChangeText={this.props.inputPassword} />

                    <ButtonFix rounded={true} title={this.props.labelBtn} onPress={this.props.onSingln} />

                    <View style={{ height: '3%' }}></View>

                    <TouchableOpacity onPress={() => {
                        this.props.navigation.navigate(this.props.forgetpass);
                    }}>
                        <View style={{alignItems: 'center'}}>
                            <Text style={{ textAlign: 'center' }}>{this.props.labelForgetpass}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </Card>
        )
    }
}
