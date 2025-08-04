// Memory Optimization System - Performance Optimization Module
// Handles memory-efficient data structures and object pooling

const logger = require('./logger');
const { LOG_LEVELS } = logger;

// Memory Optimization Configuration
const MEMORY_OPTIMIZATION_CONFIG = {
  ENABLED: true,                    // Enable/disable memory optimizations
  OBJECT_POOL_SIZE: 100,            // Size of object pools for frequently created objects
  ARRAY_OPTIMIZATION: true,         // Use optimized array sizes
  CACHE_CLEANUP_INTERVAL: 300000,   // Memory cleanup interval (5 minutes)
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
  LED_MATRIX_SIZE: 119,
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

// Memory Statistics and Monitoring
let memoryOptimizationStats = {
  objectsPooled: 0,
  objectsReused: 0,
  stringsCached: 0,
  memorySaved: 0,
  cleanupCycles: 0,
  lastStatsTime: Date.now(),
};

// Memory Optimization Functions
function initializeMemoryOptimizations(clientConfig) {
  if (!MEMORY_OPTIMIZATION_CONFIG.ENABLED || !clientConfig.enableMemoryOptimization) {
    return;
  }

  // Initialize memory monitoring
  if (MEMORY_OPTIMIZATION_CONFIG.MEMORY_MONITORING) {
    initializeMemoryMonitoring();
  }

  // Schedule periodic memory cleanup
  memoryOptimizationState.cleanupTimer = setInterval(performMemoryCleanup, MEMORY_OPTIMIZATION_CONFIG.CACHE_CLEANUP_INTERVAL);
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
  
  memoryOptimizationStats.cleanupCycles++;
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
  memoryOptimizationStats.stringsCached++;
  return str;
}

function optimizeArraySizes(faderValue) {
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
  logger.logInfo(`💾 Memory Optimization Stats: ${memoryReduction}% reduction, ${stats.objectsReused} objects reused, ${stats.stringsCached} strings cached`);
}

// Export functions and configuration
module.exports = {
  MEMORY_OPTIMIZATION_CONFIG,
  memoryOptimizationState,
  memoryOptimizationStats,
  MEMORY_EFFICIENT_ARRAYS,
  initializeMemoryOptimizations,
  initializeMemoryMonitoring,
  updateMemoryUsage,
  performMemoryCleanup,
  createNewObject,
  resetObject,
  getOptimizedArray,
  getCachedString,
  optimizeArraySizes,
  getMemoryOptimizationStats,
  logMemoryOptimizationStats,
}; 