/**
 * Service module — "New Complaint" modal, opened from the Complaints kanban
 * board so a complaint can be raised without leaving the board.
 */
import React from 'react';
import { Modal } from '../ui/Modal';
import { ServiceComplaintFormFields } from './ServiceComplaintFormFields';
import { ServiceComplaint } from '../../lib/marketing-api';

interface NewComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (complaint: ServiceComplaint) => void;
}

export const NewComplaintModal: React.FC<NewComplaintModalProps> = ({ isOpen, onClose, onCreated }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="New Complaint" contentClassName="max-w-2xl">
    <ServiceComplaintFormFields
      source="customer"
      onCreated={(c) => {
        onCreated(c);
        onClose();
      }}
      onCancel={onClose}
    />
  </Modal>
);
