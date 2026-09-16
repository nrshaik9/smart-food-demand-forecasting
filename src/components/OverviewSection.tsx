import React from 'react';
import { ModelMetricsData, AnalyticsSummary } from '../types';
import { Database, Utensils, TrendingUp, Calendar, ArrowRight, Building2, Store } from 'lucide-react';
import { EmptyState } from './EmptyState';

interface OverviewSectionProps {
  metrics: ModelMetricsData | null;
  summary: AnalyticsSummary | null;
  hasDataset: boolean;
  onNavigate: (tab: string) => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  metrics,
  summary,
  hasDataset,
  onNavigate,
}) => {
  if (!hasDataset || !summary || !metrics) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Overview & Executive Summary</h2>
          <p className="text-sm text-slate-500">
            High-level metrics and operational pipeline for dining halls and food service facilities.
          </p>
        </div>

        <EmptyState
          title="Dataset Required for Overview Analytics"
          message="Upload your food sales dataset to unlock demand forecasting and analytics."
          onNavigateToUpload={() => onNavigate('upload')}
          actionText="Go to Dataset Upload"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Operational Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2 border border-emerald-200">
            <span>Production Pipeline Active</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Operational Overview & Facility Dashboard
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Empirical consumption summary, forecasting workflow, and dining domain configurations for active dataset.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('forecast')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
          >
            <span>Demand Forecast</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Top 5 KPI Metrics including Average Weekly Volume */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Historical Records</span>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary.total_records.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Verified sales observations</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Menu Items Modeled</span>
            <Utensils className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary.dishes.length} Dishes</div>
          <div className="text-xs text-slate-500 mt-1">Active recipes in dataset</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Volume Sold</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary.total_volume.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Total portions consumed</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Daily Volume</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{summary.avg_daily_volume.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Units per day</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Weekly Volume</span>
            <Calendar className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-600">
            {(summary.avg_weekly_volume || Math.round(summary.avg_daily_volume * 7)).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Average portions sold per week</div>
        </div>
      </div>

      {/* Primary Domains Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">Adaptable Food Service Domains</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center space-x-2 text-emerald-800 font-semibold text-xs">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>College Canteen / Hostel Mess</span>
            </div>
            <p className="text-xs text-emerald-700 mt-2 leading-relaxed">
              Primary use case. Handles large student shifts, exam periods, and batch meal preparation with tight ingredient budgets.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex items-center space-x-2 text-slate-800 font-semibold text-xs">
              <Store className="w-4 h-4 text-slate-600" />
              <span>Food Stalls & Cafeterias</span>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Quick-service operations with high turnover and high sensitivity to daily weather and price elasticity.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex items-center space-x-2 text-slate-800 font-semibold text-xs">
              <Building2 className="w-4 h-4 text-slate-600" />
              <span>Hotels & Casual Dining</span>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Multi-period kitchen planning with complex ingredient procurement and revenue margin optimization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
