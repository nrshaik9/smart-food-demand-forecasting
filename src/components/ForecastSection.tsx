import React, { useState } from 'react';
import { DishInfo, ModelMetricsData } from '../types';
import {
  runClientForecast,
  PredictionResult,
  MONTH_OPTIONS,
  EVENT_OPTIONS,
  DAYS_OF_WEEK,
  DayOfWeek,
  EventCondition,
  BinaryChoice,
} from '../utils/predictor';
import {
  Sparkles,
  ShoppingBag,
  Shield,
  CloudSun,
  Coins,
  History,
  CalendarDays,
  CalendarCheck,
  PartyPopper,
} from 'lucide-react';
import { EmptyState } from './EmptyState';

interface ForecastSectionProps {
  dishes: Record<string, DishInfo> | null;
  metrics: ModelMetricsData | null;
  hasDataset: boolean;
  onNavigate: (tab: string) => void;
}

export const ForecastSection: React.FC<ForecastSectionProps> = ({
  dishes,
  metrics,
  hasDataset,
  onNavigate,
}) => {
  if (!hasDataset || !dishes || !metrics || Object.keys(dishes).length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Real-Time Demand Forecast & Preparation Planner
          </h2>
          <p className="text-sm text-slate-500">
            Run the trained machine learning pipeline to compute anticipated demand, safety buffer requirements, and raw ingredient procurement.
          </p>
        </div>

        <EmptyState
          title="Dataset Required for Demand Forecasting"
          message="Please upload your dataset first to continue."
          onNavigateToUpload={() => onNavigate('upload')}
          actionText="Go to Dataset Upload"
        />
      </div>
    );
  }

  const dishList = Object.values(dishes) as DishInfo[];
  const [selectedDishName, setSelectedDishName] = useState<string>(dishList[0]?.name || '');
  const currentDish = dishes[selectedDishName] || dishList[0];

  // Currency Selection: Default to INR (₹), with option for Other Currency
  const [currencyMode, setCurrencyMode] = useState<string>('INR');
  const [customCurrencySymbol, setCustomCurrencySymbol] = useState<string>('');

  const activeCurrencySymbol =
    currencyMode === 'INR'
      ? '₹'
      : currencyMode === 'USD'
      ? '$'
      : currencyMode === 'EUR'
      ? '€'
      : currencyMode === 'GBP'
      ? '£'
      : customCurrencySymbol.trim() || '₹';

  // Input states
  const [previousDemand, setPreviousDemand] = useState<number | string>(
    Math.round(currentDish?.avg_quantity_sold || 100)
  );
  const [selectedMonth, setSelectedMonth] = useState<string>('September');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('Monday');
  const [isWeekend, setIsWeekend] = useState<BinaryChoice>('No');
  const [eventOption, setEventOption] = useState<EventCondition>('No Event');

  const [restaurantType, setRestaurantType] = useState<string>(
    metrics.restaurant_types[0] || 'Food Stall'
  );
  const [mealType, setMealType] = useState<string>(currentDish?.common_meal_type || 'Lunch');
  const [weather, setWeather] = useState<string>('Sunny');
  const [sellingPrice, setSellingPrice] = useState<number | string>(currentDish?.avg_selling_price || 120);
  const [safetyBufferPct, setSafetyBufferPct] = useState<number>(10);

  // Update defaults when dish selection changes
  const handleDishChange = (name: string) => {
    setSelectedDishName(name);
    const d = dishes[name];
    if (d) {
      setSellingPrice(d.avg_selling_price);
      setMealType(d.common_meal_type);
      setPreviousDemand(Math.round(d.avg_quantity_sold));
    }
  };

  const parsedPreviousDemand =
    typeof previousDemand === 'number'
      ? previousDemand
      : parseInt(previousDemand, 10) || 0;

  const parsedSellingPrice =
    typeof sellingPrice === 'number'
      ? sellingPrice
      : parseFloat(sellingPrice) || 0;

  const result: PredictionResult = runClientForecast({
    dish: currentDish,
    previousDemand: parsedPreviousDemand,
    month: selectedMonth,
    dayOfWeek,
    isWeekend,
    eventOption,
    sellingPrice: parsedSellingPrice,
    safetyBufferPct,
    mealType,
    weather,
    currencySymbol: activeCurrencySymbol,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Real-Time Demand Forecast & Preparation Planner
          </h2>
          <p className="text-sm text-slate-500">
            Run the trained machine learning pipeline to compute anticipated demand, safety buffer requirements, and raw ingredient procurement.
          </p>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
          <Coins className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-700">Currency:</span>
          <select
            value={currencyMode}
            onChange={(e) => setCurrencyMode(e.target.value)}
            className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded px-2 py-1 focus:ring-emerald-500"
          >
            <option value="INR">INR (₹) - Default</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="OTHER">Other Currency...</option>
          </select>

          {currencyMode === 'OTHER' && (
            <input
              type="text"
              placeholder="Symbol / Code"
              maxLength={5}
              value={customCurrencySymbol}
              onChange={(e) => setCustomCurrencySymbol(e.target.value)}
              className="w-20 px-2 py-1 text-xs border border-slate-300 rounded text-slate-900 font-bold uppercase"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Controls */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
            <Sparkles className="w-4 h-4 text-emerald-600 mr-1.5" />
            Operational Parameters
          </h3>

          {/* Dish Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Menu Item</label>
            <select
              value={selectedDishName}
              onChange={(e) => handleDishChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
            >
              {dishList.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name} (Avg: {d.avg_quantity_sold} portions)
                </option>
              ))}
            </select>
          </div>

          {/* New Input Field 1: Previous Recorded Demand */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
              <History className="w-3.5 h-3.5 mr-1 text-slate-500" />
              <span>Previous Recorded Demand (Lag Value)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={previousDemand}
                onFocus={(e) => {
                  if (e.target.value === '0') e.target.select();
                }}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setPreviousDemand('');
                    return;
                  }
                  const digitsOnly = raw.replace(/[^0-9]/g, '');
                  const cleaned = digitsOnly.replace(/^0+(?=\d)/, '');
                  setPreviousDemand(cleaned);
                }}
                onBlur={() => {
                  if (previousDemand === '') {
                    setPreviousDemand(0);
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">portions</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Historical sales volume observed during the preceding period.
            </p>
          </div>

          {/* New Input Field 2: Month */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
              <CalendarDays className="w-3.5 h-3.5 mr-1 text-slate-500" />
              <span>Month</span>
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Input Fields: Day of Week (7 Days) and Weekend (Yes/No) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
                <CalendarCheck className="w-3.5 h-3.5 mr-1 text-slate-500" />
                <span>Day of Week</span>
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => {
                  const selected = e.target.value as DayOfWeek;
                  setDayOfWeek(selected);
                  if (selected === 'Saturday' || selected === 'Sunday') {
                    setIsWeekend('Yes');
                  } else {
                    setIsWeekend('No');
                  }
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-800"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
                <CalendarCheck className="w-3.5 h-3.5 mr-1 text-slate-500" />
                <span>Weekend</span>
              </label>
              <select
                value={isWeekend}
                onChange={(e) => setIsWeekend(e.target.value as BinaryChoice)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-800"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>

          {/* Reordered Event Options */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
              <PartyPopper className="w-3.5 h-3.5 mr-1 text-slate-500" />
              <span>Event / Campus Schedule</span>
            </label>
            <select
              value={eventOption}
              onChange={(e) => setEventOption(e.target.value as EventCondition)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-800"
            >
              {EVENT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Meal Period</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                {metrics.meal_types.map((mt) => (
                  <option key={mt} value={mt}>{mt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
                <CloudSun className="w-3.5 h-3.5 mr-1 text-slate-500" />
                <span>Weather</span>
              </label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                {metrics.weather_conditions.map((wc) => (
                  <option key={wc} value={wc}>{wc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Selling Price in chosen currency (₹ default) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Actual Selling Price ({activeCurrencySymbol})
              </label>
              <span className="text-xs text-slate-400">
                Ref: {activeCurrencySymbol}{currentDish.market_price.toFixed(2)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm text-slate-500 font-bold pointer-events-none">
                {activeCurrencySymbol}
              </span>
              <input
                type="number"
                step="0.5"
                min="0"
                value={sellingPrice}
                onFocus={(e) => {
                  if (e.target.value === '0') e.target.select();
                }}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setSellingPrice('');
                    return;
                  }
                  let cleaned = raw.replace(/[^0-9.]/g, '');
                  const parts = cleaned.split('.');
                  if (parts.length > 2) {
                    cleaned = parts[0] + '.' + parts.slice(1).join('');
                  }
                  if (cleaned.startsWith('0') && cleaned.length > 1 && cleaned[1] !== '.') {
                    cleaned = cleaned.replace(/^0+(?=[1-9])/, '');
                  }
                  setSellingPrice(cleaned);
                }}
                onBlur={() => {
                  if (sellingPrice === '') {
                    setSellingPrice(0);
                  }
                }}
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
              />
            </div>
          </div>

          {/* Safety Buffer Slider */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-900 flex items-center">
                <Shield className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Kitchen Safety Buffer
              </label>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                +{safetyBufferPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={safetyBufferPct}
              onChange={(e) => setSafetyBufferPct(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Guards against unexpected rush hours while bounding food waste risk.
            </p>
          </div>
        </div>

        {/* Right 2 Columns: Results Dashboard & Ingredient Procurement Sheet */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Output Banner Cards (Currency formatted with INR / active currency) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Predicted Demand
              </span>
              <div className="text-2xl font-bold text-slate-900">{result.predicted_demand}</div>
              <span className="text-xs text-slate-400">Estimated sales</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Safety Buffer
              </span>
              <div className="text-2xl font-bold text-amber-600">+{result.safety_buffer_units}</div>
              <span className="text-xs text-slate-400">+{result.safety_buffer_pct}% stockout guard</span>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block mb-1">
                Recommended Prep
              </span>
              <div className="text-2xl font-bold text-emerald-700">{result.recommended_preparation}</div>
              <span className="text-xs text-emerald-600">Portions to cook</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Expected Profit
              </span>
              <div className="text-2xl font-bold text-slate-900">
                {activeCurrencySymbol}{result.estimated_profit_at_demand.toLocaleString()}
              </div>
              <span className="text-xs text-slate-400">At demand target</span>
            </div>
          </div>

          {/* NOTE: 'Recommended Preparation Formula Applied' section was REMOVED per Change 3 requirement */}

          {/* Ingredient Procurement Sheet */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Kitchen Procurement Sheet ({result.recommended_preparation} portions of {result.menu_item_name})
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Unit Ingredient Cost: {activeCurrencySymbol}{result.unit_ingredient_cost.toFixed(2)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Raw Constituent Ingredient</th>
                    <th className="px-6 py-3 text-right">Units / Portions Needed</th>
                    <th className="px-6 py-3 text-right">Est. Unit Cost</th>
                    <th className="px-6 py-3 text-right">Total Est. Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.ingredients.map((ing, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3 font-medium text-slate-900 capitalize">{ing.ingredient}</td>
                      <td className="px-6 py-3 text-right font-mono text-slate-700">{ing.units_needed}</td>
                      <td className="px-6 py-3 text-right text-slate-500">
                        {activeCurrencySymbol}{ing.unit_cost_est.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-slate-900">
                        {activeCurrencySymbol}{ing.total_ingredient_cost_est.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50/80 font-semibold text-slate-900 border-t border-slate-200">
                  <tr>
                    <td className="px-6 py-3">Total Estimated Preparation Cost</td>
                    <td className="px-6 py-3 text-right">{result.recommended_preparation} portions</td>
                    <td className="px-6 py-3 text-right text-slate-400">—</td>
                    <td className="px-6 py-3 text-right text-emerald-700 font-bold">
                      {activeCurrencySymbol}{result.estimated_cost.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between text-xs text-slate-600">
              <span>
                Anticipated Sales Revenue: <strong>{activeCurrencySymbol}{result.estimated_revenue_at_demand.toFixed(2)}</strong>
              </span>
              <span>
                Projected Gross Margin: <strong>{activeCurrencySymbol}{result.estimated_profit_at_demand.toFixed(2)}</strong> (
                {((result.estimated_profit_at_demand / Math.max(result.estimated_revenue_at_demand, 1)) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
