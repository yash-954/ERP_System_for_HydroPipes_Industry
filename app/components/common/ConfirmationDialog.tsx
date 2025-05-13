'use client';

import React from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

type ConfirmationType = 'danger' | 'warning' | 'success';

interface ConfirmationDialogProps {
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

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  type = 'warning',
  onConfirm,
  onCancel,
  isProcessing = false
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-50',
          textHeading: 'text-red-800',
          textMessage: 'text-red-700',
          icon: <AlertCircle className="h-5 w-5 text-red-400" />,
          confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          cancelButton: 'text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50',
          textHeading: 'text-amber-800',
          textMessage: 'text-amber-700',
          icon: <AlertCircle className="h-5 w-5 text-amber-400" />,
          confirmButton: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
          cancelButton: 'text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500'
        };
      case 'success':
        return {
          bg: 'bg-green-50',
          textHeading: 'text-green-800',
          textMessage: 'text-green-700',
          icon: <CheckCircle className="h-5 w-5 text-green-400" />,
          confirmButton: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
          cancelButton: 'text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500'
        };
      default:
        return {
          bg: 'bg-amber-50',
          textHeading: 'text-amber-800',
          textMessage: 'text-amber-700',
          icon: <AlertCircle className="h-5 w-5 text-amber-400" />,
          confirmButton: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
          cancelButton: 'text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

        {/* This element centers the modal contents. */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className={`${styles.bg} px-4 pt-5 pb-4 sm:p-6 sm:pb-4`}>
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10">
                {styles.icon}
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className={`text-lg leading-6 font-medium ${styles.textHeading}`} id="modal-title">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className={`text-sm ${styles.textMessage}`}>
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${styles.confirmButton} text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm`}
              onClick={onConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : confirmLabel}
            </button>
            <button
              type="button"
              className={`mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 ${styles.cancelButton} text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm`}
              onClick={onCancel}
              disabled={isProcessing}
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 