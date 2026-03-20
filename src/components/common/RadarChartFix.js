import Svg, {Circle, G, Line} from 'react-native-svg';
import React from 'react';

const chartSize = 300;
const numberOfScales = 4;
const historyDot = (x, y, i) => (
  <Circle
    key={`scale-${x}${y}${i}`}
    cx={x}
    cy={y}
    r={3}
    fill="#FFFFFF"
    stroke="#999"
    strokeWidth="0.8"
  />
);

export default class RadarChart extends React.Component {
  state = {
    history: [],
    historyLine: [],
    groups: [],
    scale: [],
    middleOfChart: (chartSize / 2).toFixed(4),
  };
  // componentWillReceiveProps() {
  //   let history = this.state.history;
  //   let historyLine = [];
  //   if(history.length > 20){
  //     history.shift();
  //   }
  //   history.push([this.props.xPos, this.props.yPos]);
  //   this.setState({history});
  //   for(i = 0; i < history.length; i++){
  //     historyLine.push(this.historyDot(history[i][0], history[i][1], i));
  //   }
  //   this.setState({historyLine: [<G>{historyLine}</G>]});
  // }
  static getDerivedStateFromProps(props, state) {
    let history = state.history;
    let historyLine = [];
    if (history.length > 10) {
      history.shift();
    }
    history.push([props.xPos, props.yPos]);
    for (i = 0; i < history.length; i++) {
      historyLine.push(historyDot(history[i][0], history[i][1], i));
    }
    return {
      historyLine: [<G key="history-group">{historyLine}</G>],
      history,
    };
  }
  componentDidMount() {
    this.preRender();
  }
  scale = value => (
    <Circle
      key={`scale-${value}`}
      cx={0}
      cy={0}
      r={((value / numberOfScales) * chartSize) / 2}
      fill="#FFFFFF"
      stroke="#999"
      strokeWidth="0.8"
    />
  );
  scaleDotted = value => (
    <Circle
      key={`scale-${value}`}
      cx={0}
      cy={0}
      r={((value / numberOfScales) * chartSize) / 2}
      fill="#FFFFFF"
      stroke="#999"
      strokeWidth="0.8"
      strokeDasharray={[5, 5]}
    />
  );
  // historyDot = (x, y, i) => (
  //   <Circle
  //     key={`scale-${x}${y}${i}`}
  //     cx={x}
  //     cy={y}
  //     r={3}
  //     fill="#FFFFFF"
  //     stroke="#999"
  //     strokeWidth="0.8"
  //   />
  // );
  preRender() {
    scales = [];
    groups = [];
    for (let i = numberOfScales; i > 0; i--) {
      i % 2 == 0
        ? scales.push(this.scale(i))
        : scales.push(this.scaleDotted(i));
    }
    groups.push(<G key={`scales`}>{scales}</G>);
    this.setState({scales, groups});
  }
  render() {
    return (
      <Svg
        width={chartSize}
        height={chartSize}
        viewBox={`0 0 ${chartSize} ${chartSize}`}>
        <G
          transform={`translate(${this.state.middleOfChart}, ${this.state.middleOfChart})`}>
          {this.state.groups}
        </G>
        <G>{this.state.historyLine}</G>
        <Line
          x1="0"
          y1="150"
          x2="300"
          y2="150"
          fill="#FFFFFF"
          stroke="#999"
          strokeWidth="0.8"
        />
        <Line
          x1="150"
          y1="0"
          x2="150"
          y2="300"
          fill="#FFFFFF"
          stroke="#999"
          strokeWidth="0.8"
        />
        <Circle
          cx={this.props.xPos}
          cy={this.props.yPos}
          r="10"
          stroke="green"
          stroke-width="0.8"
          fill="red"
        />
      </Svg>
    );
  }
}
