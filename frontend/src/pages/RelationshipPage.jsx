import React, { useEffect, useState } from 'react';
import { GitFork, ArrowRight, Layers, Network as NetworkIcon, Search } from 'lucide-react';
import GraphCanvas from '../components/GraphCanvas';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { api } from '../services/api';

export default function RelationshipPage() {
  const [entities, setEntities] = useState([]);
  const [sourceId, setSourceId] = useState('person_1'); // Default Elena Vance
  const [targetId, setTargetId] = useState('comp_3'); // Default Nova Logistics

  const [pathLoading, setPathLoading] = useState(false);
  const [pathData, setPathData] = useState(null);
  const [pathError, setPathError] = useState(null);

  const [graphLoading, setGraphLoading] = useState(false);
  const [graphData, setGraphData] = useState(null);

  // Fetch entities list for dropdown selects
  useEffect(() => {
    async function loadEntityList() {
      try {
        const data = await api.getEntities('', 'all');
        setEntities(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadEntityList();
  }, []);

  const handleTracePath = async () => {
    if (!sourceId || !targetId) return;

    setPathLoading(true);
    setPathError(null);
    setGraphLoading(true);

    try {
      // 1. Fetch Multi-hop ownership path
      const pathRes = await api.getOwnershipPath(sourceId, targetId);
      setPathData(pathRes);

      // 2. Fetch neighborhood graph centered on source
      const networkRes = await api.getEntityNetwork(sourceId);
      setGraphData(networkRes);
    } catch (err) {
      setPathError(err.message || 'Unable to connect to the graph database.');
    } finally {
      setPathLoading(false);
      setGraphLoading(false);
    }
  };

  useEffect(() => {
    handleTracePath();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Relationship Traversal & Network Explorer</h1>
        <p className="page-subtitle">Trace multi-hop ownership chains and explore neighborhood graphs directly from CognoDB.</p>
      </div>

      {/* Path Finder Control Card */}
      <div className="card">
        <h2 className="card-title">
          <GitFork size={18} color="var(--brand-primary)" />
          Multi-Hop Ownership Traversal Query
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr)) auto', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Source Investor / Parent Entity
            </label>
            <select
              className="select-field"
              style={{ width: '100%' }}
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
            >
              {entities.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Target Subsidiary Company
            </label>
            <select
              className="select-field"
              style={{ width: '100%' }}
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            >
              {entities.filter(e => e.type === 'Company').map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} (Company)
                </option>
              ))}
            </select>
          </div>

          <button className="btn-primary" onClick={handleTracePath} disabled={pathLoading}>
            <Search size={15} /> Trace Path
          </button>
        </div>
      </div>

      {pathError && <ErrorAlert message={pathError} onRetry={handleTracePath} />}

      {/* Path Traversal Results */}
      {pathLoading ? (
        <LoadingSpinner message="Executing Cypher traversal query..." />
      ) : pathData && (
        <div className="card">
          <h3 className="card-title" style={{ fontSize: '0.95rem' }}>
            <Layers size={17} color="var(--brand-primary)" />
            openCypher Traversal Path Results
          </h3>

          {!pathData.found ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              No direct or multi-hop ownership pathway found between the selected entities.
            </p>
          ) : (
            <div>
              {pathData.paths.map((p, idx) => (
                <div key={idx} style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '0.85rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      Path #{p.pathIndex}: {p.hops} Hop Traversal
                    </span>
                    <span className="badge badge-info">Effective Ownership: {p.effectiveOwnershipPct}%</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}>
                    {p.nodes.map((node, nIdx) => (
                      <React.Fragment key={nIdx}>
                        <div style={{
                          padding: '0.35rem 0.65rem',
                          backgroundColor: 'white',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)'
                        }}>
                          {node.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>({node.type})</span>
                        </div>
                        {nIdx < p.steps.length && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.775rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
                            <ArrowRight size={13} />
                            <span>{p.steps[nIdx].percentage}%</span>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Visual Graph Canvas */}
      <div className="card">
        <h3 className="card-title">
          <NetworkIcon size={18} color="var(--brand-primary)" />
          Interactive Graph Visualization
        </h3>
        {graphLoading ? (
          <LoadingSpinner message="Rendering graph canvas..." />
        ) : (
          <GraphCanvas graphData={graphData} />
        )}
      </div>
    </div>
  );
}
