import React, {Component} from 'react';
import {Image, View, StyleSheet} from 'react-native';
import {Body, Card, CardItem, Thumbnail} from '../../common/NativeBaseShim';
import UI from '../../../config/styles/CommonStyles';
import Text from '../../common/TextFix';
import {getLayout} from '../../../utils/responsive';

export class item extends Component {
  render() {
    const L = this.props.layout || getLayout();
    const cardH = L.isTablet ? 140 : 100;
    return (
      <Card
        style={{
          width: '98%',
          height: cardH,
          marginBottom: L.isTablet ? 16 : 10,
          marginHorizontal: 0,
          alignSelf: 'center',
          borderColor: '#eee',
          borderWidth: 1,
        }}>
        <CardItem
          style={{
            height: cardH + 10,
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 15,
          }}
          button
          onPress={this.props.onPress}>
          <Image
            source={this.props.source}
            style={{width: L.isTablet ? 100 : 70, height: L.isTablet ? 125 : 90}}
            resizeMode={'contain'}
          />

          <Body
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text styles={L.isTablet ? { textAlign: 'center', fontSize: L.fs(16) } : { textAlign: 'center' }}>{this.props.text}</Text>
          </Body>
        </CardItem>
      </Card>
    );
  }
}

export default item;
