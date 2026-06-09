import React, {Component} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';

import UI from '../../config/styles/CommonStyles';
import Text from './TextFix';

export default class DashboardTableCard extends Component {
  renderTitle() {
    const {title} = this.props;

    if (!title) {
      return null;
    }

    return (
      <View style={{flexDirection: 'row'}}>
        <View style={{marginLeft: 20, flex: 1, alignSelf: 'center'}} />
        <Text styles={{alignSelf: 'center', paddingHorizontal: 5}}>
          {title}
        </Text>
        <View style={{marginRight: 20, flex: 1, alignSelf: 'center'}} />
      </View>
    );
  }

  renderHeader() {
    const {header = []} = this.props;

    return header.map((el, index) => (
      <View key={index}>
        <Text styles={{color: '#ffffff'}}>{el}</Text>
      </View>
    ));
  }

  renderBody() {
    const {data = [], renderRow} = this.props;

    if (!renderRow) {
      return null;
    }

    return data.map((el, index) => renderRow(el, index, styles));
  }

  render() {
    return (
      <View>
        {this.renderTitle()}
        <View style={{padding: 15}}>
          <View style={styles.card}>
            <View style={styles.header}>{this.renderHeader()}</View>
            <ScrollView>
              <View>{this.renderBody()}</View>
            </ScrollView>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: UI.color_Gradient[1],
    padding: 10,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dddddd',
    marginTop: 0,
    borderRadius: 4,
    marginBottom: 5,
  },
  rowClick: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rowIcon: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 10,
  },
});
