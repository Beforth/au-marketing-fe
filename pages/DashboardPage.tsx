
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageLayout } from '../components/layout/PageLayout';
import { marketingAPI } from '../lib/marketing-api';
import { ApiError } from '../lib/api';
import { StatItem } from '../types';
import { Lead } from '../lib/marketing-api';
import { Download, Layout as LayoutIcon, Check, RefreshCw, Users, UserCircle, Quote, FileText, ShieldAlert } from 'lucide-react';
import { WidgetConfig, WidgetId } from '../types';

const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: 'revenue-chart', span: 2 },
  { id: 'goal-chart', span: 1 },
  { id: 'activity-table', span: 2 },
  { id: 'global-reach', span: 1 },
];

export const DashboardPage: React.FC = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [reportSummary, setReportSummary] = useState<{ inquiries_count: number; quotations_sent_count: number; leads_total: number } | null>(null);
  const [leadStatusCounts, setLeadStatusCounts] = useState<{ label: string; count: number }[]>([]);

  const [layout, setLayout] = useState<WidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem('dashboard-layout');
      return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
    } catch (e) {
      return DEFAULT_LAYOUT;
    }
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const loadDashboard = useCallback(async () => {
    if (permissionDenied) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [leadsRes, contactsRes, customersRes, summary, statuses] = await Promise.all([
        marketingAPI.getLeads({ page: 1, page_size: 10 }),
        marketingAPI.getContacts({ page: 1, page_size: 10 }),
        marketingAPI.getCustomers({ page: 1, page_size: 10 }),
        marketingAPI.getReportsSummary().catch(() => null),
        marketingAPI.getLeadStatuses({ is_active: true }).catch(() => []),
      ]);

      const leadsTotal = leadsRes.total;
      const contactsTotal = contactsRes.total;
      const customersTotal = customersRes.total;

      setRecentLeads(leadsRes.items);
      setReportSummary(summary ? { inquiries_count: summary.inquiries_count, quotations_sent_count: summary.quotations_sent_count, leads_total: summary.leads_total } : null);

      const statCards: StatItem[] = [
        { label: 'Leads', value: String(leadsTotal), change: 'Total in system', trend: 'neutral', icon: Users },
        { label: 'Contacts', value: String(contactsTotal), change: 'Total in system', trend: 'neutral', icon: UserCircle },
        { label: 'Customers', value: String(customersTotal), change: 'Total in system', trend: 'neutral', icon: Users },
        {
          label: 'My quotations sent',
          value: summary ? String(summary.quotations_sent_count) : '—',
          change: summary ? `${summary.inquiries_count} inquiries` : '—',
          trend: 'neutral',
          icon: Quote,
        },
      ];
      setStats(statCards);

      if (statuses.length && leadsRes.items.length) {
        const byStatus: Record<string, number> = {};
        statuses.forEach((s: { id: number; label: string }) => { byStatus[s.label] = 0; });
        leadsRes.items.forEach((l: Lead) => {
          const label = l.status_option?.label ?? statuses.find((s: { id: number }) => s.id === l.status_id)?.label ?? '—';
          byStatus[label] = (byStatus[label] ?? 0) + 1;
        });
        setLeadStatusCounts(Object.entries(byStatus).map(([label, count]) => ({ label, count })));
      } else {
        setLeadStatusCounts([]);
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setPermissionDenied(true);
        showToast('You don\'t have permission to view this dashboard', 'error');
      } else {
        showToast('Failed to load dashboard data', 'error');
      }
      setStats([]);
      setRecentLeads([]);
      setReportSummary(null);
    } finally {
      setLoading(false);
    }
  }, [showToast, permissionDenied]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    localStorage.setItem('dashboard-layout', JSON.stringify(layout));
  }, [layout]);

  const toggleResize = (id: WidgetId) => {
    setLayout(prev => prev.map(w => {
      if (w.id === id) {
        const nextSpan = (w.span % 3) + 1 as 1 | 2 | 3;
        return { ...w, span: nextSpan };
      }
      return w;
    }));
  };

  const handleDragStart = (index: number) => {
    if (!isEditMode) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (index: number) => {
    if (draggedIndex === null) return;
    const newOrder = [...layout];
    const itemToMove = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, itemToMove);
    setLayout(newOrder);
    setDraggedIndex(null);
  };

  const renderWidget = (config: WidgetConfig) => {
    const commonProps = {
      isDraggable: isEditMode,
      showHandle: isEditMode,
      onDragStart: () => handleDragStart(layout.indexOf(config)),
      onDragOver: handleDragOver,
      onDrop: () => handleDrop(layout.indexOf(config)),
      onResize: () => toggleResize(config.id),
      className: `${config.span === 1 ? 'col-span-1' : config.span === 2 ? 'col-span-2' : 'col-span-3'} ${isEditMode ? 'ring-2 ring-dashed ring-slate-200' : ''}`,
    };

    switch (config.id) {
      case 'revenue-chart':
        return (
          <Card key={config.id} {...commonProps} title="Leads overview" description="Total leads and recent activity.">
            <div className="p-4 space-y-4">
              {reportSummary != null && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-slate-500 text-xs font-medium uppercase">My leads (assigned)</p>
                    <p className="text-xl font-bold text-slate-900">{reportSummary.leads_total}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-slate-500 text-xs font-medium uppercase">My inquiries</p>
                    <p className="text-xl font-bold text-slate-900">{reportSummary.inquiries_count}</p>
                  </div>
                </div>
              )}
              {leadStatusCounts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Recent leads by status (this page)</p>
                  {leadStatusCounts.map(({ label, count }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-slate-700">{label}</span>
                      <span className="font-medium text-slate-900">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        );
      case 'goal-chart':
        return (
          <Card key={config.id} {...commonProps} title="My activity" description="Your inquiries and quotations.">
            <div className="p-4 space-y-4">
              {reportSummary != null ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 text-sm">Inquiries logged</span>
                    <span className="font-bold text-slate-900">{reportSummary.inquiries_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 text-sm">Quotations sent</span>
                    <span className="font-bold text-slate-900">{reportSummary.quotations_sent_count}</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => navigate('/reports')}>
                    View reports
                  </Button>
                </>
              ) : (
                <p className="text-slate-500 text-sm">No report data. Go to Reports for details.</p>
              )}
            </div>
          </Card>
        );
      case 'activity-table':
        return (
          <Card key={config.id} {...commonProps} title="Recent leads" description="Latest leads (click to edit)." noPadding maxHeight="none">
            <div className="overflow-x-auto">
              {recentLeads.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No leads yet.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="px-4 py-2 font-semibold text-slate-600">Name</th>
                      <th className="px-4 py-2 font-semibold text-slate-600">Company</th>
                      <th className="px-4 py-2 font-semibold text-slate-600">Status</th>
                      <th className="px-4 py-2 font-semibold text-slate-600">Next follow-up</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        onClick={() => navigate(`/leads/${lead.id}/edit`)}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="px-4 py-2 font-medium text-slate-900">{lead.first_name} {lead.last_name}</td>
                        <td className="px-4 py-2 text-slate-600">{lead.customer?.company_name ?? lead.company ?? '—'}</td>
                        <td className="px-4 py-2 text-slate-600">{lead.status_option?.label ?? '—'}</td>
                        <td className="px-4 py-2 text-slate-600">
                          {lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toLocaleDateString(undefined, { dateStyle: 'short' }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="p-2 border-t border-slate-100">
                <Button variant="ghost" size="sm" onClick={() => navigate('/leads')} className="text-xs">
                  View all leads →
                </Button>
              </div>
            </div>
          </Card>
        );
      case 'global-reach':
        return (
          <Card key={config.id} {...commonProps} title="Quick links" description="Marketing module.">
            <div className="p-4 space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/leads')} leftIcon={<Users size={14} />}>
                Leads
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/contacts')} leftIcon={<UserCircle size={14} />}>
                Contacts
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/customers')} leftIcon={<Users size={14} />}>
                Customers
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/quotations')} leftIcon={<Quote size={14} />}>
                Quotations
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/reports')} leftIcon={<FileText size={14} />}>
                Reports
              </Button>
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      showToast('Export not implemented for dashboard', 'info');
    }, 500);
  };

  const actions = (
    <>
      <Button variant="outline" size="sm" onClick={loadDashboard} disabled={loading || permissionDenied} leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}>
        Refresh
      </Button>
      <Button
        variant={isEditMode ? 'primary' : 'outline'}
        size="sm"
        onClick={() => {
          setIsEditMode(!isEditMode);
          if (isEditMode) showToast('Dashboard layout saved', 'success');
        }}
        leftIcon={isEditMode ? <Check size={14} /> : <LayoutIcon size={14} />}
      >
        {isEditMode ? 'Save layout' : 'Customize'}
      </Button>
      <Button size="sm" onClick={handleExport} isLoading={isExporting} leftIcon={<Download size={14} />}>
        Export
      </Button>
    </>
  );

  return (
    <PageLayout
      title="Marketing overview"
      description="Leads, contacts, customers, and your activity."
      actions={actions}
    >
      {permissionDenied ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-lg border border-amber-200 bg-amber-50">
          <ShieldAlert className="w-12 h-12 text-amber-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-1">You don&apos;t have permission</h3>
          <p className="text-sm text-slate-600 text-center max-w-md">
            You don&apos;t have permission to view this dashboard. Contact your administrator if you need access.
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={24} className="animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--ui-gap)' }}>
            {stats.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 transition-all duration-300 mt-6" style={{ gap: 'var(--ui-gap)' }}>
            {layout.map(config => renderWidget(config))}
          </div>
        </>
      )}
    </PageLayout>
  );
};

