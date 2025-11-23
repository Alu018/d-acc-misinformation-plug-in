'use client';

import { FlaggedContent } from '@/lib/types';
import { format } from 'date-fns';
import { useState } from 'react';

interface FlaggedContentTableProps {
  data: FlaggedContent[];
}

const flagTypeColors = {
  scam: 'bg-red-100 text-red-800 border-red-300',
  misinformation: 'bg-orange-100 text-orange-800 border-orange-300',
  fake_profile: 'bg-purple-100 text-purple-800 border-purple-300',
  other: 'bg-gray-100 text-gray-800 border-gray-300',
};

const contentTypeIcons = {
  text: '📝',
  image: '🖼️',
  video: '🎥',
  other: '📄',
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

export default function FlaggedContentTable({ data }: FlaggedContentTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

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
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Flag Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Confidence
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Content
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Page URL
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
                  <span className="text-2xl" title={item.content_type}>
                    {contentTypeIcons[item.content_type]}
                  </span>
                </td>
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
                  <div className="text-sm text-gray-900">
                    {isExpanded ? item.content : truncateText(item.content)}
                  </div>
                  {item.note && (
                    <div className="text-xs text-gray-500 mt-1 italic">
                      Note: {isExpanded ? item.note : truncateText(item.note, 50)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <a
                    href={item.page_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline text-sm truncate block"
                    title={item.page_url}
                  >
                    {new URL(item.page_url).hostname}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(item.created_at), 'MMM d, yyyy')}
                  <div className="text-xs text-gray-400">
                    {format(new Date(item.created_at), 'h:mm a')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => toggleRow(item.id)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No flagged content found
        </div>
      )}
    </div>
  );
}