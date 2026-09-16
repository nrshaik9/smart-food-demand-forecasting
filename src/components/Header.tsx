import React from 'react';
import { ChefHat, Sparkles, ShieldCheck, UploadCloud, AlertCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hasDataset: boolean;
  recordCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  hasDataset,
  recordCount,
}) => {
  const tabs = [
    { id: 'upload', label: '1. Dataset Upload' },
    { id: 'overview', label: '2. Overview' },
    { id: 'forecast', label: '3. Demand Forecast' },
    { id: 'trends', label: '4. Demand Trends' },
    { id: 'waste', label: '5. Food Waste Analytics' },
    { id: 'dishes', label: '6. Dish Analytics' },
    { id: 'insights', label: '7. Model Insights' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Smart Food Demand AI</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Production ML
                </span>
              </div>
              <p className="text-xs text-slate-500">Canteen & Mess Demand Forecasting • Waste Reduction Platform</p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            {hasDataset ? (
              <div className="flex items-center space-x-1.5 text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium">
                  Dataset: {recordCount.toLocaleString()} verified sales records
                </span>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('upload')}
                className="flex items-center space-x-1.5 text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full border border-amber-200 transition cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-semibold">Upload Dataset to Begin</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
