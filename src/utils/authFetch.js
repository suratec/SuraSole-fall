/**
 * authFetch.js
 *
 * Authenticated fetch wrapper with:
 *  - JWT expiry check BEFORE making the request
 *  - Auto-logout when server returns 401 Unauthorized
 *
 * Usage:
 *   import authFetch from '../../utils/authFetch';
 *   const res = await authFetch(url, options, { store, navigation });
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────
// JWT helpers
// ─────────────────────────────────────────────

/**
 * Decode JWT payload without a library.
 * Works for standard base64url-encoded tokens.
 */
const decodeJwtPayload = token => {
  try {
    // JWT = header.payload.signature  (base64url-encoded)
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    // base64url → base64
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Pad to multiple of 4
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

    const jsonStr = global.atob
      ? global.atob(padded)                                   // React Native >= 0.71
      : Buffer.from(padded, 'base64').toString('utf8');       // older fallback

    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
};

/**
 * Returns true when the token is missing or its `exp` claim is in the past.
 * Adds a 30-second buffer so we logout slightly before the real expiry.
 */
export const isTokenExpired = token => {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return false; // no exp claim → treat as non-expiring
  const bufferMs = 30 * 1000; // 30-second safety buffer
  return payload.exp * 1000 < Date.now() + bufferMs;
};

// ─────────────────────────────────────────────
// Logout helper
// ─────────────────────────────────────────────

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
 * Clears all auth-related storage, resets Redux state, and navigates to Auth.
 * Pass the Redux store + navigation ref, or just call it with a custom callback.
 */
export const performLogout = async ({ store, navigation, onLogout } = {}) => {
  try {
    await AsyncStorage.multiRemove(STORAGE_KEYS_TO_CLEAR);
  } catch (e) {
    console.warn('[authFetch] AsyncStorage clear error:', e);
  }

  if (store) {
    store.dispatch({ type: 'RESET_USERINFO' });
  }

  if (onLogout) {
    onLogout();
  } else if (navigation) {
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  }
};

// ─────────────────────────────────────────────
// authFetch
// ─────────────────────────────────────────────

/**
 * @param {string}  url
 * @param {object}  fetchOptions   - standard fetch options (method, headers, body, …)
 * @param {object}  authOptions
 * @param {object}  [authOptions.store]      - Redux store (to dispatch RESET_USERINFO)
 * @param {object}  [authOptions.navigation] - React Navigation ref
 * @param {string}  [authOptions.token]      - JWT token (checked for expiry before call)
 * @param {function}[authOptions.onLogout]   - Custom logout callback (alternative to navigation)
 *
 * @returns {Promise<Response>}
 * @throws  {Error}  with name 'TokenExpiredError' if token is expired before the call
 *                   with name 'UnauthorizedError'  if server returns 401
 */
const authFetch = async (url, fetchOptions = {}, authOptions = {}) => {
  const { store, navigation, token, onLogout } = authOptions;

  // ── 1. Pre-flight: check token expiry ─────────────────────────────────────
  if (token && isTokenExpired(token)) {
    console.warn('[authFetch] Token expired — logging out before request');
    await performLogout({ store, navigation, onLogout });
    const err = new Error('Your session has expired. Please log in again.');
    err.name = 'TokenExpiredError';
    throw err;
  }

  // ── 2. Make the actual request ─────────────────────────────────────────────
  const response = await fetch(url, fetchOptions);

  // ── 3. Handle 401 Unauthorized (token rejected by server) ─────────────────
  if (response.status === 401) {
    console.warn('[authFetch] 401 Unauthorized — logging out');
    await performLogout({ store, navigation, onLogout });
    const err = new Error('Session expired. Please log in again.');
    err.name = 'UnauthorizedError';
    throw err;
  }

  return response;
};

export default authFetch;
