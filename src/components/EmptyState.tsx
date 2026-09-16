import React from 'react';
import { UploadCloud, ArrowRight, FileSpreadsheet, ShieldAlert } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  onNavigateToUpload: () => void;
  actionText?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Dataset Uploaded',
  message = 'Please upload your dataset first to continue.',
  onNavigateToUpload,
  actionText = 'Go to Dataset Upload',
}) => {
  return (
    <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs">
      <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
        <FileSpreadsheet className="w-7 h-7" />
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
        {title}
      </h3>

      <p className="text-slate-600 text-sm max-w-md mx-auto mb-6 leading-relaxed">
        {message}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onNavigateToUpload}
          className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm flex items-center justify-center space-x-2 transition shadow-xs cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>{actionText}</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center text-xs text-slate-400">
        <ShieldAlert className="w-3.5 h-3.5 mr-1 text-slate-400" />
        <span>One uploaded dataset powers demand forecasting, waste audits, trends, and dish rankings</span>
      </div>
    </div>
  );
};
