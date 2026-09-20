import React from 'react';
import { motion } from 'framer-motion';
import { Truck, ShieldCheck, Anchor, Activity, Radio, Droplets, Zap, ShieldAlert } from 'lucide-react';

export default function LogisticsHub({ resources, onToggleDeploy }) {
  const getResourceIcon = (type) => {
    switch (type) {
      case 'BOAT': return <Anchor className="w-4 h-4 text-cyan" />;
      case 'RESCUE_SQUAD': return <ShieldAlert className="w-4 h-4 text-amber" />;
      case 'MEDICAL': return <Activity className="w-4 h-4 text-red" />;
      case 'DRONE': return <Radio className="w-4 h-4 text-blue" />;
      default: return <Truck className="w-4 h-4 text-green" />;
    }
  };

  return (
    <div className="logistics-grid">
      
      <div className="tactical-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Truck className="w-4 h-4 text-cyan" />
            <span>Emergency Fleet & Asset Readiness ({resources.length} Units)</span>
          </div>
        </div>

        <div className="fleet-table-container">
          <table className="fleet-table">
            <thead>
              <tr>
                <th>Unit Identifier</th>
                <th>Type</th>
                <th>Station / Zone</th>
                <th>Payload Capacity</th>
                <th>Operational Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((res) => {
                const isAvailable = res.status === 'AVAILABLE';
                return (
                  <motion.tr
                    key={res.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <td>
                      <div className="flex-center-gap">
                        {getResourceIcon(res.type)}
                        <strong>{res.name}</strong>
                      </div>
                    </td>
                    <td><span className="font-mono text-xs text-secondary">{res.type}</span></td>
                    <td>{res.location}</td>
                    <td>{res.capacity}</td>
                    <td>
                      {isAvailable ? (
                        <span className="status-badge rescued">AVAILABLE</span>
                      ) : (
                        <span className="status-badge dispatched">DEPLOYED</span>
                      )}
                    </td>
                    <td>
                      <button
                        className={isAvailable ? "btn-action-primary" : "btn-action-success"}
                        onClick={() => onToggleDeploy(res.id)}
                      >
                        {isAvailable ? "Simulate Deploy" : "Recall to Base"}
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="tactical-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Droplets className="w-4 h-4 text-blue" />
            <span>Relief Inventory Levels</span>
          </div>
        </div>

        <div className="supply-bar-group">
          <div className="supply-bar-item">
            <div className="supply-bar-header">
              <span>Potable Water Reserves</span>
              <span className="font-mono text-cyan">42% (Critical Demand)</span>
            </div>
            <div className="supply-bar-track">
              <div className="supply-bar-fill water"></div>
            </div>
          </div>

          <div className="supply-bar-item">
            <div className="supply-bar-header">
              <span>72-Hour Meal Rations</span>
              <span className="font-mono text-amber">68% (Adequate)</span>
            </div>
            <div className="supply-bar-track">
              <div className="supply-bar-fill rations"></div>
            </div>
          </div>

          <div className="supply-bar-item">
            <div className="supply-bar-header">
              <span>Trauma Hemostatic Kits</span>
              <span className="font-mono text-red">28% (Restock Requested)</span>
            </div>
            <div className="supply-bar-track">
              <div className="supply-bar-fill medical"></div>
            </div>
          </div>

          <div className="supply-bar-item">
            <div className="supply-bar-header">
              <span>Emergency Power & Sat-Relay</span>
              <span className="font-mono text-emerald">85% (High Readiness)</span>
            </div>
            <div className="supply-bar-track">
              <div className="supply-bar-fill power"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
