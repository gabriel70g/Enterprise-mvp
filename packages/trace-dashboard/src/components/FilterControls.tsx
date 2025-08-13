import React from 'react';

const FilterControls: React.FC = () => {
  return (
    <div style={{
      backgroundColor: '#3a3f47',
      padding: '8px',
      borderRadius: '8px',
      marginTop: '5px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '5px',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <input
        type="text"
        placeholder="Filtrar por Correlation ID"
        style={{
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #555',
          backgroundColor: '#282c34',
          color: 'white',
          width: '200px'
        }}
      />
      <select
        style={{
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #555',
          backgroundColor: '#282c34',
          color: 'white',
          width: '150px'
        }}
      >
        <option value="">Todos los servicios</option>
        <option value="api-gateway">API Gateway</option>
        <option value="order-service">Order Service</option>
        <option value="payment-service">Payment Service</option>
        <option value="inventory-service">Inventory Service</option>
      </select>
      <select
        style={{
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #555',
          backgroundColor: '#282c34',
          color: 'white',
          width: '150px'
        }}
      >
        <option value="">Todos los estados</option>
        <option value="pending">Pendientes</option>
        <option value="completed">Completadas</option>
        <option value="failed">Fallidas</option>
      </select>
      <button style={{
        padding: '8px 15px',
        borderRadius: '4px',
        border: 'none',
        backgroundColor: '#667eea',
        color: 'white',
        cursor: 'pointer'
      }}>
        Limpiar Filtros
      </button>
      <button style={{
        padding: '8px 15px',
        borderRadius: '4px',
        border: 'none',
        backgroundColor: '#dc3545',
        color: 'white',
        cursor: 'pointer'
      }}>
        Limpiar Todas
      </button>
    </div>
  );
};

export default FilterControls;
