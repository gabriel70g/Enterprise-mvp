'use client';

import React from 'react';
import StatsDisplay from './StatsDisplay';
import FilterControls from './FilterControls';
import { useTraceData } from '../context/TraceContext';

const DashboardControls: React.FC = () => {
  const { stats } = useTraceData();

  return (
    <div className="grid grid-cols-12 gap-1.5 p-1.5 bg-gray-900 text-white items-start">
      {/* Contadores (4/12) */}
      <div className="col-span-4">
        <StatsDisplay 
          totalTraces={stats.total}
          pendingTraces={stats.pending}
          completedTraces={stats.completed}
          failedTraces={stats.failed}
        />
      </div>

      {/* Filtros (8/12) */}
      <div className="col-span-8">
        <FilterControls />
      </div>
    </div>
  );
};

export default DashboardControls;
