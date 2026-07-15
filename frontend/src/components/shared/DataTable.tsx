import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  meta?: {
    page: number;
    totalPages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange?: (page: number) => void;
  onSort?: (key: string, order: 'asc' | 'desc') => void;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No records found',
  meta,
  onPageChange,
  onSort,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    const newOrder = sortKey === key && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortOrder(newOrder);
    onSort?.(key, newOrder);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left data-table-header',
                    col.sortable && 'cursor-pointer hover:text-foreground select-none',
                    col.className
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="flex flex-col ml-1">
                        <ChevronUp
                          className={cn('h-3 w-3', sortKey === col.key && sortOrder === 'asc' ? 'text-amber-400' : 'text-muted-foreground/50')}
                        />
                        <ChevronDown
                          className={cn('h-3 w-3 -mt-1', sortKey === col.key && sortOrder === 'desc' ? 'text-amber-400' : 'text-muted-foreground/50')}
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                    Loading...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-muted-foreground text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-border/30 hover:bg-muted/20 transition-colors duration-150 animate-fade-in"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 text-sm', col.className)}>
                      {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Total: {meta.total} records
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange?.(1)}
              disabled={!meta.hasPrev}
              className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange?.(meta.page - 1)}
              disabled={!meta.hasPrev}
              className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1.5 rounded bg-amber-500/20 text-amber-400 font-medium">
              {meta.page} / {meta.totalPages}
            </span>
            <button
              onClick={() => onPageChange?.(meta.page + 1)}
              disabled={!meta.hasNext}
              className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange?.(meta.totalPages)}
              disabled={!meta.hasNext}
              className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
