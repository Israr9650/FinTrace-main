import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DatabaseStatusBanner from './components/DatabaseStatusBanner';
import OverviewPage from './pages/OverviewPage';
import EntityExplorerPage from './pages/EntityExplorerPage';
import RelationshipPage from './pages/RelationshipPage';
import RiskPage from './pages/RiskPage';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dbStatus, setDbStatus] = useState('checking'); // 'checking' | 'connected' | 'disconnected'

  const checkDbHealth = async () => {
    setDbStatus('checking');
    try {
      const res = await api.getHealth();
      if (res && res.connected) {
        setDbStatus('connected');
      } else {
        setDbStatus('disconnected');
      }
    } catch (err) {
      setDbStatus('disconnected');
    }
  };

  useEffect(() => {
    checkDbHealth();
  }, []);

  return (
    <div>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <DatabaseStatusBanner dbStatus={dbStatus} onRetry={checkDbHealth} />

      <main className="main-container">
        {activeTab === 'overview' && <OverviewPage />}
        {activeTab === 'entities' && <EntityExplorerPage />}
        {activeTab === 'relationships' && <RelationshipPage />}
        {activeTab === 'risk' && <RiskPage />}
      </main>
    </div>
  );
}
