import React from 'react';
import { Card } from './Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  variant?: 'blue' | 'gold' | 'emerald' | 'rose' | 'slate';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'blue',
}) => {
  const colorMap = {
    blue: {
      iconBg: 'bg-gov-blue-50 dark:bg-gov-blue-950/60 text-gov-blue-600 dark:text-gov-blue-400 border-gov-blue-200/60 dark:border-gov-blue-800/60',
      accent: 'text-gov-blue-600 dark:text-gov-blue-400',
    },
    gold: {
      iconBg: 'bg-gov-gold-50 dark:bg-gov-gold-950/60 text-gov-gold-600 dark:text-gov-gold-400 border-gov-gold-200/60 dark:border-gov-gold-800/60',
      accent: 'text-gov-gold-600 dark:text-gov-gold-400',
    },
    emerald: {
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60',
      accent: 'text-emerald-600 dark:text-emerald-400',
    },
    rose: {
      iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60',
      accent: 'text-rose-600 dark:text-rose-400',
    },
    slate: {
      iconBg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      accent: 'text-slate-700 dark:text-slate-300',
    },
  }[variant];

  return (
    <Card className="p-5 hover:shadow-card-hover transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1.5 pt-1 text-xs">
              <span
                className={`font-bold ${
                  trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              {trend.label && (
                <span className="text-slate-400 dark:text-slate-500 font-medium">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div
            className={`p-3 rounded-xl border shrink-0 flex items-center justify-center ${colorMap.iconBg}`}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
