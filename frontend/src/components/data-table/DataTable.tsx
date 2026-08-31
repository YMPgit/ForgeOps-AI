import { cn } from '@/lib/utils';

interface DataTableProps<TData> {
  data: TData[];
  columns: {
    key: string;
    header: string;
    cell?: (row: TData) => React.ReactNode;
  }[];
  className?: string;
}

export default function DataTable<TData>({ data, columns, className }: DataTableProps<TData>) {
  return (
    <div className={cn('rounded-lg border', className)}>
      <div className="custom-scrollbar overflow-auto max-h-[500px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/80">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t transition-colors hover:bg-accent/30">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2.5">
                    {col.cell ? col.cell(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
        {data.length} {data.length === 1 ? 'row' : 'rows'}
      </div>
    </div>
  );
}
