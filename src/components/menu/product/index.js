import React, { Component } from 'react';
import { View, Dimensions, SafeAreaView, StatusBar } from 'react-native';
import Items from './item';
import Lang from '../../../assets/language/screen/lang_home';
import HeaderFix from '../../common/HeaderFix';
import { connect } from 'react-redux';

class index extends Component {
  componentDidMount() {
    this.props.sensorType(false);
  }

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: 'white' }}>

        <HeaderFix
          icon_left={'left'}
          onpress_left={() => {
            this.props.navigation.goBack();
          }}
          title={this.props.route.params?.['name'] ?? ''}
        />
        <View
          style={{
            padding: 10,
            flexDirection: 'column',
            alignItems: 'center',
          }}>
          <Items
            text={'SURASOLES Lite (5)'}
            source={require('../../../assets/image/product/surasole-lite.png')}
            onPress={() => {
              this.props.productID(1);
              this.props.navigation.replace('Device', {
                name: this.props.lang
                  ? Lang.addDeviceButton.thai
                  : Lang.addDeviceButton.eng,
              });
            }}
          />
          <Items
            text={'SURASOLES Pro (8)'}
            source={require('../../../assets/image/product/surasole-pro.png')}
            onPress={() => {
              this.props.productID(2);
              this.props.sensorType(true);
              this.props.navigation.navigate('Device', {
                name: this.props.lang
                  ? Lang.addDeviceButton.thai
                  : Lang.addDeviceButton.eng,
              });
            }}
          />
        </View>
      </View>
    );
  }
}

const mapStateToProps = state => {
  return {
    eightSensor: state.eightSensor,
    productNumber: state.productNumber,
    lang: state.lang,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    sensorType: type => {
      return dispatch({ type: 'SENSOR_TYPE', payload: type });
    },
    productID: data => {
      return dispatch({ type: 'PRODUCT_ID', payload: data });
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(index);
