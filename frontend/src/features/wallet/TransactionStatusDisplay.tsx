import React from 'react';
import { StatusIcon } from './StatusIcon';

interface TransactionStatusDisplayProps {
  status: 'success' | 'pending' | 'warning' | 'error' | 'info';
  title?: string;
  message?: string;
  icon?: 'sm' | 'md' | 'lg';
}

export const TransactionStatusDisplay: React.FC<TransactionStatusDisplayProps> = ({
  status,
  title,
  message,
  icon = 'md'
}) => {
  return (
    <div className="status-indicator">
      <StatusIcon status={status} size={icon} />
      
      {title && (
        <div className="status-label">
          {title}
        </div>
      )}
      
      {message && (
        <div className="text-sm text-gray-500 text-center max-w-md mx-auto mt-2">
          {message}
        </div>
      )}
    </div>
  );
}; 