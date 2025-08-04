// Performance Optimization Modules - Main Index
// Exports all performance optimization systems for easy importing

const ledBatching = require('./led-batching');
const midiThrottling = require('./midi-throttling');
const adaptiveFrequency = require('./adaptive-frequency');
const colorMatching = require('./color-matching');
const memoryOptimization = require('./memory-optimization');

// Export all performance modules
module.exports = {
  // LED Batching System
  ledBatching: {
    config: ledBatching.LED_BATCH_CONFIG,
    state: ledBatching.ledBatchState,
    stats: ledBatching.ledBatchStats,
    addLedUpdate: ledBatching.addLedUpdate,
    sendLedBatch: ledBatching.sendLedBatch,
    flushLedBatch: ledBatching.flushLedBatch,
    getLedBatchStats: ledBatching.getLedBatchStats,
    logLedBatchStats: ledBatching.logLedBatchStats,
  },

  // MIDI Throttling System
  midiThrottling: {
    config: midiThrottling.MIDI_THROTTLE_CONFIG,
    state: midiThrottling.midiThrottleState,
    stats: midiThrottling.midiThrottleStats,
    addMidiMessage: midiThrottling.addMidiMessage,
    startMidiThrottling: midiThrottling.startMidiThrottling,
    processMidiQueue: midiThrottling.processMidiQueue,
    flushMidiQueue: midiThrottling.flushMidiQueue,
    getMidiThrottleStats: midiThrottling.getMidiThrottleStats,
    logMidiThrottleStats: midiThrottling.logMidiThrottleStats,
  },

  // Adaptive WebSocket Frequency System
  adaptiveFrequency: {
    config: adaptiveFrequency.WEBSOCKET_FREQUENCY_CONFIG,
    state: adaptiveFrequency.websocketFrequencyState,
    stats: adaptiveFrequency.websocketFrequencyStats,
    recordActivity: adaptiveFrequency.recordActivity,
    recordLedChange: adaptiveFrequency.recordLedChange,
    enterBurstMode: adaptiveFrequency.enterBurstMode,
    exitBurstMode: adaptiveFrequency.exitBurstMode,
    enterActiveMode: adaptiveFrequency.enterActiveMode,
    enterIdleMode: adaptiveFrequency.enterIdleMode,
    updateInterval: adaptiveFrequency.updateInterval,
    startInterval: adaptiveFrequency.startInterval,
    getWebsocketFrequencyStats: adaptiveFrequency.getWebsocketFrequencyStats,
    logWebsocketFrequencyStats: adaptiveFrequency.logWebsocketFrequencyStats,
    updateStats: adaptiveFrequency.updateStats,
  },

  // Color Matching Optimization System
  colorMatching: {
    config: colorMatching.COLOR_MATCHING_CONFIG,
    state: colorMatching.colorMatchingState,
    stats: colorMatching.colorMatchingStats,
    colorToVelocity: colorMatching.colorToVelocity,
    colorRgbCache: colorMatching.colorRgbCache,
    hexToRgb: colorMatching.hexToRgb,
    colorDistanceManhattan: colorMatching.colorDistanceManhattan,
    getClosestVelocity: colorMatching.getClosestVelocity,
    initializeColorMatchingOptimizations: colorMatching.initializeColorMatchingOptimizations,
    precomputeColorDistances: colorMatching.precomputeColorDistances,
    getOptimizedClosestVelocity: colorMatching.getOptimizedClosestVelocity,
    findClosestVelocityForCommonColor: colorMatching.findClosestVelocityForCommonColor,
    findClosestVelocityOptimized: colorMatching.findClosestVelocityOptimized,
    cacheColorMatch: colorMatching.cacheColorMatch,
    cleanupColorCache: colorMatching.cleanupColorCache,
    colorDistanceOptimized: colorMatching.colorDistanceOptimized,
    getColorMatchingStats: colorMatching.getColorMatchingStats,
    logColorMatchingStats: colorMatching.logColorMatchingStats,
  },

  // Memory Optimization System
  memoryOptimization: {
    config: memoryOptimization.MEMORY_OPTIMIZATION_CONFIG,
    state: memoryOptimization.memoryOptimizationState,
    stats: memoryOptimization.memoryOptimizationStats,
    efficientArrays: memoryOptimization.MEMORY_EFFICIENT_ARRAYS,
    initializeMemoryOptimizations: memoryOptimization.initializeMemoryOptimizations,
    initializeMemoryMonitoring: memoryOptimization.initializeMemoryMonitoring,
    updateMemoryUsage: memoryOptimization.updateMemoryUsage,
    performMemoryCleanup: memoryOptimization.performMemoryCleanup,
    createNewObject: memoryOptimization.createNewObject,
    resetObject: memoryOptimization.resetObject,
    getOptimizedArray: memoryOptimization.getOptimizedArray,
    getCachedString: memoryOptimization.getCachedString,
    optimizeArraySizes: memoryOptimization.optimizeArraySizes,
    getMemoryOptimizationStats: memoryOptimization.getMemoryOptimizationStats,
    logMemoryOptimizationStats: memoryOptimization.logMemoryOptimizationStats,
  },

  // Initialize all performance optimizations
  initializeAll: function(clientConfig, log) {
    // Initialize each optimization system
    colorMatching.initializeColorMatchingOptimizations(clientConfig);
    memoryOptimization.initializeMemoryOptimizations(clientConfig);
    
    // Log initialization status
    if (log) {
      log(2, `⚡ LED Batching: ${clientConfig.enableLedBatching ? 'ENABLED' : 'DISABLED'} (${ledBatching.LED_BATCH_CONFIG.BATCH_DELAY}ms delay, max ${ledBatching.LED_BATCH_CONFIG.MAX_BATCH_SIZE} updates)`);
      log(2, `🎹 MIDI Throttling: ${clientConfig.enableMidiThrottling ? 'ENABLED' : 'DISABLED'} (${midiThrottling.MIDI_THROTTLE_CONFIG.MAX_MESSAGES_PER_SECOND}/s max, ${midiThrottling.MIDI_THROTTLE_CONFIG.THROTTLE_DELAY}ms delay)`);
      log(2, `🌍 Adaptive Frequency: ${clientConfig.enableAdaptiveFrequency ? 'ENABLED' : 'DISABLED'} (${adaptiveFrequency.WEBSOCKET_FREQUENCY_CONFIG.ACTIVE_INTERVAL}ms active, ${adaptiveFrequency.WEBSOCKET_FREQUENCY_CONFIG.IDLE_INTERVAL}ms idle)`);
      log(2, `🎨 Color Optimization: ${clientConfig.enableColorOptimization ? 'ENABLED' : 'DISABLED'} (${colorMatching.COLOR_MATCHING_CONFIG.CACHE_SIZE} cache size, ${colorMatching.COLOR_MATCHING_CONFIG.PRECISION_THRESHOLD} precision)`);
      log(2, `💾 Memory Optimization: ${clientConfig.enableMemoryOptimization ? 'ENABLED' : 'DISABLED'} (${memoryOptimization.MEMORY_OPTIMIZATION_CONFIG.OBJECT_POOL_SIZE} pool size, ${memoryOptimization.MEMORY_OPTIMIZATION_CONFIG.CACHE_CLEANUP_INTERVAL/1000}s cleanup)`);
    }
  },

  // Get all statistics
  getAllStats: function() {
    return {
      ledBatching: ledBatching.getLedBatchStats(),
      midiThrottling: midiThrottling.getMidiThrottleStats(),
      adaptiveFrequency: adaptiveFrequency.getWebsocketFrequencyStats(),
      colorMatching: colorMatching.getColorMatchingStats(),
      memoryOptimization: memoryOptimization.getMemoryOptimizationStats(),
    };
  },

  // Log all statistics
  logAllStats: function(log) {
    ledBatching.logLedBatchStats(log);
    midiThrottling.logMidiThrottleStats(log);
    adaptiveFrequency.logWebsocketFrequencyStats(log);
    colorMatching.logColorMatchingStats(log);
    memoryOptimization.logMemoryOptimizationStats(log);
  },
}; 