import React, {Component} from 'react';
import {View} from 'react-native';

import DashboardTableCard from './DashboardTableCard';
import Text from './TextFix';

export default class DashboardPeakPressureOverspecifiedCard extends Component {
  renderRow = (el, index, styles) => (
    <View key={index} style={styles.rowClick}>
      <Text styles={{flex: 1.7}}>{el.dateTime}</Text>
      <Text styles={{flex: 1}}>{el.valueZone + 1}</Text>
      <View style={styles.rowIcon}>
        <Text numberOfLines={1}>{''}</Text>
        <Text>{el.valuePeak}</Text>
      </View>
    </View>
  );

  render() {
    return (
      <DashboardTableCard
        header={this.props.header}
        data={this.props.data}
        renderRow={this.renderRow}
      />
    );
  }
}
