import React from 'react';
import { ToastAndroid } from 'react-native';

import {
  View,
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

import { Col, Grid } from '../../common/NativeBaseShim';
import { connect } from 'react-redux';

import HeaderFix from '../../common/HeaderFix';
import Text from '../../common/TextFix';
import ButtonFix from '../../common/ButtonFix';
import SvgContourBasic from '../../contourlib/screens/SvgD3ContourBasic';
import { uploadRecordingFiles } from '../../../services/pressureDataApi';

import BleManager from 'react-native-ble-manager';
import {
  toDecimalArray,
  findLeftContourArray,
  findRightContourArray,
  calMeasurePressure,
  shouldBeVibration,
} from '../../../utils/sensorUtils';

import Lang from '../../../assets/language/menu/lang_record';
import LangHome from '../../../assets/language/screen/lang_home';
import Lang_pressuremap from "../../../assets/language/menu/lang_pressuremap";
import { getLocalizedText } from '../../../assets/language/langUtils';

var RNFS = require('react-native-fs');

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);


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
  _isMounted = false; // Track if component is mounted to prevent race conditions

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
    shoeSize:0,
  };

  measurePressure = sensor => {
    for (let i = 0; i < sensor.length; i++) {
      if (calMeasurePressure(sensor[i]) > this.state.notiAlarm) {
        Vibration.vibrate(100);
        return;
      }
    }
  };

  updateState(stage, value, side) {
    if (side === 'LEFT') {
      this.setState({ lstage: stage, leftsensor: toDecimalArray(value) });
    } else if (side === 'RIGHT') {
      this.setState({ rstage: stage, rightsensor: toDecimalArray(value) });
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
    }
    
    // Sync with Redux recording state when component comes into focus
    if (typeof this.props.record !== 'undefined') {
      if (this.props.record === 'Stop') {
        this.setState({ textAction: 'Stop' });
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
      ({ value, peripheral, characteristic, service }) => {
        // Safety check: Don't process if component is unmounted
        if (!this._isMounted) {
          return;
        }
        
        let time = new Date();
        if (peripheral === this.props.leftDevice) {
          let leftsensor = toDecimalArray(value);
          this.recordData(leftsensor, 'L');
          if (time - this.ltime > 250) {
            let shouldVibrate = shouldBeVibration(leftsensor, this.props.user.weight * 0.2);
            let leftData = findLeftContourArray(leftsensor);
            this.leftPhase = leftsensor.reduce((a, b) => a + b, 0);
            this.setState({ leftsensor, shouldVibrate, leftData });
            this.ltime = time;
          }
        }
        if (peripheral === this.props.rightDevice) {
          let rightsensor = toDecimalArray(value);
          this.recordData(rightsensor, 'R');
          if (time - this.rtime > 250) {
            let shouldVibrate = shouldBeVibration(rightsensor, this.props.user.weight * 0.2);
            let rightData = findRightContourArray(rightsensor);
            this.rightPhase = rightsensor.reduce((a, b) => a + b, 0);
            this.setState({ rightsensor, shouldVibrate, rightData });
            this.rtime = time;
          }
        }
      },
    );
  }

  recordData(data, sensor) {
    if (sensor === 'L') {
      this.lsensor = data;
    } else {
      this.rsensor = data;
    }

    if (this.props.noti === true) {
      this.measurePressure(data);
    }
  }

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
      if (results.length === 0) {
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
    this._isMounted = true; // Component is now mounted
    
    const leftData = findLeftContourArray(this.state.leftsensor);
    const rightData = findRightContourArray(this.state.rightsensor);

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
    if (noti !== null) {
      this.setState({ notiAlarm: parseInt(noti) });
    }

    this.retrieveConnected();
    // Small delay to ensure module is fully mounted
    setTimeout(() => {
      this.startReading();
    }, 100);
    this.setState({ leftData, rightData });
  };

  componentWillUnmount = () => {
    this._isMounted = false; // Component is unmounting
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
              name: getLocalizedText(this.props.lang, LangHome.addDeviceButton),
            });
          },
        },
      ]);
      return;
    }
    if (this.state.textAction === 'Record') {
      this.setState({ textAction: 'Stop' });
      this.props.actionRecordingButton('Stop');
      let initTime = new Date();
      this.start = initTime;
      this.lastLtime = initTime;
      this.lastRtime = initTime;
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
          await RNFS.appendFile(
            RNFS.CachesDirectoryPath +
            '/suratechM/' +
            this.start.getFullYear() +
            (this.start.getMonth() + 1) +
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
            (this.start.getMonth() + 1) +
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
    uploadRecordingFiles({
      isConnected: this.state.isConnected,
      userId: this.props.user.id_customer,
      productNumber: this.props.productNumber,
      leftDevice: this.props.leftDevice,
      rightDevice: this.props.rightDevice,
      shoeSize: this.state.shoeSize,
      onError: (err) => {
        this.setState({ isLoading: false });
        ToastAndroid.show('Something went wrong. Please Try again!!!', ToastAndroid.SHORT);
      },
    }).then(() => {
      alert(getLocalizedText(this.props.lang, Lang.alert));
    });
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
              title={this.props.route.params?.['name'] ?? ''}
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
                  title={this.getButtonTitle()}
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