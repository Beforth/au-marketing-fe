import React, { useCallback, useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { PageLayout } from '../components/layout/PageLayout';
import { marketingAPI, ReportScopeResponse, ReportSummaryResponse } from '../lib/marketing-api';
import { useApp } from '../App';
import { MessageSquare, Send, UserPlus, Users, RefreshCw } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { showToast } = useApp();
  const [scope, setScope] = useState<ReportScopeResponse | null>(null);
  const [summary, setSummary] = useState<ReportSummaryResponse | null>(null);
  const [loadingScope, setLoadingScope] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(undefined);

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
    loadScope();
  }, []);

  useEffect(() => {
    if (!loadingScope) loadSummary();
  }, [loadingScope, dateFrom, dateTo, selectedEmployeeId]);

  const handleApplyRange = () => {
    loadSummary();
  };


  return (
    <PageLayout
      title="Reports"
      description="Inquiries, quotations, and leads by status. Select date range and, if you're a region or domain head, choose which team member to report on."
    >
      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Date from</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Date to</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
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
    </PageLayout>
  );
};
