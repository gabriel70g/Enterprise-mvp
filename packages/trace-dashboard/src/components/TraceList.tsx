import React from 'react';
import { Trace } from '../hooks/useTraces'; // Import the Trace type

interface TraceListProps {
  traces: Trace[];
}

const TraceList: React.FC<TraceListProps> = ({ traces }) => {

  const getStatusColor = (status: Trace['status']) => {
    switch (status) {
      case 'completed':
        return '#28a745'; // Green
      case 'pending':
        return '#ffc107'; // Yellow
      case 'failed':
        return '#dc3545'; // Red
      default:
        return '#f0f0f0'; // Default text color
    }
  };

  return (
    <div style={{ overflowX: 'auto', backgroundColor: '#282c34', borderRadius: '8px' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        color: '#f0f0f0',
        fontSize: '0.8rem'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#3a3f47' }}>
            <th style={tableHeaderStyle}>Correlation ID</th>
            <th style={tableHeaderStyle}>Service</th>
            <th style={tableHeaderStyle}>Action</th>
            <th style={tableHeaderStyle}>Status</th>
            <th style={tableHeaderStyle}>Duration</th>
            <th style={tableHeaderStyle}>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {traces.map((trace) => (
            <tr key={trace.id} style={tableRowStyle}>
              <td style={tableCellStyle}>{trace.correlationId}</td>
              <td style={tableCellStyle}>{trace.service}</td>
              <td style={tableCellStyle}>{trace.action}</td>
              <td style={{ ...tableCellStyle, color: getStatusColor(trace.status) }}>
                            {trace.status.toUpperCase()}
                          </td>
              <td style={tableCellStyle}>{trace.duration}ms</td>
              <td style={tableCellStyle}>{new Date(trace.timestamp).toLocaleTimeString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {traces.length === 0 && (
        <p style={{ textAlign: 'center', padding: '20px' }}>Awaiting traces...</p>
      )}
    </div>
  );
};

// Common styles to avoid repetition
const tableHeaderStyle: React.CSSProperties = {
  padding: '12px 15px',
  textAlign: 'left',
  fontWeight: 'bold',
};

const tableRowStyle: React.CSSProperties = {
  borderBottom: '1px solid #3a3f47'
};

const tableCellStyle: React.CSSProperties = {
  padding: '10px 15px',
};

export default TraceList;
