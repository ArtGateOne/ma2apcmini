// Color Matching Optimization System - Performance Optimization Module
// Handles optimized color matching with caching and lookup tables

const logger = require('./logger');
const { LOG_LEVELS } = logger;

// Color Matching Optimization Configuration
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
  cacheHits: 0,                     // Number of cache hits
  cacheMisses: 0,                   // Number of cache misses
  totalMatches: 0,                  // Total color matches processed
  lastCacheCleanup: Date.now(),     // Last cache cleanup time
};

// Pre-computed color distance lookup table for faster matching
const COLOR_DISTANCE_LOOKUP = new Map();

// Common color patterns for optimization
const COMMON_COLORS = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", 
  "#FFFF00", "#FF00FF", "#00FFFF", "#FF8000", "#8000FF",
  "#3D3D3D", "#7F7F7F", "#404040", "#757575"
];

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

// Color Matching Statistics and Monitoring
let colorMatchingStats = {
  totalMatches: 0,
  cacheHits: 0,
  cacheMisses: 0,
  exactMatches: 0,
  averageMatchTime: 0,
  lastStatsTime: Date.now(),
};

// Color Matching Functions
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

function colorDistanceManhattan(color1, color2) {
  return Math.abs(color1.r - color2.r) + Math.abs(color1.g - color2.g) + Math.abs(color1.b - color2.b);
}

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

function initializeColorMatchingOptimizations(clientConfig) {
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

function getOptimizedClosestVelocity(color, clientConfig) {
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

  // Search in the entire colorToVelocity map to find the closest match
  for (const [key, velocity] of Object.entries(colorToVelocity)) {
    const currentRgb = hexToRgb(key);
    const distance = colorDistanceManhattan(targetRgb, currentRgb);
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestColor = key;
      
      // Early exit for exact or very close matches
      if (distance <= COLOR_MATCHING_CONFIG.PRECISION_THRESHOLD) break;
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
    }
    
    colorMatchingState.lastCacheCleanup = now;
  }
}

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
  logger.logInfo(`🎨 Color Matching Stats: ${stats.totalMatches} matches, ${stats.cacheHitRate}% hit rate, ${stats.cacheSize} cached`);
}

// Export functions and configuration
module.exports = {
  COLOR_MATCHING_CONFIG,
  colorMatchingState,
  colorMatchingStats,
  colorToVelocity,
  colorRgbCache,
  hexToRgb,
  colorDistanceManhattan,
  getClosestVelocity,
  initializeColorMatchingOptimizations,
  precomputeColorDistances,
  getOptimizedClosestVelocity,
  findClosestVelocityForCommonColor,
  findClosestVelocityOptimized,
  cacheColorMatch,
  cleanupColorCache,
  colorDistanceOptimized,
  getColorMatchingStats,
  logColorMatchingStats,
}; 