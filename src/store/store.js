import {configureStore} from '@reduxjs/toolkit';
import {rootReducer} from './reducers';
import {errorLogger} from './logger';

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }).concat(errorLogger),
  devTools: __DEV__,
});

// Function to reset the store
const resetStore = () => {
  store.dispatch({type: 'RESET_STORE'});
};

export {store, resetStore};
