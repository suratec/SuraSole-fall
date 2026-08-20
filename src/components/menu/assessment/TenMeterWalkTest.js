import React, { Component } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Alert,
    Vibration,
    ScrollView,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connect } from 'react-redux';
import RNFS from 'react-native-fs';
import BleManager from 'react-native-ble-manager';
import { NativeModules, NativeEventEmitter } from 'react-native';
import HeaderFix from '../../common/HeaderFix';
import API from '../../../config/Api';
import langAssessment from '../../../assets/language/menu/lang_assessmentTests';
import {getLocalizedText} from '../../../assets/language/langUtils';
import {
    TEN_METER_CACHE_DIRECTORY,
    TEN_METER_FILE_PREFIX,
    enqueueAssessmentUploads,
} from '../../../services/assessmentUploadApi';


const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
class TenMeterWalkTest extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isConnected: true,
            textAction: getLocalizedText(this.props.lang, langAssessment.startText),
            isRecording: false,
            shoeSize: 0,
            // countDownTimer: 10,
        };

        this.round = Math.floor(1000 + Math.random() * 9000);

        this.dataBuffer = []; // Buffer for sensor data to reduce file I/O
        this.lsensor = [0, 0, 0, 0, 0];
        this.rsensor = [0, 0, 0, 0, 0];
        this.sampleSeq = 0;
    }

    async componentDidMount() {
        const noti = await AsyncStorage.getItem('notiSetting');
        if (noti) this.setState({ notiAlarm: parseInt(noti) });
        NetInfo.addEventListener(this.handleConnectivityChange);

        this.focusListener = this.props.navigation.addListener('focus', () => {
            this.retrieveConnected();
            this.startReading();
        });
    }

    componentWillUnmount() {
        clearInterval(this.readInterval);
        clearInterval(this.flushInterval);
        this.isRecordingTransition = false;
        this.flushBufferToDisk().catch(error => {
            console.log('Unable to flush 10MWT data during unmount:', error);
        });
        if (this.dataRecord) this.dataRecord.remove();
        if (typeof this.focusListener === 'function') {
            this.focusListener();
        } else if (this.focusListener && typeof this.focusListener.remove === 'function') {
            this.focusListener.remove();
        }
    }

    handleConnectivityChange = status => {
        this.setState({ isConnected: status.isConnected });
    };

    toDecimalArray(byteArray) {
        let dec = [];
        for (let i = 0; i < byteArray.length - 1; i += 2) {
            dec.push(byteArray[i] * 255 + byteArray[i + 1]);
        }
        return dec;
    }

    recordData(data, sensor) {
        if (sensor === 'L') this.lsensor = data;
        else this.rsensor = data;
    }

    retrieveConnected() {
        BleManager.getConnectedPeripherals([]).then(results => {
            results.forEach(peripheral => this.connectPeripheral(peripheral));
        });
    }

    connectPeripheral(peripheral) {
        BleManager.connect(peripheral.id).then(() => {
            if (peripheral.name?.endsWith('L')) {
                this.props.addLeftDevice(peripheral.id);
                // Extract last two chars before trailing 'L' (e.g., "39L" → "39")
                const name = peripheral.name || '';
                if (name.length >= 3) {
                    const sz = name[name.length - 3] + name[name.length - 2];
                    this.setState({ shoeSize: sz });
                    } else {
                    this.setState({ shoeSize: 0 });
                    }
            } else if (peripheral.name?.endsWith('R')) {
                this.props.addRightDevice(peripheral.id);
            }
        });
    }

    startReading() {
        this.dataRecord = bleManagerEmitter.addListener(
            'BleManagerDidUpdateValueForCharacteristic',
            ({ value, peripheral }) => {
                const time = new Date();
                const data = this.toDecimalArray(value);
                if (peripheral === this.props.rightDevice) this.recordData(data, 'R');
                if (peripheral === this.props.leftDevice) this.recordData(data, 'L');
            }
        );
    }

    sendDataToServer = async () => {
        try {
            const files = await RNFS.readDir(TEN_METER_CACHE_DIRECTORY).catch(() => []);

            // Sort files by name so older sessions upload first
            const sortedFiles = files
                .filter(file => file.name.startsWith(TEN_METER_FILE_PREFIX))
                .sort((a, b) => a.name.localeCompare(b.name));

            for (const file of sortedFiles) {
                try {
                    const text = await RNFS.readFile(file.path);

                    if (!text || !text.trim()) {
                        console.log("Skipping empty file:", file.path);
                        continue;
                    }

                    // Clean trailing comma if present
                    const trimmed = text.endsWith(",") ? text.slice(0, -1) : text;

                    // Parse JSON and sort entries
                    let data = [];
                    try {
                        data = JSON.parse(`[${trimmed}]`).sort((a, b) => {
                            if (a.seq != null && b.seq != null) return a.seq - b.seq;
                            return a.stamp - b.stamp;
                        });
                    } catch (parseErr) {
                        console.error("JSON parse error in file:", file.path, parseErr);
                        continue;
                    }

                    const firstSample = data[0] || {};
                    const sessionId = String(firstSample.session_id || '');
                    const isSingleSession = sessionId && data.every(sample =>
                        String(sample.session_id || '') === sessionId,
                    );

                    if (!isSingleSession) {
                        console.warn('10MWT file contains missing or mixed session IDs; keeping file:', file.path);
                        continue;
                    }

                    const content = {
                        data,
                        id_customer: firstSample.id_customer || this.props.user.id_customer,
                        session_id: sessionId,
                        id_device: "",
                        type: 1, // medical
                        product_number: firstSample.product_number || this.props.productNumber,
                        bluetooth_left_id: firstSample.bluetooth_left_id || this.props.leftDevice,
                        bluetooth_right_id: firstSample.bluetooth_right_id || this.props.rightDevice,
                        shoe_size: firstSample.shoe_size || this.state.shoeSize || 0,
                        leg_type: "10MWT", // important: mark this as 10 Meter Walk Test
                    };

                    // 1) Upload raw record
                    const response = await fetch(`${API}/addjson`, {
                        method: "POST",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(content),
                    });

                    // Defensive: server may return text or JSON
                    const respText = await response.text();
                    console.log("===========API Response (addjson)============");
                    console.log(respText);

                    let resp;
                    try {
                        resp = JSON.parse(respText);
                    } catch {
                        console.error("Server did not return JSON. Raw response:", respText);
                        // Do not delete the file if backend didn’t accept it
                        continue;
                    }

                    if (resp.status !== "ผิดพลาด") {
                        // If upload is accepted, clear the local file
                        console.log("Clearing file:", file.path);
                        await RNFS.unlink(file.path);

                        // 2) Trigger dashboard stat recompute (same as pressure map)
                        try {
                            const dashStatResp = await fetch(`${API}member/getUserDashboardStatic`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    id: this.props.user.id_customer,
                                }),
                            });

                            console.log("===========API Response (getUserDashboardStatic)============");
                            await dashStatResp.json();

                            // 3) Update / persist user dash data (same as pressure map)
                            const userDataResp = await fetch(`${API}member/get_user_data`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    id: this.props.user.id_customer,
                                }),
                            });

                            console.log("===========API Response (get_user_data)============");
                            // You only logged res in pressure map; here we read & log json safely
                            const userDataJson = await userDataResp.json();
                            console.log(userDataJson, "responseFromAPI (10MWT)");
                        } catch (dashErr) {
                            console.log("Dashboard update error (10MWT):", dashErr);
                        }
                    } else {
                        // resp.status === 'ผิดพลาด' -> backend rejected; keep file for retry
                        console.warn("addjson returned error status; keeping file:", file.path);
                    }
                } catch (fileErr) {
                    console.error("Error handling file:", file.path, fileErr);
                }
            }

            // Optional: mirror pressuremap’s alert UX (or use toast)
            Alert.alert(getLocalizedText(this.props.lang, langAssessment.testComplete));
        } catch (err) {
            console.error("sendDataToServer error:", err);
        }
    };



    handleToggleRecording = async () => {
        if (this.isRecordingTransition) return;

        if (this.state.isRecording) {
            await this.finishAndReturnHome();
        } else {
            const { rightDevice, leftDevice } = this.props;
            if (!rightDevice && !leftDevice) {
                Alert.alert('Warning!', 'Please check your Bluetooth connection.');
                return;
            }
            this.isRecordingTransition = true;
            this.sampleSeq = 0;
            this.currentSessionId = Date.now().toString();
            this.recordingStart = new Date();
            this.recordingPath =
                `${TEN_METER_CACHE_DIRECTORY}/${TEN_METER_FILE_PREFIX}${this.currentSessionId}`;
            this.dataBuffer = [];

            this.setState({ isRecording: true }, () => {
                this.isRecordingTransition = false;
            });

            this.readInterval = setInterval(() => {
                const time = new Date();
                const stamp = time.getTime();
                this.dataBuffer.push({
                    seq: this.sampleSeq++,
                    stamp,
                    timestamp: new Date(stamp).toISOString(),
                    duration: Math.floor((time - this.recordingStart) / 1000),
                    left: {
                        sensor: [...this.lsensor],
                        swing: 0,
                        stance: 0,
                    },
                    right: {
                        sensor: [...this.rsensor],
                        swing: 0,
                        stance: 0,
                    },
                    id_customer: this.props.user.id_customer,
                    session_id: this.currentSessionId,
                    product_number: this.props.productNumber || '',
                    bluetooth_left_id: this.props.leftDevice || '',
                    bluetooth_right_id: this.props.rightDevice || '',
                    shoe_size: this.state.shoeSize || 0,
                });
            }, 100);

            this.flushInterval = setInterval(() => {
                this.flushBufferToDisk().catch(error => {
                    console.log('10MWT buffer flush failed:', error);
                });
            }, 2000);
        }
    };

    finishAndReturnHome = async () => {
        if (this.isRecordingTransition) return;
        this.isRecordingTransition = true;
        clearInterval(this.readInterval);
        clearInterval(this.flushInterval);

        try {
            await this.flushBufferToDisk();
            enqueueAssessmentUploads({
                isConnected: this.state.isConnected,
                userId: this.props.user?.id_customer,
                productNumber: this.props.productNumber,
                leftDevice: this.props.leftDevice,
                rightDevice: this.props.rightDevice,
                shoeSize: this.state.shoeSize,
            }).catch(error => {
                console.log('Background 10MWT upload failed:', error);
            });
            this.setState({isRecording: false});
            this.props.navigation.popTo('Home');
        } catch (error) {
            console.error('Unable to finish 10MWT:', error);
            Alert.alert(getLocalizedText(this.props.lang, langAssessment.submissionFailed));
            this.setState({isRecording: false});
        } finally {
            this.isRecordingTransition = false;
        }
    };

    async flushBufferToDisk() {
        if (this.flushInProgress) {
            await this.flushInProgress;
            if (this.dataBuffer.length > 0) return this.flushBufferToDisk();
            return;
        }
        if (!this.recordingPath || this.dataBuffer.length === 0) return;

        const toFlush = this.dataBuffer.splice(0);
        const chunk = toFlush.map(sample => JSON.stringify(sample)).join(',') + ',';
        const writePromise = (async () => {
            await RNFS.mkdir(TEN_METER_CACHE_DIRECTORY);
            await RNFS.appendFile(this.recordingPath, chunk);
        })();
        this.flushInProgress = writePromise;

        try {
            await writePromise;
        } catch (error) {
            this.dataBuffer = toFlush.concat(this.dataBuffer);
            throw error;
        } finally {
            if (this.flushInProgress === writePromise) this.flushInProgress = null;
        }
    }

    render() {

        return (
            <View style={styles.container}>
                <HeaderFix
                    icon_left="left"
                    onpress_left={() => this.props.navigation.goBack()}
                    title={getLocalizedText(this.props.lang, langAssessment.tenMeterWalkTest)}
                    rightText={getLocalizedText(this.props.lang, langAssessment.finish)}
                    onpress_right={() => {
                        if (this.state.isRecording) this.finishAndReturnHome();
                        else this.props.navigation.popTo('Home');
                    }}
                />

                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        padding: 20,
                    }}
                    showsVerticalScrollIndicator={false}
                >
                <View style={styles.content}>
                    <Image
                        source={require('../../../assets/image/dynamic/tenmeter.png')}
                        style={styles.image}
                    />
                    <Text style={styles.title}>{getLocalizedText(this.props.lang, langAssessment.walking)}</Text>
                    <Text style={styles.description}>{getLocalizedText(this.props.lang, langAssessment.walkStraight)}</Text>
                </View>

                    <TouchableOpacity
                        style={[
                            styles.button,
                            this.state.isRecording && { backgroundColor: '#D02222' }
                        ]}
                        onPress={this.handleToggleRecording}
                    >
                        <Text style={styles.buttonText}>
                            {this.state.isRecording
                                ? getLocalizedText(this.props.lang, langAssessment.stopText)
                                : getLocalizedText(this.props.lang, langAssessment.startText)}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    content: {
        alignItems: 'center',
        // marginTop: 50,
    },
    image: {
        width: '100%',
        height: 500,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 30,
        fontWeight: '700',
        color: '#00A2A2',
        // marginTop: 20,
    },
    description: {
        fontSize: 20,
        color: '#00A2A2',
        marginTop: 10,
    },
    button: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        backgroundColor: '#00A2A2',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
    },
});

const mapStateToProps = state => ({
    user: state.user,
    rightDevice: state.rightDevice,
    leftDevice: state.leftDevice,
    productNumber: state.productNumber,
    lang: state.lang,
});

const mapDispatchToProps = dispatch => ({
    addLeftDevice: device => dispatch({ type: 'ADD_LEFT_DEVICE', payload: device }),
    addRightDevice: device => dispatch({ type: 'ADD_RIGHT_DEVICE', payload: device }),
});

export default connect(mapStateToProps, mapDispatchToProps)(TenMeterWalkTest);
