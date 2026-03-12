export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T, index: number) => React.ReactNode);
  className?: string;
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
    return (
      <div className="flex items-center justify-center py-12 text-qfc-muted">
        Loading...
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-qfc-border">
            {columns.map((col, i) => (
              <th
                key={i}
                className={`text-left py-3 px-4 text-xs uppercase tracking-wider text-qfc-muted font-medium ${col.className ?? ''}`}
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
                  <td key={ci} className={`py-3 px-4 ${col.className ?? ''}`}>
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
    </div>
  );
}
