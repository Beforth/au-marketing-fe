import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import {
  User,
  Bell,
  Shield,
  Globe,
  Monitor,
  Mail,
  Loader2,
  RefreshCw,
  Link2,
  Unlink,
} from 'lucide-react';
import { useApp } from '../App';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { useTheme, Density } from '../context/ThemeContext';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { refreshUserInfo, selectUser, selectEmployee } from '../store/slices/authSlice';
import { marketingAPI } from '../lib/marketing-api';

type SettingsTab = 'Profile' | 'Security' | 'Notifications' | 'Display' | 'Integrations';

export const SettingsPage: React.FC = () => {
  const { showToast } = useApp();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAppSelector(selectUser);
  const employee = useAppSelector(selectEmployee);
  const { density, setDensity } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('Profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshingPermissions, setIsRefreshingPermissions] = useState(false);
  const [emailConnection, setEmailConnection] = useState<{ connected: boolean; email?: string } | null>(null);
  const [emailConnectionLoading, setEmailConnectionLoading] = useState(false);
  const [connectEmailLoading, setConnectEmailLoading] = useState(false);
  const [disconnectEmailLoading, setDisconnectEmailLoading] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<{ times_per_day: number; preferred_times: string } | null>(null);
  const [notifPrefsLoading, setNotifPrefsLoading] = useState(false);
  const [notifPrefsSaving, setNotifPrefsSaving] = useState(false);

  // Profile display from cached auth (no profile API call for basic info)
  const displayName = employee
    ? `${employee.first_name} ${employee.last_name}`.trim()
    : user
      ? `${user.first_name} ${user.last_name}`.trim() || user.username
      : 'User';
  const displayEmail = (user?.email || employee?.email || '').trim();
  const displayRole = employee?.designation || employee?.department || user?.username || '';

  // Handle redirect after Google OAuth callback
  useEffect(() => {
    const connected = searchParams.get('email_connected');
    const message = searchParams.get('message');
    if (connected === 'success') {
      showToast('Email connected successfully. You can send emails from your account.', 'success');
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('email_connected');
        next.delete('message');
        return next;
      });
      setEmailConnection({ connected: true });
      setEmailConnectionLoading(false);
    } else if (connected === 'error') {
      const msg =
        message === 'redirect_uri_mismatch'
          ? 'Redirect URI mismatch: add your callback URL in Google Cloud Console and set BACKEND_PUBLIC_URL if using Docker.'
          : message === 'exchange_failed'
            ? 'Token exchange failed. Check that the callback URL in Google Console matches exactly (e.g. http://localhost:8003/api/auth/email/callback).'
            : 'Email connection failed.';
      showToast(msg, 'error');
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('email_connected');
        next.delete('message');
        return next;
      });
      setEmailConnectionLoading(false);
    }
  }, [searchParams, showToast, setSearchParams]);

  // Load email connection status when Profile tab is active
  useEffect(() => {
    if (activeTab !== 'Profile') return;
    setEmailConnectionLoading(true);
    marketingAPI
      .getEmailConnection()
      .then(setEmailConnection)
      .catch(() => setEmailConnection({ connected: false }))
      .finally(() => setEmailConnectionLoading(false));
  }, [activeTab]);

  // Load notification preferences when Notifications tab is active
  useEffect(() => {
    if (activeTab !== 'Notifications') return;
    setNotifPrefsLoading(true);
    marketingAPI
      .getNotificationPreferences()
      .then((p) => setNotifPrefs({
        times_per_day: p.times_per_day ?? 3,
        preferred_times: p.preferred_times || '09:00,14:00,18:00',
      }))
      .catch(() => setNotifPrefs({ times_per_day: 3, preferred_times: '09:00,14:00,18:00' }))
      .finally(() => setNotifPrefsLoading(false));
  }, [activeTab]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast(`${activeTab} preferences updated`, 'success');
    }, 800);
  };

  const handleConnectEmail = async () => {
    setConnectEmailLoading(true);
    try {
      const { url } = await marketingAPI.getEmailAuthorizeUrl();
      window.location.href = url;
    } catch (err: any) {
      showToast(err.message || 'Could not start email connection', 'error');
      setConnectEmailLoading(false);
    }
  };

  const handleDisconnectEmail = async () => {
    setDisconnectEmailLoading(true);
    try {
      await marketingAPI.disconnectEmail();
      setEmailConnection({ connected: false });
      showToast('Email disconnected', 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not disconnect email', 'error');
    } finally {
      setDisconnectEmailLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Notifications':
        return (
          <div className="space-y-6">
            <p className="text-xs text-slate-500">Control how often you get follow-up reminders (e.g. 1–3 times per day) and at what times.</p>
            {notifPrefsLoading ? (
              <p className="text-sm text-slate-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading…</p>
            ) : notifPrefs ? (
              <>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Reminders per day</p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNotifPrefs((p) => p ? { ...p, times_per_day: n } : p)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${notifPrefs.times_per_day === n ? 'bg-[var(--primary)] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Preferred times (HH:MM, comma-separated)</p>
                  <input
                    type="text"
                    value={notifPrefs.preferred_times}
                    onChange={(e) => setNotifPrefs((p) => p ? { ...p, preferred_times: e.target.value } : p)}
                    placeholder="09:00,14:00,18:00"
                    className="w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Use 24-hour format. Up to 3 times; only the first N (from “Reminders per day”) are used.</p>
                </div>
                <Button
                  size="sm"
                  disabled={notifPrefsSaving}
                  onClick={async () => {
                    setNotifPrefsSaving(true);
                    try {
                      await marketingAPI.updateNotificationPreferences({
                        times_per_day: notifPrefs.times_per_day,
                        preferred_times: notifPrefs.preferred_times || undefined,
                      });
                      showToast('Notification preferences saved', 'success');
                    } catch (err: any) {
                      showToast(err?.message || 'Failed to save', 'error');
                    } finally {
                      setNotifPrefsSaving(false);
                    }
                  }}
                >
                  {notifPrefsSaving ? 'Saving…' : 'Save notification preferences'}
                </Button>
              </>
            ) : null}
          </div>
        );

      case 'Display':
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interface Density</p>
              <div className="flex gap-2">
                {(['compact', 'default', 'relaxed'] as Density[]).map(d => (
                  <Button
                    key={d}
                    variant={density === d ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setDensity(d)}
                    className="flex-1 rounded-xl"
                  >
                    {d}
                  </Button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 italic">Density affects global component padding and whitespace.</p>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-900">Visual Aesthetic</p>
              <p className="text-xs text-slate-400 mt-1">Dark mode has been disabled in favor of the legacy professional light interface.</p>
            </div>
          </div>
        );

      case 'Profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-slate-200 flex items-center justify-center ring-4 ring-slate-50">
                <User size={36} className="text-slate-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{displayName}</h4>
                <p className="text-xs text-slate-400 font-medium">{displayRole}{displayEmail ? ` • ${displayEmail}` : ''}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Profile info is loaded from your session and cleared on logout. No need to call the profile API repeatedly.</p>

            <div className="pt-6 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Connect your email</p>
              <p className="text-xs text-slate-500 mb-3">Link your Gmail so you can send emails from your own account (e.g. for leads). Uses credentials configured on the server.</p>
              {emailConnectionLoading ? (
                <p className="text-sm text-slate-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Checking…</p>
              ) : emailConnection?.connected && emailConnection?.email ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-slate-700 flex items-center gap-1.5">
                    <Mail size={14} /> Connected as <strong>{emailConnection.email}</strong>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnectEmail}
                    disabled={disconnectEmailLoading}
                    leftIcon={disconnectEmailLoading ? <Loader2 size={14} className="animate-spin" /> : <Unlink size={14} />}
                  >
                    {disconnectEmailLoading ? 'Disconnecting…' : 'Disconnect'}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleConnectEmail}
                  disabled={connectEmailLoading}
                  leftIcon={connectEmailLoading ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                >
                  {connectEmailLoading ? 'Redirecting…' : 'Connect email (Gmail)'}
                </Button>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Permissions</p>
              <p className="text-xs text-slate-500 mb-3">User info and permissions are cached. If an admin updated your permissions in HRMS, refresh to load the latest.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setIsRefreshingPermissions(true);
                  try {
                    const result = await dispatch(refreshUserInfo()).unwrap();
                    if (result) {
                      showToast('Permissions refreshed from HRMS', 'success');
                    } else {
                      showToast('Could not refresh; token may be invalid', 'error');
                    }
                  } catch {
                    showToast('Failed to refresh permissions', 'error');
                  } finally {
                    setIsRefreshingPermissions(false);
                  }
                }}
                disabled={isRefreshingPermissions}
                leftIcon={isRefreshingPermissions ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              >
                {isRefreshingPermissions ? 'Refreshing…' : 'Refresh permissions'}
              </Button>
            </div>
          </div>
        );

      default:
        return <div className="py-20 text-center text-slate-400 text-sm">Module coming soon in the next update.</div>;
    }
  };

  const tabs: { label: SettingsTab; icon: any }[] = [
    { label: 'Profile', icon: User },
    { label: 'Display', icon: Monitor },
    { label: 'Security', icon: Shield },
    { label: 'Notifications', icon: Bell },
    { label: 'Integrations', icon: Globe },
  ];

  return (
    <PageLayout
      title="Account Configuration"
      description="Fine-tune your environment and identity. Profile is cached and cleared on logout."
    >

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="space-y-1">
          {tabs.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === item.label ? 'bg-[var(--primary-muted)] text-[var(--primary)] shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </aside>

        <div className="md:col-span-3">
          <Card
            title={activeTab}
            description="Manage your global system and account preferences."
          >
            <div className="space-y-6">
              {renderContent()}
              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <Button
                  onClick={handleSave}
                  isLoading={isSaving}
                  size="sm"
                  className="min-w-[120px]"
                >
                  Apply Settings
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};
