'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorAlertProps {
  message: string | null;
  title?: string;
  onDismiss?: () => void;
}

export default function ErrorAlert({ 
  message, 
  title = 'Error', 
  onDismiss 
}: ErrorAlertProps) {
  if (!message) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-md shadow-sm mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-600" />
        </div>
        <div className="ml-3">
          {title && (
            <h3 className="text-sm font-medium text-red-800">{title}</h3>
          )}
          <div className="mt-1">
            <p className="text-sm text-red-700">{message}</p>
          </div>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              className="inline-flex bg-red-50 rounded-md p-1 text-red-500 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              onClick={onDismiss}
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 