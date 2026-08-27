import React, { useState, useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import { Search, Info, ZoomIn, ZoomOut, RotateCcw, AlertTriangle } from 'lucide-react';

export default function GraphView({ backendUrl }) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected Node Details
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeConnections, setNodeConnections] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch full network for rendering
  useEffect(() => {
    async function loadNetworkData() {
      try {
        setLoading(true);
       
        const res = await fetch(`${backendUrl}/api/network`);
        const data = await res.json();
        
        if (data.success) {
          setNodes(data.nodes);
          setEdges(data.edges);
          // console.log(`Loaded ${data.nodes.length} nodes, ${data.edges.length} edges.`);
        } else {
          setError(data.message);
        }
      } catch (err) {
        console.error('ERROR:', err);
        setError('Unable to load graph dataset. Please verify database connection.');
      } finally {
        setLoading(false);
      }
    }
    loadNetworkData();
  }, [backendUrl]);

  useEffect(() => {
    if (loading || error || nodes.length === 0 || !containerRef.current) return;


    const visNodes = nodes.map(node => {
      let color = {
        background: '#1e293b',
        border: '#475569',
        highlight: { background: '#334155', border: '#cbd5e1' }
      };
      
      let fontColor = '#f8fafc';
      let shape = 'dot';
      let size = 20;

    
      if (node.type === 'Person') {
        color = {
          background: '#1e3a8a',
          border: '#3b82f6',    
          highlight: { background: '#2563eb', border: '#60a5fa' }
        };
        size = 18;
      } else if (node.type === 'Company') {
 
        if (node.riskScore >= 75) {
          color = {
            background: 'rgba(244, 63, 94, 0.25)', 
            border: '#f43f5e',
            highlight: { background: 'rgba(244, 63, 94, 0.4)', border: '#fda4af' }
          };
        } else {
          color = {
            background: '#0f172a', 
            border: '#94a3b8',     
            highlight: { background: '#1e293b', border: '#cbd5e1' }
          };
        }
        size = 22;
      } else if (node.type === 'Address') {
        color = {
          background: '#7c2d12', 
          border: '#ea580c',    
          highlight: { background: '#9a3412', border: '#fb923c' }
        };
        size = 14;
        shape = 'diamond';
      } else if (node.type === 'Country') {
        color = {
          background: '#4c1d95', 
          border: '#8b5cf6',    
          highlight: { background: '#5b21b6', border: '#a78bfa' }
        };
        size = 25;
        shape = 'hexagon';
      }

      return {
        id: node.id,
        label: node.name,
        color,
        shape,
        size,
        font: { color: fontColor, face: 'Inter', size: 12 },
        borderWidth: 2,
        title: `${node.type}: ${node.name} ${node.riskScore ? `(Risk: ${node.riskScore})` : ''}`
      };
    });

    const visEdges = edges.map(edge => {
      let label = edge.type;
      if (edge.type === 'OWNS' && edge.shares) {
        label = `OWNS (${edge.shares}%)`;
      }
      
      let color = '#475569';
      if (edge.type === 'OWNS') color = '#60a5fa';
      else if (edge.type === 'DIRECTOR_OF') color = '#a78bfa'; 
      else if (edge.type === 'LOCATED_AT') color = '#f97316'; 
      else if (edge.type === 'REGISTERED_IN') color = '#a3e635'; 

      return {
        id: edge.neoId ? edge.neoId.toString() : `${edge.from}-${edge.to}-${edge.type}`,
        from: edge.from,
        to: edge.to,
        label,
        font: { align: 'middle', color: '#94a3b8', size: 9, face: 'Inter' },
        arrows: { to: { enabled: true, scaleFactor: 0.8 } },
        color: { color, reset: color, highlight: '#f8fafc' },
        width: 1.5,
        smooth: { type: 'cubicBezier', roundness: 0.4 }
      };
    });

    const data = { nodes: visNodes, edges: visEdges };

    const options = {
      physics: {
        forceAtlas2Based: {
          gravitationalConstant: -26,
          centralGravity: 0.005,
          springLength: 120,
          springConstant: 0.08,
          avoidOverlap: 0.2
        },
        solver: 'forceAtlas2Based',
        stabilization: { iterations: 150, updateInterval: 25 }
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        selectable: true,
        selectConnectedEdges: true
      }
    };

    const network = new Network(containerRef.current, data, options);
    networkRef.current = network;

    // Node selection event handler
    network.on('selectNode', async (event) => {
      const nodeId = event.nodes[0];
      
      fetchNodeDetails(nodeId);
    });

    network.on('deselectNode', () => {
      setSelectedNode(null);
      setNodeConnections([]);
    });

    return () => {
      if (networkRef.current) {
        
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [loading, error, nodes, edges]);

  
  async function fetchNodeDetails(nodeId) {
    try {
      setLoadingDetails(true);
      const res = await fetch(`${backendUrl}/api/nodes/details/${nodeId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedNode(data.node);
        setNodeConnections(data.connections);
      }
    } catch (err) {
      console.error('ERROR [fetchNodeDetails]:', err);
    } finally {
      setLoadingDetails(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (!searchQuery || !networkRef.current) return;
    
    const matchedNode = nodes.find(n => 
      n.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (matchedNode) {
      networkRef.current.selectNodes([matchedNode.id]);
      networkRef.current.focus(matchedNode.id, {
        scale: 1.2,
        animation: { duration: 800, easingFunction: 'easeInOutQuad' }
      });
      fetchNodeDetails(matchedNode.id);
    } else {
      alert(`No node containing "${searchQuery}" was found.`);
    }
  }

  // Camera Controls
  const zoomIn = () => {
    if (!networkRef.current) return;
    const currentScale = networkRef.current.getScale();
    networkRef.current.moveTo({ scale: currentScale * 1.3, animation: true });
  };

  const zoomOut = () => {
    if (!networkRef.current) return;
    const currentScale = networkRef.current.getScale();
    networkRef.current.moveTo({ scale: currentScale * 0.7, animation: true });
  };

  const resetCamera = () => {
    if (!networkRef.current) return;
    networkRef.current.fit({ animation: true });
  };

  if (loading) {
    return (
      <div className="empty-state animate-fade-in">
        <div className="spinner"></div>
        <p className="mt-4">Constructing topology visualization graph from active registers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel alert-card animate-fade-in" style={{ borderColor: 'var(--risk-high)' }}>
        <div className="alert-header">
          <span className="alert-title flex gap-2" style={{ color: 'var(--risk-high)' }}>
            <AlertTriangle /> Graph Engine Failure
          </span>
        </div>
        <p className="text-secondary">{error}</p>
        <p className="mt-4 text-muted">
          Ensure CognoDB has seed data loaded. Go to the "Setup & Seeding" tab to clear and seed.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div className="content-header">
        <h1>Interactive Graph Explorer</h1>
        <p>Double-click to expand branches, drag nodes to organize, and audit corporate paths.</p>
      </div>

      <div className="graph-explorer-layout">
        {/* Graph Canvas Panel */}
        <div className="glass-panel graph-canvas-container">
          {nodes.length === 0 ? (
            <div className="empty-state">
              <p>Database is empty. Please run seeding script or seed via Setup page.</p>
            </div>
          ) : (
            <div ref={containerRef} className="graph-canvas" />
          )}

          {/* Camera controls */}
          <div className="graph-controls">
            <button className="graph-btn" onClick={zoomIn} title="Zoom In"><ZoomIn size={18} /></button>
            <button className="graph-btn" onClick={zoomOut} title="Zoom Out"><ZoomOut size={18} /></button>
            <button className="graph-btn" onClick={resetCamera} title="Reset View"><RotateCcw size={18} /></button>
          </div>

          {/* Legend Panel */}
          <div className="glass-panel legend-panel">
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#1e3a8a', border: '1px solid #3b82f6' }}></div>
              <span>Person</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#0f172a', border: '1px solid #94a3b8' }}></div>
              <span>Company (Normal)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: 'rgba(244, 63, 94, 0.25)', border: '1px solid #f43f5e' }}></div>
              <span>Company (High Risk)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#7c2d12', border: '1px solid #ea580c' }}></div>
              <span>Address</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#4c1d95', border: '1px solid #8b5cf6' }}></div>
              <span>Country</span>
            </div>
          </div>
        </div>

        {/* Side Panel for Node details */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Search box inside Side Panel */}
          <form onSubmit={handleSearchSubmit} style={{ padding: '16px', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="Search node by name..."
                className="input-glow"
                style={{ padding: '8px 12px 8px 36px', fontSize: '0.85rem' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <Search size={16} className="text-muted" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            <button type="submit" className="btn-primary" style={{ height: '36px', padding: '0 12px', fontSize: '0.85rem' }}>
              Find
            </button>
          </form>

          {/* Node Details view */}
          {loadingDetails ? (
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
              <p className="mt-2 text-muted" style={{ fontSize: '0.8rem' }}>Loading properties...</p>
            </div>
          ) : selectedNode ? (
            <div className="detail-panel" style={{ flex: 1, overflowY: 'auto' }}>
              <div>
                <span className="risk-badge low" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)', border: 'none', marginBottom: '8px' }}>
                  {selectedNode.type}
                </span>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, wordBreak: 'break-word' }}>
                  {selectedNode.properties.name || selectedNode.properties.fullAddress}
                </h2>
              </div>

              {/* Properties Section */}
              <div>
                <h3 className="detail-section-title">Properties</h3>
                <div className="property-list">
                  {Object.entries(selectedNode.properties).map(([key, val]) => {
                    // Hide IDs/Internal props that might be redundant
                    if (key === 'id') return null;
                    return (
                      <div key={key} className="property-row">
                        <span className="property-label">{key}</span>
                        <span className="property-value">
                          {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Neighbors / Connections Section */}
              <div>
                <h3 className="detail-section-title">Connections ({nodeConnections.length})</h3>
                {nodeConnections.length === 0 ? (
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>No direct connections found.</p>
                ) : (
                  <div className="connections-list">
                    {nodeConnections.map((conn, idx) => (
                      <div key={idx} className="connection-item">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="connection-name" title={conn.neighborName}>
                            {conn.neighborName}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {conn.neighborType} ({conn.isOutgoing ? 'Outgoing' : 'Incoming'})
                          </span>
                        </div>
                        <span className="connection-relation">
                          {conn.relationshipType}
                          {conn.properties.shares ? ` (${conn.properties.shares}%)` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ flex: 1, padding: '40px 20px' }}>
              <Info size={36} className="empty-state-icon" />
              <p style={{ fontSize: '0.85rem' }}>Select a node in the graph explorer or search by name to view corporate structures.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
