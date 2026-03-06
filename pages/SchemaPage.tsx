import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { marketingAPI } from '../lib/marketing-api';
import type { SchemaResponse } from '../lib/marketing-api';
import { Database, Table2, Copy, Check, Loader2, ExternalLink, LayoutDashboard } from 'lucide-react';
import { useApp } from '../App';

type Tab = 'tables' | 'er';

export const SchemaPage: React.FC = () => {
  const { showToast } = useApp();
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('tables');
  const [copiedTable, setCopiedTable] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await marketingAPI.getSchema();
        if (!cancelled) setSchema(data);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load schema');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const mermaidEr = useMemo(() => {
    if (!schema?.tables?.length) return '';
    const lines: string[] = ['erDiagram'];
    for (const t of schema.tables) {
      const cols = t.columns.map((c) => `  ${c.type} ${c.name}`).join('\n');
      lines.push(`  ${t.name} {\n${cols}\n  }`);
    }
    for (const t of schema.tables) {
      for (const fk of t.foreign_keys || []) {
        if (fk.referred_table && fk.constrained_columns?.length && fk.referred_columns?.length) {
          lines.push(`  ${t.name} ||--o{ ${fk.referred_table} : "${fk.constrained_columns[0]}"`);
        }
      }
    }
    return lines.join('\n');
  }, [schema]);

  const copyTableName = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopiedTable(name);
    showToast(`Copied "${name}"`);
    setTimeout(() => setCopiedTable(null), 2000);
  };

  const copyMermaid = () => {
    navigator.clipboard.writeText(mermaidEr);
    showToast('Mermaid ER diagram copied. Paste at mermaid.live to view.');
  };

  if (loading) {
    return (
      <PageLayout title="Database schema" description="Tables and columns for Custom SQL widgets.">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading schema…
        </div>
      </PageLayout>
    );
  }

  if (error || !schema) {
    return (
      <PageLayout title="Database schema" description="Tables and columns for Custom SQL widgets.">
        <p className="text-red-600">{error || 'No schema data'}</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Database schema"
      description="Tables and columns for Custom SQL widgets. Use this when writing SELECT queries on the dashboard."
      actions={
        <Link to="/">
          <Button variant="secondary" size="sm">
            <LayoutDashboard className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
        </Link>
    }
    >
      <div className="flex gap-2 mb-4 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setTab('tables')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === 'tables' ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Table2 className="h-4 w-4 inline mr-1.5 align-middle" />
          Tables & columns
        </button>
        <button
          type="button"
          onClick={() => setTab('er')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === 'er' ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Database className="h-4 w-4 inline mr-1.5 align-middle" />
          ER diagram
        </button>
      </div>

      {tab === 'tables' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schema.tables.map((table) => (
            <Card key={table.name} title={table.name} className="overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-2">
                <code className="text-sm font-mono bg-slate-100 px-2 py-0.5 rounded">{table.name}</code>
                <button
                  type="button"
                  onClick={() => copyTableName(table.name)}
                  className="p-1 rounded hover:bg-slate-100 text-slate-500"
                  title="Copy table name"
                >
                  {copiedTable === table.name ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <ul className="text-sm space-y-1 max-h-60 overflow-y-auto">
                {table.columns.map((col) => (
                  <li key={col.name} className="flex justify-between gap-2 font-mono">
                    <span className="text-slate-700 truncate">{col.name}</span>
                    <span className="text-slate-500 shrink-0">{col.type}{col.nullable ? '' : ' NOT NULL'}</span>
                  </li>
                ))}
              </ul>
              {table.foreign_keys?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-1">References</p>
                  <ul className="text-xs text-slate-600 space-y-0.5">
                    {table.foreign_keys.map((fk, i) => (
                      <li key={i}>
                        {fk.constrained_columns?.join(', ')} → {fk.referred_table}.{fk.referred_columns?.join(', ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === 'er' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Mermaid ER diagram. Copy and paste at{' '}
            <a href="https://mermaid.live" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
              mermaid.live <ExternalLink className="h-3 w-3" />
            </a>
            {' '}to view the diagram.
          </p>
          <div className="relative">
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap break-all">
              {mermaidEr || 'No tables to display.'}
            </pre>
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={copyMermaid}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
