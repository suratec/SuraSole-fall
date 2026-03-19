import {createStore, combineReducers} from 'redux';
import {persistStore, persistReducer} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Reducer from './Reducer';

const configureStore = (initialState = {}) => {
  let stat = {};
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
  return {store, persister};
};

export default configureStore;
