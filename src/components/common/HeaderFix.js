import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  BackHandler,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import UI from '../../config/styles/CommonStyles';

export default class HeaderFix extends Component {
  componentDidMount() {
    this.backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonPress,
    );
  }

  componentWillUnmount() {
    if (this.backHandler) {
      this.backHandler.remove();
    }
  }

  handleBackButtonPress = () => {
    if (this.props.onpress_left) {
      this.props.onpress_left();
      return true;
    }
    return false;
  };

  render() {
    return (
      <SafeAreaView style={{backgroundColor: UI.color_Gradient[1]}} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={this.props.onpress_left}
            style={{flex: 10, flexDirection: 'row', alignItems: 'center'}}>
            <View style={{flex: 2, paddingLeft: 10}}>
              {this.props.icon_left ? (
                <Image
                  source={require('../../assets/image/leftback.png')}
                  tintColor={'#fff'}
                  style={{width: 18, height: 18}}
                />
              ) : null}
            </View>
            <View style={{flex: 8, alignItems: 'center'}}>
              <Text style={{color: '#fff', fontSize: 18, fontWeight: 'bold'}}>
                {this.props.title}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={{flex: 2, alignItems: 'flex-end', paddingRight: 10}}>
            {this.props.text_rigth ? (
              <TouchableOpacity
                onPress={this.props.onpress_rigth}
                activeOpacity={0.8}
                style={this.props.rightPill ? styles.rightPillContainer : null}>
                <Text
                  style={
                    this.props.rightPill
                      ? styles.rightPillText
                      : styles.textRight
                  }>
                  {this.props.text_rigth}
                </Text>
              </TouchableOpacity>
            ) : this.props.icon_rigth ? (
              <TouchableOpacity onPress={this.props.onpress_rigth}>
                {this.props.iconType ? (
                  <Image
                    source={require('../../assets/image/more.png')}
                    tintColor={'#fff'}
                    style={{width: 18, height: 18}}
                  />
                ) : (
                  <Image
                    source={require('../../assets/image/more.png')}
                    tintColor={'#fff'}
                    style={{width: 18, height: 18}}
                  />
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: UI.color_Gradient[1],
  },
  textRight: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  rightPillContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightPillText: {
    color: UI.color_Gradient[1],
    fontWeight: 'bold',
    fontSize: 12,
  },
});
