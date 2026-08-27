import React from 'react';

export default function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="stat-card">
      {Icon && (
        <div className="stat-icon-wrapper">
          <Icon size={24} />
        </div>
      )}
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
