import API from '../config/Api';

const RNFS = require('react-native-fs');

export const EYES_CACHE_DIRECTORY = `${RNFS.CachesDirectoryPath}/assessmentEyes`;
export const EYES_FILE_PREFIX = 'assessment-eyes-';
export const TEN_METER_CACHE_DIRECTORY = `${RNFS.CachesDirectoryPath}/assessmentTenMeter`;
export const TEN_METER_FILE_PREFIX = 'ten-meter-walk-';

let assessmentUploadQueue = Promise.resolve();

async function fetchWithTimeout(url, options, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {...options, signal: controller.signal});
  } finally {
    clearTimeout(timeout);
  }
}

async function parseSuccessfulResponse(response, label) {
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`${label} HTTP ${response.status}: ${raw.substring(0, 200)}`);
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error(`${label} returned invalid JSON: ${raw.substring(0, 200)}`);
  }

  if (responseExplicitlyFailed(payload)) {
    throw new Error(`${label} did not confirm success: ${raw.substring(0, 200)}`);
  }

  return payload;
}

function responseConfirmsSuccess(payload) {
  const status = String(payload?.status ?? '').toLowerCase();
  const message = String(payload?.message ?? '').toLowerCase();
  const summary = `${status} ${message}`;

  if (
    summary.includes('ผิดพลาด') ||
    summary.includes('ไม่สำเร็จ') ||
    summary.includes('error') ||
    summary.includes('fail')
  ) {
    return false;
  }

  return Boolean(payload?.status || summary.includes('success') || summary.includes('สำเร็จ'));
}

function responseExplicitlyFailed(payload) {
  const status = String(payload?.status ?? '').toLowerCase();
  const message = String(payload?.message ?? '').toLowerCase();
  const error = String(payload?.error ?? '').toLowerCase();
  const summary = `${status} ${message} ${error}`;

  return (
    payload?.success === false ||
    status === 'false' ||
    summary.includes('error') ||
    summary.includes('fail')
  );
}

async function readRecording(filePath) {
  const raw = (await RNFS.readFile(filePath, 'utf8')).trim().replace(/,\s*$/, '');
  if (!raw) return [];
  return JSON.parse(`[${raw}]`).sort((a, b) => {
    if (a.seq != null && b.seq != null) return a.seq - b.seq;
    return Number(a.stamp || 0) - Number(b.stamp || 0);
  });
}

async function uploadDirectory({directory, prefix, legType, params}) {
  const files = (await RNFS.readDir(directory).catch(() => []))
    .filter(file => file.isFile() && file.name.startsWith(prefix))
    .sort((a, b) => a.name.localeCompare(b.name));
  let uploaded = 0;

  for (const file of files) {
    try {
      const data = await readRecording(file.path);
      if (data.length === 0) continue;

      const firstSample = data[0];
      const sessionId = String(firstSample.session_id || '');
      const persistedLegType = legType || firstSample.leg_type;
      const metadataMatches = data.every(sample =>
        String(sample.session_id || '') === sessionId &&
        (!legType ? sample.leg_type === persistedLegType : true),
      );

      if (
        !sessionId ||
        !metadataMatches ||
        !['SOE', 'SCE', '10MWT'].includes(persistedLegType)
      ) {
        console.warn('Keeping assessment file with invalid metadata:', file.path);
        continue;
      }

      const payload = {
        data,
        id_customer: firstSample.id_customer || params.userId || '',
        session_id: sessionId,
        id_device: '',
        type: 1,
        product_number: firstSample.product_number || params.productNumber || '',
        bluetooth_left_id: firstSample.bluetooth_left_id || params.leftDevice || '',
        bluetooth_right_id: firstSample.bluetooth_right_id || params.rightDevice || '',
        shoe_size: firstSample.shoe_size || params.shoeSize || 0,
        leg_type: persistedLegType,
      };

      // Keep the request observable without logging the complete sensor stream.
      // This is the upload path used by the current Assessment screens.
      const sampleHasLeftSensor = sample => Array.isArray(sample?.left?.sensor);
      const sampleHasRightSensor = sample => Array.isArray(sample?.right?.sensor);
      console.log('[Assessment][addjson] Payload summary:', {
        endpoint: `${API}addjson`,
        method: 'POST',
        fileName: file.name,
        payloadFields: Object.keys(payload),
        sampleFields: Object.keys(firstSample || {}).sort(),
        sampleCount: data.length,
        sessionId: payload.session_id,
        legType: payload.leg_type,
        hasCustomerId: Boolean(payload.id_customer),
        hasProductNumber: Boolean(payload.product_number),
        hasLeftDevice: Boolean(payload.bluetooth_left_id),
        hasRightDevice: Boolean(payload.bluetooth_right_id),
        shoeSize: payload.shoe_size,
        samplesWithLeftSensor: data.filter(sampleHasLeftSensor).length,
        samplesWithRightSensor: data.filter(sampleHasRightSensor).length,
        firstStamp: firstSample?.stamp || null,
        lastStamp: data[data.length - 1]?.stamp || null,
      });

      const response = await fetchWithTimeout(`${API}addjson`, {
        method: 'POST',
        headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });
      const responseText = await response.text();
      if (!response.ok) throw new Error(`addjson HTTP ${response.status}`);

      let responseBody;
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        throw new Error('addjson returned invalid JSON');
      }

      console.log('[Assessment][addjson] Response summary:', {
        httpStatus: response.status,
        status: responseBody?.status,
        message: responseBody?.message,
        responseFields: Object.keys(responseBody || {}).sort(),
      });

      if (!responseConfirmsSuccess(responseBody)) {
        console.warn('Server did not confirm assessment upload; keeping file:', file.path);
        continue;
      }

      await RNFS.unlink(file.path);
      uploaded += 1;
    } catch (error) {
      console.warn('Assessment upload failed; keeping file:', file.path, error);
    }
  }

  return uploaded;
}

export async function refreshAssessmentDashboard(userId) {
  if (!userId) return;

  try {
    // The backend sequence is intentional: calculate the latest metrics,
    // persist them, then let the mobile Dashboard fetch the stored result.
    const calculateUrl = `${API}member/getUserDashboardStatic`;
    const calculateRequest = {id: userId};
    console.log('[Assessment dashboard] Calculate request:', {
      endpoint: calculateUrl,
      method: 'POST',
      body: calculateRequest,
    });
    const calculateResponse = await fetchWithTimeout(calculateUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(calculateRequest),
    });
    const calculatePayload = await parseSuccessfulResponse(
      calculateResponse,
      'getUserDashboardStatic',
    );
    console.log('[Assessment dashboard] Calculate response:', {
      httpStatus: calculateResponse.status,
      status: calculatePayload?.status,
      message: calculatePayload?.message,
      responseFields: Object.keys(calculatePayload || {}).sort(),
      body: calculatePayload,
    });

    const storeUrl = `${API}member/get_user_data`;
    const storeRequest = {...calculatePayload, id: userId};
    console.log('[Assessment dashboard] Store request:', {
      endpoint: storeUrl,
      method: 'POST',
      bodyFields: Object.keys(storeRequest).sort(),
      body: storeRequest,
    });
    const storeResponse = await fetchWithTimeout(storeUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      // get_user_data persists the calculated dashboard fields. Supplying only
      // the customer ID leaves the previous calculated record in place.
      body: JSON.stringify(storeRequest),
    });
    const storePayload = await parseSuccessfulResponse(storeResponse, 'get_user_data');
    console.log('[Assessment dashboard] Store response:', {
      httpStatus: storeResponse.status,
      status: storePayload?.status,
      message: storePayload?.message,
      responseFields: Object.keys(storePayload || {}).sort(),
      body: storePayload,
    });

    console.log('Assessment dashboard calculate/store completed for user:', userId);
    return true;
  } catch (error) {
    // Recording is already safely uploaded. Dashboard refresh can retry separately.
    console.warn('Assessment dashboard refresh failed:', error);
    return false;
  }
}

async function uploadPendingAssessments(params) {
  console.log('[Assessment upload][flow-v2] Checking pending assessment files:', {
    isConnected: params.isConnected,
    hasUserId: Boolean(params.userId),
  });

  if (params.isConnected === false) {
    console.log('[Assessment upload] Skipping upload/calculate/store: device is offline.');
    return {eyes: 0, tenMeter: 0};
  }

  const eyes = await uploadDirectory({
    directory: EYES_CACHE_DIRECTORY,
    prefix: EYES_FILE_PREFIX,
    params,
  });
  const tenMeter = await uploadDirectory({
    directory: TEN_METER_CACHE_DIRECTORY,
    prefix: TEN_METER_FILE_PREFIX,
    legType: '10MWT',
    params,
  });

  const hasFreshAssessmentUpload = eyes > 0 || tenMeter > 0;
  console.log('[Assessment upload] Completed pending-file upload:', {
    eyes,
    tenMeter,
    hasFreshAssessmentUpload,
  });

  const dashboardRefreshed = hasFreshAssessmentUpload
    ? await refreshAssessmentDashboard(params.userId)
    : false;

  if (!hasFreshAssessmentUpload) {
    console.log('[Assessment upload] Skipping Calculate/Store: no new Assessment file was uploaded.');
  }
  return {eyes, tenMeter, dashboardRefreshed};
}

// The calculation/store pair is shared by Assessment and Pressure Map after
// their raw recording has been accepted by addjson.
export const refreshUserDashboard = refreshAssessmentDashboard;

export function enqueueAssessmentUploads(params = {}) {
  const nextUpload = assessmentUploadQueue
    .catch(() => undefined)
    .then(() => uploadPendingAssessments(params));

  assessmentUploadQueue = nextUpload.catch(error => {
    console.warn('Assessment upload queue failed:', error);
  });
  return nextUpload;
}
