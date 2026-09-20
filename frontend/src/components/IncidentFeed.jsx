import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock, MapPin, Users, Phone, Truck, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function IncidentFeed({
  incidents,
  selectedIncident,
  onSelectIncident,
  onDispatch,
  onMarkRescued
}) {
  const [filterPriority, setFilterPriority] = useState('ALL');

  const filtered = incidents.filter(item => {
    if (filterPriority === 'ALL') return true;
    return item.triage?.priority === filterPriority;
  });

  return (
    <div className="tactical-panel">
      <div className="panel-header">
        <div className="panel-title">
          <AlertCircle className="w-4 h-4 text-red" />
          <span>Priority Triage Queue ({filtered.length})</span>
        </div>
        <div className="panel-controls">
          {['ALL', 'P1', 'P2', 'P3'].map(p => (
            <button
              key={p}
              className={`filter-badge ${filterPriority === p ? 'active' : ''}`}
              onClick={() => setFilterPriority(p)}
            >
              {p === 'ALL' ? 'All Alerts' : p}
            </button>
          ))}
        </div>
      </div>

      <div className="incident-feed-wrapper">
        <AnimatePresence>
          {filtered.map((item) => {
            const triage = item.triage || {};
            const priority = triage.priority || 'P3';
            const isP1 = priority === 'P1';
            const isP2 = priority === 'P2';
            const isRescued = item.status === 'RESCUED';
            const isDispatched = item.status === 'DISPATCHED';

            let cardPriorityClass = 'priority-p3';
            let badgeClass = 'p3';
            if (isP1) {
              cardPriorityClass = 'priority-p1';
              badgeClass = 'p1';
            } else if (isP2) {
              cardPriorityClass = 'priority-p2';
              badgeClass = 'p2';
            }

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className={`incident-card ${cardPriorityClass} ${isRescued ? 'status-rescued' : ''}`}
                onClick={() => onSelectIncident(item)}
              >
                
                <div className="incident-header">
                  <div className="incident-id-group">
                    <span className="incident-id">{item.id}</span>
                    <span className={`priority-badge ${badgeClass}`}>
                      {triage.priorityLabel || priority}
                    </span>
                    <span className="incident-time-stamp">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className={`threat-meter ${isP1 ? 'high' : isP2 ? 'med' : 'low'}`}>
                    <ShieldAlert className="w-4 h-4" />
                    <span>Index: {triage.threatIndex || 50}/100</span>
                  </div>
                </div>

                <div className="incident-location-row">
                  <MapPin className="w-4 h-4 text-cyan" />
                  <span>{item.locationName}</span>
                </div>

                <div className="incident-victim-row">
                  <span><strong>Victim:</strong> {item.victimName}</span>
                  <span>•</span>
                  <span><Users className="w-3.5 h-3.5 inline mr-1" />{item.survivorCount} Survivor(s)</span>
                  <span>•</span>
                  <span><Phone className="w-3.5 h-3.5 inline mr-1" />{item.contact}</span>
                </div>

                <div className="incident-message-box">
                  &ldquo;{item.message}&rdquo;
                </div>

                {triage.detectedKeywords && triage.detectedKeywords.length > 0 && (
                  <div className="keyword-tag-container">
                    {triage.detectedKeywords.map((kw, i) => (
                      <span key={i} className="keyword-tag">
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}

                {triage.recommendedDispatch && (
                  <div className="dispatch-recommendation-box">
                    <div className="dispatch-rec-title">
                      <Truck className="w-3.5 h-3.5" />
                      <span>Recommended Unit ({triage.recommendedDispatch.urgencyLevel})</span>
                    </div>
                    <div className="dispatch-rec-unit">
                      {triage.recommendedDispatch.unitType}
                    </div>
                  </div>
                )}

                <div className="incident-actions-row">
                  <div>
                    {item.status === 'PENDING' && (
                      <span className="status-badge pending">● Awaiting Dispatch</span>
                    )}
                    {item.status === 'DISPATCHED' && (
                      <span className="status-badge dispatched">➔ {item.dispatchedUnit || 'En Route'}</span>
                    )}
                    {item.status === 'RESCUED' && (
                      <span className="status-badge rescued">✓ Secured & Rescued</span>
                    )}
                  </div>

                  <div className="flex-gap-2">
                    {item.status === 'PENDING' && (
                      <button
                        className="btn-action-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDispatch(item.id, triage.recommendedDispatch?.unitType);
                        }}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Authorize Dispatch</span>
                      </button>
                    )}

                    {item.status === 'DISPATCHED' && (
                      <button
                        className="btn-action-success"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkRescued(item.id);
                        }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Rescued</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
