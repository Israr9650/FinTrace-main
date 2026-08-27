import React, { useState, useEffect } from 'react';
import { Shield, Building2, Users, Globe, AlertTriangle, Link2 } from 'lucide-react';

export default function Dashboard({ backendUrl }) {
  const [stats, setStats] = useState(null);
  const [highRiskEntities, setHighRiskEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        // console.log('backend...', `${backendUrl}/api/stats`);
        const statsRes = await fetch(`${backendUrl}/api/stats`);
        const statsData = await statsRes.json();

        if (statsData.success) {
          setStats(statsData.stats);
          
          const nodesRes = await fetch(`${backendUrl}/api/network`);
          const nodesData = await nodesRes.json();
          if (nodesData.success) {
            const highRisk = nodesData.nodes
              .filter(n => n.type === 'Company' || n.type === 'Person')
              .filter(n => n.riskScore >= 75)
              .sort((a, b) => b.riskScore - a.riskScore)
              .slice(0, 5);
            setHighRiskEntities(highRisk);
          }
        } else {
          setError(statsData.message );
        }
      } catch (err) {
        console.error('ERROR ', err);
        setError('Unable to communicate with the database backend.');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [backendUrl]);

  if (loading) {
    return (
      <div className="empty-state animate-fade-in">
        <div className="spinner"></div>
        <p className="mt-4">Analyzing corporate registers and tracking ownership graphs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel alert-card animate-fade-in" style={{ borderColor: 'var(--risk-high)' }}>
        <div className="alert-header">
          <span className="alert-title flex gap-2" style={{ color: 'var(--risk-high)' }}>
            <AlertTriangle /> Analytics Service Offline
          </span>
        </div>
        <p className="text-secondary">{error}</p>
        <p className="mt-4 text-muted" style={{ fontSize: '0.85rem' }}>
          Please make sure the backend server is running and database configuration in the root `.env` is correct.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="content-header">
        <h1>Ownership Intelligence Dashboard</h1>
        <p>A global graph audit of parent corporations, ultimate beneficial owners, and risk nexuses.</p>
      </div>

      {/* Metrics Cards */}
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span>COMPANIES</span>
            <Building2 size={20} className="logo-icon" />
          </div>
          <div className="stat-value">{stats?.totalCompanies}</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span>INDIVIDUALS (UBOs)</span>
            <Users size={20} className="logo-icon" />
          </div>
          <div className="stat-value">{stats?.totalPeople}</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span>JURISDICTIONS</span>
            <Globe size={20} className="logo-icon" />
          </div>
          <div className="stat-value">{stats?.totalCountries}</div>
        </div>

        <div className="glass-panel stat-card risk-card">
          <div className="stat-header">
            <span>TAX HAVEN EXPOSURE</span>
            <Shield size={20} style={{ color: 'var(--risk-high)' }} />
          </div>
          <div className="stat-value">{stats?.taxHavenExposureRate}%</div>
        </div>
      </div>

      <div className="dashboard-row">
        <div className="glass-panel dashboard-widget">
          <div className="widget-title">
            <Building2 size={18} className="logo-icon" />
            <span>High Risk Entities Audit</span>
          </div>
          {highRiskEntities.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px' }}>
              <p>No high-risk entities identified in the database.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '12px 8px' }}>Name</th>
                  <th style={{ padding: '12px 8px' }}>Type</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {highRiskEntities.map(entity => (
                  <tr key={entity.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 500 }}>{entity.name}</td>
                    <td style={{ padding: '12px 8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{entity.type}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <span className={`risk-badge ${entity.riskScore >= 75 ? 'high' : entity.riskScore >= 40 ? 'medium' : 'low'}`}>
                        {entity.riskScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="glass-panel dashboard-widget">
          <div className="widget-title">
            <Link2 size={18} className="logo-icon" />
            <span>Network Context</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <p>
              In traditional relational schemas, analyzing offshore chains is restricted by fixed joins. FinTrace bypasses database limitations by representing company hierarchies as a graph.
            </p>
            <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--accent-primary)', borderRadius: '4px', fontSize: '0.85rem' }}>
              <strong>Total Ownership Paths:</strong> {stats?.totalLinks} connected relations
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Graph database connects addresses, companies, countries and stakeholders in a single interconnected topology. Use the side navigation to explore paths.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
