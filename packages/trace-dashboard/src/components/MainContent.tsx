import React from 'react';

interface MainContentProps {
  children: React.ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  return (
    <main className="flex-grow p-2.5 bg-gray-900 text-gray-100">
      {children}
    </main>
  );
};

export default MainContent;
