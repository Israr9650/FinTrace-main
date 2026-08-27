import React, { useEffect, useState } from 'react';
import { Building2, Users, Globe2, Link2, ShieldAlert, Database, Info, Share2, Layers } from 'lucide-react';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { api } from '../services/api';

export default function OverviewPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverviewStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Unable to connect to the graph database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewStats();
  }, []);

  if (loading) return <LoadingSpinner message="Loading graph statistics..." />;
  if (error) return <ErrorAlert message={error} onRetry={fetchOverviewStats} />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">Graph statistics and relationship overview powered by CognoDB.</p>
      </div>

      <div className="stats-grid">
        <StatCard label="Companies" value={stats?.companies ?? 0} icon={Building2} />
        <StatCard label="People" value={stats?.people ?? 0} icon={Users} />
        <StatCard label="Countries" value={stats?.countries ?? 0} icon={Globe2} />
        <StatCard label="Relationships" value={stats?.relationships ?? 0} icon={Link2} />
        <StatCard label="High-Risk Flagged" value={stats?.highRiskCount ?? 0} icon={ShieldAlert} />
      </div>

      <div className="card">
        <h2 className="card-title">
          <Info size={18} color="var(--brand-primary)" />
          About GraphLens
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
          GraphLens is a simple corporate investigation application built to demonstrate how a graph database handles multi-hop ownership structures, shared addresses, and country risk relationships. It lets you search entities, trace indirect ownership lines, and discover shared connections across companies.
        </p>
      </div>

      <div className="card">
        <h2 className="card-title">
          <Database size={18} color="var(--brand-primary)" />
          Why a Graph Database?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Layers size={16} color="var(--brand-primary)" />
              Multi-Hop Traversal
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Following ownership through multiple holding companies (e.g. <code>Person ➔ Company A ➔ Company B ➔ Company C</code>) in SQL requires recursive queries. In Cypher, it uses a simple variable-length match: <code>(p:Person)-[:OWNS*1..4]-&gt;(c:Company)</code>.
            </p>
          </div>

          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Share2 size={16} color="var(--brand-primary)" />
              Shared Address & Director Connections
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Finding multiple companies sharing the same address or director requires multiple joins in relational databases, whereas graph pattern matching highlights shared nodes directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
