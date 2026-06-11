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
    this.flushBufferToDisk(); // Flush remaining data before unmount
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
            const dir = `${RNFS.CachesDirectoryPath}/suratechM/`;
            const files = await RNFS.readDir(dir);

            // Sort files by name so older sessions upload first
            const sortedFiles = files.sort((a, b) => a.name.localeCompare(b.name));

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

                    const content = {
                        data,
                        id_customer: this.props.user.id_customer,
          session_id: this.currentSessionId || Date.now().toString(),
                        id_device: "",
                        type: 1, // medical
                        product_number: this.props.productNumber,
                        bluetooth_left_id: this.props.leftDevice,
                        bluetooth_right_id: this.props.rightDevice,
                        shoe_size: this.state.shoeSize || 0,
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
                            const dashStatJson = await dashStatResp.json();

                            // 3) Update / persist user dash data (same as pressure map)
                            const userDataResp = await fetch(`${API}member/get_user_data`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    id: this.props.user.id_customer,
                                    ...dashStatJson,
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



    handleStart = () => {
        const { rightDevice, leftDevice } = this.props;
        // if (!rightDevice && !leftDevice) {
        //     Alert.alert('Warning!', 'Please Check Your Bluetooth Connect');
        //     return;
        // }

        this.setState({ textAction: 'Recording...' });

        const start = new Date();
        this.readInterval = setInterval(() => {
            const time = new Date();
            const data = {
                stamp: time.getTime(),
                timestamp: time,
                duration: Math.floor((time - start) / 1000),
                left: {
                    sensor: this.lsensor,
                    swing: 0,
                    stance: 0,
                },
                right: {
                    sensor: this.rsensor,
                    swing: 0,
                    stance: 0,
                },
                id_customer: this.props.user.id_customer,
          session_id: this.currentSessionId || Date.now().toString(),
            };

            RNFS.appendFile(
                `${RNFS.CachesDirectoryPath}/suratechM/${start.getFullYear()}${start.getMonth()}${start.getDate()}${this.round}`,
                JSON.stringify(data) + ',',
            ).catch(() => {
                RNFS.mkdir(`${RNFS.CachesDirectoryPath}/suratechM/`).then(() => {
                    RNFS.appendFile(
                        `${RNFS.CachesDirectoryPath}/suratechM/${start.getFullYear()}${start.getMonth()}${start.getDate()}${this.round}`,
                        JSON.stringify(data) + ',',
                    );
                });
            });
        }, 100);

        setTimeout(() => {
            clearInterval(this.readInterval);
    clearInterval(this.flushInterval);
    this.flushBufferToDisk(); // Flush remaining data before unmount
            this.setState({ textAction: 'Start' });
            this.sendDataToServer();
        }, 10000);
    };

    handleToggleRecording = () => {
        if (this.state.isRecording) {
            clearInterval(this.readInterval);
    clearInterval(this.flushInterval);
    this.flushBufferToDisk(); // Flush remaining data before unmount
            this.sendDataToServer();
            this.setState({ isRecording: false });

            setTimeout(() => {
                this.props.navigation.goBack();
            }, 500);
        } else {
            const { rightDevice, leftDevice } = this.props;
            if (!rightDevice && !leftDevice) {
                Alert.alert('Warning!', 'Please check your Bluetooth connection.');
                return;
            }
            this.sampleSeq = 0;
            // console.log('DEBUGGING TESTING MODE: Bluetooth check disabled');

            const start = new Date();
            this.readInterval = setInterval(() => {
                const time = new Date();
                const stamp = time.getTime();
                const data = {
                    seq: this.sampleSeq++,
                    stamp: time.getTime(),
                    timestamp: new Date(stamp).toISOString(),
                    duration: Math.floor((time - start) / 1000),
                    left: {
                        sensor: this.lsensor,
                        swing: 0,
                        stance: 0,
                    },
                    right: {
                        sensor: this.rsensor,
                        swing: 0,
                        stance: 0,
                    },
                    id_customer: this.props.user.id_customer,
          session_id: this.currentSessionId || Date.now().toString(),
                };

                RNFS.appendFile(
                    `${RNFS.CachesDirectoryPath}/suratechM/${start.getFullYear()}${start.getMonth()}${start.getDate()}${this.round}`,
                    JSON.stringify(data) + ',',
                ).catch(() => {
                    RNFS.mkdir(`${RNFS.CachesDirectoryPath}/suratechM/`).then(() => {
                        RNFS.appendFile(
                            `${RNFS.CachesDirectoryPath}/suratechM/${start.getFullYear()}${start.getMonth()}${start.getDate()}${this.round}`,
                            JSON.stringify(data) + ',',
                        );
                    });
                });
            }, 100);

            this.setState({ isRecording: true }); // Update the state to reflect recording has started
        }
    };

    render() {

        return (
            <View style={styles.container}>
                <HeaderFix
                    icon_left="left"
                    onpress_left={() => this.props.navigation.goBack()}
                    title={getLocalizedText(this.props.lang, langAssessment.tenMeterWalkTest)}
                    rightText={getLocalizedText(this.props.lang, langAssessment.finish)}
                    onpress_right={() => Alert.alert(getLocalizedText(this.props.lang, langAssessment.testComplete))}
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
