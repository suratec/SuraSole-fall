import React from 'react';
import {StyleSheet, View} from 'react-native';

import ButtonFix from './ButtonFix';

// The recording action has one consistent placement and touch target across
// every screen that records sensor data. Recording behaviour stays owned by
// the calling screen because each test writes different metadata.
export default function RecordStopButton({title, onPress, disabled = false}) {
  return (
    <View style={styles.container} pointerEvents={disabled ? 'none' : 'auto'}>
      <ButtonFix
        action
        rounded
        title={title}
        onPress={onPress}
        styles={disabled ? styles.disabled : undefined}
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
});
