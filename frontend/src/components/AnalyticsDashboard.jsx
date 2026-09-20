import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { TrendingUp, Activity, Globe, Zap } from 'lucide-react';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 11 } } } },
  scales: {
    x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } }
  }
};

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:5000/api'
    : '/api';

export default function AnalyticsDashboard({ incidents }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`${API_BASE}/analytics`);
        const data = await res.json();
        setAnalytics(data.analytics);
      } catch {
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
    const interval = setInterval(fetch_, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="analytics-loading">
      <div className="analytics-spinner"></div>
      <span>Compiling live telemetry...</span>
    </div>
  );

  if (!analytics) return (
    <div className="analytics-error">Unable to fetch analytics. Ensure backend is running.</div>
  );

  const { byPriority, topRegions, magBands, hourly } = analytics;

  const hourlyData = {
    labels: hourly.labels,
    datasets: [{
      label: 'Seismic Events',
      data: hourly.data,
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6, 182, 212, 0.12)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#06b6d4',
      pointRadius: 3
    }]
  };

  const priorityData = {
    labels: ['P1 Critical', 'P2 Urgent', 'P3 Moderate', 'Rescued'],
    datasets: [{
      data: [byPriority.P1, byPriority.P2, byPriority.P3, byPriority.RESCUED],
      backgroundColor: ['rgba(239,68,68,0.8)', 'rgba(245,158,11,0.8)', 'rgba(59,130,246,0.8)', 'rgba(16,185,129,0.8)'],
      borderColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'],
      borderWidth: 2
    }]
  };

  const magData = {
    labels: ['M 2-3', 'M 3-4', 'M 4-5', 'M 5+'],
    datasets: [{
      label: 'Events by Magnitude Band',
      data: [magBands['2-3'], magBands['3-4'], magBands['4-5'], magBands['5+']],
      backgroundColor: ['rgba(59,130,246,0.7)', 'rgba(245,158,11,0.7)', 'rgba(239,68,68,0.7)', 'rgba(220,38,38,0.9)'],
      borderRadius: 4
    }]
  };

  const regionData = {
    labels: topRegions.map(r => r.region),
    datasets: [{
      label: 'Incidents',
      data: topRegions.map(r => r.count),
      backgroundColor: 'rgba(6,182,212,0.65)',
      borderColor: '#06b6d4',
      borderWidth: 1,
      borderRadius: 4
    }]
  };

  return (
    <div className="analytics-container">
      <div className="analytics-kpi-row">
        <div className="analytics-kpi">
          <Activity className="w-5 h-5 text-red" />
          <div>
            <div className="analytics-kpi-value">{byPriority.P1}</div>
            <div className="analytics-kpi-label">P1 Critical</div>
          </div>
        </div>
        <div className="analytics-kpi">
          <Zap className="w-5 h-5 text-amber" />
          <div>
            <div className="analytics-kpi-value">{analytics.usgsEvents}</div>
            <div className="analytics-kpi-label">USGS Events</div>
          </div>
        </div>
        <div className="analytics-kpi">
          <Globe className="w-5 h-5 text-cyan" />
          <div>
            <div className="analytics-kpi-value">{topRegions.length}</div>
            <div className="analytics-kpi-label">Regions Affected</div>
          </div>
        </div>
        <div className="analytics-kpi">
          <TrendingUp className="w-5 h-5 text-emerald" />
          <div>
            <div className="analytics-kpi-value">{byPriority.RESCUED}</div>
            <div className="analytics-kpi-label">Rescued</div>
          </div>
        </div>
      </div>

      <div className="analytics-charts-grid">
        <div className="analytics-chart-card span-2">
          <div className="analytics-chart-title">
            <TrendingUp className="w-4 h-4 text-cyan" />
            Seismic Events — Last 12 Hours
          </div>
          <div className="analytics-chart-body">
            <Line data={hourlyData} options={{ ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } } }} />
          </div>
        </div>

        <div className="analytics-chart-card">
          <div className="analytics-chart-title">
            <Activity className="w-4 h-4 text-red" />
            Priority Breakdown
          </div>
          <div className="analytics-chart-body">
            <Doughnut
              data={priorityData}
              options={{
                ...CHART_DEFAULTS,
                scales: {},
                plugins: { ...CHART_DEFAULTS.plugins, legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } },
                cutout: '62%'
              }}
            />
          </div>
        </div>

        <div className="analytics-chart-card">
          <div className="analytics-chart-title">
            <Zap className="w-4 h-4 text-amber" />
            Magnitude Distribution
          </div>
          <div className="analytics-chart-body">
            <Bar data={magData} options={{ ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } } }} />
          </div>
        </div>

        <div className="analytics-chart-card span-2">
          <div className="analytics-chart-title">
            <Globe className="w-4 h-4 text-cyan" />
            Top 10 Most Affected Regions
          </div>
          <div className="analytics-chart-body">
            <Bar
              data={regionData}
              options={{
                ...CHART_DEFAULTS,
                indexAxis: 'y',
                plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
