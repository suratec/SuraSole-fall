/**
 * Sensor Data Utilities
 *
 * Extracted from pressuremap/index.js for reuse across components.
 * Provides sensor data conversion, contour array generation, and pressure calculations.
 *
 * Usage:
 *   import { toDecimalArray, findLeftContourArray, findRightContourArray } from '../../utils/sensorUtils';
 */

import kriging from './kriging';

// --- Coordinate constants for 5-sensor insole layout ---

export const left_x = [
  3, 7, 3, 3, 5, 7, 5, 7, 3, 5, 7, 5, 7, 5, 7, 7, 3, 5, 7, 5, 7, 3, 5, 7,
];

export const axis_y = [
  3, 3, 5, 7, 7, 7, 11, 11, 13, 13, 13, 15, 15, 17, 17, 19, 21, 21, 21, 23, 23,
  24, 24, 24,
];

export const right_x = [
  1.5, 5.5, 5.5, 1.5, 3.5, 5.5, 1.5, 3.5, 1.5, 3.5, 5.5, 1.5, 3.5, 1.5, 3.5,
  1.5, 1.5, 3.5, 5.5, 1.5, 3.5, 1.5, 3.5, 5.5,
];

// Grid dimensions
export const GRID_WIDTH = 8;   // n
export const GRID_HEIGHT = 24; // m

// --- BLE byte conversion ---

/**
 * Convert a BLE byte array into an array of decimal values.
 * Each pair of bytes is combined: highByte * 255 + lowByte.
 */
export function toDecimalArray(byteArray) {
  let dec = [];
  for (let i = 0; i < byteArray.length - 1; i += 2) {
    dec.push(byteArray[i] * 255 + byteArray[i + 1]);
  }
  return dec;
}

// --- Contour array generation (Kriging interpolation) ---

/**
 * Build a contour grid for the LEFT foot from 5 sensor values.
 */
export function findLeftContourArray(lsensor) {
  const dataleft = [
    1,
    lsensor[0],
    0,
    lsensor[1],
    0,
    lsensor[2],
    0,
    0,
    lsensor[3],
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    lsensor[4],
    0,
    0,
    0,
    0,
    0,
    0,
  ];
  var variogram = kriging.train(
    dataleft,
    left_x,
    axis_y,
    'exponential',
    0,
    100,
  );
  var lvalues = new Array(GRID_WIDTH * GRID_HEIGHT);
  for (let j = 0.5, k = 0; j < GRID_HEIGHT; ++j) {
    for (let i = 0.5; i < GRID_WIDTH; ++i, ++k) {
      lvalues[k] = kriging.predict(i, j, variogram);
      lvalues[k] = lvalues[k] > 0 ? lvalues[k] : 0;
    }
  }
  return lvalues;
}

/**
 * Build a contour grid for the RIGHT foot from 5 sensor values.
 */
export function findRightContourArray(rsensor) {
  const dataright = [
    rsensor[0],
    0,
    0,
    rsensor[1],
    0,
    rsensor[2],
    0,
    0,
    0,
    0,
    rsensor[3],
    0,
    0,
    0,
    0,
    0,
    0,
    rsensor[4],
    0,
    0,
    0,
    0,
    0,
    1,
  ];
  var variogram = kriging.train(
    dataright,
    right_x,
    axis_y,
    'exponential',
    0,
    100,
  );
  var rvalues = new Array(GRID_WIDTH * GRID_HEIGHT);
  for (let j = 0.5, k = 0; j < GRID_HEIGHT; ++j) {
    for (let i = 0.5; i < GRID_WIDTH; ++i, ++k) {
      rvalues[k] = kriging.predict(i, j, variogram);
      rvalues[k] = rvalues[k] > 0 ? rvalues[k] : 0;
    }
  }
  return rvalues;
}

// --- Pressure calculations ---

/**
 * Calculate measured pressure from a raw sensor value.
 */
export function calMeasurePressure(value) {
  return 2.206 * Math.exp(0.0068 * value);
}

/**
 * Convert raw sensor value to kilograms.
 */
export function toKilo(value) {
  return (5.6 * 10 ** -4 * Math.exp(value / 53.36) + 6.72) / 0.796;
}

/**
 * Check if any sensor reading exceeds the weight-based vibration threshold.
 * @param {number[]} sensor - Array of sensor values
 * @param {number} weightThreshold - User weight * 0.2
 * @returns {boolean}
 */
export function shouldBeVibration(sensor, weightThreshold) {
  for (let i = 0; i < sensor.length; i++) {
    if (toKilo(sensor[i]) > weightThreshold) {
      return true;
    }
  }
  return false;
}
