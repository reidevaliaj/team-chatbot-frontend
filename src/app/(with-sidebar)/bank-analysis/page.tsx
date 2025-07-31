'use client';

import React, { useState, FormEvent } from 'react';
import { BankResultsTable, refreshBankTable } from '@/components/BankResultsTable';

export default function BankAnalysisPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const BACKEND_BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    'https://team-chatbot-backend-django.fly.dev';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult(null);
    setError(null);
    setSelectedFile(e.target.files?.[0] ?? null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return setError('Please select a PDF first.');

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      const resp = await fetch(`${BACKEND_BASE}/api/bank-analysis/upload/`, {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        throw new Error(await resp.text());
      }

      const body = await resp.json();
      setResult({
        'Total Assets': body.total_assets,
        'Total Liabilities': body.total_liabilities,
        'Intangible Assets': body.intangible_assets,
        'Profit before Tax': body.profit_before_tax,
      });

      /* ⭐  Refresh the table instantly */
      refreshBankTable();

      /* (Optional) clear the file input */
      setSelectedFile(null);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setError(err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 overflow-y-auto flex flex-col h-full">
      <h1 className="text-2xl font-bold mb-4">Bank Analysis</h1>

      {/* ── Upload form ─────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="mb-6">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="mb-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Analyzing…' : 'Upload & Analyze'}
        </button>
      </form>

      {/* ── Status / preview ────────────────────────────────────── */}
      {error && (
        <p className="mb-4 text-red-600">
          <strong>Error:</strong> {error}
        </p>
      )}

      {loading && <p className="mb-4 text-gray-600">Processing PDF…</p>}

      {result && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">
            Extracted Financial Data
          </h2>
          <pre className="bg-gray-50 p-3 rounded overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {!loading && !result && !error && (
        <p className="text-gray-600 mb-6">
          Upload a bank statement PDF to extract key numbers.
        </p>
      )}

      {/* ── Saved records table ─────────────────────────────────── */}
      <BankResultsTable />
    </div>
  );
}
