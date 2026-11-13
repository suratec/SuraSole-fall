/**
 * setupFetchInterceptor.js
 *
 * Monkey-patches the global `fetch` exactly once at app startup.
 * Any response with HTTP 401 will automatically log the user out.
 *
 * Call this ONCE from Store.js (or index.js) after the Redux store is ready.
 *
 * Usage:
 *   import { setupFetchInterceptor } from './setupFetchInterceptor';
 *   setupFetchInterceptor(store);
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { isTokenExpired } from './authFetch';

let _interceptorInstalled = false;

const STORAGE_KEYS_TO_CLEAR = [
  'token',
  'user',
  'doctor_user',
  'doctor_token',
  'patient_token',
  'patient_id',
  'doctor_username',
  'doctor_password',
  'doctor_left_on_patientlist',
];

/**
 * Internal logout — clears storage + resets Redux.
 * Navigation is handled by the root navigator reacting to Redux state change.
 */
const _doLogout = async store => {
  console.warn('[FetchInterceptor] 401 detected — logging out');
  try {
    await AsyncStorage.multiRemove(STORAGE_KEYS_TO_CLEAR);
  } catch (e) {
    console.warn('[FetchInterceptor] AsyncStorage clear error:', e);
  }
  store.dispatch({ type: 'RESET_USERINFO' });
};

/**
 * Installs the global fetch interceptor.
 * Safe to call multiple times — only installs once.
 *
 * @param {object} store - Redux store
 */
export const setupFetchInterceptor = store => {
  if (_interceptorInstalled) return;
  _interceptorInstalled = true;

  const originalFetch = global.fetch;

  global.fetch = async (url, options = {}) => {
    // ── Pre-flight: check JWT expiry before sending ──────────────────────────
    const state = store.getState();
    const token = state?.token;

    if (token && isTokenExpired(token)) {
      console.warn('[FetchInterceptor] JWT expired before request to', url);
      await _doLogout(store);
      const err = new Error('Session expired. Please log in again.');
      err.name = 'TokenExpiredError';
      throw err;
    }

    // ── Make the actual request ───────────────────────────────────────────────
    const response = await originalFetch(url, options);

    // ── Post-response: check 401 ──────────────────────────────────────────────
    if (response.status === 401) {
      await _doLogout(store);
      const err = new Error('Unauthorized. Please log in again.');
      err.name = 'UnauthorizedError';
      throw err;
    }

    return response;
  };

  console.log('[FetchInterceptor] Global fetch interceptor installed ✅');
};
