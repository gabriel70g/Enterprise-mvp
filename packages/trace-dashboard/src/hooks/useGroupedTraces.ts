import { useMemo } from 'react';
import { Trace } from './useTraces';

export interface GroupedTrace {
  correlationId: string;
  traces: Trace[];
  latestTrace: Trace;
  totalStates: number;
  services: string[];
  actions: string[];
}

export const useGroupedTraces = (traces: Trace[]) => {
  return useMemo(() => {
    console.log('🔄 useGroupedTraces - Recibidas trazas:', traces.length);
    console.log('🔄 useGroupedTraces - Primeras trazas:', traces.slice(0, 3).map(t => ({ id: t.id, correlationId: t.correlationId, service: t.service })));
    
    const groups = new Map<string, Trace[]>();
    
    // Agrupar trazas por correlationId
    traces.forEach(trace => {
      if (!groups.has(trace.correlationId)) {
        groups.set(trace.correlationId, []);
      }
      groups.get(trace.correlationId)!.push(trace);
    });

    // Convertir a array y procesar cada grupo
    const result = Array.from(groups.entries()).map(([correlationId, traces]) => {
      // Ordenar por timestamp para obtener el más reciente primero
      const sortedTraces = traces.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Obtener servicios y acciones únicos
      const services = [...new Set(traces.map(t => t.service))];
      const actions = [...new Set(traces.map(t => t.action))];
      
      return {
        correlationId,
        traces: sortedTraces,
        latestTrace: sortedTraces[0],
        totalStates: traces.length,
        services,
        actions
      };
    }).sort((a, b) => 
      // Ordenar por timestamp del estado más reciente
      new Date(b.latestTrace.timestamp).getTime() - new Date(a.latestTrace.timestamp).getTime()
    );

    console.log('🔄 useGroupedTraces - Grupos creados:', result.length);
    console.log('🔄 useGroupedTraces - Primeros grupos:', result.slice(0, 3).map(g => ({ correlationId: g.correlationId, totalStates: g.totalStates })));
    
    return result;
  }, [traces]);
};
