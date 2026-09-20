import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Zap, MapPin, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

const PERIODS = [
  { key: '24h', label: 'Last 24 Hours' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' }
];

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getMagClass(mag) {
  if (mag >= 5) return 'mag-critical';
  if (mag >= 4) return 'mag-warning';
  if (mag >= 3) return 'mag-moderate';
  return 'mag-low';
}

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:5000/api'
    : '/api';

export default function EarthquakeTimeline() {
  const [period, setPeriod] = useState('24h');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [count, setCount] = useState(0);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/history?period=${period}`);
      const data = await res.json();
      setEvents(data.events || []);
      setCount(data.count || 0);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="timeline-panel tactical-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Clock className="w-4 h-4 text-amber" />
          <span>Historical Earthquake Timeline</span>
          <span className="timeline-count-badge">{count} events</span>
        </div>
        <div className="panel-controls">
          <div className="period-toggle-group">
            {PERIODS.map(p => (
              <button
                key={p.key}
                className={`period-toggle-btn ${period === p.key ? 'active' : ''}`}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button className="icon-btn" onClick={fetchHistory} title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'spin' : ''}`} />
          </button>
          <button className="icon-btn" onClick={() => setIsExpanded(v => !v)}>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="timeline-list">
          {loading && (
            <div className="timeline-loading">
              <div className="timeline-loading-spinner"></div>
              <span>Fetching USGS archive...</span>
            </div>
          )}
          {!loading && events.length === 0 && (
            <div className="timeline-empty">No events found for this period</div>
          )}
          {!loading && events.map(event => (
            <div key={event.id} className={`timeline-item ${getMagClass(event.magnitude)}`}>
              <div className="timeline-mag-pill">
                <Zap className="w-3 h-3" />
                M{event.magnitude?.toFixed(1)}
              </div>
              <div className="timeline-event-info">
                <div className="timeline-place">
                  <MapPin className="w-3 h-3" />
                  {event.place}
                </div>
                <div className="timeline-meta">
                  <span>{timeAgo(event.time)}</span>
                  <span>Depth: {event.depth?.toFixed(0)} km</span>
                  {event.tsunami === 1 && <span className="tsunami-flag">🌊 TSUNAMI</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
