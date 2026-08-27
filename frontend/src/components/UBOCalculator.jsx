import React, { useState, useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import { User, Building, ArrowRight, Percent, Info, AlertCircle } from 'lucide-react';

export default function UBOCalculator({ backendUrl }) {
  const chartRef = useRef(null);
  const networkRef = useRef(null);

  const [people, setPeople] = useState([]);
  const [companies, setCompanies] = useState([]);
  
  const [personSearch, setPersonSearch] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showPeopleDropdown, setShowPeopleDropdown] = useState(false);

  const [companySearch, setCompanySearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  // Result States
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Initialize: Load lists for search selection
  useEffect(() => {
    async function loadSearchDropdowns() {
      try {
        const res = await fetch(`${backendUrl}/api/network`);
        const data = await res.json();
        
        if (data.success) {
          const personsList = data.nodes.filter(n => n.type === 'Person');
          const companiesList = data.nodes.filter(n => n.type === 'Company');
          setPeople(personsList);
          setCompanies(companiesList);
        }
      } catch (err) {
        console.error('ERROR [loadSearchDropdowns]:', err);
      }
    }
    loadSearchDropdowns();
  }, [backendUrl]);

  async function handleCalculate(e) {
    e.preventDefault();
    if (!selectedPerson || !selectedCompany) return;

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const res = await fetch(`${backendUrl}/api/ubo?personId=${selectedPerson.id}&companyId=${selectedCompany.id}`);
      const data = await res.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to calculate UBO paths');
      }
    } catch (err) {
      console.error('ERROR [UBO Calc API]:', err);
      setError('An error occurred while calculating beneficial ownership.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!result || !result.visualization || !chartRef.current) return;

    const { nodes, edges } = result.visualization;
    
    const visNodes = nodes.map(n => {
      let isEnds = n.id === selectedPerson?.id || n.id === selectedCompany?.id;
      return {
        id: n.id,
        label: n.name,
        color: {
          background: n.id === selectedPerson?.id ? '#1e3a8a' : n.id === selectedCompany?.id ? '#0f172a' : '#1e293b',
          border: isEnds ? '#3b82f6' : '#94a3b8',
          highlight: { background: '#2563eb', border: '#60a5fa' }
        },
        font: { color: '#f8fafc', face: 'Inter', size: 13, bold: isEnds },
        shape: 'dot',
        size: isEnds ? 24 : 18,
        borderWidth: isEnds ? 3 : 1
      };
    });

    // Format edges
    const visEdges = edges.map(e => ({
      from: e.from,
      to: e.to,
      label: `${e.shares}%`,
      font: { color: '#f8fafc', size: 10, face: 'Inter', strokeWidth: 0, background: '#1e293b' },
      arrows: 'to',
      color: { color: '#60a5fa', highlight: '#f8fafc' },
      width: 2.5
    }));

    const data = { nodes: visNodes, edges: visEdges };
    const options = {
      physics: {
        hierarchicalRepulsion: { nodeDistance: 150 },
        solver: 'hierarchicalRepulsion'
      },
      layout: {
        hierarchical: {
          direction: 'LR',
          sortMethod: 'directed'
        }
      },
      interaction: { dragNodes: true, zoomView: true, selectConnectedEdges: false }
    };

    const network = new Network(chartRef.current, data, options);
    networkRef.current = network;

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [result, selectedPerson, selectedCompany]);

  const filteredPeople = people.filter(p => p.name.toLowerCase().includes(personSearch.toLowerCase()));
  const filteredCompanies = companies.filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()));

  return (
    <div className="animate-fade-in">
      <div className="content-header">
        <h1>Ultimate Beneficial Ownership (UBO)</h1>
        <p>Trace the direct and indirect equity ownership share of individual stakeholders across multi-hop corporate layers.</p>
      </div>

     
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <form onSubmit={handleCalculate} className="calculator-header">
        
          <div className="search-select-box">
            <label>1. Select Shareholder / Investor</label>
            <input
              type="text"
              placeholder="Search people..."
              className="input-glow"
              value={selectedPerson ? selectedPerson.name : personSearch}
              onChange={e => {
                setPersonSearch(e.target.value);
                setSelectedPerson(null);
                setShowPeopleDropdown(true);
              }}
              onFocus={() => setShowPeopleDropdown(true)}
            />
            {showPeopleDropdown && (
              <div className="search-dropdown">
                {filteredPeople.length === 0 ? (
                  <div style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>No matches found</div>
                ) : (
                  filteredPeople.map(p => (
                    <div
                      key={p.id}
                      className="dropdown-item"
                      onClick={() => {
                        setSelectedPerson(p);
                        setPersonSearch('');
                        setShowPeopleDropdown(false);
                      }}
                    >
                      <span>{p.name}</span>
                      <span className="dropdown-label">{p.nationality}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Company Selector */}
          <div className="search-select-box">
            <label>2. Select Target Company</label>
            <input
              type="text"
              placeholder="Search companies..."
              className="input-glow"
              value={selectedCompany ? selectedCompany.name : companySearch}
              onChange={e => {
                setCompanySearch(e.target.value);
                setSelectedCompany(null);
                setShowCompanyDropdown(true);
              }}
              onFocus={() => setShowCompanyDropdown(true)}
            />
            {showCompanyDropdown && (
              <div className="search-dropdown">
                {filteredCompanies.length === 0 ? (
                  <div style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>No matches found</div>
                ) : (
                  filteredCompanies.map(c => (
                    <div
                      key={c.id}
                      className="dropdown-item"
                      onClick={() => {
                        setSelectedCompany(c);
                        setCompanySearch('');
                        setShowCompanyDropdown(false);
                      }}
                    >
                      <span>{c.name}</span>
                      <span className="dropdown-label">{c.registrationNumber}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={!selectedPerson || !selectedCompany || loading}
          >
            Calculate UBO
          </button>
        </form>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="empty-state">
          <div className="spinner"></div>
          <p className="mt-4">Traversing ownership branches and executing graph math...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="glass-panel alert-card" style={{ borderColor: 'var(--risk-high)', display: 'flex', gap: '12px' }}>
          <AlertCircle style={{ color: 'var(--risk-high)', flexShrink: 0 }} />
          <div>
            <div className="alert-title" style={{ color: 'var(--risk-high)', marginBottom: '4px' }}>Calculation Error</div>
            <p className="text-secondary" style={{ fontSize: '0.9rem' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="ubo-results animate-fade-in">
          
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 className="widget-title" style={{ margin: 0 }}>Calculated Paths ({result.paths.length})</h2>
            
            {result.paths.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <Info size={32} className="empty-state-icon" />
                <p>No ownership paths found. {selectedPerson?.name} has no equity connection to {selectedCompany?.name}.</p>
              </div>
            ) : (
              <div className="ubo-path-list" style={{ overflowY: 'auto', maxHeight: '450px', paddingRight: '8px' }}>
                {result.paths.map(path => (
                  <div key={path.pathIndex} className="ubo-path-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      <span>PATH CHAIN #{path.pathIndex}</span>
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>+ {path.percentage}%</span>
                    </div>
                    <div className="ubo-path-flow">
                      {path.trace.map((step, idx) => (
                        <React.Fragment key={idx}>
                          <span>{step.fromName}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', fontSize: '0.75rem', padding: '0 4px' }}>
                            <Percent size={12} />
                            <span>{step.shares}%</span>
                            <ArrowRight size={14} className="arrow-icon" />
                          </div>
                          {idx === path.trace.length - 1 && <span>{step.toName}</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel ubo-percentage-box">
              <div className="ubo-pct-value">{result.totalOwnership}%</div>
              <p className="text-secondary" style={{ fontWeight: 500, fontSize: '1rem' }}>Ultimate Beneficial Share</p>
              <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '12px' }}>
                Calculated by multiplying the shares along all paths connecting the shareholder and target corporation.
              </p>
            </div>

            {result.paths.length > 0 && (
              <div className="glass-panel" style={{ flex: 1, minHeight: '250px', position: 'relative', overflow: 'hidden', padding: '16px' }}>
                <h3 className="detail-section-title">Ownership Chain Map</h3>
                <div ref={chartRef} style={{ width: '100%', height: '220px' }}></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
