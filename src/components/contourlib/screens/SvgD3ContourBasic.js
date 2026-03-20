import React, { Component } from 'react';
import { View, Dimensions, Button, ScrollView, Image, Text } from 'react-native';
import * as Svg from 'react-native-svg'
import * as d3Scale from 'd3-scale';
import * as d3Array from 'd3-array';
import * as d3ScaleChromatic from 'd3-scale-chromatic';

import Contour from '../components/AnimatedSvgD3Contour';
import { Col, Grid } from '../../common/NativeBaseShim';
// import contourData from '../data/contourData';
// import { BleManager } from 'react-native-ble-plx';

getColor = (t) => {
  t = Math.max(0, Math.min(1, t));
  return "rgb("
    + Math.max(0, Math.min(255, Math.round(34.61 + t * (1172.33 - t * (10793.56 - t * (33300.12 - t * (38394.49 - t * 14825.05))))))) + ", "
    + Math.max(0, Math.min(255, Math.round(23.31 + t * (557.33 + t * (1225.33 - t * (3574.96 - t * (1073.77 + t * 707.56))))))) + ", "
    + Math.max(0, Math.min(255, Math.round(27.2 + t * (3211.1 - t * (15327.97 - t * (27814 - t * (22569.18 - t * 6838.66)))))))
    + ")";
}

const contourWidth = 8; // แนวนอน
const contourHeight = 24; // แนวตั้ง
const thresholdMin = 0;
const thresholdMax = 10;

const width = Dimensions.get('screen').width * 0.30
const height = Dimensions.get('screen').width * 0.90
const thresholds = d3Array.range(0, 600, 50)
const color = d3Scale.scaleSequential(getColor).domain(d3Array.extent(thresholds))
const size = [contourWidth, contourHeight]
const scale = width / 8;

export default class SvgContourBasic extends Component {

  render() {
    return (
      <View style={{ margin: 8, flex: 1}}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View width={width} height={height} style={{}}>
            <Svg.Svg width={width} height={height} style={{}}>
              <Contour
                values={this.props.leftsensor}
                extent={[[1, 1], [width, height]]}
                size={size}
                contourProps={contour => ({
                  fill: color(contour.value)
                })}
                scale={scale}
              />

              <Svg.Image width={width} height={width * 3} href={require('../../../assets/image/foot/foot_left1.png')} />

            </Svg.Svg>
          </View>
          <View width={width} height={height} style={{}}>
            <Svg.Svg width={width} height={height} style={{}}>
              <Contour
                values={this.props.rightsensor}
                extent={[[1, 1], [width, height]]}
                size={size}
                contourProps={contour => ({
                  fill: color(contour.value)
                })}
                scale={scale}
              />
              <Svg.Image width={width} height={width * 3} href={require('../../../assets/image/foot/foot_right1.png')} />
            </Svg.Svg>
          </View>
        </View>
        <View>


          {/* 
          <Grid style={{}}>
            <Col>

              <Svg.Svg width={width} height={height}>
                <Contour
                  values={this.state.dataLeft}
                  extent={[[1, 1], [width - 1, height - 6]]}
                  size={size}
                  contourProps={contour => ({
                    fill: color(contour.value)
                  })}
                  scale={scale}
                />

                <Svg.Image preserveAspectRatio="xMidYMin slice" width={width / 1.5} height={width} href={require('../../../assets/image/foot/leftfix.png')} />

              </Svg.Svg>






            </Col>
            <Col>

              <Svg.Svg width={width} height={height}>
                <Contour
                  values={this.state.dataRight}
                  extent={[[1, 1], [width - 1, height - 6]]}
                  size={size}
                  contourProps={contour => ({
                    fill: color(contour.value)
                  })}
                  scale={scale}
                />

                <Svg.Image preserveAspectRatio="xMidYMin slice" width={width / 1.4} height={width} href={require('../../../assets/image/foot/rightfix.png')} />


              </Svg.Svg>


            </Col>
          </Grid> */}




        </View>
      </View>
    );
  }
}