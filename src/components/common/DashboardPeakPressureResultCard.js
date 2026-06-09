import React, {Component} from 'react';
import {View} from 'react-native';

import DashboardTableCard from './DashboardTableCard';
import Text from './TextFix';

export default class DashboardPeakPressureResultCard extends Component {
  renderRow = (el, index, styles) => (
    <View key={index} style={styles.rowClick}>
      <Text styles={{flex: 2}}>{el.nameZone}</Text>
      <Text styles={{flex: 1}}>{el.valueWalk}</Text>
      <View style={styles.rowIcon}>
        <Text numberOfLines={1}>{''}</Text>
        <Text>{el.valueRun}</Text>
      </View>
    </View>
  );

  render() {
    return (
      <DashboardTableCard
        title="Analysis of Peak Pressure (kPa)"
        header={this.props.header}
        data={this.props.data}
        renderRow={this.renderRow}
      />
    );
  }
}
