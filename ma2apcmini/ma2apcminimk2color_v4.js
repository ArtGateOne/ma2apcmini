//ma2apcmini mk2 v 1.7.8 color v4 - by ArtGateOne (edits by Local-9) - OPTIMIZED
const easymidi = require("easymidi");
const W3CWebSocket = require("websocket").w3cwebsocket;
const WS_URL = "ws://localhost:80/"; //U can change localhost(127.0.0.1) to Your console IP address

// Logging system with levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

let currentLogLevel = LOG_LEVELS.INFO;

function log(level, message, ...args) {
  const levelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
  const levelEmojis = ['🚨', '⚠️', 'ℹ️', '🔍'];
  if (level <= currentLogLevel) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${levelEmojis[level]} ${levelNames[level]}] ${message}`, ...args);
  }
}

let client = new W3CWebSocket(WS_URL);

// Connection management functions
function initializeConnection() {
  log(LOG_LEVELS.INFO, "🔌 Initializing connection to GrandMA2...");
  
  client.onopen = function() {
    log(LOG_LEVELS.INFO, "✅ WebSocket connection established");
    // Don't set isConnected to true yet - wait for successful login
    connectionState.isReconnecting = false;
    connectionState.reconnectAttempts = 0;
    connectionState.reconnectDelay = 1000;
  };

  client.onclose = function(event) {
    log(LOG_LEVELS.WARN, "🔌 WebSocket connection closed", { code: event.code, reason: event.reason });
    connectionState.isConnected = false;
    
    if (!connectionState.isReconnecting && connectionState.reconnectAttempts < connectionState.maxReconnectAttempts) {
      scheduleReconnection();
    } else if (connectionState.reconnectAttempts >= connectionState.maxReconnectAttempts) {
      log(LOG_LEVELS.ERROR, "🛑 Max reconnection attempts reached. Manual intervention required.");
    }
  };

  client.onerror = function(error) {
    log(LOG_LEVELS.ERROR, "💥 WebSocket error occurred", error);
    connectionState.isConnected = false;
  };
}

function scheduleReconnection() {
  if (connectionState.isReconnecting) return;
  
  connectionState.isReconnecting = true;
  connectionState.reconnectAttempts++;
  const delay = Math.min(connectionState.reconnectDelay * Math.pow(2, connectionState.reconnectAttempts - 1), connectionState.maxReconnectDelay);
  
  log(LOG_LEVELS.WARN, `🔄 Scheduling reconnection attempt ${connectionState.reconnectAttempts}/${connectionState.maxReconnectAttempts} in ${delay}ms`);
  
  setTimeout(() => {
    if (!connectionState.isConnected) {
      log(LOG_LEVELS.INFO, "🔄 Attempting to reconnect...");
      client = new W3CWebSocket(WS_URL);
      initializeConnection();
      // Reset connection state for new connection
      connectionState.isConnected = false;
    }
  }, delay);
}

function validateResponse(response) {
  try {
    const data = JSON.parse(response);
    if (!data || typeof data !== 'object') {
      log(LOG_LEVELS.WARN, "⚠️ Invalid response format", response);
      return false;
    }
    return true;
  } catch (error) {
    log(LOG_LEVELS.ERROR, "💥 Failed to parse response", error);
    return false;
  }
}

// LED Batching Functions - Performance Optimization
function addLedUpdate(note, velocity, channel) {
  if (!LED_BATCH_CONFIG.ENABLED || !clientConfig.enableLedBatching) {
    // Direct send if batching is disabled
    if (typeof output !== 'undefined') {
      output.send("noteon", { note, velocity, channel });
    }
    return;
  }

  // Add to pending updates (overwrites previous update for same note)
  ledBatchState.pendingUpdates.set(note, { velocity, channel });
  ledBatchState.updateCount++;

  // Force immediate send if we have many updates or if timer is not set
  if (ledBatchState.updateCount >= LED_BATCH_CONFIG.PRIORITY_THRESHOLD || 
      ledBatchState.updateCount >= LED_BATCH_CONFIG.MAX_BATCH_SIZE) {
    sendLedBatch();
    return;
  }

  // Set timer for delayed batch send if not already set
  if (!ledBatchState.batchTimer) {
    ledBatchState.batchTimer = setTimeout(() => {
      sendLedBatch();
    }, LED_BATCH_CONFIG.BATCH_DELAY);
  }
}

function sendLedBatch() {
  if (!ledBatchState.pendingUpdates.size || typeof output === 'undefined') {
    return;
  }

  const startTime = Date.now();
  let sentCount = 0;

  // Send all pending updates
  for (const [note, { velocity, channel }] of ledBatchState.pendingUpdates) {
    output.send("noteon", { note, velocity, channel });
    sentCount++;
  }

  // Clear batch state
  ledBatchState.pendingUpdates.clear();
  ledBatchState.updateCount = 0;
  ledBatchState.batchTimer = null;
  ledBatchState.lastBatchTime = startTime;

  // Update statistics
  ledBatchStats.totalUpdates += sentCount;
  ledBatchStats.totalBatches++;
  ledBatchStats.totalBatchTime += Date.now() - startTime;

  // Log performance metrics (only in DEBUG mode)
  if (currentLogLevel >= LOG_LEVELS.DEBUG) {
    const batchTime = Date.now() - startTime;
    log(LOG_LEVELS.DEBUG, `⚡ LED batch sent: ${sentCount} updates in ${batchTime}ms`);
  }
}

function flushLedBatch() {
  if (ledBatchState.batchTimer) {
    clearTimeout(ledBatchState.batchTimer);
    ledBatchState.batchTimer = null;
  }
  sendLedBatch();
}

// LED Batching Statistics and Monitoring
let ledBatchStats = {
  totalUpdates: 0,
  totalBatches: 0,
  totalBatchTime: 0,
  averageBatchSize: 0,
  lastStatsTime: Date.now(),
};

function getLedBatchStats() {
  const now = Date.now();
  const timeDiff = now - ledBatchStats.lastStatsTime;
  
  if (timeDiff > 0) {
    ledBatchStats.averageBatchSize = ledBatchStats.totalBatches > 0 
      ? ledBatchStats.totalUpdates / ledBatchStats.totalBatches 
      : 0;
  }
  
  return {
    ...ledBatchStats,
    pendingUpdates: ledBatchState.pendingUpdates.size,
    isBatchingEnabled: LED_BATCH_CONFIG.ENABLED,
    batchConfig: LED_BATCH_CONFIG,
  };
}

function logLedBatchStats() {
  const stats = getLedBatchStats();
  log(LOG_LEVELS.INFO, `⚡ LED Batching Stats: ${stats.totalUpdates} updates, ${stats.totalBatches} batches, avg size: ${stats.averageBatchSize.toFixed(1)}`);
}

// MIDI Message Throttling Functions - Performance Optimization
function addMidiMessage(message, priority = 'normal') {
  if (!MIDI_THROTTLE_CONFIG.ENABLED || !clientConfig.enableMidiThrottling) {
    // Direct send if throttling is disabled
    client.send(JSON.stringify(message));
    return;
  }

  const messageEntry = MEMORY_OPTIMIZATION_CONFIG.OPTIMIZE_OBJECTS 
    ? MEMORY_EFFICIENT_ARRAYS.getObjectFromPool('messageEntry')
    : { message: null, priority: 'normal', timestamp: 0 };
  
  messageEntry.message = message;
  messageEntry.priority = priority;
  messageEntry.timestamp = Date.now();

  // Add to appropriate queue based on priority
  if (priority === 'high' || MIDI_THROTTLE_CONFIG.PRIORITY_MESSAGE_TYPES.includes(message.requestType)) {
    if (midiThrottleState.priorityQueue.length < MIDI_THROTTLE_CONFIG.PRIORITY_QUEUE_SIZE) {
      midiThrottleState.priorityQueue.push(messageEntry);
    } else {
      log(LOG_LEVELS.WARN, "⚠️ Priority MIDI queue full, dropping message");
      midiThrottleStats.droppedMessages++;
    }
  } else {
    if (midiThrottleState.normalQueue.length < MIDI_THROTTLE_CONFIG.NORMAL_QUEUE_SIZE) {
      midiThrottleState.normalQueue.push(messageEntry);
    } else {
      log(LOG_LEVELS.WARN, "⚠️ Normal MIDI queue full, dropping message");
      midiThrottleStats.droppedMessages++;
    }
  }

  // Start throttling if not already active
  if (!midiThrottleState.isThrottling) {
    startMidiThrottling();
  }
}

function startMidiThrottling() {
  if (midiThrottleState.isThrottling) return;
  
  midiThrottleState.isThrottling = true;
  processMidiQueue();
}

function processMidiQueue() {
  if (!midiThrottleState.isThrottling) return;

  const now = Date.now();
  let messagesSent = 0;
  const maxMessagesPerBurst = Math.floor(MIDI_THROTTLE_CONFIG.MAX_MESSAGES_PER_SECOND / 100); // 10ms burst

  // Process priority queue first
  while (midiThrottleState.priorityQueue.length > 0 && messagesSent < maxMessagesPerBurst) {
    const messageEntry = midiThrottleState.priorityQueue.shift();
    try {
      client.send(JSON.stringify(messageEntry.message));
      messagesSent++;
      midiThrottleState.messageCount++;
      midiThrottleStats.totalMessages++;
      midiThrottleStats.priorityMessages++;
    } catch (error) {
      log(LOG_LEVELS.ERROR, "💥 Failed to send priority MIDI message", error);
    }
  }

  // Process normal queue if we have capacity
  while (midiThrottleState.normalQueue.length > 0 && messagesSent < maxMessagesPerBurst) {
    const messageEntry = midiThrottleState.normalQueue.shift();
    try {
      client.send(JSON.stringify(messageEntry.message));
      messagesSent++;
      midiThrottleState.messageCount++;
      midiThrottleStats.totalMessages++;
      midiThrottleStats.normalMessages++;
    } catch (error) {
      log(LOG_LEVELS.ERROR, "💥 Failed to send normal MIDI message", error);
    }
  }

  // Reset message count every second
  if (now - midiThrottleState.lastMessageTime > 1000) {
    midiThrottleState.messageCount = 0;
    midiThrottleState.lastMessageTime = now;
  }

  // Continue processing if we have more messages
  if (midiThrottleState.priorityQueue.length > 0 || midiThrottleState.normalQueue.length > 0) {
    midiThrottleState.throttleTimer = setTimeout(() => {
      processMidiQueue();
    }, MIDI_THROTTLE_CONFIG.THROTTLE_DELAY);
  } else {
    midiThrottleState.isThrottling = false;
  }
}

function flushMidiQueue() {
  if (midiThrottleState.throttleTimer) {
    clearTimeout(midiThrottleState.throttleTimer);
    midiThrottleState.throttleTimer = null;
  }
  
  // Send all remaining messages immediately
  while (midiThrottleState.priorityQueue.length > 0) {
    const messageEntry = midiThrottleState.priorityQueue.shift();
    try {
      client.send(JSON.stringify(messageEntry.message));
    } catch (error) {
      log(LOG_LEVELS.ERROR, "💥 Failed to flush priority MIDI message", error);
    }
  }
  
  while (midiThrottleState.normalQueue.length > 0) {
    const messageEntry = midiThrottleState.normalQueue.shift();
    try {
      client.send(JSON.stringify(messageEntry.message));
    } catch (error) {
      log(LOG_LEVELS.ERROR, "💥 Failed to flush normal MIDI message", error);
    }
  }
  
  midiThrottleState.isThrottling = false;
}

// MIDI Throttling Statistics and Monitoring
let midiThrottleStats = {
  totalMessages: 0,
  priorityMessages: 0,
  normalMessages: 0,
  droppedMessages: 0,
  lastStatsTime: Date.now(),
};

// Adaptive WebSocket Frequency System - Performance Optimization
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

function getMidiThrottleStats() {
  return {
    ...midiThrottleStats,
    priorityQueueSize: midiThrottleState.priorityQueue.length,
    normalQueueSize: midiThrottleState.normalQueue.length,
    isThrottling: midiThrottleState.isThrottling,
    throttleConfig: MIDI_THROTTLE_CONFIG,
  };
}

function logMidiThrottleStats() {
  const stats = getMidiThrottleStats();
  log(LOG_LEVELS.INFO, `🎹 MIDI Throttling Stats: ${stats.totalMessages} sent, ${stats.priorityMessages} priority, ${stats.normalMessages} normal, ${stats.droppedMessages} dropped`);
}

// Adaptive WebSocket Frequency Functions - Performance Optimization
function recordActivity(activityType = 'user') {
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

function recordLedChange() {
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
  
  log(LOG_LEVELS.DEBUG, `🚀 Entering burst mode: ${WEBSOCKET_FREQUENCY_CONFIG.BURST_INTERVAL}ms interval`);
  
  // Schedule exit from burst mode
  setTimeout(() => {
    exitBurstMode();
  }, WEBSOCKET_FREQUENCY_CONFIG.BURST_DURATION);
  
  updateInterval();
}

function exitBurstMode() {
  if (!websocketFrequencyState.isBurst) return;
  
  websocketFrequencyState.isBurst = false;
  log(LOG_LEVELS.DEBUG, "🔄 Exiting burst mode");
  
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
  
  log(LOG_LEVELS.DEBUG, `⚡ Entering active mode: ${WEBSOCKET_FREQUENCY_CONFIG.ACTIVE_INTERVAL}ms interval`);
  updateInterval();
}

function enterIdleMode() {
  if (!websocketFrequencyState.isActive && !websocketFrequencyState.isBurst) return;
  
  websocketFrequencyState.isActive = false;
  websocketFrequencyState.targetInterval = WEBSOCKET_FREQUENCY_CONFIG.IDLE_INTERVAL;
  
  log(LOG_LEVELS.DEBUG, `😴 Entering idle mode: ${WEBSOCKET_FREQUENCY_CONFIG.IDLE_INTERVAL}ms interval`);
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
    startInterval();
  } else {
    // Gradual transition
    const current = websocketFrequencyState.currentInterval;
    const target = websocketFrequencyState.targetInterval;
    const step = (target - current) / 4; // 4-step transition
    
    websocketFrequencyState.currentInterval = Math.max(
      WEBSOCKET_FREQUENCY_CONFIG.MIN_INTERVAL,
      Math.min(WEBSOCKET_FREQUENCY_CONFIG.MAX_INTERVAL, current + step)
    );
    
    startInterval();
    
    // Continue transition if not complete
    if (Math.abs(websocketFrequencyState.currentInterval - target) > 5) {
      websocketFrequencyState.transitionTimer = setTimeout(() => {
        updateInterval();
      }, WEBSOCKET_FREQUENCY_CONFIG.TRANSITION_TIME / 4);
    }
  }
}

function startInterval() {
  if (websocketFrequencyState.intervalTimer) {
    clearTimeout(websocketFrequencyState.intervalTimer);
  }
  
  websocketFrequencyState.intervalTimer = setTimeout(() => {
    interval();
    startInterval(); // Schedule next interval
  }, websocketFrequencyState.currentInterval);
}

// WebSocket Frequency Statistics and Monitoring
let websocketFrequencyStats = {
  totalRequests: 0,
  activeRequests: 0,
  idleRequests: 0,
  burstRequests: 0,
  lastStatsTime: Date.now(),
  averageInterval: 0,
};

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
  log(LOG_LEVELS.INFO, `🌍 WebSocket Frequency Stats: ${stats.totalRequests} requests, avg interval: ${avgInterval.toFixed(0)}ms, current: ${stats.currentInterval}ms`);
}



/**
 * User-configurable settings for APC mini MA2 integration
 * @typedef {Object} ClientConfig
 * @property {number} pageSelectMode - Page select mode (0=off, 1=exec buttons only, 2=exec buttons and faders)
 * @property {boolean} controlOnpcPage - Enable page control on GrandMA2 OnPC
 * @property {number} brightness - LED brightness level (0-6, works when autoColor=false)
 * @property {boolean} darkMode - Enable dark color mode (works when autoColor=false)
 * @property {boolean} autoColor - Enable executor colors from GrandMA2 appearance
 * @property {boolean} blink - Enable executor blinking (works when autoColor=false)
 * @property {boolean} enableLedBatching - Enable LED update batching for better performance
 * @property {boolean} enableMidiThrottling - Enable MIDI message throttling for better performance
 * @property {boolean} enableAdaptiveFrequency - Enable adaptive WebSocket frequency for better performance
 * @property {boolean} enableColorOptimization - Enable color matching optimization for better performance
 * @property {boolean} enableMemoryOptimization - Enable memory optimization for better performance
 */
let clientConfig = {
  // Display configuration
  brightness: 6,
  darkMode: false,
  autoColor: true,
  blink: false,

  // Page control configuration
  pageSelectMode: 1,
  controlOnpcPage: true,
  
  // Performance configuration
  enableLedBatching: true,
  enableMidiThrottling: true,
  enableAdaptiveFrequency: true,
  enableColorOptimization: true,
  enableMemoryOptimization: true,
};

// Cache frequently used values
const CHANNEL = clientConfig.brightness;
const NS_PER_SEC = 1e9;
const FADER_THROTTLE_TIME = 50000000; // 50ms in nanoseconds

// Hardware-specific constants
const MIDI_IN_DEVICE = "APC mini mk2"; // MIDI input device name
const MIDI_OUT_DEVICE = "APC mini mk2"; // MIDI output device name
const WING_CONFIGURATION = 1; // Wing configuration: 1, 2, or 3

// LED and MIDI constants
const TOTAL_LEDS = 119;                   // Total number of LEDs on APC mini
const FADER_LED_OFFSET = 100;             // Starting LED index for fader buttons
const PAGE_SELECT_START = 112;            // Starting LED index for page select buttons
const PAGE_SELECT_END = 119;              // Ending LED index for page select buttons
const SHIFT_BUTTON = 122;                 // LED index for shift button
const FADER_CONTROLLER_START = 48;        // Starting MIDI controller number for faders
const FADER_CONTROLLER_END = 56;          // Ending MIDI controller number for faders
const MAIN_FADER_CONTROLLER = 56;         // MIDI controller number for main fader
const SPECIAL_MASTER_MULTIPLIER = 100;    // Multiplier for SpecialMaster 2.1 values
const SPECIAL_MASTER_3_MULTIPLIER = 225;  // Multiplier for SpecialMaster 3.1 values

// LED color velocity values (MIDI velocity values for APC mini) - mutable for dark mode
let LED_COLORS = {
  EXECUTOR_EMPTY: 0,      // Color for empty executor buttons (MIDI velocity 0)
  EXECUTOR_OFF: 9,        // Color for executor buttons that are off (MIDI velocity 9)
  EXECUTOR_ON: 21,        // Color for executor buttons that are on (MIDI velocity 21)
  FADER_BUTTON_EMPTY: 0,  // Color for empty fader buttons (MIDI velocity 0)
  FADER_BUTTON_OFF: 5,    // Color for fader buttons that are off (MIDI velocity 5)
  FADER_BUTTON_ON: 21,    // Color for fader buttons that are on (MIDI velocity 21)
};

// LED Batching System - Performance Optimization
const LED_BATCH_CONFIG = {
  ENABLED: true,           // Enable/disable LED batching
  BATCH_DELAY: 16,         // Milliseconds to wait before sending batched updates (60fps)
  MAX_BATCH_SIZE: 32,      // Maximum number of LED updates per batch
  PRIORITY_THRESHOLD: 8,   // Number of updates before forcing immediate send
};

// LED batching state
let ledBatchState = {
  pendingUpdates: new Map(), // Map of note -> {velocity, channel} for pending updates
  batchTimer: null,         // Timer for delayed batch sending
  updateCount: 0,           // Count of updates in current batch
  lastBatchTime: 0,         // Timestamp of last batch send
};

// MIDI Message Throttling System - Performance Optimization
const MIDI_THROTTLE_CONFIG = {
  ENABLED: true,                    // Enable/disable MIDI throttling
  MAX_MESSAGES_PER_SECOND: 1000,    // Maximum MIDI messages per second
  PRIORITY_QUEUE_SIZE: 50,          // Size of priority queue for important messages
  NORMAL_QUEUE_SIZE: 100,           // Size of normal queue for regular messages
  THROTTLE_DELAY: 10,               // Milliseconds between throttled message bursts
  PRIORITY_MESSAGE_TYPES: ['noteon', 'noteoff'], // Message types that get priority
};

// MIDI throttling state
let midiThrottleState = {
  priorityQueue: [],                 // High-priority message queue
  normalQueue: [],                   // Normal priority message queue
  messageCount: 0,                   // Messages sent in current second
  lastMessageTime: 0,                // Timestamp of last message
  throttleTimer: null,               // Timer for throttled message sending
  isThrottling: false,               // Whether throttling is currently active
};

// Memory Optimization System - Performance Optimization
const MEMORY_OPTIMIZATION_CONFIG = {
  ENABLED: true,                    // Enable/disable memory optimizations
  OBJECT_POOL_SIZE: 100,            // Size of object pools for frequently created objects
  ARRAY_OPTIMIZATION: true,         // Use optimized array sizes
  CACHE_CLEANUP_INTERVAL: 300000,  // Memory cleanup interval (5 minutes)
  MEMORY_MONITORING: true,          // Enable memory usage monitoring
  COMPRESS_STRINGS: true,           // Compress repeated strings
  OPTIMIZE_OBJECTS: true,           // Use object pooling for frequently created objects
};

// Memory optimization state
let memoryOptimizationState = {
  objectPools: new Map(),           // Object pools for frequently created objects
  stringCache: new Map(),           // Cache for repeated strings
  memoryUsage: {
    initial: 0,
    current: 0,
    peak: 0,
    lastCheck: Date.now(),
  },
  cleanupTimer: null,
};

// Memory-efficient data structures
const MEMORY_EFFICIENT_ARRAYS = {
  // Pre-allocated arrays with exact sizes
  LED_MATRIX_SIZE: TOTAL_LEDS,
  FADER_TIME_SIZE: 10,
  BUTTONS_SIZE: 64,
  FADER_VALUE_SIZE: 128,
  
  // Optimized array initialization
  createOptimizedArray: (size, defaultValue = 0) => {
    const array = new Array(size);
    for (let i = 0; i < size; i++) {
      array[i] = defaultValue;
    }
    return array;
  },
  
  // Object pool for frequently created objects
  getObjectFromPool: (type) => {
    if (!memoryOptimizationState.objectPools.has(type)) {
      memoryOptimizationState.objectPools.set(type, []);
    }
    
    const pool = memoryOptimizationState.objectPools.get(type);
    return pool.length > 0 ? pool.pop() : createNewObject(type);
  },
  
  returnObjectToPool: (type, obj) => {
    if (!memoryOptimizationState.objectPools.has(type)) {
      memoryOptimizationState.objectPools.set(type, []);
    }
    
    const pool = memoryOptimizationState.objectPools.get(type);
    if (pool.length < MEMORY_OPTIMIZATION_CONFIG.OBJECT_POOL_SIZE) {
      resetObject(obj);
      pool.push(obj);
    }
  }
};

// Apply dark mode colors if enabled (overrides default LED colors)
if (clientConfig.darkMode) {
  LED_COLORS.EXECUTOR_EMPTY = 0;
  LED_COLORS.EXECUTOR_OFF = 1;
  LED_COLORS.EXECUTOR_ON = 21;
  LED_COLORS.FADER_BUTTON_EMPTY = 0;
  LED_COLORS.FADER_BUTTON_OFF = 1;
  LED_COLORS.FADER_BUTTON_ON = 5;
}

// Button ranges (MIDI note numbers)
const FADER_BUTTON_START = 100;           // Starting MIDI note for fader buttons
const FADER_BUTTON_END = 107;             // Ending MIDI note for fader buttons
const EXECUTOR_BUTTON_START = 16;         // Starting MIDI note for executor buttons
const EXECUTOR_BUTTON_END = 63;           // Ending MIDI note for executor buttons
const SMALL_BUTTON_START = 0;             // Starting MIDI note for small buttons
const SMALL_BUTTON_END = 15;              // Ending MIDI note for small buttons

// Timing constants
const INITIALIZATION_DELAY = 1000;        // Delay before initialization (milliseconds)
const INTERVAL_DELAY = 100;               // Interval between WebSocket requests (milliseconds)
const REQUEST_THRESHOLD = 9;              // Maximum requests before session refresh

// Connection state management
let connectionState = {
  isConnected: false,
  isReconnecting: false,
  reconnectAttempts: 0,
  lastReconnectTime: 0,
  maxReconnectAttempts: 10,
  reconnectDelay: 1000, // Start with 1 second
  maxReconnectDelay: 30000, // Max 30 seconds
};

// State variables
let blackout = 0;
let pageIndex = 0; //button page
let pageIndex2 = 0; //fader page
let request = 0;
let interval_on = 0;
let session = 0;

// Initialize LED matrix based on wing configuration
let ledmatrix = getOptimizedArray(TOTAL_LEDS, 0);
let led_isrun = getOptimizedArray(TOTAL_LEDS, 2);

// Initialize fader values array
let faderValue = [
  0, 0, 0, 0, 0.002, 0.006, 0.01, 0.014, 0.018, 0.022, 0.026, 0.03, 0.034,
  0.038, 0.042, 0.046, 0.05, 0.053, 0.057, 0.061, 0.065, 0.069, 0.073, 0.077,
  0.081, 0.085, 0.089, 0.093, 0.097, 0.1, 0.104, 0.108, 0.112, 0.116, 0.12,
  0.124, 0.128, 0.132, 0.136, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.2, 0.21,
  0.22, 0.23, 0.24, 0.25, 0.26, 0.27, 0.28, 0.29, 0.3, 0.31, 0.32, 0.33, 0.34,
  0.35, 0.36, 0.37, 0.38, 0.39, 0.4, 0.41, 0.42, 0.43, 0.44, 0.45, 0.46, 0.47,
  0.48, 0.49, 0.5, 0.51, 0.52, 0.53, 0.54, 0.55, 0.56, 0.57, 0.58, 0.59, 0.6,
  0.61, 0.62, 0.63, 0.64, 0.65, 0.66, 0.67, 0.68, 0.69, 0.7, 0.71, 0.72, 0.73,
  0.74, 0.75, 0.76, 0.77, 0.78, 0.79, 0.8, 0.81, 0.82, 0.83, 0.84, 0.85, 0.86,
  0.87, 0.88, 0.89, 0.9, 0.91, 0.92, 0.93, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99,
  1, 1, 1,
];

let faderValueMem = [0, 0, 0];
let faderTime = getOptimizedArray(10, 0);

// Initialize buttons array based on wing configuration
let buttons;
if (WING_CONFIGURATION === 1) {
  faderValueMem[MAIN_FADER_CONTROLLER] = 1;
  buttons = [
    0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7, 175, 176, 177, 178, 179,
    180, 181, 182, 160, 161, 162, 163, 164, 165, 166, 167, 145, 146, 147, 148,
    149, 150, 151, 152, 130, 131, 132, 133, 134, 135, 136, 137, 115, 116, 117,
    118, 119, 120, 121, 122, 100, 101, 102, 103, 104, 105, 106, 107,
      ];
  } else if (WING_CONFIGURATION === 2) {
    buttons = [
    7, 8, 9, 10, 11, 12, 13, 14, 7, 8, 9, 10, 11, 12, 13, 14, 182, 183, 184,
    185, 186, 187, 188, 189, 167, 168, 169, 170, 171, 172, 173, 174, 152, 153,
    154, 155, 156, 157, 158, 159, 137, 138, 139, 140, 141, 142, 143, 144, 122,
    123, 124, 125, 126, 127, 128, 129, 107, 108, 109, 110, 111, 112, 113, 114,
      ];
  } else if (WING_CONFIGURATION === 3) {
    faderValueMem[MAIN_FADER_CONTROLLER] = 0;
  buttons = [
    170, 171, 172, 173, 174, 175, 176, 177, 160, 161, 162, 163, 164, 165, 166,
    167, 150, 151, 152, 153, 154, 155, 156, 157, 140, 141, 142, 143, 144, 145,
    146, 147, 130, 131, 132, 133, 134, 135, 136, 137, 120, 121, 122, 123, 124,
    125, 126, 127, 110, 111, 112, 113, 114, 115, 116, 117, 100, 101, 102, 103,
    104, 105, 106, 107,
  ];
}

// Initialize fader times
for (let i = FADER_CONTROLLER_START; i <= FADER_CONTROLLER_END; i++) {
  faderTime[i] = process.hrtime();
}

// Non-blocking sleep function using setTimeout
function sleep(time, callback) {
  setTimeout(callback, time);
}

// Optimized interval function with adaptive frequency and statistics
function interval() {
  if (session <= 0) return;
  
  // Update statistics
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
  
  const baseRequest = {
    requestType: "playbacks",
    itemsType: [WING_CONFIGURATION === 2 ? 3 : 3],
    view: 3,
    execButtonViewMode: 2,
    buttonsViewMode: 0,
    session: session,
    maxRequests: 1
  };

  const faderRequest = {
    requestType: "playbacks",
    itemsType: [2],
    view: 2,
    execButtonViewMode: 1,
    buttonsViewMode: 0,
    session: session,
    maxRequests: 1
  };

  if (WING_CONFIGURATION === 1 || WING_CONFIGURATION === 3) {
    client.send(JSON.stringify({
      ...baseRequest,
      startIndex: [FADER_LED_OFFSET],
      itemsCount: [90],
      pageIndex: pageIndex
    }));
    client.send(JSON.stringify({
      ...faderRequest,
      startIndex: [0],
      itemsCount: [10],
      pageIndex: pageIndex2
    }));
  } else if (WING_CONFIGURATION === 2) {
    client.send(JSON.stringify({
      ...baseRequest,
      startIndex: [FADER_LED_OFFSET],
      itemsCount: [90],
      pageIndex: pageIndex
    }));
    client.send(JSON.stringify({
      ...faderRequest,
      startIndex: [0],
      itemsCount: [15],
      pageIndex: pageIndex2
    }));
  }
  
  // Periodic flush of LED batches to ensure updates don't get stuck
  if (ledBatchState.pendingUpdates.size > 0) {
    flushLedBatch();
  }
  
  // Log batching stats every 100 intervals (10 seconds)
  if (request % 100 === 0 && ledBatchStats.totalBatches > 0) {
    logLedBatchStats();
  }
  
  // Log MIDI throttling stats every 200 intervals (20 seconds)
  if (request % 200 === 0 && midiThrottleStats.totalMessages > 0) {
    logMidiThrottleStats();
  }
  
  // Log WebSocket frequency stats every 300 intervals (30 seconds)
  if (request % 300 === 0 && websocketFrequencyStats.totalRequests > 0) {
    logWebsocketFrequencyStats();
  }
  
  // Log color matching stats every 400 intervals (40 seconds)
  if (request % 400 === 0 && colorMatchingStats.totalMatches > 0) {
    logColorMatchingStats();
  }
  
  // Log memory optimization stats every 500 intervals (50 seconds)
  if (request % 500 === 0 && memoryOptimizationStats.objectsPooled > 0) {
    logMemoryOptimizationStats();
  }
  
  // Periodic flush of MIDI queue to ensure no messages get stuck
  if (midiThrottleState.priorityQueue.length > 0 || midiThrottleState.normalQueue.length > 0) {
    flushMidiQueue();
  }
}

// Optimized MIDI clear function with LED batching
function midiclear() {
  for (let i = 0; i < 120; i++) {
    ledmatrix[i] = 0;
    addLedUpdate(i, 0, 0);
  }
  // Flush batched updates immediately for clear operation
  flushLedBatch();
}

// Initialize connection
initializeConnection();

// Display info
log(LOG_LEVELS.INFO, `��️ Akai APC mini MA2 WING ${WING_CONFIGURATION} mode`);
log(LOG_LEVELS.INFO, "🚀 Starting APC mini MA2 integration...");
log(LOG_LEVELS.INFO, `⚡ LED Batching: ${clientConfig.enableLedBatching ? 'ENABLED' : 'DISABLED'} (${LED_BATCH_CONFIG.BATCH_DELAY}ms delay, max ${LED_BATCH_CONFIG.MAX_BATCH_SIZE} updates)`);
log(LOG_LEVELS.INFO, `🎹 MIDI Throttling: ${clientConfig.enableMidiThrottling ? 'ENABLED' : 'DISABLED'} (${MIDI_THROTTLE_CONFIG.MAX_MESSAGES_PER_SECOND}/s max, ${MIDI_THROTTLE_CONFIG.THROTTLE_DELAY}ms delay)`);
log(LOG_LEVELS.INFO, `🌍 Adaptive Frequency: ${clientConfig.enableAdaptiveFrequency ? 'ENABLED' : 'DISABLED'} (${WEBSOCKET_FREQUENCY_CONFIG.ACTIVE_INTERVAL}ms active, ${WEBSOCKET_FREQUENCY_CONFIG.IDLE_INTERVAL}ms idle)`);
log(LOG_LEVELS.INFO, `💾 Memory Optimization: ${clientConfig.enableMemoryOptimization ? 'ENABLED' : 'DISABLED'} (${MEMORY_OPTIMIZATION_CONFIG.OBJECT_POOL_SIZE} pool size, ${MEMORY_OPTIMIZATION_CONFIG.CACHE_CLEANUP_INTERVAL/1000}s cleanup)`);

// Display all midi devices
log(LOG_LEVELS.DEBUG, "Midi IN");
log(LOG_LEVELS.DEBUG, easymidi.getInputs());
log(LOG_LEVELS.DEBUG, "Midi OUT");
log(LOG_LEVELS.DEBUG, easymidi.getOutputs());

log(LOG_LEVELS.INFO, `🎹 Connecting to MIDI device ${MIDI_IN_DEVICE}`);

// Open midi device with error handling
let input, output;

try {
  input = new easymidi.Input(MIDI_IN_DEVICE);
  output = new easymidi.Output(MIDI_OUT_DEVICE);
  log(LOG_LEVELS.INFO, "🎹 MIDI devices connected successfully");
} catch (error) {
  log(LOG_LEVELS.ERROR, "🎹 Failed to connect to MIDI devices", error);
  log(LOG_LEVELS.ERROR, "🎹 Please check that the APC mini mk2 is connected and the device name is correct");
  process.exit(1);
}

// Non-blocking initialization delay
sleep(INITIALIZATION_DELAY, function () {
  // Clear LED matrix and LED status - display .2
  for (let i = FADER_LED_OFFSET; i < TOTAL_LEDS; i++) {
    addLedUpdate(i, 0, 0);
  }

  for (let i = 0; i < 90; i++) {
    addLedUpdate(i, ledmatrix[i], CHANNEL);
  }

  // Turn on page select buttons
  if (clientConfig.pageSelectMode > 0) {
    addLedUpdate(PAGE_SELECT_START, 127, 0);
    for (let i = PAGE_SELECT_START + 1; i <= PAGE_SELECT_END; i++) {
      addLedUpdate(i, 0, 0);
    }
  }
  
  // Flush any remaining batched updates
  flushLedBatch();
});

// Optimized noteon handler with template literals
input.on("noteon", function (msg) {
  const { note } = msg;
  
  if (note >= SMALL_BUTTON_START && note <= SMALL_BUTTON_END) {
    // Record user activity for adaptive frequency
    recordActivity('user');
    
    if (WING_CONFIGURATION === 3) {
      addMidiMessage({
        requestType: "playbacks_userInput",
        cmdline: "",
        execIndex: buttons[note],
        pageIndex: pageIndex,
        buttonId: 0,
        pressed: true,
        released: false,
        type: 0,
        session: session,
        maxRequests: 0
      }, 'high');
    } else if (note < 8) {
      addMidiMessage({
        requestType: "playbacks_userInput",
        cmdline: "",
        execIndex: buttons[note],
        pageIndex: pageIndex2,
        buttonId: 1,
        pressed: true,
        released: false,
        type: 0,
        session: session,
        maxRequests: 0
      }, 'high');
    } else {
      addMidiMessage({
        requestType: "playbacks_userInput",
        cmdline: "",
        execIndex: buttons[note],
        pageIndex: pageIndex2,
        buttonId: 2,
        pressed: true,
        released: false,
        type: 0,
        session: session,
        maxRequests: 0
      }, 'high');
    }
  }

  if (note >= EXECUTOR_BUTTON_START && note <= EXECUTOR_BUTTON_END) {
    // Record user activity for adaptive frequency
    recordActivity('user');
    
    addMidiMessage({
      requestType: "playbacks_userInput",
      cmdline: "",
      execIndex: buttons[note],
      pageIndex: pageIndex,
      buttonId: 0,
      pressed: true,
      released: false,
      type: 0,
      session: session,
      maxRequests: 0
    }, 'high');
  }

  if (note >= FADER_BUTTON_START && note <= FADER_BUTTON_END) {
    // Record user activity for adaptive frequency
    recordActivity('user');
    
    if (WING_CONFIGURATION === 3) {
      addMidiMessage({
        requestType: "playbacks_userInput",
        cmdline: "",
        execIndex: note - FADER_LED_OFFSET,
        pageIndex: pageIndex2,
        buttonId: 0,
        pressed: true,
        released: false,
        type: 0,
        session: session,
        maxRequests: 0
      }, 'high');
    } else {
      addMidiMessage({
        requestType: "playbacks_userInput",
        cmdline: "",
        execIndex: buttons[note - FADER_LED_OFFSET],
        pageIndex: pageIndex2,
        buttonId: 0,
        pressed: true,
        released: false,
        type: 0,
        session: session,
        maxRequests: 0
      }, 'high');
    }
  }

  if (note >= PAGE_SELECT_START && note <= PAGE_SELECT_END) {
    // Record user activity for adaptive frequency
    recordActivity('user');
    
    // Page select
    if (clientConfig.pageSelectMode === 1) {
      output.send("noteon", { note: pageIndex + PAGE_SELECT_START, velocity: 0, channel: 0 });
      pageIndex = note - PAGE_SELECT_START;
      output.send("noteon", { note: note, velocity: 127, channel: 0 });
      if (clientConfig.controlOnpcPage) {
        addMidiMessage({
          command: `ButtonPage ${pageIndex + 1}`,
          session: session,
          requestType: "command",
          maxRequests: 0
        }, 'high');
      }
    }
    if (clientConfig.pageSelectMode === 2) {
      output.send("noteon", { note: pageIndex + PAGE_SELECT_START, velocity: 0, channel: 0 });
      pageIndex = note - PAGE_SELECT_START;
      pageIndex2 = note - PAGE_SELECT_START;
      output.send("noteon", { note: note, velocity: 127, channel: 0 });
      if (clientConfig.controlOnpcPage) {
        addMidiMessage({
          command: `Page ${pageIndex + 1}`,
          session: session,
          requestType: "command",
          maxRequests: 0
        }, 'high');
      }
    }
  }

  if (note === SHIFT_BUTTON) {
    // Record user activity for adaptive frequency
    recordActivity('user');
    
    // Shift Button
    if (WING_CONFIGURATION === 1) {
      addMidiMessage({
        command: "SpecialMaster 2.1 At 0",
        session: session,
        requestType: "command",
        maxRequests: 0
      }, 'high');
      blackout = 1;
    } else if (WING_CONFIGURATION === 2) {
      addMidiMessage({
        command: "Learn SpecialMaster 3.1",
        session: session,
        requestType: "command",
        maxRequests: 0
      }, 'high');
    } else if (WING_CONFIGURATION === 3) {
      addMidiMessage({
        requestType: "playbacks_userInput",
        cmdline: "",
        execIndex: "8",
        pageIndex: pageIndex2,
        buttonId: 0,
        pressed: true,
        released: false,
        type: 0,
        session: session,
        maxRequests: 0
      }, 'high');
    }
  }
});

// Optimized noteoff handler
input.on("noteoff", function (msg) {
  const { note } = msg;
  
  if (note >= SMALL_BUTTON_START && note <= SMALL_BUTTON_END) {
    if (WING_CONFIGURATION === 3) {
      addMidiMessage({
        requestType: "playbacks_userInput",
        cmdline: "",
        execIndex: buttons[note],
        pageIndex: pageIndex,
        buttonId: 0,
        pressed: false,
        released: true,
        type: 0,
        session: session,
        maxRequests: 0
      }, 'high');
    } else if (note < 8) {
      addMidiMessage({
        requestType: "playbacks_userInput",
        cmdline: "",
        execIndex: buttons[note],
        pageIndex: pageIndex2,
        buttonId: 1,
        pressed: false,
        released: true,
        type: 0,
        session: session,
        maxRequests: 0
      }, 'high');
    } else {
      addMidiMessage({
        requestType: "playbacks_userInput",
        cmdline: "",
        execIndex: buttons[note],
        pageIndex: pageIndex2,
        buttonId: 2,
        pressed: false,
        released: true,
        type: 0,
        session: session,
        maxRequests: 0
      }, 'high');
    }
  }

  if (note >= 16 && note <= 63) {
    addMidiMessage({
      requestType: "playbacks_userInput",
      cmdline: "",
      execIndex: buttons[note],
      pageIndex: pageIndex,
      buttonId: 0,
      pressed: false,
      released: true,
      type: 0,
      session: session,
      maxRequests: 0
    }, 'high');
  }

  if (note >= 100 && note <= 107) {
    if (WING_CONFIGURATION === 3) {
      addMidiMessage({
        requestType: "playbacks_userInput",
        cmdline: "",
        execIndex: note - 100,
        pageIndex: pageIndex2,
        buttonId: 0,
        pressed: false,
        released: true,
        type: 0,
        session: session,
        maxRequests: 0
      }, 'high');
    } else {
      addMidiMessage({
        requestType: "playbacks_userInput",
        cmdline: "",
        execIndex: buttons[note - 100],
        pageIndex: pageIndex2,
        buttonId: 0,
        pressed: false,
        released: true,
        type: 0,
        session: session,
        maxRequests: 0
      }, 'high');
    }
  }

  if (note === 122) {
    // Shift Button
    if (WING_CONFIGURATION === 1) {
      addMidiMessage({
        command: `SpecialMaster 2.1 At ${faderValueMem[MAIN_FADER_CONTROLLER] * SPECIAL_MASTER_MULTIPLIER}`,
        session: session,
        requestType: "command",
        maxRequests: 0
      }, 'high');
      blackout = 0;
    } else if (WING_CONFIGURATION === 3) {
      addMidiMessage({
        requestType: "playbacks_userInput",
        cmdline: "",
        execIndex: "8",
        pageIndex: pageIndex2,
        buttonId: 0,
        pressed: false,
        released: true,
        type: 0,
        session: session,
        maxRequests: 0
      }, 'high');
    }
  }
});

// Optimized CC handler
input.on("cc", function (msg) {
  const diff = process.hrtime(faderTime[msg.controller]);
  const timeDiff = diff[0] * NS_PER_SEC + diff[1];
  
  if (timeDiff >= FADER_THROTTLE_TIME || msg.value === 0 || msg.value === 127) {
    // Record fader activity for adaptive frequency
    recordActivity('fader');
    
    faderTime[msg.controller] = process.hrtime();
    faderValueMem[msg.controller] = faderValue[msg.value];

    if (msg.controller === MAIN_FADER_CONTROLLER) {
      if (WING_CONFIGURATION === 1) {
        if (blackout === 0) {
          addMidiMessage({
            command: `SpecialMaster 2.1 At ${faderValue[msg.value] * SPECIAL_MASTER_MULTIPLIER}`,
            session: session,
            requestType: "command",
            maxRequests: 0
          }, 'normal');
        }
      } else if (WING_CONFIGURATION === 2) {
        addMidiMessage({
          command: `SpecialMaster 3.1 At ${faderValue[msg.value] * SPECIAL_MASTER_3_MULTIPLIER}`,
          session: session,
          requestType: "command",
          maxRequests: 0
        }, 'normal');
      } else if (WING_CONFIGURATION === 3) {
        addMidiMessage({
          requestType: "playbacks_userInput",
          execIndex: "8",
          pageIndex: pageIndex2,
          faderValue: faderValue[msg.value],
          type: 1,
          session: session,
          maxRequests: 0
        }, 'normal');
      }
    } else {
      if (WING_CONFIGURATION === 3) {
        addMidiMessage({
          requestType: "playbacks_userInput",
          execIndex: msg.controller - FADER_CONTROLLER_START,
          pageIndex: pageIndex2,
          faderValue: faderValue[msg.value],
          type: 1,
          session: session,
          maxRequests: 0
        }, 'normal');
      } else {
        addMidiMessage({
          requestType: "playbacks_userInput",
          execIndex: buttons[msg.controller - FADER_CONTROLLER_START],
          pageIndex: pageIndex2,
          faderValue: faderValue[msg.value],
          type: 1,
          session: session,
          maxRequests: 0
        }, 'normal');
      }
    }
  }
});

log(LOG_LEVELS.INFO, "🔌 Connecting to grandMA2 ...");

// WEBSOCKET handlers
client.onerror = function () {
  log(LOG_LEVELS.ERROR, "💥 Connection Error");
};

client.onopen = function () {
  log(LOG_LEVELS.INFO, "✅ WebSocket Client Connected");
};

client.onclose = function () {
  log(LOG_LEVELS.WARN, "🔌 Client Closed");
  for (let i = 0; i < TOTAL_LEDS; i++) {
    output.send("noteon", { note: i, velocity: 0, channel: 0 });
  }
  input.close();
  output.close();
  process.exit();
};

// Optimized message handler with error handling
client.onmessage = function (e) {
  // Allow login messages even when not fully connected
  if (typeof e.data === "string") {
    try {
              if (!validateResponse(e.data)) {
          log(LOG_LEVELS.WARN, "⚠️ Invalid response received, skipping processing");
          return;
        }
      
      const obj = JSON.parse(e.data);

      // Handle login and connection establishment first
      if (obj.status === "server ready") {
        log(LOG_LEVELS.INFO, "🟢 SERVER READY");
        client.send(JSON.stringify({ session: 0 }));
        return;
      }
      
      if (obj.forceLogin === true) {
        log(LOG_LEVELS.INFO, "🔐 LOGIN ...");
        session = obj.session;
        client.send(JSON.stringify({
          requestType: "login",
          username: "apcmini",
          password: "2c18e486683a3db1e645ad8523223b72",
          session: session,
          maxRequests: 10
        }));
        return;
      }

      if (obj.responseType === "login" && obj.result === true) {
        if (interval_on === 0) {
          interval_on = 1;
          // Start adaptive interval system instead of fixed interval
          if (clientConfig.enableAdaptiveFrequency) {
            startInterval();
            log(LOG_LEVELS.INFO, `🌍 Started adaptive WebSocket frequency system`);
          } else {
            setInterval(interval, INTERVAL_DELAY);
            log(LOG_LEVELS.INFO, `🌍 Started fixed WebSocket frequency (${INTERVAL_DELAY}ms)`);
          }
        }
        log(LOG_LEVELS.INFO, "✅ ...LOGGED");
        log(LOG_LEVELS.INFO, `🔑 SESSION ${session}`);
        connectionState.isConnected = true; // Mark as connected after successful login
        return;
      }

            // Only check connection state for non-login messages
      if (!connectionState.isConnected) {
        log(LOG_LEVELS.WARN, "⚠️ Received message but not connected, ignoring");
        return;
      }

      if (request >= REQUEST_THRESHOLD) {
        try {
          client.send(JSON.stringify({ session: session }));
          client.send(JSON.stringify({
            requestType: "getdata",
            data: "set,clear,solo,high",
            session: session,
            maxRequests: 1
          }));
          request = 0;
        } catch (error) {
          log(LOG_LEVELS.ERROR, "💥 Failed to send request", error);
        }
      }

      if (obj.session === 0) {
        log(LOG_LEVELS.ERROR, "🔌 CONNECTION ERROR - attempting to reconnect");
        connectionState.isConnected = false;
        scheduleReconnection();
        client.send(JSON.stringify({ session: session }));
      }

      if (obj.session) {
        if (obj.session === -1) {
          log(LOG_LEVELS.ERROR, '🔐 Please turn on Web Remote, and set Web Remote password to "remote"');
          midiclear();
          input.close();
          output.close();
          process.exit(1);
        } else {
          session = obj.session;
        }
      }

      if (obj.text) {
        log(LOG_LEVELS.INFO, obj.text);
      }

      if (obj.responseType === "login" && obj.result === false) {
        log(LOG_LEVELS.ERROR, "❌ ...LOGIN ERROR");
        log(LOG_LEVELS.ERROR, `🔑 SESSION ${session}`);
      }

      if (obj.responseType === "playbacks") {
        request++;

        if (obj.responseSubType === 3) {
          // Button LED processing
          processButtonLEDs(obj);
        }

        if (obj.responseSubType === 2) {
          // Fader LED processing
          processFaderLEDs(obj);
        }
      }
          } catch (error) {
        log(LOG_LEVELS.ERROR, "💥 Error processing message", error);
      }
  }
};

// Process button LED feedback for different wing configurations
function processButtonLEDs(obj) {
  const itemGroups = obj.itemGroups[0].items;
  
  if (WING_CONFIGURATION === 1) {
    processWing1ButtonLEDs(itemGroups);
  } else if (WING_CONFIGURATION === 2) {
    processWing2ButtonLEDs(itemGroups);
  } else if (WING_CONFIGURATION === 3) {
    processWing3ButtonLEDs(itemGroups);
  }
}

// Process button LEDs for Wing 1 configuration
function processWing1ButtonLEDs(itemGroups) {
  // First section: 6 rows of 5 buttons each (starting from LED 56)
  let currentLedIndex = 56;
  let currentRowIndex = 0;

  for (let row = 0; row < 6; row++) {
    let buttonIndex = 0;
    let endLedIndex = currentLedIndex + 5;
    
    while (currentLedIndex < endLedIndex) {
      const combinedItems = itemGroups[currentRowIndex][buttonIndex].combinedItems;
      
      for (let item = 0; item < combinedItems; item++) {
        led_feedback(buttonIndex, currentLedIndex, currentRowIndex, itemGroups);
        currentLedIndex++;
      }
      buttonIndex++;
    }
    currentRowIndex += 3;
    currentLedIndex -= 13; // Reset to start of next row
  }

  // Second section: 6 rows of 3 buttons each (starting from LED 61)
  currentRowIndex = 1;
  currentLedIndex = 61;
  
  for (let row = 0; row < 6; row++) {
    let buttonIndex = 0;
    let endLedIndex = currentLedIndex + 3;
    
    while (currentLedIndex < endLedIndex) {
      const combinedItems = itemGroups[currentRowIndex][buttonIndex].combinedItems;
      
      for (let item = 0; item < combinedItems; item++) {
        if (currentLedIndex < endLedIndex) {
          led_feedback(buttonIndex, currentLedIndex, currentRowIndex, itemGroups);
          currentLedIndex++;
        }
      }
      buttonIndex++;
    }
    currentRowIndex += 3;
    currentLedIndex -= 11; // Reset to start of next row
  }
}

// Process button LEDs for Wing 2 configuration
function processWing2ButtonLEDs(itemGroups) {
  // First section: 6 rows of 5 buttons each (starting from LED 54)
  let currentLedIndex = 54;
  let currentRowIndex = 1;

  for (let row = 0; row < 6; row++) {
    let buttonIndex = 0;
    let endLedIndex = currentLedIndex + 5;
    
    while (currentLedIndex < endLedIndex) {
      const combinedItems = itemGroups[currentRowIndex][buttonIndex].combinedItems;
      
      for (let item = 0; item < combinedItems; item++) {
        // Only process the last 3 LEDs in each row
        if (currentLedIndex >= endLedIndex - 3) {
          led_feedback(buttonIndex, currentLedIndex, currentRowIndex, itemGroups);
        }
        currentLedIndex++;
      }
      buttonIndex++;
    }
    currentRowIndex += 3;
    currentLedIndex -= 13; // Reset to start of next row
  }

  // Second section: 6 rows of 5 buttons each (starting from LED 59)
  currentRowIndex = 2;
  currentLedIndex = 59;
  
  for (let row = 0; row < 6; row++) {
    let buttonIndex = 0;
    let endLedIndex = currentLedIndex + 5;
    
    while (currentLedIndex < endLedIndex) {
      const combinedItems = itemGroups[currentRowIndex][buttonIndex].combinedItems;
      
      for (let item = 0; item < combinedItems; item++) {
        led_feedback(buttonIndex, currentLedIndex, currentRowIndex, itemGroups);
        currentLedIndex++;
      }
      buttonIndex++;
    }
    currentRowIndex += 3;
    currentLedIndex -= 13; // Reset to start of next row
  }
}

// Process button LEDs for Wing 3 configuration
function processWing3ButtonLEDs(itemGroups) {
  // First section: 8 rows of 5 buttons each (starting from LED 56)
  let currentLedIndex = 56;
  let currentRowIndex = 0;

  for (let row = 0; row < 8; row++) {
    let buttonIndex = 0;
    let endLedIndex = currentLedIndex + 5;
    
    while (currentLedIndex < endLedIndex) {
      const combinedItems = itemGroups[currentRowIndex][buttonIndex].combinedItems;
      
      for (let item = 0; item < combinedItems; item++) {
        led_feedback(buttonIndex, currentLedIndex, currentRowIndex, itemGroups);
        currentLedIndex++;
      }
      buttonIndex++;
    }
    currentRowIndex += 2;
    currentLedIndex -= 13; // Reset to start of next row
  }

  // Second section: 8 rows of 3 buttons each (starting from LED 61)
  currentRowIndex = 1;
  currentLedIndex = 61;
  
  for (let row = 0; row < 8; row++) {
    let buttonIndex = 0;
    let endLedIndex = currentLedIndex + 3;
    
    while (currentLedIndex < endLedIndex) {
      const combinedItems = itemGroups[currentRowIndex][buttonIndex].combinedItems;
      
      for (let item = 0; item < combinedItems; item++) {
        if (currentLedIndex < endLedIndex) {
          led_feedback(buttonIndex, currentLedIndex, currentRowIndex, itemGroups);
          currentLedIndex++;
        }
      }
      buttonIndex++;
    }
    currentRowIndex += 2;
    currentLedIndex -= 11; // Reset to start of next row
  }
}

// Process fader LED feedback for different wing configurations
function processFaderLEDs(obj) {
  const itemGroups = obj.itemGroups[0].items;
  
  if (WING_CONFIGURATION === 1) {
    processWing1FaderLEDs(itemGroups);
  } else if (WING_CONFIGURATION === 2) {
    processWing2FaderLEDs(itemGroups);
  } else if (WING_CONFIGURATION === 3) {
    processWing3FaderLEDs(itemGroups);
  }
}

// Process fader LEDs for Wing 1 configuration
function processWing1FaderLEDs(itemGroups) {
  // First section: 5 faders (LEDs 0-4)
  let currentLedIndex = 0;
  let currentRowIndex = 0;
  let buttonIndex = 0;
  let endLedIndex = currentLedIndex + 5;
  
  while (currentLedIndex < endLedIndex) {
    const combinedItems = itemGroups[currentRowIndex][buttonIndex].combinedItems;
    
    for (let item = 0; item < combinedItems; item++) {
      led_feedback(buttonIndex, currentLedIndex, currentRowIndex, itemGroups);
      currentLedIndex++;
    }
    buttonIndex++;
  }

  // Second section: 3 faders (LEDs 5-7)
  currentRowIndex = 1;
  currentLedIndex = 5;
  buttonIndex = 0;
  endLedIndex = currentLedIndex + 3;
  
  while (currentLedIndex < endLedIndex) {
    const combinedItems = itemGroups[currentRowIndex][buttonIndex].combinedItems;
    
          for (let item = 0; item < combinedItems; item++) {
        if (currentLedIndex < endLedIndex) {
          led_feedback(buttonIndex, currentLedIndex, currentRowIndex, itemGroups);
          currentLedIndex++;
        }
      }
    buttonIndex++;
  }
}

// Process fader LEDs for Wing 2 configuration
function processWing2FaderLEDs(itemGroups) {
  // First section: 5 faders (LEDs 0-4, starting from -2)
  let currentLedIndex = -2;
  let currentRowIndex = 1;
  let buttonIndex = 0;
  let endLedIndex = currentLedIndex + 5;
  
  while (currentLedIndex < endLedIndex) {
    const combinedItems = itemGroups[currentRowIndex][buttonIndex].combinedItems;
    
    for (let item = 0; item < combinedItems; item++) {
      // Only process LEDs 0 and above (skip negative indices)
      if (currentLedIndex >= 0) {
        led_feedback(buttonIndex, currentLedIndex, currentRowIndex, itemGroups);
      }
      currentLedIndex++;
    }
    buttonIndex++;
  }

  // Second section: 5 faders (LEDs 3-7)
  currentRowIndex = 2;
  currentLedIndex = 3;
  
  for (let row = 0; row < 1; row++) {
    buttonIndex = 0;
    endLedIndex = currentLedIndex + 5;
    
    while (currentLedIndex < endLedIndex) {
      const combinedItems = itemGroups[currentRowIndex][buttonIndex].combinedItems;
      
      for (let item = 0; item < combinedItems; item++) {
        led_feedback(buttonIndex, currentLedIndex, currentRowIndex, itemGroups);
        currentLedIndex++;
      }
      buttonIndex++;
    }
  }
}

// Process fader LEDs for Wing 3 configuration
function processWing3FaderLEDs(itemGroups) {
  // First section: 5 faders (LEDs 0-4)
  let currentLedIndex = 0;
  let currentRowIndex = 0;
  let buttonIndex = 0;
  let endLedIndex = currentLedIndex + 5;
  
  while (currentLedIndex < endLedIndex) {
    const combinedItems = itemGroups[currentRowIndex][buttonIndex].combinedItems;
    
    for (let item = 0; item < combinedItems; item++) {
      // For Wing 3, directly control LED brightness based on isRun status
      const isRunning = itemGroups[currentRowIndex][buttonIndex].isRun === 1;
      const velocity = isRunning ? 1 : 0;
      
      output.send("noteon", {
        note: currentLedIndex + 100, // Fader LEDs are at 100+
        velocity: velocity,
        channel: 0,
      });
      currentLedIndex++;
    }
    buttonIndex++;
  }

  // Second section: 3 faders (LEDs 5-7)
  currentRowIndex = 1;
  currentLedIndex = 5;
  buttonIndex = 0;
  endLedIndex = currentLedIndex + 3;
  
  while (currentLedIndex < endLedIndex) {
    const combinedItems = itemGroups[currentRowIndex][buttonIndex].combinedItems;
    
    for (let item = 0; item < combinedItems; item++) {
      if (currentLedIndex < endLedIndex) {
        // For Wing 3, directly control LED brightness based on isRun status
        const isRunning = itemGroups[currentRowIndex][buttonIndex].isRun === 1;
        const velocity = isRunning ? 1 : 0;
        
        output.send("noteon", {
          note: currentLedIndex + 100, // Fader LEDs are at 100+
          velocity: velocity,
          channel: 0,
        });
        currentLedIndex++;
      }
    }
    buttonIndex++;
  }
}

// Update LED feedback based on executor status and color configuration
function led_feedback(buttonIndex, ledIndex, rowIndex, itemGroups) {
  const executorItem = itemGroups[rowIndex][buttonIndex];
  const isRunning = executorItem.isRun === 1;
  const backgroundColor = executorItem.bdC;
  
  if (clientConfig.autoColor) {
    processAutoColorMode(ledIndex, isRunning, backgroundColor);
  } else {
    processManualColorMode(ledIndex, isRunning, backgroundColor);
  }
}

// Process LED feedback in auto-color mode (uses actual executor colors)
function processAutoColorMode(ledIndex, isRunning, backgroundColor) {
  let velocity = LED_COLORS.EXECUTOR_EMPTY;
  let ledChannel = CHANNEL; // Use the cached brightness value

  if (isRunning) {
    // Executor is running - use the actual background color
    velocity = getOptimizedClosestVelocity(backgroundColor);
    ledChannel = 8; // Special channel for running executors
  } else if (backgroundColor === "#3D3D3D") {
    // Empty executor - use empty color
    velocity = LED_COLORS.EXECUTOR_EMPTY;
  } else {
    // Executor exists but not running - use background color
    velocity = getOptimizedClosestVelocity(backgroundColor);
  }

  // Only update LED if values have changed
  if (ledmatrix[ledIndex] !== velocity || led_isrun[ledIndex] !== ledChannel) {
    led_isrun[ledIndex] = ledChannel;
    ledmatrix[ledIndex] = velocity;
    
    // Record LED change for adaptive frequency
    recordLedChange();
    
    // Use batched LED update for better performance
    addLedUpdate(ledIndex, velocity, ledChannel);
  }
}

// Process LED feedback in manual color mode (uses predefined colors)
function processManualColorMode(ledIndex, isRunning, backgroundColor) {
  let velocity = LED_COLORS.EXECUTOR_EMPTY;
  let ledChannel = CHANNEL; // Use the cached brightness value

  if (isRunning) {
    // Executor is running - use ON color
    velocity = LED_COLORS.EXECUTOR_ON;
    if (clientConfig.blink) {
      ledChannel = 9; // Blink channel
    }
  } else if (backgroundColor === "#3D3D3D") {
    // Empty executor - use empty color
    velocity = LED_COLORS.EXECUTOR_EMPTY;
  } else {
    // Executor exists but not running - use OFF color
    velocity = LED_COLORS.EXECUTOR_OFF;
  }

  // Only update LED if value has changed
  if (ledmatrix[ledIndex] !== velocity) {
    ledmatrix[ledIndex] = velocity;
    
    // Record LED change for adaptive frequency
    recordLedChange();
    
    // Use batched LED update for better performance
    addLedUpdate(ledIndex, velocity, ledChannel);
  }
}

// Optimized color map with pre-computed RGB values
const colorToVelocity = {
  "#000000": 0, "#1E1E1E": 1, "#7F7F7F": 2, "#FFFFFF": 3, "#FF4C4C": 4,
  "#FF0000": 5, "#590000": 6, "#190000": 7, "#FFBD6C": 8, "#FF5400": 9,
  "#591D00": 10, "#271B00": 11, "#FFFF4C": 12, "#FFFF00": 13, "#595900": 14,
  "#191900": 15, "#88FF4C": 16, "#54FF00": 17, "#1D5900": 18, "#142B00": 19,
  "#4CFF4C": 20, "#00FF00": 21, "#005900": 22, "#001900": 23, "#4CFF5E": 24,
  "#00FF19": 25, "#00590D": 26, "#001902": 27, "#4CFF88": 28, "#00FF55": 29,
  "#00591D": 30, "#001F12": 31, "#4CFFB7": 32, "#00FF99": 33, "#005935": 34,
  "#001912": 35, "#4CC3FF": 36, "#00A9FF": 37, "#004152": 38, "#001019": 39,
  "#4C88FF": 40, "#0055FF": 41, "#001D59": 42, "#000819": 43, "#4C4CFF": 44,
  "#0000FF": 45, "#000059": 46, "#000019": 47, "#874CFF": 48, "#5400FF": 49,
  "#190064": 50, "#0F0030": 51, "#FF4CFF": 52, "#FF00FF": 53, "#590059": 54,
  "#190019": 55, "#FF4C87": 56, "#FF0054": 57, "#59001D": 58, "#220013": 59,
  "#FF1500": 60, "#993500": 61, "#795100": 62, "#436400": 63, "#033900": 64,
  "#005735": 65, "#00547F": 66, "#0000FF": 67, "#00454F": 68, "#2500CC": 69,
  "#7F7F7F": 70, "#202020": 71, "#FF0000": 72, "#BDFF2D": 73, "#AFED06": 74,
  "#64FF09": 75, "#108B00": 76, "#00FF87": 77, "#00A9FF": 78, "#002AFF": 79,
  "#3F00FF": 80, "#7A00FF": 81, "#B21A7D": 82, "#402100": 83, "#FF4A00": 84,
  "#88E106": 85, "#72FF15": 86, "#00FF00": 87, "#3BFF26": 88, "#59FF71": 89,
  "#38FFCC": 90, "#5B8AFF": 91, "#3151C6": 92, "#877FE9": 93, "#D31DFF": 94,
  "#FF005D": 95, "#FF7F00": 96, "#B9B000": 97, "#90FF00": 98, "#835D07": 99,
  "#392b00": 100, "#144C10": 101, "#0D5038": 102, "#15152A": 103, "#16205A": 104,
  "#693C1C": 105, "#A8000A": 106, "#DE513D": 107, "#D86A1C": 108, "#FFE126": 109,
  "#9EE12F": 110, "#67B50F": 111, "#1E1E30": 112, "#DCFF6B": 113, "#80FFBD": 114,
  "#9A99FF": 115, "#8E66FF": 116, "#404040": 117, "#757575": 118, "#E0FFFF": 119,
  "#A00000": 120, "#350000": 121, "#1AD000": 122, "#074200": 123, "#B9B000": 124,
  "#3F3100": 125, "#B35F00": 126, "#4B1502": 127
};

// Pre-computed RGB values for faster color matching
const colorRgbCache = new Map();

// Optimized hex to RGB conversion with caching
function hexToRgb(hex) {
  if (colorRgbCache.has(hex)) {
    return colorRgbCache.get(hex);
  }
  
  if (!/^#([0-9A-F]{3}){1,2}$/i.test(hex)) {
    throw new Error("Invalid color format: " + hex);
  }
  
  const bigint = parseInt(hex.slice(1), 16);
  const rgb = {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
  
  colorRgbCache.set(hex, rgb);
  return rgb;
}

// Optimized color distance calculation
function colorDistanceManhattan(color1, color2) {
  return Math.abs(color1.r - color2.r) + Math.abs(color1.g - color2.g) + Math.abs(color1.b - color2.b);
}

// Color Matching Optimization System - Performance Optimization
const COLOR_MATCHING_CONFIG = {
  ENABLED: true,                    // Enable/disable color matching optimizations
  CACHE_SIZE: 1000,                 // Maximum number of cached color matches
  PRECISION_THRESHOLD: 5,           // Distance threshold for "close enough" matches
  EXACT_MATCH_PRIORITY: true,       // Prioritize exact matches over close ones
  USE_LOOKUP_TABLES: true,          // Use pre-computed lookup tables
  OPTIMIZE_COMMON_COLORS: true,     // Special handling for frequently used colors
  CACHE_CLEANUP_INTERVAL: 60000,    // Cache cleanup interval (ms)
};

// Color matching optimization state
let colorMatchingState = {
  matchCache: new Map(),            // Cache for color -> velocity matches
  commonColors: new Set(),          // Set of frequently used colors
  cacheHits: 0,                    // Number of cache hits
  cacheMisses: 0,                  // Number of cache misses
  totalMatches: 0,                 // Total color matches processed
  lastCacheCleanup: Date.now(),    // Last cache cleanup time
};

// Pre-computed color distance lookup table for faster matching
const COLOR_DISTANCE_LOOKUP = new Map();

// Common color patterns for optimization
const COMMON_COLORS = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", 
  "#FFFF00", "#FF00FF", "#00FFFF", "#FF8000", "#8000FF",
  "#3D3D3D", "#7F7F7F", "#404040", "#757575"
];

// Log color optimization status after configuration is defined
log(LOG_LEVELS.INFO, `🎨 Color Optimization: ${clientConfig.enableColorOptimization ? 'ENABLED' : 'DISABLED'} (${COLOR_MATCHING_CONFIG.CACHE_SIZE} cache size, ${COLOR_MATCHING_CONFIG.PRECISION_THRESHOLD} precision)`);

// Optimized closest velocity finder with early exit
function getClosestVelocity(color) {
  const targetRgb = hexToRgb(color);
  let closestColor = null;
  let closestDistance = Infinity;

  for (const [key, velocity] of Object.entries(colorToVelocity)) {
    const currentRgb = hexToRgb(key);
    const distance = colorDistanceManhattan(targetRgb, currentRgb);
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestColor = key;
      
      // Early exit if we find an exact match
      if (distance === 0) break;
    }
  }

  return colorToVelocity[closestColor];
}

// Color Matching Optimization Functions - Performance Optimization
function initializeColorMatchingOptimizations() {
  if (!COLOR_MATCHING_CONFIG.ENABLED || !clientConfig.enableColorOptimization) {
    return;
  }

  // Pre-compute distance lookup table for common colors
  if (COLOR_MATCHING_CONFIG.USE_LOOKUP_TABLES) {
    precomputeColorDistances();
  }

  // Initialize common colors set
  COMMON_COLORS.forEach(color => {
    colorMatchingState.commonColors.add(color);
  });

  // Schedule periodic cache cleanup
  setInterval(cleanupColorCache, COLOR_MATCHING_CONFIG.CACHE_CLEANUP_INTERVAL);

  log(LOG_LEVELS.DEBUG, `🎨 Color matching optimizations initialized`);
}

function precomputeColorDistances() {
  const colorKeys = Object.keys(colorToVelocity);
  
  // Pre-compute distances between all color pairs for lookup
  for (let i = 0; i < colorKeys.length; i++) {
    for (let j = i + 1; j < colorKeys.length; j++) {
      const color1 = hexToRgb(colorKeys[i]);
      const color2 = hexToRgb(colorKeys[j]);
      const distance = colorDistanceManhattan(color1, color2);
      
      const key = `${colorKeys[i]}-${colorKeys[j]}`;
      COLOR_DISTANCE_LOOKUP.set(key, distance);
    }
  }
}

function getOptimizedClosestVelocity(color) {
  if (!COLOR_MATCHING_CONFIG.ENABLED || !clientConfig.enableColorOptimization) {
    return getClosestVelocity(color); // Fallback to original function
  }

  colorMatchingState.totalMatches++;
  colorMatchingStats.totalMatches++;

  // Check cache first
  if (colorMatchingState.matchCache.has(color)) {
    colorMatchingState.cacheHits++;
    colorMatchingStats.cacheHits++;
    return colorMatchingState.matchCache.get(color);
  }

  colorMatchingState.cacheMisses++;
  colorMatchingStats.cacheMisses++;

  // Check for exact match in colorToVelocity
  if (colorToVelocity.hasOwnProperty(color)) {
    const velocity = colorToVelocity[color];
    cacheColorMatch(color, velocity);
    colorMatchingStats.exactMatches++;
    return velocity;
  }

  // Check common colors first for faster matching
  if (COLOR_MATCHING_CONFIG.OPTIMIZE_COMMON_COLORS && colorMatchingState.commonColors.has(color)) {
    const velocity = findClosestVelocityForCommonColor(color);
    cacheColorMatch(color, velocity);
    return velocity;
  }

  // Use optimized search algorithm
  const velocity = findClosestVelocityOptimized(color);
  cacheColorMatch(color, velocity);
  return velocity;
}

function findClosestVelocityForCommonColor(color) {
  const targetRgb = hexToRgb(color);
  let closestColor = null;
  let closestDistance = Infinity;

  // Search only in common colors for speed
  for (const commonColor of colorMatchingState.commonColors) {
    if (colorToVelocity.hasOwnProperty(commonColor)) {
      const currentRgb = hexToRgb(commonColor);
      const distance = colorDistanceManhattan(targetRgb, currentRgb);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestColor = commonColor;
        
        // Early exit for exact or very close matches
        if (distance <= COLOR_MATCHING_CONFIG.PRECISION_THRESHOLD) break;
      }
    }
  }

  return colorToVelocity[closestColor] || 0;
}

function findClosestVelocityOptimized(color) {
  const targetRgb = hexToRgb(color);
  let closestColor = null;
  let closestDistance = Infinity;

  // Use Object.entries for better performance
  const entries = Object.entries(colorToVelocity);
  
  for (const [key, velocity] of entries) {
    const currentRgb = hexToRgb(key);
    const distance = colorDistanceManhattan(targetRgb, currentRgb);
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestColor = key;
      
      // Early exit for exact matches
      if (distance === 0) break;
      
      // Early exit for close enough matches
      if (COLOR_MATCHING_CONFIG.PRECISION_THRESHOLD > 0 && 
          distance <= COLOR_MATCHING_CONFIG.PRECISION_THRESHOLD) {
        break;
      }
    }
  }

  return colorToVelocity[closestColor] || 0;
}

function cacheColorMatch(color, velocity) {
  // Implement LRU cache behavior
  if (colorMatchingState.matchCache.size >= COLOR_MATCHING_CONFIG.CACHE_SIZE) {
    // Remove oldest entry (first key)
    const firstKey = colorMatchingState.matchCache.keys().next().value;
    colorMatchingState.matchCache.delete(firstKey);
  }
  
  colorMatchingState.matchCache.set(color, velocity);
}

function cleanupColorCache() {
  const now = Date.now();
  if (now - colorMatchingState.lastCacheCleanup > COLOR_MATCHING_CONFIG.CACHE_CLEANUP_INTERVAL) {
    const beforeSize = colorMatchingState.matchCache.size;
    
    // Clear cache if it's getting too large
    if (colorMatchingState.matchCache.size > COLOR_MATCHING_CONFIG.CACHE_SIZE * 0.8) {
      colorMatchingState.matchCache.clear();
      log(LOG_LEVELS.DEBUG, `🎨 Color cache cleaned up: ${beforeSize} entries removed`);
    }
    
    colorMatchingState.lastCacheCleanup = now;
  }
}

// Enhanced color distance calculation with optimization
function colorDistanceOptimized(color1, color2) {
  const key = `${color1}-${color2}`;
  const reverseKey = `${color2}-${color1}`;
  
  // Check lookup table first
  if (COLOR_DISTANCE_LOOKUP.has(key)) {
    return COLOR_DISTANCE_LOOKUP.get(key);
  }
  if (COLOR_DISTANCE_LOOKUP.has(reverseKey)) {
    return COLOR_DISTANCE_LOOKUP.get(reverseKey);
  }
  
  // Fallback to calculation
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  return colorDistanceManhattan(rgb1, rgb2);
}

// Color Matching Statistics and Monitoring
let colorMatchingStats = {
  totalMatches: 0,
  cacheHits: 0,
  cacheMisses: 0,
  exactMatches: 0,
  averageMatchTime: 0,
  lastStatsTime: Date.now(),
};

function getColorMatchingStats() {
  return {
    ...colorMatchingStats,
    cacheHitRate: colorMatchingStats.totalMatches > 0 
      ? (colorMatchingStats.cacheHits / colorMatchingStats.totalMatches * 100).toFixed(1)
      : 0,
    cacheSize: colorMatchingState.matchCache.size,
    commonColorsCount: colorMatchingState.commonColors.size,
    colorConfig: COLOR_MATCHING_CONFIG,
  };
}

function logColorMatchingStats() {
  const stats = getColorMatchingStats();
  log(LOG_LEVELS.INFO, `🎨 Color Matching Stats: ${stats.totalMatches} matches, ${stats.cacheHitRate}% hit rate, ${stats.cacheSize} cached`);
}

// Initialize color matching optimizations after all functions are defined
initializeColorMatchingOptimizations();

// Initialize memory optimizations after all functions are defined
initializeMemoryOptimizations();

// Memory Optimization Functions - Performance Optimization
function initializeMemoryOptimizations() {
  if (!MEMORY_OPTIMIZATION_CONFIG.ENABLED || !clientConfig.enableMemoryOptimization) {
    return;
  }

  // Initialize memory monitoring
  if (MEMORY_OPTIMIZATION_CONFIG.MEMORY_MONITORING) {
    initializeMemoryMonitoring();
  }

  // Schedule periodic memory cleanup
  memoryOptimizationState.cleanupTimer = setInterval(performMemoryCleanup, MEMORY_OPTIMIZATION_CONFIG.CACHE_CLEANUP_INTERVAL);

  log(LOG_LEVELS.DEBUG, `💾 Memory optimizations initialized`);
}

function initializeMemoryMonitoring() {
  // Record initial memory usage
  memoryOptimizationState.memoryUsage.initial = process.memoryUsage().heapUsed;
  memoryOptimizationState.memoryUsage.current = memoryOptimizationState.memoryUsage.initial;
  memoryOptimizationState.memoryUsage.peak = memoryOptimizationState.memoryUsage.initial;
  
  // Monitor memory usage periodically
  setInterval(updateMemoryUsage, 60000); // Check every minute
}

function updateMemoryUsage() {
  const memUsage = process.memoryUsage();
  const currentUsage = memUsage.heapUsed;
  
  memoryOptimizationState.memoryUsage.current = currentUsage;
  memoryOptimizationState.memoryUsage.peak = Math.max(memoryOptimizationState.memoryUsage.peak, currentUsage);
  memoryOptimizationState.memoryUsage.lastCheck = Date.now();
}

function performMemoryCleanup() {
  if (!MEMORY_OPTIMIZATION_CONFIG.ENABLED) return;
  
  // Clean up object pools
  for (const [type, pool] of memoryOptimizationState.objectPools) {
    if (pool.length > MEMORY_OPTIMIZATION_CONFIG.OBJECT_POOL_SIZE * 0.8) {
      pool.length = Math.floor(pool.length * 0.5); // Reduce pool size
    }
  }
  
  // Clean up string cache
  if (memoryOptimizationState.stringCache.size > 1000) {
    memoryOptimizationState.stringCache.clear();
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  log(LOG_LEVELS.DEBUG, `🧹 Memory cleanup performed`);
}

function createNewObject(type) {
  switch (type) {
    case 'messageEntry':
      return { message: null, priority: 'normal', timestamp: 0 };
    case 'ledUpdate':
      return { note: 0, velocity: 0, channel: 0 };
    case 'colorMatch':
      return { color: '', velocity: 0, distance: Infinity };
    case 'activityRecord':
      return { type: '', timestamp: 0, count: 0 };
    default:
      return {};
  }
}

function resetObject(obj) {
  if (!obj) return;
  
  // Reset all properties to default values
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'number') {
        obj[key] = 0;
      } else if (typeof obj[key] === 'string') {
        obj[key] = '';
      } else if (typeof obj[key] === 'boolean') {
        obj[key] = false;
      } else if (Array.isArray(obj[key])) {
        obj[key].length = 0;
      } else if (typeof obj[key] === 'object') {
        resetObject(obj[key]);
      }
    }
  }
}

function getOptimizedArray(size, defaultValue = 0) {
  if (!MEMORY_OPTIMIZATION_CONFIG.ARRAY_OPTIMIZATION) {
    return new Array(size).fill(defaultValue);
  }
  
  return MEMORY_EFFICIENT_ARRAYS.createOptimizedArray(size, defaultValue);
}

function getCachedString(str) {
  if (!MEMORY_OPTIMIZATION_CONFIG.COMPRESS_STRINGS) {
    return str;
  }
  
  if (memoryOptimizationState.stringCache.has(str)) {
    return memoryOptimizationState.stringCache.get(str);
  }
  
  memoryOptimizationState.stringCache.set(str, str);
  return str;
}

function optimizeArraySizes() {
  // Replace large arrays with optimized versions
  if (MEMORY_OPTIMIZATION_CONFIG.ARRAY_OPTIMIZATION) {
    // Optimize faderValue array - only keep necessary values
    const optimizedFaderValue = new Array(128);
    for (let i = 0; i < 128; i++) {
      optimizedFaderValue[i] = i / 127; // Linear interpolation
    }
    return optimizedFaderValue;
  }
  
  return faderValue;
}

// Memory Statistics and Monitoring
let memoryOptimizationStats = {
  objectsPooled: 0,
  objectsReused: 0,
  stringsCached: 0,
  memorySaved: 0,
  cleanupCycles: 0,
  lastStatsTime: Date.now(),
};

function getMemoryOptimizationStats() {
  const memUsage = process.memoryUsage();
  const currentUsage = memUsage.heapUsed;
  const initialUsage = memoryOptimizationState.memoryUsage.initial;
  
  return {
    ...memoryOptimizationStats,
    currentMemoryUsage: currentUsage,
    memoryReduction: initialUsage > 0 ? ((initialUsage - currentUsage) / initialUsage * 100).toFixed(1) : 0,
    peakMemoryUsage: memoryOptimizationState.memoryUsage.peak,
    objectPoolsCount: memoryOptimizationState.objectPools.size,
    stringCacheSize: memoryOptimizationState.stringCache.size,
    memoryConfig: MEMORY_OPTIMIZATION_CONFIG,
  };
}

function logMemoryOptimizationStats() {
  const stats = getMemoryOptimizationStats();
  const memoryReduction = stats.memoryReduction;
  log(LOG_LEVELS.INFO, `💾 Memory Optimization Stats: ${memoryReduction}% reduction, ${stats.objectsReused} objects reused, ${stats.stringsCached} strings cached`);
}
