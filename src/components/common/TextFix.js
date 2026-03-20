import React, {Component} from 'react';
import {Text as TextRN} from 'react-native';

import UI from '../../config/styles/CommonStyles';

export default class Text extends Component {
  render() {
    return (
      <TextRN
        style={[
          {
            fontWeight: this.props.type ? 'bold' : 'normal',
            fontSize: this.props.type ? UI.font_titleSize : UI.font_normalSize,
            color: this.props.textCl ? UI.textWhite : UI.textBlack,
          },
          this.props.styles,
        ]}>
        {this.props.children}
      </TextRN>
    );
  }
}
