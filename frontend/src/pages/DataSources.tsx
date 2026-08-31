import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Database, Table2, CheckCircle2, RotateCcw, FileCode, Layers, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDatasourceInfo, useSchema, useUploadDatasource, useResetDatasource } from '@/hooks/useQuery';
import DataTable from '@/components/data-table/DataTable';
import { useToast } from '@/components/ui/toast';

export default function DataSources() {
  const { data: datasource, isLoading: dsLoading } = useDatasourceInfo();
  const { data: schema, isLoading: schemaLoading } = useSchema();
  const uploadMutation = useUploadDatasource();
  const resetMutation = useResetDatasource();
  const { toast } = useToast();

  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tables = schema?.tables || [];

  // Automatically select the first table if none is selected
  useEffect(() => {
    if (tables.length > 0 && (!selectedTable || !tables.some((t) => t.name === selectedTable))) {
      setSelectedTable(tables[0].name);
    } else if (tables.length === 0) {
      setSelectedTable(null);
    }
  }, [tables, selectedTable]);

  const processFile = async (file: File) => {
    const validExtensions = ['.csv', '.xlsx', '.xls', '.json', '.db', '.sqlite', '.sqlite3'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      toast({
        title: 'Invalid file format',
        description: 'Please upload a CSV, Excel, JSON, or SQLite file (.db, .sqlite, .sqlite3).',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await uploadMutation.mutateAsync(file);
      toast({
        title: 'Data uploaded successfully',
        description: `"${result.name || file.name}" is now active with ${result.tables} tables and ${result.total_rows.toLocaleString()} total rows.`,
      });
    } catch (err: any) {
      toast({
        title: 'Upload failed',
        description: err?.message || 'Could not upload this data file.',
        variant: 'destructive',
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  }, []);

  const handleResetDemo = async () => {
    try {
      await resetMutation.mutateAsync();
      toast({
        title: 'Reset to Demo Database',
        description: 'Default sample SQLite database (customers, products, orders) is now active.',
      });
    } catch (err: any) {
      toast({
        title: 'Reset failed',
        description: err?.message || 'Could not reset to demo database.',
        variant: 'destructive',
      });
    }
  };

  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(tableSearch.toLowerCase())
  );
  const selectedTableInfo = tables.find((t) => t.name === selectedTable);

  const isUploading = uploadMutation.isPending;
  const isResetting = resetMutation.isPending;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Sources</h2>
          <p className="text-sm text-muted-foreground">
            Manage your connected SQLite databases and explore schemas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.json,.db,.sqlite,.sqlite3"
            className="hidden"
            onChange={handleFileChange}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDemo}
            disabled={isResetting || isUploading}
            className="gap-2"
          >
            <RotateCcw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
            {isResetting ? 'Resetting...' : 'Reset to Demo DB'}
          </Button>

          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isResetting}
            className="gap-2"
          >
            <Upload className={`h-4 w-4 ${isUploading ? 'animate-bounce' : ''}`} />
            {isUploading ? 'Uploading...' : 'Upload SQLite DB'}
          </Button>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-primary bg-primary/10 scale-[1.01]'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/40'
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3 group-hover:scale-110 transition-transform">
          <FileCode className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium">
          {isUploading
            ? 'Uploading and inspecting database...'
            : isDragging
            ? 'Drop your SQLite file here'
            : 'Click to upload or drag and drop your data file'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Supports <span className="font-mono font-medium">.csv</span>,{' '}
          <span className="font-mono font-medium">.xlsx</span>,{' '}
          <span className="font-mono font-medium">.json</span>, and{' '}
          <span className="font-mono font-medium">.db</span> / <span className="font-mono font-medium">.sqlite</span>{' '}
          files
        </p>
      </div>

      {/* Stats Cards */}
      {dsLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Database</CardTitle>
              <Database className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold truncate" title={datasource?.name || 'SQLite'}>
                {datasource?.name || 'SQLite DB'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">SQLite Engine Active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
              <Table2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{datasource?.tables || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {tables.length} table{tables.length === 1 ? '' : 's'} available in schema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Rows</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {(datasource?.total_rows ?? 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ready for natural language queries</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schema Explorer */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Schema Explorer
              </CardTitle>
              <CardDescription>
                Browse tables, columns, and data types in the connected database
              </CardDescription>
            </div>
            {tables.length > 5 && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter tables..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {schemaLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : tables.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Database className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              No tables found in this database. Upload a SQLite database with tables to get started.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-12">
              {/* Tables List */}
              <div className="md:col-span-4 space-y-1">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tables ({filteredTables.length})
                </h4>
                <div className="max-h-[420px] overflow-y-auto space-y-1.5 pr-1">
                  {filteredTables.map((table) => (
                    <button
                      key={table.name}
                      onClick={() => setSelectedTable(table.name)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                        selectedTable === table.name
                          ? 'border-primary bg-primary/10 font-semibold text-primary shadow-sm'
                          : 'border-transparent hover:border-border hover:bg-accent/50 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Table2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{table.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {table.row_count.toLocaleString()} rows
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                          {table.columns.length} cols
                        </span>
                      </div>
                    </button>
                  ))}
                  {filteredTables.length === 0 && (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      No tables match &quot;{tableSearch}&quot;
                    </p>
                  )}
                </div>
              </div>

              {/* Columns & Details */}
              <div className="md:col-span-8">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Columns {selectedTableInfo ? `for "${selectedTableInfo.name}" (${selectedTableInfo.columns.length})` : ''}
                  </h4>
                  {selectedTableInfo && (
                    <span className="text-xs text-muted-foreground">
                      Total records: <strong className="text-foreground">{selectedTableInfo.row_count.toLocaleString()}</strong>
                    </span>
                  )}
                </div>
                {selectedTableInfo ? (
                  <DataTable
                    data={selectedTableInfo.columns}
                    columns={[
                      {
                        key: 'name',
                        header: 'Column Name',
                        cell: (row: any) => (
                          <span className="font-mono font-medium text-xs sm:text-sm">
                            {row.name}
                          </span>
                        ),
                      },
                      {
                        key: 'type',
                        header: 'Data Type',
                        cell: (row: any) => (
                          <span className="inline-block rounded bg-secondary px-2 py-0.5 font-mono text-xs text-secondary-foreground font-semibold">
                            {row.type || 'TEXT'}
                          </span>
                        ),
                      },
                      {
                        key: 'nullable',
                        header: 'Nullable',
                        cell: (row: any) => (
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded ${
                              row.nullable
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {row.nullable ? 'Nullable' : 'Required'}
                          </span>
                        ),
                      },
                    ]}
                  />
                ) : (
                  <div className="py-12 text-center text-sm text-muted-foreground border rounded-lg">
                    Select a table on the left to view its schema details
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

