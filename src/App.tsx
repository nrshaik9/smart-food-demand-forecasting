import React, { useState } from 'react';
import { Header } from './components/Header';
import { DatasetUploadSection } from './components/DatasetUploadSection';
import { OverviewSection } from './components/OverviewSection';
import { ForecastSection } from './components/ForecastSection';
import { TrendsSection } from './components/TrendsSection';
import { WasteSection } from './components/WasteSection';
import { DishSection } from './components/DishSection';
import { ModelInsightsSection } from './components/ModelInsightsSection';
import { processSalesDataset, ProcessedDataset } from './utils/dataProcessor';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [dataset, setDataset] = useState<ProcessedDataset | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');

  const handleDatasetLoaded = (rows: any[], fileName: string) => {
    const processed = processSalesDataset(rows);
    setDataset(processed);
    setDatasetName(fileName);
  };

  const handleClearDataset = () => {
    setDataset(null);
    setDatasetName('');
  };

  const hasDataset = Boolean(dataset);
  const dishes = dataset?.dishes || null;
  const summary = dataset?.summary || null;
  const metrics = dataset?.metrics || null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasDataset={hasDataset}
        recordCount={summary?.total_records || 0}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <DatasetUploadSection
            dataset={dataset}
            datasetName={datasetName}
            onDatasetLoaded={handleDatasetLoaded}
            onClearDataset={handleClearDataset}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'overview' && (
          <OverviewSection
            metrics={metrics}
            summary={summary}
            hasDataset={hasDataset}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'forecast' && (
          <ForecastSection
            dishes={dishes}
            metrics={metrics}
            hasDataset={hasDataset}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'trends' && (
          <TrendsSection
            summary={summary}
            hasDataset={hasDataset}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'waste' && (
          <WasteSection
            dishes={dishes}
            summary={summary}
            hasDataset={hasDataset}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'dishes' && (
          <DishSection
            summary={summary}
            dishes={dishes}
            hasDataset={hasDataset}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'insights' && (
          <ModelInsightsSection
            metrics={metrics}
            hasDataset={hasDataset}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            AI-Based Smart Food Demand Forecasting System • College Canteen / Hostel Mess / Restaurant
          </span>
          {dataset ? (
            <span>
              Active Dataset: {datasetName} ({summary?.total_records.toLocaleString()} records, {Object.keys(dataset.dishes).length} dishes)
            </span>
          ) : (
            <span className="text-amber-600 font-medium">
              No active dataset loaded • Upload a CSV to enable forecasting
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}
