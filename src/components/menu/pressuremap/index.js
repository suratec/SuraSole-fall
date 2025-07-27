import React, { Component } from 'react';
import {
  View,
  Image,
  Dimensions,
  NativeModules,
  NativeEventEmitter,
  Platform,
  Vibration,
  Alert,
  ScrollView,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Col, Grid } from 'react-native-easy-grid';
import { connect } from 'react-redux';

import HeaderFix from '../../common/HeaderFix';
import Text from '../../common/TextFix';
import ButtonFix from '../../common/ButtonFix';
import SvgContourBasic from '../../contourlib/screens/SvgD3ContourBasic';
import API from '../../../config/Api';

import BleManager from 'react-native-ble-manager';

import Lang from '../../../assets/language/menu/lang_record';
import LangHome from '../../../assets/language/screen/lang_home';
import Lang_pressuremap from "../../../assets/language/menu/lang_pressuremap";
import { getLocalizedText } from '../../../assets/language/langUtils';

var RNFS = require('react-native-fs');

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const TIMER = 100;
const TIMER_BIG = 1;
const Duration = 500;

const left_x = [
  3, 7, 3, 3, 5, 7, 5, 7, 3, 5, 7, 5, 7, 5, 7, 7, 3, 5, 7, 5, 7, 3, 5, 7,
];
const axis_y = [
  3, 3, 5, 7, 7, 7, 11, 11, 13, 13, 13, 15, 15, 17, 17, 19, 21, 21, 21, 23, 23,
  24, 24, 24,
];
const right_x = [
  1.5, 5.5, 5.5, 1.5, 3.5, 5.5, 1.5, 3.5, 1.5, 3.5, 5.5, 1.5, 3.5, 1.5, 3.5,
  1.5, 1.5, 3.5, 5.5, 1.5, 3.5, 1.5, 3.5, 5.5,
];

const n = 8,
  m = 24;

class index extends React.PureComponent {
  leftSwingTime = 0;
  rightSwingTime = 0;
  leftStanceTime = 0;
  rightStanceTime = 0;
  durationTime = 0;
  fileTime = 0;
  leftPhase = 0;
  rightPhase = 0;
  duration = 0;
  fileStamp_n = '';

  readDelay = new Date();
  start = new Date();
  lastLtime = new Date();
  lastRtime = new Date();

  lsensor = [0, 0, 0, 0, 0];
  rsensor = [0, 0, 0, 0, 0];

  round = 0;

  ltime = new Date();
  rtime = new Date();

  state = {
    switch: false,
    textAction: getLocalizedText(this.props.lang, Lang_pressuremap.recordButton),
    ps_x: 0,
    ps_y: 0,
    loading: false,
    leftsensor: [0, 0, 0, 0, 0],
    rightsensor: [0, 0, 0, 0, 0],
    lstage: 0,
    rstage: 0,
    shouldVibrate: false,
    leftData: [],
    rightData: [],
    isConnected: true,
    peripherals: new Map(),
    notiAlarm: 0,
  };

  calMeasurePressure = value => {
    return 2.206 * Math.exp(0.0068 * value);
  };

  measurePressure = sensor => {
    for (let i = 0; i < sensor.length; i++) {
      if (this.calMeasurePressure(sensor[i]) > this.state.notiAlarm) {
        Vibration.vibrate(100);
        return;
      }
    }
  };

  toDecimalArray(byteArray) {
    let dec = [];
    for (let i = 0; i < byteArray.length - 1; i += 2) {
      dec.push(byteArray[i] * 255 + byteArray[i + 1]);
    }
    return dec;
  }

  updateState(stage, value, side) {
    if (side === 'LEFT') {
      this.setState({ lstage: stage, leftsensor: this.toDecimalArray(value) });
    } else if (side === 'RIGHT') {
      this.setState({ rstage: stage, rightsensor: this.toDecimalArray(value) });
    }
  }
  findLeftContourArray(lsensor) {
    const dataleft = [
      1,
      lsensor[0],
      0,
      lsensor[1],
      0,
      lsensor[2],
      0,
      0,
      lsensor[3],
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      lsensor[4],
      0,
      0,
      0,
      0,
      0,
      0,
    ];
    var variogram = kriging.train(
      dataleft,
      left_x,
      axis_y,
      'exponential',
      0,
      100,
    );
    var lvalues = new Array(8 * 24);
    for (let j = 0.5, k = 0; j < m; ++j) {
      for (let i = 0.5; i < n; ++i, ++k) {
        lvalues[k] = kriging.predict(i, j, variogram);
        lvalues[k] = lvalues[k] > 0 ? lvalues[k] : 0;
      }
    }
    return lvalues;
  }

  findRightContourArray(rsensor) {
    const dataright = [
      rsensor[0],
      0,
      0,
      rsensor[1],
      0,
      rsensor[2],
      0,
      0,
      0,
      0,
      rsensor[3],
      0,
      0,
      0,
      0,
      0,
      0,
      rsensor[4],
      0,
      0,
      0,
      0,
      0,
      1,
    ];
    var variogram = kriging.train(
      dataright,
      right_x,
      axis_y,
      'exponential',
      0,
      100,
    );
    var rvalues = new Array(8 * 24);
    for (let j = 0.5, k = 0; j < m; ++j) {
      for (let i = 0.5; i < n; ++i, ++k) {
        rvalues[k] = kriging.predict(i, j, variogram);
        rvalues[k] = rvalues[k] > 0 ? rvalues[k] : 0;
      }
    }
    return rvalues;
  }

  async startReading() {
    this.dataRecord = bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      ({ value, peripheral, characteristic, service }) => {
        let time = new Date();
        if (peripheral === this.props.leftDevice) {
          let leftsensor = this.toDecimalArray(value);
          this.recordData(leftsensor, 'L');
          if (time - this.ltime > 250) {
            let shouldVibrate = this.shouldBeVibration(leftsensor);
            let leftData = this.findLeftContourArray(leftsensor);
            this.leftPhase = leftsensor.reduce((a, b) => a + b, 0);
            this.setState({ leftsensor, shouldVibrate, leftData });
            this.ltime = time;
          }
        }
        if (peripheral === this.props.rightDevice) {
          let rightsensor = this.toDecimalArray(value);
          this.recordData(rightsensor, 'R');
          if (time - this.rtime > 250) {
            let shouldVibrate = this.shouldBeVibration(rightsensor);
            let rightData = this.findRightContourArray(rightsensor);
            this.rightPhase = rightsensor.reduce((a, b) => a + b, 0);
            this.setState({ rightsensor, shouldVibrate, rightData });
            this.rtime = time;
          }
        }
      },
    );
  }

  recordData(data, sensor) {
    if (sensor == 'L') {
      this.lsensor = data;
    } else {
      this.rsensor = data;
    }

    if (this.props.noti === true) {
      this.measurePressure(data);
    }
  }

  toKilo = value => {
    return (5.6 * 10 ** -4 * Math.exp(value / 53.36) + 6.72) / 0.796;
  };

  shouldBeVibration = sensor => {
    for (let i = 0; i < sensor.length; i++) {
      if (this.toKilo(sensor[i]) > this.props.user.weight * 0.2) {
        return true;
      }
    }
    return false;
  };

  handleConnectivityChange = status => {
    this.setState({ isConnected: status.isConnected });
    console.log(`Wifi Status : ${this.state.isConnected}`);
  };

  actionConnectDevice(peripheral) {
    if (peripheral) {
      if (peripheral.connected) {
        BleManager.disconnect(peripheral.id);
      } else {
        BleManager.connect(peripheral.id)
          .then(() => {
            let peripherals = this.state.peripherals;
            let p = peripherals.get(peripheral.id);
            if (p) {
              p.connected = true;
              peripherals.set(peripheral.id, p);
              this.setState({ peripherals });
            }
            if (peripheral.name[peripheral.name.length - 1] === 'L') {
              this.props.addLeftDevice(peripheral.id);
            } else if (peripheral.name[peripheral.name.length - 1] === 'R') {
              this.props.addRightDevice(peripheral.id);
            }
            console.log('Connected to ' + peripheral.id);

            setTimeout(() => {
              BleManager.retrieveServices(peripheral.id).then(
                peripheralInfo => {
                  console.log(peripheralInfo);

                  var service;
                  var bakeCharacteristic;
                  var crustCharacteristic;
                  if (Platform.OS === 'android') {
                    service = '0000FFE0-0000-1000-8000-00805F9B34FB';
                    bakeCharacteristic = '0000FFE1-0000-1000-8000-00805F9B34FB';
                    crustCharacteristic =
                      '0000FFE1-0000-1000-8000-00805F9B34FB';
                  } else {
                    service = 'FFE0';
                    bakeCharacteristic = 'FFE1';
                    crustCharacteristic = 'FFE1';
                  }
                },
              );
            }, 900);
          })
          .catch(error => {
            console.log('Connection error', error);
          });
      }
    }
  }

  retrieveConnected() {
    BleManager.getConnectedPeripherals([]).then(results => {
      if (results.length == 0) {
        console.log('No connected peripherals');
      }
      console.log(results);
      var peripherals = this.state.peripherals;
      for (var i = 0; i < results.length; i++) {
        var peripheral = results[i];
        this.actionConnectDevice(peripheral);
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        this.setState({ peripherals });
      }
    });
  }

  componentDidMount = async () => {
    leftData = this.findLeftContourArray(this.state.leftsensor);
    rightData = this.findRightContourArray(this.state.rightsensor);

    // checkInternet
    NetInfo.addEventListener(this.handleConnectivityChange);

    // checkButtonRecord
    if (typeof this.props.record !== 'undefined') {
      if (this.props.record === 'Stop') {
        this.actionRecording();
      }
    } else {
      this.props.actionRecordingButton('Record');
      this.setState({ textAction: 'Record' });
    }

    // notiAlarm
    let noti = await AsyncStorage.getItem('notiSetting');
    noti !== null ? this.setState({ notiAlarm: parseInt(noti) }) : 100;

    this.retrieveConnected();
    this.startReading();
    this.setState({ leftData, rightData });
  };

  componentWillUnmount = () => {
    console.log('============ componentWillUnmount ==============');
    clearInterval(this.readInterval);
    if (this.dataRecord) {
      this.dataRecord.remove();
    }
  };

  actionRecording = () => {
    if (
      typeof this.props.rightDevice === 'undefined' &&
      typeof this.props.leftDevice === 'undefined'
    ) {
      Alert.alert(getLocalizedText(this.props.lang, Lang_pressuremap.warning), getLocalizedText(this.props.lang, Lang_pressuremap.bluetoothAlert), [
        {
          text: 'OK',
          onPress: () => {
            this.props.navigation.navigate('Device', {
              name: getLocalizedText(this.state.lang, LangHome.addDeviceButton),
            });
          },
        },
      ]);
      return;
    }
    if (this.state.textAction == 'Record') {
      this.setState({ textAction: 'Stop' });
      this.props.actionRecordingButton('Stop');
      let initTime = new Date();
      this.start = initTime;
      this.lastLtime = initTime;
      this.lastRtime = initTime;
      this.readInterval = setInterval(async () => {
        time = new Date();
        data = {
          stamp: time.getTime(),
          timestamp: time,
          duration: Math.floor((time - this.start) / 1000),
          left: {
            sensor: this.lsensor,
            swing: this.leftSwingTime,
            stance: this.leftStanceTime,
          },
          right: {
            sensor: this.rsensor,
            swing: this.rightSwingTime,
            stance: this.rightStanceTime,
          },
          id_customer: this.props.user.id_customer,
        };
        try {
          // var file = await RNFS.stat(
          //   RNFS.CachesDirectoryPath +
          //     '/suratechM/' +
          //     this.start.getFullYear() +
          //     (this.start.getMonth() + 1) +
          //     this.start.getDate() +
          //     this.round,
          // );
          // if (file.size > 100000) {
          //   this.round += 1;
          // }
          await await RNFS.appendFile(
            RNFS.CachesDirectoryPath +
            '/suratechM/' +
            this.start.getFullYear() +
            this.start.getMonth() +
            this.start.getDate() +
            this.round,
            JSON.stringify(data) + ',',
          );
        } catch {
          await RNFS.mkdir(RNFS.CachesDirectoryPath + '/suratechM/');
          await RNFS.appendFile(
            RNFS.CachesDirectoryPath +
            '/suratechM/' +
            this.start.getFullYear() +
            this.start.getMonth() +
            this.start.getDate() +
            this.round,
            JSON.stringify(data) + ',',
          );
        }
      }, 100);
    } else {
      this.setState({ textAction: 'Record' });
      this.props.actionRecordingButton('Record');
      clearInterval(this.readInterval);
      this.sendDataToSetver();
    }
  };

  sendDataToSetver() {
    this.state.isConnected == false
      ? RNFS.readDir(RNFS.CachesDirectoryPath + '/suratechM/').then(res => {
        console.log('WiFi is not connect');
        res.forEach(r => {
          console.log(r.path);
        });
      })
      : RNFS.readDir(RNFS.CachesDirectoryPath + '/suratechM/').then(res => {
        res.forEach(r => {
          console.log(r.path);
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
                product_number: this.props.productNumber,
                bluetooth_left_id: this.props.leftDevice,
                bluetooth_right_id: this.props.rightDevice,
              };
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
                    console.log(`Clear : ${r.path}`);
                    RNFS.unlink(r.path);
                    

                    fetch(`${API}member/getUserDashboardStatic`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: this.props.user.id_customer,
                        // id: 'wef0cdb8296f90cc467fbf1d3645c57f9dp',
                      }),
                    })
                    .then(resp1 => {
                          console.log('============API Response============');
                          return  resp1.json();
                        })
                      .then(resp1 => {
                        
                        fetch(`${API}member/get_user_data`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            id: this.props.user.id_customer,
                            ...resp1
                            // id: 'wef0cdb8296f90cc467fbf1d3645c57f9dp',
                          }),
                        })
                          .then(res => {
                            console.log('============API Response============');
                            return console.log(res), res.json();
                          })
                          .then(res => {
                            console.log(res, 'responseFromAPU');

                          })
                          .catch(err => {
                            console.log(err);
                            this.setState({ isLoading: false });
                            Toast.show('Something went wrong. Please Try again!!!');
                          });
                      }

                      )
                      .catch(err => {
                        console.log(err);
                        this.setState({ isLoading: false });
                        Toast.show('Something went wrong. Please Try again!!!');
                      });
                  };

                }).catch(e => { });
            })
            .catch(e => { });
        });
      });
    alert(getLocalizedText(this.props.lang, Lang.alert));
  }

  actionDashboard = () => {
    this.props.navigation.navigate('Dashboard');
  };

  canVibration = (vibrate, master) => {
    if (vibrate && master) {
      Vibration.vibrate(500);
    } else {
      Vibration.cancel();
    }
  };

  render() {
    this.canVibration(this.state.shouldVibrate, this.state.switch);

    // Get screen dimensions
    const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');
    const isLandscape = screenWidth > screenHeight;

    // Calculate SVG container height dynamically
    const svgHeight = isLandscape
        ? screenHeight * 0.5  // Smaller height in landscape
        : screenWidth * 0.90 + 50;  // Original height in portrait

    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
          <HeaderFix
              icon_left={'left'}
              onpress_left={() => {
                this.props.navigation.goBack();
              }}
              title={this.props.navigation.getParam('name', '')}
          />

          <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'center',
                paddingHorizontal: 15,
                paddingVertical: 10,
              }}
              showsVerticalScrollIndicator={false}
          >
            {/* Dynamic height container for SVG */}
            <View style={{
              height: svgHeight,
              // alignSelf: 'center',
              justifyContent: 'center',
            }}>
              <SvgContourBasic
                  leftsensor={this.state.leftData}
                  rightsensor={this.state.rightData}
              />
            </View>

            <View style={{ padding: 15, alignItems: 'center' }}>
              <ButtonFix
                  action={true}
                  rounded={true}
                  title={getLocalizedText(this.props.lang, Lang_pressuremap.recordButton)}
                  onPress={() => this.actionRecording()}
              />
            </View>
          </ScrollView>
        </View>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.user,
    leftDevice: state.leftDevice,
    rightDevice: state.rightDevice,
    data: state.data,
    lang: state.lang,
    record: state.record,
    noti: state.noti,
    productNumber: state.productNumber,
  };
};

const mapDisPatchToProps = dispatch => {
  return {
    addLeftDevice: device => {
      return dispatch({ type: 'ADD_LEFT_DEVICE', payload: device });
    },
    addRightDevice: device => {
      return dispatch({ type: 'ADD_RIGHT_DEVICE', payload: device });
    },
    actionRecordingButton: data => {
      return dispatch({ type: 'ACTION_BUTTON_RECORD', payload: data });
    },
    addDashBoardData: data => {
      return dispatch({ type: 'ADD_BLUETOOTH_DATA', payload: data });
    },
    actionNotificationButton: data => {
      return dispatch({ type: 'ACTION_BUTTON_NOTIFICATION', payload: data });
    },
  };
};

export default connect(mapStateToProps, mapDisPatchToProps)(index);

//#region kriging
// Extend the Array class
Array.prototype.max = function () {
  return Math.max.apply(null, this);
};
Array.prototype.min = function () {
  return Math.min.apply(null, this);
};
Array.prototype.mean = function () {
  var i, sum;
  for (i = 0, sum = 0; i < this.length; i++) sum += this[i];
  return sum / this.length;
};
Array.prototype.rep = function (n) {
  return Array.apply(null, new Array(n)).map(Number.prototype.valueOf, this[0]);
};
Array.prototype.pip = function (x, y) {
  var i,
    j,
    c = false;
  for (i = 0, j = this.length - 1; i < this.length; j = i++) {
    if (
      this[i][1] > y != this[j][1] > y &&
      x <
      ((this[j][0] - this[i][0]) * (y - this[i][1])) /
      (this[j][1] - this[i][1]) +
      this[i][0]
    ) {
      c = !c;
    }
  }
  return c;
};

var kriging = (function () {
  var kriging = {};

  // Matrix algebra
  kriging_matrix_diag = function (c, n) {
    var i,
      Z = [0].rep(n * n);
    for (i = 0; i < n; i++) Z[i * n + i] = c;
    return Z;
  };
  kriging_matrix_transpose = function (X, n, m) {
    var i,
      j,
      Z = Array(m * n);
    for (i = 0; i < n; i++) for (j = 0; j < m; j++) Z[j * n + i] = X[i * m + j];
    return Z;
  };
  kriging_matrix_scale = function (X, c, n, m) {
    var i, j;
    for (i = 0; i < n; i++) for (j = 0; j < m; j++) X[i * m + j] *= c;
  };
  kriging_matrix_add = function (X, Y, n, m) {
    var i,
      j,
      Z = Array(n * m);
    for (i = 0; i < n; i++)
      for (j = 0; j < m; j++) Z[i * m + j] = X[i * m + j] + Y[i * m + j];
    return Z;
  };
  // Naive matrix multiplication
  kriging_matrix_multiply = function (X, Y, n, m, p) {
    var i,
      j,
      k,
      Z = Array(n * p);
    for (i = 0; i < n; i++) {
      for (j = 0; j < p; j++) {
        Z[i * p + j] = 0;
        for (k = 0; k < m; k++) Z[i * p + j] += X[i * m + k] * Y[k * p + j];
      }
    }
    return Z;
  };
  // Cholesky decomposition
  kriging_matrix_chol = function (X, n) {
    var i,
      j,
      k,
      sum,
      p = Array(n);
    for (i = 0; i < n; i++) p[i] = X[i * n + i];
    for (i = 0; i < n; i++) {
      for (j = 0; j < i; j++) p[i] -= X[i * n + j] * X[i * n + j];
      if (p[i] <= 0) return false;
      p[i] = Math.sqrt(p[i]);
      for (j = i + 1; j < n; j++) {
        for (k = 0; k < i; k++) X[j * n + i] -= X[j * n + k] * X[i * n + k];
        X[j * n + i] /= p[i];
      }
    }
    for (i = 0; i < n; i++) X[i * n + i] = p[i];
    return true;
  };
  // Inversion of cholesky decomposition
  kriging_matrix_chol2inv = function (X, n) {
    var i, j, k, sum;
    for (i = 0; i < n; i++) {
      X[i * n + i] = 1 / X[i * n + i];
      for (j = i + 1; j < n; j++) {
        sum = 0;
        for (k = i; k < j; k++) sum -= X[j * n + k] * X[k * n + i];
        X[j * n + i] = sum / X[j * n + j];
      }
    }
    for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) X[i * n + j] = 0;
    for (i = 0; i < n; i++) {
      X[i * n + i] *= X[i * n + i];
      for (k = i + 1; k < n; k++) X[i * n + i] += X[k * n + i] * X[k * n + i];
      for (j = i + 1; j < n; j++)
        for (k = j; k < n; k++) X[i * n + j] += X[k * n + i] * X[k * n + j];
    }
    for (i = 0; i < n; i++) for (j = 0; j < i; j++) X[i * n + j] = X[j * n + i];
  };
  // Inversion via gauss-jordan elimination
  kriging_matrix_solve = function (X, n) {
    var m = n;
    var b = Array(n * n);
    var indxc = Array(n);
    var indxr = Array(n);
    var ipiv = Array(n);
    var i, icol, irow, j, k, l, ll;
    var big, dum, pivinv, temp;

    for (i = 0; i < n; i++)
      for (j = 0; j < n; j++) {
        if (i == j) b[i * n + j] = 1;
        else b[i * n + j] = 0;
      }
    for (j = 0; j < n; j++) ipiv[j] = 0;
    for (i = 0; i < n; i++) {
      big = 0;
      for (j = 0; j < n; j++) {
        if (ipiv[j] != 1) {
          for (k = 0; k < n; k++) {
            if (ipiv[k] == 0) {
              if (Math.abs(X[j * n + k]) >= big) {
                big = Math.abs(X[j * n + k]);
                irow = j;
                icol = k;
              }
            }
          }
        }
      }
      ++ipiv[icol];

      if (irow != icol) {
        for (l = 0; l < n; l++) {
          temp = X[irow * n + l];
          X[irow * n + l] = X[icol * n + l];
          X[icol * n + l] = temp;
        }
        for (l = 0; l < m; l++) {
          temp = b[irow * n + l];
          b[irow * n + l] = b[icol * n + l];
          b[icol * n + l] = temp;
        }
      }
      indxr[i] = irow;
      indxc[i] = icol;

      if (X[icol * n + icol] == 0) return false; // Singular

      pivinv = 1 / X[icol * n + icol];
      X[icol * n + icol] = 1;
      for (l = 0; l < n; l++) X[icol * n + l] *= pivinv;
      for (l = 0; l < m; l++) b[icol * n + l] *= pivinv;

      for (ll = 0; ll < n; ll++) {
        if (ll != icol) {
          dum = X[ll * n + icol];
          X[ll * n + icol] = 0;
          for (l = 0; l < n; l++) X[ll * n + l] -= X[icol * n + l] * dum;
          for (l = 0; l < m; l++) b[ll * n + l] -= b[icol * n + l] * dum;
        }
      }
    }
    for (l = n - 1; l >= 0; l--)
      if (indxr[l] != indxc[l]) {
        for (k = 0; k < n; k++) {
          temp = X[k * n + indxr[l]];
          X[k * n + indxr[l]] = X[k * n + indxc[l]];
          X[k * n + indxc[l]] = temp;
        }
      }

    return true;
  };

  // Variogram models
  kriging_variogram_gaussian = function (h, nugget, range, sill, A) {
    return (
      nugget +
      ((sill - nugget) / range) *
      (1.0 - Math.exp(-(1.0 / A) * Math.pow(h / range, 2)))
    );
  };
  kriging_variogram_exponential = function (h, nugget, range, sill, A) {
    return (
      nugget +
      ((sill - nugget) / range) * (1.0 - Math.exp(-(1.0 / A) * (h / range)))
    );
  };
  kriging_variogram_spherical = function (h, nugget, range, sill, A) {
    if (h > range) return nugget + (sill - nugget) / range;
    return (
      nugget +
      ((sill - nugget) / range) *
      (1.5 * (h / range) - 0.5 * Math.pow(h / range, 3))
    );
  };

  // Train using gaussian processes with bayesian priors
  kriging.train = function (t, x, y, model, sigma2, alpha) {
    var variogram = {
      t: t,
      x: x,
      y: y,
      nugget: 0.0,
      range: 0.0,
      sill: 0.0,
      A: 1 / 3,
      n: 0,
    };
    switch (model) {
      case 'gaussian':
        variogram.model = kriging_variogram_gaussian;
        break;
      case 'exponential':
        variogram.model = kriging_variogram_exponential;
        break;
      case 'spherical':
        variogram.model = kriging_variogram_spherical;
        break;
    }

    // Lag distance/semivariance
    var i,
      j,
      k,
      l,
      n = t.length;
    var distance = Array((n * n - n) / 2);
    for (i = 0, k = 0; i < n; i++)
      for (j = 0; j < i; j++, k++) {
        distance[k] = Array(2);
        distance[k][0] = Math.pow(
          Math.pow(x[i] - x[j], 2) + Math.pow(y[i] - y[j], 2),
          0.5,
        );
        distance[k][1] = Math.abs(t[i] - t[j]);
      }
    distance.sort(function (a, b) {
      return a[0] - b[0];
    });
    variogram.range = distance[(n * n - n) / 2 - 1][0];

    // Bin lag distance
    var lags = (n * n - n) / 2 > 30 ? 30 : (n * n - n) / 2;
    var tolerance = variogram.range / lags;
    var lag = [0].rep(lags);
    var semi = [0].rep(lags);
    if (lags < 30) {
      for (l = 0; l < lags; l++) {
        lag[l] = distance[l][0];
        semi[l] = distance[l][1];
      }
    } else {
      for (
        i = 0, j = 0, k = 0, l = 0;
        i < lags && j < (n * n - n) / 2;
        i++, k = 0
      ) {
        while (distance[j][0] <= (i + 1) * tolerance) {
          lag[l] += distance[j][0];
          semi[l] += distance[j][1];
          j++;
          k++;
          if (j >= (n * n - n) / 2) break;
        }
        if (k > 0) {
          lag[l] /= k;
          semi[l] /= k;
          l++;
        }
      }
      if (l < 2) return variogram; // Error: Not enough points
    }

    // Feature transformation
    n = l;
    variogram.range = lag[n - 1] - lag[0];
    var X = [1].rep(2 * n);
    var Y = Array(n);
    var A = variogram.A;
    for (i = 0; i < n; i++) {
      switch (model) {
        case 'gaussian':
          X[i * 2 + 1] =
            1.0 - Math.exp(-(1.0 / A) * Math.pow(lag[i] / variogram.range, 2));
          break;
        case 'exponential':
          X[i * 2 + 1] =
            1.0 - Math.exp((-(1.0 / A) * lag[i]) / variogram.range);
          break;
        case 'spherical':
          X[i * 2 + 1] =
            1.5 * (lag[i] / variogram.range) -
            0.5 * Math.pow(lag[i] / variogram.range, 3);
          break;
      }
      Y[i] = semi[i];
    }

    // Least squares
    var Xt = kriging_matrix_transpose(X, n, 2);
    var Z = kriging_matrix_multiply(Xt, X, 2, n, 2);
    Z = kriging_matrix_add(Z, kriging_matrix_diag(1 / alpha, 2), 2, 2);
    var cloneZ = Z.slice(0);
    if (kriging_matrix_chol(Z, 2)) kriging_matrix_chol2inv(Z, 2);
    else {
      kriging_matrix_solve(cloneZ, 2);
      Z = cloneZ;
    }
    var W = kriging_matrix_multiply(
      kriging_matrix_multiply(Z, Xt, 2, 2, n),
      Y,
      2,
      n,
      1,
    );

    // Variogram parameters
    variogram.nugget = W[0];
    variogram.sill = W[1] * variogram.range + variogram.nugget;
    variogram.n = x.length;

    // Gram matrix with prior
    n = x.length;
    var K = Array(n * n);
    for (i = 0; i < n; i++) {
      for (j = 0; j < i; j++) {
        K[i * n + j] = variogram.model(
          Math.pow(Math.pow(x[i] - x[j], 2) + Math.pow(y[i] - y[j], 2), 0.5),
          variogram.nugget,
          variogram.range,
          variogram.sill,
          variogram.A,
        );
        K[j * n + i] = K[i * n + j];
      }
      K[i * n + i] = variogram.model(
        0,
        variogram.nugget,
        variogram.range,
        variogram.sill,
        variogram.A,
      );
    }

    // Inverse penalized Gram matrix projected to target vector
    var C = kriging_matrix_add(K, kriging_matrix_diag(sigma2, n), n, n);
    var cloneC = C.slice(0);
    if (kriging_matrix_chol(C, n)) kriging_matrix_chol2inv(C, n);
    else {
      kriging_matrix_solve(cloneC, n);
      C = cloneC;
    }

    // Copy unprojected inverted matrix as K
    var K = C.slice(0);
    var M = kriging_matrix_multiply(C, t, n, n, 1);
    variogram.K = K;
    variogram.M = M;

    return variogram;
  };

  // Model prediction
  kriging.predict = function (x, y, variogram) {
    var i,
      k = Array(variogram.n);
    for (i = 0; i < variogram.n; i++)
      k[i] = variogram.model(
        Math.pow(
          Math.pow(x - variogram.x[i], 2) + Math.pow(y - variogram.y[i], 2),
          0.5,
        ),
        variogram.nugget,
        variogram.range,
        variogram.sill,
        variogram.A,
      );
    return kriging_matrix_multiply(k, variogram.M, 1, variogram.n, 1)[0];
  };
  kriging.variance = function (x, y, variogram) {
    var i,
      k = Array(variogram.n);
    for (i = 0; i < variogram.n; i++)
      k[i] = variogram.model(
        Math.pow(
          Math.pow(x - variogram.x[i], 2) + Math.pow(y - variogram.y[i], 2),
          0.5,
        ),
        variogram.nugget,
        variogram.range,
        variogram.sill,
        variogram.A,
      );
    return (
      variogram.model(
        0,
        variogram.nugget,
        variogram.range,
        variogram.sill,
        variogram.A,
      ) +
      kriging_matrix_multiply(
        kriging_matrix_multiply(k, variogram.K, 1, variogram.n, variogram.n),
        k,
        1,
        variogram.n,
        1,
      )[0]
    );
  };

  // Gridded matrices or contour paths
  kriging.grid = function (polygons, variogram, width) {
    var i,
      j,
      k,
      n = polygons.length;
    if (n == 0) return;

    // Boundaries of polygons space
    var xlim = [polygons[0][0][0], polygons[0][0][0]];
    var ylim = [polygons[0][0][1], polygons[0][0][1]];
    for (
      i = 0;
      i < n;
      i++ // Polygons
    )
      for (j = 0; j < polygons[i].length; j++) {
        // Vertices
        if (polygons[i][j][0] < xlim[0]) xlim[0] = polygons[i][j][0];
        if (polygons[i][j][0] > xlim[1]) xlim[1] = polygons[i][j][0];
        if (polygons[i][j][1] < ylim[0]) ylim[0] = polygons[i][j][1];
        if (polygons[i][j][1] > ylim[1]) ylim[1] = polygons[i][j][1];
      }

    // Alloc for O(n^2) space
    var xtarget, ytarget;
    var a = Array(2),
      b = Array(2);
    var lxlim = Array(2); // Local dimensions
    var lylim = Array(2); // Local dimensions
    var x = Math.ceil((xlim[1] - xlim[0]) / width);
    var y = Math.ceil((ylim[1] - ylim[0]) / width);

    var A = Array(x + 1);
    for (i = 0; i <= x; i++) A[i] = Array(y + 1);
    for (i = 0; i < n; i++) {
      // Range for polygons[i]
      lxlim[0] = polygons[i][0][0];
      lxlim[1] = lxlim[0];
      lylim[0] = polygons[i][0][1];
      lylim[1] = lylim[0];
      for (j = 1; j < polygons[i].length; j++) {
        // Vertices
        if (polygons[i][j][0] < lxlim[0]) lxlim[0] = polygons[i][j][0];
        if (polygons[i][j][0] > lxlim[1]) lxlim[1] = polygons[i][j][0];
        if (polygons[i][j][1] < lylim[0]) lylim[0] = polygons[i][j][1];
        if (polygons[i][j][1] > lylim[1]) lylim[1] = polygons[i][j][1];
      }

      // Loop through polygon subspace
      a[0] = Math.floor(
        (lxlim[0] - ((lxlim[0] - xlim[0]) % width) - xlim[0]) / width,
      );
      a[1] = Math.ceil(
        (lxlim[1] - ((lxlim[1] - xlim[1]) % width) - xlim[0]) / width,
      );
      b[0] = Math.floor(
        (lylim[0] - ((lylim[0] - ylim[0]) % width) - ylim[0]) / width,
      );
      b[1] = Math.ceil(
        (lylim[1] - ((lylim[1] - ylim[1]) % width) - ylim[0]) / width,
      );
      for (j = a[0]; j <= a[1]; j++)
        for (k = b[0]; k <= b[1]; k++) {
          xtarget = xlim[0] + j * width;
          ytarget = ylim[0] + k * width;
          if (polygons[i].pip(xtarget, ytarget))
            A[j][k] = kriging.predict(xtarget, ytarget, variogram);
        }
    }
    A.xlim = xlim;
    A.ylim = ylim;
    A.zlim = [variogram.t.min(), variogram.t.max()];
    A.width = width;
    return A;
  };
  kriging.contour = function (value, polygons, variogram) { };

  // Plotting on the DOM
  kriging.plot = function (canvas, grid, xlim, ylim, colors) {
    // Clear screen
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Starting boundaries
    var range = [
      xlim[1] - xlim[0],
      ylim[1] - ylim[0],
      grid.zlim[1] - grid.zlim[0],
    ];
    var i, j, x, y, z;
    var n = grid.length;
    var m = grid[0].length;
    var wx = Math.ceil((grid.width * canvas.width) / (xlim[1] - xlim[0]));
    var wy = Math.ceil((grid.width * canvas.height) / (ylim[1] - ylim[0]));
    for (i = 0; i < n; i++)
      for (j = 0; j < m; j++) {
        if (grid[i][j] == undefined) continue;
        x =
          (canvas.width * (i * grid.width + grid.xlim[0] - xlim[0])) / range[0];
        y =
          canvas.height *
          (1 - (j * grid.width + grid.ylim[0] - ylim[0]) / range[1]);
        z = (grid[i][j] - grid.zlim[0]) / range[2];
        if (z < 0.0) z = 0.0;
        if (z > 1.0) z = 1.0;

        ctx.fillStyle = colors[Math.floor((colors.length - 1) * z)];
        ctx.fillRect(Math.round(x - wx / 2), Math.round(y - wy / 2), wx, wy);
      }
  };

  return kriging;
})();
//#endregion
