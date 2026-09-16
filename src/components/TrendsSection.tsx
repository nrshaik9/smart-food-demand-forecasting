import React, { useState, useMemo } from 'react';
import { AnalyticsSummary } from '../types';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, PieChart, Calendar, Store, Clock } from 'lucide-react';
import { formatDateDisplay } from '../utils/dateUtils';
import { EmptyState } from './EmptyState';

interface TrendsSectionProps {
  summary: AnalyticsSummary | null;
  hasDataset: boolean;
  onNavigate: (tab: string) => void;
}

type Granularity = 'day' | 'week' | 'month';

export const TrendsSection: React.FC<TrendsSectionProps> = ({
  summary,
  hasDataset,
  onNavigate,
}) => {
  const [granularity, setGranularity] = useState<Granularity>('day');

  if (!hasDataset || !summary) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Empirical Demand Trends</h2>
          <p className="text-sm text-slate-500">
            Historical consumption time-series aggregated at daily, weekly, and monthly levels.
          </p>
        </div>

        <EmptyState
          title="Dataset Required for Demand Trends"
          message="Please upload your dataset first to continue."
          onNavigateToUpload={() => onNavigate('upload')}
          actionText="Go to Dataset Upload"
        />
      </div>
    );
  }

  // Active trend series based on granularity toggle
  const trendData = useMemo(() => {
    if (granularity === 'month') {
      const source = summary.monthly_trends && summary.monthly_trends.length > 0
        ? summary.monthly_trends
        : summary.daily_trends;

      return source.map((item) => ({
        displayDate: formatDateDisplay(item.date_str),
        fullDate: formatDateDisplay(item.date_str),
        totalDemand: item.quantity_sold,
      }));
    }

    if (granularity === 'week') {
      const source = summary.weekly_trends && summary.weekly_trends.length > 0
        ? summary.weekly_trends
        : summary.daily_trends;

      return source.map((item) => ({
        displayDate: formatDateDisplay(item.date_str),
        fullDate: `Week of ${formatDateDisplay(item.date_str)}`,
        totalDemand: item.quantity_sold,
      }));
    }

    // Default: Day level
    return summary.daily_trends.map((item) => ({
      displayDate: formatDateDisplay(item.date_str),
      fullDate: formatDateDisplay(item.date_str),
      totalDemand: item.quantity_sold,
    }));
  }, [summary, granularity]);

  const mealData = summary.meal_distribution.map((m) => ({
    name: m.meal_type,
    volume: m.quantity_sold,
  }));

  const restData = summary.restaurant_distribution.map((r) => ({
    name: r.restaurant_type,
    volume: r.quantity_sold,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Empirical Demand Trends</h2>
          <p className="text-sm text-slate-500">
            Historical consumption time-series across {summary.start_date} to {summary.end_date} from {summary.total_records.toLocaleString()} verified sales records.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold text-slate-700">Average Daily Volume:</span>
          <span className="text-emerald-600 font-bold">{summary.avg_daily_volume.toLocaleString()} units/day</span>
        </div>
      </div>

      {/* Main Time-Series Chart with Granularity Toggles */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Demand Trajectory ({granularity === 'day' ? 'Daily' : granularity === 'week' ? 'Weekly' : 'Monthly'} Aggregation)
            </h3>
          </div>

          {/* Granularity Toggle Buttons (Daily Demand / Weekly Demand / Monthly Demand) */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setGranularity('day')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                granularity === 'day'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Daily Demand
            </button>
            <button
              onClick={() => setGranularity('week')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                granularity === 'week'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Weekly Demand
            </button>
            <button
              onClick={() => setGranularity('month')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                granularity === 'month'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Monthly Demand
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 11, fill: '#64748b' }}
                angle={-15}
                textAnchor="end"
                height={40}
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '8px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                }}
                labelFormatter={(val, items) => items[0]?.payload?.fullDate || val}
                formatter={(val: number) => [`${val.toLocaleString()} units`, 'Demand Volume']}
              />
              <Line
                type="monotone"
                dataKey="totalDemand"
                name="Total Units Demanded"
                stroke="#059669"
                strokeWidth={2.5}
                dot={granularity === 'month' ? { r: 5, fill: '#059669' } : { r: 2, fill: '#059669' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
          <span>Displaying {trendData.length} timeline observations formatted as <strong className="text-slate-600">MMM DD, YYYY</strong>.</span>
          <span>Granularity: {granularity.toUpperCase()}</span>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meal Type Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2 mb-4">
            <PieChart className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Demand Volume by Meal Period</h3>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mealData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                  formatter={(val: number) => [`${val.toLocaleString()} units`, 'Portions Sold']}
                />
                <Bar dataKey="volume" name="Portions Sold" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Facility Type Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2 mb-4">
            <Store className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Demand Volume by Dining Facility Type</h3>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={restData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                  formatter={(val: number) => [`${val.toLocaleString()} units`, 'Portions Sold']}
                />
                <Bar dataKey="volume" name="Portions Sold" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
