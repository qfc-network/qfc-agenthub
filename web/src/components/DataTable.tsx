export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T, index: number) => React.ReactNode);
  className?: string;
  mobileLabel?: boolean;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T>({
  columns,
  data,
  loading,
  onRowClick,
  emptyMessage = 'No data',
}: Props<T>) {
  if (loading) {
    return <div className="flex items-center justify-center py-12 text-qfc-muted">Loading...</div>;
  }

  return (
    <div className="overflow-hidden">
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-qfc-border">
            {columns.map((col, i) => (
              <th
                key={i}
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-qfc-muted ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-qfc-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, ri) => (
              <tr
                key={ri}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-qfc-border/50 transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-qfc-bg-light/50' : ''
                }`}
              >
                {columns.map((col, ci) => (
                  <td key={ci} className={`px-4 py-3 align-top ${col.className ?? ''}`}>
                    {typeof col.accessor === 'function'
                      ? col.accessor(row, ri)
                      : (row[col.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="space-y-3 p-3 md:hidden">
        {data.length === 0 ? (
          <div className="rounded-lg border border-dashed border-qfc-border px-4 py-10 text-center text-sm text-qfc-muted">
            {emptyMessage}
          </div>
        ) : (
          data.map((row, ri) => (
            <div
              key={ri}
              onClick={() => onRowClick?.(row)}
              className={`rounded-lg border border-qfc-border bg-qfc-bg-card p-4 ${
                onRowClick ? 'cursor-pointer active:bg-qfc-bg-light/40' : ''
              }`}
            >
              <div className="space-y-3">
                {columns.map((col, ci) => (
                  <div key={ci} className="flex items-start justify-between gap-3">
                    <div className="min-w-0 shrink-0 text-[11px] font-medium uppercase tracking-wider text-qfc-muted">
                      {col.header}
                    </div>
                    <div className="min-w-0 flex-1 text-right text-sm text-qfc-text break-words">
                      {typeof col.accessor === 'function'
                        ? col.accessor(row, ri)
                        : (row[col.accessor] as React.ReactNode)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
