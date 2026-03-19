import React, { Component } from 'react'
import { View , TouchableOpacity} from 'react-native'
import { Card } from '../../common/NativeBaseShim';

import Text from '../../common/TextFix';

export class card_singup extends Component {
    render() {
        return (
            <Card style={{ borderRadius: 12, height: '10%', justifyContent: 'center' }}>

                <View style={{ marginLeft: 17,marginRight: 17 }}>
                    <TouchableOpacity onPress={() => {
                        this.props.navigation.navigate(this.props.name);
                    }}>
                        <Text styles={{ textAlign: 'center' }}>{this.props.labelSignup}</Text>
                    </TouchableOpacity>
                </View>
            </Card>
        )
    }
}

export default card_singup
