import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DatePicker } from '../components/ui/DatePicker';
import { Modal } from '../components/ui/Modal';
import { PageLayout } from '../components/layout/PageLayout';
import { marketingAPI, ReportScopeResponse, ReportSummaryResponse, ExpectedOrderReportItem, ODPlanReportItem } from '../lib/marketing-api';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { MessageSquare, Send, UserPlus, Users, RefreshCw, Plus, Calendar, FileText, MapPin, List, Eye, ExternalLink } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const canViewReport = useAppSelector(selectHasPermission('marketing.view_report'));
  const canCreateReport = useAppSelector(selectHasPermission('marketing.create_report'));
  const [scope, setScope] = useState<ReportScopeResponse | null>(null);
  const [summary, setSummary] = useState<ReportSummaryResponse | null>(null);
  const [loadingScope, setLoadingScope] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(undefined);
  const [expectedOrderReports, setExpectedOrderReports] = useState<ExpectedOrderReportItem[]>([]);
  const [odPlanReports, setODPlanReports] = useState<ODPlanReportItem[]>([]);
  const [loadingExpected, setLoadingExpected] = useState(false);
  const [loadingOD, setLoadingOD] = useState(false);
  const [viewExpectedOrderReport, setViewExpectedOrderReport] = useState<ExpectedOrderReportItem | null>(null);

  const loadScope = useCallback(async () => {
    setLoadingScope(true);
    try {
      const data = await marketingAPI.getReportsScope();
      setScope(data);
      if (data.employees.length && selectedEmployeeId === undefined) {
        const me = data.employees[0];
        setSelectedEmployeeId(me?.id);
      }
    } catch (e: any) {
      showToast(e?.message || 'Failed to load report scope', 'error');
    } finally {
      setLoadingScope(false);
    }
  }, [showToast, selectedEmployeeId]);

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const params: { date_from?: string; date_to?: string; employee_id?: number } = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (selectedEmployeeId != null) params.employee_id = selectedEmployeeId;
      const data = await marketingAPI.getReportsSummary(params);
      setSummary(data);
    } catch (e: any) {
      showToast(e?.message || 'Failed to load report', 'error');
    } finally {
      setLoadingSummary(false);
    }
  }, [dateFrom, dateTo, selectedEmployeeId, showToast]);

  useEffect(() => {
    if (canViewReport) loadScope();
  }, [canViewReport]);

  useEffect(() => {
    if (canViewReport && !loadingScope) loadSummary();
  }, [canViewReport, loadingScope, dateFrom, dateTo, selectedEmployeeId]);

  useEffect(() => {
    if (!canViewReport) return;
    setLoadingExpected(true);
    const params = selectedEmployeeId != null ? { employee_id: selectedEmployeeId } : undefined;
    marketingAPI.listExpectedOrderReports(params).then(setExpectedOrderReports).catch(() => setExpectedOrderReports([])).finally(() => setLoadingExpected(false));
  }, [canViewReport, selectedEmployeeId]);

  useEffect(() => {
    if (!canViewReport) return;
    setLoadingOD(true);
    const params = selectedEmployeeId != null ? { employee_id: selectedEmployeeId } : undefined;
    marketingAPI.listODPlanReports(params).then(setODPlanReports).catch(() => setODPlanReports([])).finally(() => setLoadingOD(false));
  }, [canViewReport, selectedEmployeeId]);

  const handleApplyRange = () => {
    loadSummary();
  };

  const nextMonth = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  })();


  const breadcrumbs = [{ label: 'Reports', href: '/reports' }];
  return (
    <PageLayout
      title="Reports"
      description="View metrics (inquiries, quotations, leads), expected orders, and OD plans. You see your own data; as region head, domain head, or admin you can view your team's. Use 'Report for' to filter summary, expected order reports, and OD plans by person."
      breadcrumbs={breadcrumbs}
    >
      {!canViewReport && (
        <Card className="mb-6">
          <p className="text-slate-600">You do not have permission to view reports.</p>
          <p className="text-sm text-slate-500 mt-2">Required permission: marketing.view_report</p>
        </Card>
      )}
      {canViewReport && (
      <>
      {/* Filters: date range and report-for — at top so user can filter before viewing any section */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Date from</label>
            <DatePicker
              value={dateFrom}
              onChange={(v) => setDateFrom(v || '')}
              className="w-[160px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Date to</label>
            <DatePicker
              value={dateTo}
              onChange={(v) => setDateTo(v || '')}
              className="w-[160px]"
            />
          </div>
          {scope?.can_select_employee && (
            <div className="flex flex-col gap-1 min-w-[200px]">
              <Select
                label="Report for"
                value={selectedEmployeeId ?? ''}
                onChange={(val) => setSelectedEmployeeId(val !== undefined && val !== '' ? Number(val) : undefined)}
                options={scope.employees.map((emp) => ({ value: emp.id, label: emp.name }))}
                placeholder="Select employee"
              />
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleApplyRange} leftIcon={<RefreshCw size={14} />}>
            Apply
          </Button>
        </div>
        {scope?.role && scope.role !== 'self' && (
          <p className="mt-2 text-xs text-slate-500">
            You are a <strong>{scope.role === 'domain_head' ? 'Domain head' : 'Region head'}</strong> — you can view
            reports for your team members.
          </p>
        )}
      </Card>

      {/* Create report actions (when user has create_report) */}
      {canCreateReport && (
        <Card className="mb-6" title="Create report" description="Create plans and forecasts.">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" leftIcon={<MapPin size={14} />} onClick={() => navigate('/reports/od-plan')}>
              Create outdoor plan
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Calendar size={14} />} onClick={() => navigate('/reports/expected-order/new')}>
              Create expected order in next month
            </Button>
            <Button variant="outline" size="sm" leftIcon={<FileText size={14} />} onClick={() => showToast('Create report — coming soon', 'info')}>
              Create report
            </Button>
          </div>
        </Card>
      )}

      {/* Expected order reports list */}
      {canViewReport && (
        <Card className="mb-6" title="Expected order reports" description="Next month potential clients (selected leads).">
          {loadingExpected ? (
            <p className="text-slate-500">Loading...</p>
          ) : expectedOrderReports.length === 0 ? (
            <p className="text-slate-500">No expected order reports yet. Create one to mark leads as next month potential clients.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 font-medium text-slate-600">Year / Month</th>
                    <th className="text-left py-2 font-medium text-slate-600">Leads</th>
                    <th className="text-left py-2 font-medium text-slate-600">Created</th>
                    <th className="text-right py-2 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expectedOrderReports.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-2 text-slate-800">{r.year} / {r.month}</td>
                      <td className="py-2">{r.leads.length} lead{r.leads.length !== 1 ? 's' : ''}</td>
                      <td className="py-2 text-slate-500">{r.created_at ? new Date(r.created_at).toLocaleDateString(undefined, { dateStyle: 'short' }) : '—'}</td>
                      <td className="py-2 text-right">
                        <Button variant="ghost" size="sm" className="text-xs" leftIcon={<Eye size={14} />} onClick={() => setViewExpectedOrderReport(r)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* View expected order report modal */}
      {viewExpectedOrderReport && (
        <Modal
          isOpen={!!viewExpectedOrderReport}
          onClose={() => setViewExpectedOrderReport(null)}
          title={`Expected order — ${viewExpectedOrderReport.year} / ${viewExpectedOrderReport.month}`}
          contentClassName="max-w-2xl"
        >
          <p className="text-sm text-slate-500 mb-3">
            {viewExpectedOrderReport.leads.length} potential client{viewExpectedOrderReport.leads.length !== 1 ? 's' : ''} for this month.
          </p>
          <div className="max-h-[50vh] overflow-y-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-medium text-slate-600">Lead</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-600">Company</th>
                  <th className="w-20 py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {viewExpectedOrderReport.leads.map((lead) => (
                  <tr key={lead.lead_id} className="border-b border-slate-100">
                    <td className="py-2 px-3 font-medium text-slate-800">
                      {lead.lead_series && <span className="text-slate-500 mr-1">({lead.lead_series})</span>}
                      {lead.lead_name || `Lead #${lead.lead_id}`}
                    </td>
                    <td className="py-2 px-3 text-slate-600">{lead.company || '—'}</td>
                    <td className="py-2 px-3">
                      <Button variant="ghost" size="sm" className="text-xs" leftIcon={<ExternalLink size={12} />} onClick={() => { setViewExpectedOrderReport(null); navigate(`/leads/${lead.lead_id}/edit`); }}>
                        Open
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setViewExpectedOrderReport(null)}>Close</Button>
          </div>
        </Modal>
      )}

      {/* OD plan reports list */}
      {canViewReport && (
        <Card className="mb-6" title="Outdoor (OD) plans" description="Monthly visit / travel / return plans.">
          {loadingOD ? (
            <p className="text-slate-500">Loading...</p>
          ) : odPlanReports.length === 0 ? (
            <p className="text-slate-500">No OD plans yet. Create one for the next month.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {odPlanReports.map((r) => (
                <div key={r.id} className="border border-slate-200 rounded-lg p-3 min-w-[140px]">
                  <div className="font-medium text-slate-800">{r.year} / {r.month}</div>
                  <div className="text-xs text-slate-500 mt-1">{r.entries.length} entr{r.entries.length !== 1 ? 'ies' : 'y'}</div>
                  <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => navigate(`/reports/od-plan?year=${r.year}&month=${r.month}`)}>
                    View / Edit
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {loadingScope && (
        <Card>
          <p className="text-slate-500">Loading...</p>
        </Card>
      )}

      {!loadingScope && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                title: 'Inquiries',
                value: summary?.inquiries_count ?? '—',
                icon: MessageSquare,
                sub: 'Enquiry log entries in range',
              },
              {
                title: 'Quotations sent',
                value: summary?.quotations_sent_count ?? '—',
                icon: Send,
                sub: 'Quotation files uploaded',
              },
              {
                title: 'Leads (assigned)',
                value: summary?.leads_total ?? '—',
                icon: Users,
                sub: 'Leads assigned in range',
              },
              {
                title: 'Leads created',
                value: summary?.leads_created_count ?? '—',
                icon: UserPlus,
                sub: 'Leads created by in range',
              },
            ].map((item) => (
              <Card key={item.title} className="hover:border-[var(--primary)]/20 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-1.5 bg-slate-50 rounded-lg">
                    <item.icon className="text-slate-500" size={18} strokeWidth={2} />
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 text-lg">{item.value}</h3>
                <p className="text-sm font-medium text-slate-700">{item.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
              </Card>
            ))}
          </div>

          {/* Inquiries by type */}
          <Card title="Inquiries by type" description="Breakdown by activity type in the selected range." className="mb-6">
            {loadingSummary ? (
              <p className="text-slate-500">Loading...</p>
            ) : summary?.inquiries_by_type?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 font-medium text-slate-600">Type</th>
                      <th className="text-right py-2 font-medium text-slate-600">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.inquiries_by_type.map((row) => (
                      <tr key={row.activity_type} className="border-b border-slate-100">
                        <td className="py-2 text-slate-800">{row.activity_type}</td>
                        <td className="py-2 text-right font-medium">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500">No inquiry data in this range.</p>
            )}
          </Card>

          {/* Leads by status */}
          <Card
            title="Leads by status"
            description="Number of leads in each status (assigned to selected user in range)."
          >
            {loadingSummary ? (
              <p className="text-slate-500">Loading...</p>
            ) : summary?.leads_by_status?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 font-medium text-slate-600">Status</th>
                      <th className="text-left py-2 font-medium text-slate-600">Code</th>
                      <th className="text-right py-2 font-medium text-slate-600">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.leads_by_status.map((row) => (
                      <tr key={row.status_id} className="border-b border-slate-100">
                        <td className="py-2 text-slate-800">{row.status_label}</td>
                        <td className="py-2 text-slate-500">{row.status_code}</td>
                        <td className="py-2 text-right font-medium">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500">No leads by status in this range.</p>
            )}
          </Card>
        </>
      )}
      </>
      )}
    </PageLayout>
  );
};
