import React from 'react';
import { Network, LayoutDashboard, Search, GitFork, ShieldAlert } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'entities', label: 'Entity Explorer', icon: Search },
    { id: 'relationships', label: 'Relationship Analysis', icon: GitFork },
    { id: 'risk', label: 'Risk Checks', icon: ShieldAlert }
  ];

  return (
    <header className="navbar">
      <div className="brand-container">
        <div className="brand-icon">
          <Network size={20} />
        </div>
        <span className="brand-title">GraphLens</span>
      </div>

      <nav className="nav-links">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
