import React, { Component } from 'react'
import { View , TouchableOpacity} from 'react-native'
import { Card, CardItem} from '../../common/NativeBaseShim';

import Text from '../../common/TextFix';
import ButtonFix from '../../common/ButtonFix'
import InputFix from '../../common/InputFix'

export default class card_forget extends Component {
    render() {
        return (
            <Card style={{ borderRadius: 12 }}>
                <CardItem header>
                    <Text type={'bold'} styles={{ fontSize: 32 }} >{this.props.labelTitle}</Text>
                </CardItem>
                <View style={{ marginLeft: 17, marginRight: 17}}>

                    <Text>{this.props.labelEmail}</Text>
                    <InputFix rounded={true} placeholder={''} onChangeText={this.props.inputEmail} />

                    <ButtonFix rounded={true} title={this.props.labelBtn} onPress={this.props.onForget} />

                    <View style={{ height: '3%' }}></View>

                    <TouchableOpacity onPress={() => {
                        this.props.navigation.goBack();
                    }}>
                        <Text styles={{ textAlign: 'center' }}>{this.props.labelBack}</Text>
                    </TouchableOpacity>
                    <View style={{ height: '3%' }}></View>
                </View>
            </Card>
        )
    }
}
