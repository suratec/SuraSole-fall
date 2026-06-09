// // 7.11.62

// import React, {Component} from 'react';
// import {
//   View,
//   Image,
//   ScrollView,
//   NativeModules,
//   NativeEventEmitter,
//   Vibration,
//   TouchableOpacity,
//   Alert,
// } from 'react-native';
// import NetInfo from '@react-native-community/netinfo';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// import {Col, Grid} from '../common/NativeBaseShim';
// import {connect} from 'react-redux';

// import HeaderFix from '../../common/HeaderFix';
// import NotificationsState from '../../shared/Notification';
// import Text from '../../common/TextFix';
// import ButtonFix from '../../common/ButtonFix';
// import RadarChartFix from '../../common/RadarChartFix';
// import CardStatusFix from '../../common/CardStatusFix';
// import AlertFix from '../../common/AlertsFix';
// import ScoreFix from '../../common/ScoreFix';
// import API from '../../../config/Api';
// import BleManager from 'react-native-ble-manager';

// import {
//   FileManager,
//   getFileList,
//   deleteFile,
//   readFile,
// } from '../../../FileManager';
// import {TabHeading} from '../common/NativeBaseShim';

// import BalanceLang from '../../../assets/language/menu/lang_balance';
// import Lang from '../../../assets/language/menu/lang_record';
// import LangHome from '../../../assets/language/screen/lang_home';

// var RNFS = require('react-native-fs');

// const BleManagerModule = NativeModules.BleManager;
// const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

// const TIMER = 100;
// const TIMER_BIG = 1;
// const Duration = 1500;

// class RecordingState extends Component {
//   state = {
//     switch: false,
//   };

//   componentDidMount = () => {

//   };

//   recordData(data, sensor) {
//     if (sensor == 'L') {
//       this.lsensor = data;
//     } else {
//       this.rsensor = data;
//     }

//     if (this.props.noti === true) {
//       this.measurePressure(data);
//     }
//   }

//   actionRecording = async () => {
//     if (
//       typeof this.props.rightDevice === 'undefined' &&
//       typeof this.props.leftDevice === 'undefined'
//     ) {
//       Alert.alert('Warning !', 'Please Check Your Bluetooth Connect', [
//         {
//           text: 'OK',
//           onPress: () => {
//             this.props.navigation.navigate('Device', {
//               name: this.props.lang
//                 ? LangHome.addDeviceButton.thai
//                 : LangHome.addDeviceButton.eng,
//             });
//           },
//         },
//       ]);
//       return;
//     }
//     if (this.state.textAction == 'Record') {
//       this.setState({textAction: 'Stop'});
//       this.props.actionRecordingButton('Stop');
//       let initTime = new Date();
//       this.start = initTime;
//       this.lastLtime = initTime;
//       this.lastRtime = initTime;
//       this.readInterval = setInterval(async () => {
//         time = new Date();
//         data = {
//           stamp: time.getTime(),
//           timestamp: time,
//           duration: Math.floor((time - this.start) / 1000),
//           left: {
//             sensor: this.lsensor,
//             swing: this.leftSwingTime,
//             stance: this.leftStanceTime,
//           },
//           right: {
//             sensor: this.rsensor,
//             swing: this.rightSwingTime,
//             stance: this.rightStanceTime,
//           },
//         };
//         try {
//           await RNFS.appendFile(
//             RNFS.CachesDirectoryPath +
//               '/suratechM/' +
//               this.start.getFullYear() +
//               this.start.getMonth() +
//               this.start.getDate() +
//               this.round,
//             JSON.stringify(data) + ',',
//           );
//         } catch {
//           await RNFS.mkdir(RNFS.CachesDirectoryPath + '/suratechM/');
//           await RNFS.appendFile(
//             RNFS.CachesDirectoryPath +
//               '/suratechM/' +
//               this.start.getFullYear() +
//               this.start.getMonth() +
//               this.start.getDate() +
//               this.round,
//             JSON.stringify(data) + ',',
//           );
//         }
//       }, 100);
//     } else {
//       this.setState({textAction: 'Record'});
//       this.props.actionRecordingButton('Record');
//       clearInterval(this.readInterval);
/*
    clearInterval(this.flushInterval);
    this.flushBufferToDisk(); // Flush remaining data before unmount
//       this.sendDataToSetver();
//     }
//   };

//  async flushBufferToDisk() {
    if (this.dataBuffer.length === 0) return;
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
*/
/*
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
          };

          const addRespRaw = await fetch(`${API}/addjson`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(content),
          });

          const addResp = JSON.parse(await addRespRaw.text());

          if (addResp.status !== 'ผิดพลาด') {
            console.log(`Clear : ${r.path}`);
            await RNFS.unlink(r.path);

            const dashboardRaw = await fetch(`${API}member/getUserDashboardStatic`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: this.props.user.id_customer }),
            });
            const dashboardData = JSON.parse(await dashboardRaw.text());

            const userDataRaw = await fetch(`${API}member/get_user_data`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: this.props.user.id_customer,
                ...dashboardData
              }),
            });
            const userData = JSON.parse(await userDataRaw.text());

            console.log(userData, 'responseFromAPU');
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
*/

//   actionDashboard = () => {
//     this.props.navigation.navigate('Dashboard');
//   };

//   render() {
//     return (
//         <View style={{flex: 1, height: '100%'}}>
//         <Grid style={{padding: 15}}>
//           <Col>
//             <ButtonFix
//               action={true}
//               rounded={true}
//               title={this.state.textAction}
//               onPress={() => this.actionRecording()}
//             />
//           </Col>
//           <Col>
//             <ButtonFix
//               rounded={true}
//               title={'Dashboard'}
//               onPress={() => this.actionDashboard()}
//             />
//           </Col>
//         </Grid>
//       </View>
//     );
//   }
// }

// const mapStateToProps = state => {
//   return {
//     noti: state.noti,
//   };
// };

// const mapDisPatchToProps = dispatch => {
//   return {
//     actionNotificationButton: data => {
//       return dispatch({type: 'ACTION_BUTTON_NOTIFICATION', payload: data});
//     },
//   };
// };

// export default connect(
//   mapStateToProps,
//   mapDisPatchToProps,
// )(RecordingState);
