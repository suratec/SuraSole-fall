//19-12-2022  backup
//import liraries
import React, { Component, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView, ToastAndroid, ImageBackground, Dimensions, TextInput } from 'react-native';
import { connect } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import ImagePicker from 'react-native-image-crop-picker';
import axios from 'axios';
import HeaderFix from '../../common/HeaderFix';
import UI from '../../../config/styles/CommonStyles';
import Modal from "react-native-modal";
import ViewShot, { captureScreen, captureRef } from 'react-native-view-shot';
import { Dropdown } from 'react-native-element-dropdown';
import Draggable from 'react-native-draggable';
import { Snackbar } from 'react-native-paper';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

// create a component
const Footscreen = ({ user, navigation }) => {

    const viewShotRef = useRef(null);


    const [uri, setUri] = React.useState('');
    const [frontimage, setFrontimage] = React.useState('');
    const [backimage, setBackimage] = React.useState('');
    const [frontobj, setFrontObj] = React.useState('');
    const [backobj, setBackObj] = React.useState('');
    const [isModalVisible, setModalVisible] = useState(false);
    const [isModalVisible2, setModalVisible2] = useState(false);
    const [isModalVisible3, setModalVisible3] = useState(false);
    const [localarr, setLocalArr] = useState([]);

    const [text, setText] = useState('');

    const [active, setActive] = useState('');
    const [visible, setVisible] = useState(false);
    const [visiblesnack, setVisiblesnack] = useState(false);
    const [snackmsg, setSnackmsg] = useState('');
    const [success, setSuccess] = useState(false);


    // const [user, setUser] = React.useState('');

    const generateKey = (pre) => {
        return `${pre}_${new Date().getTime()}`;
    }
    const onDismissSnackBar = () => setVisiblesnack(false);

    const toggleModal = () => {
        setModalVisible(!isModalVisible);
    };
    const toggleModal2 = () => {
        setModalVisible2(!isModalVisible2);
    };

    const toggleModal3 = () => {
        setModalVisible3(!isModalVisible3);
    };


    const saveImg = () => {
        captureRef(viewShotRef, {
            format: 'jpg',

            // Quality 0.0 - 1.0 (only available for jpg)
            // result: 'base64',
        }).then(
            //callback function to get the result URL of the screnshot
            (uri) => {

                console.log(uri, 'uriggg');
                if (active === 'FRONT') {
                    setFrontimage(uri);
                } else if (active === 'BACK') {
                    setBackimage(uri);
                }


            },
            (error) => console.error('Oops, Something Went Wrong', error),
        );
    }


    //   source={frontimage === 'https://api1.suratec.co.th/legphoto/user.png' ? require('../../../assets/image/Front.png') : { uri: frontimage }}

    const modalImg = () => {
        if (active === 'FRONT') {
            return frontimage;
        }
    }


    useEffect(() => {
        getImage();
        // console.log(user);
    }, [])

    const chooseImage = (para) => {
        ImagePicker.openPicker({
            cropping: true,
            freeStyleCropEnabled: true,
            compressImageQuality: 0.5,
            width: 600,
            height: 600,

        })
            .then(image => {
                // setVisible(true)
                setModalVisible(false);
                setModalVisible2(true);

                // console.log(image,'imagegallery');
                // console.log(user,'userff');
                // setFrontimage(image);
                // setUri(image.path);
                // props.onChange?.(image);
                if (para === 'FRONT') {
                    setFrontimage(image.path);
                    setFrontObj(image);
                }
                else if (para === 'BACK') {
                    setBackimage(image.path);
                    setBackObj(image);

                }
            }).catch(err => {
                console.log(err);
            })
        //   .finally(close);
    };

    const openCamera = (para) => {
        ImagePicker.openCamera({
            cropping: true,
            freeStyleCropEnabled: true,
            compressImageQuality: 0.5,
            width: 600,
            height: 600,
            //   compressImageMaxWidth: 800,
        })
            .then(image => {
                // setBackimage(image);
                // setVisible(true)
                setModalVisible(false);
                setModalVisible2(true);

                console.log(image, 'imagecamera');
                // setUri(image.path);
                // props.onChange?.(image);
                if (para === 'FRONT') {
                    setFrontimage(image.path);
                    setFrontObj(image);

                }
                else if (para === 'BACK') {
                    setBackimage(image.path);
                    setBackObj(image);

                }

            }).catch(err => {
                console.log(err);
            })
        //   .finally(close);
    };

    const getImage = () => {
        axios({
            method: 'POST',
            url: 'https://api1.suratec.co.th/member/getUserDetails',
            data: {
                "id": user.id_customer,
                "role": user.role
            },
            headers: {
                // 'Authorization': "Bearer  "  +  YOUR_BEARER_TOKEN,
                'Accept': 'application/json',
                // 'Content-Type': 'multipart/form-data;'    
            }
        }).then(function (response) {
            console.log(response.data, '0000')
            setFrontimage(response.data.messages.front_img);
            setBackimage(response.data.messages.back_img);
        })
            .catch(function (error) {
                // setFrontdefault('');
                // setBackdefault('');
                console.log(error.response);
            });


        // if(frontdefault==='' && backdefault===''){
        //     setFrontimage(frontdefault);
        //     setBackimage(backdefault);
        // }
    }

    const upload = () => {
        setSuccess(false)
        console.log('frontobj------------------');
        if (frontobj === '' && backobj === '') {
            // ToastAndroid.show("please Choose Image", ToastAndroid.SHORT);
            setSnackmsg('please Choose Image');
            setVisiblesnack(true);
        }
        else if (frontobj && !backobj) {
            // ToastAndroid.show("please Choose Back Image", ToastAndroid.SHORT)
            setSnackmsg('please Choose Back Image');
            setVisiblesnack(true);
        }
        else if (!frontobj && backobj) {
            // ToastAndroid.show("please Choose Front Image", ToastAndroid.SHORT)
            setSnackmsg('please Choose Front Image');
            setVisiblesnack(true);

        }
        else if (frontobj && backobj) {
            var photo1 = {
                uri: frontimage,
                type: 'image/jpg',
                name: `${user.fname}f`,
            };
            var photo2 = {
                uri: backimage,
                type: backobj.mime,
                name: `${user.fname}b`,
            };
            //use formdata
            var formData = new FormData();
            //append created photo{} to formdata
            formData.append('front_img', photo1);
            formData.append('id', user.id_customer);
            formData.append('type', user.role);
            formData.append('back_img', photo2);

            //use axios to POST
            axios({
                method: 'POST',
                url: 'https://api1.suratec.co.th/upload-image',
                data: formData,
                headers: {
                    // 'Authorization': "Bearer  "  +  YOUR_BEARER_TOKEN,
                    'Accept': 'application/json',
                    'Content-Type': 'multipart/form-data;'
                }
            }).then(function (response) {
                setSuccess(true);
                setSnackmsg('Uploaded Successfully');
                setVisiblesnack(true);

                console.log(response.data, 'ffff')

            })
                .catch(function (error) {
                    console.log(error.response, 'error')
                });
        }
    }

    return (
        <View style={{
            flex: 1,
            backgroundColor: '#fff',
            // justifyContent: 'center',
        }}>
            <HeaderFix
                icon_left={'left'}
                onpress_left={() => {
                    navigation.goBack();
                }}
                title={
                    // this.props.route.params?.['name'] ?? 'DashBoard'
                    "Foot Photo"
                }
            />
            <ScrollView contentContainerStyle={{
                flex: 1
            }} >
                <View style={{
                    flex: 1,
                    justifyContent: 'space-around',

                }}>

                    <View style={{
                        flex: 0.4,
                        paddingHorizontal: 20,
                        // justifyContent: 'space-between',
                    }}>
                        <Text style={{
                            fontSize: 20,
                            color: 'black',

                        }}>FRONT PHOTO</Text>


                        <TouchableOpacity
                            onPress={() => {
                                setActive('FRONT');
                                toggleModal();
                            }}
                            style={{
                                // justifyContent: 'center',
                                // alignItems: 'center',
                                // borderRadius: 10,
                                borderWidth: 1,
                                borderColor: 'black',
                                borderStyle: 'dashed',
                                padding: 5,
                                alignSelf: 'center',
                                width: 200,
                                height: 200,
                                marginTop: 2,
                                borderRadius: 1,
                            }}>
                            <Image
                                source={frontimage === null
                                    // 'https://api1.suratec.co.th/legphoto/user.png' 
                                    ? require('../../../assets/image/Front.png') : { uri: frontimage }}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                }}
                                resizeMode="stretch"
                            >
                            </Image>
                        </TouchableOpacity>

                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 2,
                            width: '70%',
                            alignSelf: 'center',
                            // width: '50%',
                        }}>

                            <TouchableOpacity style={{}}
                                onPress={() => {
                                    setActive('FRONT');
                                    openCamera("FRONT");
                                }}
                            >
                                <Ionicons
                                    style={{
                                    }} name="camera"
                                    size={30}
                                    color="#000"
                                />
                            </TouchableOpacity>

                            <TouchableOpacity style={{

                            }}
                                onPress={() => {
                                    setActive('FRONT');
                                    chooseImage("FRONT");
                                }}
                            >
                                <AntDesign
                                    style={{
                                    }} name="picture"
                                    size={30}
                                    color="#000"
                                />
                            </TouchableOpacity>


                        </View>




                    </View>

                    <View style={{
                        flex: 0.4,
                        paddingHorizontal: 20,
                        // justifyContent: 'space-between',
                    }}>
                        <Text style={{
                            fontSize: 20,
                            color: 'black',

                        }}>BACK PHOTO</Text>

                        <TouchableOpacity
                            onPress={() => {
                                setActive('BACK');
                                try {
                                    toggleModal();
                                } catch (err) {
                                    console.error(err.messages);
                                }
                            }}
                            style={{
                                borderWidth: 1,
                                borderColor: 'black',
                                borderStyle: 'dashed',
                                padding: 5,
                                alignSelf: 'center',
                                width: 200,
                                height: 200,
                                marginTop: 2,
                                borderRadius: 1,

                            }}>
                            <Image
                                source={backimage === null
                                    // 'https://api1.suratec.co.th/legphoto/user.png' 
                                    ? require('../../../assets/image/Back.png') : { uri: backimage }}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                }}
                                resizeMode="stretch"
                            />
                        </TouchableOpacity>


                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '70%',
                            alignSelf: 'center',
                            marginTop: 2,
                        }}>

                            <TouchableOpacity style={{}}
                                onPress={() => {
                                    setActive('BACK');
                                    openCamera("BACK");
                                }}
                            >
                                <Ionicons
                                    style={{
                                    }} name="camera"
                                    size={30}
                                    color="#000"
                                />
                            </TouchableOpacity>

                            <TouchableOpacity style={{}}
                                onPress={() => {
                                    setActive('BACK');
                                    chooseImage("BACK");
                                }}
                            >
                                <AntDesign
                                    style={{
                                    }} name="picture"
                                    size={30}
                                    color="#000"
                                />
                            </TouchableOpacity>


                        </View>


                    </View>

                    <TouchableOpacity
                        onPress={() => {
                            upload();
                        }}
                        style={{
                            padding: 10,
                            // flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: '#F5FCFF',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: 150,
                            backgroundColor: UI.color_Gradient[1],
                            borderRadius: 75,
                            alignSelf: 'center',
                            bottom: 15
                        }}>
                        <Text style={{
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: 20,
                        }}>
                            UPLOAD
                        </Text>
                    </TouchableOpacity>
                    {/*     
                    <TouchableOpacity onPress={()=>{
                    toggleModal();
                }}>
                    <Text>open</Text>
                </TouchableOpacity>  */}
                    {/* <Text>oodhh</Text> */}


                </View>
            </ScrollView>
            <View style={{
                // flex: 1,
            }}>
                <Modal
                    backdropColor='grey'
                    backdropOpacity={0.9}
                    isVisible={isModalVisible}
                    // onBackdropPress={toggleModal}
                    // onBackButtonPress={toggleModal}
                    style={{
                        // justifyContent: 'center',
                        // backgroundColor: 'pink',
                        height: 900,
                        justifyContent: 'center',

                        // alignItems: 'flex-end',
                    }}
                >
                    <View style={{
                        backgroundColor: 'white',
                        height: windowHeight / 4,
                        justifyContent: 'space-around',
                        alignItems: 'center',
                    }}>

                        <TouchableOpacity style={{}}
                            onPress={() => {
                                openCamera(active);
                            }}
                        >
                            <Text style={styles.textf}>Capture Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={{}}
                            onPress={() => {
                                chooseImage(active);
                            }}
                        >
                            <Text style={styles.textf}>Choose Photo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                toggleModal();
                            }}
                        >
                            <Text style={styles.textf}>Cancel</Text>
                        </TouchableOpacity>

                    </View>
                </Modal>

                <Modal
                    backdropColor='grey'
                    backdropOpacity={0.9}
                    isVisible={isModalVisible2}
                    // onBackdropPress={toggleModal2}
                    // onBackButtonPress={toggleModal2}
                    style={{
                        // justifyContent: 'center',
                        // backgroundColor: 'pink',
                        height: 900,
                        justifyContent: 'center',
                        // alignItems: 'flex-end',
                    }}
                >
                    <View style={{
                        backgroundColor: 'white',
                        height: windowHeight / 2,
                        justifyContent: 'center',
                    }}>
                        <View
                            // onPress={()=>{
                            //     setActive('FRONT');
                            //     toggleModal();
                            // }}
                            style={{
                                // justifyContent: 'center',
                                // alignItems: 'center',
                                // borderRadius: 10,
                                borderWidth: 1,
                                borderColor: 'black',
                                borderStyle: 'dashed',
                                padding: 5,
                                alignSelf: 'center',
                                width: 200,
                                height: 200,
                                marginBottom: 15,
                                borderRadius: 1,
                            }}>
                            <ViewShot
                                ref={viewShotRef}
                            >

                                {
                                    active === 'FRONT' ? (
                                        <ImageBackground
                                            source={frontimage === null
                                                // 'https://api1.suratec.co.th/legphoto/user.png'
                                                ? require('../../../assets/image/Front.png') : { uri: frontimage }}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                // padding: 5,
                                            }}
                                            resizeMode="stretch"
                                        >
                                            {
                                                localarr.map((item, index) => {
                                                    return (
                                                        <View
                                                            key={index}
                                                        // key={generateKey(item)}
                                                        >
                                                            <Draggable
                                                            >
                                                                <Text
                                                                    style={{
                                                                        fontSize: 28,
                                                                        color: 'red',
                                                                    }}>{item}</Text>

                                                            </Draggable>
                                                        </View>

                                                    )
                                                })
                                            }




                                        </ImageBackground>

                                    ) : (
                                        <ImageBackground
                                            source={backimage === null
                                                // 'https://api1.suratec.co.th/legphoto/user.png'
                                                ? require('../../../assets/image/Back.png') : { uri: backimage }}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                            }}
                                            resizeMode="stretch"
                                        >
                                            {
                                                localarr.map((item, index) => {
                                                    return (
                                                        <Draggable
                                                            key={index}
                                                        >
                                                            <Text
                                                                style={{
                                                                    fontSize: 20,
                                                                    color: 'red',
                                                                }}>{item}</Text>

                                                        </Draggable>

                                                    )
                                                })
                                            }
                                        </ImageBackground>

                                    )
                                }
                            </ViewShot>

                        </View>

                        <View style={{
                            flexDirection: 'row',
                            // backgroundColor: 'yellow',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 5,
                            marginBottom: 5,


                        }}>

                            <TextInput
                                autoCapitalize="none"
                                style={{
                                    width: '50%',
                                    fontSize: 16,
                                    fontWeight: '400',
                                    color: 'red',
                                    borderRadius: 5,
                                    marginRight: 24,
                                    backgroundColor: '#BDBDBD',
                                }}
                                onChangeText={e => setText(e)}
                                value={text}
                                keyboardType="default"
                                placeholder="Enter Text"
                                placeholderTextColor={'#fff'}
                            />


                            <TouchableOpacity
                                onPress={() => {
                                    setVisible(true);
                                    localarr.push(text);
                                    setText('');

                                }}
                                style={{
                                    padding: 10,
                                    // flex: 1,
                                    backgroundColor: '#F5FCFF',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    width: 150,
                                    backgroundColor: UI.color_Gradient[1],
                                    borderRadius: 75,
                                    alignSelf: 'center',

                                }}>
                                <Text style={{
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: 20,
                                }}>
                                    Add TEXT
                                </Text>
                            </TouchableOpacity>

                        </View>


                        <TouchableOpacity
                            onPress={() => {
                                saveImg(active)
                                setModalVisible3(true);
                                setModalVisible2(false);

                            }}
                            style={{
                                padding: 10,
                                // flex: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: '#F5FCFF',
                                width: 150,
                                backgroundColor: UI.color_Gradient[1],
                                borderRadius: 75,
                                alignSelf: 'center',

                            }}>
                            <Text style={{
                                color: '#fff',
                                fontWeight: 'bold',
                                fontSize: 20,
                            }}>
                                Save
                            </Text>
                        </TouchableOpacity>

                    </View>
                </Modal>


                <Modal
                    backdropColor='grey'
                    backdropOpacity={0.9}
                    isVisible={isModalVisible3}
                    // onBackdropPress={toggleModal3}
                    // onBackButtonPress={toggleModal3}
                    style={{
                        // justifyContent: 'center',
                        // backgroundColor: 'pink',
                        height: 900,
                        justifyContent: 'center',
                        // alignItems: 'flex-end',
                    }}
                >
                    <View style={{
                        backgroundColor: 'white',
                        height: windowHeight / 4,
                        justifyContent: 'space-around',
                        alignItems: 'center',
                    }}>
                        <Text style={{
                            fontSize: 24,
                            fontWeight: 'bold',

                        }}>Are you Sure ?</Text>

                        <View style={{
                            flexDirection: 'row',
                        }}>
                            <TouchableOpacity
                                style={{
                                    marginRight: 20,
                                }}
                                onPress={() => {
                                    setModalVisible3(false);
                                    setModalVisible2(false);
                                    setLocalArr([]);
                                }}
                            >
                                <Text style={{
                                    fontSize: 20,
                                    fontWeight: 'bold',
                                    color: UI.color_Gradient[1],
                                }}>Yes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    setModalVisible3(false);
                                    setModalVisible2(true);
                                }}
                            >
                                <Text style={{
                                    fontSize: 20,
                                    fontWeight: 'bold',
                                    color: 'red'
                                }}>No</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </Modal>

                <Snackbar
                    style={{
                        backgroundColor: success ? "green" : '#ff0000',
                        color: 'white',
                        fontSize: 20,
                    }}

                    visible={visiblesnack}
                    onDismiss={onDismissSnackBar}
                    duration={3000}
                    action={{
                        // label: 'Undo',
                        onPress: () => {
                            // Do something
                        },
                    }}>
                    {snackmsg}
                </Snackbar>





            </View>
        </View>
    );
};
const mapStateToProps = state => {
    return {
        user: state.user,
        //   data: state.data,
    };
};

const styles = StyleSheet.create({
    textf: {
        fontSize: 20,
        color: 'black',
    },
});
export default connect(mapStateToProps, null)(Footscreen);

// export default Footscreen;

