//5.11.62

import React, {Component} from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {connect} from 'react-redux';

import HeaderFix from '../../common/HeaderFix';
import AlertFix from '../../common/AlertsFix';
import CardProfile from '../profile/card_profile';
import NotesPage from './notes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../../../config/Api';

import UI from '../../../config/styles/CommonStyles';

import Lang from '../../../assets/language/menu/lang_profile';
import LangModal from './lang_model';
import LangAlert from '../../../assets/language/alert/lang_alert';

import ImagePicker from 'react-native-image-crop-picker';
// import FabChatbot from '../../common/FabChatbot';

const screenWidth = Math.round(Dimensions.get('window').width) * 0.35;

class index extends Component {
  state = {
    id_customer: '',
    fname: '',
    lname: '',
    weigth: '',
    heigth: '',
    age: '',
    sex: 0,
    id: '',
    tel: '',
    email: '',
    img_path: '',
    onModal: false,
    loading: false,
    id_facebook: '',
    newProfileImage: null, // for holding selected image before upload
    showNotes: false,
    hasUnsavedChanges: false,
    originalData: {}, // Store original data for comparison
  };

  componentDidMount = async () => {
    let user = this.props.user;
    const userData = {
      id: user.role === 'mod_employee' ? user.id_employee : user.id_customer,
      fname: user.fname?.toString() || '',
      lname: user.lname?.toString() || '',
      email: user.email || '',
      sex: user.sex === null ? 0 : parseInt(user.sex),
      heigth: user.height == null ? '0' : user.height.toString(),
      weigth: user.weight == null ? '0' : user.weight.toString(),
      age: user.age == null ? '0' : user.age.toString(),
      tel: user.telephone == null ? '0' : user.telephone.toString(),
      id_facebook: user.id_facebook == null ? '' : user.id_facebook.toString(),
      img_path: user.image || (user.role === 'mod_employee' ? 'doctor.png' : 'user.png'),
    };

    this.setState({
      ...userData,
      originalData: { ...userData }, // Store original data
    });
  };


  // Utility to get localized text
  getLocalizedText = (textObject) => {
    const langKey = ['eng', 'thai', 'japanese'][this.props.lang] || 'eng';
    return textObject[langKey] || textObject.eng || '';
  };

  // Check if there are unsaved changes
  checkUnsavedChanges = () => {
    const current = {
      fname: this.state.fname,
      lname: this.state.lname,
      weigth: this.state.weigth,
      heigth: this.state.heigth,
      age: this.state.age,
      sex: this.state.sex,
    };

    const original = this.state.originalData;

    return (
        current.fname !== original.fname ||
        current.lname !== original.lname ||
        current.weigth !== original.weigth ||
        current.heigth !== original.heigth ||
        current.age !== original.age ||
        current.sex !== original.sex ||
        this.state.newProfileImage !== null
    );
  };

  editprofilePicture = () => {
    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
      compressImageQuality: 0.8,
      mediaType: 'photo',
    })
        .then(image => {
          this.setState({
            newProfileImage: {
              uri: image.path,
              type: image.mime,
              name: `profile_${Date.now()}.jpg`,
            },
            img_path: image.path, // local preview
            hasUnsavedChanges: true,
          });
        })
        .catch(err => {
          console.log('Image pick canceled or failed:', err);
        });
  };

  validateInputs = () => {
    const { fname, lname, age, weigth, heigth } = this.state;

    if (!fname.trim() || !lname.trim()) {
      Alert.alert(
          this.getLocalizedText(Lang.alertErrorTitle),
          this.getLocalizedText(Lang.requiredField)
      );
      return false;
    }

    const ageNum = parseInt(age);
    if (ageNum < 1 || ageNum > 120) {
      Alert.alert(
          this.getLocalizedText(Lang.alertErrorTitle),
          this.getLocalizedText(Lang.invalidAge)
      );
      return false;
    }

    const weightNum = parseInt(weigth);
    if (weightNum < 1 || weightNum > 500) {
      Alert.alert(
          this.getLocalizedText(Lang.alertErrorTitle),
          this.getLocalizedText(Lang.invalidWeight)
      );
      return false;
    }

    const heightNum = parseInt(heigth);
    if (heightNum < 50 || heightNum > 300) {
      Alert.alert(
          this.getLocalizedText(Lang.alertErrorTitle),
          this.getLocalizedText(Lang.invalidHeight)
      );
      return false;
    }

    return true;
  };

  actionUpdate = async () => {
    if (!this.validateInputs()) {
      return;
    }

    Alert.alert(
        this.getLocalizedText(Lang.alertWarningTitle),
        this.getLocalizedText(Lang.confirmUpdate),
        [
          {
            text: this.getLocalizedText(Lang.cancelBtn),
            style: 'cancel',
          },
          {
            text: this.getLocalizedText(Lang.confirmBtn),
            onPress: () => this.performUpdate(),
          },
        ]
    );
  };

  performUpdate = async () => {
    this.setState({ loading: true });

    // Upload image first if new one selected
    if (this.state.newProfileImage) {
      const data = new FormData();
      data.append('id', this.state.id);
      data.append('type', this.props.user.role);
      data.append('image', this.state.newProfileImage);

      try {
        const res = await fetch(`${API}/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'multipart/form-data' },
          body: data,
        });
        const result = await res.json();

        if (result.status === 'สำเร็จ') {
          const user = { ...this.props.user, image: result.data };
          this.setState({ img_path: result.data });
          this.props.updatePath(user);
        } else {
          Alert.alert(
              this.getLocalizedText(Lang.alertErrorTitle),
              this.getLocalizedText(Lang.imageUploadFailed)
          );
          this.setState({ loading: false });
          return;
        }
      } catch (err) {
        console.error(err);
        Alert.alert(
            this.getLocalizedText(Lang.alertErrorTitle),
            this.getLocalizedText(Lang.networkError)
        );
        this.setState({ loading: false });
        return;
      }
    }

    // Update other profile info
    const body = {
      id: this.state.id,
      fname: this.state.fname,
      lname: this.state.lname,
      age: this.state.age,
      email: this.state.email,
      type: this.props.user.role,
      gender: this.state.sex,
      weight: this.state.weigth,
      telephone: this.state.tel,
      height: this.state.heigth,
      congenital_disease_flg: '1',
      congenital_disease: 'ความดัน',
      emergency_contract: '150 ถ.ศรีธานี',
    };

    try {
      const res = await fetch(`${API}/updata-profile`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      this.setState({ loading: false });

      if (result.message === 'บันทึกไม่สำเร็จ') {
        Alert.alert(
            this.getLocalizedText(Lang.alertErrorTitle),
            this.getLocalizedText(Lang.profileUpdateFailed)
        );
      } else {
        Alert.alert(
            this.getLocalizedText(Lang.alertSuccessTitle),
            this.getLocalizedText(Lang.profileUpdateSuccess),
            [
              {
                text: 'OK',
                onPress: () => {
                  const updatedUser = result.customer_info;
                  updatedUser.role = this.props.user.role;
                  this.props.addUser({ user: updatedUser, token: this.props.token });

                  // Update original data to reset unsaved changes flag
                  const newOriginalData = {
                    fname: this.state.fname,
                    lname: this.state.lname,
                    weigth: this.state.weigth,
                    heigth: this.state.heigth,
                    age: this.state.age,
                    sex: this.state.sex,
                  };
                  this.setState({
                    originalData: newOriginalData,
                    newProfileImage: null,
                    hasUnsavedChanges: false,
                  });

                  this.props.navigation.goBack();
                },
              },
            ]
        );
      }
    } catch (error) {
      this.setState({ loading: false });
      console.log(error);
      Alert.alert(
          this.getLocalizedText(Lang.alertErrorTitle),
          this.getLocalizedText(Lang.networkError)
      );
    }
  };

  validateNumber(key, value) {
    let parsed = parseInt(value);
    this.setState({
      [key]: value === '' ? '' : isNaN(parsed) ? '0' : parsed.toString(),
      hasUnsavedChanges: true,
    });
  }

  handleInputChange = (key, value) => {
    this.setState({
      [key]: value,
      hasUnsavedChanges: true,
    });
  };

  actionLang = () => {
    // Cycle language: 0 (English) -> 1 (Thai) -> 2 (Japanese) -> 0
    const newLang = (this.props.lang + 1) % 3;
    this.props.edit_Lang(newLang);
    AsyncStorage.setItem('lang', JSON.stringify(newLang));
    this.setState({ onModal: false });
  };

  handleOpenNotes = () => {
    this.setState({ showNotes: true });
  };

  handleCloseNotes = () => {
    this.setState({ showNotes: false });
  };

  render() {
    const {img_path, loading, showNotes} = this.state;

    if (showNotes) {
      // user_id: prefer id_customer, fallback to id
      const userId = this.props.user?.id_customer || this.props.user?.id;
      return (
          <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <HeaderFix
                icon_left={'left'}
                onpress_left={this.handleCloseNotes}
                title={this.getLocalizedText(Lang.notesBtn)}
            />
            <NotesPage navigation={this.props.navigation} userId={userId} />
          </View>
      );
    }

    return (
        <View style={{flex: 1, backgroundColor: '#fff'}}>
          <ScrollView style={{flex: 1}}>
            <HeaderFix
                icon_left={'left'}
                onpress_left={() => {
                  if (this.checkUnsavedChanges()) {
                    Alert.alert(
                        this.getLocalizedText(Lang.alertWarningTitle),
                        this.getLocalizedText(Lang.unsavedChanges),
                        [
                          {
                            text: this.getLocalizedText(Lang.cancelBtn),
                            style: 'cancel',
                          },
                          {
                            text: this.getLocalizedText(Lang.confirmBtn),
                            onPress: () => {
                              this.props.navigation.navigate('Home');
                            },
                          },
                        ]
                    );
                  } else {
                    this.props.navigation.navigate('Home');
                  }
                }}
                title={this.getLocalizedText(Lang.editProfileTitle)}
            />

            <TouchableOpacity
                style={{alignItems: 'center', paddingTop: 16}}
                onPress={this.editprofilePicture}>
              <View style={{width: screenWidth, height: screenWidth, padding: 5}}>
                <Image
                    style={{
                      width: screenWidth,
                      height: screenWidth,
                      borderRadius: screenWidth / 2,
                    }}
                    source={{ uri: img_path }}
                />
                <View
                    style={{
                      width: screenWidth * 0.2,
                      height: screenWidth * 0.2,
                      borderRadius: screenWidth * 0.34,
                      position: 'absolute',
                      backgroundColor: UI.color_Gradient[1],
                      bottom: 1,
                      right: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                  <Image
                      style={{
                        width: screenWidth * 0.13,
                        height: screenWidth * 0.13,
                      }}
                      source={require('../../../assets/image/icons/camera.png')}
                  />
                </View>
              </View>
            </TouchableOpacity>

            <CardProfile
                lang={this.props.lang}
                labelFirstName={this.getLocalizedText(Lang.firstNamelabel)}
                inputValueFirstName={this.state.fname}
                inputFirstName={txt => this.handleInputChange('fname', txt)}
                labelLastName={this.getLocalizedText(Lang.LastNamelabel)}
                inputValueLastName={this.state.lname}
                inputLastName={txt => this.handleInputChange('lname', txt)}
                labelGender={this.getLocalizedText(Lang.genderlabel)}
                inputValueGender={this.state.sex}
                inputGender={txt => this.handleInputChange('sex', txt)}
                labelWeigth={this.getLocalizedText(Lang.weightLabel)}
                inputValueWeigth={this.state.weigth}
                inputWeigth={txt => this.validateNumber('weigth', txt)}
                labelHeight={this.getLocalizedText(Lang.heigthLabel)}
                inputValueHeight={this.state.heigth}
                inputHeigth={txt => this.validateNumber('heigth', txt)}
                labelAge={this.getLocalizedText(Lang.ageLabel)}
                inputValueAge={this.state.age}
                inputAge={txt => this.validateNumber('age', txt)}
                type={this.props.user.role}
                onUpdate={this.actionUpdate}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 4, marginBottom: 12 }}>
              <TouchableOpacity
                  style={{
                    backgroundColor: '#00c3cc',
                    borderRadius: 20,
                    paddingVertical: 10,
                    paddingHorizontal: 32,
                    marginRight: 8,
                    opacity: loading ? 0.7 : 1,
                  }}
                  onPress={this.actionUpdate}
                  disabled={loading}
              >
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                  {loading ? this.getLocalizedText(Lang.updating) : this.getLocalizedText(Lang.updateBtn)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                  style={{
                    backgroundColor: '#bdbdbd',
                    borderRadius: 20,
                    paddingVertical: 10,
                    paddingHorizontal: 32,
                    marginLeft: 8
                  }}
                  onPress={this.handleOpenNotes}
              >
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                  {this.getLocalizedText(Lang.notesBtn)}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          {/*<FabChatbot onPress={() => this.props.navigation.navigate('Chatbot')} />*/}
          {loading && (
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.3)',
              }}>
                <ActivityIndicator size="large" color="#00c3cc" />
                <Text style={{ color: '#fff', marginTop: 10, fontSize: 16 }}>
                  {this.getLocalizedText(Lang.updating)}
                </Text>
              </View>
          )}
        </View>
    );
  }
}

const mapStateToProps = state => ({
  token: state.token,
  user: state.user,
  lang: state.lang,
});

const mapDispatchToProps = dispatch => ({
  addUser: user => dispatch({ type: 'ADD_USERINFO', payload: user }),
  resetUser: () => dispatch({ type: 'RESET_USERINFO' }),
  edit_Lang: data => dispatch({ type: 'EDIT_LANG', payload: data }),
  updatePath: path => dispatch({ type: 'EDIT_PROFILE_PATH', payload: path }),
});

export default connect(mapStateToProps, mapDispatchToProps)(index);