/**
 * Service module — reports by company, equipment, person and department (SRS RPT-04).
 * Route: /service/reports
 */
import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SegmentToggle } from '../components/ui/SegmentToggle';
import { PageLayout } from '../components/layout/PageLayout';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { Download, PieChart } from 'lucide-react';
import { marketingAPI, ServiceReportSummary } from '../lib/marketing-api';

type GroupBy = ServiceReportSummary['group_by'];

const GROUPS: { value: GroupBy; label: string; hint: string; first: string }[] = [
  { value: 'company', label: 'By company', hint: 'Contracts, visits, work orders and complaints for each customer.', first: 'Company' },
  { value: 'equipment', label: 'By equipment', hint: 'Parts and material listed on work orders, grouped by name — which are used most, and where.', first: 'Equipment / part' },
  { value: 'person', label: 'By person', hint: 'Visits by engineer, and complaints by the person they are assigned to (with planned vs actual hours).', first: 'Person' },
  { value: 'department', label: 'By department', hint: 'Work orders sent to, and complaints assigned to, each department.', first: 'Department' },
];

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export const ServiceReportsPage: React.FC = () => {
  const { showToast } = useApp();
  const canView = useAppSelector(selectHasPermission('service.view'));

  const [groupBy, setGroupBy] = useState<GroupBy>('company');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState<ServiceReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!canView) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    marketingAPI
      .getServiceReportSummary({ group_by: groupBy, date_from: dateFrom || undefined, date_to: dateTo || undefined })
      .then(setData)
      .catch((e) => {
        showToast(e?.message || 'Failed to load the report', 'error');
        setData(null);
      })
      .finally(() => setIsLoading(false));
  }, [canView, groupBy, dateFrom, dateTo, showToast]);

  const current = GROUPS.find((g) => g.value === groupBy)!;

  const exportCsv = () => {
    if (!data) return;
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [
      [current.first, ...data.columns.map((c) => c.label)].map(esc).join(','),
      ...data.rows.map((r) => [r.label, ...data.columns.map((c) => fmt(r.values[c.key] ?? 0))].map(esc).join(',')),
      ['Total', ...data.columns.map((c) => fmt(data.totals[c.key] ?? 0))].map(esc).join(','),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `service-report-${groupBy}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const breadcrumbs = [{ label: 'Service', href: '/service/contracts' }, { label: 'Reports' }];

  if (!canView) {
    return (
      <PageLayout title="Service Reports" breadcrumbs={breadcrumbs}>
        <Card><p className="text-slate-600">You do not have permission to view this.</p></Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Service Reports" description={current.hint} breadcrumbs={breadcrumbs}>
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm px-5 py-3 mb-4 flex flex-wrap items-end gap-3">
        <SegmentToggle
          options={GROUPS.map((g) => ({ value: g.value, label: g.label }))}
          value={groupBy}
          onChange={(v) => setGroupBy(v as GroupBy)}
          layoutId="service-report-group"
        />
        <div className="w-40"><Input label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
        <div className="w-40"><Input label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div>
        {(dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>Clear dates</Button>
        )}
        <div className="flex-1" />
        <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={exportCsv} disabled={!data || data.rows.length === 0}>
          Export CSV
        </Button>
      </div>

      <Card noPadding contentClassName="py-0" className="overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : !data || data.rows.length === 0 ? (
          <div className="py-24 text-center">
            <PieChart className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-900 font-semibold">Nothing to show</p>
            <p className="text-slate-500 text-sm mt-2">No service activity matches this view{dateFrom || dateTo ? ' for these dates' : ''}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left py-3 px-4">{current.first}</th>
                  {data.columns.map((c) => (
                    <th key={c.key} className="text-right py-3 px-4 whitespace-nowrap">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.rows.map((r) => (
                  <tr key={r.label} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 font-medium text-slate-800">{r.label}</td>
                    {data.columns.map((c) => (
                      <td key={c.key} className="py-2.5 px-4 text-right text-slate-600 tabular-nums">{fmt(r.values[c.key] ?? 0)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50/60 font-semibold text-slate-800">
                  <td className="py-3 px-4">Total</td>
                  {data.columns.map((c) => (
                    <td key={c.key} className="py-3 px-4 text-right tabular-nums">{fmt(data.totals[c.key] ?? 0)}</td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </PageLayout>
  );
};
