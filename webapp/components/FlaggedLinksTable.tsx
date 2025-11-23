'use client';

import { FlaggedLink } from '@/lib/types';
import { format } from 'date-fns';
import { useState } from 'react';

interface FlaggedLinksTableProps {
  data: FlaggedLink[];
  onDelete: (id: number) => Promise<void>;
}

const flagTypeColors = {
  scam: 'bg-red-100 text-red-800 border-red-300',
  misinformation: 'bg-orange-100 text-orange-800 border-orange-300',
  fake_profile: 'bg-purple-100 text-purple-800 border-purple-300',
  other: 'bg-gray-100 text-gray-800 border-gray-300',
};

const getConfidenceBadge = (confidence: number) => {
  if (confidence >= 67) {
    return { color: 'bg-green-100 text-green-800 border-green-300', label: 'High' };
  } else if (confidence >= 34) {
    return { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Medium' };
  } else {
    return { color: 'bg-red-100 text-red-800 border-red-300', label: 'Low' };
  }
};

export default function FlaggedLinksTable({ data, onDelete }: FlaggedLinksTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState<number | null>(null);

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this flagged link?')) {
      return;
    }

    setDeleting(id);
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Flag Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Confidence
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Flagged URL
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Flagged By
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((item) => {
            const isExpanded = expandedRows.has(item.id);
            return (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                      flagTypeColors[item.flag_type]
                    }`}
                  >
                    {item.flag_type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                      getConfidenceBadge(item.confidence).color
                    }`}
                  >
                    {item.confidence}% ({getConfidenceBadge(item.confidence).label})
                  </span>
                </td>
                <td className="px-6 py-4 max-w-md">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline text-sm block"
                    title={item.url}
                  >
                    {isExpanded ? item.url : truncateText(item.url, 60)}
                  </a>
                  {item.note && (
                    <div className="text-xs text-gray-500 mt-1 italic">
                      Note: {isExpanded ? item.note : truncateText(item.note, 50)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 max-w-xs">
                  {item.flagged_by_url ? (
                    <a
                      href={item.flagged_by_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline text-sm truncate block"
                      title={item.flagged_by_url}
                    >
                      {new URL(item.flagged_by_url).hostname}
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(item.created_at), 'MMM d, yyyy')}
                  <div className="text-xs text-gray-400">
                    {format(new Date(item.created_at), 'h:mm a')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRow(item.id)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {isExpanded ? 'Show less' : 'Show more'}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                      className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                      title="Delete this entry"
                    >
                      {deleting === item.id ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No flagged links found
        </div>
      )}
    </div>
  );
}
