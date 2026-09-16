import React, { useState } from 'react';
import { AnalyticsSummary, DishInfo } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { Award, Coins } from 'lucide-react';
import { EmptyState } from './EmptyState';

interface DishSectionProps {
  summary: AnalyticsSummary | null;
  dishes: Record<string, DishInfo> | null;
  hasDataset: boolean;
  onNavigate: (tab: string) => void;
}

export const DishSection: React.FC<DishSectionProps> = ({
  summary,
  dishes,
  hasDataset,
  onNavigate,
}) => {
  const [currencySymbol, setCurrencySymbol] = useState<string>('₹');

  if (!hasDataset || !summary || !dishes || Object.keys(dishes).length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Dish Popularity & Profitability Analytics
          </h2>
          <p className="text-sm text-slate-500">
            Rank dishes by overall demand, unit ingredient cost, and gross contribution margin.
          </p>
        </div>

        <EmptyState
          title="Dataset Required for Dish Analytics"
          message="Please upload your dataset first to continue."
          onNavigateToUpload={() => onNavigate('upload')}
          actionText="Go to Dataset Upload"
        />
      </div>
    );
  }

  const topDishes = summary.dishes.slice(0, 10).map((d) => ({
    name: d.menu_item_name,
    volume: d.total_sold,
    avgSold: Math.round(d.avg_sold),
    margin: d.margin,
    marginPct: Math.round(d.margin_pct),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Dish Popularity & Profitability Analytics
          </h2>
          <p className="text-sm text-slate-500">
            Rank dishes by overall demand, unit ingredient cost, and gross contribution margin based on your active dataset.
          </p>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
          <Coins className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-700">Currency:</span>
          <select
            value={currencySymbol}
            onChange={(e) => setCurrencySymbol(e.target.value)}
            className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded px-2 py-1"
          >
            <option value="₹">INR (₹)</option>
            <option value="$">USD ($)</option>
            <option value="€">EUR (€)</option>
            <option value="£">GBP (£)</option>
          </select>
        </div>
      </div>

      {/* Top Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2 mb-4">
          <Award className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Total Volume Demanded by Menu Item (Top 10)</h3>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topDishes} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
              <XAxis
                dataKey="name"
                interval={0}
                angle={-20}
                textAnchor="end"
                tick={{ fontSize: 11, fill: '#475569' }}
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                formatter={(val: number) => [`${val.toLocaleString()} units`, 'Portions Demanded']}
              />
              <Bar dataKey="volume" name="Portions Demanded" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Full Dish Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Comprehensive Menu Economics Table</h3>
          <span className="text-xs text-slate-400">{summary.dishes.length} Verified Menu Items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Dish Name</th>
                <th className="px-6 py-3 text-right">Total Portions Sold</th>
                <th className="px-6 py-3 text-right">Avg Batch Demand</th>
                <th className="px-6 py-3 text-right">Unit Ingredient Cost</th>
                <th className="px-6 py-3 text-right">Avg Selling Price</th>
                <th className="px-6 py-3 text-right">Gross Margin ({currencySymbol})</th>
                <th className="px-6 py-3 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.dishes.map((dish, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-6 py-3 font-semibold text-slate-900">{dish.menu_item_name}</td>
                  <td className="px-6 py-3 text-right font-mono font-bold text-slate-800">{dish.total_sold.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right font-mono text-slate-600">{Math.round(dish.avg_sold)}</td>
                  <td className="px-6 py-3 text-right text-slate-500">{currencySymbol}{dish.unit_cost.toFixed(2)}</td>
                  <td className="px-6 py-3 text-right font-medium text-slate-700">{currencySymbol}{dish.avg_price.toFixed(2)}</td>
                  <td className="px-6 py-3 text-right font-semibold text-emerald-700">{currencySymbol}{dish.margin.toFixed(2)}</td>
                  <td className="px-6 py-3 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {dish.margin_pct.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
