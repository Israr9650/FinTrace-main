import React, { useEffect, useState } from 'react';
import { Search, Building2, User, Eye, X } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { api } from '../services/api';

export default function EntityExplorerPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedEntity, setSelectedEntity] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const fetchEntities = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEntities(search, type);
      setEntities(data);
    } catch (err) {
      setError(err.message || 'Unable to connect to the graph database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEntities();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, type]);

  const handleSelectEntity = async (id) => {
    setSelectedEntity(id);
    setDetailLoading(true);
    try {
      const data = await api.getEntityById(id);
      setDetailData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const renderRiskBadge = (score) => {
    if (score >= 70) return <span className="badge badge-high">High ({score})</span>;
    if (score >= 40) return <span className="badge badge-med">Med ({score})</span>;
    return <span className="badge badge-low">Low ({score})</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Entity Explorer</h1>
        <p className="page-subtitle">Search and view details for companies and people in the database.</p>
      </div>

      <div className="search-bar">
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search by name (e.g., Apex, Marcus, Vanguard)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="select-field"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="Company">Companies</option>
          <option value="Person">People</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner message="Searching entities..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={fetchEntities} />
      ) : entities.length === 0 ? (
        <div className="card state-container">
          <Search size={32} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
          <div className="state-title">No entities found</div>
          <div className="state-text">No records match your search. Try another name or change the filter.</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Entity Name</th>
                  <th>Type</th>
                  <th>Registration / Nationality</th>
                  <th>Jurisdiction</th>
                  <th>Risk Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {entities.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        {item.type === 'Company' ? <Building2 size={16} color="var(--brand-primary)" /> : <User size={16} color="#0d9488" />}
                        {item.name}
                      </span>
                    </td>
                    <td><span className="badge badge-info">{item.type}</span></td>
                    <td>{item.registrationNumber || item.nationality || '—'}</td>
                    <td>{item.countryName || '—'}</td>
                    <td>{renderRiskBadge(item.riskScore)}</td>
                    <td>
                      <button
                        className="btn-primary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                        onClick={() => handleSelectEntity(item.id)}
                      >
                        <Eye size={14} /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal / Side Panel */}
      {selectedEntity && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 1000
        }}>
          <div style={{
            width: '100%',
            maxWidth: '500px',
            backgroundColor: 'white',
            height: '100%',
            overflowY: 'auto',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative'
          }}>
            <button
              onClick={() => setSelectedEntity(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >
              <X size={20} />
            </button>

            {detailLoading ? (
              <LoadingSpinner message="Loading details..." />
            ) : detailData ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  {detailData.entity.type === 'Company' ? <Building2 size={22} color="var(--brand-primary)" /> : <User size={22} color="#0d9488" />}
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{detailData.entity.name}</h2>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem' }}>
                  <span className="badge badge-info">{detailData.entity.type}</span>
                  {renderRiskBadge(detailData.entity.riskScore)}
                </div>

                <div className="card" style={{ padding: '0.85rem 1rem', marginBottom: '1.25rem', backgroundColor: 'var(--bg-subtle)' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Entity Details</h3>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-primary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    {detailData.entity.registrationNumber && <div><strong>Reg No:</strong> {detailData.entity.registrationNumber}</div>}
                    {detailData.entity.incorporationDate && <div><strong>Incorporated:</strong> {detailData.entity.incorporationDate}</div>}
                    {detailData.entity.nationality && <div><strong>Nationality:</strong> {detailData.entity.nationality}</div>}
                    {detailData.entity.countryName && <div><strong>Jurisdiction:</strong> {detailData.entity.countryName}</div>}
                    {detailData.entity.fullAddress && <div style={{ gridColumn: '1 / -1' }}><strong>Address:</strong> {detailData.entity.fullAddress}</div>}
                  </div>
                </div>

                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                  Direct Connections ({detailData.connections.length})
                </h3>

                {detailData.connections.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No direct relationships found.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {detailData.connections.map((conn, idx) => (
                      <div key={idx} style={{
                        padding: '0.65rem 0.85rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'white',
                        fontSize: '0.85rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--brand-primary)', fontSize: '0.8rem' }}>
                            {conn.direction === 'OUTGOING' ? `➔ ${conn.relationship}` : `⬅ ${conn.relationship}`}
                            {conn.ownershipPercentage && ` (${conn.ownershipPercentage}%)`}
                          </span>
                          {renderRiskBadge(conn.targetRiskScore)}
                        </div>
                        <div>
                          <strong>{conn.targetName}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({conn.targetType})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
