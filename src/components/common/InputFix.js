import React, { Component } from 'react';
import { View } from 'react-native';
import { Item, Input, Icon } from './NativeBaseShim';

export default class InputFix extends Component {
    render() {
        return (
            <View style={[{ padding: 5} ,  this.props.styleView ]}>
                {this.props.rounded ? 
                
                <Item rounded>
                    {this.props.Icon ? <Icon name={this.props.Icon } /> : null}
                    <Input
                        style={{height:45}}
                        keyboardType = {this.props.type === 'number' ? 'number-pad' : 'default'}
                        secureTextEntry={this.props.secure === true ? this.props.secure: false}
                        value={this.props.value ? this.props.value : null}
                        onSubmitEditing={this.props.onSubmitEditing}
                        onChangeText={this.props.onChangeText}
                        disabled={this.props.disabled}
                        placeholder={this.props.placeholder ? this.props.placeholder : ''}
                    />
                </Item>
                
                :

                <Item>
                    {this.props.Icon ? <Icon name={this.props.Icon } /> : null}
                    <Input
                    style={{height:45}}
                    secureTextEntry={this.props.secure === false ? this.props.secure: true}
                    value={this.props.value ? this.props.value : null}
                    onSubmitEditing={this.props.onSubmitEditing}
                    disabled={this.props.disabled}
                    onChangeText={this.props.onChangeText}
                    placeholder={this.props.placeholder ? this.props.placeholder : ''} />
                </Item>


                }
                
            </View>
        )
    }
}
