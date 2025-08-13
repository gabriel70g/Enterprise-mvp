import React from 'react';

interface StatsDisplayProps {
  totalTraces?: number;
  pendingTraces?: number;
  completedTraces?: number;
  failedTraces?: number;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({
  totalTraces = 0,
  pendingTraces = 0,
  completedTraces = 0,
  failedTraces = 0,
}) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-around',
      marginTop: '5px',
      fontSize: '0.5rem',
      backgroundColor: '#3a3f47',
      padding: '5px 0',
      borderRadius: '8px',
      alignItems: 'center',
      height:40
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#667eea' }}>{totalTraces}</div>
        <div>Total</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#ffc107' }}>{pendingTraces}</div>
        <div>Pendientes</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#28a745' }}>{completedTraces}</div>
        <div>Completadas</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#dc3545' }}>{failedTraces}</div>
        <div>Fallidas</div>
      </div>
    </div>
  );
};

export default StatsDisplay;
