// app/(with-sidebar)/bank-analysis/page.tsx
"use client";

import React, { useState, FormEvent } from "react";

export default function BankAnalysisPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The base URL for your FastAPI backend:
  // If you have NEXT_PUBLIC_BACKEND_URL in .env.local, you can use it. Fallback to localhost for dev:
  const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult(null);
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedFile) {
      setError("Please select a PDF first.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("pdf", selectedFile);

    try {
      const resp = await fetch(`${BACKEND_BASE}/bank-analysis/upload`, {
        method: "POST",
        body: formData,
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Server Error: ${text}`);
      }
      const body = await resp.json();
      setResult(body.extracted || {});
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 overflow-y-auto flex flex-col h-full">
      <h1 className="text-2xl font-bold mb-4">Bank Analysis</h1>

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
          {loading ? "Analyzing…" : "Upload & Analyze"}
        </button>
      </form>

      {error && (
        <div className="mb-4 text-red-600">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div className="mb-4 text-gray-600">Please wait, processing PDF…</div>
      )}

      {result && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Extracted Financial Data</h2>
          <pre className="bg-gray-50 p-3 rounded overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {!loading && !result && (
        <p className="text-gray-600">Upload a bank statement PDF to extract key numbers.</p>
      )}
    </div>
  );
}
