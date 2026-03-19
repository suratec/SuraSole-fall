import React, { Component } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { NavigationActions } from 'react-navigation';
import LinearGradient from 'react-native-linear-gradient';

import AlertFix from '../../common/AlertsFix';
import messaging from '@react-native-firebase/messaging';
import API from '../../../config/Api';
import Lang from '../../../assets/language/auth/lang_singln';
import LanguagePickerFix from '../../common/LanguagePickerFix';
import {getLocalizedText, getLangKeysSize} from '../../../assets/language/langUtils';

import { connect } from 'react-redux';

class SignIn extends Component {
  state = {
    username: '',
    password: '',
    isFocused: null,
    langPickerVisible: false, // Add this for modal visibility
  };

  async componentDidMount() {
    const permission = await messaging().requestPermission();
    console.log("Messaging permission:", permission);
    const token = await messaging().getToken();
    console.log("Device Token:", token);
  }

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
    }).then(res => res.json())
        .then(console.log)
        .catch(err => console.log('Device ID Registration Error', err));
  };

  actionSignIn = async (username, password) => {
    const langKey = ['eng', 'thai', 'japanese'][this.props.lang] || 'eng';

    if (!username || !password) {
      AlertFix.alertBasic(
          Lang.alertErrorTitle?.[langKey] || 'Error',
          Lang.alertErrorBody2?.[langKey] || 'Please enter username and password'
      );
      return;
    }

    try {
      const response = await fetch(`${API}/check/login`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (data.status === 'ผิดพลาด') {
        AlertFix.alertBasic(
            Lang.alertErrorTitle?.[langKey] || 'Error',
            Lang.alertErrorBody1?.[langKey] || 'Please enter username and password'
        );
        return;
      }

      const deviceType = Platform.OS === 'ios' ? 2 : 1;
      const deviceToken = await messaging().getToken();

      await this.addDeviceToken(
          data.member_info.id_data_role,
          deviceToken,
          deviceType,
          data.member_info.data_role,
      );

      const userInfo = {
        ...data.user_info,
        role: data.member_info.data_role,
        iddatarole: data.member_info.id_data_role,
        device_token: deviceToken,
        deviceType,
        security_token: data.data,
      };
      if (data.patients) userInfo.patients = data.patients;

      if (userInfo.role === 'mod_employee') {
        await AsyncStorage.setItem('doctor_username', username);
        await AsyncStorage.setItem('doctor_password', password);
      }

      this.props.addUser({ user: userInfo, token: data.data });
      console.log('USER ID:', userInfo.id_customer);
      console.log('SECURITY TOKEN:', data.data);

      if (userInfo.role === 'mod_employee') {
        this.props.navigation.navigate('App', { screen: 'PatientList' });
      } else if (userInfo.role === 'mod_customer') {
        this.props.navigation.navigate('App');
      } else {
        AlertFix.alertBasic('Unknown role', 'You do not have access rights assigned.');
      }

    } catch (err) {
      console.error('Sign-in error ➜', err);
      AlertFix.alertBasic('Login failed', 'Network or server error. Please retry.');
    }
  };

  // Updated language selection method for modal
  selectLanguage = (langIndex) => {
    this.props.edit_Lang(langIndex);
    this.setState({ langPickerVisible: false });
  };

  // Dynamically get all available languages from lang_singln.js
  getLanguageOptions = () => {
    const langKeys = Object.keys(Lang.langSwitch);
    return langKeys.map((key, index) => ({
      label: Lang.langSwitch[key],
      value: index,
      key: key
    }));
  };

  // Get current language display text dynamically
  getCurrentLanguageText = () => {
    const { lang } = this.props;
    const langKeys = Object.keys(Lang.langSwitch);
    const currentLangKey = langKeys[lang];
    return Lang.langSwitch[currentLangKey] || Lang.langSwitch[langKeys[0]]; // fallback to first language
  };

  render() {
    const { lang } = this.props;
    const { username, password, isFocused, langPickerVisible } = this.state;

    // Dynamically get language options from lang_singln.js
    const languageOptions = this.getLanguageOptions();

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <LinearGradient colors={['#00B3B3', '#007A7A']} style={styles.gradient}>
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <Image
                    source={require('../../../assets/image/icons/surasolelogofallrisk.png')}
                    style={styles.logo}
                />
                <Text style={styles.title}>
                  {getLocalizedText(lang, Lang.titleName)}
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>
                    {getLocalizedText(lang, Lang.signIn)}
                  </Text>
                  <View style={styles.divider} />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {getLocalizedText(lang, Lang.fieldUsername)}
                  </Text>
                  <TextInput
                      value={username}
                      onChangeText={(txt) => this.setState({ username: txt })}
                      style={[
                        styles.input,
                        isFocused === 'username' && styles.inputFocused,
                      ]}
                      onFocus={() => this.setState({ isFocused: 'username' })}
                      onBlur={() => this.setState({ isFocused: null })}
                      placeholder={getLocalizedText(lang, Lang.usernamePlaceholder)}
                      placeholderTextColor="#888"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {getLocalizedText(lang, Lang.fieldPassword)}
                  </Text>
                  <TextInput
                      value={password}
                      onChangeText={(txt) => this.setState({ password: txt })}
                      secureTextEntry
                      style={[
                        styles.input,
                        isFocused === 'password' && styles.inputFocused,
                      ]}
                      onFocus={() => this.setState({ isFocused: 'password' })}
                      onBlur={() => this.setState({ isFocused: null })}
                      placeholder={getLocalizedText(lang, Lang.passwordPlaceholder)}
                      placeholderTextColor="#888"
                  />
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                      this.props.addRightDevice(undefined);
                      this.props.addLeftDevice(undefined);
                      this.actionSignIn(username, password);
                    }}
                >
                  <Text style={styles.buttonText}>
                    {getLocalizedText(lang, Lang.signIn)}
                  </Text>
                </TouchableOpacity>

                {/* Account Actions */}
                <TouchableOpacity
                    style={{ marginTop: 24, alignItems: 'center' }}
                    onPress={() => this.props.navigation.navigate('Register')}
                >
                  <Text style={{ color: '#00B3B3', fontWeight: '600', fontSize: 15 }}>
                    {getLocalizedText(lang, Lang.labelSignUp)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={{ marginTop: 16, alignItems: 'center' }}
                    onPress={() => this.props.navigation.navigate('ForgetPass')}
                >
                  <Text style={{ color: '#888', fontSize: 13 }}>
                    {getLocalizedText(lang, Lang.labelForgot)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/*// In your SignIn index.js, replace the current usage with:*/}

              <LanguagePickerFix
                  langSwitch={Lang.langSwitch}
                  onLanguageChange={(index) => {
                    console.log('Language changed to:', index);
                    // Add any additional SignIn-specific logic here if needed
                  }}
                  isCircular={false}          // Keep rectangular for SignIn
                  showFlag={true}             // Show flag emoji
                  showText={true}             // Show language text
                  buttonStyle={{
                    backgroundColor: '#e0f7fa',
                    borderColor: '#00c3cc',
                    paddingHorizontal: 15,
                    paddingVertical: 10,
                    minWidth: 120,          // Ensure button has good width
                  }}
                  textStyle={{
                    color: '#00c3cc',
                    fontSize: 16,
                    fontWeight: 'bold',
                  }}
                  style={{
                    marginTop: 30,
                    alignSelf: 'center',    // Center the component
                  }}
                  modalTitle="Select Language"  // Custom modal title if needed
              />
            </ScrollView>
          </LinearGradient>
        </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: {
    width: 120, height: 120,
    marginBottom: 15, borderRadius: 16,
  },
  title: {
    fontSize: 28, fontWeight: '700',
    color: '#FFF', letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: { marginBottom: 20 },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00B3B3',
    textAlign: 'center',
  },
  divider: {
    height: 3,
    width: 60,
    backgroundColor: '#00B3B3',
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: 2,
  },
  inputContainer: { marginBottom: 22 },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00B3B3',
    marginBottom: 8,
    marginLeft: 5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  inputFocused: {
    borderColor: '#00B3B3',
    backgroundColor: '#FFF',
    shadowColor: '#00B3B3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  button: {
    backgroundColor: '#00B3B3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#009E9E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },

  // Updated Language Picker Styles
  languagePickerContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  languageButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#e0f7fa',
    borderWidth: 1,
    borderColor: '#00c3cc',
  },
  languageButtonText: {
    fontSize: 16,
    color: '#00c3cc',
    fontWeight: 'bold',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: 250,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00c3cc',
    textAlign: 'center',
    marginBottom: 15,
  },
  languageOption: {
    paddingVertical: 12,
    borderRadius: 6,
    marginVertical: 2,
  },
  languageOptionSelected: {
    backgroundColor: '#00c3cc',
  },
  languageOptionText: {
    fontSize: 18,
    fontWeight: 'normal',
    textAlign: 'center',
    color: '#00c3cc',
  },
  languageOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalCloseButton: {
    marginTop: 10,
  },
  modalCloseText: {
    color: '#00c3cc',
    textAlign: 'center',
    fontSize: 16,
  },
});

const mapDispatchToProps = dispatch => ({
  addUser: user => dispatch({ type: 'ADD_USERINFO', payload: user }),
  edit_Lang: data => dispatch({ type: 'EDIT_LANG', payload: data }),
  addLeftDevice: device => dispatch({ type: 'ADD_LEFT_DEVICE', payload: device }),
  addRightDevice: device => dispatch({ type: 'ADD_RIGHT_DEVICE', payload: device }),
});

const mapStateToProps = state => ({
  lang: state.lang,
  rightDevice: state.rightDevice,
  leftDevice: state.leftDevice,
});

export default connect(mapStateToProps, mapDispatchToProps)(SignIn);