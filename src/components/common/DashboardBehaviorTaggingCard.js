import React, {Component} from 'react';
import {StyleSheet, View} from 'react-native';
import {connect} from 'react-redux';

import ListItem from './DashboardTaggingListItem';
import Text from './TextFix';

const findDuration = data => {
  return data.reduce((a, b) => a + b.duration, 0);
};

const getStepAndLength = data => {
  let step = 0;
  let isLeft = false;
  let isRight = false;

  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[i].left.length; j++) {
      const leftSide = data[i].left[j].reduce((a, b) => a + b, 0);
      const rightSide = data[i].right[j].reduce((a, b) => a + b, 0);

      if (Math.abs(leftSide - rightSide) > 1000) {
        if (leftSide > rightSide && !isLeft) {
          step += 1;
          isLeft = true;
          isRight = false;
        } else if (rightSide > leftSide && !isRight) {
          step += 1;
          isLeft = false;
          isRight = true;
        }
      }
    }
  }

  return step;
};

const findPeak = data => {
  if (!Array.isArray(data)) {
    return 0;
  }

  let max = 0;
  data.forEach(e => {
    if (Number(e.valuePeak) > max) {
      max = Number(e.valuePeak);
    }
  });

  return max;
};

const findSwing = data => {
  let swing = 0;
  let all = 0;

  data.forEach(d => {
    for (let i = 1; i < d.left.length; i++) {
      const currentleftX =
        (d.left[i][0] + d.left[i][1] + d.left[i][2]) / 3 - d.left[i][4];
      const currentleftY = d.left[i][2] - d.left[i][1];
      const currentrightX =
        (d.right[i][0] + d.right[i][1] + d.right[i][2]) / 3 - d.right[i][4];
      const currentrightY = d.right[i][2] - d.right[i][1];
      const currentX = (currentleftX + currentrightX) / 2;
      const currentY = (currentleftY + currentrightY) / 2;
      const previousleftX =
        (d.left[i - 1][0] + d.left[i - 1][1] + d.left[i - 1][2]) / 3 -
        d.left[i - 1][4];
      const previousleftY = d.left[i - 1][2] - d.left[i - 1][1];
      const previousrightX =
        (d.right[i - 1][0] + d.right[i - 1][1] + d.right[i - 1][2]) / 3 -
        d.right[i - 1][4];
      const previousrightY = d.right[i - 1][2] - d.right[i - 1][1];
      const previousX = (previousleftX + previousrightX) / 2;
      const previousY = (previousleftY + previousrightY) / 2;

      swing += Math.sqrt(
        Math.pow(previousX - currentX, 2) + Math.pow(previousY - currentY, 2),
      );
    }
    all += d.left.length;
  });

  return swing / all;
};

class DashboardBehaviorTaggingCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      step: 0,
      duration: 0,
      pace: 0,
      distance: 0,
      peak: 0,
      swing: 0,
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.data && nextProps.dataSpecified) {
      const duration = findDuration(nextProps.data);
      const step = getStepAndLength(nextProps.data);
      const peak = findPeak(nextProps.dataSpecified);
      let swing = findSwing(nextProps.data);
      let distance = 0;

      if (nextProps.user.sex === 0) {
        distance = nextProps.user.height * 0.415 * step;
      } else {
        distance = nextProps.user.height * 0.413 * step;
      }

      let pace = duration / 60 / (distance / 1000);
      isNaN(pace) || pace === Infinity ? (pace = 0) : (pace = pace);
      isNaN(swing) ? (swing = 0) : (swing = swing);

      return {
        duration,
        step,
        distance: (distance / 1000).toFixed(3),
        peak,
        pace: pace.toFixed(2),
        swing: swing.toFixed(2),
      };
    }

    return {...prevState};
  }

  render() {
    return (
      <View style={{flex: 1}}>
        <View style={{flexDirection: 'row'}}>
          <View style={{marginLeft: 20, flex: 1, alignSelf: 'center'}} />
          <Text styles={{alignSelf: 'center', paddingHorizontal: 5}}>
            Behavior tagging
          </Text>
          <View style={{marginRight: 20, flex: 1, alignSelf: 'center'}} />
        </View>

        <View style={{padding: 15}}>
          <View style={styles.card}>
            <View style={{height: '3%'}} />

            <ListItem
              imageLeft={require('../../assets/image/dashboard/time.png')}
              titleNameLeft={'Duration'}
              titleValueLeft={`${this.state.duration} s`}
              imageRight={require('../../assets/image/dashboard/dashboard.png')}
              titleNameRight={'Avg. Pace'}
              titleValueRight={`${this.state.pace} min/km`}
            />

            <ListItem
              imageLeft={require('../../assets/image/dashboard/pinpoint.png')}
              titleNameLeft={'Avg Distance'}
              titleValueLeft={`${this.state.distance} km`}
              imageRight={require('../../assets/image/dashboard/walking.png')}
              titleNameRight={'Total Steps'}
              titleValueRight={`${this.state.step}`}
            />

            <ListItem
              imageLeft={require('../../assets/image/dashboard/report.png')}
              titleNameLeft={'Peak Pressure'}
              titleValueLeft={`${this.state.peak} kPa`}
              imageRight={require('../../assets/image/dashboard/sine.png')}
              titleNameRight={'CG Swing'}
              titleValueRight={`${this.state.swing}`}
            />

            <View style={{height: '3%'}} />
          </View>
        </View>
      </View>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.user,
  };
};

export default connect(mapStateToProps)(DashboardBehaviorTaggingCard);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#dddddd',
    marginTop: 10,
    borderRadius: 4,
    marginBottom: 5,
  },
});
