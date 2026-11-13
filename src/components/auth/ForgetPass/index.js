import React, {Component} from 'react';
import {View} from 'react-native';
import {connect} from 'react-redux';

import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UI from '../../../config/styles/CommonStyles';
import AlertFix from '../../common/AlertsFix';
import CardForget from './card_forget';
import API from '../../../config/Api';

import Lang from '../../../assets/language/auth/lang_forget';
import {getLocalizedText} from '../../../assets/language/langUtils';

class ForgetPass extends Component {
  state = {
    email: '',
  };

  actionResetEmail = email => {
    if (email != '') {
      fetch(`${API}/forget-password`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
        }),
      })
        .then(res => res.json())
        .then(res => {
          if (res.status != 'OK') {
            //error
            AlertFix.alertBasic(
              getLocalizedText(this.props.lang, Lang.alertErrorTitle),
              getLocalizedText(this.props.lang, Lang.alertErrorBody1),
            );
          } else {
            //sucsss !
            AlertFix.alertBasic(
              getLocalizedText(this.props.lang, Lang.alertSuccessTitle),
              getLocalizedText(this.props.lang, Lang.alertSuccessBody),
            );
            this.props.navigation.navigate('SignIn');
          }
        })
        .catch(error => {
          console.error(error);
        });
    } else {
      AlertFix.alertBasic(
        getLocalizedText(this.props.lang, Lang.alertErrorTitle),
        getLocalizedText(this.props.lang, Lang.alertErrorBody2),
      );
    }
  };

  render() {
    return (
      <LinearGradient
        colors={UI.color_Gradient}
        style={{height: '100%', justifyContent: 'center'}}>
        <View style={{padding: 15}}>
          <CardForget
            labelTitle={
              getLocalizedText(this.props.lang, Lang.titleName)
            }
            labelEmail={
              getLocalizedText(this.props.lang, Lang.fieldEmail)
            }
            inputEmail={txt => {
              this.setState({email: txt});
            }}
            labelBtn={getLocalizedText(this.props.lang, Lang.titleBtn)}
            onForget={() => this.actionResetEmail(this.state.email)}
            navigation={this.props.navigation}
            labelBack={
              getLocalizedText(this.props.lang, Lang.labelBack)
            }
          />
        </View>
      </LinearGradient>
    );
  }
}

const mapStateToProps = state => {
  return {
    lang: state.lang,
  };
};

export default connect(mapStateToProps)(ForgetPass);
