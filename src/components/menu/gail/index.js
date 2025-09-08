//5.11.62

import React, {Component} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  View,
  ScrollView,
  NativeModules,
  NativeEventEmitter,
  Vibration,
  Alert,
  Platform,
  Toast,
} from 'react-native';
import {Card} from 'native-base';
import {Col, Grid} from 'react-native-easy-grid';
import {connect} from 'react-redux';
import {
  FileManager,
  getFileList,
  deleteFile,
  readFile,
} from '../../../FileManager';

import HeaderFix from '../../common/HeaderFix';
import Text from '../../common/TextFix';
import ButtonFix from '../../common/ButtonFix';
import Chart from './chart';
import AlertFix from '../../common/AlertsFix';
import API from '../../../config/Api';
import BleManager from 'react-native-ble-manager';

import Lang from '../../../assets/language//menu/lang_record';
import LangHome from '../../../assets/language/screen/lang_home';
import lang_gail from '../../../assets/language/menu/lang_gail'; // Import the language file
import { getLocalizedText } from '../../../assets/language/langUtils';
import {set} from 'lodash';

var RNFS = require('react-native-fs');

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const TIMER = 100;
const TIMER_BIG = 1;
const Duration = 1500;

/*
code vibration

if (this.state.switch) {
      Vibration.vibrate(Duration);
}else{
  Vibration.cancel();
}

*/


// put near the top of the file (below constants is fine)
function parseSizeFromPeripheralName(name = '') {
  // capture 9, 10, 10.5, etc. right before trailing L/R
  const m = name.match(/(\d+(?:\.5)?)\s*[LR]\s*$/i);
  return m ? m[1] : null;
}


class index extends Component {
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

  lsensor = [0, 0, 0, 0, 0];
  rsensor = [0, 0, 0, 0, 0];

  lastLtime = new Date();
  lastRtime = new Date();

  start = new Date();
  readDelay = new Date();

  ltime = new Date();
  rtime = new Date();

  round = Math.floor(1000 + Math.random() * 9000);

  state = {
    textAction: 'Record', // Initialize with default value
    lsensor: [0, 0, 0, 0, 0],
    rsensor: [0, 0, 0, 0, 0],
    lstage: 0,
    rstage: 0,
    isConnected: true,
    peripherals: new Map(),
    shoeSize: 0 ,
  };

  componentDidMount = () => {
    NetInfo.addEventListener(this.handleConnectivityChange);
    this.retrieveConnected();
    this.startReading();
    // Set initial button text with proper translation
    this.setState({
      textAction: getLocalizedText(this.props.lang, lang_gail.recordButton)
    });
  };

  componentWillUnmount = () => {
    clearInterval(this.readInterval);
    if (this.dataRecord) {
      this.dataRecord.remove();
    }
  };

  calMeasurePressure = value => {
    return 2.206 * Math.exp(0.0068 * value);
  };

  measurePressure = sensor => {
    for (let i = 0; i < sensor.length; i++) {
      if (this.calMeasurePressure(sensor[i]) > 100) {
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
                this.setState({peripherals});
              }
              if (peripheral.name[peripheral.name.length - 1] === 'L') {
                this.props.addLeftDevice(peripheral.id);
                const size = parseSizeFromPeripheralName(peripheral.name);
                if (size && !this.state.shoeSize) this.setState({ shoeSize: size });
              } else if (peripheral.name[peripheral.name.length - 1] === 'R') {
                this.props.addRightDevice(peripheral.id);
                const size = parseSizeFromPeripheralName(peripheral.name);
                if (size && !this.state.shoeSize) this.setState({ shoeSize: size });
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
        this.setState({peripherals});
      }
    });
  }

  async startReading() {
    if (typeof this.props.record !== 'undefined') {
      if (this.props.record === 'Stop') {
        this.actionRecording();
      }
    } else {
      this.props.actionRecordingButton('Record');
      this.setState({textAction: getLocalizedText(this.props.lang, lang_gail.recordButton)});
    }

    this.dataRecord = bleManagerEmitter.addListener(
        'BleManagerDidUpdateValueForCharacteristic',
        ({value, peripheral, characteristic, service}) => {
          let time = new Date();
          if (peripheral === this.props.rightDevice) {
            let sensor = this.toDecimalArray(value);
            this.recordData(sensor, 'R');
            if (time - this.rtime > 333) {
              this.setState({rsensor: sensor});
              this.rtime = time;
            }
          }
          if (peripheral === this.props.leftDevice) {
            let sensor = this.toDecimalArray(value);
            this.recordData(sensor, 'L');
            if (time - this.ltime > 333) {
              this.setState({lsensor: sensor});
              this.ltime = time;
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

  handleConnectivityChange = status => {
    this.setState({isConnected: status.isConnected});
  };

  actionRecording = async () => {
    if (
        typeof this.props.rightDevice === 'undefined' &&
        typeof this.props.leftDevice === 'undefined'
    ) {
      Alert.alert(getLocalizedText(this.props.lang, Lang.warning),
          getLocalizedText(this.props.lang, Lang.bluetoothAlert), [
            {
              text: 'OK',
              onPress: () => {
                this.props.navigation.navigate('Device', {
                  name: getLocalizedText(this.props.lang, LangHome.addDeviceButton),
                });
              },
            },
          ]);
      return;
    }
    if (this.state.textAction === getLocalizedText(this.props.lang, lang_gail.recordButton)) {
      this.setState({textAction: getLocalizedText(this.props.lang, lang_gail.stopButton)});
      this.props.actionRecordingButton('Stop');
      let initTime = new Date();
      this.start = initTime;
      this.lastLTime = initTime;
      this.lastRTime = initTime;
      this.readInterval = setInterval(async () => {
        let time = new Date();
        let data = {
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
          await RNFS.appendFile(
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
      this.setState({textAction: getLocalizedText(this.props.lang, lang_gail.recordButton)});
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
                    shoe_size: this.state.shoeSize,
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
                        }
                      });
                })
                .catch(e => {});
          });
        });
    alert(getLocalizedText(this.props.lang, Lang.alert));
  }

  actionUpdate = data => {
    console.log('Update =>');

    // console.log('Delete =>' + this.fileStamp_n)
    // deleteFile(this.fileStamp_n)

    console.log('Update =>');

    let content = {
      data: data,
      id_customer: this.props.user.id_customer,
      id_device: '',
      type: 1, // for medical
    };

    // console.log('Delete =>' + this.fileStamp_n);

    fetch(`${API}/addjson`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(content),
    })
        .then(res => res.json())
        .then(res => {
          console.log('res => ');
          console.log(res);
          if (res.status === 'สำเร็จ') {
            AlertFix.alertBasic(
                getLocalizedText(this.props.lang, Lang.successTitle),
                getLocalizedText(this.props.lang, Lang.successBody),
            );
            deleteFile(this.fileStamp_n);
          } else {
            AlertFix.alertBasic(
                getLocalizedText(this.props.lang, Lang.errorTitle),
                getLocalizedText(this.props.lang, Lang.errorBody1),
            );
          }
        })
        .catch(error => {
          AlertFix.alertBasic(
              getLocalizedText(this.props.lang, Lang.errorTitle),
              getLocalizedText(this.props.lang, Lang.errorBody2),
          );
        });
  };

  actionDashboard = () => {
    this.props.navigation.navigate('Dashboard');
  };

  render() {
    return (
        <ScrollView>
          <HeaderFix
              icon_left={'left'}
              onpress_left={() => {
                this.props.navigation.goBack();
              }}
              title={this.props.navigation.getParam('name', '')}
          />

          {/* Add smaller spacer to push chart slightly higher */}
          <View style={{ height: 40 }} />

          <Chart
              lsensor={this.state.lsensor}
              rsensor={this.state.rsensor}
              // Pass translations to Chart component
              foreFootText={getLocalizedText(this.props.lang, lang_gail.foreFootText)}
              midFootText={getLocalizedText(this.props.lang, lang_gail.midFootText)}
              heelText={getLocalizedText(this.props.lang, lang_gail.heelText)}
              entireFootText={getLocalizedText(this.props.lang, lang_gail.entireFootText)}
              rightSideText={getLocalizedText(this.props.lang, lang_gail.rightSideText)}
              leftSideText={getLocalizedText(this.props.lang, lang_gail.leftSideText)}
              // Add text color props for left and right foot labels
              textColor="#000000" // Black color for general text
              footTextColor="#000000" // Specifically for left foot and right foot text
          />

          <Grid
              style={{padding: 15, justifyContent: 'center', alignItems: 'center'}}>
            {/* <Col> */}
            <ButtonFix
                action={true}
                rounded={true}
                title={this.state.textAction}
                onPress={() => this.actionRecording()}
            />
            {/* </Col> */}
            {/* <Col>
            <ButtonFix
              rounded={true}
              title={'Dashboard 8'}
              onPress={() => this.actionDashboard()}
            />
          </Col> */}
          </Grid>
        </ScrollView>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.user,
    rightDevice: state.rightDevice,
    leftDevice: state.leftDevice,
    lang: state.lang,
    record: state.record,
    noti: state.noti,
    productNumber: state.productNumber,
  };
};

const mapDisPatchToProps = dispatch => {
  return {
    addLeftDevice: device => {
      return dispatch({type: 'ADD_LEFT_DEVICE', payload: device});
    },
    addRightDevice: device => {
      return dispatch({type: 'ADD_RIGHT_DEVICE', payload: device});
    },
    addDashBoardData: data => {
      return dispatch({type: 'ADD_BLUETOOTH_DATA', payload: data});
    },
    actionRecordingButton: data => {
      return dispatch({type: 'ACTION_BUTTON_RECORD', payload: data});
    },
    actionNotificationButton: data => {
      return dispatch({type: 'ACTION_BUTTON_NOTIFICATION', payload: data});
    },
  };
};

export default connect(mapStateToProps, mapDisPatchToProps)(index);