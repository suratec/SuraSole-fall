import React, {Component} from 'react';
import {Image} from 'react-native';
import {Body, Card, CardItem, Thumbnail} from '../../common/NativeBaseShim';
import UI from '../../../config/styles/CommonStyles';
import Text from '../../common/TextFix';

export class item extends Component {
  render() {
    return (
      <Card
        style={{
          width: '99%',
          height: 100,
          marginBottom: 10,
          borderColor: '#eee',
          borderWidth: 1,
        }}>
        <CardItem
          style={{
            height: 100,
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          button
          onPress={this.props.onPress}>
          <Image
            source={this.props.source}
            style={{width: 80, height: 80}}
            resizeMode={'contain'}
          />

          <Body
            style={{
              flex: 1,
              textAlign: 'center',
              justifyContent: 'center',
              alignItems: 'center',
              margin: 'auto',
            }}>
            <Text>{this.props.text}</Text>
          </Body>
        </CardItem>
      </Card>
    );
  }
}

export default item;
