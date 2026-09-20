

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL
  || ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:5000'
    : '/');

let _socket = null;

function getSocket() {
  if (!_socket) {
    _socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 2000,
      timeout: 10000,
      autoConnect: true
    });

    _socket.on('connect', () => {
      console.log('[SentinX Socket.io] Connected — real-time push active');
    });

    _socket.on('disconnect', (reason) => {
      console.log('[SentinX Socket.io] Disconnected:', reason, '— auto-reconnecting');
    });

    _socket.on('connect_error', (err) => {
      
      console.debug('[SentinX Socket.io] Notice:', err.message);
    });
  }
  return _socket;
}

export default function useSocket({ onNewIncident, onUpdatedIncident, onStatsUpdate, onInitialData }) {
  const handlersRef = useRef({ onNewIncident, onUpdatedIncident, onStatsUpdate, onInitialData });
  const [connected, setConnected] = useState(() => Boolean(_socket?.connected));

  useEffect(() => {
    handlersRef.current = { onNewIncident, onUpdatedIncident, onStatsUpdate, onInitialData };
  });

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setConnected(true);
      socket.emit('request:initial');
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    if (socket.connected) {
      setConnected(true);
      socket.emit('request:initial');
    }

    const onInit = (data) => handlersRef.current.onInitialData?.(data);
    const onNew  = (inc)  => handlersRef.current.onNewIncident?.(inc);
    const onUpd  = (inc)  => handlersRef.current.onUpdatedIncident?.(inc);
    const onStat = (s)    => handlersRef.current.onStatsUpdate?.(s);

    socket.on('initial:data', onInit);
    socket.on('incident:new', onNew);
    socket.on('incident:updated', onUpd);
    socket.on('stats:update', onStat);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('initial:data', onInit);
      socket.off('incident:new', onNew);
      socket.off('incident:updated', onUpd);
      socket.off('stats:update', onStat);
      
    };
  }, []);

  return { connected };
}
