import kriging from './kriging';

const left_x = [
  1, 3, 7, 3, 5, 7, 5, 7, 3, 5, 7, 5, 7, 5, 7, 7, 3, 5, 7, 5, 7, 3, 5, 7,
];
const axis_y = [
  3, 3, 3, 7, 7, 7, 11, 11, 13, 13, 13, 15, 15, 17, 17, 19, 21, 21, 21, 23, 23,
  24, 24, 24,
];
const right_x = [
  1.5, 3.5, 5.5, 1.5, 3.5, 5.5, 1.5, 3.5, 1.5, 3.5, 5.5, 1.5, 3.5, 1.5, 3.5,
  1.5, 1.5, 3.5, 5.5, 1.5, 3.5, 1.5, 3.5, 5.5,
];

const n = 8;
const m = 24;

/**
 * Convert raw byte array from BLE characteristic into a decimal array.
 * Note: Assumes big-endian 16-bit integers (2 bytes per sensor).
 */
export function toDecimalArray(byteArray) {
  let dec = [];
  for (let i = 0; i < byteArray.length - 1; i += 2) {
    dec.push(byteArray[i] * 255 + byteArray[i + 1]);
  }
  return dec;
}

/**
 * Calculate pressure based on an exponential formula.
 */
export function calMeasurePressure(value) {
  return 2.206 * Math.exp(0.0068 * value);
}

/**
 * Calculate kilo value.
 */
export function toKilo(value) {
  return (5.6 * Math.pow(10, -4) * Math.exp(value / 53.36) + 6.72) / 0.796;
}

/**
 * Generate 2D array of predicted pressure values for the Left foot
 * using Kriging interpolation (8 sensors).
 */
export function findLeftContourArray(lsensor) {
  const dataleft = [
    1,
    lsensor[1],
    lsensor[0],
    lsensor[4],
    lsensor[3],
    lsensor[2],
    0,
    0,
    lsensor[6],
    0,
    lsensor[5],
    0,
    0,
    0,
    0,
    0,
    0,
    lsensor[7],
    0,
    0,
    0,
    0,
    0,
    0,
  ];
  
  const variogram = kriging.train(
    dataleft,
    left_x,
    axis_y,
    'exponential',
    0,
    100,
  );
  
  const lvalues = new Array(8 * 24);
  for (let j = 0.5, k = 0; j < m; ++j) {
    for (let i = 0.5; i < n; ++i, ++k) {
      lvalues[k] = kriging.predict(i, j, variogram);
      lvalues[k] = lvalues[k] > 0 ? lvalues[k] : 0;
    }
  }
  return lvalues;
}

/**
 * Generate 2D array of predicted pressure values for the Right foot
 * using Kriging interpolation (8 sensors).
 */
export function findRightContourArray(rsensor) {
  const dataright = [
    rsensor[0],
    0,
    rsensor[1],
    rsensor[2],
    rsensor[3],
    rsensor[4],
    0,
    0,
    rsensor[5],
    0,
    rsensor[6],
    0,
    0,
    0,
    0,
    0,
    0,
    rsensor[7],
    0,
    0,
    0,
    0,
    0,
    1,
  ];
  
  const variogram = kriging.train(
    dataright,
    right_x,
    axis_y,
    'exponential',
    0,
    100,
  );
  
  const rvalues = new Array(8 * 24);
  for (let j = 0.5, k = 0; j < m; ++j) {
    for (let i = 0.5; i < n; ++i, ++k) {
      rvalues[k] = kriging.predict(i, j, variogram);
      rvalues[k] = rvalues[k] > 0 ? rvalues[k] : 0;
    }
  }
  return rvalues;
}
