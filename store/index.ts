/**
 * Redux Store Configuration
 */
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { authMiddleware } from './middleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/login/fulfilled', 'auth/loadFromStorage'],
      },
    }).concat(authMiddleware),
});

// Listen for token expiration events
if (typeof window !== 'undefined') {
  window.addEventListener('auth:token-expired', () => {
    store.dispatch({ type: 'auth/tokenExpired' });
  });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
