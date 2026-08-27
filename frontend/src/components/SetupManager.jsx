import React, { useState, useEffect } from 'react';
import { Database, Terminal, ShieldAlert, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function SetupManager({ backendUrl, onSeedCompleted }) {
  const [dbStatus, setDbStatus] = useState({ checked: false, connected: false, error: null });
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);

  async function checkDbStatus() {
    try {
      const res = await fetch(`${backendUrl}/api/status`);
      const data = await res.json();
      setDbStatus({
        checked: true,
        connected: data.success,
        error: data.error
      });
    } catch (err) {
      console.error('ERROR [checkDbStatus]:', err);
      setDbStatus({
        checked: true,
        connected: false,
        error: 'Unable to communicate with the Express backend server.'
      });
    }
  }

  useEffect(() => {
    checkDbStatus();
  }, [backendUrl]);

  async function handleSeedDatabase() {
    try {
      setSeeding(true);
      setSeedResult(null);
      const res = await fetch(`${backendUrl}/api/seed-db`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setSeedResult({ success: true, message: data.message });
        checkDbStatus(); 
        if (onSeedCompleted) onSeedCompleted();
      } else {
        setSeedResult({ success: false, message: data.error });
      }
    } catch (err) {
      console.error('ERROR [handleSeedDatabase]:', err);
      setSeedResult({ success: false, message: 'Backend connection timeout during seeding.' });
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="animate-fade-in setup-container">
      <div className="content-header text-center">
        <h1>System Setup & Seeding</h1>
        <p>Manage connection interfaces and mock registers for local development testing.</p>
      </div>

      <div className="glass-panel setup-card">
        {/* Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Database size={24} className="logo-icon" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>CognoDB Connection Status</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Connected over Neo4j Bolt 5.x Protocol</p>
            </div>
          </div>
          
          {dbStatus.checked ? (
            dbStatus.connected ? (
              <span className="risk-badge low" style={{ fontSize: '0.85rem' }}>
                <CheckCircle2 size={16} /> Connected
              </span>
            ) : (
              <span className="risk-badge high" style={{ fontSize: '0.85rem' }}>
                <AlertTriangle size={16} /> Disconnected
              </span>
            )
          ) : (
            <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
          )}
        </div>

        {/* Error Callout if disconnected */}
        {!dbStatus.connected && dbStatus.checked && (
          <div className="alert-card" style={{ borderColor: 'var(--risk-high)', background: 'rgba(244,63,94,0.05)', borderRadius: '8px', padding: '16px' }}>
            <div className="flex gap-2 align-center" style={{ color: 'var(--risk-high)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>
              <ShieldAlert size={18} /> Credentials / Connection Issue Detected
            </div>
            <p className="text-secondary" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
              {dbStatus.error || 'Check root .env config variables. CognoDB may be down or rate limited.'}
            </p>
          </div>
        )}

        {/* Seed Database actions */}
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px' }}>Seed Graph Database</h4>
          <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
            Seeding will delete any existing nodes and relationships and create a set of companies, countries, people, and addresses. This is perfect for showcasing multi-hop paths, tax haven alerts, and loops.
          </p>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={handleSeedDatabase}
              disabled={seeding || !dbStatus.connected}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Sparkles size={18} />
              {seeding ? 'Seeding Database...' : 'Run Seed Script'}
            </button>
            
            <button
              onClick={checkDbStatus}
              className="setup-btn-sec"
            >
              Retry Connection
            </button>
          </div>
        </div>

        {/* Seeding Results banner */}
        {seedResult && (
          <div className="alert-card" style={{ 
            borderColor: seedResult.success ? 'var(--risk-low)' : 'var(--risk-high)', 
            background: seedResult.success ? 'rgba(16,185,129,0.05)' : 'rgba(244,63,94,0.05)',
            borderRadius: '8px', 
            padding: '16px' 
          }}>
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>{seedResult.message}</p>
          </div>
        )}
      </div>

      {/* Setup Guide */}
      <div className="glass-panel setup-card" style={{ marginTop: '24px' }}>
        <h3 className="widget-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={18} className="logo-icon" />
          <span>Manual Setup Instructions</span>
        </h3>
        <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <li>
            Create a free graph database instance at <strong>console.cognodb.com</strong>.
          </li>
          <li>
            Open the root <strong>.env</strong> file in the project workspace.
          </li>
          <li>
            Update the connection settings:
            <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '4px', marginTop: '4px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
              COGNODB_URI=bolt+s://your-instance.databases.cognodb.cloud<br />
              COGNODB_USER=cognodb<br />
              COGNODB_PASSWORD=your-saved-password
            </pre>
          </li>
          <li>
            Save changes, click "Retry Connection" above, and then click "Run Seed Script".
          </li>
        </ol>
      </div>
    </div>
  );
}
