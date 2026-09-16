import React, { useState } from 'react';
import { DishInfo, AnalyticsSummary } from '../types';
import { Trash2, AlertTriangle, CheckCircle, ArrowRight, Coins, Plus, Minus } from 'lucide-react';
import { formatDateDisplay } from '../utils/dateUtils';
import { EmptyState } from './EmptyState';

interface WasteSectionProps {
  dishes: Record<string, DishInfo> | null;
  summary: AnalyticsSummary | null;
  hasDataset: boolean;
  onNavigate: (tab: string) => void;
}

export const WasteSection: React.FC<WasteSectionProps> = ({
  dishes,
  summary,
  hasDataset,
  onNavigate,
}) => {
  if (!hasDataset || !dishes || !summary || Object.keys(dishes).length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Food Waste Analytics & Auditing Calculator
          </h2>
          <p className="text-sm text-slate-500">
            Compute surplus food waste and financial losses directly from user-entered kitchen logs and actual historical sales quantities.
          </p>
        </div>

        <EmptyState
          title="Dataset Required for Waste Analytics"
          message="Please upload your dataset first to continue."
          onNavigateToUpload={() => onNavigate('upload')}
          actionText="Go to Dataset Upload"
        />
      </div>
    );
  }

  const dishList = Object.values(dishes) as DishInfo[];
  const [selectedDishName, setSelectedDishName] = useState<string>(dishList[0]?.name || '');
  const dish = dishes[selectedDishName] || dishList[0];

  // Currency option (default INR)
  const [currencySymbol, setCurrencySymbol] = useState<string>('₹');

  const [actualSold, setActualSold] = useState<number | string>(Math.round(dish?.avg_quantity_sold || 100));
  const [quantityPrepared, setQuantityPrepared] = useState<number | string>(
    Math.round((dish?.avg_quantity_sold || 100) * 1.2)
  );

  const handleDishSelect = (name: string) => {
    setSelectedDishName(name);
    const d = dishes[name];
    if (d) {
      setActualSold(Math.round(d.avg_quantity_sold));
      setQuantityPrepared(Math.round(d.avg_quantity_sold * 1.2));
    }
  };

  // Calculations
  const parsedPrepared = typeof quantityPrepared === 'number' ? quantityPrepared : (parseInt(quantityPrepared, 10) || 0);
  const parsedSold = typeof actualSold === 'number' ? actualSold : (parseInt(actualSold, 10) || 0);

  const foodWasteUnits = Math.max(0, parsedPrepared - parsedSold);
  const wastePercentage = parsedPrepared > 0 ? (foodWasteUnits / parsedPrepared) * 100 : 0;
  
  // Direct Ingredient Loss
  const directIngredientLoss = foodWasteUnits * (dish?.typical_cost || 0);
  // Estimated Waste Cost (formerly Unrealized Revenue)
  const estimatedWasteCost = foodWasteUnits * (dish?.avg_selling_price || 0);

  // AI Optimized Scenario: Prepared with 10% safety buffer
  const aiRecommendedPrep = Math.ceil(parsedSold * 1.10);
  const aiWasteUnits = Math.max(0, aiRecommendedPrep - parsedSold);
  const aiSavedUnits = Math.max(0, foodWasteUnits - aiWasteUnits);
  const aiSavedCost = aiSavedUnits * (dish?.typical_cost || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Food Waste Analytics & Auditing Calculator
          </h2>
          <p className="text-sm text-slate-500">
            Compute surplus food waste and financial losses directly from kitchen logs and actual historical sales quantities.
          </p>
        </div>

        {/* Currency Selector */}
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

      {/* NOTE: Formula explanation section ("Strict Operational Waste & Loss Formulas") was REMOVED per Change 5 */}

      {/* Interactive Audit Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
            <Trash2 className="w-4 h-4 text-amber-600 mr-1.5" />
            Kitchen Preparation Entry
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dish Being Audited</label>
            <select
              value={selectedDishName}
              onChange={(e) => handleDishSelect(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-medium"
            >
              {dishList.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name} (Cost: {currencySymbol}{d.typical_cost.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity Prepared by Kitchen (Portions)
            </label>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setQuantityPrepared((prev) => {
                  const curr = typeof prev === 'number' ? prev : (parseInt(prev, 10) || 0);
                  return Math.max(0, curr - 1);
                })}
                disabled={parsedPrepared <= 0}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                aria-label="Decrease quantity prepared"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min="0"
                value={quantityPrepared}
                onFocus={(e) => {
                  if (e.target.value === '0') e.target.select();
                }}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setQuantityPrepared('');
                    return;
                  }
                  const digitsOnly = raw.replace(/[^0-9]/g, '');
                  const cleaned = digitsOnly.replace(/^0+(?=\d)/, '');
                  setQuantityPrepared(cleaned);
                }}
                onBlur={() => {
                  if (quantityPrepared === '') {
                    setQuantityPrepared(0);
                  }
                }}
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-semibold text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
              />
              <button
                type="button"
                onClick={() => setQuantityPrepared((prev) => {
                  const curr = typeof prev === 'number' ? prev : (parseInt(prev, 10) || 0);
                  return curr + 1;
                })}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold transition cursor-pointer shrink-0"
                aria-label="Increase quantity prepared"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Total batch cooked for service</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Actual Quantity Sold / Served (Portions)
            </label>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setActualSold((prev) => {
                  const curr = typeof prev === 'number' ? prev : (parseInt(prev, 10) || 0);
                  return Math.max(0, curr - 1);
                })}
                disabled={parsedSold <= 0}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                aria-label="Decrease actual quantity sold"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min="0"
                value={actualSold}
                onFocus={(e) => {
                  if (e.target.value === '0') e.target.select();
                }}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setActualSold('');
                    return;
                  }
                  const digitsOnly = raw.replace(/[^0-9]/g, '');
                  const cleaned = digitsOnly.replace(/^0+(?=\d)/, '');
                  setActualSold(cleaned);
                }}
                onBlur={() => {
                  if (actualSold === '') {
                    setActualSold(0);
                  }
                }}
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-semibold text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
              />
              <button
                type="button"
                onClick={() => setActualSold((prev) => {
                  const curr = typeof prev === 'number' ? prev : (parseInt(prev, 10) || 0);
                  return curr + 1;
                })}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold transition cursor-pointer shrink-0"
                aria-label="Increase actual quantity sold"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Recorded demand at register / counter</span>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Unit Ingredient Cost:</span>
              <span className="font-semibold text-slate-700">{currencySymbol}{dish.typical_cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Menu Selling Price:</span>
              <span className="font-semibold text-slate-700">{currencySymbol}{dish.avg_selling_price.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Audit Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Renamed: "Wasted Surplus" -> "Food Waste" per Change 5 */}
            <div className={`p-4 rounded-xl border shadow-xs ${foodWasteUnits > 0 ? 'bg-amber-50/60 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Food Waste
              </span>
              <div className={`text-2xl font-bold ${foodWasteUnits > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {foodWasteUnits} <span className="text-xs font-normal">portions</span>
              </div>
              <span className="text-xs text-slate-500">{wastePercentage.toFixed(1)}% of batch</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Direct Ingredient Loss
              </span>
              <div className="text-2xl font-bold text-slate-900">
                {currencySymbol}{directIngredientLoss.toFixed(2)}
              </div>
              <span className="text-xs text-slate-400">Raw ingredient cost</span>
            </div>

            {/* Renamed: "Unrealized Revenue" -> "Estimated Waste Cost" per Change 5 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Estimated Waste Cost
              </span>
              <div className="text-2xl font-bold text-slate-900">
                {currencySymbol}{estimatedWasteCost.toFixed(2)}
              </div>
              <span className="text-xs text-slate-400">Potential retail loss</span>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block mb-1">
                AI Reduction Potential
              </span>
              <div className="text-2xl font-bold text-emerald-700">
                {currencySymbol}{aiSavedCost.toFixed(2)}
              </div>
              <span className="text-xs text-emerald-600">Saved with AI buffer</span>
            </div>
          </div>

          {/* Detailed Diagnosis */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center">
              {foodWasteUnits > 0 ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-500 mr-2" />
                  Audit Assessment: Kitchen Overproduction Detected
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-600 mr-2" />
                  Audit Assessment: Zero Food Waste Recorded
                </>
              )}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {foodWasteUnits > 0
                ? `The kitchen prepared ${parsedPrepared} portions of ${dish.name}, but customer demand was ${parsedSold}. This resulted in ${foodWasteUnits} unsold portions (${currencySymbol}${directIngredientLoss.toFixed(2)} direct raw ingredient expenditure). Adopting smart forecasting with a 10% safety buffer would recommend preparing ${aiRecommendedPrep} portions, saving ${aiSavedUnits} portions (${currencySymbol}${aiSavedCost.toFixed(2)}) without risking stockouts.`
                : `Customer demand (${parsedSold}) matched or exceeded preparation (${parsedPrepared}). No food surplus was discarded.`}
            </p>
          </div>

          {/* Quick Select from Dataset's Real Historical Sales with "MMM DD, YYYY" date format */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Select an Actual Sales Record from Dataset to Audit
              </span>
              <span className="text-[11px] text-slate-400">Formatted as MMM DD, YYYY</span>
            </div>
            <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 text-xs">
              {summary.recent_sales.slice(0, 10).map((record, i) => {
                const formattedDate = formatDateDisplay(record.date);
                return (
                  <div
                    key={i}
                    onClick={() => {
                      handleDishSelect(record.menu_item_name);
                      setActualSold(record.quantity_sold);
                      setQuantityPrepared(Math.round(record.quantity_sold * 1.25));
                    }}
                    className="px-5 py-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-slate-500 min-w-24">{formattedDate}</span>
                      <span className="font-semibold text-slate-800">{record.menu_item_name}</span>
                      <span className="text-slate-400">({record.meal_type}, {record.weather_condition})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-600">
                        Demanded: <strong className="text-slate-900">{record.quantity_sold}</strong>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
