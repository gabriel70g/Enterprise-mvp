import React from 'react';
import { useTraceData } from '../context/TraceContext';

const FilterControls: React.FC = () => {
  const {
    filters,
    updateFilter,
    clearFilters,
    clearAllTraces,
    availableOptions,
    hasActiveFilters
  } = useTraceData();

  return (
    <div className="bg-[#3a3f47] p-1 rounded-lg mt-1 flex flex-wrap gap-3 justify-center items-center">
      <input
        type="text"
        placeholder="Filtrar por Correlation ID"
        value={filters.correlationId}
        onChange={(e) => updateFilter('correlationId', e.target.value)}
        className="px-2 py-1 rounded border border-[#555] bg-[#282c34] text-white text-sm w-48"
      />
      <select
        value={filters.service}
        onChange={(e) => updateFilter('service', e.target.value)}
        className="px-2 py-1 rounded border border-[#555] bg-[#282c34] text-white text-sm w-36"
      >
        <option value="">Todos los servicios</option>
        {availableOptions.services.map(service => (
          <option key={service} value={service}>
            {service}
          </option>
        ))}
      </select>
      <select
        value={filters.status}
        onChange={(e) => updateFilter('status', e.target.value)}
        className="px-2 py-1 rounded border border-[#555] bg-[#282c34] text-white text-sm w-32"
      >
        <option value="">Todos los estados</option>
        {availableOptions.statuses.map(status => (
          <option key={status} value={status}>
            {status === 'pending' ? 'Pendientes' : 
             status === 'completed' ? 'Completadas' : 
             status === 'failed' ? 'Fallidas' : status}
          </option>
        ))}
      </select>
      
      {/* Botón Filtrar - siempre visible pero funcional */}
      <button 
        className="px-3 py-1 rounded border-none bg-[#667eea] text-white text-sm cursor-pointer hover:bg-[#5a6fd8] transition-colors"
        onClick={() => {
          // El filtrado ya funciona en tiempo real, este botón puede mostrar un mensaje
          console.log('Filtros aplicados:', filters);
        }}
      >
        Filtrar
      </button>
      
      {/* Botón Limpiar Filtros - solo cuando hay filtros activos */}
      {hasActiveFilters && (
        <button 
          onClick={clearFilters}
          className="px-3 py-1 rounded border-none bg-[#28a745] text-white text-sm cursor-pointer hover:bg-[#218838] transition-colors"
        >
          Limpiar Filtros
        </button>
      )}
      
      {/* Botón Limpiar Todas - siempre visible */}
      <button 
        onClick={clearAllTraces}
        className="px-3 py-1 rounded border-none bg-[#dc3545] text-white text-sm cursor-pointer hover:bg-[#c82333] transition-colors"
      >
        Limpiar Todas
      </button>
    </div>
  );
};

export default FilterControls;
