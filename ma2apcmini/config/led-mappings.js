// LED-to-Executor Mapping Configuration
// This file defines the mapping between APC mini LED indices and GrandMA2 executors
// Each LED maps to a specific executor with its row and button position in itemGroups

// Wing 1 Configuration (Standard APC mini layout)
// Executor-to-LED mapping for easier lookup
// In grandMA2, the executors number is indexed one higher than the mapping here
// So executor 101 is mapped 100, which is LED 56, etc.
const WING1_EXECUTOR_MAPPING = {
  // Row 1 executors (100-107)
  100: { ledIndex: 56, row: 0, button: 0, description: "Row 1, Button 1" },
  101: { ledIndex: 57, row: 0, button: 1, description: "Row 1, Button 2" },
  102: { ledIndex: 58, row: 0, button: 2, description: "Row 1, Button 3" },
  103: { ledIndex: 59, row: 0, button: 3, description: "Row 1, Button 4" },
  104: { ledIndex: 60, row: 0, button: 4, description: "Row 1, Button 5" },
  105: { ledIndex: 61, row: 1, button: 0, description: "Row 1, Button 6" },
  106: { ledIndex: 62, row: 1, button: 1, description: "Row 1, Button 7" },
  107: { ledIndex: 63, row: 1, button: 2, description: "Row 1, Button 8" },

  // Row 2 executors (108-115)
  108: { ledIndex: 48, row: 3, button: 0, description: "Row 2, Button 1" },
  109: { ledIndex: 49, row: 3, button: 1, description: "Row 2, Button 2" },
  110: { ledIndex: 50, row: 3, button: 2, description: "Row 2, Button 3" },
  111: { ledIndex: 51, row: 3, button: 3, description: "Row 2, Button 4" },
  112: { ledIndex: 52, row: 3, button: 4, description: "Row 2, Button 5" },
  113: { ledIndex: 53, row: 4, button: 0, description: "Row 2, Button 6" },
  114: { ledIndex: 54, row: 4, button: 1, description: "Row 2, Button 7" },
  115: { ledIndex: 55, row: 4, button: 2, description: "Row 2, Button 8" },

  // Row 3 executors (116-123)
  116: { ledIndex: 40, row: 6, button: 0, description: "Row 3, Button 1" },
  117: { ledIndex: 41, row: 6, button: 1, description: "Row 3, Button 2" },
  118: { ledIndex: 42, row: 6, button: 2, description: "Row 3, Button 3" },
  119: { ledIndex: 43, row: 6, button: 3, description: "Row 3, Button 4" },
  120: { ledIndex: 44, row: 6, button: 4, description: "Row 3, Button 5" },
  121: { ledIndex: 45, row: 7, button: 0, description: "Row 3, Button 6" },
  122: { ledIndex: 46, row: 7, button: 1, description: "Row 3, Button 7" },
  123: { ledIndex: 47, row: 7, button: 2, description: "Row 3, Button 8" },

  // Row 4 executors (124-131)
  124: { ledIndex: 32, row: 9, button: 0, description: "Row 4, Button 1" },
  125: { ledIndex: 33, row: 9, button: 1, description: "Row 4, Button 2" },
  126: { ledIndex: 34, row: 9, button: 2, description: "Row 4, Button 3" },
  127: { ledIndex: 35, row: 9, button: 3, description: "Row 4, Button 4" },
  128: { ledIndex: 36, row: 9, button: 4, description: "Row 4, Button 5" },
  129: { ledIndex: 37, row: 10, button: 0, description: "Row 4, Button 6" },
  130: { ledIndex: 38, row: 10, button: 1, description: "Row 4, Button 7" },
  131: { ledIndex: 39, row: 10, button: 2, description: "Row 4, Button 8" },

  // Row 5 executors (132-139)
  132: { ledIndex: 24, row: 12, button: 0, description: "Row 5, Button 1" },
  133: { ledIndex: 25, row: 12, button: 1, description: "Row 5, Button 2" },
  134: { ledIndex: 26, row: 12, button: 2, description: "Row 5, Button 3" },
  135: { ledIndex: 27, row: 12, button: 3, description: "Row 5, Button 4" },
  136: { ledIndex: 28, row: 12, button: 4, description: "Row 5, Button 5" },
  137: { ledIndex: 29, row: 13, button: 0, description: "Row 5, Button 6" },
  138: { ledIndex: 30, row: 13, button: 1, description: "Row 5, Button 7" },
  139: { ledIndex: 31, row: 13, button: 2, description: "Row 5, Button 8" },

  // Row 6 executors (140-147)
  140: { ledIndex: 16, row: 15, button: 0, description: "Row 6, Button 1" },
  141: { ledIndex: 17, row: 15, button: 1, description: "Row 6, Button 2" },
  142: { ledIndex: 18, row: 15, button: 2, description: "Row 6, Button 3" },
  143: { ledIndex: 19, row: 15, button: 3, description: "Row 6, Button 4" },
  144: { ledIndex: 20, row: 15, button: 4, description: "Row 6, Button 5" },
  145: { ledIndex: 21, row: 16, button: 0, description: "Row 6, Button 6" },
  146: { ledIndex: 22, row: 16, button: 1, description: "Row 6, Button 7" },
  147: { ledIndex: 23, row: 16, button: 2, description: "Row 6, Button 8" },

  // Fader executors (148-155)
  148: { ledIndex: 0, row: 0, button: 0, description: "Fader 1" },
  149: { ledIndex: 1, row: 0, button: 1, description: "Fader 2" },
  150: { ledIndex: 2, row: 0, button: 2, description: "Fader 3" },
  151: { ledIndex: 3, row: 0, button: 3, description: "Fader 4" },
  152: { ledIndex: 4, row: 0, button: 4, description: "Fader 5" },
  153: { ledIndex: 5, row: 1, button: 0, description: "Fader 6" },
  154: { ledIndex: 6, row: 1, button: 1, description: "Fader 7" },
  155: { ledIndex: 7, row: 1, button: 2, description: "Fader 8" }
};

// Reverse mapping for LED-to-executor lookup (for backward compatibility)
const WING1_LED_MAPPING = {};
Object.entries(WING1_EXECUTOR_MAPPING).forEach(([executor, data]) => {
  WING1_LED_MAPPING[data.ledIndex] = {
    executor: parseInt(executor),
    row: data.row,
    button: data.button,
    description: data.description
  };
});

// Wing 2 Configuration (Different layout)
const WING2_EXECUTOR_MAPPING = {
  // Add Wing 2 specific mappings here
  // This would be different based on the Wing 2 layout
};

const WING2_LED_MAPPING = {};

// Wing 3 Configuration (Different layout)
const WING3_EXECUTOR_MAPPING = {
  // Add Wing 3 specific mappings here
  // This would be different based on the Wing 3 layout
};

const WING3_LED_MAPPING = {};

// Helper function to get the appropriate mapping based on wing configuration
function getLedMapping(wingConfig) {
  switch (wingConfig) {
    case 1:
      return WING1_LED_MAPPING;
    case 2:
      return WING2_LED_MAPPING;
    case 3:
      return WING3_LED_MAPPING;
    default:
      return WING1_LED_MAPPING;
  }
}

// Helper function to get the appropriate executor mapping based on wing configuration
function getExecutorMapping(wingConfig) {
  switch (wingConfig) {
    case 1:
      return WING1_EXECUTOR_MAPPING;
    case 2:
      return WING2_EXECUTOR_MAPPING;
    case 3:
      return WING3_EXECUTOR_MAPPING;
    default:
      return WING1_EXECUTOR_MAPPING;
  }
}

// Helper function to get LED index for a specific executor
function getLedForExecutor(executor, wingConfig) {
  const executorMapping = getExecutorMapping(wingConfig);
  const mapping = executorMapping[executor];
  return mapping ? mapping.ledIndex : null;
}

// Helper function to get all LEDs for a range of executors (useful for combined items)
function getLedsForExecutorRange(startExecutor, endExecutor, wingConfig) {
  const executorMapping = getExecutorMapping(wingConfig);
  const leds = [];
  
  for (let executor = startExecutor; executor <= endExecutor; executor++) {
    const mapping = executorMapping[executor];
    if (mapping) {
      leds.push({
        executor: executor,
        ledIndex: mapping.ledIndex,
        row: mapping.row,
        button: mapping.button,
        description: mapping.description
      });
    }
  }
  
  return leds;
}

// Helper function to get executor data for a specific LED
function getExecutorData(ledIndex, wingConfig, itemGroups) {
  const mapping = getLedMapping(wingConfig);
  const ledMapping = mapping[ledIndex];
  
  if (!ledMapping || ledMapping.executor === null) {
    return null; // No mapping for this LED (e.g., debug keys)
  }
  
  // First, check if this LED should inherit data from a previous combined executor
  const inheritedData = getInheritedCombinedData(ledIndex, mapping, itemGroups);
  if (inheritedData) {
    return inheritedData;
  }
  
  // If not inherited, use the LED's own executor data
  const { row, button } = ledMapping;
  
  // Check if the itemGroups has the required row and button
  if (!itemGroups[row] || !itemGroups[row][button]) {
    return null;
  }
  
  const executorItem = itemGroups[row][button];
  const combinedItems = executorItem.combinedItems || 1;
  
  // Find the base executor for this LED
  const baseExecutor = ledMapping.executor;
  const firstLedForExecutor = getFirstLedForExecutor(baseExecutor, mapping);
  
  if (firstLedForExecutor === null) {
    return null;
  }
  
  // Calculate which position this LED is within the combined items
  const currentExecutor = baseExecutor + (ledIndex - firstLedForExecutor);
  
  // Return the data if this LED is within the range of combined items
  if (currentExecutor >= baseExecutor && currentExecutor < baseExecutor + combinedItems) {
    return {
      executorItem: executorItem,
      mapping: {
        ...ledMapping,
        combinedItems: combinedItems,
        currentExecutor: currentExecutor,
        baseExecutor: baseExecutor,
        isFirstInCombined: (ledIndex === firstLedForExecutor)
      }
    };
  }
  
  return null;
}

// Helper function to check if this LED should inherit data from a previous combined executor
function getInheritedCombinedData(ledIndex, mapping, itemGroups) {
  const currentLedMapping = mapping[ledIndex];
  if (!currentLedMapping) return null;
  
  const currentRow = currentLedMapping.row;
  
  // Check previous LEDs in the SAME ROW to see if any have combined items that should extend to this LED
  for (let checkLed = ledIndex - 1; checkLed >= 0; checkLed--) {
    const checkMapping = mapping[checkLed];
    if (!checkMapping || checkMapping.executor === null) {
      continue;
    }
    
    // Only check LEDs in the same row to prevent row overflow
    if (checkMapping.row !== currentRow) {
      continue;
    }
    
    const { row, button } = checkMapping;
    if (!itemGroups[row] || !itemGroups[row][button]) {
      continue;
    }
    
    const executorItem = itemGroups[row][button];
    const combinedItems = executorItem.combinedItems || 1;
    
    if (combinedItems > 1) {
      // Check if this LED falls within the range of the combined items
      const baseExecutor = checkMapping.executor;
      const firstLedForExecutor = getFirstLedForExecutor(baseExecutor, mapping);
      
      if (firstLedForExecutor !== null) {
        const currentExecutor = baseExecutor + (ledIndex - firstLedForExecutor);
        
        if (currentExecutor >= baseExecutor && currentExecutor < baseExecutor + combinedItems) {
          return {
            executorItem: executorItem,
            mapping: {
              ...checkMapping,
              combinedItems: combinedItems,
              currentExecutor: currentExecutor,
              baseExecutor: baseExecutor,
              isFirstInCombined: false,
              inheritedFrom: checkLed
            }
          };
        }
      }
    }
  }
  
  return null;
}

// Helper function to find the first LED index for a given executor
function getFirstLedForExecutor(executor, mapping) {
  for (const [ledIndex, ledMapping] of Object.entries(mapping)) {
    if (ledMapping.executor === executor) {
      return parseInt(ledIndex);
    }
  }
  return null;
}

module.exports = {
  WING1_LED_MAPPING,
  WING1_EXECUTOR_MAPPING,
  WING2_LED_MAPPING,
  WING2_EXECUTOR_MAPPING,
  WING3_LED_MAPPING,
  WING3_EXECUTOR_MAPPING,
  getLedMapping,
  getExecutorMapping,
  getExecutorData,
  getFirstLedForExecutor,
  getInheritedCombinedData,
  getLedForExecutor,
  getLedsForExecutorRange
}; 