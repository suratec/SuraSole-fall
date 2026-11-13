//5.11.2562

import React, {Component} from 'react';
import {TouchableOpacity, Text as RNText, View, Image} from 'react-native';
import {getLayout} from '../../../utils/responsive';
import UI from '../../../config/styles/CommonStyles';
import Text from '../../common/TextFix';
import {Thumbnail} from '../../common/NativeBaseShim';

export class item extends Component {
  render() {
    const L = this.props.layout || getLayout();
    return (
      <TouchableOpacity
        onPress={this.props.onPress}
        style={{
          borderWidth: 1,
          borderColor: '#eee',
          height: L.isTablet ? Math.min(L.s(150), 210) : 150,
          width: '30%',
          paddingHorizontal: 6,
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
          width={L.isTablet ? Math.min(L.s(60), 88) : 60}
          height={L.isTablet ? Math.min(L.s(60), 88) : 60}
          source={this.props.source}
        />
        <RNText
          style={{
            textAlign: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: L.isTablet ? L.fs(14) : 12,
            color: '#000',
            marginTop: L.isTablet ? 12 : 5,
          }}>
          {this.props.text}
        </RNText>
      </TouchableOpacity>
    );
  }
}

export default item;
