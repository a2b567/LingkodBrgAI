import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Inbox size={36} className="text-slate-400 dark:text-slate-500" />,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-subtle border border-slate-100 dark:border-slate-700">
        {icon}
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
          {title}
        </h4>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
