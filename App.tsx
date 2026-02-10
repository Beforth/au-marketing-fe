
import React, { useState, useMemo, createContext, useContext, useEffect, useCallback, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { loadAuthFromStorage, selectToken } from './store/slices/authSlice';
import { marketingAPI } from './lib/marketing-api';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LeadsPage } from './pages/LeadsPage';
import { ContactsPage } from './pages/ContactsPage';
import { DomainsPage } from './pages/DomainsPage';
import { DomainFormPage } from './pages/DomainFormPage';
import { RegionFormPage } from './pages/RegionFormPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { ContactFormPage } from './pages/ContactFormPage';
import { LeadFormPage } from './pages/LeadFormPage';
import { CustomerFormPage } from './pages/CustomerFormPage';
import { OrdersPage } from './pages/OrdersPage';
import { EnquiryQuotationsPage } from './pages/EnquiryQuotationsPage';
import { CustomersPage } from './pages/CustomersPage';
import { InventoryPage } from './pages/InventoryPage';
import { FinancialsPage } from './pages/FinancialsPage';
import { ReportsPage } from './pages/ReportsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { SettingsPage } from './pages/SettingsPage';
import { SupportPage } from './pages/SupportPage';
import { ToastType } from './components/ui/Toast';

const NumberingSeriesPage = lazy(() => import('./pages/NumberingSeriesPage').then(m => ({ default: m.NumberingSeriesPage })));
import { AppNotification } from './types';

interface AppContextType {
  showToast: (message: string, type?: ToastType) => void;
  globalSearch: string;
  setGlobalSearch: (val: string) => void;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  unreadCount: number;
  markAsRead: (id: string | number) => void;
  markAllAsRead: () => void;
  loadNotifications: () => Promise<void>;
  toast: { message: string; type: ToastType } | null;
  onCloseToast: () => void;
  simulateDemo: () => void;
  clearDemo: () => void;
  isDemoActive: boolean;
  orders: any[];
  customers: any[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  { id: '1', title: 'New Order Received', message: 'Order #ORD-7237 processed for Sarah Jenkins.', time: '2m ago', type: 'order', read: false },
  { id: '2', title: 'System Security Alert', message: 'New login detected from Austin, TX.', time: '15m ago', type: 'system', read: false },
  { id: '3', title: 'Inventory Warning', message: 'Premium ERP License stock is below 15%.', time: '1h ago', type: 'inventory', read: false },
  { id: '4', title: 'Payment Confirmed', message: 'Invoice #INV-2023-088 paid by Studio Hub.', time: '3h ago', type: 'system', read: false },
  { id: '5', title: 'Customer Feedback', message: 'Alice Thompson rated the support experience 5/5.', time: '5h ago', type: 'customer', read: true },
];

function formatNotificationTime(createdAt: string): string {
  try {
    const d = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return '';
  }
}

const AppMain: React.FC = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectToken);
  const [globalSearch, setGlobalSearch] = useState('');
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const list = await marketingAPI.getNotifications(false, 50);
      const mapped: AppNotification[] = list.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message || '',
        time: formatNotificationTime(n.created_at),
        type: (n.notification_type === 'follow_up' ? 'follow_up' : n.notification_type === 'new_inquiry' ? 'new_inquiry' : 'system') as AppNotification['type'],
        read: !!n.read_at,
        link: n.link || undefined,
      }));
      setNotifications(mapped);
    } catch {
      // Keep existing state on error
    }
  }, [token]);

  useEffect(() => {
    dispatch(loadAuthFromStorage());
  }, [dispatch]);

  useEffect(() => {
    if (token) loadNotifications();
    else setNotifications(INITIAL_NOTIFICATIONS);
  }, [token, loadNotifications]);

  useEffect(() => {
    if (!token) return;
    const t = setInterval(loadNotifications, 60000);
    return () => clearInterval(t);
  }, [token, loadNotifications]);

  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const markAsRead = (id: string | number) => {
    if (typeof id === 'number') {
      marketingAPI.markNotificationRead(id).then(() => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }).catch(() => {});
    } else {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  const markAllAsRead = () => {
    if (token) {
      marketingAPI.markAllNotificationsRead().then(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        showToast('All notifications marked as read');
      }).catch(() => {});
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showToast('All notifications marked as read');
    }
  };

  const [isDemoActive, setIsDemoActive] = useState(false);

  const simulateDemo = () => {
    import('./demoData').then(data => {
      setNotifications(prev => [...data.DEMO_NOTIFICATIONS, ...prev]);
      setOrders(data.DEMO_ORDERS);
      setCustomers(data.DEMO_CUSTOMERS);
      setIsDemoActive(true);
      showToast('System-wide demo data simulated', 'success');
    });
  };

  const clearDemo = () => {
    setNotifications(INITIAL_NOTIFICATIONS);
    setOrders([]);
    setCustomers([]);
    setIsDemoActive(false);
    showToast('Demo data flushed from system', 'info');
  };

  const contextValue = useMemo(() => ({
    showToast,
    globalSearch,
    setGlobalSearch,
    notifications,
    setNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loadNotifications,
    toast,
    onCloseToast: () => setToast(null),
    simulateDemo,
    clearDemo,
    isDemoActive,
    orders,
    customers
  }), [globalSearch, notifications, unreadCount, toast, isDemoActive, orders, customers, loadNotifications]);

  return (
    <AppContext.Provider value={contextValue}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="domains" element={<DomainsPage />} />
            <Route path="domains/new" element={<DomainFormPage />} />
            <Route path="domains/:id/edit" element={<DomainFormPage />} />
            <Route path="domains/:domainId/regions/new" element={<RegionFormPage />} />
            <Route path="domains/:domainId/regions/:regionId/edit" element={<RegionFormPage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="contacts/new" element={<ContactFormPage />} />
            <Route path="contacts/:id/edit" element={<ContactFormPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="leads/new" element={<LeadFormPage />} />
            <Route path="leads/:id/edit" element={<LeadFormPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/new" element={<CustomerFormPage />} />
            <Route path="customers/:id/edit" element={<CustomerFormPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="quotations" element={<EnquiryQuotationsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="financials" element={<FinancialsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="numbering-series" element={<Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}><NumberingSeriesPage /></Suspense>} />
            <Route path="numbering-series/new" element={<Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}><NumberingSeriesPage /></Suspense>} />
            <Route path="numbering-series/:id/edit" element={<Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}><NumberingSeriesPage /></Suspense>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <AppMain />
  </ThemeProvider>
);

export default App;
