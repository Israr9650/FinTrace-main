import React from 'react';
import { Database, AlertTriangle, RefreshCw } from 'lucide-react';

export default function DatabaseStatusBanner({ dbStatus, onRetry }) {
  if (dbStatus === 'connected') {
    return (
      <div className="db-status-banner connected">
        <div className="status-left">
          <span className="status-dot"></span>
          <Database size={15} />
          <span>Connected to <strong>CognoDB</strong></span>
        </div>
      </div>
    );
  }

  if (dbStatus === 'disconnected') {
    return (
      <div className="db-status-banner disconnected">
        <div className="status-left">
          <AlertTriangle size={15} />
          <span>Unable to connect to CognoDB. Check credentials in <code>.env</code> file.</span>
        </div>
        <button className="retry-btn" onClick={onRetry}>
          <RefreshCw size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Retry
        </button>
      </div>
    );
  }

  return null;
}
