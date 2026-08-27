import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data/esnext';

export default function GraphCanvas({ graphData }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !graphData || !graphData.nodes || graphData.nodes.length === 0) {
      return;
    }

    // Format nodes for vis-network
    const formattedNodes = graphData.nodes.map(node => {
      let color = '#4338ca'; // default indigo (Company)
      let shape = 'dot';
      let size = 20;

      if (node.type === 'Person') {
        color = '#0d9488'; // teal
        shape = 'diamond';
        size = 18;
      } else if (node.type === 'Country') {
        color = node.isTaxHaven ? '#dc2626' : '#059669'; // red if tax haven, green if normal
        shape = 'hexagon';
        size = 16;
      } else if (node.type === 'Address') {
        color = '#7c3aed'; // purple
        shape = 'square';
        size = 16;
      }

      if (node.riskScore >= 70) {
        color = '#dc2626'; // Highlight high risk
      }

      return {
        id: node.id,
        label: `${node.label}\n(${node.type})`,
        shape,
        size,
        color: {
          background: color,
          border: '#ffffff',
          highlight: { background: color, border: '#0f172a' }
        },
        font: { color: '#0f172a', size: 12, face: 'Inter, sans-serif' }
      };
    });

    // Format edges for vis-network
    const formattedEdges = graphData.edges.map(edge => {
      let edgeLabel = edge.label;
      if (edge.ownershipPercentage) {
        edgeLabel += ` (${edge.ownershipPercentage}%)`;
      }
      return {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        label: edgeLabel,
        arrows: 'to',
        color: { color: '#94a3b8', highlight: '#4338ca' },
        font: { color: '#64748b', size: 11, align: 'middle' },
        smooth: { type: 'cubicBezier' }
      };
    });

    const data = {
      nodes: new DataSet(formattedNodes),
      edges: new DataSet(formattedEdges)
    };

    const options = {
      physics: {
        barnesHut: {
          gravitationalConstant: -3000,
          centralGravity: 0.3,
          springLength: 120
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        zoomView: true
      }
    };

    const network = new Network(containerRef.current, data, options);

    return () => {
      network.destroy();
    };
  }, [graphData]);

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className="graph-viewport" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No graph network data available to display.</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div className="graph-viewport" ref={containerRef} />
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(4px)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.5rem 0.75rem',
        fontSize: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{ fontWeight: 600, marginBottom: '0.1rem', color: 'var(--text-primary)' }}>Legend</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4338ca', display: 'inline-block' }}></span>
          <span>Company</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '10px', height: '10px', transform: 'rotate(45deg)', backgroundColor: '#0d9488', display: 'inline-block' }}></span>
          <span>Person</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '10px', height: '10px', backgroundColor: '#7c3aed', display: 'inline-block' }}></span>
          <span>Address</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#dc2626', display: 'inline-block' }}></span>
          <span>High Risk Entity</span>
        </div>
      </div>
    </div>
  );
}
