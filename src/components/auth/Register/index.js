import React, { Component } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AlertFix from '../../common/AlertsFix';
import UI from '../../../config/styles/CommonStyles';
import API from '../../../config/Api';
import CardRegister from './card_register';
import Lang from '../../../assets/language/auth/lang_register';

import messaging from '@react-native-firebase/messaging';

import { connect } from 'react-redux';

class Register extends Component {
  actionSignln = (username, password) => {
    if (username != '' && password != '') {
      fetch(`${API}/check/login`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.toLowerCase(),
          password: password,
        }),
      })
        .then(res => res.json())
        .then(async res => {
          if (res.status == 'ผิดพลาด') {
            //error
            AlertFix.alertBasic(
              null,
              'กรุณากรอก ชื่อผู้ใช้ และ รหัสผ่าน ใหม่อีกครั้ง !',
            );
          } else {
            //sucsss !

            const deviceType = Platform.OS === 'ios' ? 2 : 1;
            let userInfo = res.user_info;
            const useId = res.member_info.id_data_role;
            const roleInfo = res.member_info.data_role;
            const authorizationStatus = await messaging().requestPermission();
            console.log(authorizationStatus,"authorizationStatus");
            const device_token = await messaging().getToken();// no-op on Android and if already registered
              // .then(() => messaging().getToken())
              // .then((t) => t
              // )
            // const device_token = await messaging() .registerDeviceForRemoteMessages().getToken();

            await this.addDeviceToken(
              useId,
              device_token,
              deviceType,
              roleInfo,
            );
            userInfo.role = res.member_info.data_role;
            userInfo.device_token = device_token;
            userInfo.deviceType = deviceType;
            userInfo.iddatarole = res.member_info.id_data_role;
            this.props.addUser({ user: userInfo, token: res.data });
            this.props.navigation.navigate('App');

            // this.props.addUser({ user: res.user_info, token: res.data });
            // this.props.navigation.navigate('App');
          }
        })
        .catch(error => {
          console.error(error);
        });
    } else {
      AlertFix.alertBasic(
        'รายงานข้อผิดพลาด',
        'กรุณากรอก username และ password !',
      );
    }
  };
  addDeviceToken = async (userId, device_token, deviceType, roleInfo) => {
    fetch(`${API}/addDevice`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_id: device_token,
        device_type: deviceType,
        user_id: userId,
        user_role: roleInfo,
        status: 1,
      }),
    })
      .then(res => res.json())
      .then(res => {
        console.log(res);
      })
      .catch(err => {
        console.log('Device ID Registration', err);
      });
  };
  actionSignUp = (register, type) => {
    if (type != null) {
      if (
        register.user != '' &&
        register.pass != '' &&
        register.cm_pass != '' &&
        register.email != '' &&
        register.gender != -1
      ) {
        if (register.pass == register.cm_pass) {
          //alert('register sucss !')

          fetch(`${API}/register`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: register.user.toLowerCase(),
              password: register.pass,
              confirm_password: register.cm_pass,
              email: register.email,
              type: type,
              gender: register.gender,
            }),
          })
            .then(res => res.json())
            .then(res => {
              if (res.status != 'สำเร็จ') {
                //error
                AlertFix.alertBasic(
                  this.props.lang
                    ? Lang.alertErrorTitle.thai
                    : Lang.alertErrorTitle.eng,
                  this.props.lang
                    ? Lang.alertErrorBody.thai
                    : Lang.alertErrorBody.eng,
                );
              } else {
                //sucsss !
                AlertFix.alertBasic(
                  this.props.lang
                    ? Lang.alertSuccessTitle.thai
                    : Lang.alertSuccessTitle.eng,
                  this.props.lang
                    ? Lang.alertSuccessBody.thai
                    : Lang.alertSuccessBody.eng,
                );
                this.actionSignln(register.user.toLowerCase(), register.pass);
              }
            })
            .catch(error => {
              // ADD THIS THROW error
              throw error;
            });

          // this.props.navigation.goBack();
        } else {
          // password not equal
          alert(this.props.lang ? Lang.alertBody1.thai : Lang.alertBody1.eng);
        }
      } else {
        // not input form
        alert(this.props.lang ? Lang.alertBody2.thai : Lang.alertBody2.eng);
      }
    } else {
      AlertFix.alertBasic(null, 'กรุณาเลือกหมวดการใช้งานแอพ ​!');
    }
  };

  render() {
    let register = { user: '', pass: '', cm_pass: '', email: '', gender: -1 };
    let type = '1';
    let itemsModeApp = [
      { label: 'การแพทย์', value: '1' },
      { label: 'การกีฬา', value: '2' },
      { label: 'เบาหวาน', value: '3' },
    ];

    return (
      <View style={styles.container}>
        <LinearGradient
          colors={UI.color_Gradient}
          style={{ height: '100%', justifyContent: 'center' }}>
          <View style={{ padding: 15 }}>
            <CardRegister
              labelTitle={
                this.props.lang ? Lang.titleName.thai : Lang.titleName.eng
              }
              labelBack={
                this.props.lang ? Lang.labelBack.thai : Lang.labelBack.eng
              }
              labelUsername={
                this.props.lang
                  ? Lang.fieldUsername.thai
                  : Lang.fieldUsername.eng
              }
              inputUsername={txt => {
                register.user = txt;
              }}
              labelEmail={
                this.props.lang ? Lang.fieldEmail.thai : Lang.fieldEmail.eng
              }
              inputEmail={txt => {
                register.email = txt;
              }}
              labelPassword={
                this.props.lang
                  ? Lang.fieldPassword.thai
                  : Lang.fieldPassword.eng
              }
              inputPassword={txt => {
                register.pass = txt;
              }}
              labelCmPassword={
                this.props.lang
                  ? Lang.fieldConfirmPassword.thai
                  : Lang.fieldConfirmPassword.eng
              }
              inputConfirmPassword={txt => {
                register.cm_pass = txt;
              }}
              titleDropdown={
                this.props.lang
                  ? Lang.fieldDropdownfix.thai
                  : Lang.fieldDropdownfix.eng
              }
              itemsDropdown={itemsModeApp}
              onValueChangeDropdown={value => {
                type = value;
              }}
              placeholderDropdown={{
                label: this.props.lang
                  ? Lang.fieldDropdownfixfield.thai
                  : Lang.fieldDropdownfixfield.eng,
                value: null,
              }}
              labelBtn={
                this.props.lang ? Lang.titleBtn.thai : Lang.titleBtn.eng
              }
              labelMale={
                this.props.lang ? Lang.radioMale.thai : Lang.radioMale.eng
              }
              labelFemale={
                this.props.lang ? Lang.radioFemale.thai : Lang.radioFemale.eng
              }
              //
              onPressRadio={value => {
                register.gender = value;
              }}
              //
              navigation={this.props.navigation}
              onRegister={() => this.actionSignUp(register, type)}
            />
          </View>
        </LinearGradient>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});

const mapStateToProps = state => {
  return {
    lang: state.lang,
  };
};
const mapDispatchToProps = dispatch => {
  return {
    addUser: user => {
      return dispatch({ type: 'ADD_USERINFO', payload: user });
    },
    edit_Lang: data => {
      return dispatch({ type: 'EDIT_LANG', payload: data });
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Register);
