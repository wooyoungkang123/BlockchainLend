import React from 'react';

interface LabelProps {
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({
  htmlFor,
  className = '',
  children,
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    >
      {children}
    </label>
  );
};
