"use client";

import { useState } from "react";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!url) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");

      setResult(data.recommendations);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-4 py-10">
      {/* HEADER */}
      <h1 className="text-3xl font-semibold mb-6">
        Shopify AI Analyzer
      </h1>

      {/* INPUT */}
      <div className="w-full max-w-xl flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Paste Shopify store URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 p-3 rounded-lg bg-zinc-900 border border-zinc-700 outline-none"
        />
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="bg-white text-black px-4 py-2 rounded-lg font-medium"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="text-red-400 mb-4">{error}</div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="text-zinc-400 animate-pulse">
          Analyzing store... AI is thinking 🤖
        </div>
      )}

      {/* RESULT */}
      {result && (
        <div className="w-full max-w-2xl space-y-6 mt-6">
          
          {/* SUMMARY */}
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-700">
            <h2 className="text-lg font-semibold mb-2">Summary</h2>
            <p className="text-zinc-300">{result.summary}</p>
          </div>

          {/* BIGGEST OPPORTUNITY */}
          <div className="bg-blue-900/30 p-4 rounded-xl border border-blue-700">
            <h2 className="text-lg font-semibold mb-2">
              Biggest Opportunity 🚀
            </h2>
            <p>{result.biggest_opportunity}</p>
          </div>

          {/* RECOMMENDATIONS */}
          <div className="space-y-4">
            {Object.entries(result.recommendations).map(
              ([key, value]) => (
                <div
                  key={key}
                  className="bg-zinc-900 p-4 rounded-xl border border-zinc-700"
                >
                  <h3 className="font-semibold mb-2">{key}</h3>
                  <p className="text-zinc-300">{value as string}</p>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}