import React, {Component} from 'react';
import {Dimensions, ScrollView, View} from 'react-native';

import SvgContourBasic from '../contourlib/screens/SvgD3ContourBasic';
import RecordStopButton from './RecordStopButton';
import HeaderFix from './HeaderFix';

export default class PressureMapLayout extends Component {
  render() {
    const {width: screenWidth, height: screenHeight} =
      Dimensions.get('screen');
    const isLandscape = screenWidth > screenHeight;
    const svgHeight = isLandscape ? screenHeight * 0.5 : screenWidth * 0.9 + 50;

    return (
      <View style={{flex: 1, backgroundColor: 'white'}}>
        <HeaderFix
          icon_left={'left'}
          onpress_left={this.props.onBack}
          title={this.props.title}
        />

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 15,
            paddingVertical: 10,
          }}
          showsVerticalScrollIndicator={false}>
          <View
            style={{
              height: svgHeight,
              justifyContent: 'center',
            }}>
            <SvgContourBasic
              leftsensor={this.props.leftData}
              rightsensor={this.props.rightData}
            />
          </View>

          <View style={{padding: 15, alignItems: 'center'}}>
            <RecordStopButton
              title={this.props.buttonTitle}
              onPress={this.props.onRecord}
            />
          </View>
        </ScrollView>
      </View>
    );
  }
}
