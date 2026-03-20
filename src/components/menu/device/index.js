import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  NativeEventEmitter,
  NativeModules,
  Platform,
  PermissionsAndroid,
  AppState,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import HeaderFix from '../../common/HeaderFix';
import Toast from 'react-native-simple-toast';
import BleManager from 'react-native-ble-manager';
import UI from '../../../config/styles/CommonStyles';
import {connect} from 'react-redux';
import Lang from '../../../assets/language/menu/lang_device';
import {getLocalizedText} from '../../../assets/language/langUtils';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';
import RNPermissions, {PERMISSIONS} from 'react-native-permissions';
import RefreshComponent from '../../common/RefreshComponent';

const window = Dimensions.get('window');

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

class index extends Component {
  constructor() {
    super();
    this.peripherals = new Map();
    this.state = {
      scanning: false,
      bleList: [],
      appState: '',
      battLeft: '100',
      battRight: '100',
      ltime: new Date(),
      rtime: new Date(),
      left: '',
      right: '',
      extra: 0,
    };

    this.handleDiscoverPeripheral = this.handleDiscoverPeripheral.bind(this);
    this.handleStopScan = this.handleStopScan.bind(this);
    this.handleDisconnectedPeripheral =
      this.handleDisconnectedPeripheral.bind(this);
    this.handleAppStateChange = this.handleAppStateChange.bind(this);
  }

  async checkPermission() {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        const isGranted =
          result['android.permission.BLUETOOTH_CONNECT'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.BLUETOOTH_SCAN'] ===
            PermissionsAndroid.RESULTS.GRANTED;

        if (isGranted) {
          this.enableBLE();
          console.log('Android 12+ BLE Permissions OK');
        } else {
          console.log('Android 12+ BLE Permissions Refused');
          Toast.show('Please allow Bluetooth Permission to scan devices');
        }
      } else if (Platform.Version >= 23) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        if (
          result['android.permission.ACCESS_FINE_LOCATION'] ===
          PermissionsAndroid.RESULTS.GRANTED
        ) {
          this.enableBLE();
          console.log('Location Permission OK');
        } else {
          console.log('Location Permission Refused');
          Toast.show('Please allow Location Permission to scan devices');
        }
      } else {
        this.enableBLE();
      }
    } else {
      RNPermissions.request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE)
        .then(status => {
          this.enableBLE();
          console.log('status', status);
          RNPermissions.requestMultiple([
            RNPermissions.PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL,
          ]).then(result => {
            if (result) {
              this.enableBLE();
              console.log('User accept');
            } else {
              console.log('User refuse');
            }
          });
        })
        .catch(error => {
          console.error(error);
        });
    }
  }

  enableBLE() {
    if (Platform.OS === 'android') {
      BleManager.enableBluetooth()
        .then(() => {
          this.startBLE();
          console.log('The bluetooth is already enabled or the user confirm');
        })
        .catch(error => {
          console.log('The user refuse to enable bluetooth');
          this.startBLE();
        });
    } else if (Platform.OS === 'ios') {
      this.startBLE();
    }
  }

  componentDidMount() {
    BleManager.checkState();
    this.checkPermission();

    AppState.addEventListener('change', this.handleAppStateChange);
    this.handlerDiscover = bleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      this.handleDiscoverPeripheral,
    );
    this.handlerStop = bleManagerEmitter.addListener(
      'BleManagerStopScan',
      this.handleStopScan,
    );
    this.handlerDisconnect = bleManagerEmitter.addListener(
      'BleManagerDisconnectPeripheral',
      this.handleDisconnectedPeripheral,
    );

    this.retrieveConnected();
  }

  startBLE() {
    const initAndScan = () => {
      BleManager.start({showAlert: false}).then(() => {
        console.log('Module initialized');
        this.startReading();
        this.retrieveConnected();
        this.startScan();
      });
    };

    if (Platform.OS === 'android') {
      if (
        RNAndroidLocationEnabler &&
        RNAndroidLocationEnabler.promptForEnableLocationIfNeeded
      ) {
        RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
          interval: 10000,
          fastInterval: 5000,
        })
          .then(data => {
            console.log('Location enabled:', data);
            initAndScan();
          })
          .catch(err => {
            console.log('Location enable error:', err);
            initAndScan();
          });
      } else {
        console.log(
          'RNAndroidLocationEnabler is undefined - skipping location prompt',
        );
        initAndScan();
      }
    } else {
      initAndScan();
    }
  }

  handleAppStateChange(nextAppState) {
    if (
      this.state.appState.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      console.log('App has come to the foreground!');
      BleManager.getConnectedPeripherals([]).then(peripheralsArray => {
        console.log('Connected peripherals: ' + peripheralsArray.length);
        this.setState({bleList: peripheralsArray});
      });
    }
    this.setState({appState: nextAppState});
  }

  componentWillUnmount() {
    if (this.handlerDiscover) this.handlerDiscover.remove();
    if (this.handlerStop) this.handlerStop.remove();
    if (this.handlerDisconnect) this.handlerDisconnect.remove();
    if (this.dataRecord) this.dataRecord.remove();
  }

  handleDisconnectedPeripheral(data) {
    let peripheral = this.peripherals.get(data.peripheral);
    if (peripheral) {
      peripheral.connected = false;
      this.peripherals.set(peripheral.id, peripheral);
      this.setState({bleList: Array.from(this.peripherals.values())});
    }
    console.log('Disconnected from ' + data.peripheral);
  }

  async startReading() {
    if (this.dataRecord) {
      this.dataRecord.remove();
    }

    this.dataRecord = bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      ({value, peripheral, characteristic, service}) => {
        let time = new Date();
        if (peripheral === this.props.leftDevice) {
          if (time - this.state.ltime > 250) {
            this.setState({battLeft: value[value.length - 1], ltime: time});
          }
        }
        if (peripheral === this.props.rightDevice) {
          if (time - this.state.rtime > 250) {
            this.setState({battRight: value[value.length - 1], rtime: time});
          }
        }
      },
    );
  }

  handleStopScan() {
    console.log('Scan is stopped');
    this.setState({scanning: false});
  }

  startScan() {
    if (!this.state.scanning) {
      this.setState({peripherals: new Map()});
      BleManager.scan([], 5, true)
        .then(() => {
          console.log('Scanning...');
          this.setState({scanning: true, bleList: []});
        })
        .catch(err => {
          console.log('Scan failed to start:', err);
        });
    }
  }

  checkConnection(id) {
    BleManager.isPeripheralConnected(id, []).then(isConnected => {
      if (!isConnected) {
        let peripheral = this.peripherals.get(id);
        if (peripheral) {
          peripheral.connected = false;
          this.peripherals.delete(id);
          this.setState({bleList: Array.from(this.peripherals.values())});
        }
      }
    });
  }

  retrieveConnected() {
    console.log('============ retrieveConnected ===========');
    this.props.addLeftDevice(undefined);
    this.props.addRightDevice(undefined);
    this.setState({bleList: []});

    BleManager.getConnectedPeripherals([])
      .then(results => {
        if (results.length === 0) {
          console.log('No connected peripherals');
          return;
        }

        const leftDevices = [];
        const rightDevices = [];

        results.forEach(peripheral => {
          if (!peripheral.name) return;
          if (peripheral.name.endsWith('L')) {
            this.props.addLeftDevice(peripheral.id);
            leftDevices.push(peripheral.id);
          } else if (peripheral.name.endsWith('R')) {
            this.props.addRightDevice(peripheral.id);
            rightDevices.push(peripheral.id);
          }
          this.checkConnection(peripheral.id);
          peripheral.connected = true;
          this.peripherals.set(peripheral.id, peripheral);
        });

        this.setState({
          left: leftDevices.length > 0 ? leftDevices[0] : '',
          right: rightDevices.length > 0 ? rightDevices[0] : '',
          bleList: Array.from(this.peripherals.values()),
        });
      })
      .catch(error => {
        console.error('Error retrieving connected peripherals:', error);
      });
  }

  handleDiscoverPeripheral(peripheral) {
    const deviceName =
      peripheral.name ||
      (peripheral.advertising && peripheral.advertising.localName);
    if (deviceName) {
      let nameSuffix = deviceName.trim().slice(-1);
      if (nameSuffix === 'L' || nameSuffix === 'R') {
        peripheral.name = deviceName;
        this.peripherals.set(peripheral.id, peripheral);
        this.setState({bleList: Array.from(this.peripherals.values())});
      }
    }
  }

  handleDeviceTap = item => {
    if (item.connected) {
      Alert.alert(
        'ยืนยันการตัดการเชื่อมต่อ',
        `ต้องการตัดการเชื่อมต่อ ${item.name} หรือไม่?`,
        [
          {text: 'ยกเลิก', style: 'cancel'},
          {
            text: 'ตัดการเชื่อมต่อ',
            style: 'destructive',
            onPress: () => this.actionConnectDevice(item),
          },
        ],
      );
    } else {
      this.actionConnectDevice(item);
    }
  };

  actionConnectDevice = async peripheral => {
    if (!peripheral) return;

    if (peripheral.connected) {
      if (peripheral.name?.endsWith('L')) {
        this.props.addLeftDevice(undefined);
        this.setState({left: ''});
      } else if (peripheral.name?.endsWith('R')) {
        this.props.addRightDevice(undefined);
        this.setState({right: ''});
      }
      BleManager.disconnect(peripheral.id).catch(error => {
        console.log(error);
        Alert.alert('Error disconnecting', 'Please try again');
      });
    } else {
      BleManager.connect(peripheral.id)
        .then(() => {
          let p = this.peripherals.get(peripheral.id);
          if (p) {
            p.connected = true;
            this.peripherals.set(peripheral.id, p);
            this.setState({bleList: Array.from(this.peripherals.values())});
          }
          if (peripheral.name?.endsWith('L')) {
            this.props.addLeftDevice(peripheral.id);
          } else if (peripheral.name?.endsWith('R')) {
            this.props.addRightDevice(peripheral.id);
          }

          BleManager.retrieveServices(peripheral.id).then(() => {
            const service = '0000FFE0-0000-1000-8000-00805F9B34FB';
            const char = '0000FFE1-0000-1000-8000-00805F9B34FB';

            BleManager.startNotification(peripheral.id, service, char).then(
              () => {
                console.log('Started notification on ' + peripheral.id);
                // Write initial setup
                BleManager.write(peripheral.id, service, char, [0]).then(() => {
                  BleManager.write(peripheral.id, service, char, [1, 95]);
                });
              },
            );
          });
        })
        .catch(error => {
          Toast.show(`${peripheral.id} connection error`);
          console.log('Connection error', error);
        });
    }
  };

  checkLeftRight(name) {
    if (!name) return null;
    const source = name.endsWith('L')
      ? require('../../../assets/image/foot/Left.png')
      : name.endsWith('R')
      ? require('../../../assets/image/foot/Right.png')
      : null;

    if (!source) return null;
    return (
      <Image
        style={{width: 20, height: 50}}
        resizeMode={'contain'}
        source={source}
        tintColor={'red'}
      />
    );
  }

  renderItem(item) {
    const color = item.connected ? 'mediumspringgreen' : '#fff';
    return (
      <TouchableHighlight
        onPress={() => this.handleDeviceTap(item)}
        underlayColor="#f0f0f0">
        <View style={deviceStyles.itemCard}>
          <View style={[deviceStyles.itemContent, {backgroundColor: color}]}>
            {!item.connected && (
              <View style={{marginRight: 15}}>
                {this.checkLeftRight(item.name)}
              </View>
            )}
            <View style={{flex: 1}}>
              <Text style={{fontSize: 15, color: '#000', fontWeight: 'bold'}}>
                {item.name}
              </Text>
              {item.connected ? (
                <Text style={{fontSize: 13, color: '#333'}}>
                  Battery :{' '}
                  {item?.name?.endsWith('L')
                    ? this.state.battLeft
                    : this.state.battRight}{' '}
                  %
                </Text>
              ) : (
                <Text style={{fontSize: 12, color: '#666'}}>
                  Signal Strength: {item.rssi}
                </Text>
              )}
              <Text style={{fontSize: 12, color: '#666'}}>ID : {item.id}</Text>
            </View>
            {item.connected && (
              <View style={{alignItems: 'center', marginLeft: 10}}>
                <Image
                  source={require('../../../assets/image/checked.png')}
                  tintColor={'#fff'}
                  style={{width: 24, height: 24}}
                />
                <Text style={{fontSize: 10, color: '#000'}}>Connected</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableHighlight>
    );
  }

  render() {
    const list = Array.from(this.peripherals.values());
    const btnScanTitle = this.state.scanning
      ? getLocalizedText(this.props.lang, Lang.scanningForDevices)
      : getLocalizedText(this.props.lang, Lang.scanBluetooth);

    return (
      <View style={styles.container}>
        <HeaderFix
          icon_left={'left'}
          onpress_left={() => this.props.navigation.goBack()}
          title={getLocalizedText(this.props.lang, Lang.title)}
        />
        <RefreshComponent methodToCall={() => this.retrieveConnected()} />
        <View style={styles.listArea}>
          {list.length === 0 && !this.state.scanning && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {getLocalizedText(this.props.lang, Lang.noDeviceList)}
              </Text>
            </View>
          )}
          {this.state.scanning && list.length === 0 ? (
            <ActivityIndicator
              size="large"
              color="#00bfc5"
              style={{marginTop: 50}}
            />
          ) : (
            <FlatList
              data={list}
              renderItem={({item}) => this.renderItem(item)}
              keyExtractor={item => item.id}
              contentContainerStyle={{paddingBottom: 20}}
            />
          )}
        </View>
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => this.startScan()}>
            <Text style={styles.scanButtonText}>{btnScanTitle}</Text>
            {this.state.scanning && (
              <ActivityIndicator color="#fff" style={{marginLeft: 10}} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const deviceStyles = StyleSheet.create({
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 6,
    marginHorizontal: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  itemContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listArea: {
    flex: 1,
    paddingTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  scanButton: {
    backgroundColor: UI.color_Gradient[1],
    paddingVertical: 14,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

const mapStateToProps = state => ({
  leftDevice: state.leftDevice,
  rightDevice: state.rightDevice,
  lang: state.lang,
});

const mapDispatchToProps = dispatch => ({
  addLeftDevice: device => dispatch({type: 'ADD_LEFT_DEVICE', payload: device}),
  addRightDevice: device =>
    dispatch({type: 'ADD_RIGHT_DEVICE', payload: device}),
});

export default connect(mapStateToProps, mapDispatchToProps)(index);
