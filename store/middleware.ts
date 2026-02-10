/**
 * Redux Middleware for handling token expiration
 */
import { Middleware } from '@reduxjs/toolkit';
import { tokenExpired } from './slices/authSlice';

export const authMiddleware: Middleware = (store) => (next) => (action: unknown) => {
  // Listen for token expiration events from API client
  if (typeof action === 'object' && action !== null && 'type' in action && (action as { type: string }).type === 'auth/tokenExpired') {
    store.dispatch(tokenExpired());
  }
  
  return next(action);
};
