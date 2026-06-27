import React from 'react';
import { Modal } from './Modal';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ isOpen, onClose, fileUrl, fileName }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={fileName || 'File Preview'} contentClassName="max-w-4xl">
      <div className="w-full h-[75vh]">
        {fileUrl ? (
          <iframe src={fileUrl} className="w-full h-full rounded-lg border border-slate-200" title={fileName} />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">Unable to load preview</div>
        )}
      </div>
    </Modal>
  );
};
