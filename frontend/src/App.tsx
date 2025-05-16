import { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './features/dashboard/Dashboard';
import { EthPriceAdjuster } from './components/EthPriceAdjuster';
import './App.css';

function App() {
  return (
    <Layout>
      <Dashboard />
      <EthPriceAdjuster />
    </Layout>
  );
}

export default App;
