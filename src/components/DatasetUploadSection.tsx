import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Database,
  RefreshCw,
  Trash2,
  Utensils,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { ProcessedDataset } from '../utils/dataProcessor';

interface DatasetUploadSectionProps {
  dataset: ProcessedDataset | null;
  datasetName: string;
  onDatasetLoaded: (data: any[], fileName: string) => void;
  onClearDataset: () => void;
  onNavigate: (tab: string) => void;
}

export const DatasetUploadSection: React.FC<DatasetUploadSectionProps> = ({
  dataset,
  datasetName,
  onDatasetLoaded,
  onClearDataset,
  onNavigate,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [alertNotice, setAlertNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to handle parsed CSV rows
  const handleParseResults = (rows: any[], fileName: string) => {
    try {
      if (!rows || rows.length === 0) {
        setErrorMsg('The uploaded file appears to be empty.');
        setIsLoading(false);
        return;
      }

      onDatasetLoaded(rows, fileName);
      setErrorMsg(null);
      setAlertNotice(null);
      setIsLoading(false);
    } catch (err: any) {
      setErrorMsg(`Error processing dataset: ${err?.message || 'Invalid format'}`);
      setIsLoading(false);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setErrorMsg('Please upload a valid CSV file (.csv).');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setAlertNotice(null);

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        handleParseResults(results.data, file.name);
      },
      error: (err) => {
        setErrorMsg(`CSV Parsing error: ${err.message}`);
        setIsLoading(false);
      },
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Load sample dataset directly from public/restaurant_sales_data.csv
  const handleLoadSampleDataset = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setAlertNotice(null);
    try {
      const response = await fetch('/restaurant_sales_data.csv');
      if (!response.ok) {
        throw new Error('Could not fetch sample dataset.');
      }
      const csvText = await response.text();
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          handleParseResults(results.data, 'restaurant_sales_data.csv');
        },
        error: (err) => {
          setErrorMsg(`Failed to parse sample dataset: ${err.message}`);
          setIsLoading(false);
        },
      });
    } catch (err: any) {
      setErrorMsg(`Failed to load sample dataset: ${err?.message || 'Network error'}`);
      setIsLoading(false);
    }
  };

  // Navigation handlers with dataset validation
  const handleRunForecastClick = () => {
    if (!dataset) {
      setAlertNotice('Please upload your dataset first to continue.');
      return;
    }
    setAlertNotice(null);
    onNavigate('forecast');
  };

  const handleAuditWasteClick = () => {
    if (!dataset) {
      setAlertNotice('Please upload your dataset first to continue.');
      return;
    }
    setAlertNotice(null);
    onNavigate('waste');
  };

  return (
    <div className="space-y-6">
      {/* Notice Banner if user tries to navigate without dataset */}
      {alertNotice && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start space-x-3 shadow-xs animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-amber-900">Action Required</h4>
            <p className="text-xs text-amber-800 mt-0.5">{alertNotice}</p>
          </div>
          <button
            onClick={() => setAlertNotice(null)}
            className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Welcome banner moved from Overview (CHANGE 2 requirement) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl text-white p-6 sm:p-8 shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>Primary Domain: College Canteen & Hostel Mess</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            AI-based Smart Food Demand Forecasting
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Eliminate dining hall surplus waste and prevent meal stockouts through end-to-end demand prediction, safety buffer optimization, and raw ingredient procurement planning.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRunForecastClick}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium text-sm flex items-center space-x-2 transition shadow-xs cursor-pointer"
            >
              <span>Run Demand Forecast</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleAuditWasteClick}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium text-sm flex items-center space-x-2 transition cursor-pointer"
            >
              <span>All Kitchen Food Waste</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dataset Upload Area */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Dataset Upload & Ingestion Engine</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload your sales CSV file once to dynamically power all forecasts, trends, and waste auditing across the platform.
            </p>
          </div>

          {dataset && (
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Active Dataset Loaded
              </span>
              <button
                onClick={onClearDataset}
                title="Remove dataset and test empty state"
                className="px-2.5 py-1 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md font-medium flex items-center space-x-1 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          )}
        </div>

        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/50'
              : dataset
              ? 'border-emerald-300 bg-emerald-50/20 hover:bg-emerald-50/40'
              : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              {isLoading ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                {isLoading
                  ? 'Parsing and processing dataset...'
                  : dataset
                  ? `Replace current dataset (${datasetName})`
                  : 'Click to upload or drag & drop restaurant sales CSV'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Standard format with columns: date, menu_item_name, quantity_sold, actual_selling_price, typical_ingredient_cost, etc.
              </p>
            </div>

            <div className="pt-2">
              <span className="inline-block px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition">
                Browse Files (.csv)
              </span>
            </div>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1-Click Load Sample Dataset option */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                Quick Start: Load Verified Benchmark Dataset
              </h4>
              <p className="text-[11px] text-slate-500">
                Load the bundled <span className="font-mono font-medium">restaurant_sales_data.csv</span> (1,097 sales records across 10 dishes and 50 outlets).
              </p>
            </div>
          </div>

          <button
            onClick={handleLoadSampleDataset}
            disabled={isLoading}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Load Sample Dataset</span>
          </button>
        </div>

        {/* If dataset is loaded, display dynamic metrics summary & preview */}
        {dataset && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Loaded Dataset Summary: {datasetName}</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Total Verified Records</span>
                <span className="text-lg font-bold text-slate-900">
                  {dataset.summary.total_records.toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Unique Dishes Analyzed</span>
                <span className="text-lg font-bold text-emerald-600">
                  {Object.keys(dataset.dishes).length}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Total Volume Sold</span>
                <span className="text-lg font-bold text-purple-600">
                  {dataset.summary.total_volume.toLocaleString()} units
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Date Range</span>
                <span className="text-xs font-bold text-slate-700 block mt-1">
                  {dataset.summary.start_date} – {dataset.summary.end_date}
                </span>
              </div>
            </div>

            {/* Quick Preview Table */}
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">Preview: First 5 Records</span>
                <span className="text-slate-400">Showing 5 of {dataset.summary.total_records} rows</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200 text-[10px]">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Dish</th>
                      <th className="px-4 py-2">Meal Type</th>
                      <th className="px-4 py-2 text-right">Quantity Sold</th>
                      <th className="px-4 py-2 text-right">Selling Price</th>
                      <th className="px-4 py-2 text-right">Unit Cost</th>
                      <th className="px-4 py-2">Weather</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dataset.rawRecords.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        <td className="px-4 py-2 font-mono text-slate-600">{row.date}</td>
                        <td className="px-4 py-2 font-semibold text-slate-900">{row.menu_item_name}</td>
                        <td className="px-4 py-2 text-slate-600">{row.meal_type}</td>
                        <td className="px-4 py-2 text-right font-bold text-emerald-700">{row.quantity_sold}</td>
                        <td className="px-4 py-2 text-right text-slate-700">${Number(row.actual_selling_price).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right text-slate-500">${Number(row.typical_ingredient_cost).toFixed(2)}</td>
                        <td className="px-4 py-2 text-slate-600">{row.weather_condition}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dataset Requirements Guide */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-bold text-slate-900">Supported Dataset Schema</h4>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The pipeline automatically maps header column names case-insensitively. For optimal results, include columns for:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="font-mono font-semibold text-slate-900">date</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">Observation date (M/D/YYYY or YYYY-MM-DD)</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="font-mono font-semibold text-slate-900">menu_item_name</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">Dish name (e.g., Nasi Lemak, Laksa)</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="font-mono font-semibold text-slate-900">quantity_sold</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">Target portions demanded by customers</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="font-mono font-semibold text-slate-900">actual_selling_price</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">Menu price charged to diner</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="font-mono font-semibold text-slate-900">typical_ingredient_cost</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">Raw ingredient procurement cost</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="font-mono font-semibold text-slate-900">meal_type, weather_condition</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">Breakfast/Lunch/Dinner, Sunny/Rainy/Cloudy</span>
          </div>
        </div>
      </div>
    </div>
  );
};
