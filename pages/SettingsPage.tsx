import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Eye,
  User,
  Bell,
  Shield,
  Globe,
  Monitor,
  Mail,
  RefreshCw,
  Link2,
  Unlink,
  History,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Fingerprint,
  Settings,
  Users,
  Tag,
} from 'lucide-react';
import { useApp } from '../App';
import { VersionsSettings } from '../components/ui/VersionsSettings';
import { PageLayout } from '../components/layout/PageLayout';
import { DataTable, Column } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Label,
  Badge,
  Separator,
  Switch,
  Breadcrumb,
  BreadcrumbItem,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  SegmentToggle,
} from '../UI';
import { Select } from '../components/ui/Select';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { refreshUserInfo, selectUser, selectEmployee, selectHasPermission } from '../store/slices/authSlice';
import { marketingAPI, AuditLog, MarketingEmployee, MarketingSettingsPayload } from '../lib/marketing-api';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type SettingsTab = 'Profile' | 'Audit Logs' | 'Versions' | 'Visibility';

export const SettingsPage: React.FC = () => {
  const { showToast } = useApp();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAppSelector(selectUser);
  const employee = useAppSelector(selectEmployee);

  const [activeTab, setActiveTab] = useState<SettingsTab>('Profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshingPermissions, setIsRefreshingPermissions] = useState(false);
  const [emailConnection, setEmailConnection] = useState<{ connected: boolean; email?: string } | null>(null);
  const [emailConnectionLoading, setEmailConnectionLoading] = useState(false);
  const [connectEmailLoading, setConnectEmailLoading] = useState(false);
  const [disconnectEmailLoading, setDisconnectEmailLoading] = useState(false);
  const [isSyncingHRMS, setIsSyncingHRMS] = useState(false);
  const [syncResults, setSyncResults] = useState<{
    employees: MarketingEmployee[];
    created: number;
    updated: number;
    synced: number;
  } | null>(null);
  const [syncResultsOpen, setSyncResultsOpen] = useState(true);
  const canSyncHRMS = useAppSelector(selectHasPermission('marketing.admin'));

  // Visibility settings state
  const [visibilityUsers, setVisibilityUsers] = useState<MarketingEmployee[]>([]);
  const [visibilityAssignments, setVisibilityAssignments] = useState<{ quarter: string; user_ids: number[] }[]>([]);
  const [visibilitySelectedUserIds, setVisibilitySelectedUserIds] = useState<number[]>([]);
  const [visibilitySearch, setVisibilitySearch] = useState('');
  const [visibilityQuarter, setVisibilityQuarter] = useState('Q1');
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [visibilitySaving, setVisibilitySaving] = useState(false);
  const canManageVisibility = useAppSelector(selectHasPermission('marketing.admin'));

  // Audit Logs state
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsPageSize, setLogsPageSize] = useState(25);
  const [logsSearch, setLogsSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const canViewAuditLogs = useAppSelector(selectHasPermission('marketing.admin')) || useAppSelector(selectHasPermission('marketing.view_reports'));

  const auditLogColumns = React.useMemo<Column<AuditLog>[]>(() => [
    {
      key: 'created_at',
      label: 'Date & Time',
      width: 140,
      render: (log) => (
        <div>
          <div className="text-[10px] font-mono text-slate-400 tracking-tighter uppercase leading-none mb-1">
            {new Date(log.created_at).toLocaleDateString('en-GB')}
          </div>
          <div className="text-xs font-semibold text-slate-700 leading-none">
            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      )
    },
    {
      key: 'employee_name',
      label: 'User',
      width: 200,
      render: (log) => {
        const name = log.employee_name || 'System';
        const initial = name.slice(0, 1).toUpperCase();
        return (
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
              {initial}
            </div>
            <span className="text-xs font-semibold text-slate-800 truncate max-w-[150px] leading-tight" title={name}>
              {name}
            </span>
          </div>
        );
      }
    },
    {
      key: 'action',
      label: 'Action',
      width: 100,
      align: 'center',
      render: (log) => {
        const action = log.action?.toLowerCase() || '';
        const isDanger = action.includes('delete') || action.includes('remove');
        const isSuccess = action.includes('create') || action.includes('add') || action.includes('won') || action.includes('convert');
        return (
          <span className={cn(
            "inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border",
            isDanger ? "bg-rose-50 text-rose-700 border-rose-200" :
            isSuccess ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
            "bg-blue-50 text-blue-700 border-blue-200"
          )}>
            {log.action}
          </span>
        );
      }
    },
    {
      key: 'details',
      label: 'Log Details',
      render: (log) => {
        const entityLabel = log.entity_type ? log.entity_type.split('_').join(' ') : 'System';
        return (
          <div className="flex items-start gap-2 max-w-full">
            <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[9px] font-bold uppercase tracking-wider mt-0.5">
              {entityLabel}
            </span>
            <span 
              className="text-xs text-slate-600 font-medium leading-normal break-words whitespace-normal" 
              title={log.details || ''}
            >
              {log.details || `ID: ${log.entity_id || 'n/a'}`}
            </span>
          </div>
        );
      }
    }
  ], []);

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
      setSearchParams((prev: URLSearchParams) => {
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
      setSearchParams((prev: URLSearchParams) => {
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



  // Debounce search term to prevent excessive API requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(logsSearch);
      setLogsPage(1);
    }, 450);

    return () => {
      clearTimeout(handler);
    };
  }, [logsSearch]);

  // Load audit logs when tab is active or pagination/search changes
  useEffect(() => {
    if (activeTab !== 'Audit Logs') return;
    setLogsLoading(true);
    marketingAPI.getAuditLogs({ 
      page: logsPage, 
      page_size: logsPageSize,
      search: debouncedSearch || undefined
    })
      .then(res => {
        setLogs(res.items || []);
        setLogsTotal(res.total || 0);
      })
      .catch(() => {
        setLogs([]);
        setLogsTotal(0);
      })
      .finally(() => setLogsLoading(false));
  }, [activeTab, logsPage, logsPageSize, debouncedSearch]);

  // Load visibility data when tab is active
  useEffect(() => {
    if (activeTab !== 'Visibility' || !canManageVisibility) return;
    setVisibilityLoading(true);
    Promise.all([
      marketingAPI.getLocalEmployees({ is_active: true, page_size: 200 }).catch((err: any) => {
        showToast(err?.message || 'Failed to load users', 'error');
        return { items: [] };
      }),
      marketingAPI.getMarketingSettings().catch((err: any) => {
        showToast(err?.message || 'Failed to load visibility settings', 'error');
        return null;
      }),
    ])
      .then(([empRes, settings]) => {
        setVisibilityUsers((empRes as any)?.items || []);
        const access = (settings as any)?.past_quarter_access || [];
        setVisibilityAssignments(access);
      })
      .finally(() => setVisibilityLoading(false));
  }, [activeTab, canManageVisibility]);

  const handleSaveVisibility = async () => {
    setVisibilitySaving(true);
    try {
      const settings = await marketingAPI.getMarketingSettings();
      await marketingAPI.updateMarketingSettings({
        ...settings,
        past_quarter_access: visibilityAssignments,
      });
      window.dispatchEvent(new CustomEvent('marketing:settings-version-changed'));
      showToast('Visibility settings updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save visibility settings', 'error');
    } finally {
      setVisibilitySaving(false);
    }
  };

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
    const sectionLabelStyle = "text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2 before:h-px before:flex-1 before:bg-slate-100 after:h-px after:flex-1 after:bg-slate-100";
    
    switch (activeTab) {
      case 'Profile':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header Section */}
            <div className="flex items-start gap-8">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden group">
                  {employee?.first_name ? (
                    <span className="text-2xl font-semibold uppercase tracking-widest text-slate-400">{employee.first_name[0]}{employee.last_name[0]}</span>
                  ) : (
                    <User size={40} />
                  )}
                  <button className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-widest">
                    Update
                  </button>
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Full Name</Label>
                    <div className="text-sm font-semibold text-slate-900">{displayName || '—'}</div>
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Email Address</Label>
                    <div className="text-sm font-semibold text-slate-900">{displayEmail || '—'}</div>
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Designation</Label>
                    <div className="text-sm font-semibold text-slate-900">{displayRole || '—'}</div>
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Status</Label>
                    <div className="flex items-center gap-1.5">
                       <div className="size-1.5 rounded-full bg-emerald-500" />
                       <span className="text-xs text-emerald-600">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 -mx-4 md:-mx-6 lg:-mx-8" />

            {/* Connections Section */}
            <div className="space-y-5 pt-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-tight text-slate-900">Integrations</h4>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200">
                    <Globe size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-tight text-slate-900">Gmail Account</div>
                    <div className="text-sm font-semibold text-slate-400">Connect to send automated follow-up emails.</div>
                  </div>
                </div>
                
                {emailConnectionLoading ? (
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-slate-300" />
                ) : emailConnection?.connected ? (
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                       <div className="text-xs text-emerald-600">Authenticated</div>
                       <div className="text-xs font-semibold text-slate-400">{emailConnection.email}</div>
                    </div>
                    <Button variant="outline" size="xs" onClick={handleDisconnectEmail} isLoading={disconnectEmailLoading} className="h-8 px-3 border-slate-200">
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button variant="secondary" size="sm" onClick={handleConnectEmail} isLoading={connectEmailLoading} className="h-8 text-xs px-4 font-semibold rounded-lg">
                    Connect Account
                  </Button>
                )}
              </div>

              {canSyncHRMS && (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200">
                      <Users size={18} />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-tight text-slate-900">HRMS Employees</div>
                      <div className="text-sm font-semibold text-slate-400">Refresh employee metadata for marketing team members.</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-dashed text-slate-500 hover:text-blue-600 hover:border-blue-200 font-semibold uppercase tracking-wide text-xs"
                    onClick={async () => {
                      setIsSyncingHRMS(true);
                      setSyncResults(null);
                      try {
                        const result = await marketingAPI.syncEmployeesFromHRMS();
                        setSyncResults({
                          employees: result.employees ?? [],
                          created: result.created,
                          updated: result.updated,
                          synced: result.synced,
                        });
                        setSyncResultsOpen(true);
                        showToast(`Synced ${result.synced} employees (${result.created} new, ${result.updated} updated)`, 'success');
                      } catch (err: any) {
                        showToast(err.message || 'HRMS sync failed', 'error');
                      } finally {
                        setIsSyncingHRMS(false);
                      }
                    }}
                    isLoading={isSyncingHRMS}
                    leftIcon={<RefreshCw size={14} />}
                  >
                    Sync Employees
                  </Button>
                </div>
              )}

              {syncResults && syncResults.employees.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden mt-2">
                  <button
                    onClick={() => setSyncResultsOpen(!syncResultsOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-tight text-slate-700">
                      Synced Employees ({syncResults.employees.length})
                    </span>
                    {syncResultsOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </button>
                  {syncResultsOpen && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-200">
                            <th className="text-left px-4 py-2 font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                            <th className="text-left px-4 py-2 font-bold text-slate-500 uppercase tracking-wider">Role</th>
                            <th className="text-left px-4 py-2 font-bold text-slate-500 uppercase tracking-wider">Domain / Region</th>
                          </tr>
                        </thead>
                        <tbody>
                          {syncResults.employees.map((emp) => (
                            <tr key={emp.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                              <td className="px-4 py-2 text-slate-900 font-semibold">
                                {`${emp.first_name} ${emp.last_name}`.trim() || emp.email || emp.username || `ID ${emp.hrms_employee_id}`}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-widest border ${
                                  emp.role === 'domain_head' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  emp.role === 'domain_coordinator' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                  emp.role === 'region_head' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  emp.role === 'region_coordinator' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                  'bg-slate-50 text-slate-600 border-slate-200'
                                }`}>
                                  {emp.role ? emp.role.replace('_', ' ') : '—'}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-slate-500">
                                {[emp.domain_name, emp.region_name].filter(Boolean).join(' / ') || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="px-4 py-2 bg-slate-50/50 border-t border-slate-200 text-[10px] font-semibold text-slate-400 text-right">
                    {syncResults.created} new &middot; {syncResults.updated} updated &middot; {syncResults.synced} total
                  </div>
                </div>
              )}
            </div>



            {/* Sync Section */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-tight text-slate-900">Permissions Sync</div>
                <div className="text-sm font-semibold text-slate-400">Force refresh your access tokens and permissions.</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-dashed text-slate-500 hover:text-blue-600 hover:border-blue-200 font-semibold uppercase tracking-wide text-xs"
                onClick={async () => {
                   setIsRefreshingPermissions(true);
                   try {
                     const result = await dispatch(refreshUserInfo()).unwrap();
                     if (result) showToast('Sync complete', 'success');
                   } finally {
                     setIsRefreshingPermissions(false);
                   }
                }}
                isLoading={isRefreshingPermissions}
                leftIcon={<RefreshCw size={14} />}
              >
                Clear Cache
              </Button>
            </div>

            <div className="pt-6 flex justify-end gap-3">
               <Button variant="ghost" size="sm" onClick={() => setActiveTab('Profile')} className="text-xs font-semibold text-slate-400">Reset</Button>
               <Button onClick={handleSave} isLoading={isSaving} size="sm" className="px-8 text-xs uppercase font-semibold tracking-wide">Save Changes</Button>
            </div>
          </div>
        );

      case 'Audit Logs':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3">
              <SearchInput
                placeholder="Filter by user, action, entity or details..."
                value={logsSearch}
                onChange={(e) => setLogsSearch(e.target.value)}
                onClear={() => setLogsSearch('')}
                containerClassName="max-w-md shadow-none"
                inputSize="sm"
              />
            </div>

            <DataTable<AuditLog>
              bordered={true}
              data={logs}
              rowKey={(l) => l.id}
              dense={true}
              isLoading={logsLoading}
              columns={auditLogColumns}
            />

            <div className="border-t border-slate-100 pt-3">
              <Pagination
                page={logsPage}
                pageSize={logsPageSize}
                total={logsTotal}
                totalPages={Math.ceil(logsTotal / logsPageSize)}
                onPageChange={setLogsPage}
                onPageSizeChange={(sz) => {
                  setLogsPageSize(sz);
                  setLogsPage(1);
                }}
                pageSizeOptions={[10, 20, 25, 50, 100]}
              />
            </div>
          </div>
        );

      case 'Versions':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <VersionsSettings />
          </div>
        );

      case 'Visibility':
        if (!canManageVisibility) {
          return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 mb-4 border border-slate-200">
                <Eye size={26} />
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Access Restricted</p>
              <p className="text-sm text-slate-400 mt-2 max-w-xs">You don't have permission to manage visibility settings. Contact an administrator for access.</p>
            </div>
          );
        }
        const filteredVisibilityUsers = visibilityUsers.filter((u) => {
          if (!visibilitySearch.trim()) return true;
          const q = visibilitySearch.toLowerCase();
          return [u.first_name, u.last_name, u.email, u.username].filter(Boolean).some((f) => f!.toLowerCase().includes(q));
        });
        const currentMonth = new Date().getMonth() + 1;
        const currentQ = currentMonth >= 4 && currentMonth <= 6 ? 1
          : currentMonth >= 7 && currentMonth <= 9 ? 2
          : currentMonth >= 10 && currentMonth <= 12 ? 3 : 4;
        const quarterOpts = [
          { value: 'Q1', label: `Q1 (Apr-Jun)${1 === currentQ ? ' — Now' : ''}`, disabled: currentQ <= 1 },
          { value: 'Q2', label: `Q2 (Jul-Sep)${2 === currentQ ? ' — Now' : ''}`, disabled: currentQ <= 2 },
          { value: 'Q3', label: `Q3 (Oct-Dec)${3 === currentQ ? ' — Now' : ''}`, disabled: currentQ <= 3 },
          { value: 'Q4', label: `Q4 (Jan-Mar)${4 === currentQ ? ' — Now' : ''}`, disabled: currentQ <= 4 },
        ];
        const selectedQuarterUsers = visibilityAssignments.find(a => a.quarter === visibilityQuarter)?.user_ids || [];
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Past Quarter Progress Visibility</h4>
              <p className="text-xs text-slate-500 mt-1">
                Assign users who can see actual achieved data for each past quarter.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Quarter"
                value={visibilityQuarter}
                onChange={(v) => setVisibilityQuarter(String(v || 'Q1'))}
                options={quarterOpts}
                searchable={false}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <SearchInput
                  placeholder="Search users..."
                  value={visibilitySearch}
                  onChange={(e) => setVisibilitySearch(e.target.value)}
                  onClear={() => setVisibilitySearch('')}
                  containerClassName="flex-1 shadow-none"
                  inputSize="sm"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs shrink-0"
                  onClick={async () => {
                    const ids = visibilitySelectedUserIds;
                    if (!ids.length) return;
                    setVisibilityAssignments((prev) => {
                      const existing = prev.find(a => a.quarter === visibilityQuarter);
                      if (existing) {
                        return prev.map(a => a.quarter === visibilityQuarter
                          ? { ...a, user_ids: [...new Set([...a.user_ids, ...ids])] }
                          : a
                        );
                      }
                      return [...prev, { quarter: visibilityQuarter, user_ids: ids }];
                    });
                    setVisibilitySelectedUserIds([]);
                    setVisibilitySearch('');
                  }}
                >
                  Add {visibilitySelectedUserIds.length ? `(${visibilitySelectedUserIds.length})` : ''}
                </Button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                {visibilityLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                  </div>
                ) : filteredVisibilityUsers.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-xs font-semibold text-slate-400">No users found</p>
                  </div>
                ) : (
                  <div className="max-h-[240px] overflow-y-auto divide-y divide-slate-100">
                    {filteredVisibilityUsers.map((u) => {
                      const checked = visibilitySelectedUserIds.includes(u.id);
                      const alreadyAssigned = selectedQuarterUsers.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors",
                            alreadyAssigned ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={alreadyAssigned}
                            onChange={() => {
                              setVisibilitySelectedUserIds((prev) =>
                                prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                              );
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0 uppercase">
                            {u.first_name?.[0]}{u.last_name?.[0]}
                          </div>
                          <span className="text-sm font-semibold text-slate-800 truncate flex-1">
                            {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || `#${u.id}`}
                          </span>
                          {alreadyAssigned && (
                            <span className="text-[10px] font-semibold text-emerald-600">Assigned</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 flex items-center justify-between">
                <span>Assigned Users</span>
                <span className="text-[10px] text-slate-400">{visibilityAssignments.flatMap(a => a.user_ids).length} total</span>
              </div>
              {visibilityAssignments.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs font-semibold text-slate-400">No assignments yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {visibilityAssignments.map((a) => (
                    a.user_ids.map((uid) => {
                      const u = visibilityUsers.find(u => u.id === uid);
                      return (
                        <div key={`${a.quarter}-${uid}`} className="flex items-center justify-between px-4 py-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {a.quarter}
                            </span>
                            <span className="text-sm font-semibold text-slate-800 truncate">
                              {u ? [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || `#${u.id}` : `#${uid}`}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setVisibilityAssignments((prev) => prev.map((x) =>
                                x.quarter === a.quarter
                                  ? { ...x, user_ids: x.user_ids.filter((id) => id !== uid) }
                                  : x
                              ).filter((x) => x.user_ids.length > 0));
                            }}
                            className="text-rose-500 hover:text-rose-700 text-xs font-semibold shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVisibilityAssignments([])}
                className="text-xs font-semibold text-slate-400"
              >
                Clear All
              </Button>
              <Button
                onClick={handleSaveVisibility}
                isLoading={visibilitySaving}
                size="sm"
                className="px-8 text-xs uppercase font-semibold tracking-wide"
              >
                Save
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
             <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 mb-3 border border-slate-200 border-dashed">
                <Fingerprint size={24} />
             </div>
             <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Access Restricted</p>
             <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase">Contact administrator for access</p>
          </div>
        );
    }
  };

  const tabs: { label: SettingsTab; icon: any }[] = [
    { label: 'Profile', icon: User },
    { label: 'Audit Logs', icon: History },
    { label: 'Versions', icon: Tag },
    { label: 'Visibility', icon: Eye },
  ];

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Settings', href: '/settings' },
    { label: activeTab }
  ];

  return (
    <PageLayout
      title={activeTab}
      description={tabs.find(t => t.label === activeTab)?.label + " settings"}
      breadcrumbs={breadcrumbs}
    >
      <div className="w-full space-y-4">
        {/* Horizontal Navigation Control */}
        <div className="flex items-center justify-between gap-4 py-1 border-b border-slate-100 mb-2">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
            {tabs.filter(t => (t.label !== 'Audit Logs' || canViewAuditLogs) && (t.label !== 'Versions' || canSyncHRMS) && (t.label !== 'Visibility' || canManageVisibility)).map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.label)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 relative group whitespace-nowrap active:scale-[0.98]",
                  activeTab === item.label 
                    ? "text-blue-600 font-semibold" 
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                {activeTab === item.label && (
                   <motion.div 
                     layoutId="horizontal-active-indicator"
                     className="absolute inset-0 bg-blue-50 rounded-xl -z-10"
                     transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                   />
                )}
                <item.icon size={15} className={cn("transition-transform group-hover:scale-110", activeTab === item.label ? "text-blue-600" : "opacity-40")} />
                <span className="text-xs font-medium uppercase tracking-wide">{item.label}</span>
                {activeTab === item.label && (
                   <motion.div 
                     layoutId="underline"
                     className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-600 rounded-full"
                   />
                )}
              </button>
            ))}
          </div>
        </div>

        <main className="w-full">
          <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
            <CardContent className="p-4 md:p-6 lg:p-8">
               {renderContent()}
            </CardContent>
          </Card>
        </main>
      </div>
    </PageLayout>
  );
};

