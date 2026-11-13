import React, {Component} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Text,
  Dimensions,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UI from '../../../config/styles/CommonStyles';
import AlertFix from '../../common/AlertsFix';
import Button from '../../common/Button';
import Lang from '../../../assets/language/auth/lang_terms';
import {connect} from 'react-redux';
// import { RichText, Bold, Italic, OrderedList, UnorderedList, Link, Media } from 'react-native-rte'

import {RichEditor} from 'react-native-pell-rich-editor';
const {height: D_HEIGHT, width: D_WIDTH} = Dimensions.get('window');
import styles from './styles';
import Color from 'color';
import {getLocalizedText} from '../../../assets/language/langUtils';
class Terms extends Component {
  state = {
    lang: 0,
    agreeBox: false,
    showError: false,
  };
  onEditorInitialized() {
    console.log('onEditor');
  }
  render() {
    const {agreeBox, showError} = this.state;
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={UI.color_Gradient_white}
          style={{height: '100%'}}>
          <View style={styles.header}>
            <Text style={styles.textTitle}>
              {getLocalizedText(this.props.lang, Lang.title)}
            </Text>
          </View>
          <View style={styles.centerView}>
            <View style={styles.pageTitleView}>
              <Text type={'bold'} style={styles.textPageTitle}>
                {getLocalizedText(this.props.lang, Lang.pageTitle)}
              </Text>
            </View>
            <View style={styles.pageWarning}>
              <Text style={styles.textNotiBold}>
                {getLocalizedText(this.props.lang, Lang.notiWarningBold)}
                <Text style={styles.textNoti}>
                  {getLocalizedText(this.props.lang, Lang.notiWarningText)}
                </Text>
              </Text>
            </View>

            {/* <SafeAreaView style={{flex:1, backgroundColor: '#fff',padding:10,paddingTop:0}}> */}
            <ScrollView style={{paddingBottom: 0}}>
              <KeyboardAvoidingView
                style={{flex: 1, padding: 10, paddingTop: 0}}>
                <RichEditor
                  ref={r => (this.richtext = r)}
                  disabled={true}
                  editorStyle={{fontSize: 10, paddingBottom: 20}}
                  initialTitleHTML={''}
                  initialContentHTML={`<div style="" >
              <p style="text-align:justify;font-size:10.6px;"><strong>PURPOSE:&nbsp;</strong>The purpose of "Telemedicine Consent Form" is to get the patient's consent in order to participate in appointments&nbsp;of telemedicine&nbsp;cares.</p>
              <p style="text-align:justify;font-size:10.6px;"><strong>RECORDS:&nbsp;</strong>Telecommunications with patients will not be recorded and stored. Patients' medical information obtained by the diagnosis and analysis can be used anonymously for further improvements in scientific studies.</p>
              <p style="text-align:justify;font-size:10.6px;"><strong>TELEMEDICINE INFORMATION:&nbsp;</strong>The medical information related to history, records and tests of the patient will be discussed during the telemedicine appointment with video and audio.</p>
              <p style="text-align:justify;font-size:10.6px;"><strong>ACCESS:&nbsp;</strong>The patient accepts that he/she needs access to PC, laptop, or mobile device and a good internet connection in order to have an efficient telemedicine appointment.</p>
              <p style="text-align:justify;font-size:10.6px;"><strong>PATIENT RIGHTS:&nbsp;</strong>The patient can withdraw his/her consent at any time and can ask the questions related to telemedicine appointments and technical requirements for telecommunication.</p>
            
              <p style="text-align:justify;font-size:10.6px;"><strong>By signing this form,</strong></p>
              <p style="text-align:justify;font-size:10.6px;">I understand that all the laws that are protecting my privacy of medical history or information are also applied to telemedicine practices.</p>
              <p style="text-align:justify;font-size:10.6px;">I understand that I can withdraw the consent at any time and that will not affect any of my future treatment procedures.</p>
              <p style="text-align:justify;font-size:10.6px;">I understand that I can be charged the additional fees that my insurance does not cover.</p>
              <p style="text-align:justify;font-size:10.6px;">I accept that I authorize&nbsp;health care professionals and use telemedicine for my treatment and diagnosis.</p>
         
          </div>`}
                  editorInitializedCallback={() => this.onEditorInitialized()}
                />
              </KeyboardAvoidingView>
            </ScrollView>
            {/* </SafeAreaView> */}
          </View>
          <TouchableOpacity
            onPress={e => {
              this.setState({agreeBox: !agreeBox});
            }}
            style={{flexDirection: 'row', margin: 20, left: 5, top: 10}}>
            <CheckBox
              disabled={false}
              value={agreeBox}
              onValueChange={newValue => this.setState({agreeBox: newValue})}
            />
            <Text
              style={{
                paddingTop: 5,
              }}>{` I have read and agree to the terms`}</Text>
          </TouchableOpacity>
          {showError && (
            <Text
              style={{
                fontSize: 12,
                marginLeft: 20,
                left: 20,
                color: 'red',
              }}>{`Please agree to the terms `}</Text>
          )}
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: 10,
            }}>
            <Button
              onPress={e => {
                console.log('s');
                if (agreeBox) {
                  this.props.navigation.navigate('Register');
                } else {
                  this.setState({showError: true});
                }
              }}
              styles={{
                width: 140,
              }}
              title="Agree"
              bgColor={UI.color_green}
            />
            <Button
              onPress={e => {
                console.log('Pros', this.props);
                this.props.navigation.navigate('SignIn');
              }}
              styles={{
                width: 140,
              }}
              title="Disagree"
              bgColor={UI.color_orange}
            />
          </View>
        </LinearGradient>
      </View>
    );
  }
}

const mapDispatchToProps = dispatch => {
  return {
    addUser: user => {
      return dispatch({type: 'ADD_USERINFO', payload: user});
    },
    edit_Lang: data => {
      return dispatch({type: 'EDIT_LANG', payload: data});
    },
  };
};

const mapStateToProps = state => {
  return {
    lang: state.lang,
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Terms);
