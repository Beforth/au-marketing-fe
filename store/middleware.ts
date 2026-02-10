/**
 * Redux Middleware for handling token expiration
 */
import { Middleware } from '@reduxjs/toolkit';
import { tokenExpired } from './slices/authSlice';

export const authMiddleware: Middleware = (store) => (next) => (action) => {
  // Listen for token expiration events from API client
  if (action.type === 'auth/tokenExpired') {
    store.dispatch(tokenExpired());
  }
  
  return next(action);
};
