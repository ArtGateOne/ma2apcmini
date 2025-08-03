//ma2apcmini mk2 v 1.7.8 color v4 - by ArtGateOne (edits by Local-9) - OPTIMIZED
const easymidi = require("easymidi");
const W3CWebSocket = require("websocket").w3cwebsocket;
const crypto = require("crypto");

// Import performance optimization modules
const performance = require('./performance');

// ============================================================================
// USER CONFIGURATION SECTION - MODIFY THESE SETTINGS AS NEEDED
// ============================================================================
// 
// AUTHENTICATION SETUP:
// 1. Set your GrandMA2 Web Remote username and password below
// 2. The password will be automatically MD5 hashed when sent to GrandMA2
// 3. Make sure your GrandMA2 Web Remote is enabled with the same credentials
// 4. Default credentials: username="apcmini", password="remote"
//

/**
 * User-configurable settings for APC mini MA2 integration
 * @typedef {Object} ClientConfig
 * @property {string} username - GrandMA2 Web Remote username
 * @property {string} password - GrandMA2 Web Remote password (will be automatically MD5 hashed)
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
  // Authentication configuration
  username: "apcmini",
  password: "remote", // This will be automatically MD5 hashed when sent to GrandMA2
  
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

// Connection Configuration
const WS_URL = "localhost"; // Change localhost to your console IP address

// Hardware Configuration
const MIDI_IN_DEVICE = "APC mini mk2"; // MIDI input device name
const MIDI_OUT_DEVICE = "APC mini mk2"; // MIDI output device name
const WING_CONFIGURATION = 1; // Wing configuration: 1, 2, or 3

// LED Configuration
const TOTAL_LEDS = 119;                   // Total number of LEDs on APC mini
const FADER_LED_OFFSET = 100;             // Starting LED index for fader buttons
const PAGE_SELECT_START = 112;            // Starting LED index for page select buttons
const PAGE_SELECT_END = 119;              // Ending LED index for page select buttons
const SHIFT_BUTTON = 122;                 // LED index for shift button

// MIDI Configuration
const FADER_CONTROLLER_START = 48;        // Starting MIDI controller number for faders
const FADER_CONTROLLER_END = 56;          // Ending MIDI controller number for faders
const MAIN_FADER_CONTROLLER = 56;         // MIDI controller number for main fader
const SPECIAL_MASTER_MULTIPLIER = 100;    // Multiplier for SpecialMaster 2.1 values
const SPECIAL_MASTER_3_MULTIPLIER = 225;  // Multiplier for SpecialMaster 3.1 values

// Button Ranges (MIDI note numbers)
const FADER_BUTTON_START = 100;           // Starting MIDI note for fader buttons
const FADER_BUTTON_END = 107;             // Ending MIDI note for fader buttons
const EXECUTOR_BUTTON_START = 16;         // Starting MIDI note for executor buttons
const EXECUTOR_BUTTON_END = 63;           // Ending MIDI note for executor buttons
const SMALL_BUTTON_START = 0;             // Starting MIDI note for small buttons
const SMALL_BUTTON_END = 15;              // Ending MIDI note for small buttons

// Timing Configuration
const INITIALIZATION_DELAY = 1000;        // Delay before initialization (milliseconds)
const INTERVAL_DELAY = 100;               // Interval between WebSocket requests (milliseconds)
const REQUEST_THRESHOLD = 9;              // Maximum requests before session refresh

// LED Color Configuration (MIDI velocity values for APC mini)
let LED_COLORS = {
  EXECUTOR_EMPTY: 0,      // Color for empty executor buttons (MIDI velocity 0)
  EXECUTOR_OFF: 9,        // Color for executor buttons that are off (MIDI velocity 9)
  EXECUTOR_ON: 21,        // Color for executor buttons that are on (MIDI velocity 21)
  FADER_BUTTON_EMPTY: 0,  // Color for empty fader buttons (MIDI velocity 0)
  FADER_BUTTON_OFF: 5,    // Color for fader buttons that are off (MIDI velocity 5)
  FADER_BUTTON_ON: 21,    // Color for fader buttons that are on (MIDI velocity 21)
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

// ============================================================================
// END USER CONFIGURATION SECTION
// ============================================================================

// Global variables (needed for modular functions)
let input, output;

// Logging system with levels
// Import logger module
const logger = require('./performance/logger');
const { LOG_LEVELS, log } = logger;

// Password hashing function for GrandMA2 Web Remote authentication
// Note: "remote" hashes to "2c18e486683a3db1e645ad8523223b72"
function hashPassword(password) {
  return crypto.createHash('md5').update(password).digest('hex');
}

let client = new W3CWebSocket(`ws://${WS_URL}:80/`);

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

// LED Batching Functions - Performance Optimization (Modular)
function addLedUpdate(note, velocity, channel) {
  performance.ledBatching.addLedUpdate(note, velocity, channel, output, clientConfig);
}

function sendLedBatch() {
  performance.ledBatching.sendLedBatch(output);
}

function flushLedBatch() {
  performance.ledBatching.flushLedBatch(output);
}

function getLedBatchStats() {
  return performance.ledBatching.getLedBatchStats();
}

function logLedBatchStats() {
  performance.ledBatching.logLedBatchStats();
}

// MIDI Message Throttling Functions - Performance Optimization (Modular)
function addMidiMessage(message, priority = 'normal') {
  performance.midiThrottling.addMidiMessage(message, priority, client, clientConfig, performance.memoryOptimization);
}

function startMidiThrottling() {
  performance.midiThrottling.startMidiThrottling(client);
}

function processMidiQueue() {
  performance.midiThrottling.processMidiQueue(client);
}

function flushMidiQueue() {
  performance.midiThrottling.flushMidiQueue(client);
}

function getMidiThrottleStats() {
  return performance.midiThrottling.getMidiThrottleStats();
}

function logMidiThrottleStats() {
  performance.midiThrottling.logMidiThrottleStats();
}

// Adaptive WebSocket Frequency Functions - Performance Optimization (Modular)
function recordActivity(activityType = 'user') {
  performance.adaptiveFrequency.recordActivity(activityType, clientConfig);
}

function recordLedChange() {
  performance.adaptiveFrequency.recordLedChange(clientConfig);
}

function enterBurstMode() {
  performance.adaptiveFrequency.enterBurstMode();
}

function exitBurstMode() {
  performance.adaptiveFrequency.exitBurstMode();
}

function enterActiveMode() {
  performance.adaptiveFrequency.enterActiveMode();
}

function enterIdleMode() {
  performance.adaptiveFrequency.enterIdleMode();
}

function updateInterval() {
  performance.adaptiveFrequency.updateInterval();
}

function startInterval() {
  performance.adaptiveFrequency.startInterval(interval);
}

function getWebsocketFrequencyStats() {
  return performance.adaptiveFrequency.getWebsocketFrequencyStats();
}

function logWebsocketFrequencyStats() {
  performance.adaptiveFrequency.logWebsocketFrequencyStats();
}



// Cache frequently used values
const CHANNEL = clientConfig.brightness;
const NS_PER_SEC = 1e9;
const FADER_THROTTLE_TIME = 50000000; // 50ms in nanoseconds

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
let interval_on = false;
let session = 0;

// Initialize LED matrix based on wing configuration
let ledmatrix = performance.memoryOptimization.getOptimizedArray(TOTAL_LEDS, 0);
let led_isrun = performance.memoryOptimization.getOptimizedArray(TOTAL_LEDS, 2);

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
let faderTime = performance.memoryOptimization.getOptimizedArray(10, 0);

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
  if (performance.ledBatching.state.pendingUpdates.size > 0) {
    flushLedBatch();
  }
  
  // Log batching stats every 100 intervals (10 seconds)
  if (request % 100 === 0 && performance.ledBatching.stats.totalBatches > 0) {
    logLedBatchStats();
  }
  
  // Log MIDI throttling stats every 200 intervals (20 seconds)
  if (request % 200 === 0 && performance.midiThrottling.stats.totalMessages > 0) {
    logMidiThrottleStats();
  }
  
  // Log WebSocket frequency stats every 300 intervals (30 seconds)
  if (request % 300 === 0 && performance.adaptiveFrequency.stats.totalRequests > 0) {
    logWebsocketFrequencyStats();
  }
  
  // Log color matching stats every 400 intervals (40 seconds)
  if (request % 400 === 0 && performance.colorMatching.stats.totalMatches > 0) {
    logColorMatchingStats();
  }
  
  // Log memory optimization stats every 500 intervals (50 seconds)
  if (request % 500 === 0 && performance.memoryOptimization.stats.objectsPooled > 0) {
    logMemoryOptimizationStats();
  }
  
  // Periodic flush of MIDI queue to ensure no messages get stuck
  if (performance.midiThrottling.state.priorityQueue.length > 0 || performance.midiThrottling.state.normalQueue.length > 0) {
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


// Display all midi devices
log(LOG_LEVELS.DEBUG, "Midi IN");
log(LOG_LEVELS.DEBUG, easymidi.getInputs());
log(LOG_LEVELS.DEBUG, "Midi OUT");
log(LOG_LEVELS.DEBUG, easymidi.getOutputs());

log(LOG_LEVELS.INFO, `🎹 Connecting to MIDI device ${MIDI_IN_DEVICE}`);

// Open midi device with error handling
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
          username: clientConfig.username,
          password: hashPassword(clientConfig.password),
          session: session,
          maxRequests: 10
        }));
        return;
      }

      if (obj.responseType === "login" && obj.result === true) {
        if (!interval_on) {
          interval_on = true;
          // Start fixed interval system for now
          setInterval(interval, INTERVAL_DELAY);
          log(LOG_LEVELS.INFO, `🌍 Started fixed WebSocket frequency (${INTERVAL_DELAY}ms)`);
        }
        log(LOG_LEVELS.INFO, "✅ ...LOGGED");
        log(LOG_LEVELS.INFO, `🔑 SESSION ${session}`);
        connectionState.isConnected = true; // Mark as connected after successful login
        return;
      }

            // Only check connection state for non-login messages
      if (!connectionState.isConnected) {
        log(LOG_LEVELS.WARN, `⚠️ Received message but not connected (${obj.responseType || 'unknown'}), ignoring`);
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
          log(LOG_LEVELS.ERROR, `🔐 Please turn on Web Remote, and set Web Remote password to "${clientConfig.password}"`);
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

// Color matching functions are now handled by modular system
function getClosestVelocity(color) {
  return performance.colorMatching.getClosestVelocity(color);
}

function getOptimizedClosestVelocity(color) {
  return performance.colorMatching.getOptimizedClosestVelocity(color, clientConfig);
}

function hexToRgb(hex) {
  return performance.colorMatching.hexToRgb(hex);
}

function colorDistanceManhattan(color1, color2) {
  return performance.colorMatching.colorDistanceManhattan(color1, color2);
}

function getColorMatchingStats() {
  return performance.colorMatching.getColorMatchingStats();
}

function logColorMatchingStats() {
  performance.colorMatching.logColorMatchingStats();
}

// Initialize all performance optimizations
performance.initializeAll(clientConfig, log);

// Log authentication configuration
log(LOG_LEVELS.INFO, `🔐 Authentication configured: username="${clientConfig.username}", password="[HIDDEN]"`);

// Memory Optimization Functions - Performance Optimization
// Memory optimization functions are now handled by modular system
function getMemoryOptimizationStats() {
  return performance.memoryOptimization.getMemoryOptimizationStats();
}

function logMemoryOptimizationStats() {
  performance.memoryOptimization.logMemoryOptimizationStats();
}
