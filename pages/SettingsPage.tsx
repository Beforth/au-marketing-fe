import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  History,
  Search,
  ChevronDown,
  ChevronRight,
  Fingerprint,
  Settings,
} from 'lucide-react';
import { useApp } from '../App';
import { PageLayout } from '../components/layout/PageLayout';
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
import { useTheme, Density } from '../context/ThemeContext';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { refreshUserInfo, selectUser, selectEmployee, selectHasPermission } from '../store/slices/authSlice';
import { marketingAPI, AuditLog } from '../lib/marketing-api';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type SettingsTab = 'Profile' | 'Audit Logs';

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


  // Audit Logs state
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsSearch, setLogsSearch] = useState('');
  const canViewAuditLogs = useAppSelector(selectHasPermission('marketing.admin')) || useAppSelector(selectHasPermission('marketing.view_reports'));

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



  // Load audit logs when tab is active
  useEffect(() => {
    if (activeTab !== 'Audit Logs') return;
    setLogsLoading(true);
    marketingAPI.getAuditLogs({ page: logsPage, page_size: 20 })
      .then(res => {
        setLogs(res.items);
        setLogsTotal(res.total);
      })
      .catch(() => {
        setLogs([]);
        setLogsTotal(0);
      })
      .finally(() => setLogsLoading(false));
  }, [activeTab, logsPage]);

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
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Full Name</Label>
                    <div className="text-sm font-semibold text-slate-900">{displayName || '—'}</div>
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Email Address</Label>
                    <div className="text-sm font-semibold text-slate-900">{displayEmail || '—'}</div>
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Designation</Label>
                    <div className="text-sm font-semibold text-slate-900">{displayRole || '—'}</div>
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Status</Label>
                    <div className="flex items-center gap-1.5">
                       <div className="size-1.5 rounded-full bg-emerald-500" />
                       <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 -mx-4 md:-mx-6 lg:-mx-8" />

            {/* Connections Section */}
            <div className="space-y-5 pt-2">
              <h4 className="text-[11px] font-black uppercase tracking-tight text-slate-900">Integrations</h4>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200">
                    <Globe size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-tight text-slate-900">Gmail Account</div>
                    <div className="text-sm font-semibold text-slate-400">Connect to send automated follow-up emails.</div>
                  </div>
                </div>
                
                {emailConnectionLoading ? (
                  <Loader2 className="animate-spin text-slate-300" size={18} />
                ) : emailConnection?.connected ? (
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                       <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Authenticated</div>
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
            </div>

            <div className="border-t border-slate-200 -mx-4 md:-mx-6 lg:-mx-8" />

            {/* Sync Section */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="text-[11px] font-black uppercase tracking-tight text-slate-900">Permissions Sync</div>
                <div className="text-sm font-semibold text-slate-400">Force refresh your access tokens and permissions.</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-dashed text-slate-500 hover:text-indigo-600 hover:border-indigo-200 font-semibold uppercase tracking-wide text-xs"
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
                leftIcon={<RefreshCw size={14} className={isRefreshingPermissions ? "animate-spin" : ""} />}
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
            <div className="flex items-center gap-2 mb-2">
               <div className="flex-1 relative">
                 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
                 <input 
                    type="text" 
                    placeholder="Specification filter..." 
                    className="w-full h-8 pl-8 pr-3 text-xs font-semibold uppercase tracking-wide bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-indigo-500/20 outline-none placeholder:text-slate-300 placeholder:font-normal"
                    value={logsSearch}
                    onChange={(e) => setLogsSearch(e.target.value)}
                 />
               </div>
               <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg">
                  <button onClick={() => setLogsPage(p => Math.max(1, p - 1))} className="h-6 w-6 flex items-center justify-center rounded hover:bg-white transition-all text-slate-400 disabled:opacity-20" disabled={logsPage <= 1 || logsLoading}>
                    <ChevronDown className="rotate-90" size={12} />
                  </button>
                  <span className="text-[10px] font-semibold tabular-nums text-slate-400 px-1 min-w-[40px] text-center">{logsPage}</span>
                  <button onClick={() => setLogsPage(p => p + 1)} className="h-6 w-6 flex items-center justify-center rounded hover:bg-white transition-all text-slate-400 disabled:opacity-20" disabled={logsLoading}>
                    <ChevronDown className="-rotate-90" size={12} />
                  </button>
               </div>
            </div>

            <Table containerClassName="border-slate-100/50 shadow-none rounded-2xl">
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="h-9 px-3 text-[10px] font-semibold">Meta / Time</TableHead>
                  <TableHead className="h-9 px-3 text-[10px] font-semibold">Actor</TableHead>
                  <TableHead className="h-9 px-3 text-[10px] font-semibold text-center">Protocol</TableHead>
                  <TableHead className="h-9 px-3 text-[10px] font-semibold">Entity Pointer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={4} className="py-2 px-3"><div className="h-4 w-full bg-slate-50 animate-pulse rounded-md" /></TableCell></TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-40 text-center text-slate-300 text-xs font-semibold uppercase tracking-[0.2em] opacity-30">Null Result</TableCell></TableRow>
                ) : (
                  logs.filter((l: AuditLog) => 
                    !logsSearch || 
                    l.action?.toLowerCase().includes(logsSearch.toLowerCase()) ||
                    l.entity_type?.toLowerCase().includes(logsSearch.toLowerCase()) ||
                    l.employee_name?.toLowerCase().includes(logsSearch.toLowerCase()) ||
                    l.details?.toLowerCase().includes(logsSearch.toLowerCase())
                  ).map((log: AuditLog) => {
                    const action = log.action?.toLowerCase() || '';
                    const isDanger = action.includes('delete') || action.includes('remove');
                    const isSuccess = action.includes('create') || action.includes('add') || action.includes('won');
                    
                    return (
                      <TableRow key={log.id} className="hover:bg-slate-50/30">
                        <TableCell className="px-3 py-2">
                           <div className="text-[10px] font-mono text-slate-400 tracking-tighter uppercase leading-none mb-1">
                             {new Date(log.created_at).toLocaleDateString('en-GB')}
                           </div>
                           <div className="text-xs font-semibold text-slate-300 leading-none">
                             {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </div>
                        </TableCell>
                        <TableCell className="px-3 py-2">
                           <div className="flex items-center gap-1.5">
                              <div className="size-4 rounded-sm bg-slate-200 text-slate-500 font-semibold text-[8px] flex items-center justify-center uppercase">{log.employee_name?.slice(0, 1) || 'S'}</div>
                              <span className="text-xs font-semibold text-slate-800 truncate max-w-[80px] leading-tight">{log.employee_name || 'System'}</span>
                           </div>
                        </TableCell>
                        <TableCell className="px-3 py-2 text-center">
                           <span className={cn(
                             "inline-block px-1.5 py-0.5 rounded-[4px] text-[8px] font-semibold uppercase tracking-wide ring-1 ring-inset",
                             isDanger ? "bg-rose-50 text-rose-600 ring-rose-100" :
                             isSuccess ? "bg-emerald-50 text-emerald-600 ring-emerald-100" :
                             "bg-blue-50 text-blue-600 ring-blue-100"
                           )}>
                             {log.action}
                           </span>
                        </TableCell>
                        <TableCell className="px-3 py-2">
                           <div className="text-xs font-semibold text-slate-900 uppercase tracking-tight mb-0.5">{log.entity_type.split('_').join(' ')}</div>
                           <div className="text-[10px] text-slate-400 font-mono italic truncate max-w-[120px]" title={log.details || ''}>{log.details || 'ID: ' + (log.entity_id || 'n/a')}</div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
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
            {tabs.filter(t => t.label !== 'Audit Logs' || canViewAuditLogs).map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.label)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 relative group whitespace-nowrap active:scale-[0.98]",
                  activeTab === item.label 
                    ? "text-indigo-600 font-semibold" 
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                {activeTab === item.label && (
                   <motion.div 
                     layoutId="horizontal-active-indicator"
                     className="absolute inset-0 bg-indigo-50 rounded-xl -z-10"
                     transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                   />
                )}
                <item.icon size={15} className={cn("transition-transform group-hover:scale-110", activeTab === item.label ? "text-indigo-600" : "opacity-40")} />
                <span className="text-xs font-medium uppercase tracking-wide">{item.label}</span>
                {activeTab === item.label && (
                   <motion.div 
                     layoutId="underline"
                     className="absolute bottom-0 left-4 right-4 h-0.5 bg-indigo-600 rounded-full"
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

