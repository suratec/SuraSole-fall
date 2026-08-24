import React, {Component} from 'react';
import {
    View,
    Image,
    ScrollView,
    NativeModules,
    NativeEventEmitter,
    Vibration,
    Text,
    Alert,
    Platform,
    StyleSheet,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {connect} from 'react-redux';
import AlertFix from '../../../components/common/AlertsFix';
import API from '../../../config/Api';
import BleManager from 'react-native-ble-manager';
import {deleteFile} from '../../../FileManager';
import BalanceLang from '../../../assets/language/menu/lang_balance';
import Lang from '../../../assets/language/menu/lang_record';
import LangHome from '../../../assets/language/screen/lang_home';
import HeaderFix from '../../../components/common/HeaderFix';
import UI from '../../../config/styles/CommonStyles';

import langAssessment from '../../../assets/language/menu/lang_assessmentTests';
import {getLocalizedText} from '../../../assets/language/langUtils';
import RecordStopButton from '../../common/RecordStopButton';
import Lang_pressuremap from "../../../assets/language/menu/lang_pressuremap";
import {
    EYES_CACHE_DIRECTORY,
    EYES_FILE_PREFIX,
    enqueueAssessmentUploads,
} from '../../../services/assessmentUploadApi';

var RNFS = require('react-native-fs');

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const TIMER = 100;
const TIMER_BIG = 1;
const Duration = 1500;
const ASSESSMENT_FILE_PREFIX = EYES_FILE_PREFIX;
const ASSESSMENT_CACHE_DIRECTORY = EYES_CACHE_DIRECTORY;
const ASSESSMENT_DURATION_MS = 20000;

class StandEyes extends Component {
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

  dataBuffer = []; // Buffer for sensor data to reduce file I/O
    hasReceivedSensorData = false;
    hasReceivedLeftSensorData = false;
    hasReceivedRightSensorData = false;

    ltime = new Date();
    rtime = new Date();

    counter = 1;

    state = {
        textAction: 'Record',
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
        status: 'waiting',
        isConnected: true,
        peripherals: new Map(),
        shoeSize: 0,
        notiAlarm: 0,
        selectedMenu: 1,
        menuAction: [
            {key: 1, title: 'Dynamic'},
            {key: 2, title: 'Static'},
        ],
        countDownTimer: 20,
        isCalibrated: false,
        leftLegCalibrated: false,
        rightLegCalibrated: false,
        percentageCompleted: 0,
        calibrationScreenOn: false,
        calibrationPhase: 0,
        showButton: true,
    };

    //findCoordinate(sensor) {
    //return { xPos: ((sensor[2] - sensor[1]) / 650) * 150 + 150, yPos: ((((sensor[0] + sensor[1] + sensor[2]) / 3) - sensor[4]) / -650) * 150 + 150 }
    //}

    getLocalizedText = (textObj) => {
        return getLocalizedText(this.props.lang, textObj);
    };

    getLocalizedTitle = () => {
        return this.props.type === 'open'
            ? this.getLocalizedText(langAssessment.standOpenEyes)
            : this.getLocalizedText(langAssessment.standEyesClosed);
    };

    getBalanceInstruction = () => {
        return this.props.type === 'open'
            ? this.getLocalizedText(langAssessment.balanceInstructionOpen)
            : this.getLocalizedText(langAssessment.balanceInstructionClosed);
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
        const dec = [];
        for (let i = 0; i < byteArray.length - 1; i += 2) {
            dec.push(byteArray[i] * 256 + byteArray[i + 1]);
        }
        return dec;
    }

    ensureSensorNotifications = async peripheralId => {
        if (!peripheralId) return;

        const service = Platform.OS === 'android'
            ? '0000FFE0-0000-1000-8000-00805F9B34FB'
            : 'FFE0';
        const characteristic = Platform.OS === 'android'
            ? '0000FFE1-0000-1000-8000-00805F9B34FB'
            : 'FFE1';

        try {
            await BleManager.retrieveServices(peripheralId);
            await BleManager.startNotification(peripheralId, service, characteristic);
            await BleManager.write(peripheralId, service, characteristic, [0]);
            await BleManager.write(peripheralId, service, characteristic, [1, 95]);
        } catch (error) {
            console.log('Unable to start assessment sensor notifications:', peripheralId, error);
        }
    };

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
        this.focusListener = navigation.addListener('focus', () => {
            this.retrieveConnected();
            this.startReading();
            this.setState({focus: true});
        });
        this.retrieveConnected();
        this.startReading();
        this.zoneInterval = setInterval(() => {
            var score =
                (this.state.balance + Number.parseInt(this.state.score)) / this.counter;
            this.setState({score: score.toFixed(0)}, () => this.counter++);
        }, 1000);
    };

    componentWillUnmount = () => {
        clearInterval(this.readInterval);
        clearInterval(this.flushInterval);
        clearInterval(this.assessmentCountdownInterval);
        clearTimeout(this.assessmentFinishTimeout);
        this.isAssessmentRecording = false;
        this.flushBufferToDisk().catch(error => {
            console.log('Unable to flush assessment data during unmount:', error);
        });
        clearInterval(this.zoneInterval);
        if (this.dataRecord) {
            this.dataRecord.remove();
        }
        if (typeof this.focusListener === 'function') {
            this.focusListener();
        } else if (this.focusListener && typeof this.focusListener.remove === 'function') {
            this.focusListener.remove();
        }
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
                            this.leftPeripheralId = peripheral.id;
                            this.props.addLeftDevice(peripheral.id);
                            this.setState({
                                shoeSize:
                                    peripheral.name[peripheral.name.length - 3] +
                                    peripheral.name[peripheral.name.length - 2],
                            });
                        } else if (peripheral.name[peripheral.name.length - 1] === 'R') {
                            this.rightPeripheralId = peripheral.id;
                            this.props.addRightDevice(peripheral.id);
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

    async retrieveConnected() {
        try {
            const results = await BleManager.getConnectedPeripherals([]);
            if (results.length === 0) console.log('No connected peripherals');

            const peripherals = this.state.peripherals;
            for (const peripheral of results) {
                // Redux updates props asynchronously. Retain the physical device
                // IDs locally so incoming BLE samples are not discarded meanwhile.
                if (peripheral.name?.endsWith('L')) {
                    this.leftPeripheralId = peripheral.id;
                    this.props.addLeftDevice(peripheral.id);
                }
                if (peripheral.name?.endsWith('R')) {
                    this.rightPeripheralId = peripheral.id;
                    this.props.addRightDevice(peripheral.id);
                }
                peripheral.connected = true;
                peripherals.set(peripheral.id, peripheral);
                await this.ensureSensorNotifications(peripheral.id);
            }
            this.setState({peripherals});
        } catch (error) {
            console.log('Unable to retrieve assessment peripherals:', error);
        }
    }

    async startReading() {
        if (this.dataRecord) this.dataRecord.remove();
        this.dataRecord = bleManagerEmitter.addListener(
            'BleManagerDidUpdateValueForCharacteristic',
            ({value, peripheral, characteristic, service}) => {
                let time = new Date();
                const isRightSensor = peripheral === this.rightPeripheralId ||
                    peripheral === this.props.rightDevice;
                const isLeftSensor = peripheral === this.leftPeripheralId ||
                    peripheral === this.props.leftDevice;

                if (isRightSensor) {
                    let rsensor = this.toDecimalArray(value);
                    if (rsensor.length < 5) return;
                    this.hasReceivedSensorData = true;
                    this.hasReceivedRightSensorData = true;
                    this.recordData(rsensor, 'R');
                    if (time - this.rtime > 250) {
                        let lsensor = this.state.lsensor;
                        let shouldVibrate = this.shouldBeVibration(lsensor);
                        let sumright =
                            (rsensor[0] + rsensor[1] + rsensor[2]) / 3 +
                            rsensor[3] +
                            rsensor[4];
                        let sumleft =
                            (lsensor[0] + lsensor[1] + lsensor[2]) / 3 +
                            lsensor[3] +
                            lsensor[4];
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
                if (isLeftSensor) {
                    let lsensor = this.toDecimalArray(value);
                    if (lsensor.length < 5) return;
                    this.hasReceivedSensorData = true;
                    this.hasReceivedLeftSensorData = true;
                    this.recordData(lsensor, 'L');
                    if (time - this.ltime > 250) {
                        let rsensor = this.state.rsensor;
                        let shouldVibrate = this.shouldBeVibration(lsensor);
                        let sumright =
                            (rsensor[0] + rsensor[1] + rsensor[2]) / 3 +
                            rsensor[3] +
                            rsensor[4];
                        let sumleft =
                            (lsensor[0] + lsensor[1] + lsensor[2]) / 3 +
                            lsensor[3] +
                            lsensor[4];
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

    hasRequiredSensorData = () => {
        const leftId = this.leftPeripheralId || this.props.leftDevice;
        const rightId = this.rightPeripheralId || this.props.rightDevice;

        return (!leftId || this.hasReceivedLeftSensorData) &&
            (!rightId || this.hasReceivedRightSensorData);
    };

    setStatus(x, y) {
        var persent = 0;
        if (x > y) {
            persent = Math.abs(x);
        } else {
            persent = Math.abs(y);
        }
        if (100 - persent >= 80) {
            return {
                txt: this.getLocalizedText(BalanceLang.goodBalance),
                status: 'Good',
                balance: Math.round(100 - persent),
            };
        } else if (100 - persent >= 40) {
            return {
                txt: this.getLocalizedText(BalanceLang.mediumBalance),
                status: 'Medium',
                balance: Math.round(100 - persent),
            };
        } else {
            return {
                txt: this.getLocalizedText(BalanceLang.badBalance),
                status: 'Bad',
                balance: Math.round(100 - persent),
            };
        }
    }

    handleConnectivityChange = status => {
        this.setState({isConnected: status.isConnected});
        console.log(`Wifi Status : ${this.state.isConnected}`);
    };

    showStages = () => {
        this.setState({calibrationPhase: 2});
    };

    handleStartCalibration = () => {
        if (
            typeof this.props.rightDevice === 'undefined' &&
            typeof this.props.leftDevice === 'undefined'
        ) {
            Alert.alert(this.getLocalizedText(langAssessment.warning), this.getLocalizedText(langAssessment.bluetoothAlert), [
                {
                    text: 'OK',
                    onPress: () => {
                        this.props.navigation.navigate('Product', {
                            name: this.getLocalizedText(LangHome.addDeviceButton),
                        });
                    },
                },
            ]);
            return;
        } else {
            this.setState({calibrationPhase: 1});
        }
    };

    handleSaveData = (calibrationStatus, butonLabel) => {
        this.props.actionRecordingButton(butonLabel);
        this.setState({isCalibrated: calibrationStatus, textAction: butonLabel});
    };

    changeMenu = value => {
        this.setState({selectedMenu: value});
    };

    actionRecording = async () => {
        if (
            typeof this.props.rightDevice === 'undefined' &&
            typeof this.props.leftDevice === 'undefined'
        ) {
            Alert.alert(this.getLocalizedText(langAssessment.warning), this.getLocalizedText(langAssessment.bluetoothAlert), [
                {
                    text: 'OK',
                    onPress: () => {
                        this.props.navigation.navigate('Product', {
                            name:  this.getLocalizedText(LangHome.addDeviceButton),
                        });
                    },
                },
            ]);
            return;
        }
        if (this.state.textAction == 'Record') {
            this.setState({textAction: 'Stop'});
            this.currentSessionId = Date.now().toString();
            this.assessmentFilePath = null;
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
            await this.flushBufferToDisk();
            this.sendDataToSetver();
        }
    };

    actionRecordingFor20 = async () => {
        if (
            typeof this.props.rightDevice === 'undefined' &&
            typeof this.props.leftDevice === 'undefined'
        ) {
            Alert.alert(this.getLocalizedText(langAssessment.warning), this.getLocalizedText(langAssessment.bluetoothAlert), [
                {
                    text: 'OK',
                    onPress: () => {
                        this.props.navigation.navigate('Product', {
                            name:  this.getLocalizedText(LangHome.addDeviceButton),
                        });
                    },
                },
            ]);
            return;
        }
        if (this.isAssessmentRecording) return;
        if (!this.hasRequiredSensorData()) {
            Alert.alert(this.getLocalizedText(langAssessment.warning), this.getLocalizedText(langAssessment.bluetoothAlert));
            return;
        }

        this.isAssessmentRecording = true;
        this.currentSessionId = Date.now().toString();
        this.currentAssessmentLegType = this.props.type === 'open' ? 'SOE' : 'SCE';
        this.start = new Date();
        this.dataBuffer = [];
        this.assessmentFilePath =
            `${ASSESSMENT_CACHE_DIRECTORY}/` +
            `${ASSESSMENT_FILE_PREFIX}${this.currentAssessmentLegType}-${this.currentSessionId}`;

        this.setState({textAction: 'Stop', countDownTimer: 20});
        this.props.actionRecordingButton('Stop');

        this.readInterval = setInterval(() => {
            if (!this.isAssessmentRecording) return;

            const time = new Date();
            this.dataBuffer.push({
                stamp: time.getTime(),
                timestamp: time,
                duration: Math.floor((time - this.start) / 1000),
                left: {
                    sensor: [...this.lsensor],
                    swing: this.leftSwingTime,
                    stance: this.leftStanceTime,
                },
                right: {
                    sensor: [...this.rsensor],
                    swing: this.rightSwingTime,
                    stance: this.rightStanceTime,
                },
                id_customer: this.props.user.id_customer,
                session_id: this.currentSessionId,
                leg_type: this.currentAssessmentLegType,
                product_number: this.props.productNumber || '',
                bluetooth_left_id: this.props.leftDevice || '',
                bluetooth_right_id: this.props.rightDevice || '',
                shoe_size: this.state.shoeSize || 0,
            });
        }, 100);

        this.flushInterval = setInterval(() => {
            this.flushBufferToDisk().catch(error => {
                console.log('Assessment buffer flush failed:', error);
            });
        }, 2000);

        this.assessmentCountdownInterval = setInterval(() => {
            const elapsed = Date.now() - this.start.getTime();
            const secondsLeft = Math.max(0, Math.ceil((ASSESSMENT_DURATION_MS - elapsed) / 1000));
            this.setState({countDownTimer: secondsLeft});
        }, 250);

        this.assessmentFinishTimeout = setTimeout(() => {
            this.finishAssessmentRecording();
        }, ASSESSMENT_DURATION_MS);
    };

    finishAssessmentRecording = async () => {
        if (!this.isAssessmentRecording) return;

        this.isAssessmentRecording = false;
        clearInterval(this.readInterval);
        clearInterval(this.flushInterval);
        clearInterval(this.assessmentCountdownInterval);
        clearTimeout(this.assessmentFinishTimeout);

        try {
            // Persist every sample before navigating; network sync continues in the queue.
            await this.flushBufferToDisk();
            // Wait for the upload and server-side dashboard rebuild before the
            // next assessment/dashboard can read the new session.
            await enqueueAssessmentUploads({
                isConnected: this.state.isConnected,
                userId: this.props.user?.id_customer,
                productNumber: this.props.productNumber,
                leftDevice: this.props.leftDevice,
                rightDevice: this.props.rightDevice,
                shoeSize: this.state.shoeSize,
            });

            this.setState({textAction: 'Record', countDownTimer: 20});
            this.props.actionRecordingButton('Record');
            this.handleNavigationAfterTest();
        } catch (error) {
            console.log('Unable to finish assessment recording:', error);
            this.setState({textAction: 'Record', countDownTimer: 20});
            this.props.actionRecordingButton('Record');
            AlertFix.alertBasic(
                this.getLocalizedText(Lang.errorTitle),
                this.getLocalizedText(Lang.errorBody2),
            );
        }
    };

    handleNavigationAfterTest = () => {
        const currentType = this.props.type;

        try {
            if (currentType === 'open') {
                this.props.navigation.navigate('StandEyesClosed');
            } else if (currentType === 'closed') {
                this.props.navigation.navigate('TenMeterWalkTest');
            } else {
                console.log('Unknown assessment type:', currentType);
            }
        } catch (error) {
            console.log('Assessment navigation error:', error);
            Alert.alert('Navigation Error', `Failed to navigate: ${error.message}`);
        }
    };

    sendDataToSetverCalibration = async () => {
        const dir = ASSESSMENT_CACHE_DIRECTORY;

        try {
            const online = this.state.isConnected;
            const files = (await RNFS.readDir(dir).catch(() => []))
                .filter(file => file.name.startsWith(ASSESSMENT_FILE_PREFIX));
            console.log('Assessment uploader online?', online, 'pending files:', files.length);

            if (!online || files.length === 0) return;

            for (const r of files) {
                try {
                    const raw = await RNFS.readFile(r.path, 'utf8');
                    const trimmed = raw.replace(/,\s*$/, '');
                    if (!trimmed) { console.log('Empty file, skipping', r.path); continue; }

                    let data;
                    try {
                        data = JSON.parse(`[${trimmed}]`);
                    } catch (e) {
                        console.log('JSON parse error for', r.path, e);
                        continue;
                    }
                    if (!Array.isArray(data) || data.length === 0) {
                        console.log('No samples in', r.path);
                        continue;
                    }

                    const firstSample = data[0];
                    const sessionId = String(firstSample.session_id || '');
                    const legType = firstSample.leg_type;
                    const metadataMatches = data.every(sample =>
                        String(sample.session_id || '') === sessionId &&
                        sample.leg_type === legType,
                    );

                    if (!sessionId || !['SOE', 'SCE'].includes(legType) || !metadataMatches) {
                        console.log('Invalid or mixed assessment metadata; keeping file:', r.path);
                        continue;
                    }

                    const payload = {
                        data,
                        id_customer: firstSample.id_customer || this.props.user?.id_customer || '',
                        session_id: sessionId,
                        id_device: '',
                        type: 1,
                        product_number: firstSample.product_number || this.props.productNumber || '',
                        bluetooth_left_id: firstSample.bluetooth_left_id || this.props.leftDevice || '',
                        bluetooth_right_id: firstSample.bluetooth_right_id || this.props.rightDevice || '',
                        shoe_size: firstSample.shoe_size || this.state.shoeSize || 0,
                        leg_type: legType,
                    };

                    console.log('POST /addjson len=', data.length, 'leg=', legType, 'session=', sessionId, 'file=', r.path);

                    const res = await fetch(`${API}/addjson`, {
                        method: 'POST',
                        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });

                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const body = await res.json().catch(() => ({}));
                    if (body.status && body.status !== 'ผิดพลาด') {
                        console.log('Upload success, deleting', r.path);
                        await RNFS.unlink(r.path);
                    } else {
                        console.log('Server did not confirm upload success; keeping file:', body);
                    }
                } catch (err) {
                    console.log('Upload attempt failed for', r.path, err);
                }
            }
        } catch (outer) {
            console.log('sendDataToSetverCalibration fatal:', outer);
        }
    };


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
          session_id: this.currentSessionId || Date.now().toString(),
                                id_device: '',
                                type: 1, // for medical
                                product_number: this.props.productNumber,
                                bluetooth_left_id: this.props.leftDevice,
                                bluetooth_right_id: this.props.rightDevice,
                                shoe_size: this.state.shoeSize,
                                leg_type: '5TSST',
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
                                    console.log(resp, content, 'response');
                                    if (resp.status != 'ผิดพลาด') {
                                        console.log(`Clear : ${r.path}`);
                                        RNFS.unlink(r.path);
                                    }
                                });
                        })
                        .catch(e => { console.error('Unhandled error:', e); });
                });
            });
        // alert(this.props.lang ? Lang.alert.thai : Lang.alert.eng);
    };

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
                    AlertFix.alertBasic(this.getLocalizedText(Lang.successTitle),this.getLocalizedText(Lang.successBody),);
                    deleteFile(this.fileStamp_n);
                } else {
                    AlertFix.alertBasic(this.getLocalizedText(Lang.errorTitle),this.getLocalizedText(Lang.errorBody1),);
                }
            })
            .catch(error => {
                AlertFix.alertBasic(this.getLocalizedText(Lang.errorTitle),this.getLocalizedText(Lang.errorBody2),);
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
            Alert.alert(this.getLocalizedText(langAssessment.warning), this.getLocalizedText(langAssessment.bluetoothAlert), [
                {
                    text: 'OK',
                    onPress: () => {
                        this.props.navigation.navigate('Product', {
                            name:  this.getLocalizedText(LangHome.addDeviceButton),
                        });
                    },
                },
            ]);
            return;
        } else {
            this.setState({showButton: false});
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
                } else if (totalCount < 5) {
                    totalCount = totalCount + 1;
                    actualValue = parseInt(actualValue) + parseInt(progMargin);
                    progressValue = actualValue + '%';
                    this.setState({
                        percentageCompleted: progressValue,
                    });
                }
            }, 1000);

            setTimeout(() => {
                this.setState({
                    leftLegCalibrated: true,
                    calibrationPhase: 2,
                    percentageCompleted: 0,
                    showButton: true,
                });
                this.handleSaveData(true, 'Record');
                this.sendDataToSetverCalibration(
                    this.props.type == 'open' ? 'SOE' : 'SCE',
                );
                clearInterval(timer);

                this.handleNavigationAfterTest();
            }, 6000);
        }
    };

    handleStartRightLegCalibration = () => {
        if (
            typeof this.props.rightDevice === 'undefined' &&
            typeof this.props.leftDevice === 'undefined'
        ) {
            Alert.alert(this.getLocalizedText(langAssessment.warning), this.getLocalizedText(langAssessment.bluetoothAlert), [
                {
                    text: 'OK',
                    onPress: () => {
                        this.props.navigation.navigate('Product', {
                            name:  this.getLocalizedText(LangHome.addDeviceButton),
                        });
                    },
                },
            ]);
            return;
        } else {
            this.setState({showButton: false});
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
                } else if (totalCount < 5) {
                    totalCount = totalCount + 1;
                    actualValue = parseInt(actualValue) + parseInt(progMargin);
                    progressValue = actualValue + '%';
                    this.setState({
                        percentageCompleted: progressValue,
                    });
                }
            }, 1000);

            setTimeout(() => {
                this.setState({
                    rightLegCalibrated: true,
                    calibrationPhase: 3,
                    percentageCompleted: 0,
                    showButton: true,
                });
                this.handleSaveData(true, 'Record');
                this.sendDataToSetverCalibration(
                    this.props.type == 'open' ? 'SOE' : 'SCE',
                );
                clearInterval(timer);
            }, 6000);
        }
    };

    canVibration = (vibrate, master) => {
        if (vibrate && master) {
            Vibration.vibrate(500);
        } else {
            Vibration.cancel();
        }
    };

    getButtonDisabled = () => {
        return this.state.textAction !== 'Record';
    };

    getButtonAction = () => {
        return this.state.textAction === 'Record';
    };

    getButtonTitle = () => {
        return this.state.textAction === 'Record'
            ? getLocalizedText(this.props.lang, langAssessment.startText)
            : getLocalizedText(this.props.lang, langAssessment.stopText);
    };

    async flushBufferToDisk() {
        if (this.flushInProgress) {
            await this.flushInProgress;
            if (Array.isArray(this.dataBuffer) && this.dataBuffer.length > 0) {
                return this.flushBufferToDisk();
            }
            return;
        }
        if (!Array.isArray(this.dataBuffer) || this.dataBuffer.length === 0 || !this.start) {
            return;
        }

        const toFlush = this.dataBuffer.splice(0);
        const filePath = this.assessmentFilePath ||
            RNFS.CachesDirectoryPath +
                '/suratechM/' +
                this.start.getFullYear() +
                this.start.getMonth() +
                this.start.getDate() +
                this.round;
        const chunk = toFlush.map(data => JSON.stringify(data)).join(',') + ',';
        const writePromise = (async () => {
            const targetDirectory = this.assessmentFilePath
                ? ASSESSMENT_CACHE_DIRECTORY
                : `${RNFS.CachesDirectoryPath}/suratechM/`;
            await RNFS.mkdir(targetDirectory);
            await RNFS.appendFile(filePath, chunk);
        })();
        this.flushInProgress = writePromise;

        try {
            await writePromise;
        } catch (error) {
            // Preserve unwritten samples in memory so a later flush can retry them.
            this.dataBuffer = toFlush.concat(this.dataBuffer || []);
            throw error;
        } finally {
            if (this.flushInProgress === writePromise) {
                this.flushInProgress = null;
            }
        }
    }

    render() {
        this.canVibration(this.state.shouldVibrate, this.state.switch);

        return (
            <ScrollView
                style={{ flex: 1, backgroundColor: '#fff' }}
                contentContainerStyle={{ flexGrow: 1 }}   // <- important for small screens
            >
                <HeaderFix
                    icon_left={'left'}
                    onpress_left={() => {
                      this.props.navigation.goBack();
                    }}
                    title={this.getLocalizedTitle()}
                />
                {this.state.textAction == 'Stop' && (
                    <Text style={styles.timerText}>{this.state.countDownTimer}</Text>
                )}
                <View
                    styles={{
                        flex: 1,

                        alignSelf: 'center',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                    <View
                        style={{
                            width: '80%',
                            alignSelf: 'center',
                            flexDirection: 'row',
                            marginTop: '10%',
                        }}>
                        <Image
                            source={
                                this.props.type == 'open'
                                    ? require('../../../assets/image/static/open.png')
                                    : require('../../../assets/image/static/close.png')
                            }
                            styles={{width: 400, height: 80}}
                        />
                    </View>

                    <Text style={[styles.text, {marginTop: '5%'}]}>
                        {this.getLocalizedText(langAssessment.standText)}
                    </Text>

                    <Text style={[styles.text, {marginTop: '8%'}]}>{this.getLocalizedText(langAssessment.noteText)}</Text>
                    <Text style={styles.text}>
                        {this.getBalanceInstruction()}
                    </Text>

                    <View style={{ padding: 15, alignItems: 'center' }}>
                        {this.getButtonDisabled() ? (
                            // Disabled button - custom gray styling
                            <View style={styles.disabledButtonContainer}>
                                <View style={styles.disabledButton}>
                                    <Text style={styles.disabledButtonText}>
                                        {this.getButtonTitle()}
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            // Active button - normal ButtonFix
                            <RecordStopButton
                                title={this.getButtonTitle()}
                                onPress={() => this.actionRecordingFor20()}
                            />
                        )}
                    </View>
                </View>
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    viewStyle: {
        width: '40%',
        height: 45,
        backgroundColor: UI.color_Gradient[1],
        borderRadius: 40,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '10%',
    },
    text: {
        width: '90%',
        fontSize: 20,
        color: '#00A2A2',
        fontWeight: '700',
        alignSelf: 'center',
    },
    timerText: {
        fontSize: 25,
        fontWeight: '700',
        position: 'absolute',
        top: '10%',
        right: 10,
        color: '#ff0000',
    },
    disabledButtonContainer: {
        padding: 10,
    },
    disabledButton: {
        backgroundColor: '#cccccc',
        borderRadius: 25,
        width: 'auto',
        minWidth: 150,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButtonText: {
        textAlign: 'center',
        color: '#666666',
        fontSize: 16,
        fontWeight: 'normal',
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

export default connect(mapStateToProps, mapDisPatchToProps)(StandEyes);
