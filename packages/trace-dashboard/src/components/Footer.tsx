import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer style={{
      backgroundColor: '#282c34',
      padding: '5px',
      borderRadius:'10px',
      color: 'white',
      textAlign: 'center',
      fontSize: '0.5rem',
      borderTop: '1px solid #444',
      marginTop: 'auto', // Empuja el footer hacia abajo
      alignContent:'center'
    }}>
      <p>© {new Date().getFullYear()} CQRS Trace Dashboard. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
