'use client';

import { FlaggedContent } from '@/lib/types';

interface StatsBarProps {
  data: FlaggedContent[];
}

export default function StatsBar({ data }: StatsBarProps) {
  const stats = {
    total: data.length,
    scam: data.filter((item) => item.flag_type === 'scam').length,
    misinformation: data.filter((item) => item.flag_type === 'misinformation').length,
    fake_profile: data.filter((item) => item.flag_type === 'fake_profile').length,
    other: data.filter((item) => item.flag_type === 'other').length,
    high: data.filter((item) => item.confidence >= 67).length,
    low: data.filter((item) => item.confidence <= 33).length,
  };

  const statCards = [
    {
      label: 'Total Flags',
      value: stats.total,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
    },
    {
      label: 'Scam',
      value: stats.scam,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
    },
    {
      label: 'Misinformation',
      value: stats.misinformation,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-200',
    },
    {
      label: 'Fake Profile',
      value: stats.fake_profile,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
    },
    {
      label: 'Other',
      value: stats.other,
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-200',
    },
    {
      label: 'High Confidence',
      value: stats.high,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
    },
    {
      label: 'Low Confidence',
      value: stats.low,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className={`${stat.bgColor} ${stat.borderColor} border rounded-lg p-4 text-center`}
        >
          <div className={`text-3xl font-bold ${stat.textColor}`}>
            {stat.value}
          </div>
          <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}