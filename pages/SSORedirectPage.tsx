/**
 * SSO Doorway Page  (route: /login-redirect, public — outside ProtectedRoute)
 *
 * The Intranet portal (or another app's app-switcher) redirects the user here:
 *   /login-redirect?sso_token=<one-time token>&user_id=<id>
 *
 * This page is the only public entry point besides /login. It:
 *   1. reads sso_token + user_id from the URL
 *   2. immediately strips them from the address bar (history / referer hygiene)
 *   3. exchanges them for a real session via loginWithSSO
 *   4. sends the user to the app on success, or shows an error with a link to /login
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { loginWithSSO } from '../store/slices/authSlice';
import { AlertCircle, Shield } from 'lucide-react';

export const SSORedirectPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const ranRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get('sso_token');
    const userIdRaw = params.get('user_id');

    // Remove the sensitive params from the URL right away.
    window.history.replaceState({}, document.title, '/login-redirect');

    const userId = userIdRaw ? Number(userIdRaw) : NaN;
    if (!ssoToken || !userIdRaw || Number.isNaN(userId)) {
      setError('This sign-in link is missing information. Please open the app from the portal again.');
      return;
    }

    dispatch(loginWithSSO({ ssoToken, userId }))
      .unwrap()
      .then(() => navigate('/', { replace: true }))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Single sign-on failed. Please sign in with your password.');
      });
  }, [dispatch, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex items-center gap-2 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm text-left">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full h-12 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Go to sign in
          </button>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Shield size={14} />
            <span>Secured by HRMS RBAC System</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <p className="mt-4 text-sm text-slate-600">Signing you in…</p>
      </div>
    </div>
  );
};
