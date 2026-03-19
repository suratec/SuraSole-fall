//5.11.2562

import React, { Component } from 'react';
import {
  View,
  Platform,
  Dimensions,
  ToastAndroid,
  Text as RNText,
} from 'react-native';
import Items from './item';
import { Body, Card, CardItem, Icon, Right, Left, Thumbnail } from '../../common/NativeBaseShim';
import Lang from '../../../assets/language/screen/lang_home';
import { getLocalizedText } from '../../../assets/language/langUtils';
import UI from '../../../config/styles/CommonStyles';
import Text from '../../common/TextFix';
import { connect } from 'react-redux';
const { height: D_HEIGHT, width: D_WIDTH } = Dimensions.get('window');
// import { withNavigation } from 'react-navigation';


class listItem extends Component {
  componentDidMount() {
    console.log(this.props.eightSensor);
  }

  actionDashboard = () => {
    // if (this.state.switch) {
    //   Vibration.vibrate(1500);
    // }
    // Vibration.vibrate(DURATION);
  };


    render() {
        return (
            <View
                style={{
                    backgroundColor: '#fff',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 10,
                }}>

                {/* Row 1 */}
                <View
                    style={{
                        width: '96%',
                        alignSelf: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginHorizontal: 5,
                    }}>
                    <Items
                        text={getLocalizedText(this.props.lang, Lang.addDeviceButton)}
                        source={require('../../../assets/image/menu/add.png')}
                        onPress={() => {
                            this.props.navigation.navigate('Product', {
                                name: getLocalizedText(this.props.lang, Lang.addDeviceButton),
                            });
                        }}
                    />
                    <Items
                        text={getLocalizedText(this.props.lang, Lang.dashboard)}
                        source={require('../../../assets/image/dashboard.png')}
                        onPress={() => {
                            this.props.navigation.navigate('Dashboard', {
                                name: getLocalizedText(this.props.lang, Lang.dashboard),
                            });
                        }}
                    />
                    <Items
                        text={getLocalizedText(this.props.lang, Lang.pressureMapButton)}
                        source={require('../../../assets/image/menu/pressure.png')}
                        onPress={() => {
                            this.props.navigation.navigate(
                                this.props.eightSensor ? 'PressureMapEight' : 'PressureMap',
                                {
                                    name: getLocalizedText(this.props.lang, Lang.pressureMapButton),
                                },
                            );
                        }}
                    />
                </View>

                {/* Row 2 */}
                <View
                    style={{
                        width: '96%',
                        alignSelf: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginHorizontal: 5,
                    }}>
                    <Items
                        text={getLocalizedText(this.props.lang, Lang.assessmentTests)}
                        source={require('../../../assets/image/menu/assessment_icon.png')}
                        onPress={() => {
                            this.props.navigation.navigate('FallRiskScreen', {
                                name: getLocalizedText(this.props.lang, Lang.assessmentTests),
                            });
                        }}
                    />
                    <Items
                        text={getLocalizedText(this.props.lang, Lang.gaitAnalysisButton)}
                        source={require('../../../assets/image/menu/gail.png')}
                        onPress={() => {
                            this.props.navigation.navigate(
                                this.props.eightSensor ? 'GailAnalysisEight' : 'GailAnalysis',
                                {
                                    name: getLocalizedText(this.props.lang, Lang.gaitAnalysisButton),
                                },
                            );
                        }}
                    />
                    <Items
                        text={getLocalizedText(this.props.lang, Lang.exerciseTraining)}
                        source={require('../../../assets/image/menu/training.png')}
                        onPress={() => {
                            this.props.navigation.navigate('ExerciseTraining', {
                                name: getLocalizedText(this.props.lang, Lang.exerciseTraining),
                            });
                        }}
                    />

                </View>

                {/* Row 3 */}
                <View
                    style={{
                        width: '96%',
                        alignSelf: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginHorizontal: 5,
                    }}>
                    <Items
                        text={getLocalizedText(this.props.lang, Lang.footsBalanceButton)}
                        source={require('../../../assets/image/menu/balance.png')}
                        onPress={() => {
                            if (this.props.eightSensor) {
                                this.props.navigation.navigate('FootsBalanceEight', {
                                    name: getLocalizedText(this.props.lang, Lang.footsBalanceButton),
                                });
                            } else {
                                this.props.navigation.navigate('FootsBalance', {
                                    name: getLocalizedText(this.props.lang, Lang.footsBalanceButton),
                                });
                            }
                        }}
                    />
                    <Items
                        text={getLocalizedText(this.props.lang, Lang.shoeRecommend)}
                        source={require('../../../assets/image/menu/shoe_icon.png')}
                        onPress={() => {
                            this.props.navigation.navigate('ShoeRecommend', {
                                name: getLocalizedText(this.props.lang, Lang.shoeRecommend),
                            });
                        }}
                    />
                    <View
                        style={{
                            borderWidth: 0,
                            height: 150,
                            width: '30%',
                            marginHorizontal: 5,
                            borderRadius: 6,
                            marginVertical: 5,
                            backgroundColor: 'transparent', // invisible
                        }}
                    />

                </View>
            </View>
        );
    }

}

const mapStateToProps = state => {
    return {
    lang: state.lang,
    eightSensor: state.eightSensor,
  };
};

export default connect(mapStateToProps)(listItem);
