import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, HelpCircle, MapPin, Building2, ArrowRight } from 'lucide-react';

export default function RiskAuditor({ backendUrl }) {
  const [activeTab, setActiveTab] = useState('circular');
  
  // Data States
  const [loops, setLoops] = useState([]);
  const [taxHavens, setTaxHavens] = useState([]);
  const [sharedAddresses, setSharedAddresses] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadAuditAlerts() {
      try {
        setLoading(true);
        setError(null);
      

        if (activeTab === 'circular') {
          const res = await fetch(`${backendUrl}/api/alerts/circular`);
          const data = await res.json();
          if (data.success) setLoops(data.loops);
        } else if (activeTab === 'tax-haven') {
          const res = await fetch(`${backendUrl}/api/alerts/tax-haven`);
          const data = await res.json();
          if (data.success) setTaxHavens(data.exposureList);
        } else if (activeTab === 'shared-address') {
          const res = await fetch(`${backendUrl}/api/alerts/shared-address`);
          const data = await res.json();
          if (data.success) setSharedAddresses(data.addressSharing);
        }
      } catch (err) {
        console.error('ERROR [RiskAuditor]:', err);
        setError('Failed to fetch risk audit metrics.');
      } finally {
        setLoading(false);
      }
    }
    loadAuditAlerts();
  }, [backendUrl, activeTab]);

  return (
    <div className="animate-fade-in">
      <div className="content-header">
        <h1>Risk & Compliance Auditor</h1>
        <p>Audit graph topologies to identify compliance violations, circular tax loops, and shell corporation clusters.</p>
      </div>

      {/* Tabs Menu */}
      <div className="risk-tabs">
        <button
          className={`risk-tab-btn ${activeTab === 'circular' ? 'active' : ''}`}
          onClick={() => setActiveTab('circular')}
        >
          Circular Ownership Loops
        </button>
        <button
          className={`risk-tab-btn ${activeTab === 'tax-haven' ? 'active' : ''}`}
          onClick={() => setActiveTab('tax-haven')}
        >
          Tax Haven Connections
        </button>
        <button
          className={`risk-tab-btn ${activeTab === 'shared-address' ? 'active' : ''}`}
          onClick={() => setActiveTab('shared-address')}
        >
          Shared Address Nexuses
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="glass-panel alert-card" style={{ borderColor: 'var(--risk-high)' }}>
          <p className="text-secondary">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="empty-state">
          <div className="spinner"></div>
          <p className="mt-4">Scanning graph records and validating entity rules...</p>
        </div>
      ) : (
        <div className="alerts-list animate-fade-in">
          
          {/* Tab 1: Circular Ownership loops */}
          {activeTab === 'circular' && (
            <>
              {loops.length === 0 ? (
                <div className="empty-state glass-panel">
                  <ShieldAlert size={36} className="empty-state-icon" style={{ color: 'var(--risk-low)' }} />
                  <p>No circular ownership loops detected in the active graph database.</p>
                </div>
              ) : (
                loops.map((loop, idx) => (
                  <div key={idx} className="glass-panel alert-card animate-fade-in" style={{ borderColor: 'var(--risk-high)' }}>
                    <div className="alert-header">
                      <span className="alert-title flex gap-2" style={{ color: 'var(--risk-high)' }}>
                        <AlertTriangle size={18} /> Loop Pattern: Circular Asset Ownership
                      </span>
                      <span className="risk-badge high">High Risk Alert</span>
                    </div>
                    <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '12px' }}>
                      Detected a corporate cycle of size {loop.length} where companies hold equity recursively in themselves. This structure can be exploited to inflate assets or conceal ultimate beneficiaries.
                    </p>
                    <div className="ubo-path-flow" style={{ background: 'rgba(244,63,94,0.05)', padding: '12px', borderRadius: '6px' }}>
                      {loop.loopSteps.map((step, sIdx) => (
                        <React.Fragment key={sIdx}>
                          <span style={{ fontWeight: 600 }}>{step.from}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--risk-high)', fontSize: '0.75rem' }}>
                            <span>OWNS ({step.shares}%)</span>
                            <ArrowRight size={14} />
                          </div>
                          {sIdx === loop.loopSteps.length - 1 && <span style={{ fontWeight: 600 }}>{step.to}</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* Tab 2: Tax Haven Connections */}
          {activeTab === 'tax-haven' && (
            <>
              {taxHavens.length === 0 ? (
                <div className="empty-state glass-panel">
                  <ShieldAlert size={36} className="empty-state-icon" style={{ color: 'var(--risk-low)' }} />
                  <p>No connections to tax havens detected.</p>
                </div>
              ) : (
                taxHavens.map((item, idx) => (
                  <div key={idx} className="glass-panel alert-card animate-fade-in" style={{ borderColor: 'var(--risk-medium)' }}>
                    <div className="alert-header">
                      <span className="alert-title flex gap-2" style={{ color: 'var(--risk-medium)' }}>
                        <ShieldAlert size={18} /> Tax Haven Exposure Pathway
                      </span>
                      <span className="risk-badge medium">{item.hops}-Hop Link</span>
                    </div>
                    <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '12px' }}>
                      Entity <strong>{item.companyName}</strong> has indirect exposure to tax haven jurisdiction <strong>{item.taxHavenName}</strong>.
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                      {item.trace.map((step, sIdx) => (
                        <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="text-muted" style={{ width: '120px', textAlign: 'right' }}>[{step.startLabel}]</span>
                          <span style={{ fontWeight: 500 }}>{step.startName}</span>
                          <span style={{ color: 'var(--accent-primary)', fontSize: '0.75rem' }}>— {step.relation} ➔</span>
                          <span style={{ fontWeight: 500 }}>{step.endName}</span>
                          <span className="text-muted">[{step.endLabel}]</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* Tab 3: Shared Address Nexuses */}
          {activeTab === 'shared-address' && (
            <>
              {sharedAddresses.length === 0 ? (
                <div className="empty-state glass-panel">
                  <ShieldAlert size={36} className="empty-state-icon" style={{ color: 'var(--risk-low)' }} />
                  <p>No multiple registrations at the same address identified.</p>
                </div>
              ) : (
                sharedAddresses.map((item, idx) => (
                  <div key={idx} className="glass-panel alert-card animate-fade-in" style={{ borderColor: 'var(--accent-secondary)' }}>
                    <div className="alert-header">
                      <span className="alert-title flex gap-2" style={{ color: 'var(--accent-secondary)' }}>
                        <MapPin size={18} /> Address Congestion Nexus (Shell Check)
                      </span>
                      <span className="risk-badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-secondary)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                        {item.count} Companies
                      </span>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>REGISTRATION ADDRESS</span>
                      <p style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.address}</p>
                    </div>
                    <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
                      The following corporations share registration details at this physical location (indicates potential virtual office / offshore brass-plate shells):
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {item.companies.map(co => (
                        <div key={co.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>
                          <Building2 size={14} className="logo-icon" />
                          <span>{co.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--risk-high)', background: 'rgba(244,63,94,0.1)', padding: '1px 4px', borderRadius: '4px' }}>
                            {co.riskScore} Risk
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

        </div>
      )}
    </div>
  );
}
