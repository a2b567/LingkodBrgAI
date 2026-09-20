import React from 'react';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className = '', containerClassName = '', children, ...props }, ref) => (
    <div
      className={`w-full overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle ${containerClassName}`}
    >
      <table
        ref={ref}
        className={`w-full text-left text-sm border-collapse ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  )
);
Table.displayName = 'Table';

export const TableHeader = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead
    className={`bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider ${className}`}
    {...props}
  >
    {children}
  </thead>
);

export const TableBody = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody
    className={`divide-y divide-slate-100 dark:divide-slate-800/60 ${className}`}
    {...props}
  >
    {children}
  </tbody>
);

export const TableRow = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${className}`}
    {...props}
  >
    {children}
  </tr>
);

export const TableHead = ({
  className = '',
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={`px-4 sm:px-6 py-3.5 font-semibold ${className}`}
    {...props}
  >
    {children}
  </th>
);

export const TableCell = ({
  className = '',
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td
    className={`px-4 sm:px-6 py-3.5 text-slate-700 dark:text-slate-200 align-middle ${className}`}
    {...props}
  >
    {children}
  </td>
);
