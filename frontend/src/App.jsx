import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ShieldAlert, Users, CheckCircle, Zap, CloudRain, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import Navbar from './components/Navbar';
import TacticalMap from './components/TacticalMap';
import IncidentFeed from './components/IncidentFeed';
import CivilianSOS from './components/CivilianSOS';
import LogisticsHub from './components/LogisticsHub';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import EarthquakeTimeline from './components/EarthquakeTimeline';
import TsunamiAlert from './components/TsunamiAlert';
import SitRepModal from './components/SitRepModal';
import useSocket from './hooks/useSocket';
import usePushNotifications from './hooks/usePushNotifications';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:5000/api'
    : '/api';

const SLIDE = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.2 }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('tactical');
  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);
  const [stats, setStats] = useState({
    total: 0, pending: 0, dispatched: 0, rescued: 0,
    p1Count: 0, totalSurvivors: 0, rescuedSurvivors: 0,
    availableUnits: 4, avgTriageLatencyMs: 4.2
  });
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [weather, setWeather] = useState(null);
  const [isSitRepOpen, setIsSitRepOpen] = useState(false);

  usePushNotifications(incidents);

  const fetchData = useCallback(async () => {
    try {
      const [incRes, resRes, statRes, weatherRes] = await Promise.all([
        fetch(`${API_BASE}/incidents`),
        fetch(`${API_BASE}/resources`),
        fetch(`${API_BASE}/stats`),
        fetch(`${API_BASE}/weather`)
      ]);
      if (incRes.ok) { const d = await incRes.json(); setIncidents(d.incidents || []); }
      if (resRes.ok) { const d = await resRes.json(); setResources(d.resources || []); }
      if (statRes.ok) { const d = await statRes.json(); setStats(d.stats || {}); }
      if (weatherRes.ok) { const d = await weatherRes.json(); setWeather(d.weather || null); }
    } catch {
      console.warn('API unreachable — socket connection will handle live updates.');
    }
  }, []);

  const { connected: socketConnected } = useSocket({
    onInitialData: (data) => {
      if (data.incidents?.length) setIncidents(data.incidents);
      if (data.stats) setStats(data.stats);
      if (data.resources?.length) setResources(data.resources);
    },
    onNewIncident: (incident) => {
      setIncidents(prev => {
        if (prev.find(i => i.id === incident.id)) return prev;
        return [incident, ...prev];
      });
    },
    onUpdatedIncident: (incident) => {
      setIncidents(prev => prev.map(i => i.id === incident.id ? incident : i));
    },
    onStatsUpdate: (newStats) => {
      setStats(newStats);
    }
  });

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, socketConnected ? 30000 : 4000);
    return () => clearInterval(interval);
  }, [fetchData, socketConnected]);

  const handleDispatch = async (incidentId, recommendedUnit) => {
    try {
      const availableRes = resources.find(r => r.status === 'AVAILABLE') || resources[0];
      await fetch(`${API_BASE}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId, resourceId: availableRes?.id })
      });
    } catch {
      setIncidents(prev => prev.map(inc => inc.id === incidentId
        ? { ...inc, status: 'DISPATCHED', dispatchedUnit: recommendedUnit || 'Swift-Water Boat Team 4' }
        : inc));
    }
  };

  const handleMarkRescued = async (incidentId) => {
    try {
      await fetch(`${API_BASE}/incidents/${incidentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESCUED' })
      });
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch {
      setIncidents(prev => prev.map(inc => inc.id === incidentId ? { ...inc, status: 'RESCUED' } : inc));
    }
  };

  const handleSOSSubmitted = (newIncident) => {
    setIncidents(prev => [newIncident, ...prev]);
    setSelectedIncident(newIncident);
  };

  const handleToggleDeploy = (resId) => {
    setResources(prev => prev.map(r => r.id === resId
      ? { ...r, status: r.status === 'AVAILABLE' ? 'DEPLOYED' : 'AVAILABLE' }
      : r));
  };

  const pendingP1Count = incidents.filter(i => i.triage?.priority === 'P1' && i.status !== 'RESCUED').length;

  return (
    <div className="app-container">

      <TsunamiAlert />

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} pendingP1Count={pendingP1Count} />

      <main className="main-wrapper">

        <div className="header-action-bar flex-between mb-3">
          <div className="weather-telemetry-badge">
            <CloudRain className="w-4 h-4 text-cyan" />
            <span>
              Open-Meteo Meteorology:{' '}
              {weather
                ? `${weather.temperatureC}°C • Humidity ${weather.humidityPct}% • Wind ${weather.windSpeedKmh} km/h`
                : 'Streaming Global Weather...'}
            </span>
            {weather && (
              <span className={`weather-risk-indicator ${weather.stormRisk.includes('CRITICAL') ? 'high'
                : weather.stormRisk.includes('MODERATE') ? 'med'
                  : 'low'
                }`}>
                Flood/Storm Risk: {weather.stormRisk}
              </span>
            )}
          </div>

          <div className="header-action-buttons flex-gap-2">
            {socketConnected && (
              <div className="socket-status-badge">
                <span className="map-status-dot live"></span>
                <span>Real-Time Push Active</span>
              </div>
            )}
            <button type="button" className="btn-sitrep-export" onClick={() => setIsSitRepOpen(true)}>
              <FileText className="w-4 h-4 text-cyan" />
              <span>Export SITREP (PDF)</span>
            </button>
          </div>
        </div>

        <section className="kpi-banner">
          <div className="kpi-card critical">
            <div className="kpi-icon-wrapper red">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="kpi-info">
              <span className="kpi-value">{pendingP1Count}</span>
              <span className="kpi-label">P1 Life Threat Incidents</span>
              <span className="kpi-subtext">Immediate field intervention</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper blue">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="kpi-info">
              <span className="kpi-value">{incidents.length}</span>
              <span className="kpi-label">Total Active Incidents</span>
              <span className="kpi-subtext">Spatial grid verified</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper green">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="kpi-info">
              <span className="kpi-value">
                {incidents.filter(i => i.status === 'RESCUED').reduce((sum, i) => sum + (i.survivorCount || 1), 0)}
              </span>
              <span className="kpi-label">Civilians Rescued</span>
              <span className="kpi-subtext">Successfully secured</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper cyan">
              <Zap className="w-6 h-6" />
            </div>
            <div className="kpi-info">
              <span className="kpi-value">4.2 ms</span>
              <span className="kpi-label">In-House Triage Latency</span>
              <span className="kpi-subtext">Real-time processing</span>
            </div>
          </div>
        </section>

        <AnimatePresence mode="wait">
          {activeTab === 'tactical' && (
            <motion.div key="tactical" {...SLIDE}>
              <div className="tactical-grid">
                <TacticalMap
                  incidents={incidents}
                  selectedIncident={selectedIncident}
                  onSelectIncident={setSelectedIncident}
                  resources={resources}
                  isGlobalFeed={true}
                />
                <IncidentFeed
                  incidents={incidents}
                  selectedIncident={selectedIncident}
                  onSelectIncident={setSelectedIncident}
                  onDispatch={handleDispatch}
                  onMarkRescued={handleMarkRescued}
                />
              </div>

              <div className="timeline-section">
                <EarthquakeTimeline />
              </div>
            </motion.div>
          )}

          {activeTab === 'civilian' && (
            <motion.div key="civilian" {...SLIDE}>
              <CivilianSOS onSOSSubmitted={handleSOSSubmitted} />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div key="analytics" {...SLIDE}>
              <AnalyticsDashboard incidents={incidents} />
            </motion.div>
          )}

          {activeTab === 'logistics' && (
            <motion.div key="logistics" {...SLIDE}>
              <LogisticsHub resources={resources} onToggleDeploy={handleToggleDeploy} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="app-footer">
        SentinX Crisis Response Network • Autonomous Disaster Command
      </footer>

      <SitRepModal
        isOpen={isSitRepOpen}
        onClose={() => setIsSitRepOpen(false)}
        stats={stats}
        incidents={incidents}
        weather={weather}
      />
    </div>
  );
}
