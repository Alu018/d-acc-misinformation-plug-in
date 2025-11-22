'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FlaggedContent, ContentType, FlagType, ConfidenceLevel } from '@/lib/types';
import FlaggedContentTable from '@/components/FlaggedContentTable';
import FilterBar from '@/components/FilterBar';
import StatsBar from '@/components/StatsBar';

export default function Home() {
  const [data, setData] = useState<FlaggedContent[]>([]);
  const [filteredData, setFilteredData] = useState<FlaggedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentType | 'all'>('all');
  const [flagTypeFilter, setFlagTypeFilter] = useState<FlagType | 'all'>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceLevel | 'all'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [data, searchTerm, contentTypeFilter, flagTypeFilter, confidenceFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: flaggedData, error } = await supabase
        .from('flagged_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setData(flaggedData || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...data];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.content.toLowerCase().includes(term) ||
          item.note?.toLowerCase().includes(term) ||
          item.page_url.toLowerCase().includes(term)
      );
    }

    // Content type filter
    if (contentTypeFilter !== 'all') {
      filtered = filtered.filter((item) => item.content_type === contentTypeFilter);
    }

    // Flag type filter
    if (flagTypeFilter !== 'all') {
      filtered = filtered.filter((item) => item.flag_type === flagTypeFilter);
    }

    // Confidence filter
    if (confidenceFilter !== 'all') {
      filtered = filtered.filter((item) => item.confidence === confidenceFilter);
    }

    setFilteredData(filtered);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Misinformation Detector
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Public database of flagged content
              </p>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <strong className="font-bold">Error:</strong> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading flagged content...</p>
            </div>
          </div>
        ) : (
          <>
            <StatsBar data={data} />

            <FilterBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              contentTypeFilter={contentTypeFilter}
              setContentTypeFilter={setContentTypeFilter}
              flagTypeFilter={flagTypeFilter}
              setFlagTypeFilter={setFlagTypeFilter}
              confidenceFilter={confidenceFilter}
              setConfidenceFilter={setConfidenceFilter}
              totalCount={filteredData.length}
            />

            <FlaggedContentTable data={filteredData} />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Data sourced from the Misinformation Detector Chrome Extension
          </p>
        </div>
      </footer>
    </div>
  );
}
