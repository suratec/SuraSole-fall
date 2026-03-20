// 7.11.62
import React, {Component} from 'react';
import {View} from 'react-native';
import Text from './TextFix';
import {Card, CardItem, Body} from './NativeBaseShim';

export default class CardStatusFix extends Component {
  render() {
    return (
      <View style={{flex: 1}}>
        <Card>
          <CardItem>
            <Body>
            <Text type={'bold'}>
              {this.props.title} :  {this.props.status}
            </Text>
              <Text>{this.props.txt}</Text>
            </Body>
          </CardItem>
        </Card>
      </View>
    );
  }
}
