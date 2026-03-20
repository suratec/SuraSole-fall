import React, {Component} from 'react';
import {View} from 'react-native';
import {Card, CardItem, Body} from './NativeBaseShim';
import {Col, Row, Grid} from './NativeBaseShim';
import Text from './TextFix';
import UI from '../../config/styles/CommonStyles';

export default class ScoreFix extends Component {
  render() {
    return (
      <View style={{flex: 1}}>
        <Card style={{backgroundColor: UI.color_buttonConfirm}}>
          <CardItem style={{backgroundColor: UI.color_buttonConfirm}}>
            <Body>
              <Grid>
                <Col size={2} style={{alignItems: 'center'}}>
                  <Text type={'bold'} textCl={true}>
                    {this.props.holder ? this.props.holder : 'Score'}
                  </Text>
                  <Text
                    styles={{
                      color: UI.textWhite,
                      fontSize: 28,
                      fontWeight: 'bold',
                    }}>
                    {this.props.score}
                  </Text>
                </Col>
                <Col style={{alignItems: 'center'}}>
                  <View
                    style={{
                      backgroundColor: UI.textWhite,
                      width: '2%',
                      height: '100%',
                    }}></View>
                </Col>
                <Col size={2} style={{alignItems: 'center'}}>
                  <Text type={'bold'} textCl={true}>
                    Balance
                  </Text>
                  <Text
                    styles={{
                      color: UI.textWhite,
                      fontSize: 28,
                      fontWeight: 'bold',
                    }}>
                    {this.props.status}
                  </Text>
                </Col>
              </Grid>
            </Body>
          </CardItem>
        </Card>
      </View>
    );
  }
}
