import React, {Component} from 'react';
import {Image, Text, View} from 'react-native';

export default class DashboardTaggingListItem extends Component {
  render() {
    return (
      <View style={{flex: 1}}>
        <View style={{flexDirection: 'row'}}>
          <View style={{flex: 1, alignItems: 'center'}}>
            <Image
              style={{width: 55, height: 55}}
              source={this.props.imageLeft}
            />

            <Text style={{fontSize: 10}}>{this.props.titleNameLeft}</Text>
            <Text style={{fontSize: 22}}>{this.props.titleValueLeft}</Text>
          </View>
          <View style={{flex: 1, alignItems: 'center'}}>
            <Image
              style={{width: 55, height: 55}}
              source={this.props.imageRight}
            />

            <Text style={{fontSize: 10}}>{this.props.titleNameRight}</Text>
            <Text style={{fontSize: 22}}>{this.props.titleValueRight}</Text>
          </View>
        </View>
        <View style={{flex: 1, height: '3%'}} />
      </View>
    );
  }
}
