//5.11.2562 14.55

import React, {Component} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  NativeModules,
  NativeEventEmitter,
  PermissionsAndroid,
  Platform,
  Button,
  Dimensions,
  SafeAreaView,
  BackHandler,
  Alert,
} from 'react-native';
// import {NavigationEvents} from 'react-navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-simple-toast';
import UI from '../../../config/styles/CommonStyles';
import Text from '../../common/TextFix';
import ListItem from './listItem';
import BleManager from 'react-native-ble-manager';
import {connect} from 'react-redux';

import HeaderFix from '../../common/HeaderFix';
import messaging from '@react-native-firebase/messaging';
import LanguagePickerFix from '../../common/LanguagePickerFix';
import Lang from '../../../assets/language/screen/lang_home';

import LangAlert from '../../../assets/language/alert/lang_alert';
import {getLocalizedText} from '../../../assets/language/langUtils';
import API, {IMAGE_URL} from '../../../config/Api';

var RNFS = require('react-native-fs');

import Modal, {
  ModalTitle,
  ModalContent,
  ModalFooter,
  ModalButton,
} from 'react-native-modals';
import RefreshComponent from '../../common/RefreshComponent';

class index extends Component {
  constructor() {
    super();
    this.state = {
      count: 0,
      show: false,
      peripherals: new Map(),
      showExitIcon: false,
      screenData: Dimensions.get('window'), // Track current dimensions
    };
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
  }

  actionProfile = () => {
    this.props.navigation.navigate('Profile');
  };

  actionLogout = async () => {
    console.log('ActionLogout');
    this.actionDisconnectBle();
    this.props.resetUser();
    this.props.navigation.navigate('Auth');
  };

  checkExitOrLogout = async () => {
    const backup = await AsyncStorage.getItem('doctor_user');
    const backupToken = await AsyncStorage.getItem('doctor_token');

    if (backup && backupToken) {
      const user = JSON.parse(backup);
      this.props.addUser(user, backupToken);
      this.props.setImpersonation(false);
      await AsyncStorage.removeItem('doctor_user');
      await AsyncStorage.removeItem('doctor_token');
      this.props.navigation.navigate('PatientList');
    } else {
      this.actionLogout();
      this.props.setImpersonation(false);
    }
  };

  actionDisconnectBle = async () => {
    if (typeof this.props.rightDevice !== 'undefined') {
      BleManager.disconnect(this.props.rightDevice);
    }
    if (typeof this.props.leftDevice !== 'undefined') {
      BleManager.disconnect(this.props.leftDevice);
    }
    this.props.addRightDevice(undefined);
    this.props.addLeftDevice(undefined);
  };

  // Handle orientation changes with safety check
  updateScreenData = (screenData) => {
    if (screenData?.window?.width && screenData?.window?.height) {
      this.setState({ screenData: screenData.window });
    }
  };


  // Force reload comment
  async componentDidMount() {
    console.log('HOME !!!');
    console.log(this.props.user);
    console.log(this.state, 'here we go');
    
    this.focusListener = this.props.navigation.addListener('focus', async () => {
      // Update screen dimensions when focusing - with safety check
      const currentDimensions = Dimensions.get('window');
      if (currentDimensions?.width && currentDimensions?.height) {
        this.setState({ screenData: currentDimensions });
      }

      const backup = await AsyncStorage.getItem('doctor_user');
      this.setState({ showExitIcon: !!backup });
      console.log('[Home] Exit Icon:', !!backup);
    });

    // Listen for orientation changes with proper event handling
    const dimensionSubscription = Dimensions.addEventListener('change', this.updateScreenData);
    this.dimensionListener = dimensionSubscription;

    // Check doctor impersonation state
    AsyncStorage.getItem('doctor_user').then(backup => {
      if (backup) {
        this.setState({ showExitIcon: true });
      } else {
        this.setState({ showExitIcon: false });
      }
    });

    await messaging().requestPermission();
    // Use the newer pattern for hasPermission
    const enabled = await messaging().hasPermission();

    // Add back button handler using the newer subscription pattern
    this.backHandlerSubscription = BackHandler.addEventListener(
        'hardwareBackPress',
        this.handleBackButtonClick,
    );

    try {
      if (NetInfo && typeof NetInfo.addEventListener === 'function') {
        this.netInfoUnsubscribe = NetInfo.addEventListener(this.handleConnectivityChange);
      }
    } catch (e) {
      console.log('NetInfo error:', e);
    }

    if (typeof this.sendDataToSetver === 'function') {
      this.sendDataToSetver();
    }

    if (Platform.OS === 'android') {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      ]).then(() => {
        if (
            !this.props.user.age &&
            !this.props.user.weight &&
            !this.props.user.height
        ) {
          this.setState({show: true});
        }
      });
    } else {
      if (
          !this.props.user.age &&
          !this.props.user.weight &&
          !this.props.user.height
      ) {
        this.setState({show: true});
      }
    }
  }

  componentWillUnmount() {
    if (this.focusListener && typeof this.focusListener === 'function') {
      this.focusListener();
    } else if (this.focusListener && typeof this.focusListener.remove === 'function') {
      this.focusListener.remove();
    }
    if (this.netInfoUnsubscribe && typeof this.netInfoUnsubscribe === 'function') {
      this.netInfoUnsubscribe();
    }
    
    if (this.backHandlerSubscription && typeof this.backHandlerSubscription.remove === 'function') {
      this.backHandlerSubscription.remove();
    }

    // Clean up dimension listener properly
    if (this.dimensionListener && typeof this.dimensionListener.remove === 'function') {
      this.dimensionListener.remove();
    }
  }

  handleBackButtonClick = async () => {
    try {
      // In React Navigation v7, we use canGoBack() instead of parent.state.index
      if (!this.props.navigation.canGoBack()) {
        Alert.alert(
            '',
            getLocalizedText(this.props.lang, LangAlert.closeApp),
            [
              {
                text: getLocalizedText(this.props.lang, LangAlert.yes),
                onPress: () => {
                  this.actionDisconnectBle();
                  setTimeout(() => {
                    BackHandler.exitApp();
                  }, 1000);
                },
              },
              {
                text: getLocalizedText(this.props.lang, LangAlert.no),
                onPress: () => console.log('NO Pressed'),
              },
            ],
            {cancelable: false},
        );
        return true;
      }

      return false;
    } catch (error) {
      console.log('Back button error:', error);
      Alert.alert(
          '',
          getLocalizedText(this.props.lang, LangAlert.closeApp),
          [
            {
              text: getLocalizedText(this.props.lang, LangAlert.yes),
              onPress: () => {
                this.actionDisconnectBle();
                setTimeout(() => {
                  BackHandler.exitApp();
                }, 1000);
              },
            },
            {
              text: getLocalizedText(this.props.lang, LangAlert.no),
              onPress: () => console.log('NO Pressed'),
            },
          ],
          {cancelable: false},
      );
      return true;
    }
  };

  handleConnectivityChange = status => {
    this.setState({isConnected: status.isConnected});
    if (this.state.isConnected) this.sendDataToSetver();
  };

  sendDataToSetver() {
    const path = RNFS.CachesDirectoryPath + '/suratechM/';
    RNFS.exists(path).then(exists => {
      if (!exists) return;
      RNFS.readDir(path).then(res => {
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
                  .then(resp => resp.json())
                  .then(resp => {
                    if (resp.status != 'ผิดพลาด') {
                      console.log(`Clear : ${r.path}`);
                      RNFS.unlink(r.path);

                      fetch(`${API}member/getUserDashboardStatic`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          id: this.props.user.id_customer,
                        }),
                      })
                          .then(resp1 => {
                            console.log('============API Response============');
                            return  resp1.json();
                          })
                          .then(resp1 => {

                            fetch(`${API}member/get_user_data`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                id: this.props.user.id_customer,
                                ...resp1
                              }),
                            })
                                .then(res => {
                                  console.log('============API Response============');
                                  return console.log(res), res.json();
                                })
                                .then(res => {
                                  console.log(res, 'responseFromAPI');
                                })
                                .catch(err => {
                                  console.log(err);
                                  this.setState({ isLoading: false });
                                  Toast.show('Something went wrong. Please Try again!!!');
                                });
                          })
                          .catch(err => {
                            console.log(err);
                            this.setState({ isLoading: false });
                            Toast.show('Something went wrong. Please Try again!!!');
                          });
                    }
                  });
            })
            .catch(e => {});
      });
      });
    });
  }

  popup = () => (
      <Modal
          width={0.9}
          visible={this.state.show}
          rounded
          actionsBordered
          onTouchOutside={() => {
            this.setState({show: false});
          }}
          modalTitle={
            <ModalTitle
                title="Warning - Please complete your profile"
                align="left"
            />
          }
          footer={
            <ModalFooter>
              <ModalButton
                  text="Later"
                  bordered
                  onPress={() => {
                    this.setState({show: false});
                  }}
                  key="button-1"
              />
              <ModalButton
                  text="OK"
                  bordered
                  onPress={() => {
                    this.setState({show: false});
                    this.actionProfile();
                  }}
                  key="button-2"
              />
            </ModalFooter>
          }>
        <ModalContent style={{backgroundColor: '#fff'}}>
          <Text>Some functions will not work properly</Text>
        </ModalContent>
      </Modal>
  );

  render() {
    const { screenData } = this.state;

    // Safety check to prevent NaN values
    const safeWidth = screenData?.width || Dimensions.get('window').width || 375;
    const safeHeight = screenData?.height || Dimensions.get('window').height || 812;

    // Use the smaller dimension for consistent profile image size in both orientations
    const smallerDimension = Math.min(safeWidth, safeHeight);
    const screenWidth = Math.round(smallerDimension) * 0.25;

    let img = 'user.png';
    if (this.props.user) {
      if (this.props.user.image === '' || this.props.user.image === undefined) {
        if (this.props.user.role === 'mod_employee') {
          img = 'doctor.png';
        } else {
          img = 'user.png';
        }
      } else {
        img = this.props.user.image;
      }
    }

    return (
        <View style={{backgroundColor: 'white', flex: 1}}>
          {this.popup()}

          <View
              style={{
                position: 'absolute',
                left: 15,
                top: Platform.OS === 'ios' ? 70 : 50,
                borderWidth: 1.2,
                borderColor: '#fff',
                padding: 2,
                borderRadius: 20,
                width: 38,
                height: 38,
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
              }}
              pointerEvents="box-none"
          >
            <LanguagePickerFix
                langSwitch={Lang.langSwitch}
                onLanguageChange={(index) => {
                  console.log('Language changed to:', index);
                }}
                isCircular={true}
                showFlag={true}
                showText={false}
                style={{
                  position: 'absolute',
                }}
            />
          </View>

          <TouchableOpacity
              activeOpacity={0.8}
              style={{
                position: 'absolute',
                right: 15,
                top: Platform.OS === 'ios' ? 70 : 50,
                borderWidth: 1.2,
                borderColor: '#fff',
                padding: 2,
                borderRadius: 20,
                width: 38,
                height: 38,
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
              }}
              onPress={() => {
                this.checkExitOrLogout();
              }}
          >
            <Image
                style={{ width: 22, height: 22, tintColor: '#fff' }}
                source={
                  this.props.impersonating
                      ? require('../../../assets/image/menu/exit.png')
                      : require('../../../assets/image/icons/logout.png')
                }
            />
          </TouchableOpacity>

          <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                flexGrow: 1,
                backgroundColor: 'white'
              }}
              showsVerticalScrollIndicator={false}
          >
            <View style={styles.oval}>
              {this.props.user && (
                  <View
                      style={{
                        alignContent: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        alignItems: 'center',
                      }}>
                    <TouchableOpacity onPress={() => this.actionProfile()}>
                      <Image
                          style={{
                            width: screenWidth - 20,
                            height: screenWidth - 20,
                            borderWidth: 1,
                            borderColor: '#fff',
                            padding: 2,
                            borderRadius: screenWidth / 2,
                          }}
                          source={{
                            uri: this.props.user.image,
                          }}
                      />
                      <Image
                          onPress={() => this.actionProfile()}
                          style={{
                            width: 35,
                            height: 35,
                            position: 'absolute',
                            top: -10,
                            right: -5,
                          }}
                          source={require('../../../assets/image/icons/pencil.png')}
                      />
                    </TouchableOpacity>
                    <Text
                        styles={{color: 'white', height: 30, marginTop: 10, fontSize: 20}}
                        type={'bold'}>
                      {this.props.user.fname} {this.props.user.lname}
                    </Text>
                    <Text styles={{color: 'white', fontWeight: '700', height: 40, fontSize: 15}}>
                      {this.props.user.email}
                    </Text>
                  </View>
              )}
            </View>

            <ListItem style={{ marginTop: 30 }} navigation={this.props.navigation} />
          </ScrollView>

        </View>
    );
  }
}

const styles = StyleSheet.create({
  oval: {
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70,
    backgroundColor: UI.color_Gradient[1],
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
    width: '100%',
    overflow: 'hidden',
  },
});

const mapStateToProps = state => {
  return {
    user: state.user,
    lang: state.lang,
    rightDevice: state.rightDevice,
    leftDevice: state.leftDevice,
    impersonating: state.impersonating,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    upDateState: bleState => {
      dispatch({type: 'READ_BLUETOOTH_STATE', payload: bleState});
    },
    addLeftDevice: device => {
      dispatch({type: 'ADD_LEFT_DEVICE', payload: device});
    },
    resetUser: () => {
      return dispatch({type: 'RESET_USERINFO'});
    },
    addRightDevice: device => {
      dispatch({type: 'ADD_RIGHT_DEVICE', payload: device});
    },
    updatePath: path => {
      return dispatch({type: 'EDIT_PROFILE_PATH', payload: path});
    },
    selectedChat: bleState => {
      dispatch({type: 'SELECTED_CHAT', payload: bleState});
    },
    startCall: bleState => {
      dispatch({type: 'START_CALL', payload: bleState});
    },
    addUser: (user, token) => {
      dispatch({type: 'ADD_USERINFO', payload: {user, token}});
    },
    setImpersonation: (flag) => {
      dispatch({ type: 'SET_IMPERSONATION', payload: flag });
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(index);