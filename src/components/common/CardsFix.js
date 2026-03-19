import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Container, Header, Content, Body, Card, CardItem, Icon, Right } from 'NativeBaseShim';
import UI from '../../config/styles/CommonStyles'
export default class CardsFix extends Component {
    render() {

        let data = this.props.data ? this.props.data : [];
        let fillable = this.props.fillable ? this.props.fillable : [];
        let fillLabel = this.props.fillLabel ? this.props.fillLabel : [];
        let dataItems;

        // dataItems = data.map((el, index) => {
        //     const row = fillable.map((field, index) => {
        //         alert(el[field])
        //         return (

        //             <Card >
        //             <CardItem button onPress={this.props.onPress}>
        //                 <Body>
        //                 <Text style={{ fontWeight: index === 0 ? '400' : '100', fontSize: index === 0 ? 16 : 14 }}>{fillLabel[index]} {el[field]}</Text>
        //                 </Body>
        //                 <Right>
        //                     <TouchableOpacity onPress={this.props.onPress}>
        //                         <Icon name="more" style={{ color: UI.moreIconColor }} />
        //                     </TouchableOpacity>
        //                 </Right>
        //             </CardItem>
        //         </Card>

        //         )
        //     });
        // });

        dataItems = data.map((el, index) => {
            const row = fillable.map((field, index) => {
                if(field === 'id'){
                    return (
                        <Text key={index} style={{ fontWeight: index === 0 ? '400' : '100', fontSize: 8, color: 'black' }}>{fillLabel[index]} {el[field]}</Text>
                    )
                } else {
                    return (
                    <Text key={index} style={{ fontWeight: index === 0 ? '400' : '100', fontSize: index === 0 ? 16 : 14, color: 'black' }}>{fillLabel[index]} {el[field]} {field =='batt' ? '%' : null}</Text>
                    )
                }
            });

            return (
                <View key={index}>
                    <Card>
                        <CardItem button onPress={() => this.props.onPress(el, index)}>
                            <Body>
                                {row}
                            </Body>
                            <Right>
                                <TouchableOpacity onPress={() => this.props.onPress(el, index)}>
                                    <View style={{ flexDirection: 'row' }}>
                                        <Text>{this.props.icon ? 'Connected  ' : ''}</Text>
                                        
                                        <Icon name={this.props.icon ? this.props.icon : 'more'} style={{ color: this.props.icon ? UI.color_Gradient[1] : UI.moreIconColor }} />
                                    </View>
                                </TouchableOpacity>
                            </Right>
                        </CardItem>
                    </Card>
                </View>
            )
        });

        return (
            <View style={{ padding: 10 }}>
                <ScrollView>
                    {dataItems}
                </ScrollView>
            </View>

        );
    }
}