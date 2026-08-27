import React, { useEffect, useState } from 'react';
import { ShieldAlert, Globe, MapPin, UserCheck, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { api } from '../services/api';

export default function RiskPage() {
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRiskData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRiskAnalysis();
      setRiskData(data);
    } catch (err) {
      setError(err.message || 'Unable to connect to the graph database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
  }, []);

  if (loading) return <LoadingSpinner message="Running graph risk analysis..." />;
  if (error) return <ErrorAlert message={error} onRetry={fetchRiskData} />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Risk Checks & Graph Findings</h1>
        <p className="page-subtitle">Structural risk pattern detection powered by openCypher graph queries.</p>
      </div>

      <div className="info-box">
        <div className="info-box-title">
          <AlertTriangle size={16} />
          Educational Investigation Tool
        </div>
        <p style={{ fontSize: '0.85rem' }}>
          This risk analysis module demonstrates how openCypher pattern queries detect offshore tax haven linkages, shell address clusters, and shared management networks in graph data.
        </p>
      </div>

      {/* 1. Tax Haven Exposure */}
      <div className="card">
        <h2 className="card-title">
          <Globe size={18} color="var(--danger-main)" />
          Tax Haven Jurisdiction Exposure
        </h2>
        {(!riskData?.taxHavenExposures || riskData.taxHavenExposures.length === 0) ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No entities connected to tax haven jurisdictions detected.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Target Company</th>
                  <th>Tax Haven Jurisdiction</th>
                  <th>Network Hops</th>
                  <th>Risk Score</th>
                  <th>Pattern Explanation</th>
                </tr>
              </thead>
              <tbody>
                {riskData.taxHavenExposures.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{item.companyName}</td>
                    <td><span className="badge badge-high">{item.taxHaven}</span></td>
                    <td>{item.hops} hop(s)</td>
                    <td><span className="badge badge-high">{item.riskScore}</span></td>
                    <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{item.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Shared Address Congestion */}
      <div className="card">
        <h2 className="card-title">
          <MapPin size={18} color="var(--warning-main)" />
          Shared Address Congestion (Shell Corporate Centers)
        </h2>
        {(!riskData?.sharedAddresses || riskData.sharedAddresses.length === 0) ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No co-located address clusters found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {riskData.sharedAddresses.map((item, idx) => (
              <div key={idx} style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>📍 {item.fullAddress}</strong>
                  <span className="badge badge-high">{item.companyCount} Companies Co-Located</span>
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                  {item.explanation}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {item.companies.map((c, cIdx) => (
                    <span key={cIdx} style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: 'white',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.775rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)'
                    }}>
                      {c.name} (Risk: {c.riskScore})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Shared Director Networks */}
      <div className="card">
        <h2 className="card-title">
          <UserCheck size={18} color="var(--brand-primary)" />
          Shared Director Networks
        </h2>
        {(!riskData?.sharedDirectors || riskData.sharedDirectors.length === 0) ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No directors managing multiple companies found.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Director Name</th>
                  <th>Directorship Count</th>
                  <th>Managed Companies</th>
                  <th>Pattern Explanation</th>
                </tr>
              </thead>
              <tbody>
                {riskData.sharedDirectors.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{item.personName}</td>
                    <td><span className="badge badge-info">{item.companyCount} Boards</span></td>
                    <td>
                      {item.companies.map(c => c.name).join(', ')}
                    </td>
                    <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{item.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
