import React from 'react';
import { ShieldAlert, Crosshair, AlertOctagon, Truck, Activity } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, pendingP1Count }) {
  return (
    <header className="navbar">
      <div className="navbar-top-row">
        <div className="brand-section">
          <div className="brand-logo-badge">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="brand-title-group">
            <div className="brand-title">
              <span>SentinX</span>
            </div>
            <span className="brand-subtitle">Crisis Response &amp; Triage</span>
          </div>
        </div>

        <div className="nav-status-group">
          <div className="status-pill">
            <div className="pulse-dot"></div>
            <span>OPERATIONAL</span>
          </div>
        </div>
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'tactical' ? 'active' : ''}`}
          onClick={() => setActiveTab('tactical')}
        >
          <Crosshair className="w-4 h-4" />
          <span>Tactical Ops</span>
        </button>

        <button
          className={`nav-tab-btn urgent ${activeTab === 'civilian' ? 'active' : ''}`}
          onClick={() => setActiveTab('civilian')}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Civilian SOS</span>
          {pendingP1Count > 0 && (
            <span className="brand-badge">
              {pendingP1Count} CRITICAL
            </span>
          )}
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <Activity className="w-4 h-4" />
          <span>Analytics</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'logistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('logistics')}
        >
          <Truck className="w-4 h-4" />
          <span>Fleet Logistics</span>
        </button>
      </nav>
    </header>
  );
}
