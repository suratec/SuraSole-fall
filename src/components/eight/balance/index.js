//5.11.62

import React, { Component } from 'react';
import {
  View,
  Image,
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

import { Col, Grid } from '../../common/NativeBaseShim';
import { connect } from 'react-redux';

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
import { TabHeading } from '../../common/NativeBaseShim';

import BalanceLang from '../../../assets/language/menu/lang_balance';
import Lang from '../../../assets/language/menu/lang_record';
import LangHome from '../../../assets/language/screen/lang_home';
import { getLocalizedText } from '../../../assets/language/langUtils';

const RNFS = require('react-native-fs');

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

  lsensor = [0, 0, 0, 0, 0, 0, 0, 0];
  rsensor = [0, 0, 0, 0, 0, 0, 0, 0];

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
    isRecording: false,
    lstage: 0,
    rstage: 0,
    xPosN: 150,
    yPosN: 150,
    focus: true,
    lphase: 0,
    rphase: 0,
    rsensor: [0, 0, 0, 0, 0, 0, 0, 0],
    lsensor: [0, 0, 0, 0, 0, 0, 0, 0],
    shouldVibrate: false,
    score: 0,
    balance: 0, // Keep original balance calculation
    txt: '',
    status: getLocalizedText(this.props.lang, BalanceLang.waiting),
    isConnected: true,
    peripherals: new Map(),
    notiAlarm: 0,
    shoeSize: 0,
  };

  // Helper methods for balance grade colors
  getScoreColor = (score) => {
    if (score >= 80) return '#28a745'; // Green for good
    if (score >= 40) return '#ffc107'; // Yellow for medium
    return '#dc3545'; // Red for bad
  };

  getStatusColor = (status) => {
    const englishGood = getLocalizedText(false, BalanceLang.good);
    const englishMedium = getLocalizedText(false, BalanceLang.medium);
    const englishPoor = getLocalizedText(false, BalanceLang.poor);

    if (status === englishGood || status === getLocalizedText(this.props.lang, BalanceLang.good) || status.toLowerCase() === 'good') {
      return '#28a745';
    }
    if (status === englishMedium || status === getLocalizedText(this.props.lang, BalanceLang.medium) || status.toLowerCase() === 'medium') {
      return '#ffc107';
    }
    if (status === englishPoor || status === getLocalizedText(this.props.lang, BalanceLang.poor) || status.toLowerCase() === 'poor' || status.toLowerCase() === 'bad') {
      return '#dc3545';
    }
    return '#6c757d';
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
    noti !== null ? this.setState({ notiAlarm: parseInt(noti) }) : 100;
    NetInfo.addEventListener(this.handleConnectivityChange);
    const { navigation } = this.props;
    this.focusListener = navigation.addListener('focus', () => {
      this.retrieveConnected();
      this.startReading();
      this.setState({ focus: true });
    });
    this.zoneInterval = setInterval(() => {
      var score =
          (this.state.balance + Number.parseInt(this.state.score)) / this.counter;
      this.setState({ score: score.toFixed(0) }, () => this.counter++);
    }, 1000);
  };

  getRecordButtonLabel = () => {
  const { isRecording } = this.state;

  // Define appropriate keys in BalanceLang: recordButton & stopButton
  const labelKey = isRecording
    ? BalanceLang.stopButton   // e.g. { eng: 'Stop', thai: 'หยุด', ... }
    : BalanceLang.recordButton; // e.g. { eng: 'Record', thai: 'บันทึก', ... }

  return getLocalizedText(this.props.lang, labelKey);
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
                this.setState({ peripherals });
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
        // console.log('No connected peripherals');
      }
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

  async startReading() {
    this.dataRecord = bleManagerEmitter.addListener(
        'BleManagerDidUpdateValueForCharacteristic',
        ({ value, peripheral, characteristic, service }) => {
          let time = new Date();
          if (peripheral === this.props.rightDevice) {
            let rsensor = this.toDecimalArray(value);
            this.recordData(rsensor, 'R');
            if (time - this.rtime > 250) {
              let lsensor = this.state.lsensor;
              let shouldVibrate = this.shouldBeVibration(lsensor);
              let sumright =
                  (rsensor[0] + rsensor[1] + rsensor[2] + rsensor[3] + rsensor[4]) /
                  5 +
                  (rsensor[5] + rsensor[6]) / 2 +
                  rsensor[7];
              let sumleft =
                  (lsensor[0] + lsensor[1] + lsensor[2] + lsensor[3] + lsensor[4]) /
                  5 +
                  (lsensor[5] + lsensor[6]) / 2 +
                  lsensor[7];
              let sumup =
                  (rsensor[0] + rsensor[1] + rsensor[2] + rsensor[3] + rsensor[4]) /
                  5 +
                  (lsensor[0] + lsensor[1] + lsensor[2] + lsensor[3] + lsensor[4]) /
                  5;
              let sumdown = lsensor[7] + rsensor[7];
              let xPos = (sumright - sumleft) / 23.4;
              let yPos = (sumup - sumdown) / -15.6;
              let xPosN = (xPos + 100) * 1.5;
              let yPosN = (yPos + 100) * 1.5;
              let rphase = rsensor.reduce((a, b) => a + b, 0);
              let { txt, status, balance } = this.setStatus(xPos, yPos);
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
                  (rsensor[0] + rsensor[1] + rsensor[2] + rsensor[3] + rsensor[4]) /
                  5 +
                  (rsensor[5] + rsensor[6]) / 2 +
                  rsensor[7];
              let sumleft =
                  (lsensor[0] + lsensor[1] + lsensor[2] + lsensor[3] + lsensor[4]) /
                  5 +
                  (lsensor[5] + lsensor[6]) / 2 +
                  lsensor[7];
              let sumup =
                  (rsensor[0] + rsensor[1] + rsensor[2] + rsensor[3] + rsensor[4]) /
                  5 +
                  (lsensor[0] + lsensor[1] + lsensor[2] + lsensor[3] + lsensor[4]) /
                  5;
              let sumdown = lsensor[7] + rsensor[7];
              let xPos = (sumright - sumleft) / 23.4;
              let yPos = (sumup - sumdown) / -15.6;
              let xPosN = (xPos + 100) * 1.5;
              let yPosN = (yPos + 100) * 1.5;

              let lphase = lsensor.reduce((a, b) => a + b, 0);
              let { txt, status, balance } = this.setStatus(xPos, yPos);
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
        txt: getLocalizedText(this.props.lang, BalanceLang.goodBalance),
        status: getLocalizedText(this.props.lang, BalanceLang.good),
        balance: Math.round(100 - persent),
      };
    } else if (100 - persent >= 40) {
      return {
        txt: getLocalizedText(this.props.lang, BalanceLang.mediumBalance),
        status: getLocalizedText(this.props.lang, BalanceLang.medium),
        balance: Math.round(100 - persent),
      };
    } else {
      return {
        txt: getLocalizedText(this.props.lang, BalanceLang.badBalance),
        status: getLocalizedText(this.props.lang, BalanceLang.poor),
        balance: Math.round(100 - persent),
      };
    }
  }


  handleConnectivityChange = status => {
    this.setState({ isConnected: status.isConnected });
  };

  actionRecording = async () => {
  const { rightDevice, leftDevice, user } = this.props;
  const { isRecording } = this.state;

  // 1. Check connected devices
  if (typeof rightDevice === 'undefined' && typeof leftDevice === 'undefined') {
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
      ],
    );
    return;
  }

  // 2. Toggle logic is now purely boolean-based
  if (!isRecording) {
    // START recording
    this.setState({ isRecording: true });
    this.props.actionRecordingButton('Stop'); // or some neutral value like 'recording'

    let initTime = new Date();
    this.start = initTime;
    this.lastLtime = initTime;
    this.lastRtime = initTime;

    this.readInterval = setInterval(async () => {
      const time = new Date();
      const data = {
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
        id_customer: user.id_customer,
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
    // STOP recording
    this.setState({ isRecording: false });
    this.props.actionRecordingButton('Record'); // or 'idle'

    clearInterval(this.readInterval);
    this.sendDataToSetver();  // still shows alert in correct language
  }
};


  // actionRecording = async () => {
  //   if (
  //       typeof this.props.rightDevice === 'undefined' &&
  //       typeof this.props.leftDevice === 'undefined'
  //   ) {
  //     Alert.alert(
  //         getLocalizedText(this.props.lang, BalanceLang.warning),
  //         getLocalizedText(this.props.lang, BalanceLang.bluetoothAlert),
  //         [
  //           {
  //             text: 'OK',
  //             onPress: () => {
  //               this.props.navigation.navigate('Device', {
  //                 name: this.props.lang
  //                     ? LangHome.addDeviceButton.thai
  //                     : LangHome.addDeviceButton.eng,
  //               });
  //             },
  //           },
  //         ]);
  //     return;
  //   }
  //   if (this.state.textAction == 'Record') {
  //     this.setState({textAction: 'Stop'});
  //     this.props.actionRecordingButton('Stop');
  //     let initTime = new Date();
  //     this.start = initTime;
  //     this.lastLtime = initTime;
  //     this.lastRtime = initTime;
  //     this.readInterval = setInterval(async () => {
  //       time = new Date();
  //       data = {
  //         stamp: time.getTime(),
  //         timestamp: time,
  //         duration: Math.floor((time - this.start) / 1000),
  //         left: {
  //           sensor: this.lsensor,
  //           swing: this.leftSwingTime,
  //           stance: this.leftStanceTime,
  //         },
  //         right: {
  //           sensor: this.rsensor,
  //           swing: this.rightSwingTime,
  //           stance: this.rightStanceTime,
  //         },
  //         id_customer: this.props.user.id_customer,
  //       };
  //       try {
  //         await await RNFS.appendFile(
  //             RNFS.CachesDirectoryPath +
  //             '/suratechM/' +
  //             this.start.getFullYear() +
  //             this.start.getMonth() +
  //             this.start.getDate() +
  //             this.round,
  //             JSON.stringify(data) + ',',
  //         );
  //       } catch {
  //         await RNFS.mkdir(RNFS.CachesDirectoryPath + '/suratechM/');
  //         await RNFS.appendFile(
  //             RNFS.CachesDirectoryPath +
  //             '/suratechM/' +
  //             this.start.getFullYear() +
  //             this.start.getMonth() +
  //             this.start.getDate() +
  //             this.round,
  //             JSON.stringify(data) + ',',
  //         );
  //       }
  //     }, 100);
  //   } else {
  //     this.setState({textAction: 'Record'});
  //     this.props.actionRecordingButton('Record');
  //     clearInterval(this.readInterval);
  //     this.sendDataToSetver();
  //   }
  // };





  sendDataToSetver = () => {
    this.state.isConnected == false
        ? RNFS.readDir(RNFS.CachesDirectoryPath + '/suratechM/').then(res => {
          res.forEach(r => {
            console.log(r.path);
          });
        })
        : RNFS.readDir(RNFS.CachesDirectoryPath + '/suratechM/').then(res => {
          res.forEach(r => {
            console.log(r.path, 'path');
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
                    leg_type: ''
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
                            }),
                          })
                              .then(resp1 => {
                                console.log('============API Response============');
                                return resp1.json();
                              })
                              .then(resp1 => {
                                fetch(`${API}member/get_user_data`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    id: this.props.user.id_customer,
                                    ...resp1
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
                              })
                              .catch(err => {
                                console.log(err);
                                this.setState({ isLoading: false });
                                Toast.show('Something went wrong. Please Try again!!!');
                              });
                        }
                      });
                })
                .catch(e => { });
          });
        });
    alert(getLocalizedText(this.props.lang, Lang.alert));
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
                getLocalizedText(this.state.lang, Lang.successTitle),
                getLocalizedText(this.state.lang, Lang.successBody),
            );
            deleteFile(this.fileStamp_n);
          } else {
            AlertFix.alertBasic(
                getLocalizedText(this.state.lang, Lang.errorTitle),
                getLocalizedText(this.state.lang, Lang.errorBody1),
            );
          }
        })
        .catch(error => {
          AlertFix.alertBasic(
              getLocalizedText(this.state.lang, Lang.errorTitle),
              getLocalizedText(this.state.lang, Lang.errorBody2),
          );
        });
  };

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
    return (
        <View style={styles.container}>
          <HeaderFix
              icon_left={'left'}
              onpress_left={() => {
                this.props.navigation.goBack();
              }}
              title={this.props.route.params?.['name'] ?? ''}
          />

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

            {/* Enhanced Balance Grade Display - Positioned Much Lower & Smaller */}
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
                        this.props.navigation.navigate('LeftFootsEight');
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
                        this.props.navigation.navigate('RigthFootsEight');
                      }}
                  />
                </Col>
              </Grid>
            </View>


            {/* Record button - Fixed Spacing */}
            <View style={styles.recordButtonContainer}>
              <ButtonFix
                  action={true}
                  rounded={true}
                  title={this.getRecordButtonLabel()}
                  onPress={() => this.actionRecording()}
              />
            </View>
          </View>
        </View>
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
    paddingTop: 20,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },

  // Radar chart styles - More Space
  radarContainer: {
    alignItems: 'center',
    marginTop: 70,
    marginBottom: 30, // Increased space after radar chart
    flex: 0.5, // Increased chart space
  },

  // Balance grade styles - Positioned Much Lower & Smaller Size
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
    flex: 0.08,
    marginTop: -5,
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
      return dispatch({ type: 'ADD_LEFT_DEVICE', payload: device });
    },
    addRightDevice: device => {
      return dispatch({ type: 'ADD_RIGHT_DEVICE', payload: device });
    },
    addDashBoardData: data => {
      return dispatch({ type: 'ADD_BLUETOOTH_DATA', payload: data });
    },
    actionRecordingButton: data => {
      return dispatch({ type: 'ACTION_BUTTON_RECORD', payload: data });
    },
    actionNotificationButton: data => {
      return dispatch({ type: 'ACTION_BUTTON_NOTIFICATION', payload: data });
    },
    productID: data => {
      return dispatch({ type: 'PRODUCT_ID', payload: data });
    },
  };
};

export default connect(mapStateToProps, mapDisPatchToProps)(index);