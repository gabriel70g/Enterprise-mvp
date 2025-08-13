import './globals.css';
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
          <div className="flex flex-col min-h-[98vh] m-0 p-2.5 bg-gray-900">
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
