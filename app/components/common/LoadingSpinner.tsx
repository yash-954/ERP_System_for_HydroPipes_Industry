'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export default function LoadingSpinner({ 
  size = 'medium', 
  message = 'Loading...' 
}: LoadingSpinnerProps) {
  const getSpinnerSize = () => {
    switch (size) {
      case 'small':
        return 'w-4 h-4';
      case 'large':
        return 'w-10 h-10';
      case 'medium':
      default:
        return 'w-8 h-8';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`${getSpinnerSize()} border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin`}></div>
      {message && (
        <p className="mt-4 text-gray-600 text-sm">{message}</p>
      )}
    </div>
  );
} 