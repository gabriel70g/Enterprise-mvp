import React from 'react';
import { Trace } from '../hooks/useTraces';

interface TraceRowProps {
  trace: Trace;
  statusInfo: { color: string; icon: string; label: string };
}

const TraceRow: React.FC<TraceRowProps> = ({ trace, statusInfo }) => {
  return (
    <tr className="border-b border-gray-700">
      <td className="p-2.5">{trace.correlationId}</td>
      <td className="p-2.5">{trace.service}</td>
      <td className="p-2.5">{trace.action}</td>
      <td className={`p-2.5 ${statusInfo.color} flex items-center gap-2`}>
        <span>{statusInfo.icon}</span>
        <span>{trace.status.toUpperCase()}</span>
      </td>
      <td className="p-2.5">{trace.duration}ms</td>
      <td className="p-2.5">{new Date(trace.timestamp).toLocaleTimeString()}</td>
    </tr>
  );
};

export default TraceRow;
