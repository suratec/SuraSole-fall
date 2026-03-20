//5.11.62

import React, {Component} from 'react';
import {View, ScrollView, ActivityIndicator} from 'react-native';
import {connect} from 'react-redux';
import NetInfo from '@react-native-community/netinfo';
import {writeFile} from 'react-native-fs';
import XLSX from 'xlsx';

import HeaderFix from '../../common/HeaderFix';
import CardsTagging from './cards_tagging';
import CardsResult from './cards_result';
import CardsSpecified from './cards_overspecified';
import ButtonFix from '../../common/ButtonFix';
import Toast from 'react-native-simple-toast';
import moment from 'moment';

import API from '../../../config/Api';
import {result} from 'lodash';

var RNFS = require('react-native-fs');

class index extends Component {
  constructor() {
    super();
    this.state = {
      dataResult: [
        {nameZone: 'Toe', valueWalk: '- -', valueRun: '- -'},
        // { nameZone: 'Lesser Toe', valueWalk: '- -', valueRun: '- -' },
        {nameZone: 'Medial Metatarsal', valueWalk: '- -', valueRun: '- -'},
        {nameZone: 'Lateral Metatarsal', valueWalk: '- -', valueRun: '- -'},
        {nameZone: 'Medial Midfoot', valueWalk: '- -', valueRun: '- -'},
        {nameZone: 'Heel', valueWalk: '- -', valueRun: '- -'},
        // { nameZone: 'Medial Midfoot', valueWalk: '- -', valueRun: '- -' }
      ],
      dataSpecified: [{dateTime: '00:00:00', valueZone: '', valuePeak: '0'}],
      record: [],
      isConnected: null,
      spinner: false,
    };
    this.onPreLoad();
  }

  excelFile = async () => {
    await RNFS.readDir(RNFS.CachesDirectoryPath + '/suratechM/').then(res => {
      res.forEach(r => {
        RNFS.readFile(r.path)
          .then(text => {
            var excelData = JSON.parse(
              '[' + text.substring(0, text.length - 1) + ']',
            );
            var setJson = [];
            Object.keys(excelData).forEach(function (index) {
              let FL =
                (excelData[index].left.sensor[0] +
                  excelData[index].left.sensor[1] +
                  excelData[index].left.sensor[2] +
                  excelData[index].left.sensor[3] +
                  excelData[index].left.sensor[4]) /
                5;
              let FR =
                (excelData[index].right.sensor[0] +
                  excelData[index].right.sensor[1] +
                  excelData[index].right.sensor[2] +
                  excelData[index].right.sensor[3] +
                  excelData[index].right.sensor[4]) /
                5;
              let COP_X =
                excelData[index].left.sensor[0] +
                excelData[index].left.sensor[1] +
                excelData[index].left.sensor[2] +
                excelData[index].left.sensor[3] +
                excelData[index].left.sensor[4] +
                excelData[index].left.sensor[5] +
                excelData[index].left.sensor[6] +
                excelData[index].left.sensor[7] +
                -(
                  excelData[index].right.sensor[0] +
                  excelData[index].right.sensor[1] +
                  excelData[index].right.sensor[2] +
                  excelData[index].right.sensor[3] +
                  excelData[index].right.sensor[4] +
                  excelData[index].right.sensor[5] +
                  excelData[index].right.sensor[6] +
                  excelData[index].right.sensor[7]
                );
              let COP_Y =
                FL +
                FR -
                (excelData[index].right.sensor[7] +
                  excelData[index].left.sensor[7]);
              data = {
                Timestamp: moment(excelData[index].stamp).format(
                  'MMMM Do YYYY, h:mm:ss:ms a',
                ),
                Left_1: excelData[index].left.sensor[0],
                Left_2: excelData[index].left.sensor[1],
                Left_3: excelData[index].left.sensor[2],
                Left_4: excelData[index].left.sensor[3],
                Left_5: excelData[index].left.sensor[4],
                Left_6: excelData[index].left.sensor[5],
                Left_7: excelData[index].left.sensor[6],
                Left_8: excelData[index].left.sensor[7],
                Right_1: excelData[index].right.sensor[0],
                Right_2: excelData[index].right.sensor[1],
                Right_3: excelData[index].right.sensor[2],
                Right_4: excelData[index].right.sensor[3],
                Right_5: excelData[index].right.sensor[4],
                Right_6: excelData[index].right.sensor[5],
                Right_7: excelData[index].right.sensor[6],
                Right_8: excelData[index].right.sensor[7],
                FL: FL,
                LX:
                  excelData[index].left.sensor[2] -
                  excelData[index].left.sensor[4],
                LY: FL - excelData[index].left.sensor[7],
                FR: FR,
                RX:
                  excelData[index].right.sensor[2] -
                  excelData[index].right.sensor[4],
                RY: FR - excelData[index].right.sensor[7],
                COP_X: COP_X,
                COP_Y: COP_Y,
              };
              setJson.push(data);
            });

            ws = XLSX.utils.json_to_sheet(setJson);
            ws = XLSX.utils.json_to_sheet(setJson);

            wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Data Record');

            wbout = XLSX.write(wb, {type: 'binary', bookType: 'xlsx'});
            file =
              RNFS.ExternalCachesDirectoryPath + '/' + Date.now() + '.xlsx';
            writeFile(file, wbout, 'ascii')
              .then(r => {
                /* :) */
              })
              .catch(e => {
                /* :( */
              });
          })
          .catch(e => {});
      });
    });
    Toast.show('Excel Download File Success');
  };

  onPreLoad() {
    RNFS.readDir(RNFS.CachesDirectoryPath + '/suratechM/').then(res => {
      res.forEach(r => {
        RNFS.readFile(r.path)
          .then(text => {
            let data = JSON.parse(
              '[' + text.substring(0, text.length - 1) + ']',
            );
            var content = {
              data: data,
              id_customer: data[0].id_customer,
              id_device: '',
              type: 1, // for medical
            };
            console.log(content);
            fetch(`${API}/addjson`, {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(content),
            })
              .then(resp => resp.json())
              .then(resp => {
                if (resp.status != 'ผิดพลาด') {
                  RNFS.unlink(r.path);
                }
              });
          })
          .catch(e => {});
      });
    });
  }

  actionUpdate = () => {
    alert('Update !');
  };

  findMaxIndex(data) {
    let index = 0;
    let max = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] > max) {
        max = data[i];
        index = i;
      }
    }
    return index;
  }

  toKilo = value => {
    return (5.6 * 10 ** -4 * Math.exp(value / 53.36) + 6.72) / 0.796;
  };

  findPeak(data) {
    let max = 0;
    let index = 0;
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        if (data[i][j] > max) {
          max = data[i][j];
          index = j;
        }
      }
    }
    max = this.toKilo(max);
    if (max.toFixed(2) <= 8.44) {
      max = 0;
    }
    return {max: max.toFixed(2), index};
  }

  findDataResult = data => {
    let max = [0, 0, 0, 0, 0];
    let value = [0, 0, 0, 0, 0];
    let a = 2.206;
    let b = 0.0068;
    let all = 0;
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].left.length; j++) {
        for (let k = 0; k < data[i].left[j].length; k++) {
          if (data[i].left[j][k] > max[k]) {
            max[k] = data[i].left[j][k];
          }
          if (data[i].right[j][k] > max[k]) {
            max[k] = data[i].right[j][k];
          }
          value[k] += data[i].left[j][k] + data[i].right[j][k];
        }
      }
      all += data[i].left.length;
    }
    all === 0 ? (all = 1) : (all = all * 2);
    value[0] = a * Math.exp(b * (value[0] / all));
    value[1] = a * Math.exp(b * (value[1] / all));
    value[2] = a * Math.exp(b * (value[2] / all));
    value[3] = a * Math.exp(b * (value[3] / all));
    value[4] = a * Math.exp(b * (value[4] / all));
    max[0] = a * Math.exp(b * max[0]);
    max[1] = a * Math.exp(b * max[1]);
    max[2] = a * Math.exp(b * max[2]);
    max[3] = a * Math.exp(b * max[3]);
    max[4] = a * Math.exp(b * max[4]);
    return {
      value: [
        value[0].toFixed(2),
        value[1].toFixed(2),
        value[2].toFixed(2),
        value[3].toFixed(2),
        value[4].toFixed(2),
      ],
      max: [
        max[0].toFixed(2),
        max[1].toFixed(2),
        max[2].toFixed(2),
        max[3].toFixed(2),
        max[4].toFixed(2),
      ],
    };
  };

  componentDidMount = () => {
    NetInfo.addEventListener(this.handleConnectivityChange);

    fetch(`${API}/record`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        customer: this.props.user.id_customer,
      }),
    })
      .then(res => {
        console.log('============API Response============');
        return console.log(res), res.json();
      })
      .then(res => {
        let dataSpecified = [];
        res.forEach(e => {
          let date = new Date(e.action.replace(' ', 'T'));
          console.log(date);
          let {max, index} = this.findPeak([...e.left, ...e.right]);
          dataSpecified.push({
            dateTime: `${date.getHours().toString().slice(-2)}:${date
              .getMinutes()
              .toString()
              .slice(-2)}:${date.getSeconds().toString().slice(-2)}`,
            valueZone: index,
            valuePeak: max,
          });
        });
        let result = this.findDataResult(res);
        let dataResult = [
          {
            nameZone: 'Toe',
            valueWalk: result.value[0],
            valueRun: result.max[0],
          },
          // { nameZone: 'Lesser Toe', valueWalk: '- -', valueRun: '- -' },
          {
            nameZone: 'Medial Metatarsal',
            valueWalk: result.value[1],
            valueRun: result.max[1],
          },
          {
            nameZone: 'Lateral Metatarsal',
            valueWalk: result.value[2],
            valueRun: result.max[2],
          },
          {
            nameZone: 'Medial Midfoot',
            valueWalk: result.value[3],
            valueRun: result.max[3],
          },
          {
            nameZone: 'Heel',
            valueWalk: result.value[4],
            valueRun: result.max[4],
          },
          // { nameZone: 'Medial Midfoot', valueWalk: '- -', valueRun: '- -' }
        ];
        this.setState({record: res, dataSpecified, dataResult});
      })
      .catch(err => {
        console.log(err);
      });
  };

  handleConnectivityChange = async status => {
    console.log(status.isConnected);
    await this.setState({isConnected: status.isConnected});
    console.log(`Internet Connection : ${this.state.isConnected}`);
    Toast.show(
      this.state.isConnected
        ? 'Internet Connection : ON'
        : 'Internet Connection: OFF',
    );
  };

  render() {
    return (
      <View style={{flex: 1, backgroundColor: 'white'}}>
        <HeaderFix
          icon_left={'left'}
          onpress_left={() => {
            this.props.navigation.goBack();
          }}
          title={this.props.route.params?.['name'] ?? 'DashBoard'}
        />

        <View style={{flex: 1, paddingTop: 8}}>
          <ScrollView>
            <CardsResult
              header={['Zone', 'Avg', 'Max']}
              data={this.state.dataResult}
            />
            {/*<CardsSpecified header={["Date Time", "Zone", "Peak Pressure"]} data={this.state.dataSpecified} />*/}
            <CardsTagging
              data={this.state.record}
              dataSpecified={this.state.dataSpecified}
            />
            <View style={{height: 10}} />
            {/* <ButtonFix rounded={true} title={'Share'} onPress={() => this.actionUpdate()}/> */}
            <View style={{alignItems: 'center'}}>
              {this.state.isConnected ? null : (
                <ButtonFix
                  rounded={true}
                  title={'Export offline data'}
                  onPress={() => this.excelFile()}
                />
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.user,
    data: state.data,
  };
};

export default connect(mapStateToProps)(index);
