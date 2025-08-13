import { useState, useMemo, useCallback } from 'react';
import { Trace } from './useTraces';
import { useGroupedTraces } from './useGroupedTraces';

interface FilterState {
  correlationId: string;
  service: string;
  status: string;
}

export const useFilteredTraces = (traces: Trace[]) => {
  const [filters, setFilters] = useState<FilterState>({
    correlationId: '',
    service: '',
    status: ''
  });

  // Hacer una copia de las trazas originales para no afectar la lógica base
  const originalTraces = useMemo(() => [...traces], [traces]);
  
  // Generar opciones dinámicas para los selects
  const availableOptions = useMemo(() => {
    const services = [...new Set(originalTraces.map(trace => trace.service))].sort();
    const statuses = [...new Set(originalTraces.map(trace => trace.status))].sort();
    
    return { services, statuses };
  }, [originalTraces]);
  
  // Aplicar filtros sobre la copia
  const filteredTraces = useMemo(() => {
    let filtered = [...originalTraces];

    console.log('🔍 Aplicando filtros:', filters);
    console.log('📊 Trazas originales:', originalTraces.length);

    if (filters.correlationId) {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(trace => 
        trace.correlationId.toLowerCase().includes(filters.correlationId.toLowerCase())
      );
      console.log(`🔍 Filtro correlationId "${filters.correlationId}": ${beforeFilter} → ${filtered.length}`);
      
      // Mostrar algunos ejemplos de correlationIds disponibles
      if (filtered.length === 0) {
        console.log('📋 CorrelationIds disponibles:', originalTraces.slice(0, 5).map(t => t.correlationId));
      }
    }

    if (filters.service) {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(trace => trace.service === filters.service);
      console.log(`🔍 Filtro service "${filters.service}": ${beforeFilter} → ${filtered.length}`);
    }

    if (filters.status) {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(trace => trace.status === filters.status);
      console.log(`🔍 Filtro status "${filters.status}": ${beforeFilter} → ${filtered.length}`);
    }

    console.log('✅ Trazas filtradas finales:', filtered.length);
    console.log('📋 Primeras 3 trazas filtradas:', filtered.slice(0, 3).map(t => ({ id: t.id, correlationId: t.correlationId, service: t.service })));
    
    return filtered;
  }, [originalTraces, filters]);

  // Usar el hook de agrupación sobre las trazas filtradas
  const groupedFilteredTraces = useGroupedTraces(filteredTraces);

  // Función para actualizar filtros - SIMPLE Y FÁCIL
  const updateFilter = useCallback((key: string, value: string) => {
    console.log(`🔄 Actualizando filtro ${key}: "${value}"`);
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Función para limpiar todos los filtros
  const clearFilters = useCallback(() => {
    setFilters({
      correlationId: '',
      service: '',
      status: ''
    });
  }, []);

  // Función para limpiar localStorage (vaciar todas las trazas)
  const clearAllTraces = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('cqrs_dashboard_traces');
      // Recargar la página para que se refleje el cambio
      window.location.reload();
    }
  }, []);

  return {
    filters,
    updateFilter,
    clearFilters,
    clearAllTraces,
    filteredTraces,
    groupedFilteredTraces,
    availableOptions,
    hasActiveFilters: Object.values(filters).some(value => value !== '')
  };
};
