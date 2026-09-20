import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Waves } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:5000/api'
    : '/api';

export default function TsunamiAlert() {
  const [warnings, setWarnings] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`${API_BASE}/tsunami`);
        const data = await res.json();
        setWarnings(data.warnings || []);
        setDismissed(false); 
      } catch {
        setWarnings([]);
      }
    };
    fetch_();
    const interval = setInterval(fetch_, 60000); 
    return () => clearInterval(interval);
  }, []);

  if (warnings.length === 0 || dismissed) return null;

  return (
    <div className="tsunami-alert-banner">
      <div className="tsunami-alert-inner">
        <div className="tsunami-alert-left">
          <div className="tsunami-pulse-icon">
            <Waves className="w-5 h-5" />
          </div>
          <div className="tsunami-alert-text">
            <strong>🌊 TSUNAMI / HIGH MAGNITUDE ALERT</strong>
            <span>
              {warnings.length} critical seismic event{warnings.length > 1 ? 's' : ''} detected:&nbsp;
              {warnings.slice(0, 2).map(w => `M${w.magnitude?.toFixed(1)} near ${w.place}`).join(' • ')}
              {warnings.length > 2 && ` + ${warnings.length - 2} more`}
            </span>
          </div>
        </div>
        <button
          className="tsunami-dismiss-btn"
          onClick={() => setDismissed(true)}
          title="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
