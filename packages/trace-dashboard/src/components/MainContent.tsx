import React from 'react';

interface MainContentProps {
  children: React.ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  return (
    <main style={{
      flexGrow: 1, // Permite que el contenido principal ocupe el espacio disponible
      padding: '10px',
      backgroundColor: '#1a1c20',
      color: '#f0f0f0'
    }}>
      {children}
    </main>
  );
};

export default MainContent;
