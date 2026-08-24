//5.11.62

import React, {Component} from 'react';


import NetInfo from '@react-native-community/netinfo';
import {
  View,
  ScrollView,
  NativeModules,
  NativeEventEmitter,
  Alert,
  Platform,
  ToastAndroid,
} from 'react-native';
import {Card} from '../../common/NativeBaseShim';
import {Col, Grid} from '../../common/NativeBaseShim';
import {connect} from 'react-redux';
import {
  FileManager,
  getFileList,
  deleteFile,
  readFile,
} from '../../../FileManager';

import HeaderFix from '../../common/HeaderFix';
import Text from '../../common/TextFix';
import RecordStopButton from '../../common/RecordStopButton';
import Chart from './chart';
import AlertFix from '../../common/AlertsFix';
import API from '../../../config/Api';
import {refreshUserDashboard} from '../../../services/assessmentUploadApi';
import BleManager from 'react-native-ble-manager';

import Lang from '../../../assets/language//menu/lang_record';
import LangHome from '../../../assets/language/screen/lang_home';
import lang_gail from '../../../assets/language/menu/lang_gail'; // Import the language file
import {set} from 'lodash';
import {getLocalizedText} from "../../../assets/language/langUtils";

var RNFS = require('react-native-fs');

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const TIMER = 100;
const TIMER_BIG = 1;

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

  lsensor = [0, 0, 0, 0, 0, 0, 0, 0];
  rsensor = [0, 0, 0, 0, 0, 0, 0, 0];

  lastLtime = new Date();
  lastRtime = new Date();

  start = new Date();
  readDelay = new Date();

  ltime = new Date();
  rtime = new Date();

  round = Math.floor(1000 + Math.random() * 9000);

  dataBuffer = []; // Buffer for sensor data to reduce file I/O

  state = {
    textAction: 'Record',
    lsensor: [0, 0, 0, 0, 0, 0, 0, 0],
    rsensor: [0, 0, 0, 0, 0, 0, 0, 0],
    lstage: 0,
    rstage: 0,
    isConnected: true,
    peripherals: new Map(),
  };

  componentDidMount = () => {
    NetInfo.addEventListener(this.handleConnectivityChange);
    const { navigation } = this.props;
    this.focusListener = navigation.addListener('focus', () => {
      this.retrieveConnected();
      this.startReading();
    });
    
    this.retrieveConnected();
    this.startReading();
    // Set initial button text with proper translation
    this.setState({
      textAction: getLocalizedText(this.props.lang, lang_gail.recordButton)
    });
      this.currentSessionId = Date.now().toString();
  };

  componentWillUnmount = () => {
    clearInterval(this.readInterval);
    clearInterval(this.flushInterval);
    this.flushBufferToDisk(); // Flush remaining data before unmount
    if (this.dataRecord) {
      this.dataRecord.remove();
    }
    if (typeof this.focusListener === 'function') {
      this.focusListener();
    } else if (this.focusListener && typeof this.focusListener.remove === 'function') {
      this.focusListener.remove();
    }
  };

  calMeasurePressure = value => {
    return 2.206 * Math.exp(0.0068 * value);
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
            } else if (peripheral.name[peripheral.name.length - 1] === 'R') {
              this.props.addRightDevice(peripheral.id);
            }
            console.log('Connected to ' + peripheral.id);

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

                  setTimeout(() => {
                    BleManager.startNotification(
                      peripheral.id,
                      service,
                      bakeCharacteristic,
                    )
                      .then(() => {
                        console.log('Started notification on ' + peripheral.id);
                        setTimeout(() => {
                          BleManager.write(
                            peripheral.id,
                            service,
                            crustCharacteristic,
                            [0],
                          ).then(() => {
                            console.log('Writed NORMAL crust');
                            BleManager.write(
                              peripheral.id,
                              service,
                              bakeCharacteristic,
                              [1, 95],
                            ).then(() => {
                              console.log(
                                'Writed 351 temperature, the pizza should be BAKED',
                              );
                            });
                          });
                        }, 500);
                      })
                      .catch(error => {
                        console.log('Notification error', error);
                      });
                  }, 200);
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
    // Clear existing listener if any (prevent multiple listeners)
    if (this.dataRecord) {
      this.dataRecord.remove();
    }
    
    // Clear existing interval if any (prevent multiple intervals when switching modules)
    if (this.readInterval) {
      clearInterval(this.readInterval);
    clearInterval(this.flushInterval);
    this.flushBufferToDisk(); // Flush remaining data before unmount
    }
    
    // Sync with Redux recording state - don't auto-start recording
    if (typeof this.props.record !== 'undefined') {
      if (this.props.record === 'Stop') {
        this.setState({textAction: getLocalizedText(this.props.lang, lang_gail.stopButton)});
      this.currentSessionId = Date.now().toString();
        // Don't auto-start recording, just sync the UI
      } else {
        this.setState({textAction: getLocalizedText(this.props.lang, lang_gail.recordButton)});
      this.currentSessionId = Date.now().toString();
      }
    } else {
      this.props.actionRecordingButton('Record');
      this.setState({textAction: getLocalizedText(this.props.lang, lang_gail.recordButton)});
      this.currentSessionId = Date.now().toString();
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
      this.currentSessionId = Date.now().toString();
      this.props.actionRecordingButton('Stop');
      let initTime = new Date();
      this.start = initTime;
      this.lastLTime = initTime;
      this.lastRTime = initTime;
      this.readInterval = setInterval(async () => {
        // console.log('=======L==========');
        // console.log(this.lsensor);
        // console.log('=======R==========');
        // console.log(this.rsensor);
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
          session_id: this.currentSessionId || Date.now().toString(),
        };
        if (!Array.isArray(this.dataBuffer)) {
          this.dataBuffer = [];
        }
        this.dataBuffer.push(data);
      }, 100);

      // Flush buffer to disk every 2 seconds instead of every 100ms
      this.flushInterval = setInterval(() => {
        this.flushBufferToDisk();
      }, 2000);
    } else {
      this.setState({textAction: getLocalizedText(this.props.lang, lang_gail.recordButton)});
      this.currentSessionId = Date.now().toString();
      this.props.actionRecordingButton('Record');
      clearInterval(this.readInterval);
    clearInterval(this.flushInterval);
    this.flushBufferToDisk(); // Flush remaining data before unmount
      this.sendDataToSetver();
    }
  };

  async flushBufferToDisk() {
    if (!Array.isArray(this.dataBuffer) || this.dataBuffer.length === 0 || !this.start) return;
    const toFlush = this.dataBuffer.splice(0); // Take all and clear
    const filePath =
      RNFS.CachesDirectoryPath +
      '/suratechM/' +
      this.start.getFullYear() +
      this.start.getMonth() +
      this.start.getDate() +
      this.round;
    const chunk = toFlush.map(d => JSON.stringify(d)).join(',') + ',';
    try {
      await RNFS.appendFile(filePath, chunk);
    } catch {
      await RNFS.mkdir(RNFS.CachesDirectoryPath + '/suratechM/');
      await RNFS.appendFile(filePath, chunk);
    }
  }

    async sendDataToSetver() {
    try {
      const dirPath = RNFS.CachesDirectoryPath + '/suratechM/';
      const files = await RNFS.readDir(dirPath);

      if (!this.state.isConnected) {
        console.log('WiFi is not connected');
        files.forEach(r => console.log(r.path));
        ToastAndroid.show(this.props.lang ? Lang.alert.thai : Lang.alert.eng, ToastAndroid.SHORT);
        return;
      }

      for (const r of files) {
        console.log(r.path);
        try {
          const text = await RNFS.readFile(r.path);
          let rawText = text.trim();
          if (rawText.endsWith(',')) rawText = rawText.slice(0, -1);

          let data = JSON.parse('[' + rawText + ']');
          if (!data || data.length === 0) {
            await RNFS.unlink(r.path); // Remove empty files
            continue;
          }

          const content = {
            data: data,
            id_customer: data[0].id_customer || this.props.user.id_customer,
            session_id: this.currentSessionId || Date.now().toString(),
            id_device: '',
            type: 1, // for medical
            product_number: this.props.productNumber,
            bluetooth_left_id: this.props.leftDevice, // Fixed swapped Left/Right mapping
            bluetooth_right_id: this.props.rightDevice,
          };

          const addRespRaw = await fetch(`${API}/addjson`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(content),
          });

          const addResp = JSON.parse(await addRespRaw.text());

          if (addResp.status !== 'ผิดพลาด') {
            console.log(`Clear : ${r.path}`);
            await RNFS.unlink(r.path);

            await refreshUserDashboard(this.props.user.id_customer);
          }
        } catch (e) {
          console.error(`Error processing file ${r.path}:`, e);
          this.setState({ isLoading: false });
          ToastAndroid.show('Something went wrong. Please Try again!!!', ToastAndroid.SHORT);
        }
      }
    } catch (e) {
      console.log('Error reading directory:', e);
    }

    ToastAndroid.show(this.props.lang ? Lang.alert.thai : Lang.alert.eng, ToastAndroid.SHORT);
  }

  actionUpdate = data => {
    console.log('Update =>');

    // console.log('Delete =>' + this.fileStamp_n)
    // deleteFile(this.fileStamp_n)

    console.log('Update =>');

    let content = {
      data: data,
      id_customer: this.props.user.id_customer,
          session_id: this.currentSessionId || Date.now().toString(),
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
          title={this.props.route.params?.['name'] ?? ''}
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
          <RecordStopButton
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
  };
};

export default connect(mapStateToProps, mapDisPatchToProps)(index);
