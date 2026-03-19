//5.11.2562

import React, {Component} from 'react';
import {TouchableOpacity, Text as RNText, View, Image} from 'react-native';
import UI from '../../../config/styles/CommonStyles';
import Text from '../../common/TextFix';

export class item extends Component {
  render() {
    return (
      <TouchableOpacity
        onPress={this.props.onPress}
        style={{
          borderWidth: 1,
          borderColor: '#eee',
          height: 150,
          width: '30%',
          marginHorizontal: 5,
          borderRadius: 6,
          marginVertical: 5,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Thumbnail
          style={{
            backgroundColor: UI.color_Gradient[0],
            tintColor: 'white',
          }}
          width={60}
          height={60}
          source={this.props.source}
        />
        <RNText
          style={{
            textAlign: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: 12,
            color: '#000',
            marginTop: 5,
          }}>
          {this.props.text}
        </RNText>
      </TouchableOpacity>
    );
  }
}

export default item;
