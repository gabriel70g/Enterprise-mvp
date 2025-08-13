import React from 'react';

interface StatsDisplayProps {
  totalTraces?: number;
  pendingTraces?: number;
  completedTraces?: number;
  failedTraces?: number;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({
  totalTraces = 0,
  pendingTraces = 0,
  completedTraces = 0,
  failedTraces = 0,
}) => {
  return (
    <div className="flex justify-around mt-1 text-xs bg-[#3a3f47] py-2 px-3 rounded-lg items-center h-10">
      <div className="text-center">
        <div className="text-sm font-bold text-[#667eea]">{totalTraces}</div>
        <div className="text-xs text-gray-300">Total</div>
      </div>
      <div className="text-center">
        <div className="text-sm font-bold text-[#ffc107]">{pendingTraces}</div>
        <div className="text-xs text-gray-300">Pendientes</div>
      </div>
      <div className="text-center">
        <div className="text-sm font-bold text-[#28a745]">{completedTraces}</div>
        <div className="text-xs text-gray-300">Completadas</div>
      </div>
      <div className="text-center">
        <div className="text-sm font-bold text-[#dc3545]">{failedTraces}</div>
        <div className="text-xs text-gray-300">Fallidas</div>
      </div>
    </div>
  );
};

export default StatsDisplay;
