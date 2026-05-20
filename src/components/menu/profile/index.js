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
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../../../config/Api';

import UI from '../../../config/styles/CommonStyles';

import Lang from '../../../assets/language/menu/lang_profile';
import LanguagePickerFix from '../../common/LanguagePickerFix';
import {getLocalizedText} from '../../../assets/language/langUtils';
import LangModal from './lang_model';

import ImagePicker from 'react-native-image-crop-picker';

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
    img_path: '',
    onModal: false,
    loading: false,
  };

  getImageSource = (img_path, role) => {
    if (!img_path || (typeof img_path === 'string' && (img_path.includes('user.png') || img_path.includes('doctor.png')))) {
      return role === 'mod_employee'
        ? require('../../../assets/image/icons/doctor.png')
        : require('../../../assets/image/icons/user.png');
    }
    return {
      uri: img_path.startsWith('http')
        ? img_path
        : `https://api1.suratec.co.th/pic/${img_path}`,
    };
  };

  // Toggle language selection modal visibility
  toggleModal = () => {
    this.setState({ onModal: !this.state.onModal });
  };

  // Handle language selection
  actionLang = (selectedLang) => {
    this.props.edit_Lang(selectedLang);  // Update the language in Redux
    this.setState({ onModal: false });  // Close the modal after selecting the language
  };

  // Handle Notes navigation
  actionNotes = () => {
    this.props.navigation.navigate('MedicalNotes');
  };

  actionUpdate = () => {
    this.setState({loading: true});
    const body = {
      id: this.state.id,
      fname: this.state.fname,
      lname: this.state.lname,
      age: this.state.age,
      type: this.props.user.role,
      gender: this.state.sex,
      weight: this.state.weigth,
      height: this.state.heigth,
      congenital_disease_flg: '1', // set ไว้รู้จะใส่อะไร
      congenital_disease: 'ความดัน', // set ไว้รู้จะใส่อะไร
      emergency_contract: '150 ถ.ศรีธานี', // set ไว้รู้จะใส่อะไร
    };

    fetch(`${API}/updata-profile`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
        .then(res => res.json())
        .then(res => {
          this.setState({loading: false});
          console.log(res);

          if (res.message == 'บันทึกไม่สำเร็จ') {
            AlertFix.alertBasic(
                getLocalizedText(this.props.lang, Lang.alertErrorTitle),
                getLocalizedText(this.props.lang, Lang.cannotEditAlert),
            );
          } else {
            AlertFix.alertBasic(
                getLocalizedText(this.props.lang, Lang.alertSuccessTitle),
                getLocalizedText(this.props.lang, Lang.successTitleContentAlert),
            );
            let actualUser = res.customer_info;
            actualUser.role = this.props.user.role;
            this.props.addUser({user: actualUser, token: this.props.token});

            this.props.navigation.goBack();
          }
        })
        .catch(error => {
          this.setState({loading: false});
          console.log(error);
        });
  };

  componentDidMount = async () => {
    let user = this.props.user;
    console.log(user, 'userfff');
    this.setState({
      id:
          this.props.user.role == 'mod_employee'
              ? user.id_employee
              : user.id_customer,
      fname: user.fname == null ? '' : user.fname.toString(),
      lname: user.lname == null ? '' : user.lname.toString(),
      sex: user.sex === null ? 0 : parseInt(user.sex),
      heigth: user.height == null ? '0' : user.height.toString(),
      weigth: user.weight == null ? '0' : user.weight.toString(),
      age: user.age == null ? '0' : user.age.toString(),
    });

    let img = this.props.user.image;
    if (this.props.user.image === '' || this.props.user.image === undefined) {
      if (this.props.user.role == 'mod_employee') {
        img = 'doctor.png';
      } else {
        img = 'user.png';
      }
    } else {
      img = this.props.user.image;
    }
    this.setState({img_path: img});
  };

  editprofilePicture = () => {
    this.setState({loading: true});
    console.log('Edit Profile Picture Called');

    // Show action sheet for image source selection
    Alert.alert(
        'Select Image Source',
        'Choose how you want to select your profile picture',
        [
          { text: 'Camera', onPress: () => this.openCamera() },
          { text: 'Gallery', onPress: () => this.openGallery() },
          { text: 'Cancel', style: 'cancel', onPress: () => this.setState({loading: false}) }
        ]
    );
  };

  // Add camera method with cropping
  openCamera = () => {
    ImagePicker.openCamera({
      width: 400,
      height: 400,
      cropping: true,
      cropperCircleOverlay: true, // Circular crop overlay
      cropperStatusBarColor: UI.color_Gradient[1],
      cropperToolbarColor: UI.color_Gradient[1],
      cropperToolbarWidgetColor: '#FFFFFF',
      cropperActiveWidgetColor: UI.color_Gradient[1],
      compressImageQuality: 0.8,
      includeBase64: false,
      mediaType: 'photo',
    }).then(image => {
      this.uploadProfileImage(image.path, image.mime);
    }).catch(error => {
      console.log('Camera Error:', error);
      this.setState({loading: false});
    });
  };

  // Add gallery method with cropping
  openGallery = () => {
    ImagePicker.openPicker({
      width: 400,
      height: 400,
      cropping: true,
      cropperCircleOverlay: true, // Circular crop overlay
      cropperStatusBarColor: UI.color_Gradient[1],
      cropperToolbarColor: UI.color_Gradient[1],
      cropperToolbarWidgetColor: '#FFFFFF',
      cropperActiveWidgetColor: UI.color_Gradient[1],
      compressImageQuality: 0.8,
      includeBase64: false,
      mediaType: 'photo',
    }).then(image => {
      this.uploadProfileImage(image.path, image.mime);
    }).catch(error => {
      console.log('Gallery Error:', error);
      this.setState({loading: false});
    });
  };

  // Add upload method for cropped image
  uploadProfileImage = async (imagePath, mimeType) => {
    const data = new FormData();
    data.append('id', this.state.id);
    data.append('type', this.props.user.role);
    data.append('image', {
      uri: Platform.OS === 'android' ? imagePath : `file://${imagePath}`,
      name: `profile_${Date.now()}.jpg`,
      type: mimeType || 'image/jpeg',
    });

    console.log('Uploading cropped image...');

    try {
      const res = await fetch(`${API}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: data,
      });

      const json = await res.json();
      console.log('Upload Response:', json);

      if (json.status === 'สำเร็จ') {
        let updatedUser = { ...this.props.user, image: json.data };
        this.setState({ img_path: json.data });
        this.props.updatePath(updatedUser);
        AlertFix.alertBasic(
            getLocalizedText(this.props.lang, Lang.alertSuccessTitle),
            getLocalizedText(this.props.lang, Lang.successTitleContentAlert)
        );
      } else {
        AlertFix.alertBasic(
            getLocalizedText(this.props.lang, Lang.alertErrorTitle),
            getLocalizedText(this.props.lang, Lang.cannotEditAlert)
        );
      }
    } catch (err) {
      console.log('Upload Error:', err);
      AlertFix.alertBasic(
          getLocalizedText(this.props.lang, Lang.alertErrorTitle),
          getLocalizedText(this.props.lang, Lang.cannotEditAlert)
      );
    } finally {
      this.setState({ loading: false });
    }
  };

  validateNumber(key, value) {
    var temp = value;
    var value = parseInt(value);
    var data = {};
    console.log(value);
    if (temp == '') {
      console.log('temp');
      data[key] = temp;
      this.setState(data);
    } else if (!isNaN(value)) {
      console.log('not NaN');
      data[key] = value.toString();
      this.setState(data);
    } else if (isNaN(value)) {
      console.log('isNaN');
      data[key] = (0).toString();
      this.setState(data);
    }
  }

  render() {
    const {img_path, loading} = this.state;
    console.log('props.user.image:', this.props.user.image);
    console.log('state.img_path:', this.state.img_path);

    return (
        <ScrollView style={{flex: 1}}>
          <HeaderFix
              icon_left={'left'}
              onpress_left={() => {
                this.props.navigation.goBack();
              }}
              title={getLocalizedText(this.props.lang, Lang.editProfile)}
          />

          <View>
            <TouchableOpacity
                style={{alignItems: 'center', paddingTop: 16}}
                onPress={() => this.editprofilePicture()}>
              <View style={{width: screenWidth, height: screenWidth, padding: 5}}>
                <Image
                    style={{
                      width: screenWidth,
                      height: screenWidth,
                      borderRadius: screenWidth / 2,
                    }}
                    source={this.getImageSource(this.state.img_path, this.props.user.role)}
                    onError={(e) => {
                      console.log('Image failed to load:', e.nativeEvent);
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully');
                    }}
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
                labelFirstName={getLocalizedText(this.props.lang, Lang.firstNamelabel)}
                inputValueFirstName={this.state.fname}
                inputFirstName={txt => {
                  this.setState({fname: txt});
                }}
                labelLastName={getLocalizedText(this.props.lang, Lang.LastNamelabel)}
                inputValueLastName={this.state.lname}
                inputLastName={txt => {
                  this.setState({lname: txt});
                }}
                labelGender={getLocalizedText(this.props.lang, Lang.genderlabel)}
                inputValueGender={this.state.sex}
                inputGender={txt => {
                  this.setState({sex: txt});
                }}
                labelWeigth={getLocalizedText(this.props.lang, Lang.weightLabel)}
                inputValueWeigth={this.state.weigth}
                inputWeigth={txt => {
                  this.validateNumber('weigth', txt);
                }}
                labelHeight={getLocalizedText(this.props.lang, Lang.heigthLabel)}
                inputValueHeight={this.state.heigth}
                inputHeigth={txt => {
                  this.validateNumber('heigth', txt);
                }}
                labelAge={getLocalizedText(this.props.lang, Lang.ageLabel)}
                inputValueAge={this.state.age}
                inputAge={txt => {
                  this.validateNumber('age', txt);
                }}
                labelTel={getLocalizedText(this.props.lang, Lang.emergencyLabel)}
                inputValueTel={this.state.tel}
                inputTel={txt => {
                  this.setState({tel: txt});
                }}
                type={this.props.user.role}
                onUpdate={() => this.actionUpdate()}
                onNote={() => this.actionNotes()}
                loading={loading}
            />

            <LangModal
                title="Select Language"
                modalVisible={this.state.onModal}
                onModalClosed={() => this.setState({ onModal: false })}
                labelBtn="Select"
                onLang={this.toggleModal}
                onSelectLang={this.actionLang}
            />
          </View>
        </ScrollView>
    );
  }
}

const mapStateToProps = state => {
  return {
    token: state.token,
    user: state.user,
    lang: state.lang,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    addUser: user => {
      return dispatch({type: 'ADD_USERINFO', payload: user});
    },
    resetUser: () => {
      return dispatch({type: 'RESET_USERINFO'});
    },
    edit_Lang: data => {
      return dispatch({type: 'EDIT_LANG', payload: data});
    },
    updatePath: path => {
      return dispatch({type: 'EDIT_PROFILE_PATH', payload: path});
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(index);