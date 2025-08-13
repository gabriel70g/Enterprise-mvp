import React from 'react';

const Header: React.FC = () => {
  return (
    <header style={{
      backgroundColor: '#282c34',
      borderRadius: '30px', 
      color: 'white',
      textAlign: 'center',
      fontSize: '0.5rem',
      borderBottom: '1px solid #444',

    }}>
      <h2>CQRS Trace Dashboard</h2>
    </header>
  );
};

export default Header;