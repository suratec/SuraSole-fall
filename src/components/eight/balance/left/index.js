//5.11.62

import React, {Component} from 'react';
import {
  View,
  ScrollView,
  NativeModules,
  NativeEventEmitter,
  Vibration,
  Alert,
  Text as RNText,
  Dimensions,
  StyleSheet,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Card} from 'native-base';
import {Col, Grid} from 'react-native-easy-grid';
import {connect} from 'react-redux';

import HeaderFix from '../../../common/HeaderFix';
import NotificationsState from '../../../shared/Notification';
import Text from '../../../common/TextFix';
import ButtonFix from '../../../common/ButtonFix';
import RadarChartFix from '../../../common/RadarChartFix';
import CardStatusFix from '../../../common/CardStatusFix';
import AlertFix from '../../../common/AlertsFix';
import ScoreFix from '../../../common/ScoreFix';
import API from '../../../../config/Api';
import {getLocalizedText} from '../../../../assets/language/langUtils';

import {
  FileManager,
  getFileList,
  deleteFile,
  readFile,
} from '../../../../FileManager';

import BleManager from 'react-native-ble-manager';

import BalanceLang from '../../../../assets/language/menu/lang_balance';
import Lang from '../../../../assets/language/menu/lang_record';
import LangHome from '../../../../assets/language/screen/lang_home';

var RNFS = require('react-native-fs');

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
const { width, height } = Dimensions.get('window');

const TIMER_BIG = 1;
const TIMER = 100;
const Duration = 1500;

class index extends Component {
  leftPhase = 0;
  rightPhase = 0;
  durationTime = 0;
  leftSwingTime = 0;
  rightSwingTime = 0;
  leftStanceTime = 0;
  rightStanceTime = 0;

  ltime = new Date();
  rtime = new Date();

  readDelay = new Date();
  start = new Date();
  lastLtime = new Date();
  lastRtime = new Date();

  lsensor = [0, 0, 0, 0, 0, 0, 0, 0];
  rsensor = [0, 0, 0, 0, 0, 0, 0, 0];

  round = Math.floor(1000 + Math.random() * 9000);

  inZone = true;

  state = {
    textAction: 'Record',
    rightsensor: [0, 0, 0, 0, 0, 0, 0, 0],
    rstage: 0,
    leftsensor: [0, 0, 0, 0, 0, 0, 0, 0],
    lstage: 0,
    xPosN: 150,
    yPosN: 150,
    shouldVibrate: false,
    status: 'waiting',
    txt: '',
    balance: 0,
    score: 0,
    isConnected: true,
    notiAlarm: 0,
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

  componentDidMount = async () => {
    // notiAlarm
    let noti = await AsyncStorage.getItem('notiSetting');
    noti !== null ? this.setState({notiAlarm: parseInt(noti)}) : 100;
    NetInfo.addEventListener(this.handleConnectivityChange);

    this.startReading();
    if (typeof this.props.leftDevice !== 'undefined') {
      this.zoneInterval = setInterval(() => {
        this.setState({score: this.state.score + 1});
      }, 1000);
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

  toKilo = value => {
    return (5.6 * 10 ** -4 * Math.exp(value / 53.36) + 6.72) / 0.796;
  };

  shouldBeVibration = sensor => {
    for (let i = 0; i < sensor.length; i++) {
      if (this.toKilo(sensor[i]) > this.props.user.weight * 0.3) {
        this.setState({shouldVibrate: true});
        return;
      }
    }
    this.setState({shouldVibrate: false});
  };

  componentWillUnmount = () => {
    clearInterval(this.readInterval);
    clearInterval(this.zoneInterval);
    if (this.dataRecord) {
      this.dataRecord.remove();
    }
  };

  findCoordinate(sensor) {
    console.log(sensor);
    return {
      xPos: sensor[2] - sensor[4],
      yPos: ((sensor[2] + sensor[4]) / 2) - sensor[7],
    };
  }

  toDecimalArray(byteArray) {
    let dec = [];
    for (let i = 0; i < byteArray.length - 1; i += 2) {
      dec.push(byteArray[i] * 255 + byteArray[i + 1]);
    }
    return dec;
  }

  setStatus(x, y) {
    let persent = 0;
    if (x > y) {
      persent = Math.abs(x);
    } else {
      persent = Math.abs(y);
    }
    if (100 - persent >= 80) {
      if (!this.inZone) {
        this.zoneInterval = setInterval(() => {
          this.setState({score: this.state.score + 1});
        }, 1000);
        this.inZone = true;
      }
      this.setState({
        txt: getLocalizedText(this.props.lang, BalanceLang.goodBalance),
        status: 'Good',
        balance: Math.round(100 - persent),
      });
    } else if (100 - persent >= 40) {
      if (this.inZone) {
        clearInterval(this.zoneInterval);
        this.inZone = false;
      }
      this.setState({
        txt: getLocalizedText(this.props.lang, BalanceLang.mediumBalance),
        status: 'Medium',
        balance: Math.round(100 - persent),
      });
    } else {
      if (this.inZone) {
        clearInterval(this.zoneInterval);
        this.inZone = false;
      }
      this.setState({
        txt: getLocalizedText(this.props.lang, BalanceLang.badBalance),
        status: 'Bad',
        balance: Math.round(100 - persent),
      });
    }
  }

  async startReading() {
    let service;
    let characteristicN;
    if (typeof this.props.record !== 'undefined') {
      if (this.props.record === 'Stop') {
        this.actionRecording();
      }
    } else {
      this.props.actionRecordingButton('Record');
      this.setState({textAction: 'Record'});
    }
    if (Platform.OS === 'android') {
      service = '0000FFE0-0000-1000-8000-00805F9B34FB';
      characteristicN = '0000FFE1-0000-1000-8000-00805F9B34FB';
    } else {
      service = 'FFE0';
      characteristicN = 'FFE1';
    }
    if (typeof this.props.rightDevice !== 'undefined') {
      await BleManager.retrieveServices(this.props.rightDevice);
    }
    if (typeof this.props.leftDevice !== 'undefined') {
      await BleManager.retrieveServices(this.props.leftDevice);
    }
    this.dataRecord = bleManagerEmitter.addListener(
        'BleManagerDidUpdateValueForCharacteristic',
        ({value, peripheral, characteristic, service}) => {
          let time = new Date();
          if (peripheral === this.props.leftDevice) {
            leftsensor = this.toDecimalArray(value);
            this.recordData(leftsensor, 'L');
            if (time - this.ltime > 333) {
              this.shouldBeVibration(leftsensor);
              let {xPos, yPos} = this.findCoordinate(leftsensor);
              xPos = xPos / 7.8;
              yPos = yPos / -7.8;
              let xPosN = (xPos + 100) * 1.5;
              let yPosN = (yPos + 100) * 1.5;
              this.setStatus(xPos, yPos);
              this.leftPhase = leftsensor.reduce((a, b) => a + b, 0);
              this.setState({leftsensor, xPosN, yPosN});
              this.ltime = time;
            }
          }
          if (peripheral === this.props.rightDevice) {
            rightsensor = this.toDecimalArray(value);
            this.recordData(rightsensor, 'R');
            if (time - this.rtime > 333) {
              this.rightPhase = rightsensor.reduce((a, b) => a + b, 0);
              this.setState({rightsensor});
              this.rtime = time;
            }
          }
        },
    );
  }

  recordData(data, sensor) {
    if (sensor == 'L') {
      this.lsensor = data;
      if (this.props.noti === true) {
        this.measurePressure(data);
      }
    } else {
      this.rsensor = data;
    }
  }

  handleConnectivityChange = status => {
    this.setState({isConnected: status.isConnected});
    console.log(`Wifi Status : ${this.state.isConnected}`);
  };

  actionRecording = async () => {
    if (
        typeof this.props.rightDevice === 'undefined' &&
        typeof this.props.leftDevice === 'undefined'
    ) {
      Alert.alert('Warning !', 'Please Check Your Bluetooth Connect', [
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
                  fetch(`${API}/adljson`, {
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
                                return  resp1.json();
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
                .catch(e => {});
          });
        });
    alert(this.props.lang ? Lang.alert.thai : Lang.alert.eng);
  }

  actionUpdate = content => {
    console.log('Update =>');

    content = {
      data: content,
      id_customer: this.props.user.id_customer,
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
        .then(res => res.json())
        .then(res => {
          console.log('res => ');
          console.log(res);
          if (res.status === 'สำเร็จ') {
            AlertFix.alertBasic(
                getLocalizedText(this.props.lang, Lang.successTitle),
                getLocalizedText(this.props.lang, Lang.successBody),
            );
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
              title={getLocalizedText(this.props.lang, BalanceLang.leftFootBalance)}
          />

          {/* Main Content Container - Optimized for No Scrolling */}
          <View style={styles.mainContentContainer}>

            {/* Radar Chart Section - More Space */}
            <View style={styles.radarContainer}>
              <RadarChartFix xPos={this.state.xPosN} yPos={this.state.yPosN} />
            </View>

            {/* Enhanced Balance Grade Display - Positioned Much Lower & Smaller */}
            <View style={styles.balanceGradeContainer}>
              {/* Score and Status Row */}
              <View style={styles.scoreStatusRow}>
                {/* Balance Score */}
                <View style={styles.scoreSection}>
                  <RNText style={styles.sectionLabel}>Score</RNText>
                  <View style={[styles.scoreBadge, { backgroundColor: this.getScoreColor(this.state.balance) }]}>
                    <RNText style={styles.scoreText}>{this.state.balance}%</RNText>
                  </View>
                </View>

                {/* Status Badge */}
                <View style={styles.statusSection}>
                  <RNText style={styles.sectionLabel}>Status</RNText>
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

            {/* Time in Zone Display */}
            <View style={styles.timeInZoneContainer}>
              <RNText style={styles.timeInZoneLabel}>Time in Zone</RNText>
              <RNText style={styles.timeInZoneValue}>{this.state.score}s</RNText>
            </View>

            {/* Record button - Fixed Spacing */}
            <View style={styles.recordButtonContainer}>
              <ButtonFix
                  action={true}
                  rounded={true}
                  title={this.state.textAction}
                  onPress={() => this.actionRecording()}
              />
            </View>
          </View>
        </View>
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
    marginTop: 10,
    marginBottom: 30, // Increased space after radar chart
    flex: 0.45, // Chart space
  },

  // Balance grade styles - Positioned Much Lower & Smaller Size
  balanceGradeContainer: {
    marginVertical: 5, // Reduced spacing
    paddingHorizontal: 10, // Reduced width
    paddingVertical: 8, // Reduced height
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

  // Time in Zone styles
  timeInZoneContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginVertical: 10,
    alignItems: 'center',
    flex: 0.12,
    justifyContent: 'center',
  },
  timeInZoneLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 3,
  },
  timeInZoneValue: {
    fontSize: 18,
    color: '#007bff',
    fontWeight: 'bold',
  },

  // Record button styles - More Space
  recordButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 0.18, // Control record button space
  },
});

const mapStateToProps = state => {
  return {
    user: state.user,
    leftDevice: state.leftDevice,
    rightDevice: state.rightDevice,
    lang: state.lang,
    record: state.record,
    noti: state.noti,
    productNumber: state.productNumber,
  };
};

const mapDisPatchToProps = dispatch => {
  return {
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