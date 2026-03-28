import React from 'react';
import { User, Mail, Phone, Building2 } from 'lucide-react';
import { Contact } from '../../lib/marketing-api';
import { cn } from '../../lib/utils';

interface ContactSuggestionProps {
  suggestions: Contact[];
  onSelect: (contact: Contact) => void;
  title?: string;
  className?: string;
  containerClassName?: string;
}

export const ContactSuggestion: React.FC<ContactSuggestionProps> = ({
  suggestions,
  onSelect,
  title = "Did you mean an existing contact?",
  className,
  containerClassName
}) => {
  if (suggestions.length === 0) return null;

  const contactDisplayName = (c: Contact) => {
    const parts = [c.title, c.first_name, c.last_name].filter(Boolean);
    if (parts.length) return parts.join(' ').trim();
    return c.contact_person_name || '';
  };

  return (
    <div className={cn(
      "absolute left-0 right-0 top-full z-[50] mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-150 ring-1 ring-black/5",
      containerClassName
    )}>
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-indigo-100 bg-indigo-50/40 flex items-center gap-2">
        <User size={14} className="text-indigo-500" />
        <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">{title}</span>
      </div>

      {/* Suggestions List */}
      <div className="max-h-56 overflow-auto py-0.5 bg-white">
        {suggestions.map((c) => (
          <button
            key={c.id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(c);
            }}
            className={cn(
              "w-full px-4 py-2 text-left hover:bg-indigo-50/50 flex items-center gap-3 transition-colors group border-b border-slate-50 last:border-0",
              className
            )}
          >
            {/* Info Container */}
            <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
              <div className="min-w-0 flex flex-col">
                <span className="font-bold text-[13px] text-slate-900 truncate group-hover:text-indigo-600 transition-colors leading-tight">
                  {contactDisplayName(c)}
                </span>
                <span className="text-[11px] text-indigo-400 font-medium truncate leading-normal">
                  {c.organization?.name || 'No Organization'}
                </span>
              </div>
              
              <div className="shrink-0 flex flex-col items-end gap-0.5">
                {c.contact_phone && (
                  <span className="text-[11px] font-bold text-slate-600 tabular-nums">
                    {c.contact_phone}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
