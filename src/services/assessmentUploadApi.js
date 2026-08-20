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

async function refreshDashboard(userId) {
  if (!userId) return;

  try {
    await fetchWithTimeout(`${API}member/getUserDashboardStatic`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id: userId}),
    });
    await fetchWithTimeout(`${API}member/get_user_data`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id: userId}),
    });
  } catch (error) {
    // Recording is already safely uploaded. Dashboard refresh can retry separately.
    console.warn('Assessment dashboard refresh failed:', error);
  }
}

async function uploadPendingAssessments(params) {
  if (params.isConnected === false) return {eyes: 0, tenMeter: 0};

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

  if (tenMeter > 0) await refreshDashboard(params.userId);
  return {eyes, tenMeter};
}

export function enqueueAssessmentUploads(params = {}) {
  const nextUpload = assessmentUploadQueue
    .catch(() => undefined)
    .then(() => uploadPendingAssessments(params));

  assessmentUploadQueue = nextUpload.catch(error => {
    console.warn('Assessment upload queue failed:', error);
  });
  return nextUpload;
}
