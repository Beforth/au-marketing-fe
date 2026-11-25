import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit } from 'lucide-react';

export interface DrawerField {
  label: string;
  value?: React.ReactNode;
  /** Group heading; fields with the same section sit together (order of first appearance) */
  section?: string;
  /** Makes the value a link (mailto:, tel:, https://) */
  href?: string;
}

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Small pill next to the title, e.g. "Active" */
  status?: { label: string; tone: 'green' | 'slate' | 'blue' };
  /** Label/value rows, grouped into sections */
  fields?: DrawerField[];
  /** Custom body instead of (or after) the field rows */
  children?: React.ReactNode;
  /** Max width of the panel (CSS value). Default 32rem */
  width?: string;
  /** Extra controls in the header, left of the close button (e.g. Prev / Next) */
  headerActions?: React.ReactNode;
  /** Shows an Edit button in the footer when given */
  onEdit?: () => void;
}

const TONES = {
  green: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  slate: 'text-slate-600 bg-slate-100 border-slate-200',
  blue: 'text-blue-700 bg-blue-50 border-blue-200',
};

const empty = (v: DrawerField['value']) => v === undefined || v === null || v === '';

/** Panel that slides in from the right. Pass `fields` for read-only details, or `children` for custom content. */
export const DetailDrawer: React.FC<DetailDrawerProps> = (props) => {
  const { open, onClose, width = '32rem', headerActions } = props;
  // Keep the last content while the exit animation plays (callers often clear their selection on close)
  const last = useRef(props);
  if (open) last.current = props;
  const { title, subtitle, status, fields = [], children, onEdit } = last.current;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const sections: { name: string; items: DrawerField[] }[] = [];
  fields.forEach((f) => {
    const name = f.section || 'Details';
    let s = sections.find((x) => x.name === name);
    if (!s) sections.push((s = { name, items: [] }));
    s.items.push(f);
  });

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            className="relative w-full h-full bg-white shadow-2xl flex flex-col"
            style={{ maxWidth: width }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          >
            <div className="flex items-start gap-3 px-6 py-5 border-b border-slate-200 bg-slate-50/60">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-semibold">
                {(title || '?').trim().charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-slate-900 truncate">{title || '—'}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  {subtitle && <p className="text-sm text-slate-500 truncate">{subtitle}</p>}
                  {status && (
                    <span className={`shrink-0 text-xs font-semibold border px-2 py-0.5 rounded-full ${TONES[status.tone]}`}>
                      {status.label}
                    </span>
                  )}
                </div>
              </div>
              {headerActions}
              <button onClick={onClose} aria-label="Close" className="p-1.5 -mr-1 text-slate-500 hover:bg-slate-200/60 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {sections.map((s) => (
                <section key={s.name}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{s.name}</h3>
                  <dl className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                    {s.items.map((f) => (
                      <div key={f.label} className="flex gap-4 px-4 py-2.5">
                        <dt className="w-32 shrink-0 text-sm text-slate-500">{f.label}</dt>
                        <dd className="min-w-0 flex-1 text-sm text-slate-900 break-words whitespace-pre-line">
                          {empty(f.value) ? (
                            <span className="text-slate-300">—</span>
                          ) : f.href ? (
                            <a href={f.href} target={f.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="text-blue-600 hover:underline">
                              {f.value}
                            </a>
                          ) : (
                            f.value
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
              {children}
            </div>

            {onEdit && (
              <div className="px-6 py-4 border-t border-slate-200 bg-white">
                <button
                  onClick={onEdit}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                >
                  <Edit size={15} /> Edit
                </button>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
