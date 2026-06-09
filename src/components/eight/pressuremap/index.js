import React, {Component} from 'react';
import { ToastAndroid } from 'react-native';

import {
  Image,
  NativeModules,
  NativeEventEmitter,
  Platform,
  Vibration,
  Alert,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {Col, Grid} from '../../common/NativeBaseShim';
import {connect} from 'react-redux';

import NotificationsState from '../../shared/Notification';
import Text from '../../common/TextFix';
import PressureMapLayout from '../../common/PressureMapLayout';
import API from '../../../config/Api';

import BleManager from 'react-native-ble-manager';

import Lang from '../../../assets/language/menu/lang_record';
import LangHome from '../../../assets/language/screen/lang_home';
import {getLocalizedText} from '../../../assets/language/langUtils';
import Lang_pressuremap from "../../../assets/language/menu/lang_pressuremap";

var RNFS = require('react-native-fs');

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

import { uploadRecordingFiles } from '../../../services/pressureDataApi';
import {
  toDecimalArray,
  calMeasurePressure,
  findLeftContourArray,
  findRightContourArray,
  toKilo,
} from '../../../utils/eightSensorUtils';

const isAddJsonSuccess = (response, body) => {
  if (!response.ok) return false;
  if (body?.success === true || body?.status === true) return true;

  const status = String(body?.status ?? '').trim();
  const normalizedStatus = status.toLowerCase();

  return (
    normalizedStatus === 'ok' ||
    normalizedStatus === 'success' ||
    normalizedStatus.includes('success') ||
    status.includes('สำเร็จ')
  );
};

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

  lsensor = [0, 0, 0, 0, 0, 0, 0, 0];
  rsensor = [0, 0, 0, 0, 0, 0, 0, 0];

  round = 0;
  dataBuffer = [];

  ltime = new Date();
  rtime = new Date();

  state = {
    switch: false,
    textAction: 'Record',
    ps_x: 0,
    ps_y: 0,
    loading: false,
    leftsensor: [0, 0, 0, 0, 0, 0, 0, 0],
    rightsensor: [0, 0, 0, 0, 0, 0, 0, 0],
    lstage: 0,
    rstage: 0,
    shouldVibrate: false,
    leftData: [],
    rightData: [],
    isConnected: true,
    peripherals: new Map(),
    notiAlarm: 0,
    shoeSize:0,
  };

  measurePressure = sensor => {
    for (let i = 0; i < sensor.length; i++) {
      if (calMeasurePressure(sensor[i]) > this.state.notiAlarm) {
        // Vibration.vibrate(100);
        return;
      }
    }
  };



  updateState(stage, value, side) {
    if (side === 'LEFT') {
      this.setState({lstage: stage, leftsensor: toDecimalArray(value)});
    } else if (side === 'RIGHT') {
      this.setState({rstage: stage, rightsensor: toDecimalArray(value)});
    }
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
        this.setState({ textAction: 'Stop' });
      this.currentSessionId = Date.now().toString();
        // Don't auto-start recording, just sync the UI
      } else {
        this.setState({ textAction: 'Record' });
      }
    } else {
      this.props.actionRecordingButton('Record');
      this.setState({ textAction: 'Record' });
    }
    
    this.dataRecord = bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      ({value, peripheral, characteristic, service}) => {
        let time = new Date();
        if (peripheral === this.props.leftDevice) {
          let leftsensor = toDecimalArray(value);
          this.recordData(leftsensor, 'L');
          if (time - this.ltime > 250) {
            let leftData = findLeftContourArray(leftsensor);
            this.leftPhase = leftsensor.reduce((a, b) => a + b, 0);
            this.setState({leftsensor, leftData});
            this.ltime = time;
          }
        }
        if (peripheral === this.props.rightDevice) {
          let rightsensor = toDecimalArray(value);
          this.recordData(rightsensor, 'R');
          if (time - this.rtime > 250) {
            let rightData = findRightContourArray(rightsensor);
            this.rightPhase = rightsensor.reduce((a, b) => a + b, 0);
            this.setState({rightsensor, rightData});
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



  // shouldBeVibration function removed - not needed for this component

  handleConnectivityChange = status => {
    this.setState({isConnected: status.isConnected});
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

  componentDidMount = async () => {
    let leftData = findLeftContourArray(this.state.leftsensor);
    let rightData = findRightContourArray(this.state.rightsensor);

    // checkInternet
    NetInfo.addEventListener(this.handleConnectivityChange);

    // notiAlarm
    let noti = await AsyncStorage.getItem('notiSetting');
    noti !== null ? this.setState({notiAlarm: parseInt(noti)}) : 100;

    this.retrieveConnected();
    this.startReading();
    this.setState({leftData, rightData});
  };

  componentWillUnmount = () => {
    console.log('============ componentWillUnmount ==============');
    clearInterval(this.readInterval);
    clearInterval(this.flushInterval);
    this.flushBufferToDisk(); // Flush remaining data before unmount
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
      this.setState({textAction: 'Stop'});
      this.currentSessionId = Date.now().toString();
      this.props.actionRecordingButton('Stop');
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
      this.setState({textAction: 'Record'});
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
        alert(this.props.lang ? Lang.alert.thai : Lang.alert.eng);
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
            shoe_size: this.state.shoeSize || 0,
          };
          console.log('addjson payload summary', {
            records: data.length,
            id_customer: content.id_customer,
            session_id: content.session_id,
            product_number: content.product_number,
            bluetooth_left_id: content.bluetooth_left_id,
            bluetooth_right_id: content.bluetooth_right_id,
            first_left_sensor: data[0]?.left?.sensor,
            first_right_sensor: data[0]?.right?.sensor,
          });

          const addRespRaw = await fetch(`${API}/addjson`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(content),
          });

          const addRespText = await addRespRaw.text();
          console.log('addjson HTTP', addRespRaw.status, addRespText.substring(0, 500));

          let addResp;
          try {
            addResp = JSON.parse(addRespText);
          } catch (parseError) {
            console.warn('addjson returned invalid JSON; keeping file:', r.path);
            continue;
          }

          if (isAddJsonSuccess(addRespRaw, addResp)) {
            console.log(`Clear : ${r.path}`);
            await RNFS.unlink(r.path);
          } else {
            console.warn('addjson did not confirm success; keeping file:', r.path, addResp);
            ToastAndroid.show('Upload failed. Keeping data for retry.', ToastAndroid.SHORT);
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

    alert(this.props.lang ? Lang.alert.thai : Lang.alert.eng);
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

  getButtonTitle = () => {
    return this.state.textAction === 'Record'
        ? getLocalizedText(this.props.lang, Lang_pressuremap.recordButton)
        : getLocalizedText(this.props.lang, Lang_pressuremap.stopButton);
  };

  render() {
    this.canVibration(this.state.shouldVibrate, this.state.switch);

    return (
      <PressureMapLayout
        title={this.props.route.params?.['name'] ?? ''}
        onBack={() => this.props.navigation.goBack()}
        leftData={this.state.leftData}
        rightData={this.state.rightData}
        buttonTitle={this.getButtonTitle()}
        onRecord={() => this.actionRecording()}
      />
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
      return dispatch({type: 'ADD_LEFT_DEVICE', payload: device});
    },
    addRightDevice: device => {
      return dispatch({type: 'ADD_RIGHT_DEVICE', payload: device});
    },
    actionRecordingButton: data => {
      return dispatch({type: 'ACTION_BUTTON_RECORD', payload: data});
    },
    addDashBoardData: data => {
      return dispatch({type: 'ADD_BLUETOOTH_DATA', payload: data});
    },
    actionNotificationButton: data => {
      return dispatch({type: 'ACTION_BUTTON_NOTIFICATION', payload: data});
    },
  };
};

export default connect(mapStateToProps, mapDisPatchToProps)(index);

