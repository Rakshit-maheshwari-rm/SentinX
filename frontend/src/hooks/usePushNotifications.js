import React, { useEffect, useRef } from 'react';

export default function usePushNotifications(incidents) {
  const prevP1IdsRef = useRef(new Set());
  const permissionRef = useRef(typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default');

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission().then(p => {
        permissionRef.current = p;
      }).catch(() => {});
    } else {
      permissionRef.current = Notification.permission;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (!incidents || incidents.length === 0) return;

    const currentP1 = incidents.filter(i => i.triage?.priority === 'P1' && i.status !== 'RESCUED');
    const currentIds = new Set(currentP1.map(i => i.id));

    currentP1.forEach(incident => {
      if (!prevP1IdsRef.current.has(incident.id)) {
        try {
          const n = new Notification('⚠️ SentinX — P1 CRITICAL ALERT', {
            body: `${incident.id} | ${incident.locationName || 'Emergency Location'}\nMagnitude: ${incident.magnitude || 'High'} | Immediate response dispatched`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: incident.id,
            requireInteraction: true
          });
          n.onclick = () => window.focus();
        } catch {
          
        }
      }
    });

    prevP1IdsRef.current = currentIds;
  }, [incidents]);
}
