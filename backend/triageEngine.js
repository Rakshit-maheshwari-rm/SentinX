/**
 * SentinX In-House Algorithmic Triage Engine
 * Zero external AI API required.
 * Deterministic, ultra-fast, offline-capable natural language heuristic analyzer
 * for emergency distress prioritization.
 */

const P1_CRITICAL_KEYWORDS = [
  'trapped', 'drowning', 'sink', 'sinking', 'rising water', 'submerged', 'water level',
  'roof', 'rooftop', 'collapse', 'collapsed', 'rubble', 'debris', 'buried',
  'bleeding', 'unconscious', 'cardiac', 'heart attack', 'cannot breathe', 'choking',
  'oxygen', 'dialysis', 'infant', 'baby', 'pregnant', 'fire', 'smoke', 'explosion',
  'electric shock', 'hypothermia', 'severe injury', 'crushed', 'stroke', 'dying'
];

const P2_URGENT_KEYWORDS = [
  'injured', 'injury', 'fracture', 'broken', 'cut', 'wound', 'burn', 'fever',
  'insulin', 'diabetic', 'asthma', 'inhaler', 'wheelchair', 'elderly', 'disabled',
  'stranded', 'isolated', 'cut off', 'cannot walk', 'hypothermia', 'cold', 'infection'
];

const P3_MODERATE_KEYWORDS = [
  'food', 'water', 'thirsty', 'hungry', 'blanket', 'clothes', 'flashlight', 'batteries',
  'power', 'charging', 'shelter', 'dry clothes', 'baby food', 'formula', 'sanitation',
  'road blocked', 'leaking roof'
];

/**
 * Analyzes an incoming distress message and outputs structured triage data
 * @param {string} message - Raw citizen distress message
 * @param {object} context - Additional metadata { category, survivorCount, waterLevel, contact }
 * @returns {object} Triage result with priority, threatIndex, tags, and recommendedDispatch
 */
function analyzeDistressSignal(message = '', context = {}) {
  const cleanMsg = (message || '').toLowerCase();
  const survivorCount = Math.max(1, parseInt(context.survivorCount, 10) || 1);
  const category = context.category || 'GENERAL';

  let p1Matches = [];
  let p2Matches = [];
  let p3Matches = [];

  P1_CRITICAL_KEYWORDS.forEach(kw => {
    if (cleanMsg.includes(kw)) p1Matches.push(kw);
  });

  P2_URGENT_KEYWORDS.forEach(kw => {
    if (cleanMsg.includes(kw)) p2Matches.push(kw);
  });

  P3_MODERATE_KEYWORDS.forEach(kw => {
    if (cleanMsg.includes(kw)) p3Matches.push(kw);
  });

  let threatScore = 20;
  threatScore += p1Matches.length * 25;
  threatScore += p2Matches.length * 12;
  threatScore += p3Matches.length * 5;

  if (category === 'FLOOD') threatScore += 15;
  if (category === 'COLLAPSE') threatScore += 25;
  if (category === 'MEDICAL') threatScore += 20;

  if (survivorCount > 5) threatScore += 15;
  else if (survivorCount > 2) threatScore += 8;

  const hasWaterDanger = p1Matches.some(k => ['drowning', 'rising water', 'submerged', 'roof', 'rooftop'].includes(k)) || category === 'FLOOD';
  const hasTrapped = p1Matches.some(k => ['trapped', 'collapse', 'collapsed', 'rubble', 'buried'].includes(k)) || category === 'COLLAPSE';
  const hasMedicalUrgency = p1Matches.some(k => ['bleeding', 'unconscious', 'oxygen', 'dialysis', 'cardiac', 'infant', 'pregnant'].includes(k)) || category === 'MEDICAL';

  const threatIndex = Math.min(99, Math.max(15, threatScore));

  let priority = 'P3';
  let priorityLabel = 'P3 - MODERATE';
  let priorityColor = '#3b82f6';
  let etaMinutes = 45;

  if (threatIndex >= 65 || p1Matches.length > 0 || hasTrapped || (hasWaterDanger && cleanMsg.includes('roof'))) {
    priority = 'P1';
    priorityLabel = 'P1 - CRITICAL';
    priorityColor = '#ef4444';
    etaMinutes = 12;
  } else if (threatIndex >= 40 || p2Matches.length > 0 || hasMedicalUrgency) {
    priority = 'P2';
    priorityLabel = 'P2 - URGENT';
    priorityColor = '#f59e0b';
    etaMinutes = 25;
  }

  let recommendedDispatch = {
    unitType: 'Standard Mobile Relief Crew',
    equipment: ['First-Aid Basic Kit', 'Emergency Rations', 'Water Purification Pack'],
    urgencyLevel: 'Standard Protocol'
  };

  if (hasWaterDanger && priority === 'P1') {
    recommendedDispatch = {
      unitType: 'Swift-Water Tactical Rescue Unit (Boat Team 4)',
      equipment: ['Zodiac Inflatable Boat', 'Life Vests x ' + survivorCount, 'Thermal Hypothermia Wraps', 'Throw Bags'],
      urgencyLevel: 'IMMEDIATE AIR/WATER EXTRACTION'
    };
  } else if (hasTrapped) {
    recommendedDispatch = {
      unitType: 'Heavy Urban Search & Rescue (USAR Squad 2)',
      equipment: ['Hydraulic Spreader/Cutter', 'Acoustic Search Sensors', 'K9 Rescue Dog', 'Spinal Immobilization Boards'],
      urgencyLevel: 'IMMEDIATE STRUCTURAL EXTRICATION'
    };
  } else if (hasMedicalUrgency) {
    recommendedDispatch = {
      unitType: 'Advanced Life Support (ALS Paramedic Alpha)',
      equipment: ['Defibrillator / AED', 'Portable Oxygen Unit', 'Trauma Hemostatic Gauze', 'Pediatric/Elderly Med-Kit'],
      urgencyLevel: 'RAPID MEDICAL EVACUATION'
    };
  } else if (category === 'SUPPLIES' || priority === 'P3') {
    recommendedDispatch = {
      unitType: 'Logistics Supply Convoy (Relief Bravo)',
      equipment: ['Food Rations (72-hr)', 'Clean Bottled Water', 'Dry Blankets', 'Solar Power Bank'],
      urgencyLevel: 'SCHEDULED LOGISTICS DROP'
    };
  }

  const summaryBrief = generateSummaryBriefing(priority, survivorCount, category, p1Matches, p2Matches, p3Matches);

  return {
    priority,
    priorityLabel,
    priorityColor,
    threatIndex,
    etaMinutes,
    survivorCount,
    detectedKeywords: [...new Set([...p1Matches, ...p2Matches, ...p3Matches])],
    recommendedDispatch,
    summaryBrief,
    analyzedAt: new Date().toISOString()
  };
}

function generateSummaryBriefing(priority, survivors, category, p1, p2, p3) {
  let brief = `[${priority}] Incident involving approx. ${survivors} civilian(s). `;
  if (p1.length > 0) {
    brief += `Life safety alarms flagged: ${p1.slice(0, 3).join(', ')}. Immediate asset mobilization advised.`;
  } else if (p2.length > 0) {
    brief += `Medical/vulnerability indicators: ${p2.slice(0, 3).join(', ')}. Requires field triage.`;
  } else {
    brief += `Primary requirement is relief distribution & shelter relocation.`;
  }
  return brief;
}

module.exports = {
  analyzeDistressSignal,
  P1_CRITICAL_KEYWORDS,
  P2_URGENT_KEYWORDS,
  P3_MODERATE_KEYWORDS
};