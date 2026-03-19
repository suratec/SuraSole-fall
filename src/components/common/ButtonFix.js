import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import {Button} from 'NativeBaseShim';
import UI from '../../config/styles/CommonStyles';

export default class ButtonFix extends Component {
  render() {
    return (
      <View style={{padding: 10}}>
        <TouchableOpacity onPress={this.props.onPress}>
          {this.props.rounded ? (
            <Button
              rounded
              style={[
                {
                  justifyContent: 'center',
                  width:'auto',
                  minWidth:150,
                  height:50,
                  backgroundColor: this.props.action
                    ? UI.color_buttonAction
                    : UI.color_buttonConfirm,
                },
                this.props.styles,
              ]}
              onPress={this.props.onPress}>
              <Text
                style={{
                  textAlign: 'center',
                  color: this.props.textCl ? UI.textBlack : UI.textWhite,
                }}>
                {this.props.title}
              </Text>
            </Button>
          ) : (
            <Button
              style={[
                {
                  justifyContent: 'center',
                  backgroundColor: this.props.action
                    ? UI.color_buttonAction
                    : UI.color_buttonConfirm,
                },
                this.props.styles,
              ]}
              onPress={this.props.onPress}>
              <Text
                style={{
                  textAlign: 'center',
                  color: this.props.textCl ? UI.textBlack : UI.textWhite,
                }}>
                {this.props.title}
              </Text>
            </Button>
          )}
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 50,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
});
