// LED-to-Executor Mapping Configuration
// This file defines the mapping between APC mini LED indices and GrandMA2 executors
// Each LED maps to a specific executor with its row and button position in itemGroups

// Wing 1 Configuration (Standard APC mini layout)
const WING1_LED_MAPPING = {
  // Row 1 (LEDs 56-63) - Top row of executor buttons
  56: { executor: 100, row: 0, button: 0, description: "Row 1, Button 1" },
  57: { executor: 101, row: 0, button: 1, description: "Row 1, Button 2" },
  58: { executor: 102, row: 0, button: 2, description: "Row 1, Button 3" },
  59: { executor: 103, row: 0, button: 3, description: "Row 1, Button 4" },
  60: { executor: 104, row: 0, button: 4, description: "Row 1, Button 5" },
  61: { executor: 105, row: 1, button: 0, description: "Row 1, Button 6" },
  62: { executor: 106, row: 1, button: 1, description: "Row 1, Button 7" },
  63: { executor: 107, row: 1, button: 2, description: "Row 1, Button 8" },

  // Row 2 (LEDs 48-55) - Second row of executor buttons
  48: { executor: 108, row: 3, button: 0, description: "Row 2, Button 1" },
  49: { executor: 109, row: 3, button: 1, description: "Row 2, Button 2" },
  50: { executor: 110, row: 3, button: 2, description: "Row 2, Button 3" },
  51: { executor: 111, row: 3, button: 3, description: "Row 2, Button 4" },
  52: { executor: 112, row: 3, button: 4, description: "Row 2, Button 5" },
  53: { executor: 113, row: 4, button: 0, description: "Row 2, Button 6" },
  54: { executor: 114, row: 4, button: 1, description: "Row 2, Button 7" },
  55: { executor: 115, row: 4, button: 2, description: "Row 2, Button 8" },

  // Row 3 (LEDs 40-47) - Third row of executor buttons
  40: { executor: 116, row: 6, button: 0, description: "Row 3, Button 1" },
  41: { executor: 117, row: 6, button: 1, description: "Row 3, Button 2" },
  42: { executor: 118, row: 6, button: 2, description: "Row 3, Button 3" },
  43: { executor: 119, row: 6, button: 3, description: "Row 3, Button 4" },
  44: { executor: 120, row: 6, button: 4, description: "Row 3, Button 5" },
  45: { executor: 121, row: 7, button: 0, description: "Row 3, Button 6" },
  46: { executor: 122, row: 7, button: 1, description: "Row 3, Button 7" },
  47: { executor: 123, row: 7, button: 2, description: "Row 3, Button 8" },

  // Row 4 (LEDs 32-39) - Fourth row of executor buttons
  32: { executor: 124, row: 9, button: 0, description: "Row 4, Button 1" },
  33: { executor: 125, row: 9, button: 1, description: "Row 4, Button 2" },
  34: { executor: 126, row: 9, button: 2, description: "Row 4, Button 3" },
  35: { executor: 127, row: 9, button: 3, description: "Row 4, Button 4" },
  36: { executor: 128, row: 9, button: 4, description: "Row 4, Button 5" },
  37: { executor: 129, row: 10, button: 0, description: "Row 4, Button 6" },
  38: { executor: 130, row: 10, button: 1, description: "Row 4, Button 7" },
  39: { executor: 131, row: 10, button: 2, description: "Row 4, Button 8" },

  // Row 5 (LEDs 24-31) - Fifth row of executor buttons
  24: { executor: 132, row: 12, button: 0, description: "Row 5, Button 1" },
  25: { executor: 133, row: 12, button: 1, description: "Row 5, Button 2" },
  26: { executor: 134, row: 12, button: 2, description: "Row 5, Button 3" },
  27: { executor: 135, row: 12, button: 3, description: "Row 5, Button 4" },
  28: { executor: 136, row: 12, button: 4, description: "Row 5, Button 5" },
  29: { executor: 137, row: 13, button: 0, description: "Row 5, Button 6" },
  30: { executor: 138, row: 13, button: 1, description: "Row 5, Button 7" },
  31: { executor: 139, row: 13, button: 2, description: "Row 5, Button 8" },

  // Row 6 (LEDs 16-23) - Sixth row of executor buttons
  16: { executor: 140, row: 15, button: 0, description: "Row 6, Button 1" },
  17: { executor: 141, row: 15, button: 1, description: "Row 6, Button 2" },
  18: { executor: 142, row: 15, button: 2, description: "Row 6, Button 3" },
  19: { executor: 143, row: 15, button: 3, description: "Row 6, Button 4" },
  20: { executor: 144, row: 15, button: 4, description: "Row 6, Button 5" },
  21: { executor: 145, row: 16, button: 0, description: "Row 6, Button 6" },
  22: { executor: 146, row: 16, button: 1, description: "Row 6, Button 7" },
  23: { executor: 147, row: 16, button: 2, description: "Row 6, Button 8" },

  // Fader buttons (LEDs 0-7)
  0: { executor: 148, row: 0, button: 0, description: "Fader 1" },
  1: { executor: 149, row: 0, button: 1, description: "Fader 2" },
  2: { executor: 150, row: 0, button: 2, description: "Fader 3" },
  3: { executor: 151, row: 0, button: 3, description: "Fader 4" },
  4: { executor: 152, row: 0, button: 4, description: "Fader 5" },
  5: { executor: 153, row: 1, button: 0, description: "Fader 6" },
  6: { executor: 154, row: 1, button: 1, description: "Fader 7" },
  7: { executor: 155, row: 1, button: 2, description: "Fader 8" },

  // Small buttons (LEDs 8-15) - Debug keys
  8: { executor: null, row: null, button: null, description: "Debug Key 1" },
  9: { executor: null, row: null, button: null, description: "Debug Key 2" },
  10: { executor: null, row: null, button: null, description: "Debug Key 3" },
  11: { executor: null, row: null, button: null, description: "Debug Key 4" },
  12: { executor: null, row: null, button: null, description: "Debug Key 5" },
  13: { executor: null, row: null, button: null, description: "Debug Key 6" },
  14: { executor: null, row: null, button: null, description: "Debug Key 7" },
  15: { executor: null, row: null, button: null, description: "Debug Key 8" }
};

// Wing 2 Configuration (Different layout)
const WING2_LED_MAPPING = {
  // Add Wing 2 specific mappings here
  // This would be different based on the Wing 2 layout
};

// Wing 3 Configuration (Different layout)
const WING3_LED_MAPPING = {
  // Add Wing 3 specific mappings here
  // This would be different based on the Wing 3 layout
};

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
  WING2_LED_MAPPING,
  WING3_LED_MAPPING,
  getLedMapping,
  getExecutorData,
  getFirstLedForExecutor,
  getInheritedCombinedData
}; 