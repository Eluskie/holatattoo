'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Evaluation {
  id: string;
  templateId: string;
  templateName: string;
  configName: string;
  timestamp: string;
  results: {
    messages: Array<{ role: string; content: string }>;
    finalData: any;
    status: string;
    messageCount: number;
    qualified: boolean;
  };
  metrics: {
    duration: number;
    userMessages: number;
    botMessages: number;
  };
}

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedEvals, setSelectedEvals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      const res = await fetch('/api/bot-test/evaluations');
      const data = await res.json();
      setEvaluations(data.evaluations || []);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearEvaluations = async () => {
    if (!confirm('Clear all evaluations? This cannot be undone.')) return;

    try {
      await fetch('/api/bot-test/evaluations', { method: 'DELETE' });
      setEvaluations([]);
      setSelectedEvals([]);
    } catch (error) {
      console.error('Error clearing evaluations:', error);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedEvals(prev =>
      prev.includes(id)
        ? prev.filter(eid => eid !== id)
        : [...prev, id]
    );
  };

  const getComparisonData = () => {
    if (selectedEvals.length < 2) return null;

    const selected = evaluations.filter(e => selectedEvals.includes(e.id));
    
    return {
      evaluations: selected,
      comparison: {
        avgDuration: selected.reduce((sum, e) => sum + e.metrics.duration, 0) / selected.length,
        avgUserMessages: selected.reduce((sum, e) => sum + e.metrics.userMessages, 0) / selected.length,
        avgBotMessages: selected.reduce((sum, e) => sum + e.metrics.botMessages, 0) / selected.length,
        qualificationRate: selected.filter(e => e.results.qualified).length / selected.length * 100
      }
    };
  };

  const comparison = getComparisonData();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📊 Bot Evaluations</h1>
            <p className="text-sm text-gray-600">Compare template runs and analyze performance</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/bot-test">
              <Button variant="outline" size="sm">
                ← Back to Chat
              </Button>
            </Link>
            <Button
              onClick={clearEvaluations}
              variant="outline"
              size="sm"
              disabled={evaluations.length === 0}
            >
              🗑️ Clear All
            </Button>
            <Button
              onClick={fetchEvaluations}
              variant="outline"
              size="sm"
            >
              🔄 Refresh
            </Button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-10 text-gray-500">
            Loading evaluations...
          </div>
        )}

        {!loading && evaluations.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center">
            <p className="text-gray-500 mb-4">No evaluations yet</p>
            <Link href="/dashboard/bot-test">
              <Button>Run your first template</Button>
            </Link>
          </div>
        )}

        {!loading && evaluations.length > 0 && (
          <>
            {/* Comparison Panel */}
            {selectedEvals.length >= 2 && comparison && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-sm mb-3">📈 Comparison ({selectedEvals.length} selected)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Avg Duration</p>
                    <p className="font-semibold">{(comparison.comparison.avgDuration / 1000).toFixed(1)}s</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Avg User Messages</p>
                    <p className="font-semibold">{comparison.comparison.avgUserMessages.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Avg Bot Messages</p>
                    <p className="font-semibold">{comparison.comparison.avgBotMessages.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Qualification Rate</p>
                    <p className="font-semibold">{comparison.comparison.qualificationRate.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Evaluations List */}
            <div className="space-y-4">
              {evaluations.map((eval_item) => (
                <div
                  key={eval_item.id}
                  className={`bg-white rounded-lg shadow-sm border-2 p-4 cursor-pointer transition-colors ${
                    selectedEvals.includes(eval_item.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleSelection(eval_item.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{eval_item.templateName}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          eval_item.results.qualified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {eval_item.results.qualified ? '✓ Qualified' : '✗ Not Qualified'}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-800">
                          {eval_item.configName}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(eval_item.timestamp).toLocaleString()} • 
                        {' '}{(eval_item.metrics.duration / 1000).toFixed(1)}s • 
                        {' '}{eval_item.metrics.userMessages} user msgs • 
                        {' '}{eval_item.metrics.botMessages} bot msgs
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedEvals.includes(eval_item.id)}
                      onChange={() => {}}
                      className="w-5 h-5"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Final Data */}
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Extracted Data:</p>
                      <div className="bg-gray-50 rounded p-2 text-xs font-mono">
                        <pre className="overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(eval_item.results.finalData, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* Conversation */}
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Conversation ({eval_item.results.messages.length} messages):</p>
                      <div className="bg-gray-50 rounded p-2 text-xs space-y-1 max-h-48 overflow-y-auto">
                        {eval_item.results.messages.map((msg, idx) => (
                          <div key={idx} className={msg.role === 'user' ? 'text-blue-600' : 'text-gray-700'}>
                            <span className="font-semibold">{msg.role === 'user' ? 'User' : 'Bot'}:</span>{' '}
                            {msg.content}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

