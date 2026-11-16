/**
 * Keep iOS text at the designed size, the same as on Android.
 *
 * Layouts are designed for the default size. With a larger iOS "Text Size"
 * setting, text renders wider than the space React Native measured for it, so
 * menu labels and names get cut off mid-letter, and screens no longer match
 * the Android app. MAX_FONT_SIZE_MULTIPLIER 1 ignores the setting; raise it
 * (e.g. 1.2) to let larger system text through again.
 *
 * Android is left unchanged. Must be imported before any screen, so it is the
 * first import in index.js. A Text with its own maxFontSizeMultiplier keeps it.
 */
import React from 'react';
import {Platform} from 'react-native';

const MAX_FONT_SIZE_MULTIPLIER = 1;

if (Platform.OS === 'ios') {
  const TextModule = require('react-native/Libraries/Text/Text');
  const OriginalText = TextModule.default;

  const CappedText = React.forwardRef((props, ref) =>
    React.createElement(OriginalText, {
      maxFontSizeMultiplier: MAX_FONT_SIZE_MULTIPLIER,
      ...props,
      ref,
    }),
  );
  CappedText.displayName = 'Text';

  TextModule.default = CappedText;
}
