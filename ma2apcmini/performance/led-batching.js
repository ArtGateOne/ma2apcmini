// LED Batching System - Performance Optimization Module
// Handles batching of LED updates to reduce MIDI traffic

const logger = require('./logger');
const { LOG_LEVELS } = logger;

// LED Batching Configuration
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

// LED Batching Statistics and Monitoring
let ledBatchStats = {
  totalUpdates: 0,
  totalBatches: 0,
  totalBatchTime: 0,
  averageBatchSize: 0,
  lastStatsTime: Date.now(),
};

// LED Batching Functions
function addLedUpdate(note, velocity, channel, output, clientConfig) {
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
    sendLedBatch(output);
    return;
  }

  // Set timer for delayed batch send if not already set
  if (!ledBatchState.batchTimer) {
    ledBatchState.batchTimer = setTimeout(() => {
      sendLedBatch(output);
    }, LED_BATCH_CONFIG.BATCH_DELAY);
  }
}

function sendLedBatch(output) {
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
}

function flushLedBatch(output) {
  if (ledBatchState.batchTimer) {
    clearTimeout(ledBatchState.batchTimer);
    ledBatchState.batchTimer = null;
  }
  sendLedBatch(output);
}

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
  logger.logInfo(`⚡ LED Batching Stats: ${stats.totalUpdates} updates, ${stats.totalBatches} batches, avg size: ${stats.averageBatchSize.toFixed(1)}`);
}

// Export functions and configuration
module.exports = {
  LED_BATCH_CONFIG,
  ledBatchState,
  ledBatchStats,
  addLedUpdate,
  sendLedBatch,
  flushLedBatch,
  getLedBatchStats,
  logLedBatchStats,
}; 