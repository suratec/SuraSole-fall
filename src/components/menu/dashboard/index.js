//5.11.62

import React, { Component,  useState, useEffect  } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Text,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { connect } from 'react-redux';
import NetInfo from '@react-native-community/netinfo';
import { writeFile } from 'react-native-fs';
import XLSX from 'xlsx';

import HeaderFix from '../../common/HeaderFix';
import CardsTagging from './cards_tagging';
import CardsResult from './cards_result';
import CardsSpecified from './cards_overspecified';
import ButtonFix from '../../common/ButtonFix';
import Toast from 'react-native-simple-toast';
import moment from 'moment';

import API from '../../../config/Api';
import { result } from 'lodash';
import LinearGradient from 'react-native-linear-gradient';
import RadarChart from '../../common/RadarChartFix';
import RadarChartForDashboard from '../../common/RadarChartForDashboard';
import Swiper from 'react-native-swiper';                          // 🔹 carousel
import exerciseImg     from '../../../assets/image/dashboard/exercise.png';
import stanceStandImg  from '../../../assets/image/dashboard/stanceStand.png';
import stanceWalkImg   from '../../../assets/image/dashboard/stanceWalk.png';
import LangDashboard from '../../../assets/language/menu/lang_dashboard';
import {getLocalizedText} from '../../../assets/language/langUtils';
var RNFS = require('react-native-fs');

const {height, width} = Dimensions.get('window');
const Dot = () => (
  <View
    style={{
      width: 15,
      height: 15,
      borderRadius: 7.5,
      borderWidth: 2,
      borderColor: '#00A2A2',
      backgroundColor: '#FFFFFF',
      marginHorizontal: 4,
    }}
  />
);

const ActiveDot = () =>
    <View style={{
        width: 15,
        height: 15,
        borderRadius: 7.5,
        borderWidth: 2,
        borderColor: '#00A2A2',
        backgroundColor: '#00A2A2',
        marginHorizontal: 4,
    }} />;

class index extends Component {
  constructor() {
    super();
    this.state = {
      dataResult: [
        { nameZone: 'Toe', valueWalk: '- -', valueRun: '- -' },
        { nameZone: 'Medial Metatarsal', valueWalk: '- -', valueRun: '- -' },
        { nameZone: 'Lateral Metatarsal', valueWalk: '- -', valueRun: '- -' },
        { nameZone: 'Medial Midfoot', valueWalk: '- -', valueRun: '- -' },
        { nameZone: 'Heel', valueWalk: '- -', valueRun: '- -' },
      ],
      isLoading: true,
      dataSpecified: [{ dateTime: '00:00:00', valueZone: '', valuePeak: '0' }],
      record: [],
      xPosN: 50,
      yPosN: 50,
      focus: true,
      healthData: {},
      isConnected: null,
      spinner: false,
      positionValue: [],
      dataShow: false,
      dashboardSummaryText: '',
      currentPageIndex: 0,
      currentDateTime: ''
    };
    this.onPreLoad();
  }

  excelFile = async () => {
    await RNFS.readDir(RNFS.CachesDirectoryPath + '/suratechM/').then(res => {
      res.forEach(r => {
        RNFS.readFile(r.path)
            .then(text => {
              var excelData = JSON.parse(
                  '[' + text.substring(0, text.length - 1) + ']',
              );
              var setJson = [];
              Object.keys(excelData).forEach(function (index) {
                let FL =
                    (excelData[index].left.sensor[0] +
                        excelData[index].left.sensor[1] +
                        excelData[index].left.sensor[2]) /
                    3;
                let FR =
                    (excelData[index].right.sensor[0] +
                        excelData[index].right.sensor[1] +
                        excelData[index].right.sensor[2]) /
                    3;
                let COP_X =
                    FR +
                    excelData[index].right.sensor[3] +
                    excelData[index].right.sensor[4] -
                    (FL +
                        excelData[index].left.sensor[3] +
                        excelData[index].left.sensor[4]);
                let COP_Y =
                    FL +
                    FR -
                    (excelData[index].right.sensor[4] +
                        excelData[index].left.sensor[4]);
                data = {
                  Timestamp: moment(excelData[index].stamp).format(
                      'MMMM Do YYYY, h:mm:ss:ms a',
                  ),
                  Left_1: excelData[index].left.sensor[0],
                  Left_2: excelData[index].left.sensor[1],
                  Left_3: excelData[index].left.sensor[2],
                  Left_4: excelData[index].left.sensor[3],
                  Left_5: excelData[index].left.sensor[4],
                  Right_1: excelData[index].right.sensor[0],
                  Right_2: excelData[index].right.sensor[1],
                  Right_3: excelData[index].right.sensor[2],
                  Right_4: excelData[index].right.sensor[3],
                  Right_5: excelData[index].right.sensor[4],
                  FL: FL,
                  LX:
                      excelData[index].left.sensor[2] -
                      excelData[index].left.sensor[1],
                  LY: FL - excelData[index].left.sensor[4],
                  FR: FR,
                  RX:
                      excelData[index].right.sensor[1] -
                      excelData[index].right.sensor[2],
                  RY: excelData[index].right.sensor[4] - FR,
                  COP_X: COP_X,
                  COP_Y: COP_Y,
                };
                setJson.push(data);
              });

              ws = XLSX.utils.json_to_sheet(setJson);
              ws = XLSX.utils.json_to_sheet(setJson);

              wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Data Record');

              wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });
              file =
                  RNFS.ExternalCachesDirectoryPath + '/' + Date.now() + '.xlsx';
              console.log(file);
              writeFile(file, wbout, 'ascii')
                  .then(r => {
                    /* :) */
                  })
                  .catch(e => {
                    /* :( */
                  });
            })
            .catch(e => { });
      });
    });
    Toast.show('Excel Download File Success');
  };

  onPreLoad() {
    RNFS.readDir(RNFS.CachesDirectoryPath + '/suratechM/').then(res => {
      res.forEach(r => {
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
                      RNFS.unlink(r.path);
                    }
                  });
            })
            .catch(e => { });
      });
    });
  }

  actionUpdate = () => {
    alert('Update !');
  };

  findMaxIndex(data) {
    let index = 0;
    let max = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] > max) {
        max = data[i];
        index = i;
      }
    }
    return index;
  }

  toKilo = value => {
    return (5.6 * 10 ** -4 * Math.exp(value / 53.36) + 6.72) / 0.796;
  };

  findPeak(data) {
    let max = 0;
    let index = 0;
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        if (data[i][j] > max) {
          max = data[i][j];
          index = j;
        }
      }
    }
    max = this.toKilo(max);
    if (max.toFixed(2) <= 8.44) {
      max = 0;
    }
    return { max: max.toFixed(2), index };
  }

  findDataResult = data => {
    let max = [0, 0, 0, 0, 0];
    let value = [0, 0, 0, 0, 0];
    let a = 2.206;
    let b = 0.0068;
    let all = 0;
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].left.length; j++) {
        for (let k = 0; k < data[i].left[j].length; k++) {
          if (data[i].left[j][k] > max[k]) {
            max[k] = data[i].left[j][k];
          }
          if (data[i].right[j][k] > max[k]) {
            max[k] = data[i].right[j][k];
          }
          value[k] += data[i].left[j][k] + data[i].right[j][k];
        }
      }
      all += data[i].left.length;
    }
    all === 0 ? (all = 1) : (all = all * 2);
    value[0] = a * Math.exp(b * (value[0] / all));
    value[1] = a * Math.exp(b * (value[1] / all));
    value[2] = a * Math.exp(b * (value[2] / all));
    value[3] = a * Math.exp(b * (value[3] / all));
    value[4] = a * Math.exp(b * (value[4] / all));
    max[0] = a * Math.exp(b * max[0]);
    max[1] = a * Math.exp(b * max[1]);
    max[2] = a * Math.exp(b * max[2]);
    max[3] = a * Math.exp(b * max[3]);
    max[4] = a * Math.exp(b * max[4]);
    return {
      value: [
        value[0].toFixed(2),
        value[1].toFixed(2),
        value[2].toFixed(2),
        value[3].toFixed(2),
        value[4].toFixed(2),
      ],
      max: [
        max[0].toFixed(2),
        max[1].toFixed(2),
        max[2].toFixed(2),
        max[3].toFixed(2),
        max[4].toFixed(2),
      ],
    };
  };

    // UPDATED: handleFetchDashboardData function with server time extraction
    handleFetchDashboardData = async () => {
        const { id_customer } = this.props.user;
        try {
            const response = await fetch(
                `${API}/member/get_user_details?id=${id_customer}`,
                { method: 'POST' },
            );
            const res = await response.json();

            console.log('res', res);

            if (res.message === 'User Details Successfully') {
                const user_details = res.user_details;

                // ✅ EXTRACT SERVER TIME FROM WORKING API
                if (user_details && user_details.created_at) {
                    const serverDateTime = moment(user_details.created_at).format('DD/MM/YYYY HH:mm:ss');
                    console.log('🕐 ✅ Server time extracted from get_user_details:', serverDateTime);
                    this.setState({ currentDateTime: serverDateTime });
                } else {
                    console.warn('🚨 No server time in user_details, using local time');
                    this.setState({ currentDateTime: moment().format('DD/MM/YYYY HH:mm:ss') });
                }

                // Original data processing
                const xPos = JSON.parse(user_details.cop_x);
                const yPos = JSON.parse(user_details.cop_y);
                const positionValue = xPos.map((x, index) => ({
                    x_key: x,
                    y_key: yPos[index],
                }));

                this.setState({
                    healthData: user_details,
                    positionValue,
                    isLoading: false,
                    dataShow: false
                });
            } else {
                this.setState({
                    dataShow: true,
                    isLoading: false,
                    currentDateTime: moment().format('DD/MM/YYYY HH:mm:ss') // Fallback to local time
                });
            }
        } catch (error) {
            console.error(error);
            this.setState({
                isLoading: false,
                dataShow: true,
                currentDateTime: moment().format('DD/MM/YYYY HH:mm:ss') // Fallback to local time
            });
        }
    };

// SIMPLIFIED: componentDidMount (remove the failing /record call)
    componentDidMount = () => {
        NetInfo.addEventListener(this.handleConnectivityChange);

        const { user, token } = this.props;
        const { id_customer } = user;

        console.log('🧾 Logged-in/Impersonated user details:', user);
        console.log('🔐 Using token:', token);

        this.handleFetchDashboardData();
        this.fetchDashboardSummary();
        this.fetchDashboardReport();

    };

    fetchDashboardReport = async () => {
        const { id_customer, security_token } = this.props.user;
        const { token } = this.props;
        const lang_mode = this.props.lang || 0;

        console.log('🕐 Fetching Dashboard Report for date-time...');

        if (!id_customer || !security_token || !token) {
            console.warn('🚨 Missing required data for dashboard report');
            return;
        }

        this.setState({ timeLoading: true });

        try {
            const response = await fetch('https://www.surasole.com/api/dashboard/dashboard-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    security_token,
                    user_id: id_customer,
                    lang_mode,
                }),
            });

            const res = await response.json();
            console.log('🕐 Dashboard Report Response:', res);

            // Extract date and time from created_at field
            if (res.data_dashboard && res.data_dashboard.created_at) {
                const createdAt = res.data_dashboard.created_at;

                const formattedDateTime = moment(createdAt).format('DD/MM/YYYY HH:mm:ss');

                console.log('🕐 Extracted date-time from created_at:', formattedDateTime);
                this.setState({ currentDateTime: formattedDateTime });
                this.setState({ dashboardData: res.data_dashboard });

            } else {
                console.warn('🚨 No created_at field found in data_dashboard');
                this.setState({ currentDateTime: moment().format('DD/MM/YYYY HH:mm:ss') });
            }

        } catch (error) {
            console.error('❌ Error fetching dashboard report:', error);
            this.setState({ currentDateTime: moment().format('DD/MM/YYYY HH:mm:ss') });
        } finally {
            this.setState({ timeLoading: false });
        }
    };

    fetchDashboardSummary = async () => {
        const { id_customer, security_token } = this.props.user;
        const { token } = this.props;
        const lang_mode = this.props.lang || 0;

        console.log('🔁 Dashboard Summary');
        console.log('User ID:', id_customer);
        console.log('Security Token:', security_token);
        console.log('Token:', token);

        // ✅ Add the check here
        if (!id_customer || !security_token || !token) {
            console.warn('🚨 Missing one of: id_customer, security_token, or token');
            return;
        }

        try {
            const response = await fetch('https://app.surasole.com/api/dashboard/dashboard-summary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    user_id: id_customer,
                    lang_mode,
                    security_token,
                }),
            });

            const res = await response.json();
            console.log('✅ Full response from dashboard-summary:', res);
            console.log('res.summary: ', res.summary);

            if (res.summary) {
                this.setState({ dashboardSummaryText: res.summary });
            } else {
                this.setState({dashboardSummaryText: getLocalizedText(this.props.lang, LangDashboard.noSummary)});
            }
        } catch (err) {
            console.error('Error fetching dashboard summary:', err);
            this.setState({
                dashboardSummaryText: getLocalizedText(this.props.lang, LangDashboard.error)});
        }
    };




    handleConnectivityChange = async status => {
    console.log(status.isConnected);
    await this.setState({ isConnected: status.isConnected });
    console.log(`Internet Connection : ${this.state.isConnected}`);
    // Toast.show(
    //   this.state.isConnected
    //     ? 'Internet Connection : ON'
    //     : 'Internet Connection: OFF',
    // );
  };

    handleGetColorCode = val => {
        return val < 240 ? '#39bc50' :     // Green: < 240
            val <= 355 ? '#ffa202' :    // Yellow: 240-355
                '#fe0d02';                  // Red: > 355
    };

  render() {

      const healthData   = this.state.healthData ?? {};
      const dataType     = parseInt(healthData.data_type, 10);   // '1' | '2'  ➜  1 | 2
      const fallRisk     = parseInt(healthData.fall_risk, 10);   // '0'–'3' → number
      // 0 when not yet loaded

      const fallRingColors =
          fallRisk === 1
              ? ['#16702B', '#5EC104']   // Low  – green
              : fallRisk === 2
                  ? ['#FFAC01', '#D1D501']   // Medium – yellow
                  : fallRisk === 3
                      ? ['#E60401', '#FD9801']   // High – red
                      : ['#CFCFCF', '#A0A0A0'];  //  ← neutral grey fallback

      const Pill = ({ left, right }) => (
          <View style={{ flexDirection: 'row' }}>
              {/* blue half */}
              <LinearGradient
                  colors={['#12449F', '#005CFF']}
                  start={{ x: 1, y: 0 }}
                  end={{ x: 0, y: 0 }}
                  style={{
                      width: 90,
                      height: 30,
                      borderTopLeftRadius: 10,
                      borderBottomLeftRadius: 10,
                      justifyContent: 'center',
                      alignItems: 'center',
                  }}>
                  <Text
                      style={{
                          fontFamily: 'BaiJamjuree-Bold',
                          fontSize: 15,
                          lineHeight: 20,
                          letterSpacing: -0.2,
                          color: '#fff',
                      }}>
                      {(left ?? '--') + '%'}
                  </Text>
              </LinearGradient>

              {/* green half */}
              <LinearGradient
                  colors={['#00862E', '#03CC48']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                      width: 90,
                      height: 30,
                      borderTopRightRadius: 10,
                      borderBottomRightRadius: 10,
                      justifyContent: 'center',
                      alignItems: 'center',
                  }}>
                  <Text
                      style={{
                          fontFamily: 'BaiJamjuree-Bold',
                          fontSize: 15,
                          lineHeight: 20,
                          letterSpacing: -0.2,
                          color: '#fff',
                      }}>
                      {(right ?? '--') + '%'}
                  </Text>
              </LinearGradient>
          </View>
      );



      return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
          <HeaderFix
              icon_left={'left'}
              onpress_left={() => {
                this.props.navigation.goBack();
              }}
              title={this.props.navigation.getParam('name', 'Dashboard')}
          />
          {this.state.isLoading ? (
              <View
                  style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator />
              </View>
          ) : this.state.dataShow ? (
              <View style={{ flex: 1 }}>
                <View
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{textAlign:"center"}} >{'No data found. \n Press Back to record data or click Reload'}</Text>
                </View>
                <View
                    style={{
                      width: '90%',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignSelf: 'center',
                      marginBottom: '10%',
                    }}>
                  <TouchableOpacity
                      onPress={() => {
                        this.props.navigation.goBack();
                      }}
                      style={{
                        width: '40%',
                        height: 40,
                        backgroundColor: '#f7545a',
                        borderRadius: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                    <Text style={{ color: '#fff' }}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                      onPress={() => {
                        this.handleFetchDashboardData();
                      }}
                      style={{
                        width: '40%',
                        height: 40,
                        backgroundColor: '#71dff5',
                        borderRadius: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                    <Text style={{ color: '#fff' }}>Reload</Text>
                  </TouchableOpacity>
                </View>
              </View>
          ) : (
              <Swiper
                  loop={false}
                  dot={<Dot />}                 // ◯ white-inside
                  activeDot={<ActiveDot />}     // ● filled
                  paginationStyle={{ bottom: 25 }}
                  onIndexChanged={(index) => {
                      this.setState({ currentPageIndex: index });

                      this.props.navigation.setParams({
                          name:
                              index === 0
                                  ? getLocalizedText(this.props.lang, LangDashboard.dashboard)
                                  : getLocalizedText(this.props.lang, LangDashboard.summary)
                      });
                  }}
              >
                {/* ──────────── PAGE 1 ──────────── */}
                <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
                  <View style={{ flex: 1, paddingTop: 8 }}>
                      <Text style={{ fontSize: 16, textAlign: 'right', marginRight: 10, color:'#005C51', fontWeight: 'bold' }}>
                          {this.state.currentDateTime || moment().format('DD/MM/YYYY HH:mm:ss')}
                      </Text>

                      {dataType === 2 && (
                          <View
                              style={{
                                  flexDirection: 'row',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginHorizontal: 10,
                                  marginTop: 8,
                                  marginBottom: 12,
                              }}>

                              {/* ──────────────── Card A : Fall-Risk Prediction ──────────────── */}
                              <LinearGradient
                                  colors={['#005C51', '#0CFFD3']}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={{
                                      padding: 1,
                                      borderRadius: 10,
                                      width: '55%',
                                      height: 222,
                                  }}>
                                  <View
                                      style={{
                                          flex: 1,
                                          backgroundColor: '#FFF',
                                          borderRadius: 10,
                                          paddingVertical: 12,
                                          paddingHorizontal: 10,
                                          justifyContent: 'center',
                                          alignItems: 'center',
                                      }}>
                                      <Text style={{ fontSize: 18, color: '#00A2A2', textAlign: 'center' }}>
                                          {getLocalizedText(this.props.lang, LangDashboard.fallRiskPrediction)}
                                      </Text>

                                      <LinearGradient
                                          colors={fallRingColors}
                                          start={{ x: 0, y: 0 }}
                                          end={{ x: 1, y: 0 }}
                                          style={{
                                              padding: 1,
                                              marginTop: 10,
                                              width: 130,
                                              height: 130,
                                              borderRadius: 65,
                                              justifyContent: 'center',
                                              alignItems: 'center',
                                          }}>
                                          <View
                                              style={{
                                                  backgroundColor: '#FFF',
                                                  width: 110,
                                                  height: 110,
                                                  borderRadius: 55,
                                                  justifyContent: 'center',
                                                  alignItems: 'center',
                                                  paddingHorizontal: 8, // Add padding to prevent text overflow
                                              }}>
                                              <Text
                                                  style={{
                                                      fontSize: fallRisk === 2 ? 24 : 32,
                                                      fontWeight: 'bold',
                                                      textAlign: 'center',
                                                      color:
                                                          (fallRisk === 1 && '#5EC104') ||
                                                          (fallRisk === 2 && '#D1D501') ||
                                                          (fallRisk === 3 && '#FD9801'),
                                                  }}>
                                                  {(fallRisk === 1 && getLocalizedText(this.props.lang, LangDashboard.low)) ||
                                                      (fallRisk === 2 && getLocalizedText(this.props.lang, LangDashboard.medium)) ||
                                                      (fallRisk === 3 && getLocalizedText(this.props.lang, LangDashboard.high))}
                                              </Text>
                                          </View>
                                      </LinearGradient>
                                  </View>
                              </LinearGradient>

                              {/* ──────────────── Card B : Cadence · Steps · Speed ──────────────── */}
                              <LinearGradient
                                  colors={['#005C51', '#0CFFD3']}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={{
                                      padding: 1,
                                      borderRadius: 10,
                                      width: '40%',
                                      height: 222,
                                  }}>
                                  <View
                                      style={{
                                          flex: 1,
                                          backgroundColor: '#FFF',
                                          borderRadius: 10,
                                          paddingVertical: 12,
                                          paddingHorizontal: 10,
                                          justifyContent: 'center',
                                          alignItems: 'center',
                                      }}>

                                      {/* Cadence */}
                                      <Text style={{ fontSize: 16, color: '#00A2A2', fontWeight: 'bold' }}>
                                          {this.state.healthData.cadence ?? '--'}
                                      </Text>
                                      <Text style={{ fontSize: 14, color: '#00A2A2', textAlign: 'center' }}>
                                          {getLocalizedText(this.props.lang, LangDashboard.cadence)+'\n'+getLocalizedText(this.props.lang, LangDashboard.cadenceUnit)}
                                      </Text>

                                      <View
                                          style={{
                                              width: '90%',
                                              height: 2,
                                              marginVertical: 5,
                                              borderRadius: 1,
                                              overflow: 'hidden',
                                          }}>
                                          <LinearGradient
                                              colors={['#005C51', '#0CFFD3']}
                                              start={{ x: 0, y: 0 }}
                                              end={{ x: 1, y: 0 }}
                                              style={{ flex: 1 }}
                                          />
                                      </View>

                                      {/* Step count */}
                                      <Text style={{ fontSize: 16, color: '#00A2A2', fontWeight: 'bold' }}>
                                          {this.state.healthData.step_count ?? '--'}
                                      </Text>
                                      <Text style={{ fontSize: 14, color: '#00A2A2', textAlign: 'center' }}>
                                          {getLocalizedText(this.props.lang, LangDashboard.stepCount)+'\n'+getLocalizedText(this.props.lang, LangDashboard.stepCountUnit)}
                                      </Text>

                                      <View
                                          style={{
                                              width: '90%',
                                              height: 2,
                                              marginVertical: 5,
                                              borderRadius: 1,
                                              overflow: 'hidden',
                                          }}>
                                          <LinearGradient
                                              colors={['#005C51', '#0CFFD3']}
                                              start={{ x: 0, y: 0 }}
                                              end={{ x: 1, y: 0 }}
                                              style={{ flex: 1 }}
                                          />
                                      </View>

                                      {/* Gait speed */}
                                      <Text style={{ fontSize: 16, color: '#00A2A2', fontWeight: 'bold' }}>
                                          {this.state.healthData.gait_speed ?? '--'}
                                      </Text>
                                      <Text style={{ fontSize: 14, color: '#00A2A2', textAlign: 'center' }}>
                                          {getLocalizedText(this.props.lang, LangDashboard.gaitSpeed)+'\n'+getLocalizedText(this.props.lang, LangDashboard.gaitSpeedUnit)}
                                      </Text>
                                  </View>
                              </LinearGradient>
                          </View>
                      )}



                          {/* ---------- ② PEAK-PRESSURE SUMMARY ---------- */}
                    <LinearGradient
                        colors={['#005C51', '#0CFFD3']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          padding: 1,
                          borderRadius: 10,
                          marginHorizontal: 10,
                        }}>
                      <View
                          style={{
                            backgroundColor: '#fff',
                            padding: 10,
                            borderRadius: 10,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}>
                        <Text
                            style={{
                              textAlign: 'center',
                              fontSize: 18,
                              color: '#00A2A2',
                            }}>
                            {getLocalizedText(this.props.lang, LangDashboard.peakPressureSummary)}
                        </Text>
                        <View
                            style={{
                              marginVertical: 8,
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: 20,
                              width: '100%',
                            }}>
                          <View
                              style={{
                                // width: '25%',
                                padding: 5,
                                flexDirection: 'row',
                              }}>
                            <LinearGradient
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                colors={['#FF1100', '#FBD500', '#FAFF00', '#1EB650']}
                                style={{
                                  borderRadius:11,
                                  height: 187,
                                  width: 24,
                                  alignItems: 'center',
                                }}
                            />
                            <View
                                style={{
                                  marginHorizontal: 0,
                                  padding: 5,
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}>
                              <Text
                                  style={{
                                    textAlign: 'center',
                                    fontSize: 17,
                                    color: '#00A2A2',
                                  }}>
                                  {getLocalizedText(this.props.lang, LangDashboard.high)}
                              </Text>
                              <Text
                                  style={{
                                    textAlign: 'center',
                                    fontSize: 17,
                                    color: '#00A2A2',
                                  }}>
                                  {getLocalizedText(this.props.lang, LangDashboard.low)}
                              </Text>
                            </View>
                          </View>
                          <View
                              style={{
                                // width: '70%',
                                position: 'absolute',
                                right: -10,
                                padding: 5,
                              }}>
                            <Image
                                source={require('../../../assets/image/foot_dashboard.png')}
                                style={{ height: 240, width: 240, resizeMode: 'contain' }}
                            />
                            {/* Left Leg */}
                            {this.state.healthData.sensor_type == 1 ? (
                                <>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 140,
                                        borderRadius: 6,
                                        top: 20,
                                        paddingHorizontal: 5,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_l2
                                                  ? this.state.healthData.peak_l2
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_l1}
                                    </Text>
                                  </View>

                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 133,
                                        top: 80,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_l2
                                                  ? this.state.healthData.peak_l2
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_l2}
                                    </Text>
                                  </View>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 189,
                                        top: 100,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_l3
                                                  ? this.state.healthData.peak_l3
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {' '}
                                      {this.state.healthData.peak_l3}
                                    </Text>
                                  </View>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 172,
                                        top: 150,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_l4
                                                  ? this.state.healthData.peak_l4
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_l4}
                                    </Text>
                                  </View>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 150,
                                        top: 200,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_l5
                                                  ? this.state.healthData.peak_l5
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_l5}
                                    </Text>
                                  </View>
                                  {/* End of Left Leg */}
                                  {/* Right Leg */}
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 85,
                                        top: 20,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_r1
                                                  ? this.state.healthData.peak_r1
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_r1}
                                    </Text>
                                  </View>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 93,
                                        top: 80,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_r2
                                                  ? this.state.healthData.peak_r2
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_r2}
                                    </Text>
                                  </View>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 33,
                                        top: 100,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_r3
                                                  ? this.state.healthData.peak_r3
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_r3}
                                    </Text>
                                  </View>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 49,
                                        top: 150,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_r4
                                                  ? this.state.healthData.peak_r4
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_r4}
                                    </Text>
                                  </View>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 75,
                                        top: 200,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_r5
                                                  ? this.state.healthData.peak_r5
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_r5}
                                    </Text>
                                  </View>
                                </>
                            ) : (
                                <>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 144,
                                        top: 20,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_l1
                                                  ? this.state.healthData.peak_l1
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_l1}
                                    </Text>
                                  </View>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 189,
                                        top: 43,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_l2
                                                  ? this.state.healthData.peak_l2
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_l2}
                                    </Text>
                                  </View>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 133,
                                        top: 80,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_l3
                                                  ? this.state.healthData.peak_l3
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_l3}
                                    </Text>
                                  </View>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 163,
                                        top: 80,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_l4
                                                  ? this.state.healthData.peak_l4
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_l4}
                                    </Text>
                                  </View>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 189,
                                        top: 100,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_l5
                                                  ? this.state.healthData.peak_l5
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_l5}
                                    </Text>
                                  </View>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 150,
                                        top: 150,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_l6
                                                  ? this.state.healthData.peak_l6
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_l6}
                                    </Text>
                                  </View>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 177,
                                        top: 150,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_l7
                                                  ? this.state.healthData.peak_l7
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_l7}
                                    </Text>
                                  </View>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 150,
                                        top: 200,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_l8
                                                  ? this.state.healthData.peak_l8
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_l8}
                                    </Text>
                                  </View>
                                  {/* End of Left Leg */}
                                  {/* Right Leg */}
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 85,
                                        top: 20,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_r1
                                                  ? this.state.healthData.peak_r1
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_r1}
                                    </Text>
                                  </View>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 37,
                                        top: 40,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_r2
                                                  ? this.state.healthData.peak_r2
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_r2}
                                    </Text>
                                  </View>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 93,
                                        top: 80,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_r3
                                                  ? this.state.healthData.peak_r3
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_r3}
                                    </Text>
                                  </View>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 65,
                                        top: 80,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_r4
                                                  ? this.state.healthData.peak_r4
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_r4}
                                    </Text>
                                  </View>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 36,
                                        top: 100,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_r5
                                                  ? this.state.healthData.peak_r5
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_r5}
                                    </Text>
                                  </View>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 87,
                                        top: 150,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_r6
                                                  ? this.state.healthData.peak_r6
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_r6}
                                    </Text>
                                  </View>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 49,
                                        top: 150,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_r7
                                                  ? this.state.healthData.peak_r7
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_r7}
                                    </Text>
                                  </View>
                                  <View
                                      style={{
                                        position: 'absolute',
                                        right: 75,
                                        top: 200,
                                        paddingHorizontal: 5,
                                        borderRadius: 6,
                                      }}>
                                    <Text
                                        style={{
                                          fontSize: 11,
                                          color: this.handleGetColorCode(
                                              this.state.healthData.peak_r8
                                                  ? this.state.healthData.peak_r8
                                                  : 0,
                                          ),
                                          fontWeight: '700',
                                        }}>
                                      {this.state.healthData.peak_r8}
                                    </Text>
                                  </View>
                                </>
                            )}

                            {/* End of Right Leg */}
                          </View>
                        </View>
                        </View>
                        </LinearGradient>


                      <View style={{ flex: 1 }}>
                          {dataType === 2 ? (
                          <>
                        {/* ─────────── PRESSURE + STANCE-TIME PERCENTAGE CARD ─────────── */}
                        <LinearGradient
                          colors={['#005C51', '#0CFFD3']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                              padding: 1,
                              borderRadius: 12,
                              marginHorizontal: 10,
                              marginTop: 12,
                          }}
                        >
                          <View style={{ backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 12 }}>

                              {/* ── reusable pill component ─────────────────────────────── */}
                              {/**  call as <Pill left={xx} right={yy}/>  */}


                          {/* ─────────── Row 1 : Left foot (labels + pill) ─────────── */}
                          <View style={{ flexDirection:'row', alignItems:'center', marginBottom:18, marginTop:12 }}>
                              {/* icon */}
                              <Image source={stanceStandImg} style={{ width:60, height:60, resizeMode:'contain' }} />
                              {/* pill */}
                              <View style={{ marginLeft:22, marginRight:24 }}>
                                  {/* headings row */}
                                  <View style={{
                                        flexDirection:'row',
                                        justifyContent:'space-between',
                                        width:180,                 // exact width of the pill (90 + 90)
                                        marginBottom:2,            // tiny gap above the pill
                                  }}>
                                    <Text style={{ width:90, textAlign:'center', fontSize:16, fontWeight:'bold', color:'#000' }}>
                                        {getLocalizedText(this.props.lang, LangDashboard.stance)}
                                    </Text>
                                    <Text style={{ width:90, textAlign:'center', fontSize:16, fontWeight:'bold', color:'#000' }}>
                                        {getLocalizedText(this.props.lang, LangDashboard.swing)}
                                    </Text>
                                  </View>
                                  <Pill
                                      left={this.state.healthData.left_stance}
                                      right={this.state.healthData.left_swing}
                                  />
                              </View>
                              {/* label */}
                              <Text style={{ flex:1, textAlign:'center', color:'#00A2A2', fontSize:14 }}>
                                  {getLocalizedText(this.props.lang, LangDashboard.leftFoot)}
                              </Text>
                          </View>

                          {/* ─────────── Row 2 : Right-foot stance / swing % ─────────── */}
                          <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-evenly', marginBottom:12, marginTop:10 }}>
                              {/* icon */}
                              <Image source={stanceStandImg} style={{ width:60, height:60, resizeMode:'contain' }} />
                              {/* pill */}
                              <View style={{ marginLeft:22, marginRight:24 }}>
                                  <Pill
                                      left={this.state.healthData.right_stance}
                                      right={this.state.healthData.right_swing}
                                  />
                              </View>
                              {/* label */}
                              <Text style={{ flex:1, textAlign:'center', color:'#00A2A2', fontSize:14 }}>
                                  {getLocalizedText(this.props.lang, LangDashboard.rightFoot)}
                              </Text>
                            </View>
                            </View>
                        </LinearGradient>
                      </>
                      ) : (
                      /* -------------------------------------------------------------- *
                      *   SENSOR-TYPE 1  →  show existing Foot-Balance card           *
                      * -------------------------------------------------------------- */
                        <View style={{ marginVertical: 10 }}>
                          {/*  keep your original Foot Balance JSX exactly as-is  */}
                            <>
                                <View style={{ marginVertical: 10 }}>
                                    <LinearGradient
                                        colors={['#005C51', '#0CFFD3']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{
                                            padding: 1,
                                            borderRadius: 10,
                                            marginHorizontal: 10,
                                        }}>
                                        <View
                                            style={{
                                                backgroundColor: '#fff',
                                                padding: 10,
                                                borderRadius: 10,
                                            }}>
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    paddingHorizontal: 10,
                                                    width: '100%',
                                                }}>
                                                {/* ---------- Left column: Radar + labels ---------- */}
                                                <View style={{ width: '40%' }}>
                                                    <Text style={{ fontSize: 18, color: '#00A2A2' }}>
                                                        {getLocalizedText(this.props.lang, LangDashboard.footBalance)}
                                                    </Text>

                                                    <View style={{ alignItems: 'center', marginVertical: 5 }}>
                                                        {this.state.focus ? (
                                                            <RadarChartForDashboard
                                                                positionValue={this.state.positionValue}
                                                            />
                                                        ) : (
                                                            <View />
                                                        )}
                                                    </View>

                                                    <View
                                                        style={{
                                                            flexDirection: 'row',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                        }}>
                                                        <Text style={{ fontSize: 15, color: '#00A2A2' }}>{getLocalizedText(this.props.lang, LangDashboard.left)}</Text>
                                                        <Text style={{ fontSize: 15, color: '#00A2A2' }}>{getLocalizedText(this.props.lang, LangDashboard.right)}</Text>
                                                    </View>
                                                </View>

                                                {/* ---------- Right column: sway / velocity cards ---------- */}
                                                <View
                                                    style={{
                                                        width: '65%',
                                                        paddingHorizontal: 5,
                                                        paddingVertical: 5,
                                                    }}>
                                                    {/* -- Card 1 : Path, ML, AP sway -- */}
                                                    <LinearGradient
                                                        colors={['#005C51', '#0CFFD3']}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 0 }}
                                                        style={{
                                                            padding: 1,
                                                            borderRadius: 10,
                                                            marginHorizontal: 5,
                                                            marginVertical: 10,
                                                        }}>
                                                        <View
                                                            style={{
                                                                backgroundColor: '#fff',
                                                                padding: 10,
                                                                borderRadius: 10,
                                                            }}>
                                                            <View
                                                                style={{
                                                                    justifyContent: 'center',
                                                                    alignItems: 'center',
                                                                }}>
                                                                <Text style={{ fontSize: 15, color: '#00A2A2' }}>
                                                                    {getLocalizedText(this.props.lang, LangDashboard.pathSway)}
                                                                </Text>
                                                                <Text
                                                                    style={{
                                                                        fontSize: 15,
                                                                        color: '#00A2A2',
                                                                        fontWeight: 'bold',
                                                                    }}>
                                                                    {this.state.healthData.path_sway} cm
                                                                </Text>
                                                            </View>

                                                            <View
                                                                style={{
                                                                    flexDirection: 'row',
                                                                    justifyContent: 'space-evenly',
                                                                    alignItems: 'center',
                                                                }}>
                                                                <View
                                                                    style={{
                                                                        justifyContent: 'center',
                                                                        alignItems: 'center',
                                                                    }}>
                                                                    <Text style={{ fontSize: 15, color: '#00A2A2' }}>
                                                                        {getLocalizedText(this.props.lang, LangDashboard.mlSway)}
                                                                    </Text>
                                                                    <Text
                                                                        style={{
                                                                            fontSize: 15,
                                                                            color: '#00A2A2',
                                                                            fontWeight: 'bold',
                                                                        }}>
                                                                        {this.state.healthData.ml_sway} cm
                                                                    </Text>
                                                                </View>

                                                                <View
                                                                    style={{
                                                                        justifyContent: 'center',
                                                                        alignItems: 'center',
                                                                    }}>
                                                                    <Text style={{ fontSize: 15, color: '#00A2A2' }}>
                                                                        {getLocalizedText(this.props.lang, LangDashboard.apSway)}
                                                                    </Text>
                                                                    <Text
                                                                        style={{
                                                                            fontSize: 15,
                                                                            color: '#00A2A2',
                                                                            fontWeight: 'bold',
                                                                        }}>
                                                                        {this.state.healthData.ap_sway} cm
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    </LinearGradient>

                                                    {/* -- Card 2 : Ellipse area + velocity -- */}
                                                    <LinearGradient
                                                        colors={['#005C51', '#0CFFD3']}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 0 }}
                                                        style={{
                                                            padding: 1,
                                                            borderRadius: 10,
                                                            marginHorizontal: 5,
                                                            marginVertical: 10,
                                                        }}>
                                                        <View
                                                            style={{
                                                                backgroundColor: '#fff',
                                                                padding: 10,
                                                                borderRadius: 10,
                                                            }}>
                                                            <View
                                                                style={{
                                                                    flexDirection: 'row',
                                                                    justifyContent: 'space-evenly',
                                                                    alignItems: 'center',
                                                                }}>
                                                                {/* Ellipse area */}
                                                                <View
                                                                    style={{
                                                                        justifyContent: 'center',
                                                                        alignItems: 'center',
                                                                        marginHorizontal: 5,
                                                                    }}>
                                                                    <Text
                                                                        style={{
                                                                            fontSize: 15,
                                                                            color: '#00A2A2',
                                                                            textAlign: 'center',
                                                                        }}>
                                                                        {getLocalizedText(this.props.lang, LangDashboard.ellipseArea)}
                                                                    </Text>
                                                                    <Text
                                                                        style={{
                                                                            fontSize: 15,
                                                                            textAlign: 'center',
                                                                            color: '#00A2A2',
                                                                            fontWeight: 'bold',
                                                                        }}>
                                                                        {this.state.healthData.ellipse_area + '\n'} cm
                                                                    </Text>
                                                                    <Text
                                                                        style={{
                                                                            position: 'absolute',
                                                                            fontSize: 10,
                                                                            top: 37,
                                                                            left: 52,
                                                                            color: '#00A2A2',
                                                                            fontWeight: 'bold',
                                                                        }}>
                                                                        ²
                                                                    </Text>
                                                                </View>

                                                                {/* Velocity */}
                                                                <View
                                                                    style={{
                                                                        justifyContent: 'center',
                                                                        alignItems: 'center',
                                                                        marginHorizontal: 5,
                                                                    }}>
                                                                    <Text
                                                                        style={{
                                                                            fontSize: 15,
                                                                            color: '#00A2A2',
                                                                            textAlign: 'center',
                                                                        }}>
                                                                        {getLocalizedText(this.props.lang, LangDashboard.velocity)}
                                                                    </Text>
                                                                    <Text
                                                                        style={{
                                                                            textAlign: 'center',
                                                                            fontSize: 15,
                                                                            color: '#00A2A2',
                                                                            fontWeight: 'bold',
                                                                        }}>
                                                                        {this.state.healthData.velocity + '\n'} cm/sec
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    </LinearGradient>
                                                </View>
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </View>
                            </>
                        </View>
                      )}
                      </View>
                  </View>
                </ScrollView>

                {/* ──────────── PAGE 2 ──────────── */}
                  <LinearGradient
                      colors={[
                          '#eafffa',
                          '#eafffa'
                          // '#FFFFFF',
                          // '#FFFFFF',
                          // 'rgba(216,255,255,0.6)',
                          // '#CFFFFF',
                      ]}
                      locations={[0, 0.9, 0.96, 1]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={{ flex: 1 }}
                  >
                      <ScrollView
                          contentContainerStyle={{
                              flexGrow: 1,
                              alignItems: 'center',
                              paddingHorizontal: 20,
                          }}
                          showsVerticalScrollIndicator={false}
                      >
                      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 20 }}>

                          <View
                              style={{
                                  width: 300,
                                  height: 300,
                                  borderRadius: 150,
                                  overflow: 'hidden',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginTop: 40,
                              }}
                          >
                              <Image
                                  source={exerciseImg}
                                  style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                              />
                          </View>

                          {/* paragraph */}
                          <View style={{ width: '85%', backgroundColor: '#fff', borderRadius: 16, padding: 18, marginVertical: 10, elevation: 2 }}>
                          <Text
                              style={{
                                  width: 325,
                                  // marginTop: 24,
                                  fontFamily: 'BaiJamjuree-Medium',
                                  fontSize: 16,
                                  lineHeight: 16 * 1.53,
                                  textAlign: 'justify',
                                  color: '#333',
                              }}
                          >
                              {this.state.dashboardSummaryText || 'Loading summary...'}
                          </Text>
                          </View>

                          {/* push button to the bottom */}
                          <View style={{ flex: 1 }} />

                          {/* Exercise Training CTA */}
                          <TouchableOpacity
                              activeOpacity={0.8}
                              style={{
                                  width: 353,
                                  height: 56.5,
                                  borderRadius: 30,
                                  backgroundColor: '#00A2A2',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  marginBottom: 70,        // keeps button off the very edge
                              }}
                              onPress={() => this.props.navigation.navigate('ExerciseTraining')}
                          >
                              <Text
                                  style={{
                                      fontFamily: 'BaiJamjuree-Bold', // 700 weight
                                      fontSize: 30,
                                      lineHeight: 30,                 // 100 % of font size
                                      letterSpacing: -0.3,            // ≈ −1 % of 30 px
                                      color: '#FFFFFF',
                                      textAlign: 'center',
                                  }}
                              >
                                  {this.props.exerciseTrainingLabel}
                              </Text>
                          </TouchableOpacity>
                      </View>
                      </ScrollView>
                  </LinearGradient>

              </Swiper>
          )}
        </View>
    );
  }
}

const mapStateToProps = state => {
    const langKey = state.lang;

    const effectiveUser = state.impersonating && state.patient_id
        ? { ...state.user, id_customer: state.patient_id, security_token: state.patient_token }
        : state.user;

    const effectiveToken = state.impersonating && state.patient_token
        ? state.patient_token
        : state.token;

    return {
        user: effectiveUser,
        token: effectiveToken,
        lang: state.lang,
        exerciseTrainingLabel: getLocalizedText(state.lang, LangDashboard.exerciseTraining) || 'Exercise Training',
    };
};


export default connect(mapStateToProps)(index);