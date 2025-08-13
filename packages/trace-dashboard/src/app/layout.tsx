import Header from '../components/Header';
import Footer from '../components/Footer';
import MainContent from '../components/MainContent';
import DashboardControls from '../components/DashboardControls';
import { TraceProvider } from '../context/TraceContext'; // Import the provider
import React from 'react';

export const metadata = {
  title: 'CQRS Trace Dashboard',
  description: 'Real-time tracing for CQRS microservices',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TraceProvider>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '98vh',
            margin: 0,
            padding: 10,
            backgroundColor: '#1a1c20'
          }}>
            <Header />
            <DashboardControls />
            <MainContent>{children}</MainContent>
            <Footer />
          </div>
        </TraceProvider>
      </body>
    </html>
  );
}
