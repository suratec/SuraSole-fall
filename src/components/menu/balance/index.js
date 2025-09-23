//5.11.62

import React, {Component} from 'react';
import {
  View,
  Image,
  ScrollView,
  NativeModules,
  NativeEventEmitter,
  Vibration,
  TouchableOpacity,
  Text as RNText,
  Alert,
  Dimensions,
  StyleSheet,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {Col, Grid} from 'react-native-easy-grid';
import {connect} from 'react-redux';

import HeaderFix from '../../common/HeaderFix';
import NotificationsState from '../../shared/Notification';
import Text from '../../common/TextFix';
import ButtonFix from '../../common/ButtonFix';
import RadarChartFix from '../../common/RadarChartFix';
import CardStatusFix from '../../common/CardStatusFix';
import AlertFix from '../../common/AlertsFix';
import ScoreFix from '../../common/ScoreFix';
import API from '../../../config/Api';
import BleManager from 'react-native-ble-manager';

import {
  FileManager,
  getFileList,
  deleteFile,
  readFile,
} from '../../../FileManager';
import {TabHeading} from 'native-base';

import BalanceLang from '../../../assets/language/menu/lang_balance';
import Lang from '../../../assets/language/menu/lang_record';
import LangHome from '../../../assets/language/screen/lang_home';
import {getLocalizedText} from "../../../assets/language/langUtils";

var RNFS = require('react-native-fs');

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
const { width, height } = Dimensions.get('window');

const TIMER = 100;
const TIMER_BIG = 1;
const Duration = 1500;

function parseSizeFromPeripheralName(name = '') {
  const m = name.match(/(\d+(?:\.5)?)\s*[LR]\s*$/i);
  return m ? m[1] : null;
}

class index extends Component {
  leftSwingTime = 0;
  rightSwingTime = 0;
  leftStanceTime = 0;
  rightStanceTime = 0;
  durationTime = 0;

  lsensor = [0, 0, 0, 0, 0];
  rsensor = [0, 0, 0, 0, 0];

  readDelay = new Date();
  start = new Date();
  lastRtime = new Date();
  lastLtime = new Date();

  round = Math.floor(1000 + Math.random() * 9000);

  ltime = new Date();
  rtime = new Date();

  counter = 1;

  state = {
    textAction: getLocalizedText(this.props.lang, BalanceLang.recordButton),
    lstage: 0,
    rstage: 0,
    xPosN: 150,
    yPosN: 150,
    focus: true,
    lphase: 0,
    rphase: 0,
    rsensor: [0, 0, 0, 0, 0],
    lsensor: [0, 0, 0, 0, 0],
    shouldVibrate: false,
    score: 0,
    balance: 0,
    txt: '',
    status: getLocalizedText(this.props.lang, BalanceLang.waiting),
    isConnected: true,
    peripherals: new Map(),
    shoeSize:0,
    notiAlarm: 0,
    selectedMenu: 1,
    menuAction: [
      {key: 1, title: getLocalizedText(this.props.lang, BalanceLang.dynamic)},
      {key: 2, title: getLocalizedText(this.props.lang, BalanceLang.staticMode)},
    ],
    countDownTimer:10,
    isCalibrated: false,
    leftLegCalibrated: false,
    rightLegCalibrated: false,
    percentageCompleted: 0,
    calibrationScreenOn: false,
    calibrationPhase: 0,
    showButton: true,
  };

  // Helper methods for balance grade colors
  getScoreColor = (score) => {
    if (score >= 80) return '#28a745'; // Green for good
    if (score >= 40) return '#ffc107'; // Yellow for medium
    return '#dc3545'; // Red for bad
  };

  getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'good': return '#28a745';
      case 'medium': return '#ffc107';
      case 'bad': return '#dc3545';
      default: return '#6c757d';
    }
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

  toKilo = value => {
    return (5.6 * 10 ** -4 * Math.exp(value / 53.36) + 6.72) / 0.796;
  };

  shouldBeVibration = sensor => {
    for (let i = 0; i < sensor.length; i++) {
      if (this.toKilo(sensor[i]) > this.props.user.weight * 0.3) {
        return true;
      }
    }
    return false;
  };

  componentDidMount = async () => {
    // notiAlarm
    let noti = await AsyncStorage.getItem('notiSetting');
    noti !== null ? this.setState({notiAlarm: parseInt(noti)}) : 100;
    NetInfo.addEventListener(this.handleConnectivityChange);
    const {navigation} = this.props;
    this.focusListener = navigation.addListener('didFocus', () => {
      this.retrieveConnected();
      this.startReading();
      this.setState({focus: true});
    });
    this.zoneInterval = setInterval(() => {
      var score =
          (this.state.balance + Number.parseInt(this.state.score)) / this.counter;
      this.setState({score: score.toFixed(0)}, () => this.counter++);
    }, 1000);
  };

  componentWillUnmount = () => {
    clearInterval(this.readInterval);
    clearInterval(this.zoneInterval);
    if (this.dataRecord) {
      this.dataRecord.remove();
    }
    this.focusListener.remove();
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
                this.setState({peripherals});
              }
              if (peripheral.name[peripheral.name.length - 1] === 'L') {
                this.props.addLeftDevice(peripheral.id);
                const sz = parseSizeFromPeripheralName(peripheral.name);
                if (sz && !this.state.shoeSize) this.setState({ shoeSize: sz });
              } else if (peripheral.name[peripheral.name.length - 1] === 'R') {
                this.props.addRightDevice(peripheral.id);
                const sz = parseSizeFromPeripheralName(peripheral.name);
                if (sz && !this.state.shoeSize) this.setState({ shoeSize: sz });
              }
              setTimeout(() => {
                BleManager.retrieveServices(peripheral.id).then(
                    peripheralInfo => {
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
    this.dataRecord = bleManagerEmitter.addListener(
        'BleManagerDidUpdateValueForCharacteristic',
        ({value, peripheral, characteristic, service}) => {
          let time = new Date();
          if (peripheral === this.props.rightDevice) {
            let rsensor = this.toDecimalArray(value);
            this.recordData(rsensor, 'R');
            if (time - this.rtime > 250) {
              let lsensor = this.state.lsensor;
              let shouldVibrate = this.shouldBeVibration(lsensor);
              let sumright =
                  ((rsensor[0] + rsensor[1] + rsensor[2]) / 3) + rsensor[3] + rsensor[4];
              let sumleft =
                  ((lsensor[0] + lsensor[1] + lsensor[2]) / 3) + lsensor[3] + lsensor[4];
              let sumup =
                  (rsensor[1] + rsensor[2]) / 2 + (lsensor[1] + lsensor[2]) / 2;
              let sumdown = lsensor[4] + rsensor[4];
              let xPos = (sumright - sumleft) / 23.4;
              let yPos = (sumup - sumdown) / -15.6;
              let xPosN = (xPos + 100) * 1.5;
              let yPosN = (yPos + 100) * 1.5;
              let rphase = rsensor.reduce((a, b) => a + b, 0);
              let {txt, status, balance} = this.setStatus(xPos, yPos);
              this.setState({
                xPosN,
                yPosN,
                rphase,
                rsensor,
                shouldVibrate,
                txt,
                status,
                balance,
              });
              this.rtime = time;
            }
          }
          if (peripheral === this.props.leftDevice) {
            let lsensor = this.toDecimalArray(value);
            this.recordData(lsensor, 'L');
            if (time - this.ltime > 250) {
              let rsensor = this.state.rsensor;
              let shouldVibrate = this.shouldBeVibration(lsensor);
              let sumright =
                  ((rsensor[0] + rsensor[1] + rsensor[2]) / 3) + rsensor[3] + rsensor[4];
              let sumleft =
                  ((lsensor[0] + lsensor[1] + lsensor[2]) / 3) + lsensor[3] + lsensor[4];
              let sumup =
                  (rsensor[1] + rsensor[2]) / 2 + (lsensor[1] + lsensor[2]) / 2;
              let sumdown = lsensor[4] + rsensor[4];
              let xPos = (sumright - sumleft) / 23.4;
              let yPos = (sumup - sumdown) / -15.6;
              let xPosN = (xPos + 100) * 1.5;
              let yPosN = (yPos + 100) * 1.5;

              let lphase = lsensor.reduce((a, b) => a + b, 0);
              let {txt, status, balance} = this.setStatus(xPos, yPos);
              this.setState({
                xPosN,
                yPosN,
                lphase,
                lsensor,
                shouldVibrate,
                txt,
                status,
                balance,
              });
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

  setStatus(x, y) {
    var persent = 0;
    if (x > y) {
      persent = Math.abs(x);
    } else {
      persent = Math.abs(y);
    }
    if (100 - persent >= 80) {
      return {
        txt: getLocalizedText(this.props.lang || 0, BalanceLang.goodBalance),
        status: getLocalizedText(this.props.lang, BalanceLang.good),
        balance: Math.round(100 - persent),
      };
    } else if (100 - persent >= 40) {
      return {
        txt: getLocalizedText(this.props.lang || 0, BalanceLang.mediumBalance),
        status: getLocalizedText(this.props.lang, BalanceLang.medium),
        balance: Math.round(100 - persent),
      };
    } else {
      return {
        txt: getLocalizedText(this.props.lang || 0, BalanceLang.badBalance),
        status: getLocalizedText(this.props.lang, BalanceLang.poor),
        balance: Math.round(100 - persent),
      };
    }
  }

  handleConnectivityChange = status => {
    this.setState({isConnected: status.isConnected});
    console.log(`Wifi Status : ${this.state.isConnected}`);
  };

  showStages = () => {
    this.setState({calibrationPhase:2})
  }

  handleStartCalibration = () => {
    if (
        typeof this.props.rightDevice === 'undefined' &&
        typeof this.props.leftDevice === 'undefined'
    ) {
      Alert.alert(getLocalizedText(this.props.lang, BalanceLang.warning), getLocalizedText(this.props.lang, BalanceLang.bluetoothAlert), [
        {
          text: 'OK',
          onPress: () => {
            this.props.navigation.navigate('Product', {
              name: getLocalizedText(this.props.lang || 0, LangHome.addDeviceButton),
            });
          },
        },
      ]);
      return;
    } else {
      this.setState({ calibrationPhase: 1});
    }
  };

  handleSaveData = (calibrationStatus,butonLabel) => {
    this.props.actionRecordingButton(butonLabel);
    this.setState({isCalibrated: calibrationStatus,textAction:butonLabel});
  }

  changeMenu = value => {
    this.setState({selectedMenu: value});
  };

  actionRecording = async () => {
    if (
        typeof this.props.rightDevice === 'undefined' &&
        typeof this.props.leftDevice === 'undefined'
    ) {
      Alert.alert(
          getLocalizedText(this.props.lang, BalanceLang.warning),
          getLocalizedText(this.props.lang, BalanceLang.bluetoothAlert),
          [
            {
              text: 'OK',
              onPress: () => {
                this.props.navigation.navigate('Device', {
                  name: this.props.lang
                      ? LangHome.addDeviceButton.thai
                      : LangHome.addDeviceButton.eng,
                });
              },
            },
          ]);
      return;
    }
    if (this.state.textAction == 'Record') {
      this.setState({textAction: 'Stop'});
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
      this.setState({textAction: 'Record'});
      this.props.actionRecordingButton('Record');
      clearInterval(this.readInterval);
      this.sendDataToSetver();
    }
  };


  actionRecordingFor10 = async () => {
    if (
        typeof this.props.rightDevice === 'undefined' &&
        typeof this.props.leftDevice === 'undefined'
    ) {
      Alert.alert(getLocalizedText(this.props.lang, BalanceLang.warning), getLocalizedText(this.props.lang, BalanceLang.bluetoothAlert), [
        {
          text: 'OK',
          onPress: () => {
            this.props.navigation.navigate('Product', {
              name: getLocalizedText(this.props.lang || 0, LangHome.addDeviceButton),
            });
          },
        },
      ]);
      return;
    }
    if (this.state.textAction == getLocalizedText(this.props.lang, BalanceLang.recordButton)) {
      this.setState({textAction: getLocalizedText(this.props.lang, BalanceLang.stopButton)});
      this.props.actionRecordingButton(getLocalizedText(this.props.lang, BalanceLang.stopButton));
      var initTime = new Date();
      var start = initTime;
      let lastLtime = initTime;
      let lastRtime = initTime;

      let count = 10;
      var timer = setInterval(() => {
        if(this.state.countDownTimer >= 1) {

          var timer2 = setInterval(()=>{
            var time = new Date();
            if(Math.floor((time - start) / 1000) < 11){
              var data = {
                stamp: time.getTime(),
                timestamp: time,
                duration: Math.floor((time - start) / 1000),
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
                RNFS.appendFile(
                    RNFS.CachesDirectoryPath +
                    '/suratechM/' +
                    start.getFullYear() +
                    start.getMonth() +
                    start.getDate() +
                    this.round,
                    JSON.stringify(data) + ',',
                );
              } catch {
                RNFS.mkdir(RNFS.CachesDirectoryPath + '/suratechM/');
                RNFS.appendFile(
                    RNFS.CachesDirectoryPath +
                    '/suratechM/' +
                    start.getFullYear() +
                    start.getMonth() +
                    start.getDate() +
                    this.round,
                    JSON.stringify(data) + ',',
                );
              }
            }

          },100);

          setTimeout(() => {
            clearInterval(timer2);
          }, 1000);

          this.setState({countDownTimer:parseInt(this.state.countDownTimer) - 1})
        }

      }, 1000);

      setTimeout(() => {
        this.setState({textAction: 'Record',countDownTimer:10});
        this.props.actionRecordingButton('Record');
        this.sendDataToSetverCalibration('S');
        clearInterval(this.readInterval)
        clearInterval(timer);
        // clearInterval(this.readInterval);
      }, 11000);

    } else {
      this.setState({textAction: getLocalizedText(this.props.lang, BalanceLang.recordButton)});
      this.props.actionRecordingButton(getLocalizedText(this.props.lang, BalanceLang.recordButton));
      // clearInterval(this.readInterval);
      this.sendDataToSetverCalibration('S');
    }
  };


  sendDataToSetverCalibration = (legValue) => {
    this.state.isConnected == false
        ?  RNFS.readDir(RNFS.CachesDirectoryPath + '/suratechM/').then(res => {
          console.log('WiFi is not connect');
          res.forEach(r => {
            console.log(r.path);
          });
        })
        :  RNFS.readDir(RNFS.CachesDirectoryPath + '/suratechM/').then(res => {
          res.forEach(r => {
            console.log(r.path,'path');
            RNFS.readFile(r.path)
                .then(  text => {
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
                    leg_type:legValue
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
                        console.log(resp,content,"response");
                        if (resp.status != 'ผิดพลาด') {
                          console.log(`Clear : ${r.path}`);
                          RNFS.unlink(r.path);
                        }
                      });
                })
                .catch(e => { });
          });
        });
    // alert(this.props.lang ? Lang.alert.thai : Lang.alert.eng);
  }

  sendDataToSetver = () => {
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
                    shoe_size:  this.state.shoeSize,
                    leg_type:''
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
                        console.log(resp,content,"response");
                        if (resp.status != 'ผิดพลาด') {
                          console.log(`Clear : ${r.path}`);
                          RNFS.unlink(r.path);
                        }
                      });
                })
                .catch(e => {});
          });
        });
    // alert(this.props.lang ? Lang.alert.thai : Lang.alert.eng);
  }

  actionUpdate = content => {
    content = {
      data: content,
      id_customer: this.props.user.id_customer,
      id_device: '',
      type: 1, // for medical
    };

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
          if (res.status === 'สำเร็จ') {
            AlertFix.alertBasic(
                getLocalizedText(this.props.lang || 0, Lang.successTitle),
                getLocalizedText(this.props.lang || 0, Lang.successBody),
            );
            deleteFile(this.fileStamp_n);
          } else {
            AlertFix.alertBasic(
                getLocalizedText(this.props.lang || 0, Lang.errorTitle),
                getLocalizedText(this.props.lang || 0, Lang.errorBody1),
            );
          }
        })
        .catch(error => {
          AlertFix.alertBasic(
              getLocalizedText(this.props.lang || 0, Lang.errorTitle),
              getLocalizedText(this.props.lang || 0, Lang.errorBody2),
          );
        });
  };

  actionDashboard = () => {
    this.props.navigation.navigate('Dashboard');
  };

  startCalibration = () => {
    this.setState({calibrationScreenOn: true});
  };

  handleStartLeftLegCalibration = () => {

    if (
        typeof this.props.rightDevice === 'undefined' &&
        typeof this.props.leftDevice === 'undefined'
    ) {
      Alert.alert(getLocalizedText(this.props.lang, BalanceLang.warning), getLocalizedText(this.props.lang, BalanceLang.bluetoothAlert), [
        {
          text: 'OK',
          onPress: () => {
            this.props.navigation.navigate('Product', {
              name: getLocalizedText(this.props.lang || 0, LangHome.addDeviceButton),
            });
          },
        },
      ]);
      return;
    } else {
      this.setState({showButton:false});
      this.handleSaveData(true,'Stop');

      let progMargin = 20;
      let totalCount = 0;
      let actualValue = 0;
      let progressValue = '';

      var initTime = new Date();
      var start = initTime;
      let lastLtime = initTime;
      let lastRtime = initTime;

      var count = 5;

      // this.actionRecording();
      var timer = setInterval(() => {

        if(count >= 1) {

          var timer2 = setInterval(()=>{
            var time = new Date();
            if(Math.floor((time - start) / 1000) < 6){
              var data = {
                stamp: time.getTime(),
                timestamp: time,
                duration: Math.floor((time - start) / 1000),
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
                RNFS.appendFile(
                    RNFS.CachesDirectoryPath +
                    '/suratechM/' +
                    start.getFullYear() +
                    start.getMonth() +
                    start.getDate() +
                    this.round,
                    JSON.stringify(data) + ',',
                );
              } catch {
                RNFS.mkdir(RNFS.CachesDirectoryPath + '/suratechM/');
                RNFS.appendFile(
                    RNFS.CachesDirectoryPath +
                    '/suratechM/' +
                    start.getFullYear() +
                    start.getMonth() +
                    start.getDate() +
                    this.round,
                    JSON.stringify(data) + ',',
                );
              }
            }

          },100);

          setTimeout(() => {
            clearInterval(timer2);
          }, 1000);

          count = count - 1;
        }

        if (totalCount == 5) {
          actualValue = 0;
          progMargin = 20;

        }else
        if (totalCount < 5) {
          totalCount = totalCount + 1;
          actualValue = parseInt(actualValue) + parseInt(progMargin);
          progressValue = actualValue + '%';
          this.setState({
            percentageCompleted: progressValue,
          });

        }

      }, 1000);

      setTimeout( ()=> {
        this.setState({leftLegCalibrated: true, calibrationPhase: 2,percentageCompleted:0,showButton:true});
        this.handleSaveData(true,'Record');
        this.sendDataToSetverCalibration('L');
        clearInterval(timer);

      }, 6000);

    }
  }

  handleStartRightLegCalibration = () => {
    if (
        typeof this.props.rightDevice === 'undefined' &&
        typeof this.props.leftDevice === 'undefined'
    ) {
      Alert.alert(getLocalizedText(this.props.lang, BalanceLang.warning), getLocalizedText(this.props.lang, BalanceLang.bluetoothAlert), [
        {
          text: 'OK',
          onPress: () => {
            this.props.navigation.navigate('Product', {
              name: getLocalizedText(this.props.lang || 0, LangHome.addDeviceButton),
            });
          },
        },
      ]);
      return;
    } else {
      this.setState({showButton:false});
      this.handleSaveData(true,'Stop');

      let progMargin = 20;
      let totalCount = 0;
      let actualValue = 0;
      let progressValue = '';

      var initTime = new Date();
      var start = initTime;
      let lastLtime = initTime;
      let lastRtime = initTime;

      var count = 5;

      var timer = setInterval(() => {

        if(count >= 1) {

          var timer2 = setInterval(()=>{
            var time = new Date();
            if(Math.floor((time - start) / 1000) < 6){
              var data = {
                stamp: time.getTime(),
                timestamp: time,
                duration: Math.floor((time - start) / 1000),
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
                RNFS.appendFile(
                    RNFS.CachesDirectoryPath +
                    '/suratechM/' +
                    start.getFullYear() +
                    start.getMonth() +
                    start.getDate() +
                    this.round,
                    JSON.stringify(data) + ',',
                );
              } catch {
                RNFS.mkdir(RNFS.CachesDirectoryPath + '/suratechM/');
                RNFS.appendFile(
                    RNFS.CachesDirectoryPath +
                    '/suratechM/' +
                    start.getFullYear() +
                    start.getMonth() +
                    start.getDate() +
                    this.round,
                    JSON.stringify(data) + ',',
                );
              }
            }

          },100);

          setTimeout(() => {
            clearInterval(timer2);
          }, 1000);

          count = count - 1;
        }

        if (totalCount == 5) {
          actualValue = 0;
          progMargin = 20;

        }else
        if (totalCount < 5) {
          totalCount = totalCount + 1;
          actualValue = parseInt(actualValue) + parseInt(progMargin);
          progressValue = actualValue + '%';
          this.setState({
            percentageCompleted: progressValue,
          });

        }

      }, 1000);

      setTimeout( ()=> {
        this.setState({rightLegCalibrated: true, calibrationPhase: 3,percentageCompleted:0,showButton:true});
        this.handleSaveData(true,'Record');
        this.sendDataToSetverCalibration('R');
        clearInterval(timer);

      }, 6000);

    }
  }

  canVibration = (vibrate, master) => {
    if (vibrate && master) {
      Vibration.vibrate(500);
    } else {
      Vibration.cancel();
    }
  };

  render() {
    this.canVibration(this.state.shouldVibrate, this.state.switch);

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: '#fff' }}
            contentContainerStyle={{ flexGrow: 1 }}   // <- new
        >
          {this.state.calibrationScreenOn ? (
              <HeaderFix
                  icon_left={'left'}
                  onpress_left={() => {
                    // this.props.navigation.goBack();
                    this.setState({calibrationScreenOn: false});
                  }}
                  title={'Calibration'}
              />
          ) : (
              <HeaderFix
                  icon_left={'left'}
                  onpress_left={() => {
                    this.props.navigation.goBack();
                  }}
                  title={this.props.navigation.getParam('name', '')}
              />
          )}
          {this.state.calibrationScreenOn ? (
              <>
                {(this.state.calibrationPhase == 0 && (
                        <View
                            style={{
                              // flex: 1,
                              height: 700,
                              marginVertical: 10,
                              flexDirection: 'column',
                              justifyContent: 'space-evenly',
                              marginHorizontal: 20,

                            }}>
                          <View style={{justifyContent:"center",alignItems:"center" }}>
                            <RNText
                                style={{fontSize: 20, color: '#00A2A2', fontWeight: '700',textAlign:"left"}}>
                              Start calibration of SURASOLE
                            </RNText>
                            <Image source={require('../../../assets/image/start.png')} style={{height:400,width:400,resizeMode:"center"}}/>

                            <RNText
                                style={{
                                  fontSize: 20,
                                  color: '#00A2A2',
                                  fontWeight: '700',
                                  marginVertical: 10,
                                }}>
                              Please stand up and follow the guide to perform calibration
                            </RNText>
                          </View>
                          <View style={{justifyContent:"center",alignItems:"center"}}>
                            <TouchableOpacity
                                onPress={() =>
                                {
                                  if(this.props.user.height != null && this.props.user.height != 0){
                                    this.setState({calibrationPhase:1})
                                  }else{
                                    Alert.alert("Please Update Height in profile section to get customized result","Do you want to provide Height",[
                                      {
                                        text: 'Yes',
                                        onPress: () =>  this.props.navigation.navigate('Profile'),
                                      },
                                      {
                                        text: 'No',
                                        onPress: () => this.setState({calibrationPhase:1}),
                                        style: 'cancel',
                                      }])

                                  }
                                } }
                                style={{
                                  alignItems: 'center',
                                }}>
                              <RNText style={{fontSize: 18, color: '#fff'}}>
                                Calibration
                              </RNText>
                            </TouchableOpacity>
                          </View>
                        </View>
                    )) ||
                    (this.state.calibrationPhase == 1 && (
                        <View
                            style={{
                              // flex: 1,
                              height: 700,
                              marginVertical: 10,
                              flexDirection: 'column',
                              justifyContent: 'space-evenly',
                              marginHorizontal: 20,

                            }}>
                          <View style={{}}>
                            <RNText
                                style={{fontSize: 20, color: '#00A2A2', fontWeight: '700',textAlign:"left"}}>
                              Please Keep your left foot off from the ground
                            </RNText>
                            <Image source={require('../../../assets/image/left_leg_up.png')}
                                   style={{height:400,width:400,resizeMode:"center",alignSelf:"center"}}/>
                            <View
                                style={{
                                  marginHorizontal: 20,
                                  marginVertical: 20,
                                  borderRadius: 20,
                                  borderWidth: 0.5,
                                  borderColor: '#ccc',
                                }}>
                              <View
                                  style={{
                                    padding: 20,
                                    backgroundColor: '#00A2A2',
                                    borderRadius: 20,
                                    width: this.state.percentageCompleted,
                                    // width:"60%",
                                  }}
                              />
                            </View>
                            {this.state.percentageCompleted != 0 &&  <RNText
                                style={{
                                  fontSize: 20,
                                  color: '#00A2A2',
                                  fontWeight: '700',
                                  textAlign:"center",
                                }}>
                              left foot calibrating...
                            </RNText>}


                          </View>
                          {this.state.showButton && <View style={{justifyContent:"center",alignItems:"center"}}>
                            <TouchableOpacity
                                onPress={() => this.handleStartLeftLegCalibration()}
                                style={{
                                  marginHorizontal: 10,
                                  paddingHorizontal: 20,
                                  paddingVertical: 10,
                                  width:"60%",
                                  backgroundColor: '#00A2A2',
                                  borderRadius: 20,
                                  marginVertical: 40,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                }}>
                              <RNText style={{fontSize: 18, color: '#fff'}}>
                                Start Calibration
                              </RNText>
                            </TouchableOpacity>
                          </View>}

                        </View>
                    )) ||
                    (this.state.calibrationPhase == 2 && (
                        <View
                            style={{
                              // flex: 1,
                              height: 700,
                              marginVertical: 10,
                              flexDirection: 'column',
                              justifyContent: 'space-evenly',
                              marginHorizontal: 20,

                            }}>
                          <View style={{}}>
                            <RNText
                                style={{fontSize: 20, color: '#00A2A2', fontWeight: '700',textAlign:"left"}}>
                              Please Keep your right foot off from the ground
                            </RNText>
                            <Image source={require('../../../assets/image/right_leg_up.png')}
                                   style={{height:400,width:400,resizeMode:"center",alignSelf:"center"}}/>
                            <View
                                style={{
                                  marginHorizontal: 20,
                                  marginVertical: 20,
                                  borderRadius: 20,
                                  borderWidth: 0.5,
                                  borderColor: '#ccc',
                                }}>
                              <View
                                  style={{
                                    padding: 20,
                                    backgroundColor: '#00A2A2',
                                    borderRadius: 20,
                                    width: this.state.percentageCompleted,
                                    // width:"60%",
                                  }}
                              />
                            </View>
                            {this.state.percentageCompleted != 0 &&  <RNText
                                style={{
                                  fontSize: 20,
                                  color: '#00A2A2',
                                  fontWeight: '700',
                                  textAlign:"center",
                                }}>
                              right foot calibrating...
                            </RNText>}

                          </View>
                          {this.state.showButton &&  <View style={{justifyContent:"center",alignItems:"center"}}>
                            <TouchableOpacity
                                onPress={() => this.handleStartRightLegCalibration()}
                                style={{
                                  marginHorizontal: 10,
                                  paddingHorizontal: 20,
                                  paddingVertical: 10,
                                  width:"60%",
                                  backgroundColor: '#00A2A2',
                                  borderRadius: 20,
                                  marginVertical: 40,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                }}>
                              <RNText style={{fontSize: 18, color: '#fff'}}>
                                Start Calibration
                              </RNText>
                            </TouchableOpacity>
                          </View>}

                        </View>
                    )) ||
                    (this.state.calibrationPhase == 3 && (
                        <View
                            style={{
                              flex: 1,
                              height: 800,
                              marginVertical: 10,
                              flexDirection: 'column',
                              justifyContent: 'space-evenly',
                              alignItems: 'center',
                              marginHorizontal: 20,
                            }}>
                          <View style={{}}>
                            {/* <RNText
                      style={{
                        fontSize: 20,
                        color: '#027862',
                        fontWeight: '700',
                      }}>
                      Start calibration of SURASOLE
                    </RNText> */}
                            <RNText
                                style={{
                                  fontSize: 18,
                                  color: '#00A2A2',
                                  fontWeight: '700',
                                  marginVertical: 20,
                                }}>
                              Calibration of SURASOLE Completed
                            </RNText>
                          </View>
                          <TouchableOpacity
                              onPress={() =>
                                  this.setState({
                                    // calibrationPhase: 3,
                                    calibrationScreenOn: false,
                                  })
                              }
                              style={{
                                marginHorizontal: 10,
                                paddingHorizontal: 20,
                                paddingVertical: 10,
                                backgroundColor: '#00A2A2',
                                borderRadius: 10,
                                marginVertical: 40,
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}>
                            <RNText style={{fontSize: 18, color: '#fff'}}>
                              Completed
                            </RNText>
                          </TouchableOpacity>
                        </View>
                    ))}
              </>
          ) : (
              <>
                <View style={styles.container}>
                  {/* Main Content Container - Optimized for No Scrolling */}
                  <View style={styles.mainContentContainer}>

                    {/* Radar Chart Section - More Space */}
                    <View style={styles.radarContainer}>
                      {this.state.focus ? (
                          <RadarChartFix
                              xPos={this.state.xPosN}
                              yPos={this.state.yPosN}
                          />
                      ) : (
                          <View />
                      )}
                    </View>

                    {/* Balance Grade Display */}

                    <View style={styles.balanceGradeContainer}>
                      {/* Score and Status Row */}
                      <View style={styles.scoreStatusRow}>
                        {/* Balance Score */}
                        <View style={styles.scoreSection}>
                          <RNText style={styles.sectionLabel}>
                            {getLocalizedText(this.props.lang, BalanceLang.score)}
                          </RNText>
                          <View style={[styles.scoreBadge, { backgroundColor: this.getScoreColor(this.state.balance) }]}>
                            <RNText style={styles.scoreText}>{this.state.balance}%</RNText>
                          </View>
                        </View>

                        {/* Status Badge */}
                        <View style={styles.statusSection}>
                          <RNText style={styles.sectionLabel}>
                            {getLocalizedText(this.props.lang, BalanceLang.status)}
                          </RNText>
                          <View style={[styles.statusBadge, { backgroundColor: this.getStatusColor(this.state.status) }]}>
                            <RNText style={styles.statusText}>{this.state.status}</RNText>
                          </View>
                        </View>
                      </View>

                      {/* Compact Progress Bar */}
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBarBackground}>
                          <View style={[
                            styles.progressBarFill,
                            {
                              width: `${this.state.balance}%`,
                              backgroundColor: this.getScoreColor(this.state.balance)
                            }
                          ]} />
                        </View>
                      </View>

                      {/* Description Text - Compact */}
                      <RNText style={styles.descriptionText}>{this.state.txt}</RNText>
                    </View>


                    {/* Left and Right foot buttons - Fixed Spacing */}
                    <View style={styles.buttonsContainer}>
                      <Grid style={styles.buttonsGrid}>
                        <Col>
                          <BalanceButton
                              bntName={getLocalizedText(this.props.lang, BalanceLang.leftButton)}
                              onPress={() => {
                                if (this.dataRecord) {
                                  this.dataRecord.remove();
                                }
                                this.setState({ focus: false });
                                this.props.navigation.navigate('LeftFoots');
                              }}
                          />
                        </Col>
                        <Col>
                          <BalanceButton
                              bntName={getLocalizedText(this.props.lang, BalanceLang.rightButton)}
                              onPress={() => {
                                if (this.dataRecord) {
                                  this.dataRecord.remove();
                                }
                                this.setState({ focus: false });
                                this.props.navigation.navigate('RigthFoots');
                              }}
                          />
                        </Col>
                      </Grid>
                    </View>

                    {/* Record or Calibration buttons based on selected menu */}
                    {this.state.selectedMenu === 1 ? (
                        <View style={styles.recordButtonContainer}>
                          <ButtonFix
                              action={true}
                              rounded={true}
                              title={this.state.textAction}
                              onPress={() => this.actionRecording()}
                          />
                        </View>
                    ) : (
                        <View style={styles.calibrationButtonsContainer}>
                          <Grid style={styles.buttonsGrid}>
                            <Col>
                              <TouchableOpacity
                                  onPress={this.startCalibration}
                                  disabled={this.state.isCalibrated}
                                  style={[
                                    styles.calibrationButton,
                                    { backgroundColor: this.state.isCalibrated ? '#ccc' : '#FF4433' }
                                  ]}>
                                <RNText style={styles.calibrationButtonText}>Calibration</RNText>
                              </TouchableOpacity>
                            </Col>

                            <Col>
                              <TouchableOpacity
                                  onPress={this.actionRecordingFor10}
                                  disabled={
                                      !this.state.isCalibrated || this.state.textAction !== 'Record'
                                  }
                                  style={[
                                    styles.calibrationButton,
                                    {
                                      backgroundColor:
                                          !this.state.isCalibrated || this.state.textAction !== 'Record'
                                              ? '#ccc'
                                              : '#FF4433'
                                    }
                                  ]}>
                                <RNText style={styles.calibrationButtonText}>
                                  {this.state.textAction}
                                </RNText>
                                {this.state.selectedMenu === 2 &&
                                    this.state.textAction === 'Stop' && (
                                        <RNText style={styles.countdownText}>
                                          {this.state.countDownTimer}
                                        </RNText>
                                    )}
                              </TouchableOpacity>
                            </Col>
                          </Grid>
                        </View>
                    )}
                  </View>
                </View>
              </>
          )}
        </ScrollView>
    );
  }
}

class BalanceButton extends React.PureComponent {
  render() {
    return (
        <TouchableOpacity
            style={styles.balanceButtonContainer}
            onPress={this.props.onPress}>
          <View style={styles.balanceButton}>
            <Text>{this.props.bntName}</Text>
          </View>
        </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    justifyContent: 'flex-start'
  },

  radarContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 0,
    flex: 0.55,
  },

  balanceGradeContainer: {
    marginVertical: 5, // Reduced spacing
    paddingHorizontal: 10, // Reduced width
    // paddingVertical: 8, // Reduced height
    paddingTop: 8,
    paddingBottom: 13,
    backgroundColor: '#ffffff',
    borderRadius: 10, // Smaller radius
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
    flex: 0.15, // Much smaller space allocation
    alignSelf: 'center', // Center the card
    width: '85%', // Reduced width to 85% of container
  },
  scoreStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6, // Reduced spacing
  },
  scoreSection: {
    alignItems: 'center',
    flex: 1,
  },
  statusSection: {
    alignItems: 'center',
    flex: 1,
  },
  sectionLabel: {
    fontSize: 10, // Smaller font
    color: '#666',
    marginBottom: 3, // Reduced spacing
    fontWeight: '500',
  },
  scoreBadge: {
    paddingHorizontal: 8, // Reduced padding
    paddingVertical: 4, // Reduced padding
    borderRadius: 15, // Smaller radius
    minWidth: 50, // Smaller width
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8, // Reduced padding
    paddingVertical: 4, // Reduced padding
    borderRadius: 15, // Smaller radius
    minWidth: 60, // Smaller width
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 14, // Smaller font
    fontWeight: 'bold',
    color: '#fff',
  },
  statusText: {
    fontSize: 12, // Smaller font
    fontWeight: '600',
    color: '#fff',
  },
  progressContainer: {
    marginTop: 5, // Reduced spacing
  },
  progressBarBackground: {
    height: 4, // Thinner progress bar
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  descriptionText: {
    fontSize: 10, // Smaller font
    color: '#495057',
    textAlign: 'center',
    marginTop: 5, // Reduced spacing
    fontStyle: 'italic',
    lineHeight: 14, // Tighter line height
  },

  // Buttons styles - More Space
  buttonsContainer: {
    marginTop: 10,
    marginBottom: 10,
    flex: 0.18, // Control button space
  },
  buttonsGrid: {
    paddingHorizontal: 10,
  },
  balanceButtonContainer: {
    paddingHorizontal: 8,
    flex: 1,
  },
  balanceButton: {
    padding: 12,
    backgroundColor: '#d2afa8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Record button styles - More Space
  recordButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 2,

  },

  // Calibration buttons styles
  calibrationButtonsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 0.12,
  },
  calibrationButton: {
    marginHorizontal: 10,
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calibrationButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  countdownText: {
    fontSize: 18,
    color: '#FF4433',
    fontWeight: '700',
  },
});

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