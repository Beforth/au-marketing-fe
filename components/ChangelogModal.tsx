import React from 'react';
import { Modal } from './ui/Modal';
import { changelog } from '../lib/changelog';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  const entry = changelog[0];
  if (!entry) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${entry.version} Changelog`}>
      <div className="space-y-4 text-sm text-slate-700 max-h-[60vh] overflow-y-auto pr-2">
        {entry.sections.map((section) => (
          <div key={section.title}>
            <h4 className="font-semibold text-slate-900 mb-1">{section.title}</h4>
            <ul className="list-disc pl-4 space-y-1">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
};
