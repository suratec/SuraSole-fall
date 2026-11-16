// Shared layout helpers so screens look right on both phones and tablets (iPad / Android tab).
// Phone layouts stay exactly as before (scale = 1); tablets get a centered, capped content
// column and proportionally larger touch targets / text instead of stretched or tiny UI.
import {Dimensions, useWindowDimensions} from 'react-native';

export const TABLET_MIN_SHORT_SIDE = 600;
const MAX_CONTENT_WIDTH = 820;

export function getLayout(win = Dimensions.get('window')) {
  const width = win?.width || 375;
  const height = win?.height || 812;
  const shortSide = Math.min(width, height);
  const isTablet = shortSide >= TABLET_MIN_SHORT_SIDE;

  const contentWidth = isTablet
    ? Math.min(width - 48, MAX_CONTENT_WIDTH)
    : width;

  // Size multiplier for fixed-px elements (icons, images, cards, charts)
  const scale = isTablet ? Math.min(Math.max(contentWidth / 430, 1), 1.6) : 1;
  // Text grows less aggressively than graphics
  const fontScale = isTablet ? Math.min(1 + (scale - 1) * 0.5, 1.3) : 1;

  return {
    width,
    height,
    isTablet,
    contentWidth,
    scale,
    fontScale,
    s: n => Math.round(n * scale),
    fs: n => Math.round(n * fontScale),
    // Style for a centered column that never stretches past MAX_CONTENT_WIDTH
    column: isTablet
      ? {width: '100%', maxWidth: contentWidth, alignSelf: 'center'}
      : {width: '100%'},
  };
}

export function useLayout() {
  const win = useWindowDimensions();
  return getLayout(win);
}

// Tablet-only: scale text and vertical touch padding in a StyleSheet definition.
// Phones get the definition back unchanged, so phone layouts stay exactly as designed.
// Use at module level: const styles = StyleSheet.create(scaleFonts({...})).
// The iPad build is portrait-only (UIRequiresFullScreen), so computing once is safe.
const SCALED_KEYS = ['fontSize', 'lineHeight', 'paddingVertical', 'minHeight'];

// tabletOverrides: extra per-style values merged in on tablets only.
export function scaleFonts(defs, tabletOverrides = {}, L = getLayout()) {
  if (!L.isTablet) {
    return defs;
  }
  const out = {};
  Object.keys(defs).forEach(name => {
    const style = {...defs[name]};
    SCALED_KEYS.forEach(key => {
      if (typeof style[key] === 'number') {
        style[key] = Math.round(style[key] * L.fontScale);
      }
    });
    out[name] = {...style, ...(tabletOverrides[name] || {})};
  });
  return out;
}
