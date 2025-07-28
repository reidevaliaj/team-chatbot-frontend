// components/BankResultsTable.tsx
'use client';
import React, { useEffect, useState } from 'react';

interface BankRecord {
  id: number;
  total_assets: string;
  total_liabilities: string;
  intangible_assets: string;
  profit_before_tax: string;
  pdf_name:string;
  created_at: string;
}

export function BankResultsTable() {
  const [records, setRecords] = useState<BankRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ensure NEXT_PUBLIC_BACKEND_URL is set in your .env.local (e.g. "https://my-backend.onrender.com")
  const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;

  useEffect(() => {
    async function loadRecords() {
      try {
        const res = await fetch(`${BACKEND_BASE}/api/bank-analysis/results`);
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        const data: BankRecord[] = await res.json();
        setRecords(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadRecords();
  }, [BACKEND_BASE]);

  if (loading) {
    return <div className="p-4">Loading saved bank‐analysis records…</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error loading records: {error}</div>;
  }

  if (records.length === 0) {
    return <div className="p-4 text-gray-600">No saved records found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border-b">ID</th>
            <th className="px-4 py-2 border-b">Total Assets</th>
            <th className="px-4 py-2 border-b">Total Liabilities</th>
            <th className="px-4 py-2 border-b">Intangible Assets</th>
            <th className="px-4 py-2 border-b">Profit Before Tax</th>
            <th className="px-4 py-2 border-b">PDF</th>
            <th className="px-4 py-2 border-b">Created At</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-2 border-b text-center">{r.id}</td>
              <td className="px-4 py-2 border-b">{r.total_assets}</td>
              <td className="px-4 py-2 border-b">{r.total_liabilities}</td>
              <td className="px-4 py-2 border-b">{r.intangible_assets}</td>
              <td className="px-4 py-2 border-b">{r.profit_before_tax}</td>
              <td className="px-4 py-2 border-b">{r.pdf_name}</td>
              <td className="px-4 py-2 border-b">
                {new Date(r.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
