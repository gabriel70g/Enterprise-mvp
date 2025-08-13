'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { Trace, useTraces } from '../hooks/useTraces';
import { useTraceSocket } from '../hooks/useTraceSocket';

// Define the shape of the statistics object
interface TraceStats {
  total: number;
  pending: number;
  completed: number;
  failed: number;
}

// Define the shape of the context value
interface TraceContextValue {
  traces: Trace[];
  stats: TraceStats;
}

// Create the context with a default value
const TraceContext = createContext<TraceContextValue | undefined>(undefined);

// Define the props for the provider
interface TraceProviderProps {
  children: ReactNode;
}

/**
 * Provides trace data and calculated statistics to its children components.
 */
export const TraceProvider: React.FC<TraceProviderProps> = ({ children }) => {
  const { traces, addTrace } = useTraces(); // Get both traces and the addTrace function

  // Establish the WebSocket connection and link it to the addTrace function
  useTraceSocket(addTrace);

  // Calculate statistics, memoizing the result for efficiency
  const stats = useMemo(() => {
    return traces.reduce(
      (acc, trace) => {
        acc.total += 1;
        if (trace.status === 'pending') acc.pending += 1;
        if (trace.status === 'completed') acc.completed += 1;
        if (trace.status === 'failed') acc.failed += 1;
        return acc;
      },
      { total: 0, pending: 0, completed: 0, failed: 0 }
    );
  }, [traces]);

  const value = {
    traces,
    stats,
  };

  return <TraceContext.Provider value={value}>{children}</TraceContext.Provider>;
};

/**
 * Custom hook to easily consume the TraceContext.
 */
export const useTraceData = () => {
  const context = useContext(TraceContext);
  if (context === undefined) {
    throw new Error('useTraceData must be used within a TraceProvider');
  }
  return context;
};
