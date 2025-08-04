// Adaptive WebSocket Frequency System - Performance Optimization Module
// Handles dynamic frequency adjustment based on activity levels

const logger = require('./logger');
const { LOG_LEVELS } = logger;

// Adaptive WebSocket Frequency Configuration
const WEBSOCKET_FREQUENCY_CONFIG = {
  ENABLED: true,                    // Enable/disable adaptive frequency
  ACTIVE_INTERVAL: 50,              // ms during active use (high frequency)
  IDLE_INTERVAL: 500,               // ms during idle (low frequency)
  TRANSITION_TIME: 2000,            // ms to transition between states
  ACTIVITY_THRESHOLD: 3,            // interactions to trigger active state
  LED_CHANGE_THRESHOLD: 5,          // LED changes to trigger active state
  BURST_INTERVAL: 25,               // ms during burst mode (very high frequency)
  BURST_DURATION: 1000,             // ms to stay in burst mode
  MIN_INTERVAL: 25,                 // minimum interval (ms)
  MAX_INTERVAL: 1000,               // maximum interval (ms)
};

// WebSocket frequency state
let websocketFrequencyState = {
  currentInterval: WEBSOCKET_FREQUENCY_CONFIG.IDLE_INTERVAL,
  targetInterval: WEBSOCKET_FREQUENCY_CONFIG.IDLE_INTERVAL,
  isActive: false,
  isBurst: false,
  lastActivityTime: 0,
  activityCount: 0,
  ledChangeCount: 0,
  burstStartTime: 0,
  intervalTimer: null,
  transitionTimer: null,
};

// WebSocket Frequency Statistics and Monitoring
let websocketFrequencyStats = {
  totalRequests: 0,
  activeRequests: 0,
  idleRequests: 0,
  burstRequests: 0,
  lastStatsTime: Date.now(),
  averageInterval: 0,
};

// Adaptive WebSocket Frequency Functions
function recordActivity(activityType, clientConfig) {
  if (!WEBSOCKET_FREQUENCY_CONFIG.ENABLED || !clientConfig.enableAdaptiveFrequency) {
    return;
  }

  const now = Date.now();
  websocketFrequencyState.lastActivityTime = now;
  websocketFrequencyState.activityCount++;

  // Check if we should enter burst mode
  if (activityType === 'user' && websocketFrequencyState.activityCount >= WEBSOCKET_FREQUENCY_CONFIG.ACTIVITY_THRESHOLD) {
    enterBurstMode();
  }

  // Check if we should enter active mode
  if (websocketFrequencyState.activityCount >= WEBSOCKET_FREQUENCY_CONFIG.ACTIVITY_THRESHOLD || 
      websocketFrequencyState.ledChangeCount >= WEBSOCKET_FREQUENCY_CONFIG.LED_CHANGE_THRESHOLD) {
    enterActiveMode();
  }

  // Reset activity count after a period of inactivity
  setTimeout(() => {
    websocketFrequencyState.activityCount = Math.max(0, websocketFrequencyState.activityCount - 1);
  }, WEBSOCKET_FREQUENCY_CONFIG.TRANSITION_TIME);
}

function recordLedChange(clientConfig) {
  if (!WEBSOCKET_FREQUENCY_CONFIG.ENABLED || !clientConfig.enableAdaptiveFrequency) {
    return;
  }

  websocketFrequencyState.ledChangeCount++;
  
  // Check if we should enter active mode based on LED changes
  if (websocketFrequencyState.ledChangeCount >= WEBSOCKET_FREQUENCY_CONFIG.LED_CHANGE_THRESHOLD) {
    enterActiveMode();
  }

  // Reset LED change count after a period
  setTimeout(() => {
    websocketFrequencyState.ledChangeCount = Math.max(0, websocketFrequencyState.ledChangeCount - 1);
  }, WEBSOCKET_FREQUENCY_CONFIG.TRANSITION_TIME);
}

function enterBurstMode() {
  if (websocketFrequencyState.isBurst) return;
  
  websocketFrequencyState.isBurst = true;
  websocketFrequencyState.burstStartTime = Date.now();
  websocketFrequencyState.targetInterval = WEBSOCKET_FREQUENCY_CONFIG.BURST_INTERVAL;
  
  // Schedule exit from burst mode
  setTimeout(() => {
    exitBurstMode();
  }, WEBSOCKET_FREQUENCY_CONFIG.BURST_DURATION);
  
  updateInterval();
}

function exitBurstMode() {
  if (!websocketFrequencyState.isBurst) return;
  
  websocketFrequencyState.isBurst = false;
  
  // Transition to active mode if still active, otherwise idle
  if (websocketFrequencyState.isActive) {
    enterActiveMode();
  } else {
    enterIdleMode();
  }
}

function enterActiveMode() {
  if (websocketFrequencyState.isActive && !websocketFrequencyState.isBurst) return;
  
  websocketFrequencyState.isActive = true;
  websocketFrequencyState.targetInterval = WEBSOCKET_FREQUENCY_CONFIG.ACTIVE_INTERVAL;
  
  updateInterval();
}

function enterIdleMode() {
  if (!websocketFrequencyState.isActive && !websocketFrequencyState.isBurst) return;
  
  websocketFrequencyState.isActive = false;
  websocketFrequencyState.targetInterval = WEBSOCKET_FREQUENCY_CONFIG.IDLE_INTERVAL;
  
  updateInterval();
}

function updateInterval() {
  if (websocketFrequencyState.currentInterval === websocketFrequencyState.targetInterval) {
    return;
  }

  // Clear existing timers
  if (websocketFrequencyState.intervalTimer) {
    clearTimeout(websocketFrequencyState.intervalTimer);
  }
  if (websocketFrequencyState.transitionTimer) {
    clearTimeout(websocketFrequencyState.transitionTimer);
  }

  // Immediate change for burst mode, gradual transition for others
  if (websocketFrequencyState.isBurst) {
    websocketFrequencyState.currentInterval = websocketFrequencyState.targetInterval;
  } else {
    // Gradual transition
    const current = websocketFrequencyState.currentInterval;
    const target = websocketFrequencyState.targetInterval;
    const step = (target - current) / 4; // 4-step transition
    
    websocketFrequencyState.currentInterval = Math.max(
      WEBSOCKET_FREQUENCY_CONFIG.MIN_INTERVAL,
      Math.min(WEBSOCKET_FREQUENCY_CONFIG.MAX_INTERVAL, current + step)
    );
    
    // Continue transition if not complete
    if (Math.abs(websocketFrequencyState.currentInterval - target) > 5) {
      websocketFrequencyState.transitionTimer = setTimeout(() => {
        updateInterval();
      }, WEBSOCKET_FREQUENCY_CONFIG.TRANSITION_TIME / 4);
    }
  }
}

function startInterval(intervalFunction) {
  if (websocketFrequencyState.intervalTimer) {
    clearTimeout(websocketFrequencyState.intervalTimer);
  }
  
  // Create a function that calls the interval and schedules the next one
  const runInterval = () => {
    try {
      intervalFunction();
    } catch (error) {
      // Silently handle errors to prevent interval interruption
    }
    // Schedule the next interval
    websocketFrequencyState.intervalTimer = setTimeout(runInterval, websocketFrequencyState.currentInterval);
  };
  
  // Start the first interval
  websocketFrequencyState.intervalTimer = setTimeout(runInterval, websocketFrequencyState.currentInterval);
}

function getWebsocketFrequencyStats() {
  return {
    ...websocketFrequencyStats,
    currentInterval: websocketFrequencyState.currentInterval,
    targetInterval: websocketFrequencyState.targetInterval,
    isActive: websocketFrequencyState.isActive,
    isBurst: websocketFrequencyState.isBurst,
    activityCount: websocketFrequencyState.activityCount,
    ledChangeCount: websocketFrequencyState.ledChangeCount,
    frequencyConfig: WEBSOCKET_FREQUENCY_CONFIG,
  };
}

function logWebsocketFrequencyStats() {
  const stats = getWebsocketFrequencyStats();
  const avgInterval = stats.totalRequests > 0 ? stats.averageInterval : 0;
  logger.logInfo(`🌍 WebSocket Frequency Stats: ${stats.totalRequests} requests, avg interval: ${avgInterval.toFixed(0)}ms, current: ${stats.currentInterval}ms`);
}

function updateStats(requestType) {
  websocketFrequencyStats.totalRequests++;
  if (websocketFrequencyState.isBurst) {
    websocketFrequencyStats.burstRequests++;
  } else if (websocketFrequencyState.isActive) {
    websocketFrequencyStats.activeRequests++;
  } else {
    websocketFrequencyStats.idleRequests++;
  }
  
  // Calculate average interval
  const now = Date.now();
  const timeDiff = now - websocketFrequencyStats.lastStatsTime;
  if (timeDiff > 0) {
    websocketFrequencyStats.averageInterval = (websocketFrequencyStats.averageInterval * (websocketFrequencyStats.totalRequests - 1) + websocketFrequencyState.currentInterval) / websocketFrequencyStats.totalRequests;
  }
}

// Export functions and configuration
module.exports = {
  WEBSOCKET_FREQUENCY_CONFIG,
  websocketFrequencyState,
  websocketFrequencyStats,
  recordActivity,
  recordLedChange,
  enterBurstMode,
  exitBurstMode,
  enterActiveMode,
  enterIdleMode,
  updateInterval,
  startInterval,
  getWebsocketFrequencyStats,
  logWebsocketFrequencyStats,
  updateStats,
}; 