import React from 'react';
import type { ReactNode } from 'react';
import { Header } from './Header/Header';
import { Footer } from './Footer/Footer';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="w-full flex flex-col min-h-screen bg-gray-50" style={{ maxWidth: '100vw' }}>
      <Header />
      <main className="flex-grow w-full" style={{ maxWidth: '100vw' }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}; 