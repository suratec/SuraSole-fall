//5.11.62

import React, { Component } from 'react'
import { Text, View } from 'react-native'
import { connect } from 'react-redux';

import API from '../../../config/Api'
import HeaderFix from '../../common/HeaderFix';
import CardDailydata from './card_dailydata'
import AlertFix from '../../common/AlertsFix'

import Lang from '../../../assets/language/menu/lang_dailydata';
import {getLocalizedText} from '../../../assets/language/langUtils';


class index extends Component {

    state = {
        blood: '',
        breakfast: '',
        lunch: '',
        dinner: '',
        sleep: '',
        id_customer : ''
    }

    actionUpdate = () => {
        if (
            this.state.blood != '' &&
            this.state.breakfast != '' &&
            this.state.lunch != '' &&
            this.state.dinner != '' &&
            this.state.sleep != ''
        ) {

            fetch(`${API}/insert-dailydata`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_customer: this.props.user.id_customer,
                    blood_sugar_levels: this.state.blood,
                    food_breakfast: this.state.breakfast,
                    food_lunch: this.state.lunch,
                    food_dinner: this.state.dinner ,
                    hours_sleep : this.state.sleep ,
                }),
            })
                .then(res => res.json())
                .then(res => {
                    console.log(res)
                    if (res.status == 'บันทึกข้อมูลสำเร็จ' || res.status == 'บันทึกข้อมูลสำเร็จการแพทย์') {
                        //sucsss !
                        AlertFix.alertBasic(getLocalizedText(this.props.lang, Lang.alertSuccessTitle),
                            getLocalizedText(this.props.lang, Lang.alertSuccessBody))
                    } else {
                        //error
                        AlertFix.alertBasic(getLocalizedText(this.props.lang, Lang.alertErrorTitle),
                            getLocalizedText(this.props.lang, Lang.alertErrorBody1));
                    }

                    this.props.navigation.goBack()
                })
                .catch(error => {
                    AlertFix.alertBasic(getLocalizedText(this.props.lang, Lang.alertErrorTitle),
                        getLocalizedText(this.props.lang, Lang.alertErrorBody2));
                });


        } else {
            AlertFix.alertBasic(getLocalizedText(this.props.lang, Lang.alertErrorTitle), 
                getLocalizedText(this.props.lang, Lang.alertErrorBody3))
        }
    }

    validateNumber(key, value){
        var temp = value;
        var value = parseInt(value);
        var data = {};
        console.log(value);
        if(temp == ''){
            console.log('temp')
            data[key] = temp;
            this.setState(data)
        }else if(!isNaN(value)){
            console.log('not NaN')
            data[key] = value.toString();
            this.setState(data)
        }else if(isNaN(value)){
            console.log('isNaN')
            data[key] = (0).toString();
            this.setState(data)
        }
    }

    render() {
        return (
            <View>
                <HeaderFix
                    icon_left={'left'}
                    onpress_left={() => { this.props.navigation.goBack() }}
                    title={this.props.route.params?.['name'] ?? ''}
                />

                <View style={{ padding: 10 }}>

                    <CardDailydata
                        labelCapillaty={getLocalizedText(this.props.lang, Lang.labelCapillary)}
                        inputCapillaty={(txt) => { this.validateNumber('blood', txt) }}
                        capillatyValue={this.state.blood}

                        labelBreakfast={getLocalizedText(this.props.lang, Lang.labelBreakfast)}
                        inputBreakfast={(txt) => { this.setState({ breakfast: txt }) }}

                        labelLunch={getLocalizedText(this.props.lang, Lang.labelLunch)}
                        inputLunch={(txt) => { this.setState({ lunch: txt }) }}

                        labelDinner={getLocalizedText(this.props.lang, Lang.labelDinnner)}
                        inputDinner={(txt) => { this.setState({ dinner: txt }) }}

                        labelSleep={getLocalizedText(this.props.lang, Lang.labelSleep)}
                        inputSleep={(txt) => { this.validateNumber('sleep', txt) }}
                        sleepValue={this.state.sleep}

                        onUpdate={() => this.actionUpdate()}
                    />

                </View>


            </View>
        )
    }
}

const mapStateToProps = state => {
    return {
        user: state.user,
        lang: state.lang
    }
}

export default connect(mapStateToProps)(index);
