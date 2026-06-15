import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { PageLayout } from '../components/layout/PageLayout';
import { marketingAPI, ReportScopeResponse, ExpectedOrderReportItem, ODPlanReportItem } from '../lib/marketing-api';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { getCached, setCache, getCacheKey } from '../lib/api-cache';
import { Calendar, MapPin, Eye, ExternalLink } from 'lucide-react';

const SCOPE_CACHE_KEY = 'reports_scope';

interface ReportData {
  expectedOrderReports: ExpectedOrderReportItem[];
  odPlanReports: ODPlanReportItem[];
}

export const ReportsPage: React.FC = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const canViewReport = useAppSelector(selectHasPermission('marketing.view_report'));
  const canCreateReport = useAppSelector(selectHasPermission('marketing.create_report'));

  const [scope, setScope] = useState<ReportScopeResponse | null>(null);
  const [loadingScope, setLoadingScope] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(undefined);

  const [expectedOrderReports, setExpectedOrderReports] = useState<ExpectedOrderReportItem[]>([]);
  const [odPlanReports, setODPlanReports] = useState<ODPlanReportItem[]>([]);
  const [loadingExpected, setLoadingExpected] = useState(false);
  const [loadingOD, setLoadingOD] = useState(false);
  const [viewExpectedOrderReport, setViewExpectedOrderReport] = useState<ExpectedOrderReportItem | null>(null);

  const dataCache = useRef<Map<string, ReportData>>(new Map());

  const loadScope = useCallback(async () => {
    const cached = getCached<ReportScopeResponse>(SCOPE_CACHE_KEY);
    if (cached) {
      setScope(cached);
      setLoadingScope(false);
      return;
    }

    setLoadingScope(true);
    try {
      const data = await marketingAPI.getReportsScope();
      setCache(SCOPE_CACHE_KEY, data);
      setScope(data);
    } catch (e: any) {
      showToast(e?.message || 'Failed to load report scope', 'error');
    } finally {
      setLoadingScope(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (canViewReport) loadScope();
  }, [canViewReport, loadScope]);

  // Fetch expected orders with caching
  useEffect(() => {
    if (!canViewReport) return;

    const cacheKey = getCacheKey('report_expected', selectedEmployeeId);
    const cached = dataCache.current.get(cacheKey);
    if (cached?.expectedOrderReports) {
      setExpectedOrderReports(cached.expectedOrderReports);
      return;
    }

    setLoadingExpected(true);
    const params = selectedEmployeeId != null ? { employee_id: selectedEmployeeId } : undefined;
    marketingAPI.listExpectedOrderReports(params).then((data) => {
      setExpectedOrderReports(data);
      const existing = dataCache.current.get(cacheKey) || {} as ReportData;
      dataCache.current.set(cacheKey, { ...existing, expectedOrderReports: data });
    }).catch(() => setExpectedOrderReports([])).finally(() => setLoadingExpected(false));
  }, [canViewReport, selectedEmployeeId]);

  // Fetch OD plans with caching
  useEffect(() => {
    if (!canViewReport) return;

    const cacheKey = getCacheKey('report_od', selectedEmployeeId);
    const cached = dataCache.current.get(cacheKey);
    if (cached?.odPlanReports) {
      setODPlanReports(cached.odPlanReports);
      return;
    }

    setLoadingOD(true);
    const params = selectedEmployeeId != null ? { employee_id: selectedEmployeeId } : undefined;
    marketingAPI.listODPlanReports(params).then((data) => {
      setODPlanReports(data);
      const existing = dataCache.current.get(cacheKey) || {} as ReportData;
      dataCache.current.set(cacheKey, { ...existing, odPlanReports: data });
    }).catch(() => setODPlanReports([])).finally(() => setLoadingOD(false));
  }, [canViewReport, selectedEmployeeId]);

  const breadcrumbs = [{ label: 'Reports', href: '/reports' }];
  return (
    <PageLayout
      title="Reports"
      description="Expected orders and outdoor plans. You see your own data; as region head, domain head, or admin you can view your team's. Use 'Report for' to filter by person."
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
      {/* Report-for filter */}
      {loadingScope ? (
        <Card className="mb-6">
          <div className="flex items-center gap-2.5 py-4">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest leading-none">Loading scope...</span>
          </div>
        </Card>
      ) : (
      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
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
        </div>
        {scope?.role && scope.role !== 'self' && (
          <p className="mt-2 text-xs text-slate-500">
            You are a <strong>{scope.role === 'domain_head' ? 'Domain head' : 'Region head'}</strong> — you can view
            reports for your team members.
          </p>
        )}
      </Card>
      )}

      {/* Create report actions */}
      {canCreateReport && (
        <Card className="mb-6" title="Create report" description="Create plans and forecasts.">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" leftIcon={<MapPin size={14} />} onClick={() => navigate('/reports/od-plan')}>
              Create outdoor plan
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Calendar size={14} />} onClick={() => navigate('/reports/expected-order/new')}>
              Create expected order in next month
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Expected order reports list */}
        <Card title="Expected order reports" description="Next month potential clients (selected leads).">
          {loadingExpected ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
              <p className="mt-3 text-slate-500 text-sm font-medium">Loading expected order reports...</p>
            </div>
          ) : expectedOrderReports.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
              <Calendar size={32} />
              <p className="text-sm">No expected order reports yet.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {expectedOrderReports.map((r) => {
                const now = new Date();
                const isPast = r.year < now.getFullYear() || (r.year === now.getFullYear() && r.month < now.getMonth() + 1);
                const w = r.leads.filter(l => l.lead_is_final && !l.lead_is_lost).length;
                const lost = r.leads.filter(l => l.lead_is_lost).length;
                const exp = r.leads.filter(l => !l.lead_is_final && !l.lead_is_lost).length;
                const carried = isPast ? exp : 0;
                const expShow = isPast ? 0 : exp;
                return (
                  <div key={r.id} className="border border-slate-200 rounded-lg p-3 min-w-[160px]">
                    <div className="font-medium text-slate-800">
                      {new Date(r.year, r.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{r.leads.length} lead{r.leads.length !== 1 ? 's' : ''}</div>
                    <div className="flex items-center gap-2 mt-1 text-[10px]">
                      {w > 0 && <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-0.5" />{w}</span>}
                      {lost > 0 && <span><span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-0.5" />{lost}</span>}
                      {expShow > 0 && <span><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-0.5" />{expShow}</span>}
                      {carried > 0 && <span><span className="inline-block w-2 h-2 rounded-full bg-slate-400 mr-0.5" />{carried}</span>}
                    </div>
                    <Button variant="ghost" size="sm" className="mt-2 text-xs" leftIcon={<Eye size={12} />} onClick={() => setViewExpectedOrderReport(r)}>
                      View
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* OD plan reports list */}
        <Card title="Outdoor (OD) plans" description="Monthly visit / travel / return plans.">
          {loadingOD ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
              <p className="mt-3 text-slate-500 text-sm font-medium">Loading outdoor plans...</p>
            </div>
          ) : odPlanReports.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
              <MapPin size={32} />
              <p className="text-sm">No OD plans yet.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {odPlanReports.map((r) => (
                <div key={r.id} className="border border-slate-200 rounded-lg p-3 min-w-[140px]">
                  <div className="font-medium text-slate-800">
                    {new Date(r.year, r.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' })}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{r.entries.length} entr{r.entries.length !== 1 ? 'ies' : 'y'}</div>
                  <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => navigate(`/reports/od-plan?year=${r.year}&month=${r.month}`)}>
                    View / Edit
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* View expected order report modal */}
      {viewExpectedOrderReport && (() => {
        const report = viewExpectedOrderReport;
        const now = new Date();
        const isPast = report.year < now.getFullYear() ||
                       (report.year === now.getFullYear() && report.month < now.getMonth() + 1);

        const leadStatusColor = (lead: typeof report.leads[number]) => {
          if (lead.lead_is_final && !lead.lead_is_lost) return 'won';
          if (lead.lead_is_lost) return 'lost';
          return isPast ? 'carried' : 'expected';
        };

        const badgeConfig = (color: string) => {
          switch (color) {
            case 'won': return { label: 'Won', cls: 'bg-emerald-100 text-emerald-700' };
            case 'lost': return { label: 'Lost', cls: 'bg-rose-100 text-rose-700' };
            case 'expected': return { label: 'Expected', cls: 'bg-amber-100 text-amber-700' };
            default: return { label: 'Carried forward', cls: 'bg-slate-200 text-slate-600' };
          }
        };

        const borderColor = (color: string) => {
          switch (color) {
            case 'won': return 'border-l-emerald-500 bg-emerald-50/30';
            case 'lost': return 'border-l-rose-500 bg-rose-50/30';
            case 'expected': return 'border-l-amber-400 bg-amber-50/30';
            default: return 'border-l-slate-300 bg-slate-50/30';
          }
        };

        const counts = { won: 0, lost: 0, expected: 0, carried: 0 };
        report.leads.forEach(l => {
          const c = leadStatusColor(l);
          counts[c === 'expected' ? 'expected' : c === 'carried' ? 'carried' : c]++;
        });

        return (
        <Modal
          isOpen={!!viewExpectedOrderReport}
          onClose={() => setViewExpectedOrderReport(null)}
          title={`Expected order — ${new Date(report.year, report.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' })}`}
          contentClassName="max-w-2xl"
        >
          <p className="text-sm text-slate-500 mb-3">
            {report.leads.length} potential client{report.leads.length !== 1 ? 's' : ''} for this month.
          </p>
          <div className="flex items-center gap-3 mb-3 text-xs">
            {counts.won > 0 && <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" />{counts.won} won</span>}
            {counts.lost > 0 && <span><span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1" />{counts.lost} lost</span>}
            {counts.expected > 0 && <span><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1" />{counts.expected} expected</span>}
            {counts.carried > 0 && <span><span className="inline-block w-2 h-2 rounded-full bg-slate-400 mr-1" />{counts.carried} carried forward</span>}
          </div>
          <div className="max-h-[50vh] overflow-y-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-medium text-slate-600">Lead</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-600">Company</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-600">Status</th>
                  <th className="w-20 py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {report.leads.map((lead) => {
                  const color = leadStatusColor(lead);
                  const badge = badgeConfig(color);
                  return (
                    <tr key={lead.lead_id} className={`border-b border-slate-100 border-l-4 ${borderColor(color)}`}>
                      <td className="py-2 px-3 font-medium text-slate-800">
                        {lead.lead_series && <span className="text-slate-500 mr-1">({lead.lead_series})</span>}
                        {lead.lead_name || `Lead #${lead.lead_id}`}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{lead.company || '—'}</td>
                      <td className="py-2 px-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <Button variant="ghost" size="sm" className="text-xs" leftIcon={<ExternalLink size={12} />} onClick={() => { setViewExpectedOrderReport(null); navigate(`/leads/${lead.lead_id}/edit`); }}>
                          Open
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setViewExpectedOrderReport(null)}>Close</Button>
          </div>
        </Modal>
        );
      })()}

      
      </>
      )}
    </PageLayout>
  );
};
