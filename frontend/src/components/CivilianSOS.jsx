import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertOctagon, Waves, Building2, HeartPulse, Package, Send, CheckCircle,
  ShieldAlert, Users, Phone, MapPin, Navigation, Mic, MicOff, Volume2, VolumeX, Home
} from 'lucide-react';
import confetti from 'canvas-confetti';

const REGIONAL_SHELTERS = [
  { id: 'SH-01', name: 'Civic Evacuation Complex', lat: 37.779, lng: -122.418, capacity: 'Open (450 Spots)' },
  { id: 'SH-02', name: 'Harbor Marine Red Cross Haven', lat: 37.795, lng: -122.398, capacity: 'High Demand (80 Spots)' },
  { id: 'SH-03', name: 'Northside Gymnasium & Relief Center', lat: 37.765, lng: -122.440, capacity: 'Open (620 Spots)' },
  { id: 'SH-04', name: 'Highland Park Emergency Sanctuary', lat: 37.755, lng: -122.425, capacity: 'Near Capacity (25 Spots)' }
];

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:5000/api'
    : '/api';

export default function CivilianSOS({ onSOSSubmitted }) {
  const [category, setCategory] = useState('FLOOD');
  const [victimName, setVictimName] = useState('');
  const [contact, setContact] = useState('');
  const [locationName, setLocationName] = useState('');
  const [survivorCount, setSurvivorCount] = useState(1);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedIncident, setSubmittedIncident] = useState(null);
  const [gpsCoordinates, setGpsCoordinates] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('');

  const [isListening, setIsListening] = useState(false);

  const [sirenActive, setSirenActive] = useState(false);
  const audioCtxRef = useRef(null);

  const detectLiveLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation not supported by device');
      return;
    }
    setGpsStatus('Acquiring satellite lock...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsCoordinates({ lat: latitude, lng: longitude });
        setLocationName(`Live Device GPS: ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`);
        setGpsStatus(`GPS Locked (±${Math.round(accuracy)}m)`);
      },
      (err) => {
        setGpsStatus(`GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    detectLiveLocation();
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => { });
      }
    };
  }, []);

  const toggleVoiceSOS = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not available on this browser. Please type your situation report.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      setIsListening(true);

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setMessage(transcript);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Voice SOS Error:', err);
      setIsListening(false);
    }
  };

  const toggleSiren = () => {
    if (sirenActive) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => { });
        audioCtxRef.current = null;
      }
      setSirenActive(false);
      return;
    }

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      setSirenActive(true);

      const dot = 0.12;
      const dash = 0.36;
      const toneFreq = 850;

      const playBeep = (startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(toneFreq, startTime);
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      let t = ctx.currentTime + 0.1;
      
      for (let loop = 0; loop < 10; loop++) {
        
        for (let i = 0; i < 3; i++) { playBeep(t, dot); t += dot + 0.1; }
        t += 0.2;
        
        for (let i = 0; i < 3; i++) { playBeep(t, dash); t += dash + 0.1; }
        t += 0.2;
        
        for (let i = 0; i < 3; i++) { playBeep(t, dot); t += dot + 0.1; }
        t += 1.2;
      }
    } catch (e) {
      console.error('Audio siren error:', e);
      setSirenActive(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim() && !category) return;

    setIsSubmitting(true);
    try {
      const payload = {
        victimName: victimName || 'Endangered Civilian',
        contact: contact || 'Device GPS Beacon',
        category,
        locationName: locationName || (gpsCoordinates ? `Live GPS: ${gpsCoordinates.lat.toFixed(4)}°, ${gpsCoordinates.lng.toFixed(4)}°` : 'Reported Coordinates'),
        lat: gpsCoordinates?.lat,
        lng: gpsCoordinates?.lng,
        survivorCount,
        message: message || 'Emergency SOS distress beacon triggered.'
      };

      const res = await fetch(`${API_BASE}/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setSubmittedIncident(data.incident);
        onSOSSubmitted(data.incident);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    } catch (err) {
      console.error('Failed to submit SOS:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="civilian-container">
      
      <div className="sos-hero-card">
        <h1 className="sos-hero-title">Emergency Civilian Distress Beacon</h1>
        <p className="sos-hero-desc">
          Tap the emergency beacon to transmit distress coordinates directly to tactical rescue dispatch.
        </p>

        <div className="sos-button-wrapper">
          <div className="sos-shockwave-ring ring-1"></div>
          <div className="sos-shockwave-ring ring-2"></div>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className="sos-main-btn"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <AlertOctagon className="w-10 h-10" />
            <span className="sos-btn-text">{isSubmitting ? 'SENDING' : 'SOS'}</span>
            <span className="sos-btn-sub">1-TAP BEACON</span>
          </motion.button>
        </div>

        <div className="emergency-audio-bar">
          <button
            type="button"
            className={`voice-record-btn ${isListening ? 'recording' : ''}`}
            onClick={toggleVoiceSOS}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isListening ? 'Listening (Speak Situation)...' : '🎙️ Hands-Free Voice SOS'}</span>
          </button>

          <button
            type="button"
            className={`siren-toggle-btn ${sirenActive ? 'active' : ''}`}
            onClick={toggleSiren}
          >
            {sirenActive ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{sirenActive ? 'Silence Siren' : '🔊 Sound Morse SOS Siren'}</span>
          </button>

          <button
            type="button"
            className="gps-btn"
            onClick={detectLiveLocation}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{gpsCoordinates ? `GPS: ${gpsCoordinates.lat.toFixed(4)}°, ${gpsCoordinates.lng.toFixed(4)}°` : 'Acquiring Real Device GPS...'}</span>
          </button>
        </div>
      </div>

      <div className="sos-form-panel">
        <div className="form-section-title">
          <ShieldAlert className="w-5 h-5 text-red" />
          <span>Distress Telemetry & Situation Details</span>
        </div>

        <div className="category-grid">
          <button
            type="button"
            className={`category-chip ${category === 'FLOOD' ? 'active' : ''}`}
            onClick={() => setCategory('FLOOD')}
          >
            <Waves className="w-5 h-5 text-blue" />
            <span>Flood / Water</span>
          </button>

          <button
            type="button"
            className={`category-chip ${category === 'COLLAPSE' ? 'active' : ''}`}
            onClick={() => setCategory('COLLAPSE')}
          >
            <Building2 className="w-5 h-5 text-amber" />
            <span>Structural Collapse</span>
          </button>

          <button
            type="button"
            className={`category-chip ${category === 'MEDICAL' ? 'active' : ''}`}
            onClick={() => setCategory('MEDICAL')}
          >
            <HeartPulse className="w-5 h-5 text-red" />
            <span>Medical Emergency</span>
          </button>

          <button
            type="button"
            className={`category-chip ${category === 'SUPPLIES' ? 'active' : ''}`}
            onClick={() => setCategory('SUPPLIES')}
          >
            <Package className="w-5 h-5 text-cyan" />
            <span>Stranded / Supplies</span>
          </button>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Victim / Contact Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. John Miller"
              value={victimName}
              onChange={(e) => setVictimName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone / Radio Call-Sign</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. +1 (555) 234-5678"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <div className="flex-between">
              <label className="form-label">Location / Landmark / Sector</label>
              <button
                type="button"
                className="gps-btn"
                onClick={detectLiveLocation}
              >
                <Navigation className="w-3 h-3" />
                <span>📍 Lock My Live GPS</span>
              </button>
            </div>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 420 North Harbor Pier, Sector 4"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
            />
            {gpsStatus && (
              <div className="gps-status-box">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{gpsStatus}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Number of Civilians Trapped</label>
            <input
              type="number"
              min="1"
              max="50"
              className="form-input"
              value={survivorCount}
              onChange={(e) => setSurvivorCount(parseInt(e.target.value, 10) || 1)}
            />
          </div>
        </div>

        <div className="form-group">
          <div className="flex-between">
            <label className="form-label">Current Situation & Critical Hazards</label>
            <button
              type="button"
              className={`voice-record-btn ${isListening ? 'recording' : ''}`}
              onClick={toggleVoiceSOS}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{isListening ? 'Recording Live Speech...' : 'Speak via Microphone'}</span>
            </button>
          </div>
          <textarea
            className="form-textarea"
            placeholder="Type or click 'Speak via Microphone' to report trapped civilians, water levels, or critical medical needs..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="btn-action-primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? 'Transmitting to Radar...' : 'Submit Emergency Report'}</span>
        </button>
      </div>

      <div className="sos-form-panel">
        <div className="form-section-title">
          <Home className="w-5 h-5 text-cyan" />
          <span>Nearest Safe Evacuation Shelters (Real Haversine Distance)</span>
        </div>

        <div className="shelter-list">
          {REGIONAL_SHELTERS.map((sh) => {
            const distance = gpsCoordinates
              ? calculateDistanceKm(gpsCoordinates.lat, gpsCoordinates.lng, sh.lat, sh.lng)
              : null;

            return (
              <div key={sh.id} className="shelter-card">
                <div>
                  <div className="shelter-name">{sh.name}</div>
                  <div className="shelter-meta">
                    <span>Coordinates: {sh.lat}°, {sh.lng}°</span>
                    <span>•</span>
                    <span>Capacity: {sh.capacity}</span>
                  </div>
                </div>

                <div className="shelter-distance-pill">
                  {distance ? `${distance} km away` : 'GPS Distance Lock Required'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {submittedIncident && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="sos-success-card"
          >
            <div className="sos-success-header">
              <div className="sos-success-title">
                <CheckCircle className="w-6 h-6 text-emerald" />
                <span>Distress Signal Successfully Broadcasted</span>
              </div>
              <span className="priority-badge p1">
                {submittedIncident.triage?.priorityLabel || 'P1 - CRITICAL'}
              </span>
            </div>

            <p className="text-sm text-secondary">
              Incident <strong>#{submittedIncident.id}</strong> has been prioritized by the in-house Algorithmic Triage Engine with an urgency threat index of <strong>{submittedIncident.triage?.threatIndex}/100</strong>.
            </p>

            <div className="dispatch-recommendation-box">
              <div className="dispatch-rec-title">
                <span>Dispatched Unit Payload</span>
              </div>
              <div className="dispatch-rec-unit">
                {submittedIncident.triage?.recommendedDispatch?.unitType || 'Swift-Water Rescue Alpha'}
              </div>
              <div className="text-xs text-secondary mt-1">
                Estimated Field Intercept: <strong>{submittedIncident.triage?.etaMinutes || 12} Minutes</strong>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
