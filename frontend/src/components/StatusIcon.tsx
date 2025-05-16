import React from 'react';

interface StatusIconProps {
  status: 'success' | 'pending' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusIcon: React.FC<StatusIconProps> = ({ 
  status, 
  size = 'md',
  className = '' 
}) => {
  const sizeClass = {
    sm: 'w-6 h-6',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  }[size];

  const renderIcon = () => {
    switch (status) {
      case 'success':
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`transaction-icon text-green-500 ${sizeClass} ${className}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
              clipRule="evenodd" 
            />
          </svg>
        );
      case 'pending':
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`transaction-icon text-blue-500 animate-spin ${sizeClass} ${className}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`transaction-icon text-yellow-500 ${sizeClass} ${className}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM10 11a1 1 0 00-1 1v1a1 1 0 002 0v-1a1 1 0 00-1-1zm0-7a1 1 0 00-1 1v3a1 1 0 002 0V5a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
        );
      case 'error':
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`transaction-icon text-red-500 ${sizeClass} ${className}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`transaction-icon text-blue-500 ${sizeClass} ${className}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
        );
    }
  };

  return renderIcon();
}; 