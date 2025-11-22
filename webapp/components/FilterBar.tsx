'use client';

import { ContentType, FlagType, ConfidenceLevel } from '@/lib/types';

interface FilterBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  contentTypeFilter: ContentType | 'all';
  setContentTypeFilter: (value: ContentType | 'all') => void;
  flagTypeFilter: FlagType | 'all';
  setFlagTypeFilter: (value: FlagType | 'all') => void;
  confidenceFilter: ConfidenceLevel | 'all';
  setConfidenceFilter: (value: ConfidenceLevel | 'all') => void;
  totalCount: number;
}

export default function FilterBar({
  searchTerm,
  setSearchTerm,
  contentTypeFilter,
  setContentTypeFilter,
  flagTypeFilter,
  setFlagTypeFilter,
  confidenceFilter,
  setConfidenceFilter,
  totalCount,
}: FilterBarProps) {
  const resetFilters = () => {
    setSearchTerm('');
    setContentTypeFilter('all');
    setFlagTypeFilter('all');
    setConfidenceFilter('all');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    contentTypeFilter !== 'all' ||
    flagTypeFilter !== 'all' ||
    confidenceFilter !== 'all';

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Filter Content
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({totalCount} {totalCount === 1 ? 'item' : 'items'})
          </span>
        </h2>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="col-span-1 md:col-span-2">
          <label
            htmlFor="search"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Search
          </label>
          <input
            type="text"
            id="search"
            placeholder="Search content or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Content Type Filter */}
        <div>
          <label
            htmlFor="content-type"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Content Type
          </label>
          <select
            id="content-type"
            value={contentTypeFilter}
            onChange={(e) =>
              setContentTypeFilter(e.target.value as ContentType | 'all')
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="text">📝 Text</option>
            <option value="image">🖼️ Image</option>
            <option value="video">🎥 Video</option>
            <option value="other">📄 Other</option>
          </select>
        </div>

        {/* Flag Type Filter */}
        <div>
          <label
            htmlFor="flag-type"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Flag Type
          </label>
          <select
            id="flag-type"
            value={flagTypeFilter}
            onChange={(e) =>
              setFlagTypeFilter(e.target.value as FlagType | 'all')
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Flags</option>
            <option value="scam">Scam</option>
            <option value="misinformation">Misinformation</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Confidence Filter */}
        <div className="md:col-span-2 lg:col-span-1">
          <label
            htmlFor="confidence"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confidence
          </label>
          <select
            id="confidence"
            value={confidenceFilter}
            onChange={(e) =>
              setConfidenceFilter(e.target.value as ConfidenceLevel | 'all')
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Levels</option>
            <option value="certain">Certain</option>
            <option value="uncertain">Uncertain</option>
          </select>
        </div>
      </div>
    </div>
  );
}