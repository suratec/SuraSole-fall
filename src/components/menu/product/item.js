import React, {Component} from 'react';
import {Image, View, StyleSheet} from 'react-native';
import {Body, Card, CardItem, Thumbnail} from '../../common/NativeBaseShim';
import UI from '../../../config/styles/CommonStyles';
import Text from '../../common/TextFix';

export class item extends Component {
  render() {
    return (
      <Card
        style={{
          width: '98%',
          height: 100,
          marginBottom: 10,
          marginHorizontal: 0,
          alignSelf: 'center',
          borderColor: '#eee',
          borderWidth: 1,
        }}>
        <CardItem
          style={{
            height: 110,
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 15,
          }}
          button
          onPress={this.props.onPress}>
          <Image
            source={this.props.source}
            style={{width: 70, height: 90}}
            resizeMode={'contain'}
          />

          <Body
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text style={{ textAlign: 'center' }}>{this.props.text}</Text>
          </Body>
        </CardItem>
      </Card>
    );
  }
}

export default item;
