import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Message as MessageType } from '@/types';

interface ResultTableProps {
  message: MessageType;
}

type SortDirection = 'asc' | 'desc' | null;

export default function ResultTable({ message }: ResultTableProps) {
  const results = message.results || [];
  const columns = message.columns || [];
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return results;
    const q = searchQuery.toLowerCase();
    return results.filter((row) =>
      columns.some((col) => String(row[col] ?? '').toLowerCase().includes(q))
    );
  }, [results, columns, searchQuery]);

  const sorted = useMemo(() => {
    if (!sortColumn || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortColumn, sortDir]);

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'));
      if (sortDir === 'desc') setSortColumn(null);
    } else {
      setSortColumn(col);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortColumn !== col) return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />;
    if (sortDir === 'asc') return <ArrowUp className="h-3.5 w-3.5" />;
    if (sortDir === 'desc') return <ArrowDown className="h-3.5 w-3.5" />;
    return null;
  };

  if (!columns.length) return null;

  return (
    <div className="mt-3 overflow-hidden rounded-lg border">
      <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search results..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-7 border-0 bg-transparent px-0 text-xs focus-visible:ring-0"
        />
      </div>
      <div className="custom-scrollbar max-h-80 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/80">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="cursor-pointer px-4 py-2.5 text-left text-xs font-medium text-muted-foreground select-none hover:text-foreground"
                >
                  <div className="flex items-center gap-1">
                    {col}
                    <SortIcon col={col} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={i} className="border-t transition-colors hover:bg-accent/30">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2.5">
                    {String(row[col] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
        {sorted.length} {sorted.length === 1 ? 'row' : 'rows'}
        {searchQuery && ` (filtered from ${results.length})`}
      </div>
    </div>
  );
}
