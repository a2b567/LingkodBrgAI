import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'flat' | 'highlight';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', className = '', ...props }, ref) => {
    const variantStyles = {
      default:
        'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card rounded-2xl',
      subtle:
        'bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl',
      flat:
        'bg-white dark:bg-slate-900 border border-transparent rounded-2xl',
      highlight:
        'bg-white dark:bg-slate-900 border-2 border-gov-blue-500/30 dark:border-gov-blue-400/30 shadow-card rounded-2xl',
    }[variant];

    return (
      <div
        ref={ref}
        className={`transition-all duration-200 ${variantStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={`text-base font-bold text-slate-900 dark:text-white tracking-tight ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={`text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5 ${className}`}
    {...props}
  >
    {children}
  </p>
);

export const CardContent = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-5 sm:p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 rounded-b-2xl flex items-center justify-end gap-3 ${className}`}
    {...props}
  >
    {children}
  </div>
);
