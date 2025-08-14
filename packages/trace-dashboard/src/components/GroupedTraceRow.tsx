import React, { useState } from 'react';
import { GroupedTrace } from '../hooks/useGroupedTraces';
import { getStatusInfo } from '../config/statusConfig';
import OrderStatusBadge from './OrderStatusBadge';
import OrderFlowTimeline from './OrderFlowTimeline';
import { mapTraceStatusToOrderStatus } from '../utils/statusMapper';

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
        <td className="p-2.5">
          <OrderStatusBadge 
            status={mapTraceStatusToOrderStatus(group.latestTrace.status, group.latestTrace.service, group.latestTrace.action)} 
            size="sm"
            showIcon={true}
          />
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
      
      {/* Fila expandible con timeline del flujo */}
      {isExpanded && (
        <tr className="border-b border-gray-600 bg-gray-750">
          <td colSpan={8} className="p-4">
            <OrderFlowTimeline 
              steps={group.traces.map(trace => ({
                status: mapTraceStatusToOrderStatus(trace.status, trace.service, trace.action),
                timestamp: trace.timestamp,
                service: trace.service,
                completed: trace.status === 'completed'
              }))}
              currentStatus={mapTraceStatusToOrderStatus(group.latestTrace.status, group.latestTrace.service, group.latestTrace.action)}
            />
          </td>
        </tr>
      )}
    </>
  );
};

export default GroupedTraceRow;
