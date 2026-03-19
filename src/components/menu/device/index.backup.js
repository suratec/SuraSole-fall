import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  NativeEventEmitter,
  NativeModules,
  Platform,
  PermissionsAndroid,
  ScrollView,
  AppState,
  FlatList,
  Dimensions,
  Button,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import HeaderFix from '../../common/HeaderFix';
import Toast from 'react-native-simple-toast';
import { ActionSheet } from '../../common/NativeBaseShim';
import BleManager from 'react-native-ble-manager';
import { Card, CardItem, Icon } from '../../common/NativeBaseShim';
import UI from '../../../config/styles/CommonStyles';
import { connect } from 'react-redux';
import Lang from '../../../assets/language/menu/lang_device';
import { getLocalizedText } from '../../../assets/language/langUtils';
import { stat } from 'react-native-fs';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';
import RNPermissions, { NotificationOption, Permission, PERMISSIONS } from 'react-native-permissions';
import RefreshComponent from '../../common/RefreshComponent';

const window = Dimensions.get('window');

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
// const peripherals = new Map();

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
      data: [],
      left: '',
      right: '',
      extra: 0
    };

    this.handleDiscoverPeripheral = this.handleDiscoverPeripheral.bind(this);
    this.handleStopScan = this.handleStopScan.bind(this);
    this.handleDisconnectedPeripheral = this.handleDisconnectedPeripheral.bind(
      this,
    );
    this.handleAppStateChange = this.handleAppStateChange.bind(this);
  }

  checkPermission() {
    if (Platform.OS === 'android') {
      if (Platform.OS === 'android' && Platform.Version >= 29) {
        PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ).then(result => {
          if (result) {
            this.enableBLE();
            console.log('Permission is OK');
          } else {
            PermissionsAndroid.requestMultiple(
              [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN]
            ).then(result => {
              if (result) {
                this.enableBLE();
                console.log('User accept');
              } else {
                console.log('User refuse');
              }
            });
          }
        });
      } else {
        PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ).then(result => {
          if (result) {
            this.enableBLE();
            console.log('Permission is OK');
          } else {
            PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
            ).then(result => {
              if (result) {
                this.enableBLE();
                console.log('User accept');
              } else {
                console.log('User refuse');
              }
            });
          }
        });
      }
    } else {
      RNPermissions.request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE)
        .then((status) => {
          this.enableBLE();
          console.log('status', status);
          RNPermissions.requestMultiple(
            [RNPermissions.PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL]
          ).then(result => {
            if (result) {
              this.enableBLE();
              console.log('User accept');
            } else {
              console.log('User refuse');
            }
          });
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }

  enableBLE() {
    if (Platform.OS === 'android') {
      BleManager.enableBluetooth()
        .then(() => {
          // Success code
          this.startBLE()
          console.log('The bluetooth is already enabled or the user confirm');
        })
        .catch(error => {
          // Failure code
          console.log('The user refuse to enable bluetooth');
        });
    } else if (Platform.OS === 'ios') {
      this.startBLE()
      if (!this.props.isBlueToothOn) {
      }
    }
  }

  componentDidMount() {
    BleManager.checkState();

    this.checkPermission();
    this.startScan();

    // this.startReading();
    // this.startReading();
    console.log(this.props.leftDevice, " this.props.leftDevice ");
  }

  startBLE() {

    BleManager.start({ showAlert: false }).then(() => {
      // Success code
      console.log('Module initialized');
      this.startReading();
    });
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
    if (Platform.OS === 'android') {
      RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
        interval: 10000,
        fastInterval: 5000,
      })
        .then(data => {
          console.log(data);
        })
        .catch(err => {
          console.log(err);
        });
    }
    this.startReading();
    this.retrieveConnected();


  }

  async deviceConnect() {
    let service;
    let characteristicN;

    if (Platform.OS === 'android') {
      service = '0000FFE0-0000-1000-8000-00805F9B34FB';
      characteristicN = '0000FFE1-0000-1000-8000-00805F9B34FB';
    } else {
      service = 'FFE0';
      characteristicN = 'FFE1';
    }

    if (typeof this.props.rightDevice !== 'undefined') {
      await BleManager.connect(this.props.rightDevice);
      await BleManager.retrieveServices(this.props.rightDevice);
      await BleManager.startNotification(
        this.props.rightDevice,
        service,
        characteristicN,
      );
    }
    if (typeof this.props.leftDevice !== 'undefined') {
      await BleManager.connect(this.props.leftDevice);
      await BleManager.retrieveServices(this.props.leftDevice);
      await BleManager.startNotification(
        this.props.leftDevice,
        service,
        characteristicN,
      );
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
        this.setState({ bleList: peripheralsArray });
      });
    }
    this.setState({ appState: nextAppState });
  }

  componentWillUnmount() {
    console.log('componentWillUnmount', this.props.leftDevice);
    console.log('componentWillUnmount', this.props.rightDevice);

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

      this.setState({ bleList: Array.from(this.peripherals.values()) });
    }
    console.log('Disconnected from ' + data.peripheral);
  }

  async startReading() {

    if (this.dataRecord) {
      this.dataRecord.remove(); // Clean up existing listener if any
    }

    this.dataRecord = bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      ({ value, peripheral, characteristic, service }) => {
        let time = new Date();

        if (peripheral === this.props.leftDevice) {
          if (time - this.state.ltime > 250) {
            this.setState({ battLeft: value[value.length - 1] });
            this.setState({ ltime: time });
          }
        }
        if (peripheral === this.props.rightDevice) {
          if (time - this.state.rtime > 250) {
            this.setState({ battRight: value[value.length - 1] });
            this.setState({ rtime: time });
          }
        }
      },
    );
  }

  handleStopScan() {
    console.log('Scan is stopped');
    this.setState({ scanning: false });
  }

  startScan() {

    if (!this.state.scanning) {
      this.setState({ peripherals: new Map() });
      BleManager.scan([], 5, true).then(results => {
        console.log('Scanning...');
        this.setState({ scanning: true, bleList: [] });
      });
    }
  }

  checkConnection(id) {
    BleManager.isPeripheralConnected(id, []).then(isConnected => {
      if (isConnected) {
        console.log('Peripheral is connected!');
      } else {
        console.log('Peripheral is NOT connected!');
      }
    });
  }

  retrieveConnected() {

    //     console.log('============ retrieveConnected ===========');
    //     this.props.addLeftDevice(undefined);
    //     this.props.addRightDevice(undefined);
    //     this.setState({   bleList: []})
    //     BleManager.getConnectedPeripherals([]).then(results => {
    // console.log("322 resulte->",results)
    //       if (results.length == 0) {
    // this.props.addLeftDevice(undefined);
    // this.setState({ left: '' });
    // this.props.addRightDevice(undefined);
    // this.setState({ right: '' });
    //         console.log('No connected peripherals');
    //       }
    // for (var i = 0; i < results.length; i++) {
    //   let peripheral = results[i];
    //   if (peripheral.name[peripheral.name.length - 1] === 'L') {
    //     this.props.addLeftDevice(peripheral.id);
    //     this.setState({ left: peripheral.id });
    //   } else if (peripheral.name[peripheral.name.length - 1] === 'R') {
    //     this.props.addRightDevice(peripheral.id);
    //     this.setState({ right: peripheral.id });
    //   }
    //   this.checkConnection(peripheral.id);
    //   // this.actionConnectDevice(peripheral);
    //   peripheral.connected = true;
    //   this.peripherals.set(peripheral.id, peripheral);
    //   // console.log("343 ->",this.peripherals.values())
    //   this.setState({bleList : Array.from(this.peripherals.values())});
    // }
    //     });

    console.log('============ retrieveConnected ===========');
    this.props.addLeftDevice(undefined);
    this.props.addRightDevice(undefined);
    this.setState({ bleList: [] });

    BleManager.getConnectedPeripherals([]).then(results => {
      console.log("322 resulte->", results);

      if (results.length === 0) {
        this.props.addLeftDevice(undefined);
        this.setState({ left: '' });
        this.props.addRightDevice(undefined);
        this.setState({ right: '' });
        console.log('No connected peripherals');
        return;
      }

      const leftDevices = [];
      const rightDevices = [];


      results.forEach(peripheral => {
        console.log("Device name:", peripheral.name);
        if (!peripheral.name) {
          console.log('Skipping peripheral with null name:', peripheral);
          return;
        }
        if (peripheral.name && peripheral.name.endsWith('L')) {
          this.props.addLeftDevice(peripheral.id);
          leftDevices.push(peripheral.id);
        } else if (peripheral.name && peripheral.name.endsWith('R')) {
          this.props.addRightDevice(peripheral.id);
          rightDevices.push(peripheral.id);
        }
        this.checkConnection(peripheral.id);
        peripheral.connected = true;
        this.peripherals.set(peripheral.id, peripheral);
      });

      // Update state after processing all peripherals
      this.setState({
        left: leftDevices.length > 0 ? leftDevices[0] : '',
        right: rightDevices.length > 0 ? rightDevices[0] : '',
        bleList: Array.from(this.peripherals.values())
      });
    }).catch(error => {
      console.error('Error retrieving connected peripherals:', error);
    });
  }

  handleDiscoverPeripheral(peripheral) {
    // console.log('Got ble peripheral', peripheral.name);
    if (peripheral.name) {
      let name = peripheral.name[peripheral.name.length - 1];
      if (name === 'L' || name === 'R') {
        this.peripherals.set(peripheral.id, peripheral);
      }
    }
    // console.log("peripheral-->",peripheral)
    // console.log('357 Got ble peripheral->',Array.from(this.peripherals.values()));
    this.setState({ bleList: Array.from(this.peripherals.values()) });
  }

  actionConfirmConnect = item => {
    let BUTTONS = [
      item.connected
        ? { text: 'Disconnect', icon: 'link', iconColor: '#3742fa' }
        : { text: 'Connect', icon: 'link', iconColor: '#3742fa' },
      { text: 'Cancel', icon: 'close', iconColor: 'red' },
    ];

    let OptionsIndex = BUTTONS.length - 1;

    return ActionSheet.show(
      {
        options: BUTTONS,
        cancelButtonIndex: OptionsIndex,
        destructiveButtonIndex: OptionsIndex,
        title: 'Option',
      },
      buttonIndex => {
        if (buttonIndex != OptionsIndex) {
          this.actionConnectDevice(item);
        }
      },
    );
  };

  actionConnectDevice = async peripheral => {
    if (peripheral) {
      if (peripheral.connected) {
        if (peripheral.name[peripheral.name.length - 1] === 'L') {
          this.props.addLeftDevice(undefined);
          this.setState({ left: '' });
        } else if (peripheral.name[peripheral.name.length - 1] === 'R') {
          this.props.addRightDevice(undefined);
          this.setState({ right: '' });
        }
        BleManager.disconnect(peripheral.id)
          .then(() => {
            // Success code
            console.log('Disconnected');
          })
          .catch(error => {
            // Failure code
            console.log(error);
            Alert.alert(
              'เกิดข้อผิดพลาดระหว่างอุปกรณ์',
              'โปรดปิดบลูทูธ และดำเนินการเชื่อมต่อใหม่อีกครั้ง',
            );
          });
      } else {
        BleManager.getConnectedPeripherals([]).then(results => {
          if (
            peripheral.name[peripheral.name.length - 1] === 'L' &&
            this.props.leftDevice
          ) {
            Toast.show(`Surasole L has been connected`);
            return;
          } else if (
            peripheral.name[peripheral.name.length - 1] === 'R' &&
            this.props.rightDevice
          ) {
            Toast.show(`Surasole R has been connected`);
            return;
          } else {
            BleManager.connect(peripheral.id)
              .then(() => {
                let p = this.peripherals.get(peripheral.id);
                if (p) {
                  // if(typeof this.props.leftDevice  === 'undefined' || typeof this.props.rightDevice === 'undefined' ){
                  //   p.connected = false;
                  // }else{
                  //   p.connected = true
                  // }

                  p.connected = true;
                  this.peripherals.set(peripheral.id, p);
                  console.log("list------", this.peripherals.values())
                  this.setState({ bleList: Array.from(this.peripherals.values()) });
                }
                if (peripheral.name[peripheral.name.length - 1] === 'L') {
                  this.props.addLeftDevice(peripheral.id);
                } else if (
                  peripheral.name[peripheral.name.length - 1] === 'R'
                ) {
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
                        bakeCharacteristic =
                          '0000FFE1-0000-1000-8000-00805F9B34FB';
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
                            console.log(
                              'Started notification on ' + peripheral.id,
                            );
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
                Toast.show(`${peripheral.id} connection error`);
                console.log('Connection error', error);
              });
          }
        });
      }
    }
  };

  checkLeftRight(name) {
    if (name?.endsWith("L")) {
      return (
        <Image
          style={{ width: 20, height: 50 }}
          resizeMode={'contain'}
          source={require('../../../assets/image/foot/Left.png')}
          tintColor={'red'}
        />
      );
    } else if (name.endsWith("R")) {
      return (
        <Image
          style={{ width: 20, height: 50 }}
          resizeMode={'contain'}
          source={require('../../../assets/image/foot/Right.png')}
          tintColor={'red'}
        />
      );
    } else {
    }
  }

  decimalToHexString(number) {
    if (number < 0) {
      number = 0xffffffff + number + 1;
    }
    if (number == undefined) {
      number = 0xffffffff + number + 1;
    }
    return number.toString(16).toUpperCase();
  }

  convertBLEId(data) {
    console.log(data);
    if (data != undefined) {
      let id = `${this.decimalToHexString(data[15])}:${this.decimalToHexString(
        data[16],
      )}:${this.decimalToHexString(data[17])}:${this.decimalToHexString(
        data[18],
      )}:${this.decimalToHexString(data[19])}:${this.decimalToHexString(
        data[20],
      )}`;
      return id;
    }

  }

  renderItem(item) {
    console.log(item, "item");
    const color = item.connected ? 'mediumspringgreen' : '#fff';
    return (
      <TouchableHighlight onPress={() => this.actionConfirmConnect(item)}>
        <Card>
          <CardItem style={[{ backgroundColor: color }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: "#000" }}>{item.name}</Text>
              {item.connected ? (
                <Text style={{ fontSize: 10, color: "#000" }}>
                  Battery :{' '}
                  {item?.name?.endsWith('L')
                    ? this.state.battLeft
                    : this.state.battRight}{' '}
                  %
                </Text>
              ) : (
                <Text style={{ fontSize: 10, color: "#000" }}>Signal Strength: {item.rssi}</Text>
              )}
              <Text style={{ fontSize: 10, color: "#000" }}>ID : {item.id}
                {/* {this.convertBLEId(item.advertising.manufacturerData.bytes)} */}
              </Text>
            </View>
            {item.connected ? (
              <View style={{ alignItems: 'center' }}>
                {/* <Icon
                  type="AntDesign"
                  name="checkcircle"
                  style={{ color: '#ffffff' }}
                /> */}
                <Image source={require('../../../assets/image/checked.png')} tintColor={"#fff"} style={{ width: 18, height: 18, marginLeft: 10 }} />
                <Text style={{ fontSize: 10, color: "#000" }}>Connected</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row' }}>
                {this.checkLeftRight(item.name)}
              </View>
            )}
          </CardItem>
        </Card>
      </TouchableHighlight>
    );
  }

  render() {
    // const list = this.state.bleList;
    const list = Array.isArray(this.state.bleList) ? this.state.bleList : [...this.state.bleList.values()];
    // console.log("at 607 list->",list)
    // console.log("\n************lisiting \n",this.state.bleList,"\n************lisiting ");
    const btnScanTitle = this.state.scanning
      ? 'Scaning for devices...'
      : 'Scan Bluetooth';

    return (
      <View style={styles.container}>
        <HeaderFix
          icon_left={'left'}
          onpress_left={() => {
            this.props.navigation.navigate('Home');
          }}
          title={getLocalizedText(this.props.lang, Lang.title)}
        />
        <RefreshComponent methodToCall={() => this.retrieveConnected()} />
        <View style={styles.container}>
          <ScrollView style={styles.scroll}>
            {list.length == 0 && (
              <View style={{ flex: 1, margin: 20 }}>
                <Text style={{ textAlign: 'center', alignSelf: 'center' }}>
                  No Device List
                </Text>
              </View>
            )}
            {this.state.scanning ? (
              <ActivityIndicator style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={list}
                renderItem={({ item }) => this.renderItem(item)}
                keyExtractor={item => item.id}
              />
            )}
          </ScrollView>
        </View>
        <View style={{ margin: 10, marginBottom: 50 }}>
          <TouchableOpacity onPress={() => {


            this.setState({
              extra: this.state.extra + 1,
              // bleList: [],
              appState: 'active',
              // data: [],
              // left: '',
              // right: '',
            })
            this.startScan()

          }}
          >
            <View
              style={{
                backgroundColor: UI.color_Gradient[1],
                padding: 10,
                borderRadius: 30,
              }}>
              <Text style={{ textAlign: 'center', color: '#fff', fontSize: 16 }}>
                {btnScanTitle}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    width: window.width,
    height: window.height,
  },
  scroll: {
    flex: 1,
    margin: 10,
  },
});

const mapStateToProps = state => {
  return {
    leftDevice: state.leftDevice,
    rightDevice: state.rightDevice,
    isStart: state.isStart,
    isSupport: state.isSupport,
    isBlueToothOn: state.isBlueToothOn,
    lang: state.lang,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    addLeftDevice: device => {
      return dispatch({ type: 'ADD_LEFT_DEVICE', payload: device });
    },
    addRightDevice: device => {
      return dispatch({ type: 'ADD_RIGHT_DEVICE', payload: device });
    },
    starting: () => {
      return dispatch({ type: 'STARTING' });
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(index);
