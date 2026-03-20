import React, { useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/SearchInput';
import {
  HelpCircle, BookOpen, FileQuestion, ArrowRight, ExternalLink,
  Layers, Users, ShoppingCart, BarChart2, FileText, Settings,
  Globe, Briefcase, ChevronRight, ChevronDown,
} from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { AnimatePresence, motion } from 'framer-motion';

const DOCS_BASE = 'https://docy-lake.vercel.app/marketing-guide';

const MODULES = [
  {
    id: 'leads',
    label: 'Leads',
    icon: Briefcase,
    anchor: '#m-leads',
    faqs: [
      {
        q: 'How do I create a new lead?',
        a: 'Go to Leads and click "New lead". Link a Contact or Customer, select Domain & Region, choose a number series, fill in Lead type, Lead through (e.g. Cold Calling, Website), and an optional potential value. Click Save — a Lead No. is auto-generated.',
        anchor: '#4-2-creating-a-new-lead',
      },
      {
        q: 'How do I move a lead through the pipeline?',
        a: 'In Kanban view, drag the lead card from one status column to another (e.g. New → Quote generated). Won and Lost leads are final. If the target status requires extra info, a form will appear.',
        anchor: '#4-4-moving-a-lead-through-the-pipeline-kanban',
      },
      {
        q: 'How do I mark a lead as Won?',
        a: 'Move the lead to Won in Kanban and enter the Closed value when prompted. The lead becomes final and cannot be dragged further.',
        anchor: '#4-6-marking-a-lead-as-won',
      },
      {
        q: 'How do I mark a lead as Lost?',
        a: 'Use the "Mark as Lost" action on the lead. Enter Competitor name and Lost at price (choose "Not sure" if unknown). The lead moves to Lost status permanently.',
        anchor: '#4-5-marking-a-lead-as-lost',
      },
      {
        q: 'How do I set a follow-up reminder?',
        a: 'Open the lead and set the "Next follow-up date" field. Use the Activities (Enquiry log) section to log calls, meetings, and notes — these appear in lead detail and reports.',
        anchor: '#4-7-follow-up-and-activities',
      },
    ],
  },
  {
    id: 'quotations',
    label: 'Quotations',
    icon: FileText,
    anchor: '#m-quotations',
    faqs: [
      {
        q: 'How do I view quotations?',
        a: 'Click Quotations in the sidebar. You see the list with lead reference, date, and status. Use search or filters if available on the page.',
        anchor: '#5-1-viewing-quotations',
      },
      {
        q: 'How do I create a quotation?',
        a: 'From Quotations, click "New quotation", or open a lead and add a quotation from there. Select the Lead, fill in quote details (products, amounts, validity), and save. The lead status may update to "Quote generated" automatically.',
        anchor: '#5-2-creating-or-editing-a-quotation-if-available',
      },
    ],
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: ShoppingCart,
    anchor: '#m-orders',
    faqs: [
      {
        q: 'How do I create a new order?',
        a: 'Go to Orders and click "New order". Link it to a Won lead, choose the number series, enter Order value and Region, and save. The order number is auto-generated and cannot be changed later.',
        anchor: '#6-2-creating-a-new-order',
      },
      {
        q: 'How do I update an order status?',
        a: 'In Kanban view, drag the order card to a new status column (e.g. Pending → Drawing Approved). Won and Lost orders are final and cannot be dragged.',
        anchor: '#6-3-editing-an-order-and-moving-status-kanban',
      },
    ],
  },
  {
    id: 'database',
    label: 'Database',
    icon: Users,
    anchor: '#m-database',
    faqs: [
      {
        q: 'How do I add an Organization?',
        a: 'Go to Database → Organizations, click "New organization", enter Name, Code, Industry and other fields. In the Plants tab add plants (Main Plant, North Unit, etc.) with name, code, and address.',
        anchor: '#7-1-organizations',
      },
      {
        q: 'How do I convert a Contact to a Customer?',
        a: 'Open the Contact, then use the "Convert to customer" action (visible if you have permission). This creates a Customer record linked to the same contact.',
        anchor: '#7-2-contacts',
      },
      {
        q: 'How do I link an Organization to a Lead?',
        a: 'When creating or editing a lead, select a Contact or Customer already linked to an Organization and Plant. That context flows through to the lead, reports, and filters automatically.',
        anchor: '#7-4-using-organizations-and-plants-when-creating-leads',
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart2,
    anchor: '#m-reports',
    faqs: [
      {
        q: 'How do I run a report?',
        a: 'Click Reports in the sidebar and select the report type (e.g. Expected Orders or OD Plan). Set your date range, domain, and region. For OD Plan, select Year and Month. The report loads for your scope and permissions.',
        anchor: '#8-1-opening-reports',
      },
      {
        q: 'How do I create a custom Report Template?',
        a: 'Go to Report Templates and click "New report template". Add sections with a Title and a SQL SELECT query. Use placeholders like {{date_from}}, {{date_to}}, {{domain_id}}, {{lead_id}} in the query. Assign the template to users so they can access it.',
        anchor: '#9-4-creating-or-editing-a-report-template-if-you-have-permission',
      },
      {
        q: 'How do I search, filter, and sort within a report?',
        a: 'Each report section has a "Search in section" box for full-text search. Use "Filter by column" and a value to narrow rows. Click a column header to sort — first click ascending, second descending.',
        anchor: '#9-3-using-each-section-search-filter-sort',
      },
    ],
  },
  {
    id: 'domains',
    label: 'Domains & Regions',
    icon: Globe,
    anchor: '#m-domains',
    faqs: [
      {
        q: 'How do I add a Region to a Domain?',
        a: 'Go to Domains, expand the domain, and use "Add region". Enter the Name, Code, and optionally a Region Head (employee). Save — the region is now available when creating leads or filtering reports.',
        anchor: '#3-3-creating-or-editing-a-region-if-you-have-permission',
      },
      {
        q: 'How do I assign an employee to a Region?',
        a: 'In Domains, open the domain/region view and use "Assign employee". Select the employee and role (e.g. Region Head). Save — they will now see that region in their scope for leads and reports.',
        anchor: '#3-4-assigning-employees-to-regions-if-you-have-permission',
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    anchor: '#10-1-settings',
    faqs: [
      {
        q: 'How do I connect my Gmail account?',
        a: 'Go to Settings → Profile, scroll to Integrations, and click "Connect Account" under Gmail. You will be redirected to Google to authorize. Once done, your email appears and automated follow-ups can be sent from it.',
        anchor: '#10-1-settings',
      },
      {
        q: 'Where do I manage Numbering Series?',
        a: 'Go to Settings → Numbering Series (admin only). Configure the prefix and sequence for Lead, Order, and other numbers. These control what IDs are auto-generated when new records are created.',
        anchor: '#10-2-numbering-series-admin',
      },
    ],
  },
];

export const SupportPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

  const filtered = useMemo(() => {
    if (!search.trim()) return MODULES;
    const q = search.toLowerCase();
    return MODULES.map(m => ({
      ...m,
      faqs: m.faqs.filter(f =>
        f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
      ),
    })).filter(m => m.faqs.length > 0);
  }, [search]);

  const breadcrumbs = [{ label: 'Support', href: '/support' }];

  return (
    <PageLayout
      title="Help Center"
      description="Find answers and step-by-step guides for every module."
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-6">

        {/* Quick Launch */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Full User Guide', icon: BookOpen, desc: 'Complete step-by-step documentation for every module.', href: DOCS_BASE },
            { title: 'Getting Started', icon: Layers, desc: 'Login, dashboard overview, and first steps.', href: `${DOCS_BASE}#m-getting-started` },
            { title: 'Schema Reference', icon: FileQuestion, desc: 'Table and column reference for custom report templates.', href: `${DOCS_BASE}#9-5-schema-reference` },
          ].map((item) => (
            <a key={item.title} href={item.href} target="_blank" rel="noopener noreferrer" className="block group">
              <Card className="hover:-translate-y-1 transition-all duration-200 h-full">
                <div className="flex flex-col gap-4 h-full">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                    <item.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[13px] font-bold text-slate-900 tracking-tight mb-1">{item.title}</h3>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-600 group-hover:gap-2.5 transition-all">
                    Open guide <ExternalLink size={11} />
                  </div>
                </div>
              </Card>
            </a>
          ))}
        </div>

        {/* Search */}
        <SearchInput
          placeholder="Search help articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />

        {/* Module FAQ Sections */}
        <div className="space-y-3">
          {filtered.map((module) => (
            <div
              key={module.id}
              className="bg-white border border-slate-200/50 rounded-[1.25rem] shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_40px_-15px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-200"
            >
              {/* Module Header Row */}
              <button
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors text-left"
                onClick={() => toggle(module.id)}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <module.icon size={15} />
                </div>
                <span className="text-[13px] font-bold text-slate-900 tracking-tight flex-1">{module.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{module.faqs.length} articles</span>
                  <a
                    href={`${DOCS_BASE}${module.anchor}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-indigo-500 transition-colors"
                    onClick={e => e.stopPropagation()}
                    title="Open in docs"
                  >
                    <ExternalLink size={12} />
                  </a>
                  <motion.div
                    animate={{ rotate: open[module.id] ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  >
                    <ChevronDown size={14} className="text-slate-400" />
                  </motion.div>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {open[module.id] && (
                  <motion.div
                    key="faq"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="border-t border-slate-100 divide-y divide-slate-100">
                      {module.faqs.map((faq, i) => (
                        <div key={i} className="px-6 py-5 bg-slate-50/30 flex items-start gap-4">
                          <HelpCircle size={13} className="text-slate-300 mt-0.5 shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <p className="text-[13px] font-bold text-slate-900 tracking-tight">{faq.q}</p>
                            <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{faq.a}</p>
                            <a
                              href={`${DOCS_BASE}${faq.anchor}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 transition-colors mt-1"
                            >
                              Full documentation <ArrowRight size={10} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-24 text-center">
              <p className="text-slate-900 font-semibold">No articles found</p>
              <p className="text-slate-500 text-sm mt-1">Try a different search term.</p>
            </div>
          )}
        </div>

        {/* Permission Note */}
        <div className="flex items-start gap-3 px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50">
          <HelpCircle size={15} className="text-slate-300 shrink-0 mt-0.5" />
          <p className="text-[12px] font-medium text-slate-500">
            If a menu item or action is missing, your user role may not have the required permission.{' '}
            <span className="text-slate-700 font-bold">Contact your administrator</span> to request access.
          </p>
        </div>

      </div>
    </PageLayout>
  );
};
