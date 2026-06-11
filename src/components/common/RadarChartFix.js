import Svg, {Circle, G, Line} from 'react-native-svg';
import React from 'react';

const chartSize = 300;
const numberOfScales = 4;
const clampPoint = value => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return chartSize / 2;
  return Math.min(chartSize - 10, Math.max(10, numeric));
};
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
    const nextPoint = [clampPoint(props.xPos), clampPoint(props.yPos)];
    const lastPoint = state.history[state.history.length - 1];
    const shouldAddPoint =
      !lastPoint ||
      Math.abs(lastPoint[0] - nextPoint[0]) >= 0.5 ||
      Math.abs(lastPoint[1] - nextPoint[1]) >= 0.5;
    const history = shouldAddPoint
      ? [...state.history, nextPoint].slice(-10)
      : state.history;
    const historyLine = history.map((point, i) => historyDot(point[0], point[1], i));

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
    const scales = [];
    const groups = [];
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
          cx={clampPoint(this.props.xPos)}
          cy={clampPoint(this.props.yPos)}
          r="10"
          stroke="green"
          strokeWidth="0.8"
          fill="red"
        />
      </Svg>
    );
  }
}
