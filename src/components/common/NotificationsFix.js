// 7.11.62
import React, { Component } from 'react'
import { View, Switch } from 'react-native'
import Text from './TextFix'
import { Card } from 'NativeBaseShim';

export default class NotificationsFix extends Component {
    render() {
        return (
            <View style={{ flex: 1}}>
                <View style={{ padding: 15 }} >
                    <Text>{this.props.titleName}</Text>

                    <Card style={{ borderRadius: 12 }}>
                        <View style={{ padding: 5 }}>

                   

                            <View style={{ flexDirection: 'row' }}>
                                <View style={{ marginLeft: 20, flex: 2, alignSelf: 'center' }}>
                                    <Text style={{ fontSize: 20, }} >{this.props.content}</Text>
                                </View>
                                <View style={{ marginRight: 20, flex: 1, alignSelf: 'center' }}>
                                    <Switch
                                        onValueChange={this.props.onValueChange}
                                        value={this.props.switchValue} />
                                </View>
                            </View>

                      

                        </View>
                    </Card>

                </View>
            </View>
        )
    }
}