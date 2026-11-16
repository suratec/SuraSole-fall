import React from 'react';
import {StyleSheet, View} from 'react-native';

import ButtonFix from './ButtonFix';
import {getLayout} from '../../utils/responsive';

// The recording action has one consistent placement and touch target across
// every screen that records sensor data. Recording behaviour stays owned by
// the calling screen because each test writes different metadata.
export default function RecordStopButton({title, onPress, disabled = false}) {
  // Tablet: a larger touch target and label; phones keep the original button.
  const L = getLayout();
  const buttonStyle = L.isTablet
    ? [styles.tabletButton, disabled ? styles.disabled : null]
    : disabled
    ? styles.disabled
    : undefined;
  const textStyle = L.isTablet ? {fontSize: L.fs(16), fontWeight: '600'} : undefined;
  return (
    <View style={styles.container} pointerEvents={disabled ? 'none' : 'auto'}>
      <ButtonFix
        action
        rounded
        title={title}
        onPress={onPress}
        styles={buttonStyle}
        textStyle={textStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  disabled: {
    backgroundColor: '#9CA3AF',
  },
  tabletButton: {
    minWidth: 240,
    height: 64,
  },
});
