import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorAlert({ message = 'Unable to connect to the graph database.', onRetry }) {
  return (
    <div className="state-container" style={{ backgroundColor: 'var(--danger-light)', borderRadius: 'var(--radius-md)', margin: '1rem 0' }}>
      <AlertCircle size={36} color="var(--danger-color)" style={{ marginBottom: '0.5rem' }} />
      <div className="state-title" style={{ color: '#991b1b' }}>Database Error</div>
      <div className="state-text" style={{ color: '#7f1d1d' }}>{message}</div>
      {onRetry && (
        <button className="btn-primary" style={{ backgroundColor: 'var(--danger-color)' }} onClick={onRetry}>
          <RefreshCw size={16} /> Retry Request
        </button>
      )}
    </div>
  );
}
