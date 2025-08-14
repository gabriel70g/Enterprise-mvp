'use client';

import React from 'react';
import AdvancedMetrics from './AdvancedMetrics';
import FilterControls from './FilterControls';
import { useTraceData } from '../context/TraceContext';

const DashboardControls: React.FC = () => {
  const { stats } = useTraceData();

  return (
    <div className="grid grid-cols-12 p-1.5 bg-gray-900 text-white items-start">
      <div className="col-span-12">
        <AdvancedMetrics 
          totalOrders={stats.total}
          completedOrders={stats.completed}
          averageProcessingTime={stats.averageDuration || 0}
          successRate={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}
          activeCorrelations={stats.total - stats.completed}
        />
      </div>
      <div className="col-span-12">
        <FilterControls />
      </div>
    </div>
  );
};

export default DashboardControls;
