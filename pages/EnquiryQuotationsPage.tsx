/**
 * Quotations (enquiry attachments) created by the current user.
 * Shows which lead and which inquiry each quotation belongs to.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { marketingAPI, QuotationListItem } from '../lib/marketing-api';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { Download, ExternalLink, Loader2 } from 'lucide-react';

export const EnquiryQuotationsPage: React.FC = () => {
  const navigate = useNavigate();
  const canViewLead = useAppSelector(selectHasPermission('marketing.lead.view'));
  const [quotations, setQuotations] = useState<QuotationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canViewLead) return;
    setLoading(true);
    marketingAPI
      .getMyQuotations()
      .then(setQuotations)
      .catch(() => setQuotations([]))
      .finally(() => setLoading(false));
  }, [canViewLead]);

  const handleDownload = (leadId: number, activityId: number, attachmentId: number, fileName: string) => {
    marketingAPI.downloadLeadActivityAttachment(leadId, activityId, attachmentId, fileName);
  };

  if (!canViewLead) {
    return (
      <PageLayout title="Quotations" description="Quotations uploaded in enquiry logs.">
        <p className="text-sm text-slate-500">You do not have permission to view quotations.</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Quotations"
      description="Quotations you uploaded in enquiry logs. Each row shows the lead and inquiry it belongs to."
    >
      <Card>
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-slate-500">
            <Loader2 size={18} className="animate-spin" /> Loading…
          </div>
        ) : quotations.length === 0 ? (
          <p className="py-8 text-sm text-slate-500">No quotations yet. Add quotations in a lead’s History tab (enquiry log).</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="pb-2 pr-4 font-semibold text-slate-700">Quotation no.</th>
                  <th className="pb-2 pr-4 font-semibold text-slate-700">File</th>
                  <th className="pb-2 pr-4 font-semibold text-slate-700">Lead</th>
                  <th className="pb-2 pr-4 font-semibold text-slate-700">Inquiry</th>
                  <th className="pb-2 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => (
                  <tr key={q.id} className="border-b border-slate-100">
                    <td className="py-2.5 pr-4 font-medium text-slate-800">{q.quotation_number || '—'}</td>
                    <td className="py-2.5 pr-4 text-slate-600">{q.file_name}</td>
                    <td className="py-2.5 pr-4">
                      <span className="text-slate-700">{q.lead_series || '—'}</span>
                      <span className="text-slate-500 ml-1">({q.lead_name || '—'})</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="text-slate-700">#{q.inquiry_number ?? '—'}</span>
                      <span className="text-slate-500 ml-1 truncate max-w-[120px] inline-block" title={q.activity_title}>
                        {q.activity_title}
                      </span>
                    </td>
                    <td className="py-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownload(q.lead_id, q.activity_id, q.id, q.file_name)}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                      >
                        <Download size={14} /> Download
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/leads/${q.lead_id}/edit?tab=history`)}
                        className="inline-flex items-center gap-1 text-slate-600 hover:underline"
                        title="Open lead enquiry"
                      >
                        <ExternalLink size={14} /> Lead
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageLayout>
  );
};
