/**
 * Pressure Data API Service
 *
 * Extracted from pressuremap/index.js (and shared across 15+ components).
 * Handles the upload flow: read cached files → upload → cleanup.
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

function isAddJsonSuccess(payload) {
  const status = String(payload?.status ?? '').toLowerCase();
  const message = String(payload?.message ?? '').toLowerCase();
  const data = String(payload?.data ?? '').toLowerCase();

  return (
    status.includes('success') ||
    status.includes('สำเร็จ') ||
    message.includes('success') ||
    message.includes('สำเร็จ') ||
    data.includes('success') ||
    data.includes('สำเร็จ')
  );
}

function createUploadSummary() {
  return {
    total: 0,
    uploaded: 0,
    deleted: 0,
    kept: 0,
    failed: 0,
    offline: false,
  };
}

/**
 * Process a single cached recording file:
 *  1. Read the file
 *  2. Upload sensor data
 *  3. On success: delete file
 */
async function processRecordingFile(filePath, params) {
  const {
    userId,
    productNumber,
    leftDevice,
    rightDevice,
    shoeSize,
    currentSessionId,
  } = params;
  const text = await RNFS.readFile(filePath);
  let rawText = text.trim();
  if (rawText.endsWith(',')) rawText = rawText.slice(0, -1);

  if (!rawText) {
    console.log('Skipping empty file:', filePath);
    await RNFS.unlink(filePath);
    return 'deleted';
  }

  const data = JSON.parse('[' + rawText + ']');
  if (!Array.isArray(data) || data.length === 0) {
    console.log('No samples in file:', filePath);
    await RNFS.unlink(filePath);
    return 'deleted';
  }

  const firstSample = data[0] || {};

  const content = {
    data: data,
    id_customer: firstSample.id_customer || userId,
    session_id: firstSample.session_id || currentSessionId || Date.now().toString(),
    id_device: '',
    type: 1, // for medical
    product_number: productNumber,
    bluetooth_left_id: leftDevice,
    bluetooth_right_id: rightDevice,
    shoe_size: shoeSize || 0,
  };

  console.log('addjson payload summary', {
    records: data.length,
    id_customer: content.id_customer,
    session_id: content.session_id,
    product_number: content.product_number,
    bluetooth_left_id: content.bluetooth_left_id,
    bluetooth_right_id: content.bluetooth_right_id,
    first_left_sensor: firstSample.left?.sensor,
    first_right_sensor: firstSample.right?.sensor,
  });

  const uploadResp = await uploadSensorData(content);

  if (isAddJsonSuccess(uploadResp)) {
    console.log(`Clear : ${filePath}`);
    await RNFS.unlink(filePath);
    return 'uploaded';
  } else {
    console.warn('addjson did not confirm success; keeping file:', filePath, uploadResp);
    return 'kept';
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
  const summary = createUploadSummary();

  try {
    const files = await RNFS.readDir(cachePath);
    summary.total = files.length;

    if (!isConnected) {
      console.log('WiFi is not connected');
      files.forEach(r => console.log(r.path));
      summary.offline = true;
      summary.kept = files.length;
      return summary;
    }

    for (const file of files) {
      try {
        console.log(file.path);
        const result = await processRecordingFile(file.path, params);
        if (result && Object.prototype.hasOwnProperty.call(summary, result)) {
          summary[result] += 1;
        }
      } catch (err) {
        summary.failed += 1;
        console.log(err);
        if (onError) onError(err);
      }
    }
  } catch (err) {
    const message = String(err?.message || err || '');
    if (message.includes('ENOENT') || message.includes('no such file')) {
      return summary;
    }
    console.log('Error reading cache directory:', err);
    if (onError) onError(err);
  }

  return summary;
}
