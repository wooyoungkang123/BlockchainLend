import React from "react";

interface CardProps {
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}

export const Card = ({className="", children, ...props}: CardProps) => (
  <div className={`card ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({className="", children, ...props}: CardProps) => (
  <div className={`card-header ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({className="", children, ...props}: CardProps) => (
  <h3 className={`card-title ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({className="", children, ...props}: CardProps) => (
  <p className={`card-description ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({className="", children, ...props}: CardProps) => (
  <div className={`card-content ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({className="", children, ...props}: CardProps) => (
  <div className={`card-footer ${className}`} {...props}>
    {children}
  </div>
);
