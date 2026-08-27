import React from 'react';

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="state-container">
      <div className="spinner"></div>
      <div className="state-title">{message}</div>
      <div className="state-text">Fetching data from CognoDB...</div>
    </div>
  );
}
