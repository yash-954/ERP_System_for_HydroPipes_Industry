'use client';

import React from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

type ConfirmationType = 'danger' | 'warning' | 'success';

interface UserConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  type?: ConfirmationType;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export default function UserConfirmationDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  type = 'warning',
  onConfirm,
  onCancel,
  isProcessing = false
}: UserConfirmationDialogProps) {
  if (!isOpen) return null;

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertCircle className="text-red-500" />;
      case 'warning':
        return <AlertCircle className="text-amber-500" />;
      case 'success':
        return <CheckCircle className="text-green-500" />;
      default:
        return <AlertCircle className="text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="confirmation-dialog">
        <div className="flex items-start">
          <div className="mr-3">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 className="confirmation-title">
              {title}
            </h3>
            <p className="confirmation-message">
              {message}
            </p>
          </div>
        </div>
        
        <div className="confirmation-actions">
          <button
            className="cancel-button"
            onClick={onCancel}
            disabled={isProcessing}
          >
            {cancelLabel}
          </button>
          <button
            className="confirm-button"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
} 