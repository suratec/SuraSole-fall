import {createStore} from 'redux';
import {persistStore, persistReducer} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Reducer from './Reducer';
import { setupFetchInterceptor } from './utils/setupFetchInterceptor';

const configureStore = (initialState = {}) => {
  const store = createStore(
    persistReducer(
      {
        key: 'data',
        storage: AsyncStorage,
        timeout: null,
        whitelist: ['lang', 'user', 'token', 'impersonating'],
      },
      Reducer,
    ),
    initialState,
  );
  const persister = persistStore(store, null);

  // Install global fetch interceptor — auto-logout on JWT expiry or 401
  setupFetchInterceptor(store);

  return {store, persister};
};

export default configureStore;

