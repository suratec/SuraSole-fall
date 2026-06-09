import React, {Component} from 'react';
import {Path} from 'react-native-svg';
import {StyleSheet, Text, View} from 'react-native';
import * as shape from 'd3-shape';
import {AreaChart, YAxis} from 'react-native-svg-charts';

const SENSOR_PROFILE = {
  standard: {
    fore: sensor => (sensor[0] + sensor[1] + sensor[2]) / 3,
    mid: sensor => sensor[3],
    heel: sensor => sensor[4],
  },
  eight: {
    fore: sensor =>
      (sensor[0] + sensor[1] + sensor[2] + sensor[3] + sensor[4]) / 5,
    mid: sensor => (sensor[5] + sensor[6]) / 2,
    heel: sensor => sensor[7],
  },
};

const editArray = arr => {
  let found = false;

  while (!found) {
    let count = 0;

    for (let i = 0; i < arr.length; i++) {
      for (let j = i; j < arr.length; j++) {
        if (arr[i] === arr[j] && i !== j) {
          arr[i] += 1;
          count++;
        }
      }
    }

    if (count === 0) {
      found = true;
    }
  }

  return arr;
};

const getWeight = (sensor, sensorProfile) => {
  const profile = SENSOR_PROFILE[sensorProfile] || SENSOR_PROFILE.standard;
  const fWeight = profile.fore(sensor);
  const mWeight = profile.mid(sensor);
  const hWeight = profile.heel(sensor);
  const sumWeight = (fWeight + mWeight + hWeight) / 3;

  return editArray([fWeight, mWeight, hWeight, sumWeight]);
};

const LineFore = ({line}) => (
  <Path
    key={'line'}
    d={line}
    stroke={'rgb(0, 143, 251)'}
    fill={'none'}
    strokeWidth={2}
  />
);

const LineMid = ({line}) => (
  <Path
    key={'line'}
    d={line}
    stroke={'rgb(0, 227, 150)'}
    fill={'none'}
    strokeWidth={2}
  />
);

const LineHeel = ({line}) => (
  <Path
    key={'line'}
    d={line}
    stroke={'rgb(254, 176, 25)'}
    fill={'none'}
    strokeWidth={2}
  />
);

const LineEntire = ({line}) => (
  <Path
    key={'line'}
    d={line}
    stroke={'rgb(255, 69, 96)'}
    fill={'none'}
    strokeWidth={2}
  />
);

const CHART_AREAS = [
  {
    stateKey: 'Fore',
    fill: 'rgba(0, 143, 251, 0.2)',
    line: LineFore,
  },
  {
    stateKey: 'Mid',
    fill: 'rgba(0, 227, 150, 0.2)',
    line: LineMid,
  },
  {
    stateKey: 'Heel',
    fill: 'rgba(254, 176, 25, 0.2)',
    line: LineHeel,
  },
  {
    stateKey: 'Entire',
    fill: 'rgba(255, 69, 96, 0.2)',
    line: LineEntire,
  },
];

class GailPressureChart extends Component {
  constructor() {
    super();

    this.state = {
      LareaFore: [],
      LareaMid: [],
      LareaHeel: [],
      LareaEntire: [],
      RareaFore: [],
      RareaMid: [],
      RareaHeel: [],
      RareaEntire: [],
    };
  }

  static getDerivedStateFromProps(props, state) {
    const lWeight = getWeight(props.lsensor, props.sensorProfile);
    const rWeight = getWeight(props.rsensor, props.sensorProfile);

    const LareaFore = [...state.LareaFore];
    const LareaEntire = [...state.LareaEntire];
    const LareaHeel = [...state.LareaHeel];
    const LareaMid = [...state.LareaMid];

    const RareaFore = [...state.RareaFore];
    const RareaEntire = [...state.RareaEntire];
    const RareaHeel = [...state.RareaHeel];
    const RareaMid = [...state.RareaMid];

    LareaFore.push(lWeight[0]);
    LareaMid.push(lWeight[1]);
    LareaHeel.push(lWeight[2]);
    LareaEntire.push(lWeight[3]);

    RareaFore.push(rWeight[0]);
    RareaMid.push(rWeight[1]);
    RareaHeel.push(rWeight[2]);
    RareaEntire.push(rWeight[3]);

    if (LareaFore.length > 10) {
      LareaFore.shift();
      LareaMid.shift();
      LareaHeel.shift();
      LareaEntire.shift();
      RareaFore.shift();
      RareaMid.shift();
      RareaHeel.shift();
      RareaEntire.shift();
    }

    return {
      LareaFore,
      LareaMid,
      LareaHeel,
      LareaEntire,
      RareaFore,
      RareaMid,
      RareaHeel,
      RareaEntire,
    };
  }

  renderAreaChart(prefix, area, index) {
    const LineComponent = area.line;
    const style =
      index === 0
        ? {flex: 1, marginLeft: 10}
        : {...StyleSheet.absoluteFill, marginLeft: 47};

    return (
      <AreaChart
        key={area.stateKey}
        style={style}
        data={this.state[`${prefix}area${area.stateKey}`]}
        yMax={800}
        yMin={0}
        svg={{fill: area.fill}}
        contentInset={{top: 10, bottom: 0}}
        curve={shape.curveNatural}>
        <LineComponent />
      </AreaChart>
    );
  }

  renderFootChart(label, prefix) {
    return (
      <View>
        <Text
          style={{
            marginLeft: 10,
            marginTop: 10,
            color: this.props.footTextColor,
          }}>
          {' '}
          {label}{' '}
        </Text>
        <View style={{height: 200, flexDirection: 'row', margin: 20}}>
          <YAxis
            contentInset={{top: 10, bottom: 10}}
            style={{padding: 10}}
            data={[0, 100, 200, 300, 400, 500, 600, 700]}
            svg={{
              fill: 'grey',
              fontSize: 10,
              padding: 20,
            }}
            numberOfTicks={5}
            formatLabel={value => `${value}`}
          />
          {CHART_AREAS.map((area, index) =>
            this.renderAreaChart(prefix, area, index),
          )}
        </View>
      </View>
    );
  }

  renderLegend() {
    const {
      foreFootText = 'Fore foot',
      midFootText = 'Mid foot',
      heelText = 'Heel',
      entireFootText = 'Entire Foot',
    } = this.props;
    const legendItems = [
      {color: 'rgb(0, 143, 251)', text: foreFootText},
      {color: 'rgb(0, 227, 150)', text: midFootText},
      {color: 'rgb(254, 176, 25)', text: heelText},
      {color: 'rgb(255, 69, 96)', text: entireFootText},
    ];

    return (
      <View style={{alignItems: 'center'}}>
        <Text style={{fontSize: 10}}>
          {legendItems.map((item, index) => (
            <Text key={item.color} style={{color: item.color}}>
              {index > 0 ? '    ' : ''}
              {'\u25cf '}
              {item.text}
            </Text>
          ))}
        </Text>
      </View>
    );
  }

  render() {
    const {leftSideText = 'Left Foot', rightSideText = 'Right Foot'} =
      this.props;

    return (
      <View>
        {this.renderFootChart(leftSideText, 'L')}
        {this.renderLegend()}
        {this.renderFootChart(rightSideText, 'R')}
        {this.renderLegend()}
      </View>
    );
  }
}

export class StandardGailPressureChart extends Component {
  render() {
    return <GailPressureChart {...this.props} sensorProfile="standard" />;
  }
}

export class EightSensorGailPressureChart extends Component {
  render() {
    return <GailPressureChart {...this.props} sensorProfile="eight" />;
  }
}

export default GailPressureChart;
