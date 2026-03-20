import { Dimensions } from 'react-native';

// set base mobile device height
const base_unit_height = 812;

// set base mobile device width
const base_unit_width = 375;

const { width, height } = Dimensions.get('window');

class NormalizeSize {
  constructor() {
    this.normalize = this.normalize.bind(this);
  }
  normalize(size) {
    return (size / base_unit_height) * height;
  }
}

module.exports = new NormalizeSize();