import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Circle, LayerGroup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function AutoFly({ incidents }) {
  const map = useMap();
  useEffect(() => {
    const p1 = incidents.find(i => i.triage?.priority === 'P1' && i.lat && i.lng && i.lat !== 0);
    if (p1) {
      map.flyTo([p1.lat, p1.lng], 4, { duration: 1.5 });
    }
  }, [incidents.length]);
  return null;
}

function getPinColor(incident) {
  if (incident.status === 'RESCUED') return '#10b981';
  const p = incident.triage?.priority;
  if (p === 'P1') return '#ef4444';
  if (p === 'P2') return '#f59e0b';
  return '#3b82f6';
}

function getCoverageColor(resource) {
  return resource.status === 'AVAILABLE' ? '#10b981' : '#f59e0b';
}

function getCoverageRadius(type) {
  const radii = { BOAT: 15000, RESCUE_SQUAD: 8000, MEDICAL: 5000, DRONE: 25000, SUPPLY_TRUCK: 10000 };
  return radii[type] || 8000;
}

export default function TacticalMap({ incidents, selectedIncident, onSelectIncident, resources = [] }) {
  const validIncidents = incidents.filter(i => i.lat && i.lng && Math.abs(i.lat) <= 90 && Math.abs(i.lng) <= 180);
  const center = [20, 0];

  return (
    <div className="tactical-panel">
      <div className="panel-header">
        <div className="panel-title">
          <span className="map-title-icon">🎯</span>
          <span>Global Tactical Disaster Grid</span>
        </div>
        <div className="map-status-indicators">
          <div className="map-status-pill">
            <span className="map-status-dot live"></span>
            <span>Live Telemetry</span>
          </div>
          <div className="map-status-pill">
            <span className="map-status-dot sync"></span>
            <span>Spatial Grid Sync</span>
          </div>
        </div>
      </div>

      <div className="leaflet-map-wrapper">
        <MapContainer
          center={center}
          zoom={2}
          className="leaflet-map-container"
          zoomControl={true}
          attributionControl={false}
        >

          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; Esri'
            maxZoom={16}
          />

          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; Esri'
            maxZoom={16}
          />

          <AutoFly incidents={validIncidents} />

          <LayerGroup>
            {resources.filter(r => r.lat && r.lng).map(resource => (
              <Circle
                key={resource.id}
                center={[resource.lat, resource.lng]}
                radius={getCoverageRadius(resource.type)}
                pathOptions={{
                  color: getCoverageColor(resource),
                  fillColor: getCoverageColor(resource),
                  fillOpacity: 0.06,
                  weight: 1,
                  dashArray: resource.status === 'DEPLOYED' ? '6 4' : null
                }}
              >
                <Tooltip sticky>
                  <div className="map-tooltip">
                    <strong className="map-tooltip-id">{resource.name}</strong>
                    <div className="map-tooltip-status">Status: <span>{resource.status}</span></div>
                    <div className="map-tooltip-loc">Coverage: {getCoverageRadius(resource.type) / 1000} km radius</div>
                  </div>
                </Tooltip>
              </Circle>
            ))}
          </LayerGroup>

          {validIncidents.map(incident => {
            const color = getPinColor(incident);
            const isSelected = selectedIncident?.id === incident.id;
            const isP1 = incident.triage?.priority === 'P1' && incident.status !== 'RESCUED';

            return (
              <React.Fragment key={incident.id}>

                {isP1 && (
                  <CircleMarker
                    center={[incident.lat, incident.lng]}
                    radius={isSelected ? 22 : 18}
                    pathOptions={{ color: '#ef4444', fillColor: 'transparent', fillOpacity: 0, weight: 1.5, opacity: 0.5 }}
                    interactive={false}
                  />
                )}

                <CircleMarker
                  center={[incident.lat, incident.lng]}
                  radius={isSelected ? 11 : 7}
                  pathOptions={{
                    color: '#ffffff',
                    fillColor: color,
                    fillOpacity: 1,
                    weight: isSelected ? 2.5 : 1.5
                  }}
                  eventHandlers={{ click: () => onSelectIncident(incident) }}
                >
                  <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                    <div className="map-tooltip">
                      <div className="map-tooltip-row">
                        <strong className="map-tooltip-id">{incident.id}</strong>
                        <span className={`map-tooltip-priority p${(incident.triage?.priority || 'P3').toLowerCase()}`}>
                          {incident.triage?.priority || 'P3'}
                        </span>
                      </div>
                      <div className="map-tooltip-loc">📍 {incident.locationName}</div>
                      {incident.magnitude && <div className="map-tooltip-mag">⚡ M{incident.magnitude}</div>}
                      <div className="map-tooltip-status">Status: <span>{incident.status}</span></div>
                    </div>
                  </Tooltip>
                </CircleMarker>
              </React.Fragment>
            );
          })}
        </MapContainer>

        <div className="map-legend">
          <div className="legend-item"><span className="legend-dot p1"></span> P1 Critical Rescue</div>
          <div className="legend-item"><span className="legend-dot p2"></span> P2 Urgent Medical</div>
          <div className="legend-item"><span className="legend-dot p3"></span> P3 Relief / Supplies</div>
          <div className="legend-item"><span className="legend-dot unit"></span> Rescued / Secured</div>
          <div className="legend-divider"></div>
          <div className="legend-item"><span className="legend-ring available"></span> Unit Coverage</div>
          <div className="legend-item"><span className="legend-ring deployed"></span> Deployed Unit</div>
        </div>

        <div className="map-overlay-stats">
          <div>SCOPE: GLOBAL MULTI-HAZARD GRID</div>
          <div>FEED: USGS REAL-TIME EARTHQUAKE API</div>
          <div>TRIAGE ENGINE: ACTIVE</div>
        </div>
      </div>
    </div>
  );
}
