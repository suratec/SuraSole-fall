import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, ImageBackground, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderFix from '../../common/HeaderFix';
import CheckBox from '@react-native-community/checkbox';
import { connect } from 'react-redux';
import { Snackbar } from 'react-native-paper';

import ROOT_API, { IMAGE_URL } from '../../../config/Api'
import UI from '../../../config/styles/CommonStyles';
import axios from 'axios';
import Modal from "react-native-modal";

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
const bluecolor = 'blue';
const redcolor = 'red';

const Tryf = ({ user, navigation }) => {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [legData, setLegData] = useState({});
    const [doctorData, setDoctorData] = useState({});
    const [checkDoc, setCheckDoc] = useState(false);
    const [toggleCheckBox1, setToggleCheckBox1] = useState(false)
    const [toggleCheckBox2, setToggleCheckBox2] = useState(false)
    const [toggleCheckBox3, setToggleCheckBox3] = useState(false)
    const [toggleCheckBox4, setToggleCheckBox4] = useState(false)
    const [toggleCheckBox5, setToggleCheckBox5] = useState(false)
    const [toggleCheckBox6, setToggleCheckBox6] = useState(false)
    const [isModalVisible, setModalVisible] = useState(false);
    const [visiblesnack, setVisiblesnack] = useState(false);
    const [snackmsg, setSnackmsg] = useState('');
    const [currentTab, setCurrentTab] = useState(0);
    const returnColor = (id) => {
        if (id === 1) {
            return redcolor;
        } else {
            return bluecolor;
        }
    }
    // 0-blue

    const onDismissSnackBar = () => setVisiblesnack(false);

    const leftval = () => {
        if (toggleCheckBox1) {
            return 1;
        }
        else if (toggleCheckBox2) {
            return 2;
        }
        else if (toggleCheckBox3) {
            return 3;
        }
    }

    const rightval = () => {
        if (toggleCheckBox4) {
            return 1;
        }
        else if (toggleCheckBox5) {
            return 2;
        }
        else if (toggleCheckBox6) {
            return 3;
        }
    }


    const toggleModal = () => {
        setModalVisible(!isModalVisible);
    };

    const submit = async () => {
        toggleModal();
        console.log(username, password);
        await axios({
            method: 'POST',
            url: `${ROOT_API}/check/login`,
            data: {
                "username": username,
                "password": password
            },
            headers: {
                // 'Authorization': "Bearer  "  +  YOUR_BEARER_TOKEN,
                'Accept': 'application/json',
                // 'Content-Type': 'multipart/form-data;'    
            }
        }).then(function (response) {
            console.log(response.data, '0000')
            if (response.data.status === 'ผิดพลาด') {
                setSnackmsg(response.data.message);
                setVisiblesnack(true);
            } else if (response.data.member_info.data_role === 'mod_employee') {
                // setLegData(response.data.data);
                setCheckDoc(true);
                setSnackmsg('Authentication Success');
                setVisiblesnack(true);
                setDoctorData(response.data);
            } else {
                setCheckDoc(false);
                setSnackmsg('You are not allowed to perform this action');
                setVisiblesnack(true);
            }
        })
            .catch(function (error) {
                // setFrontdefault('');
                // setBackdefault('');
                console.log(error.response, 'eeee');
                // setSnackmsg('Error');   
                // setVisiblesnack(true);
                setSnackmsg(error.response.data.message);
                setVisiblesnack(true);
            });
    }

    const monofilamentDetails = async () => {
        // let form = new FormData();
        // form.append('user_id',user.id_customer);
        // form.append('role',user.role);
        await axios({
            method: 'POST',
            url: `${ROOT_API}monofilament`,
            data: {
                "user_id": user.id_customer,
                "role": user.role,
            },
            headers: {
                // 'Authorization': "Bearer  "  +  YOUR_BEARER_TOKEN,
                'Accept': 'application/json',
                // 'Content-Type': 'multipart/form-data;'    
            }
        }).then(function (response) {
            console.log(response.data, '0000')



            setLegData(response.data.messages);

            if (response.data.messages.l_status === '1') {
                setToggleCheckBox1(true);
                setToggleCheckBox2(false);
                setToggleCheckBox3(false);
            }
            else if (response.data.messages.l_status === '2') {
                setToggleCheckBox1(false);
                setToggleCheckBox2(true);
                setToggleCheckBox3(false);
            }
            else if (response.data.messages.l_status === '3') {
                setToggleCheckBox1(false);
                setToggleCheckBox2(false);
                setToggleCheckBox3(true);
            }
            else {
                setToggleCheckBox1(false);
                setToggleCheckBox2(false);
                setToggleCheckBox3(false);
            }

            if (response.data.messages.r_status === '1') {
                setToggleCheckBox4(true);
                setToggleCheckBox5(false);
                setToggleCheckBox6(false);
            }
            else if (response.data.messages.r_status === '2') {
                setToggleCheckBox4(false);
                setToggleCheckBox5(true);
                setToggleCheckBox6(false);
            }
            else if (response.data.messages.r_status === '3') {
                setToggleCheckBox4(false);
                setToggleCheckBox5(false);
                setToggleCheckBox6(true);
            }
            else {
                setToggleCheckBox4(false);
                setToggleCheckBox5(false);
                setToggleCheckBox6(false);
            }


        })
            .catch(function (error) {
                // setFrontdefault('');
                // setBackdefault('');
                console.log(error.response, 'eeee00');
                setLegData({
                    lm1: 0,
                    lm2: 0,
                    lm3: 0,
                    lm4: 0,
                    lm5: 0,
                    lm6: 0,
                    lm7: 0,
                    lm8: 0,
                    lm9: 0,
                    rm1: 0,
                    rm2: 0,
                    rm3: 0,
                    rm4: 0,
                    rm5: 0,
                    rm6: 0,
                    rm7: 0,
                    rm8: 0,
                    rm9: 0,
                })

            });
    }

    const saveDetails = async () => {

        if (!toggleCheckBox1 && !toggleCheckBox2 && !toggleCheckBox3) {
            setSnackmsg('Please select Left leg risk level');
            setVisiblesnack(true);
            return;
        }
        else if (!toggleCheckBox4 && !toggleCheckBox5 && !toggleCheckBox6) {
            setSnackmsg('Please select right leg risk level');
            setVisiblesnack(true);
            return;
        }

        let form = new FormData();
        form.append('lm1', legData.lm1);
        form.append('lm2', legData.lm2);
        form.append('lm3', legData.lm3);
        form.append('lm4', legData.lm4);
        form.append('lm5', legData.lm5);
        form.append('lm6', legData.lm6);
        form.append('lm7', legData.lm7);
        form.append('lm8', legData.lm8);
        form.append('lm9', legData.lm9);
        form.append('rm1', legData.rm1);
        form.append('rm2', legData.rm2);
        form.append('rm3', legData.rm3);
        form.append('rm4', legData.rm4);
        form.append('rm5', legData.rm5);
        form.append('rm6', legData.rm6);
        form.append('rm7', legData.rm7);
        form.append('rm8', legData.rm8);
        form.append('rm9', legData.rm9);

        form.append('doctor_id', doctorData.user_info.id_employee);
        form.append('user_id', user.id_customer);
        form.append('role', 'doctor');
        form.append('l_status', leftval());
        form.append('r_status', rightval());



        // let dataf = {
        //     "lm1": legData.lm1,
        //         "lm2": legData.lm2,
        //         "lm3": legData.lm3,
        //         "lm4": legData.lm4,
        //         "lm5": legData.lm5,
        //         "lm6": legData.lm6,
        //         "lm7": legData.lm7,
        //         "lm8": legData.lm8,
        //         "lm9": legData.lm9,
        //         "rm1": legData.rm1,
        //         "rm2": legData.rm2,
        //         "rm3": legData.rm3,
        //         "rm4": legData.rm4,
        //         "rm5": legData.rm5,
        //         "rm6": legData.rm6,
        //         "rm7": legData.rm7,
        //         "rm8": legData.rm8,
        //         "rm9": legData.rm9,
        //         "doctor_id": doctorData.user_info.id_employee,
        //         "user_id": user.id_customer,
        //         "role":'doctor',
        //         "l_status":leftval(),
        //         "r_status":rightval(),
        // } 

        await axios({
            method: 'POST',
            url: `${ROOT_API}addupdatemonofilament`,
            data: form,
            headers: {
                // 'Authorization': "Bearer  "  +  YOUR_BEARER_TOKEN,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data;'
            }
        }).then(function (response) {
            console.log(response, '0000Saved')
            setSnackmsg("Updated Successfully");
            setVisiblesnack(true);
            // navigation.navigate('Home');
        })
            .catch(function (error) {
                // setFrontdefault('');
                // setBackdefault('');
                console.log(error.response, 'eeeeff');
            });
    }

    useEffect(() => {
        console.log(user, 'userff2')
        monofilamentDetails();
    }, [])

    return (
        <View style={{
            flex: 1,
            // backgroundColor: 'yellow',
        }}>
            <HeaderFix
                icon_left={'left'}
                onpress_left={() => {
                    navigation.goBack();
                }}
                title={
                    // this.props.route.params?.['name'] ?? 'DashBoard'
                    "Monofilament Information"
                }
            />
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                marginTop: 10,
                marginBottom: 10,
            }}>

                <TouchableOpacity
                    onPress={() => {
                        // upload();
                        setCurrentTab(0);
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
                        // backgroundColor: UI.color_Gradient[1],
                        backgroundColor: currentTab === 0 ? '#90A4AE' : UI.color_Gradient[1],
                        borderRadius: 75,
                        alignSelf: 'center',
                        // borderBottomColor: currentTab === 0 ? "green" : 'transparent',
                        // borderBottomWidth: 3,

                    }}>
                    <Text style={{
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: 20,
                    }}>
                        Left
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => {
                        // upload();
                        setCurrentTab(1);

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
                        backgroundColor: currentTab === 1 ? '#90A4AE' : UI.color_Gradient[1],
                        // UI.color_Gradient[1],
                        borderRadius: 75,
                        alignSelf: 'center',
                        // borderBottomColor: currentTab === 1 ? "green" : 'transparent',
                        // borderBottomWidth: 3,

                    }}>
                    <Text style={{
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: 20,
                    }}>
                        Right
                    </Text>
                </TouchableOpacity>
            </View>
            {
                currentTab === 0
                    ?
                    (<>
                        <View style={{
                            // height: windowHeight,
                            // justifyContent: 'space-around',
                            // alignItems: 'center',
                            // backgroundColor:"yellow",
                            // backgroundColor: UI.color_Gradient[1],
                            // flex: 1,
                            // flexWrap: 'wrap',
                            flex: 1,
                            justifyContent: 'space-around',
                            alignItems: 'center',
                        }}>
                            <ImageBackground
                                style={{
                                    // flex: 0.9,
                                    // backgroundColor:"pink",
                                    // width: windowWidth*0.9,
                                    width: 300,
                                    height: 400,
                                    // backgroundColor: 'red',
                                    // alignSelf:'flex-start',
                                    position: 'relative',
                                }}
                                resizeMode={'contain'}
                                source={require('../../../assets/image/Monofilament/left.png')}>

                                <TouchableOpacity
                                    onPress={() => {
                                        const f = legData.lm1 === 0 ? 1 : 0
                                        setLegData({ ...legData, lm1: f });
                                    }}
                                    style={[styles.circlestyle, {
                                        // top: windowHeight*0.04,
                                        // left: windowWidth*0.50,
                                        top: '7%',
                                        left: '56%',
                                        backgroundColor: returnColor(legData.lm1),
                                        // legData.lm1===0 ? bluecolor : redcolor,
                                    }]}>
                                    <Text style={[styles.circletextstyle, {
                                    }]}>{1}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        const f = legData.lm2 === 0 ? 1 : 0
                                        setLegData({ ...legData, lm2: f });
                                    }}
                                    style={[styles.circlestyle, {
                                        // top: windowHeight*0.065,
                                        // left: windowWidth*0.31,
                                        top: '12%',
                                        left: '35%',
                                        backgroundColor: returnColor(legData.lm2),
                                    }]}>
                                    <Text style={{
                                        color: 'white',
                                    }}>{2}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        const f = legData.lm3 === 0 ? 1 : 0
                                        setLegData({ ...legData, lm3: f });
                                    }}
                                    style={[styles.circlestyle, {
                                        // top: windowHeight*0.14,
                                        // left: windowWidth*0.235,
                                        top: '24%',
                                        left: '25.5%',

                                        // top:94,
                                        // left:76,
                                        backgroundColor: returnColor(legData.lm3),

                                    }]}>
                                    <Text style={{
                                        color: 'white',
                                    }}>{3}</Text>
                                </TouchableOpacity>



                                <TouchableOpacity
                                    onPress={() => {
                                        const f = legData.lm4 === 0 ? 1 : 0
                                        setLegData({ ...legData, lm4: f });
                                    }}
                                    style={[styles.circlestyle, {
                                        // top: windowHeight*0.14,
                                        // left: windowWidth*0.55,
                                        top: '24%',
                                        left: '63%',

                                        // backgroundColor : legData.lm4===0 ? bluecolor : redcolor,
                                        backgroundColor: returnColor(legData.lm4),


                                    }]}>
                                    <Text style={{
                                        color: 'white',
                                    }}>{4}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        const f = legData.lm5 === 0 ? 1 : 0
                                        setLegData({ ...legData, lm5: f });
                                    }}
                                    style={[styles.circlestyle, {
                                        // top: windowHeight*0.145,
                                        // left: windowWidth*0.38,
                                        top: '25%',
                                        left: '41%',
                                        // backgroundColor : legData.lm5===0 ? bluecolor : redcolor,
                                        backgroundColor: returnColor(legData.lm5),


                                    }]}>
                                    <Text style={{
                                        color: 'white',
                                    }}>{5}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        const f = legData.lm6 === 0 ? 1 : 0
                                        setLegData({ ...legData, lm6: f });
                                    }}
                                    style={[styles.circlestyle, {
                                        // top: windowHeight*0.205,
                                        // left: windowWidth*0.255,
                                        top: '35%',
                                        left: '28%',
                                        // backgroundColor : legData.lm6===0 ? bluecolor : redcolor,
                                        backgroundColor: returnColor(legData.lm6),


                                    }]}>
                                    <Text style={{
                                        color: 'white',
                                    }}>{6}</Text>
                                </TouchableOpacity>



                                <TouchableOpacity
                                    onPress={() => {
                                        const f = legData.lm7 === 0 ? 1 : 0
                                        setLegData({ ...legData, lm7: f });
                                    }}
                                    style={[styles.circlestyle, {
                                        // top: windowHeight*0.29,
                                        // left: windowWidth*0.55,
                                        top: '50%',
                                        left: '63%',


                                        // backgroundColor : legData.lm7===0 ? bluecolor : redcolor,
                                        backgroundColor: returnColor(legData.lm7),
                                    }]}>
                                    <Text style={{
                                        color: 'white',
                                    }}>{7}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        const f = legData.lm8 === 0 ? 1 : 0
                                        setLegData({ ...legData, lm8: f });
                                    }}
                                    style={[styles.circlestyle, {
                                        // top: windowHeight*0.33,
                                        // left: windowWidth*0.33,
                                        top: '55.5%',
                                        left: '36%',
                                        // backgroundColor : legData.lm8===0 ? bluecolor : redcolor,
                                        backgroundColor: returnColor(legData.lm8),


                                    }]}>
                                    <Text style={{
                                        color: 'white',
                                    }}>{8}</Text>
                                </TouchableOpacity>


                                <TouchableOpacity
                                    onPress={() => {
                                        const f = legData.lm9 === 0 ? 1 : 0
                                        setLegData({ ...legData, lm9: f });
                                    }}
                                    style={[styles.circlestyle, {
                                        // top: windowHeight*0.495,
                                        // left: windowWidth*0.48,
                                        top: '83.5%',
                                        left: '54%',
                                        // backgroundColor : legData.lm9===0 ? bluecolor : redcolor,
                                        backgroundColor: returnColor(legData.lm9),


                                    }]}>
                                    <Text style={{
                                        color: 'white',
                                    }}>{9}</Text>
                                </TouchableOpacity>

                            </ImageBackground>

                            <Text style={{
                                color: 'black',
                                fontSize: 20,
                                fontWeight: '700',
                                alignSelf: 'center',
                                marginVertical: 4,
                            }}>
                                Injury risk
                            </Text>

                            <View style={{
                                width: windowWidth,
                                // height: windowHeight*0.8,
                                // marginTop:2,
                                // marginBottom:2,
                                flexDirection: 'row',
                                justifyContent: 'space-around',

                                // alignItems:''
                                // backgroundColor:'yellow',
                                alignSelf: 'center',
                            }}>

                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}>
                                    <CheckBox
                                        // tintColor={UI.color_Gradient[1]}
                                        style={styles.checkBoxStyle}

                                        tintColors={{
                                            true: UI.color_Gradient[1],

                                        }}
                                        disabled={false}
                                        value={toggleCheckBox1}
                                        onValueChange={(newValue) => {
                                            setToggleCheckBox1(newValue)
                                            setToggleCheckBox2(false)
                                            setToggleCheckBox3(false)
                                        }}
                                    />
                                    <Text style={styles.checkBoxtext}>Low</Text>
                                </View>

                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}>
                                    <CheckBox
                                        disabled={false}
                                        style={styles.checkBoxStyle}

                                        tintColors={{
                                            true: UI.color_Gradient[1],

                                        }}
                                        value={toggleCheckBox2}
                                        onValueChange={(newValue) => {
                                            setToggleCheckBox2(newValue)
                                            setToggleCheckBox1(false)
                                            setToggleCheckBox3(false)
                                        }}
                                    />
                                    <Text style={styles.checkBoxtext}>Medium</Text>
                                </View>

                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}>
                                    <CheckBox
                                        disabled={false}
                                        style={styles.checkBoxStyle}

                                        tintColors={{
                                            true: UI.color_Gradient[1],

                                        }}
                                        value={toggleCheckBox3}
                                        onValueChange={(newValue) => {
                                            setToggleCheckBox3(newValue)
                                            setToggleCheckBox1(false)
                                            setToggleCheckBox2(false)
                                        }}
                                    />
                                    <Text style={styles.checkBoxtext}
                                    >High</Text>
                                </View>


                            </View>



                        </View>


                    </>

                    )
                    : (
                        <>

                            <View style={{
                                // height: windowHeight,
                                // justifyContent: 'center',
                                // justifyContent: 'space-around',

                                // alignItems: 'center',
                                // flex: 1,
                                // backgroundColor:"yellow",
                                // backgroundColor: UI.color_Gradient[1],
                                flex: 1,
                                justifyContent: 'space-around',
                                alignItems: 'center',
                            }}>
                                <ImageBackground
                                    style={{
                                        // backgroundColor:"yellow",
                                        // flex: 0.9,

                                        // width: windowWidth*0.9,
                                        // height: windowHeight*0.8,
                                        // backgroundColor: 'red',
                                        // alignSelf:'flex-start',
                                        position: 'relative',
                                        width: 300,
                                        height: 400,
                                    }}
                                    resizeMode={'contain'}
                                    source={require('../../../assets/image/Monofilament/rightf.png')}>

                                    <TouchableOpacity
                                        onPress={() => {
                                            const f = legData.rm1 === 0 ? 1 : 0
                                            setLegData({ ...legData, rm1: f });
                                        }}
                                        style={[styles.circlestyle, {
                                            // top: windowHeight*0.05,
                                            // left: windowWidth*0.33,
                                            top: '7%',
                                            left: '36%',
                                            // backgroundColor : legData.rm1===0 ? bluecolor : redcolor,
                                            backgroundColor: returnColor(legData.rm1),

                                        }]}>
                                        <Text style={[styles.circletextstyle, {
                                        }]}>{1}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => {
                                            const f = legData.rm2 === 0 ? 1 : 0
                                            setLegData({ ...legData, rm2: f });
                                        }}
                                        style={[styles.circlestyle, {
                                            // top: windowHeight*0.07,
                                            // left: windowWidth*0.502,
                                            top: '10.5%',
                                            left: '56%',
                                            // backgroundColor : legData.rm2===0 ? bluecolor : redcolor,
                                            backgroundColor: returnColor(legData.rm2),


                                        }]}>
                                        <Text style={[styles.circletextstyle, {
                                        }]}>{2}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => {
                                            const f = legData.rm3 === 0 ? 1 : 0
                                            setLegData({ ...legData, rm3: f });
                                        }}
                                        style={[styles.circlestyle, {
                                            // top: windowHeight*0.14,
                                            // left: windowWidth*0.559,
                                            top: '23.5%',
                                            left: '64.5%',
                                            // backgroundColor : legData.rm3===0 ? bluecolor : redcolor,
                                            backgroundColor: returnColor(legData.rm3),


                                        }]}>
                                        <Text style={[styles.circletextstyle, {
                                        }]}>{3}</Text>
                                    </TouchableOpacity>



                                    <TouchableOpacity
                                        onPress={() => {
                                            const f = legData.rm4 === 0 ? 1 : 0
                                            setLegData({ ...legData, rm4: f });
                                        }}
                                        style={[styles.circlestyle, {
                                            // top: windowHeight*0.15,
                                            // left: windowWidth*0.275,
                                            top: '24.5%',
                                            left: '30.5%',
                                            // backgroundColor : legData.rm4===0 ? bluecolor : redcolor,
                                            backgroundColor: returnColor(legData.rm4),


                                        }]}>
                                        <Text style={[styles.circletextstyle, {
                                        }]}>{4}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => {
                                            const f = legData.rm5 === 0 ? 1 : 0
                                            setLegData({ ...legData, rm5: f });
                                        }}
                                        style={[styles.circlestyle, {
                                            // top: windowHeight*0.15,
                                            // left: windowWidth*0.45,
                                            top: '25%',
                                            left: '51%',
                                            // backgroundColor : legData.rm5===0 ? bluecolor : redcolor,
                                            backgroundColor: returnColor(legData.rm5),


                                        }]}>
                                        <Text style={[styles.circletextstyle, {
                                        }]}>{5}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => {
                                            const f = legData.rm6 === 0 ? 1 : 0
                                            setLegData({ ...legData, rm6: f });
                                        }}
                                        style={[styles.circlestyle, {
                                            // top: windowHeight*0.21,
                                            // left: windowWidth*0.57,
                                            top: '34.5%',
                                            left: '62.5%',
                                            // backgroundColor : legData.rm6===0 ? bluecolor : redcolor,
                                            backgroundColor: returnColor(legData.rm6),


                                        }]}>
                                        <Text style={[styles.circletextstyle, {
                                        }]}>{6}</Text>
                                    </TouchableOpacity>


                                    <TouchableOpacity
                                        onPress={() => {
                                            const f = legData.rm7 === 0 ? 1 : 0
                                            setLegData({ ...legData, rm7: f });
                                        }}
                                        style={[styles.circlestyle, {
                                            // top: windowHeight*0.31,
                                            // left: windowWidth*0.295,
                                            top: '50%',
                                            left: '32.5%',
                                            // backgroundColor : legData.rm7===0 ? bluecolor : redcolor,
                                            backgroundColor: returnColor(legData.rm7),


                                        }]}>
                                        <Text style={[styles.circletextstyle, {
                                        }]}>{7}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => {
                                            const f = legData.rm8 === 0 ? 1 : 0
                                            setLegData({ ...legData, rm8: f });
                                        }}
                                        style={[styles.circlestyle, {
                                            // top: windowHeight*0.34,
                                            // left: windowWidth*0.49,
                                            top: '55%',
                                            left: '58%',
                                            // backgroundColor : legData.rm8===0 ? bluecolor : redcolor,
                                            backgroundColor: returnColor(legData.rm8),


                                        }]}>
                                        <Text style={[styles.circletextstyle, {
                                        }]}>{8}</Text>
                                    </TouchableOpacity>


                                    <TouchableOpacity
                                        onPress={() => {
                                            const f = legData.rm9 === 0 ? 1 : 0
                                            setLegData({ ...legData, rm9: f });
                                        }}
                                        style={[styles.circlestyle, {
                                            // top: windowHeight*0.505,
                                            // left: windowWidth*0.38,
                                            top: '85%',
                                            left: '42%',
                                            // backgroundColor : legData.rm9===0 ? bluecolor : redcolor,
                                            backgroundColor: returnColor(legData.rm9),


                                        }]}>
                                        <Text style={{
                                            color: 'white',
                                        }}>{9}</Text>
                                    </TouchableOpacity>



                                </ImageBackground>


                                <Text style={{
                                    color: 'black',
                                    fontSize: 20,
                                    fontWeight: '700',
                                    alignSelf: 'center',
                                }}>
                                    Injury risk
                                </Text>

                                <View style={{
                                    width: windowWidth,
                                    marginTop: 2,

                                    // height: windowHeight*0.8,
                                    flexDirection: 'row',
                                    justifyContent: 'space-around',

                                    // alignItems:''
                                    // backgroundColor:'yellow',
                                    alignSelf: 'center',
                                }}>

                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}>
                                        <CheckBox
                                            style={styles.checkBoxStyle}
                                            tintColors={{
                                                true: UI.color_Gradient[1],

                                            }}
                                            disabled={false}
                                            value={toggleCheckBox4}
                                            onValueChange={(newValue) => {
                                                setToggleCheckBox4(newValue)
                                                setToggleCheckBox5(false)
                                                setToggleCheckBox6(false)

                                            }}
                                        />
                                        <Text style={styles.checkBoxtext}>Low</Text>
                                    </View>

                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}>
                                        <CheckBox
                                            style={styles.checkBoxStyle}
                                            tintColors={{
                                                true: UI.color_Gradient[1],

                                            }}
                                            disabled={false}
                                            value={toggleCheckBox5}
                                            onValueChange={(newValue) => {
                                                setToggleCheckBox5(newValue)
                                                setToggleCheckBox4(false)
                                                setToggleCheckBox6(false)
                                            }}
                                        />
                                        <Text style={styles.checkBoxtext}>Medium</Text>
                                    </View>

                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}>
                                        <CheckBox
                                            style={styles.checkBoxStyle}
                                            tintColors={{
                                                true: UI.color_Gradient[1],

                                            }}
                                            disabled={false}
                                            value={toggleCheckBox6}
                                            onValueChange={(newValue) => {
                                                setToggleCheckBox6(newValue)
                                                setToggleCheckBox4(false)
                                                setToggleCheckBox5(false)
                                            }}
                                        />
                                        <Text style={styles.checkBoxtext}>High</Text>
                                    </View>


                                </View>


                            </View>
                        </>
                    )
            }

            <TouchableOpacity
                onPress={() => {
                    // navigation.navigate('SignIn')
                    if (checkDoc) {
                        saveDetails()
                    }
                    else {
                        toggleModal()
                    }
                }}
                // disabled={checkDoc}
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
                    marginTop: 5,
                    marginBottom: 30,

                }}>
                <Text style={{
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: 20,
                }}>
                    {/* Update */}
                    {
                        checkDoc ? 'Save' : 'Update'
                    }
                </Text>
            </TouchableOpacity>

            <Modal
                backdropColor='grey'
                backdropOpacity={0.9}
                isVisible={isModalVisible}
                onBackdropPress={toggleModal}
                onBackButtonPress={toggleModal}
                style={{
                    // justifyContent: 'center',
                    // backgroundColor: 'pink',
                    // height: 900,
                    justifyContent: 'center',
                    // alignItems: 'flex-end',
                }}
            >
                <View style={{
                    backgroundColor: 'white',
                    // height: windowHeight / 2.5,
                    height: 350,
                    justifyContent: 'space-evenly',
                    alignItems: 'center',
                    borderRadius: 20,
                }}>
                    <Text style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: 'black',
                    }}>Doctor Login</Text>

                    <TextInput
                        autoCapitalize="none"
                        style={{
                            paddingLeft: 24,
                            paddingRight: 50,
                            width: '80%',
                            // fontFamily:"OpenSans-Regular",
                            fontSize: 16,
                            fontWeight: '400',
                            backgroundColor: '#E0E0E0',
                            borderRadius: 5,
                            marginBottom: 0,
                            height: 40
                        }}
                        onChangeText={e => setUsername(e)}
                        value={username}
                        keyboardType="default"
                        placeholder="Enter your username"
                        placeholderTextColor={'grey'}
                    />
                    <TextInput
                        autoCapitalize="none"
                        style={{
                            paddingLeft: 24,
                            paddingRight: 50,
                            width: '80%',
                            // fontFamily:"OpenSans-Regular",
                            fontSize: 16,
                            fontWeight: '400',
                            // backgroundColor: 'grey',
                            backgroundColor: '#E0E0E0',
                            borderRadius: 5,
                            marginBottom: 20,
                            height: 40
                        }}
                        onChangeText={e => setPassword(e)}
                        value={password}
                        keyboardType="default"
                        secureTextEntry={true}
                        placeholder="Enter your password"
                        placeholderTextColor={'grey'}
                    />
                    <TouchableOpacity
                        onPress={() => {
                            // upload();
                            // setCurrentTab(0);
                            submit()
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
                        }}>
                        <Text style={{
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: 20,
                        }}>
                            Submit
                        </Text>
                    </TouchableOpacity>


                </View>
            </Modal>

            <Snackbar
                style={{
                    // backgroundColor: success?"green": '#ff0000',
                    color: 'white',
                    fontSize: 20,
                }}

                visible={visiblesnack}
                onDismiss={onDismissSnackBar}
                duration={2000}
                action={{
                    // label: 'Undo',
                    onPress: () => {
                        // Do something
                    },
                }}>
                {snackmsg}
            </Snackbar>


            {/* <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
            }}>

                {

                    data.map((item, index) => {
                        return (

                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: 30,
                                height: 30,
                                borderRadius: 15,
                                backgroundColor: 'red',
                            }}>
                                <Text style={{
                                    color: 'white',
                                }}>{item.id}</Text>
                            </View>
                        )
                    })


                }

                


            </View> */}











        </View>
    );
};

const mapStateToProps = state => {
    return {
        user: state.user,
        //   data: state.data,
    };
};


export default connect(mapStateToProps, null)(Tryf);

const styles = StyleSheet.create({
    circlestyle: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'red',
        // alignSelf: 'center',
        position: 'absolute',
    },
    circletextstyle: {
        color: 'white',
    },
    checkBoxStyle: {
        marginRight: 5,
        // transform: 
        // [{ scaleX: 1.5 }, { scaleY: 1.5 }] 
    },
    checkBoxtext: {
        color: 'black',
        fontSize: 18,
        fontWeight: 'bold',
    }
});
