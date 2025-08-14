import { useState, useEffect, useCallback } from 'react';

// Define the structure of a single trace
export interface Trace {
  id: string;
  correlationId: string;
  service: string;
  action: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  duration: number;
  payload: Record<string, unknown>;
}

const MAX_TRACES = process.env.MAX_TRACES ? parseInt(process.env.MAX_TRACES) : 2000;
const STORAGE_KEY = 'cqrs_dashboard_traces';

// Helper to check if running in the browser
const isBrowser = typeof window !== 'undefined';

/**
 * A custom hook to manage, persist, and synchronize traces for the dashboard.
 */
export const useTraces = () => {
  const [traces, setTraces] = useState<Trace[]>(() => {
    if (!isBrowser) {
      return [];
    }
    try {
      const storedTraces = window.localStorage.getItem(STORAGE_KEY);
      return storedTraces ? JSON.parse(storedTraces) : [];
    } catch (error) {
      console.error("Error reading from localStorage", error);
      return [];
    }
  });

  // Effect for persisting state to localStorage
  useEffect(() => {
    if (isBrowser) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(traces));
      } catch (error) {
        console.error("Error writing to localStorage", error);
      }
    }
  }, [traces]);

  // Effect for listening to storage changes from other tabs
  useEffect(() => {
    if (!isBrowser) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          setTraces(JSON.parse(event.newValue));
        } catch (error) {
          console.error("Error parsing traces from storage event", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Function to add a new trace, respecting the size limit
  const addTrace = useCallback((newTrace: Trace) => {
    setTraces(prevTraces => {
      const updatedTraces = [newTrace, ...prevTraces];
      if (updatedTraces.length > MAX_TRACES) {
        return updatedTraces.slice(0, MAX_TRACES);
      }
      return updatedTraces;
    });
  }, []);

  return { traces, addTrace };
};
