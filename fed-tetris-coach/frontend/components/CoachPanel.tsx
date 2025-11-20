import React from 'react';
import { CoachAdvice } from '../lib/api';

interface CoachPanelProps {
  advice: CoachAdvice | null;
  isLoading: boolean;
}

const CoachPanel: React.FC<CoachPanelProps> = ({ advice, isLoading }) => {
  if (!advice) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50 h-full">
        <h2 className="text-xl font-bold mb-2 text-gray-700">AI Coach</h2>
        <p className="text-gray-500">Start playing to receive advice...</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">AI Coach</h2>
        {isLoading && <span className="text-xs text-blue-500 animate-pulse">Thinking...</span>}
      </div>

      <div className="mb-4">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recommended Action</span>
        <div className="text-3xl font-black text-blue-600 mt-1">
          {advice.recommendedAction}
        </div>
      </div>

      <div className="flex-grow">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Explanation</span>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
          {advice.explanation}
        </p>
      </div>

      {advice.source && (
         <div className="mt-4 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-400">Source: {advice.source}</span>
         </div>
      )}
    </div>
  );
};

export default CoachPanel;
