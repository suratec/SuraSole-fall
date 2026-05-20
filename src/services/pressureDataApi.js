/**
 * Pressure Data API Service
 *
 * Extracted from pressuremap/index.js (and shared across 15+ components).
 * Handles the upload flow: read cached files → upload → fetch dashboard → cleanup.
 *
 * Usage:
 *   import { uploadRecordingFiles } from '../../services/pressureDataApi';
 *   await uploadRecordingFiles({ isConnected, userId, productNumber, ... });
 */

import API from '../config/Api';

var RNFS = require('react-native-fs');

/**
 * Safely parse a fetch response as JSON.
 * Returns parsed JSON on success, or throws with a descriptive error.
 * Handles cases where the server returns HTML error pages instead of JSON.
 */
async function safeParseJson(response, label = 'API') {
  const raw = await response.text();

  // Check for non-OK HTTP status (e.g. 500, 404)
  if (!response.ok) {
    console.log(`${label} HTTP ${response.status}:`, raw.substring(0, 200));
    throw new Error(`${label} returned HTTP ${response.status}`);
  }

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.log(`${label} raw response:`, raw.substring(0, 200));
    throw new Error(`${label} returned invalid JSON`);
  }
}

/**
 * POST sensor data JSON to the server.
 */
export async function uploadSensorData(content) {
  const response = await fetch(`${API}/addjson`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(content),
  });
  return safeParseJson(response, 'addjson');
}

/**
 * Fetch dashboard static data for a user.
 */
export async function fetchDashboardStatic(userId) {
  console.log('Fetching dashboard for userId:', userId);
  const response = await fetch(`${API}member/getUserDashboardStatic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId }),
  });
  return safeParseJson(response, 'getUserDashboardStatic');
}

/**
 * Fetch user data, optionally merging with dashboard static data.
 */
export async function fetchUserData(userId, dashboardData) {
  const response = await fetch(`${API}member/get_user_data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId, ...dashboardData }),
  });
  return safeParseJson(response, 'get_user_data');
}

/**
 * Process a single cached recording file:
 *  1. Read the file
 *  2. Upload sensor data
 *  3. On success: delete file, fetch dashboard, fetch user data
 */
async function processRecordingFile(filePath, params) {
  const { userId, productNumber, leftDevice, rightDevice, shoeSize } = params;

  const text = await RNFS.readFile(filePath);
  const data = JSON.parse('[' + text.substring(0, text.length - 1) + ']');

  const content = {
    data: data,
    id_customer: data[0].id_customer,
    id_device: '',
    type: 1, // for medical
    product_number: productNumber,
    bluetooth_left_id: leftDevice,
    bluetooth_right_id: rightDevice,
    shoe_size: shoeSize,
  };

  const uploadResp = await uploadSensorData(content);

  if (uploadResp.status !== 'ผิดพลาด') {
    console.log(`Clear : ${filePath}`);
    await RNFS.unlink(filePath);

    // Dashboard & user data fetch — don't let failures affect the upload result
    try {
      console.log('============API Response============');
      const dashboardData = await fetchDashboardStatic(userId);

      console.log('============API Response============');
      const userData = await fetchUserData(userId, dashboardData);
      console.log(userData, 'responseFromAPI');
    } catch (dashErr) {
      // Server may be temporarily down (500) — log but don't crash
      console.log('Dashboard/UserData fetch failed (non-critical):', dashErr.message);
    }
  }
}

/**
 * Main entry point: upload all cached recording files to the server.
 *
 * @param {Object} params
 * @param {boolean} params.isConnected - Whether WiFi is connected
 * @param {string}  params.userId - The customer ID
 * @param {string}  params.productNumber - Product number
 * @param {string}  params.leftDevice - Left BLE device ID
 * @param {string}  params.rightDevice - Right BLE device ID
 * @param {number}  params.shoeSize - Shoe size
 * @param {Function} [params.onError] - Optional error callback (receives error)
 */
export async function uploadRecordingFiles(params) {
  const { isConnected, onError } = params;
  const cachePath = RNFS.CachesDirectoryPath + '/suratechM/';

  try {
    const files = await RNFS.readDir(cachePath);

    if (!isConnected) {
      console.log('WiFi is not connect');
      files.forEach(r => console.log(r.path));
      return;
    }

    for (const file of files) {
      try {
        console.log(file.path);
        await processRecordingFile(file.path, params);
      } catch (err) {
        console.log(err);
        if (onError) onError(err);
      }
    }
  } catch (err) {
    console.log('Error reading cache directory:', err);
    if (onError) onError(err);
  }
}
