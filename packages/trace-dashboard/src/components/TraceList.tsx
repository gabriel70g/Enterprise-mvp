import React from 'react';
import { useTraceData } from '../context/TraceContext';
import TableHeader from './TableHeader';
import GroupedTraceRow from './GroupedTraceRow';
import EmptyState from './EmptyState';

const TraceList: React.FC = () => {
  const { groupedFilteredTraces, filteredTraces, traces } = useTraceData();

  // Debug: mostrar cuántas trazas hay en cada estado
  console.log('🔍 TraceList - Trazas originales:', traces.length);
  console.log('🔍 TraceList - Trazas filtradas:', filteredTraces.length);
  console.log('🔍 TraceList - Grupos filtrados:', groupedFilteredTraces.length);
  console.log('🔍 TraceList - Primeros grupos:', groupedFilteredTraces.slice(0, 3).map(g => ({ correlationId: g.correlationId, totalStates: g.totalStates })));

  return (
    <div className="overflow-x-auto bg-gray-800 rounded-lg">
      <table className="w-full border-collapse text-gray-100 text-sm">
        <TableHeader />
        <tbody>
          {groupedFilteredTraces.map((group) => {
            console.log('🔍 Renderizando grupo:', group.correlationId, 'con', group.totalStates, 'estados');
            return (
              <GroupedTraceRow key={group.correlationId} group={group} />
            );
          })}
        </tbody>
      </table>
      {groupedFilteredTraces.length === 0 && (
        <div className="text-center p-5">
          {filteredTraces.length === 0 && traces.length > 0 ? (
            <p>No se encontraron trazas con los filtros aplicados</p>
          ) : (
            <EmptyState />
          )}
        </div>
      )}
    </div>
  );
};

export default TraceList;
