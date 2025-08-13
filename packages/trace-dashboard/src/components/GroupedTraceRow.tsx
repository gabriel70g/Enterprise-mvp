import React, { useState } from 'react';
import { GroupedTrace } from '../hooks/useGroupedTraces';
import { getStatusInfo } from '../config/statusConfig';

interface GroupedTraceRowProps {
  group: GroupedTrace;
}

const GroupedTraceRow: React.FC<GroupedTraceRowProps> = ({ group }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMultipleStates = group.totalStates > 1;
  const latestStatusInfo = getStatusInfo(group.latestTrace.status);

  const toggleExpansion = () => {
    if (hasMultipleStates) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <>
      {/* Fila principal con el estado más reciente */}
      <tr 
        className={`border-b border-gray-700 transition-colors ${
          hasMultipleStates ? 'cursor-pointer hover:bg-gray-700' : ''
        }`}
        onClick={toggleExpansion}
      >
        <td className="p-2.5">
          {hasMultipleStates && (
            <button 
              className={`w-5 h-5 rounded transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : ''
              } hover:bg-gray-600`}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpansion();
              }}
            >
              ▶
            </button>
          )}
        </td>
        <td className="p-2.5 font-mono text-xs">{group.correlationId}</td>
        <td className="p-2.5">
          {group.services.length === 1 ? group.services[0] : `${group.services.length} servicios`}
        </td>
        <td className="p-2.5">
          {group.actions.length === 1 ? group.actions[0] : `${group.actions.length} acciones`}
        </td>
        <td className={`p-2.5 ${latestStatusInfo.color} flex items-center gap-2`}>
          <span>{latestStatusInfo.icon}</span>
          <span>{group.latestTrace.status.toUpperCase()}</span>
        </td>
        <td className="p-2.5">{group.latestTrace.duration}ms</td>
        <td className="p-2.5">{new Date(group.latestTrace.timestamp).toLocaleTimeString()}</td>
        <td className="p-2.5">
          {hasMultipleStates && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {group.totalStates} estados
            </span>
          )}
        </td>
      </tr>
      
      {/* Filas expandibles con el historial completo */}
      {isExpanded && group.traces.slice(1).map((trace, index) => {
        const statusInfo = getStatusInfo(trace.status);
        return (
          <tr key={`${group.correlationId}-${index}`} className="border-b border-gray-600 bg-gray-750">
            <td className="p-2.5 pl-8 text-gray-400">└─</td>
            <td className="p-2.5 text-gray-400 font-mono text-xs">{trace.correlationId}</td>
            <td className="p-2.5 text-gray-400">{trace.service}</td>
            <td className="p-2.5 text-gray-400">{trace.action}</td>
            <td className={`p-2.5 ${statusInfo.color} flex items-center gap-2`}>
              <span className="text-gray-400">{statusInfo.icon}</span>
              <span className="text-gray-400">{trace.status.toUpperCase()}</span>
            </td>
            <td className="p-2.5 text-gray-400">{trace.duration}ms</td>
            <td className="p-2.5 text-gray-400">{new Date(trace.timestamp).toLocaleTimeString()}</td>
            <td className="p-2.5 text-gray-400">Historial</td>
          </tr>
        );
      })}
    </>
  );
};

export default GroupedTraceRow;
