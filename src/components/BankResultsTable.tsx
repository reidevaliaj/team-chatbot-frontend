'use client';

import useSWR, { mutate } from 'swr';

interface BankRecord {
  id: number;
  total_assets: string;
  total_liabilities: string;
  intangible_assets: string;
  profit_before_tax: string;
  currency: string;
  pdf_name: string;
  created_at: string | null;
}

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  'https://team-chatbot-backend-django.fly.dev';

/* ------------------------------------------------------------
 * Generic fetcher for SWR
 * ---------------------------------------------------------- */
const fetcher = (url: string) => fetch(url).then(r => r.json());

/* ------------------------------------------------------------
 * Table component
 * ---------------------------------------------------------- */
export function BankResultsTable() {
  const { data: records, error, isLoading } = useSWR<BankRecord[]>(
    `${BACKEND_BASE}/api/bank-analysis/results`,
    fetcher,
    { refreshInterval: 0 } // no polling; we’ll refresh manually
  );

  if (isLoading) return <p className="p-4">Loading…</p>;
  if (error)      return <p className="p-4 text-red-600">Error: {error.message}</p>;
  if (!records?.length) return <p className="p-4 text-gray-500">No records yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 border-b">ID</th>
            <th className="px-3 py-2 border-b">Total Assets</th>
            <th className="px-3 py-2 border-b">Total Liabilities</th>
            <th className="px-3 py-2 border-b">Intangible Assets</th>
            <th className="px-3 py-2 border-b">Profit&nbsp;Before&nbsp;Tax</th>
            <th className="px-4 py-2 border-b">Currency</th>
            <th className="px-3 py-2 border-b">PDF</th>
            <th className="px-3 py-2 border-b">Created</th>
          </tr>
        </thead>
        <tbody>
          {records.map(r => (
            <tr key={r.id}>
              <td className="px-3 py-2 border-b text-center">{r.id}</td>
              <td className="px-3 py-2 border-b">{r.total_assets}</td>
              <td className="px-3 py-2 border-b">{r.total_liabilities}</td>
              <td className="px-3 py-2 border-b">{r.intangible_assets}</td>
              <td className="px-3 py-2 border-b">{r.profit_before_tax}</td>
              <td className="px-4 py-2 border-b text-center">{r.currency}</td>
              <td className="px-3 py-2 border-b">{r.pdf_name}</td>
              <td className="px-3 py-2 border-b">
                {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------
 * Helper to force-refresh the table from anywhere
 * (used after a successful upload)
 * ---------------------------------------------------------- */
export const refreshBankTable = () =>
  mutate(`${BACKEND_BASE}/api/bank-analysis/results`);
