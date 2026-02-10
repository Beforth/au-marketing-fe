/**
 * Login Page with HRMS RBAC Integration
 * Split-screen design: Lottie animation on left (60%), form on right (40%)
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login, selectIsAuthenticated, selectAuthLoading, selectAuthError } from '../store/slices/authSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Lock, User, AlertCircle, Shield, Eye, EyeOff } from 'lucide-react';
import Lottie from 'lottie-react';
import { checkAuthFromStorage } from '../lib/auth-utils';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [animationData, setAnimationData] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const navigate = useNavigate();

  // Load Lottie animation
  useEffect(() => {
    fetch('/animated/login screen.lottie/animations/12345.json')
      .then(response => response.json())
      .then(data => setAnimationData(data))
      .catch(error => console.error('Error loading Lottie animation:', error));
  }, []);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = () => {
      // Check localStorage directly first
      const hasStoredAuth = checkAuthFromStorage();
      
      // If we have stored auth or Redux says we're authenticated, redirect
      if (hasStoredAuth || isAuthenticated) {
        navigate('/', { replace: true });
      } else {
        setIsCheckingAuth(false);
      }
    };

    // Wait for Redux to finish loading
    if (!isLoading) {
      checkAuth();
    } else {
      // If Redux is still loading, check localStorage directly
      const hasStoredAuth = checkAuthFromStorage();
      if (hasStoredAuth) {
        navigate('/', { replace: true });
      } else {
        setIsCheckingAuth(false);
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await dispatch(login({ username, password })).unwrap();
      if (result) {
        navigate('/');
      }
    } catch (err: any) {
      // Error is handled by Redux state
      console.error('Login error:', err);
    }
  };

  // Show loading while checking authentication
  if (isCheckingAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
          <p className="mt-4 text-sm text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Lottie Animation (60%) */}
      <div className="hidden lg:flex lg:w-[60%] items-center justify-center bg-gradient-to-br from-[var(--primary)]/10 via-indigo-50 to-purple-50 p-8">
        <div className="w-full h-full max-w-4xl flex items-center justify-center">
          {animationData ? (
            <Lottie
              animationData={animationData}
              loop={true}
              autoplay={true}
              style={{ width: '100%', height: '100%', maxHeight: '90vh' }}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
            </div>
          )}
        </div>
      </div>

      {/* Right Section - Login Form (40%) */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo/Header */}
          <div className="space-y-2">
            {/* <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--primary)]/10 mb-2">
              <Lock className="w-7 h-7 text-[var(--primary)]" />
            </div> */}
            <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
            <p className="text-sm text-slate-600">Sign in to access the Marketing Portal</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Username
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                icon={<User size={16} />}
                disabled={isLoading}
                autoFocus
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                icon={<Lock size={16} />}
                disabled={isLoading}
                className="h-12"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff size={16} strokeWidth={2} />
                    ) : (
                      <Eye size={16} strokeWidth={2} />
                    )}
                  </button>
                }
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12"
              isLoading={isLoading}
              disabled={isLoading || !username || !password}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Footer */}
          <div className="pt-6 border-t border-slate-200">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Shield size={14} />
              <span>Secured by HRMS RBAC System</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
