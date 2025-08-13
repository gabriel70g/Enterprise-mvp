'use client';

import React from 'react';
import StatsDisplay from './StatsDisplay';
import FilterControls from './FilterControls';
import { useTraceData } from '../context/TraceContext'; // Import the hook

const DashboardControls: React.FC = () => {
  const { stats } = useTraceData(); // Consume the context

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(12, 1fr)',
      gap: '5px',
      padding: '5px',
      backgroundColor: '#1a1c20',
      color: 'white',
      alignItems: 'start'
    }}>
      {/* Contadores (4/12) */}
      <div style={{ gridColumn: 'span 4' }}>
        <StatsDisplay 
          totalTraces={stats.total}
          pendingTraces={stats.pending}
          completedTraces={stats.completed}
          failedTraces={stats.failed}
        />
      </div>

      {/* Filtros (8/12) */}
      <div style={{ gridColumn: 'span 8' }}>
        <FilterControls  />
      </div>
    </div>
  );
};

export default DashboardControls;
