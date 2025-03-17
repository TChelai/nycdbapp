import { configureStore } from '@reduxjs/toolkit';
import datasetReducer from './datasetSlice';
import authReducer from './authSlice';
import userReducer from './userSlice';

const store = configureStore({
  reducer: {
    datasets: datasetReducer,
    auth: authReducer,
    user: userReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
