import React, { useEffect, useState, useCallback } from 'react';
import { Modal } from './ui/Modal';
import { marketingAPI, ChangelogVersionResponse } from '../lib/marketing-api';
import { RefreshCw, AlertCircle, Calendar, Sparkles, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/Button';

interface VersionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VersionsModal: React.FC<VersionsModalProps> = ({ isOpen, onClose }) => {
  const [versions, setVersions] = useState<ChangelogVersionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await marketingAPI.getWhatsNew();
      setVersions(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch versions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
      // Reset showAll when modal is opened
      setShowAll(false);
    }
  }, [isOpen, fetchVersions]);

  // Simple Markdown Compile helper for bold (**text**) and code (`text`)
  const parseMarkdown = (text: string): React.ReactNode => {
    if (!text) return '';
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-extrabold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={idx} className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-800">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const displayedVersions = showAll ? versions : versions.slice(0, 1);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="What's New (Versions)"
      contentClassName="max-w-4xl"
      footer={
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
            className="shadow-lg shadow-blue-500/10 rounded-xl"
          >
            Looks good, thanks!
          </Button>
        </div>
      }
    >
      <div className="space-y-6 text-sm text-slate-700 max-h-[65vh] overflow-y-auto pr-3 scrollbar-thin">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw size={24} className="animate-spin text-blue-500" />
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Loading version logs…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-red-100 bg-red-50/50 gap-4 text-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Failed to load versions</h3>
              <p className="text-xs text-slate-500 max-w-sm">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchVersions}
              leftIcon={<RefreshCw size={12} />}
              className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
            >
              Retry
            </Button>
          </div>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 mb-3 border border-slate-200 border-dashed">
              <Calendar size={20} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">No version history</p>
            <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase">Updates will appear here as they release</p>
          </div>
        ) : (
          <div className="space-y-8">
            {displayedVersions.map((v, idx) => (
              <div key={v.id} className="space-y-4 animate-in fade-in duration-300">
                {/* Version & Date Header */}
                <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                  <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-100 rounded-lg">
                    Version {v.version}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Calendar size={12} className="text-slate-300" />
                    {v.release_date} {idx === 0 && <span className="text-blue-500 font-extrabold text-[9px] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded ml-1 tracking-widest">LATEST</span>}
                  </span>
                </div>

                {/* Section Lists */}
                <div className="space-y-6 pl-4 border-l-2 border-slate-100/80">
                  {v.sections.map((section) => (
                    <section key={section.title} className="space-y-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        {section.title.toLowerCase().includes('bug') ? (
                          <Bug size={13} className="text-rose-500 animate-pulse" />
                        ) : (
                          <Sparkles size={13} className="text-amber-500" />
                        )}
                        {section.title}
                      </h4>
                      <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs leading-relaxed font-medium">
                        {section.items.map((item, itemIdx) => (
                          <li key={itemIdx}>{parseMarkdown(item)}</li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </div>
            ))}

            {/* Toggle Show All History Button */}
            {versions.length > 1 && (
              <div className="flex justify-center pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-all flex items-center gap-1.5 py-2 px-4 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-100 active:scale-[0.98]"
                >
                  {showAll ? (
                    <>
                      <ChevronUp size={14} />
                      Show newest release only
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} />
                      Show older release history ({versions.length - 1} more)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
