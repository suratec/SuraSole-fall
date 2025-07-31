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
            // countDownTimer: 10,
        };

        this.round = Math.floor(1000 + Math.random() * 9000);
        this.lsensor = [0, 0, 0, 0, 0];
        this.rsensor = [0, 0, 0, 0, 0];
    }

    async componentDidMount() {
        const noti = await AsyncStorage.getItem('notiSetting');
        if (noti) this.setState({ notiAlarm: parseInt(noti) });
        NetInfo.addEventListener(this.handleConnectivityChange);

        this.focusListener = this.props.navigation.addListener('didFocus', () => {
            this.retrieveConnected();
            this.startReading();
        });
    }

    componentWillUnmount() {
        clearInterval(this.readInterval);
        if (this.dataRecord) this.dataRecord.remove();
        if (this.focusListener) this.focusListener.remove();
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

    sendDataToServer = () => {
        RNFS.readDir(RNFS.CachesDirectoryPath + '/suratechM/').then(res => {
            res.forEach(r => {
                RNFS.readFile(r.path)
                    .then(text => {
                        const data = JSON.parse('[' + text.slice(0, -1) + ']');
                        const content = {
                            data,
                            id_customer: this.props.user.id_customer,
                            id_device: '',
                            type: 1,
                            product_number: this.props.productNumber,
                            bluetooth_left_id: this.props.leftDevice,
                            bluetooth_right_id: this.props.rightDevice,
                            shoe_size: 0,
                            leg_type: '10MWT',
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
                                if (resp.status !== 'ผิดพลาด') {
                                    RNFS.unlink(r.path);
                                }
                            });
                    })
                    .catch(e => console.error(e));
            });
        });
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
            this.setState({ textAction: 'Start' });
            this.sendDataToServer();
        }, 10000);
    };

    handleToggleRecording = () => {
        if (this.state.isRecording) {
            clearInterval(this.readInterval);
            this.sendDataToServer();
            this.setState({ isRecording: false });
        } else {
            const { rightDevice, leftDevice } = this.props;
            if (!rightDevice && !leftDevice) {
                Alert.alert('Warning!', 'Please check your Bluetooth connection.');
                return;
            }

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
        marginTop: 50,
    },
    image: {
        width: '100%',
        height: 300,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#00A2A2',
        marginTop: 20,
    },
    description: {
        fontSize: 16,
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
