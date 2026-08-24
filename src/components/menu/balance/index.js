//5.11.62

import React, { Component } from 'react';
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
  Platform,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Col, Grid } from '../../common/NativeBaseShim';
import { connect } from 'react-redux';

import HeaderFix from '../../common/HeaderFix';
import NotificationsState from '../../shared/Notification';
import RecordStopButton from '../../common/RecordStopButton';
import RadarChartFix from '../../common/RadarChartFix';
import CardStatusFix from '../../common/CardStatusFix';
import AlertFix from '../../common/AlertsFix';
import ScoreFix from '../../common/ScoreFix';
import API from '../../../config/Api';
import {refreshUserDashboard} from '../../../services/assessmentUploadApi';
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
import { getLocalizedText } from "../../../assets/language/langUtils";

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
  sampleSeq = 0;
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

  dataBuffer = []; // Buffer for sensor data to reduce file I/O

  ltime = new Date();
  rtime = new Date();

  counter = 1;
  notificationStarted = new Set();
  leftDeviceId = undefined;
  rightDeviceId = undefined;

  state = {
    textAction: getLocalizedText(this.props.lang, BalanceLang.recordButton),
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
    balance: 0,
    txt: '',
    status: getLocalizedText(this.props.lang, BalanceLang.waiting),
    isRecording: false,
    isConnected: true,
    peripherals: new Map(),
    shoeSize: 0,
    notiAlarm: 0,
    selectedMenu: 1,
    menuAction: [
      { key: 1, title: getLocalizedText(this.props.lang, BalanceLang.dynamic) },
      { key: 2, title: getLocalizedText(this.props.lang, BalanceLang.staticMode) },
    ],
    countDownTimer: 10,
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
    if (!this.state.isRecording && score === 0) return '#dc3545'; // Red when not recording
    if (score >= 80) return '#28a745'; // Green for good
    if (score >= 40) return '#ffc107'; // Yellow for medium
    return '#dc3545'; // Red for bad
  };

  getStatusBadgeColor = () => {
    if (!this.state.isRecording) return '#495057'; // Dark gray when waiting
    const score = this.state.balance;
    if (score >= 80) return '#28a745';
    if (score >= 40) return '#ffc107';
    return '#dc3545';
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

  clampValue = (value, min, max) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return min;
    return Math.min(max, Math.max(min, numeric));
  };

  getBalancePosition = (lsensor = [], rsensor = []) => {
    const l = index => Number(lsensor[index] || 0);
    const r = index => Number(rsensor[index] || 0);
    const sumright = (r(0) + r(1) + r(2) + r(3) + r(4)) / 5 + (r(5) + r(6)) / 2 + r(7);
    const sumleft = (l(0) + l(1) + l(2) + l(3) + l(4)) / 5 + (l(5) + l(6)) / 2 + l(7);
    const sumup = (r(0) + r(1) + r(2) + r(3) + r(4)) / 5 + (l(0) + l(1) + l(2) + l(3) + l(4)) / 5;
    const sumdown = l(7) + r(7);
    const xPos = (sumright - sumleft) / 23.4;
    const yPos = (sumup - sumdown) / -15.6;

    return {
      xPos,
      yPos,
      xPosN: this.clampValue((xPos + 100) * 1.5, 10, 290),
      yPosN: this.clampValue((yPos + 100) * 1.5, 10, 290),
    };
  };

  getBleConfig = () => {
    if (Platform.OS === 'android') {
      return {
        service: '0000FFE0-0000-1000-8000-00805F9B34FB',
        characteristic: '0000FFE1-0000-1000-8000-00805F9B34FB',
      };
    }

    return {
      service: 'FFE0',
      characteristic: 'FFE1',
    };
  };

  registerConnectedPeripheral = peripheral => {
    if (!peripheral?.id) return;

    const peripherals = this.state.peripherals;
    peripheral.connected = true;
    peripherals.set(peripheral.id, peripheral);

    if (peripheral.name?.endsWith('L')) {
      this.leftDeviceId = peripheral.id;
      if (typeof this.props.addLeftDevice === 'function') {
        this.props.addLeftDevice(peripheral.id);
      }
      const sz = parseSizeFromPeripheralName(peripheral.name);
      if (sz && !this.state.shoeSize) this.setState({ shoeSize: sz });
    } else if (peripheral.name?.endsWith('R')) {
      this.rightDeviceId = peripheral.id;
      if (typeof this.props.addRightDevice === 'function') {
        this.props.addRightDevice(peripheral.id);
      }
      const sz = parseSizeFromPeripheralName(peripheral.name);
      if (sz && !this.state.shoeSize) this.setState({ shoeSize: sz });
    }

    this.setState({ peripherals });
  };

  hasConnectedBalanceDevices = () => (
    Boolean(this.props.leftDevice || this.leftDeviceId) ||
    Boolean(this.props.rightDevice || this.rightDeviceId)
  );

  prepareDeviceNotifications = async peripheralId => {
    if (!peripheralId) return;

    const { service, characteristic } = this.getBleConfig();

    try {
      await BleManager.retrieveServices(peripheralId);
      if (!this.notificationStarted.has(peripheralId)) {
        await BleManager.startNotification(peripheralId, service, characteristic);
        this.notificationStarted.add(peripheralId);
      }
      await BleManager.write(peripheralId, service, characteristic, [0]);
      await BleManager.write(peripheralId, service, characteristic, [1, 95]);
    } catch (error) {
      console.log('Balance notification setup skipped:', peripheralId, error);
    }
  };

  componentDidMount = async () => {
    // notiAlarm
    let noti = await AsyncStorage.getItem('notiSetting');
    noti !== null ? this.setState({ notiAlarm: parseInt(noti) }) : 100;
    NetInfo.addEventListener(this.handleConnectivityChange);
    const { navigation } = this.props;

    // Initial fetch to load data immediately
    
    setTimeout(() => {
      if (!this.isInitialReadingStarted) {
        this.isInitialReadingStarted = true;
        this.startReading();
      }
    }, 500);

    this.focusListener = navigation.addListener('focus', () => {
      if (this.isInitialReadingStarted) {
        this.startReading();
      }
      this.setState({ focus: true });
    });
    
    this.zoneInterval = setInterval(() => {
      var score =
        (this.state.balance + Number.parseInt(this.state.score)) / this.counter;
      this.setState({ score: score.toFixed(0) }, () => this.counter++);
    }, 1000);
  };

  componentWillUnmount = () => {
    clearInterval(this.readInterval);
    clearInterval(this.flushInterval);
    if (typeof this.flushBufferToDisk === 'function') {
      this.flushBufferToDisk();
    }
    clearInterval(this.zoneInterval);
    if (this.dataRecord && typeof this.dataRecord.remove === 'function') {
      this.dataRecord.remove();
    }
    if (typeof this.focusListener === 'function') {
      this.focusListener();
    } else if (this.focusListener && typeof this.focusListener.remove === 'function') {
      this.focusListener.remove();
    }
  };

  async actionConnectDevice(peripheral) {
    if (!peripheral) return;

    try {
      if (!peripheral.connected) {
        await BleManager.connect(peripheral.id);
      }

      this.registerConnectedPeripheral(peripheral);
      await this.prepareDeviceNotifications(peripheral.id);
    } catch (error) {
      console.log('Connection error', error);
    }
  }

  async retrieveConnected() {
    try {
      const results = await BleManager.getConnectedPeripherals([]);
      if (results.length == 0) {
        console.log('No connected peripherals');
      }
      console.log(results);
      var peripherals = this.state.peripherals;
      for (var i = 0; i < results.length; i++) {
        var peripheral = results[i];
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        await this.actionConnectDevice(peripheral);
      }
      this.setState({ peripherals });
    } catch (error) {
      console.log('retrieveConnected error:', error);
    }
  }

  async startReading() {
    console.log('[startReading] Called. isStartingReading:', this.isStartingReading);
    if (this.isStartingReading) return;
    this.isStartingReading = true;
    try {
      if (this.dataRecord && typeof this.dataRecord.remove === 'function') {
        this.dataRecord.remove();
      }

      const rd = this.props.rightDevice || this.rightDeviceId;
      const ld = this.props.leftDevice || this.leftDeviceId;
      console.log('[startReading] rd:', rd, 'ld:', ld);

      if (typeof rd !== 'undefined' && rd) {
        try { 
          console.log('[startReading] Retrieving services for rd');
          await BleManager.retrieveServices(rd); 
          console.log('[startReading] rd services retrieved');
        } catch(e) {
          console.log('[startReading] rd retrieve err:', e);
        }
      }
      if (typeof ld !== 'undefined' && ld) {
        try { 
          console.log('[startReading] Retrieving services for ld');
          await BleManager.retrieveServices(ld); 
          console.log('[startReading] ld services retrieved');
        } catch(e) {
          console.log('[startReading] ld retrieve err:', e);
        }
      }
    } finally {
      this.isStartingReading = false;
    }

    console.log('[startReading] Adding bleManagerEmitter listener');
    this.dataRecord = bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      ({ value, peripheral, characteristic, service }) => {
        const rightDevice = this.props.rightDevice || this.rightDeviceId;
        const leftDevice = this.props.leftDevice || this.leftDeviceId;
        let time = new Date();
        // console.log('[startReading] Event from:', peripheral, 'rd:', rightDevice, 'ld:', leftDevice);
        if (peripheral === rightDevice) {
          let rsensor = this.toDecimalArray(value);
          this.recordData(rsensor, 'R');
          if (time - this.rtime > 250) {
            let lsensor = this.state.lsensor;
            let shouldVibrate = this.shouldBeVibration(lsensor);
            let { xPos, yPos, xPosN, yPosN } = this.getBalancePosition(lsensor, rsensor);
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
        if (peripheral === leftDevice) {
          let lsensor = this.toDecimalArray(value);
          this.recordData(lsensor, 'L');
          if (time - this.ltime > 250) {
            let rsensor = this.state.rsensor;
            let shouldVibrate = this.shouldBeVibration(lsensor);
            let { xPos, yPos, xPosN, yPosN } = this.getBalancePosition(lsensor, rsensor);

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
    const balance = this.clampValue(Math.round(100 - persent), 0, 100);

    if (balance >= 80) {
      return {
        txt: getLocalizedText(this.props.lang || 0, BalanceLang.goodBalance),
        status: getLocalizedText(this.props.lang, BalanceLang.good),
        balance,
      };
    } else if (balance >= 40) {
      return {
        txt: getLocalizedText(this.props.lang || 0, BalanceLang.mediumBalance),
        status: getLocalizedText(this.props.lang, BalanceLang.medium),
        balance,
      };
    } else {
      return {
        txt: getLocalizedText(this.props.lang || 0, BalanceLang.badBalance),
        status: getLocalizedText(this.props.lang, BalanceLang.poor),
        balance,
      };
    }
  }

  handleConnectivityChange = status => {
    this.setState({ isConnected: status.isConnected });
    console.log(`Wifi Status : ${this.state.isConnected}`);
  };

  showStages = () => {
    this.setState({ calibrationPhase: 2 })
  }

  handleStartCalibration = () => {
    if (!this.hasConnectedBalanceDevices()) {
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
      this.setState({ calibrationPhase: 1 });
    }
  };

  handleSaveData = (calibrationStatus, butonLabel) => {
    this.props.actionRecordingButton(butonLabel);
    this.setState({ isCalibrated: calibrationStatus, textAction: butonLabel });
  }

  changeMenu = value => {
    this.setState({ selectedMenu: value });
  };

  actionRecording = async () => {
    if (!this.hasConnectedBalanceDevices()) {
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
      this.sampleSeq = 0;
      this.setState({ textAction: 'Stop', isRecording: true });
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
      this.setState({ textAction: 'Record', isRecording: false });
      this.props.actionRecordingButton('Record');
      clearInterval(this.readInterval);
      clearInterval(this.flushInterval);
      await this.flushBufferToDisk();
      await this.sendDataToSetver();
    }
  };

  async flushBufferToDisk() {
    if (!Array.isArray(this.dataBuffer) || this.dataBuffer.length === 0 || !this.start) return;

    const toFlush = this.dataBuffer.splice(0);
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


  actionRecordingFor10 = async () => {
    if (!this.hasConnectedBalanceDevices()) {
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
      this.sampleSeq = 0;
      this.setState({ textAction: getLocalizedText(this.props.lang, BalanceLang.stopButton) });
      this.currentSessionId = Date.now().toString();
      this.props.actionRecordingButton('Stop');
      var initTime = new Date();
      var start = initTime;
      let lastLtime = initTime;
      let lastRtime = initTime;

      let count = 10;
      var timer = setInterval(() => {
        if (this.state.countDownTimer >= 1) {

          var timer2 = setInterval(() => {
            var time = new Date();
            if (Math.floor((time - start) / 1000) < 11) {
              var data = {
                seq: this.sampleSeq++,
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
                session_id: this.currentSessionId || Date.now().toString(),
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

          }, 100);

          setTimeout(() => {
            clearInterval(timer2);
          }, 1000);

          this.setState({ countDownTimer: parseInt(this.state.countDownTimer) - 1 })
        }

      }, 1000);

      setTimeout(async () => {
        this.setState({ textAction: 'Record', countDownTimer: 10 });
        this.props.actionRecordingButton('Record');
        clearInterval(this.readInterval);
        clearInterval(timer);
        // clearInterval(this.readInterval);
        clearInterval(this.flushInterval);
        await this.flushBufferToDisk();
        await this.sendDataToSetverCalibration('S');
      }, 11000);

    } else {
      this.setState({ textAction: getLocalizedText(this.props.lang, BalanceLang.recordButton) });
      this.currentSessionId = Date.now().toString();
      this.props.actionRecordingButton('Record');
      // clearInterval(this.readInterval);
      clearInterval(this.flushInterval);
      await this.flushBufferToDisk();
      await this.sendDataToSetverCalibration('S');
    }
  };


  sendDataToSetverCalibration = async (legValue) => {
    // legValue expected: 'L' | 'R' | 'S'
    await this.uploadCachedFilesInOrder(legValue);
  }

  uploadCachedFilesInOrder = async (legType = '') => {
    try {
      const dir = `${RNFS.CachesDirectoryPath}/suratechM/`;
      const files = await RNFS.readDir(dir).catch(() => []);
      if (!files || !files.length) return;
      let uploaded = 0;

      // sort files lexicographically so older sessions go first
      const sortedFiles = files.sort((a, b) => a.name.localeCompare(b.name));

      for (const f of sortedFiles) {
        try {
          const raw = await RNFS.readFile(f.path);
          if (!raw || !raw.trim()) {
            console.log('Skipping empty file:', f.path);
            continue;
          }
          // trim trailing comma
          const trimmed = raw.endsWith(',') ? raw.slice(0, -1) : raw;

          let data = [];
          try {
            data = JSON.parse(`[${trimmed}]`).sort((a, b) => {
              if (a.seq != null && b.seq != null) return a.seq - b.seq;
              return (a.stamp || 0) - (b.stamp || 0);
            });
          } catch (e) {
            console.warn('JSON parse error for file:', f.path, e);
            continue; // keep file for later/manual inspection
          }

          if (!data.length) {
            console.log('No samples in file:', f.path);
            await RNFS.unlink(f.path).catch(e => { console.error('Unhandled error:', e); });
            continue;
          }

          const content = {
            data,
            id_customer: data[0]?.id_customer ?? this.props.user.id_customer,
            session_id: data[0]?.session_id || this.currentSessionId || Date.now().toString(),
            id_device: '',
            type: 1, // medical
            product_number: this.props.productNumber,
            bluetooth_left_id: this.props.leftDevice || this.leftDeviceId,
            bluetooth_right_id: this.props.rightDevice || this.rightDeviceId,
            shoe_size: this.state.shoeSize || 0,
            leg_type: legType, // '', 'L', 'R', 'S'
          };

          const resp = await fetch(`${API}/addjson`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(content),
          });

          // server may reply text or JSON
          const text = await resp.text();
          let json;
          try {
            json = JSON.parse(text);
          } catch {
            console.error('Non-JSON server response, keeping file:', f.path, text);
            continue;
          }

          if (json.status !== 'ผิดพลาด') {
            await RNFS.unlink(f.path).catch(e => { console.error('Unhandled error:', e); });
            uploaded += 1;
          } else {
            console.warn('Server returned error status; keeping file:', f.path);
          }
        } catch (e) {
          console.error('Error uploading file:', f?.path, e);
        }
      }

      if (uploaded > 0) {
        await refreshUserDashboard(this.props.user?.id_customer);
      }
    } catch (e) {
      console.error('uploadCachedFilesInOrder failed:', e);
    }
  };


  sendDataToSetver = async () => {
    await this.uploadCachedFilesInOrder(''); // normal balance session
  }

  actionUpdate = content => {
    content = {
      data: content,
      id_customer: this.props.user.id_customer,
      session_id: this.currentSessionId || Date.now().toString(),
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
    this.setState({ calibrationScreenOn: true });
  };

  handleStartLeftLegCalibration = () => {

    if (!this.hasConnectedBalanceDevices()) {
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
      this.setState({ showButton: false });
      this.handleSaveData(true, 'Stop');

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

        if (count >= 1) {

          var timer2 = setInterval(() => {
            var time = new Date();
            if (Math.floor((time - start) / 1000) < 6) {
              var data = {
                seq: this.sampleSeq++,
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
                session_id: this.currentSessionId || Date.now().toString(),
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

          }, 100);

          setTimeout(() => {
            clearInterval(timer2);
          }, 1000);

          count = count - 1;
        }

        if (totalCount == 5) {
          actualValue = 0;
          progMargin = 20;

        } else
          if (totalCount < 5) {
            totalCount = totalCount + 1;
            actualValue = parseInt(actualValue) + parseInt(progMargin);
            progressValue = actualValue + '%';
            this.setState({
              percentageCompleted: progressValue,
            });

          }

      }, 1000);

      setTimeout(() => {
        this.setState({ leftLegCalibrated: true, calibrationPhase: 2, percentageCompleted: 0, showButton: true });
        this.handleSaveData(true, 'Record');
        this.sendDataToSetverCalibration('L');
        clearInterval(timer);

      }, 6000);

    }
  }

  handleStartRightLegCalibration = () => {
    if (!this.hasConnectedBalanceDevices()) {
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
      this.setState({ showButton: false });
      this.handleSaveData(true, 'Stop');

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

        if (count >= 1) {

          var timer2 = setInterval(() => {
            var time = new Date();
            if (Math.floor((time - start) / 1000) < 6) {
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
                session_id: this.currentSessionId || Date.now().toString(),
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

          }, 100);

          setTimeout(() => {
            clearInterval(timer2);
          }, 1000);

          count = count - 1;
        }

        if (totalCount == 5) {
          actualValue = 0;
          progMargin = 20;

        } else
          if (totalCount < 5) {
            totalCount = totalCount + 1;
            actualValue = parseInt(actualValue) + parseInt(progMargin);
            progressValue = actualValue + '%';
            this.setState({
              percentageCompleted: progressValue,
            });

          }

      }, 1000);

      setTimeout(() => {
        this.setState({ rightLegCalibrated: true, calibrationPhase: 3, percentageCompleted: 0, showButton: true });
        this.handleSaveData(true, 'Record');
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
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      >
        {this.state.calibrationScreenOn ? (
          <HeaderFix
            icon_left={'left'}
            onpress_left={() => {
              // this.props.navigation.goBack();
              this.setState({ calibrationScreenOn: false });
            }}
            title={'Calibration'}
          />
        ) : (
          <HeaderFix
            icon_left={'left'}
            onpress_left={() => {
              this.props.navigation.goBack();
            }}
            title={this.props.route.params?.['name'] ?? ''}
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
                <View style={{ justifyContent: "center", alignItems: "center" }}>
                  <RNText
                    style={{ fontSize: 20, color: '#00A2A2', fontWeight: '700', textAlign: "left" }}>
                    Start calibration of SURASOLE
                  </RNText>
                  <Image source={require('../../../assets/image/start.png')} style={{ height: 400, width: 400, resizeMode: "center" }} />

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
                <View style={{ justifyContent: "center", alignItems: "center" }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (this.props.user.height != null && this.props.user.height != 0) {
                        this.setState({ calibrationPhase: 1 })
                      } else {
                        Alert.alert("Please Update Height in profile section to get customized result", "Do you want to provide Height", [
                          {
                            text: 'Yes',
                            onPress: () => this.props.navigation.navigate('Profile'),
                          },
                          {
                            text: 'No',
                            onPress: () => this.setState({ calibrationPhase: 1 }),
                            style: 'cancel',
                          }])

                      }
                    }}
                    style={{
                      alignItems: 'center',
                    }}>
                    <RNText style={{ fontSize: 18, color: '#fff' }}>
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
                      style={{ fontSize: 20, color: '#00A2A2', fontWeight: '700', textAlign: "left" }}>
                      Please Keep your left foot off from the ground
                    </RNText>
                    <Image source={require('../../../assets/image/left_leg_up.png')}
                      style={{ height: 400, width: 400, resizeMode: "center", alignSelf: "center" }} />
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
                    {this.state.percentageCompleted != 0 && <RNText
                      style={{
                        fontSize: 20,
                        color: '#00A2A2',
                        fontWeight: '700',
                        textAlign: "center",
                      }}>
                      left foot calibrating...
                    </RNText>}


                  </View>
                  {this.state.showButton && <View style={{ justifyContent: "center", alignItems: "center" }}>
                    <TouchableOpacity
                      onPress={() => this.handleStartLeftLegCalibration()}
                      style={{
                        marginHorizontal: 10,
                        paddingHorizontal: 20,
                        paddingVertical: 10,
                        width: "60%",
                        backgroundColor: '#00A2A2',
                        borderRadius: 20,
                        marginVertical: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                      <RNText style={{ fontSize: 18, color: '#fff' }}>
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
                      style={{ fontSize: 20, color: '#00A2A2', fontWeight: '700', textAlign: "left" }}>
                      Please Keep your right foot off from the ground
                    </RNText>
                    <Image source={require('../../../assets/image/right_leg_up.png')}
                      style={{ height: 400, width: 400, resizeMode: "center", alignSelf: "center" }} />
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
                    {this.state.percentageCompleted != 0 && <RNText
                      style={{
                        fontSize: 20,
                        color: '#00A2A2',
                        fontWeight: '700',
                        textAlign: "center",
                      }}>
                      right foot calibrating...
                    </RNText>}

                  </View>
                  {this.state.showButton && <View style={{ justifyContent: "center", alignItems: "center" }}>
                    <TouchableOpacity
                      onPress={() => this.handleStartRightLegCalibration()}
                      style={{
                        marginHorizontal: 10,
                        paddingHorizontal: 20,
                        paddingVertical: 10,
                        width: "60%",
                        backgroundColor: '#00A2A2',
                        borderRadius: 20,
                        marginVertical: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                      <RNText style={{ fontSize: 18, color: '#fff' }}>
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
                    <RNText style={{ fontSize: 18, color: '#fff' }}>
                      Completed
                    </RNText>
                  </TouchableOpacity>
                </View>
              ))}
          </>
        ) : (
          <>
            <View style={styles.container}>
              {/* Main Content Container */}
              <View style={styles.mainContentContainer}>

                {/* Radar Chart Section */}
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

                {/* Score & Status Card */}
                <View style={styles.balanceGradeContainer}>
                  <View style={styles.scoreStatusRow}>
                    {/* Score */}
                    <View style={styles.scoreSection}>
                      <RNText style={styles.sectionLabel}>
                        {getLocalizedText(this.props.lang, BalanceLang.score)}
                      </RNText>
                      <View style={[styles.scoreBadge, { backgroundColor: this.getScoreColor(this.state.balance) }]}>
                        <RNText style={styles.scoreText}>{this.state.balance}%</RNText>
                      </View>
                    </View>

                    {/* Status */}
                    <View style={styles.statusSection}>
                      <RNText style={styles.sectionLabel}>
                        {getLocalizedText(this.props.lang, BalanceLang.status)}
                      </RNText>
                      <View style={[styles.statusBadge, { backgroundColor: this.getStatusBadgeColor() }]}>
                        <RNText style={styles.statusText}>{this.state.status}</RNText>
                      </View>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBarBackground}>
                      <View style={[
                        styles.progressBarFill,
                        {
                          width: `${this.clampValue(this.state.balance, 0, 100)}%`,
                          backgroundColor: this.getScoreColor(this.state.balance)
                        }
                      ]} />
                    </View>
                  </View>
                </View>


                {/* Left / Right foot buttons */}
                <View style={styles.buttonsContainer}>
                  <Grid style={styles.buttonsGrid}>
                    <Col>
                      <BalanceButton
                        bntName={getLocalizedText(this.props.lang, BalanceLang.leftButton)}
                        onPress={() => {
                          if (this.dataRecord && typeof this.dataRecord.remove === 'function') {
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
                          if (this.dataRecord && typeof this.dataRecord.remove === 'function') {
                            this.dataRecord.remove();
                          }
                          this.setState({ focus: false });
                          this.props.navigation.navigate('RigthFoots');
                        }}
                      />
                    </Col>
                  </Grid>
                </View>

                {/* Record / Calibration buttons */}
                {this.state.selectedMenu === 1 ? (
                  <View style={styles.recordButtonContainer}>
                    <RecordStopButton
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
          <RNText style={styles.balanceButtonText}>{this.props.bntName}</RNText>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    backgroundColor: '#fff',
  },
  mainContentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    justifyContent: 'flex-start',
  },

  // Radar chart - centered with generous space
  radarContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
    flex: 0.45,
  },

  // Score & Status card
  balanceGradeContainer: {
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 13,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
    flex: 0.15,
    alignSelf: 'center',
    width: '85%',
  },
  scoreStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
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
    fontSize: 10,
    color: '#666',
    marginBottom: 3,
    fontWeight: '500',
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    minWidth: 50,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    minWidth: 60,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  progressContainer: {
    marginTop: 5,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Left / Right buttons
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  buttonsGrid: {
    flexDirection: 'row',
    width: '90%',
    alignSelf: 'center',
  },
  balanceButtonContainer: {
    flex: 1,
    paddingHorizontal: 8,
    marginVertical: 4,
  },
  balanceButton: {
    minHeight: 46,
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: '#d2afa8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  balanceButtonText: {
    fontSize: 15,
    color: '#222',
    fontWeight: '400',
    textAlign: 'center',
  },

  // Record button
  recordButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 58,
    marginTop: 10,
    marginBottom: 15,
  },

  // Calibration buttons
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
  };
};

export default connect(mapStateToProps, mapDisPatchToProps)(index);
