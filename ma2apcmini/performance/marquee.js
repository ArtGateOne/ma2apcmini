const logger = require("./logger");
const { LOG_LEVELS, log } = logger;

// Marquee configuration
const MARQUEE_CONFIG = {
  enabled: true,
  text: "ArtGateOne",
  speed: 150, // milliseconds between frames
  brightness: 127, // LED brightness (0-127)
  color: 127, // LED color (0-127, 127 = white)
  repeat: 2, // number of times to repeat the animation
  clearAfter: true, // whether to clear LEDs after animation
  randomizeColors: true, // whether to randomize colors per letter
};

// Color palette for random colors (using existing colorToVelocity function)
const RANDOM_COLORS = [
  '#FF0000', // Red
  '#FF4000', // Red-Orange
  '#FF8000', // Orange
  '#FFBF00', // Golden Yellow
  '#FFFF00', // Yellow
  '#BFFF00', // Lime
  '#80FF00', // Green-Yellow
  '#40FF00', // Bright Green
  '#00FF00', // Green
  '#00FF40', // Green-Cyan
  '#00FF80', // Spring Green
  '#00FFBF', // Aqua
  '#00FFFF', // Cyan
  '#00BFFF', // Sky Blue
  '#0080FF', // Blue
  '#0040FF', // Royal Blue
  '#0000FF', // Pure Blue
  '#4000FF', // Blue-Violet
  '#8000FF', // Purple
  '#BF00FF', // Magenta
  '#FF00FF', // Pink
  '#FF00BF', // Rose
  '#FF0080', // Hot Pink
  '#FF0040', // Crimson
  '#FFFFFF'  // White
];

// Character definitions for LED matrix display
// Each character is 6x6 pixels, represented as 6 rows of 6 bits for better 8x8 grid usage
const CHARACTER_SET = {
  A: [
    0b001100, //   ##
    0b010010, //  #  #
    0b100001, // #    #
    0b111111, // ######
    0b100001, // #    #
    0b100001, // #    #
  ],
     A: [
     0b001100, //   ##
     0b010010, //  #  #
     0b100001, // #    #
     0b111111, // ######
     0b100001, // #    #
     0b100001, // #    #
   ],
   r: [
     0b000000, //
     0b000000, //
     0b101110, // # ###
     0b110001, // ##   #
     0b100000, // #
     0b100000, // #
   ],
   t: [
     0b001000, //   #
     0b001000, //   #
     0b111110, // #####
     0b001000, //   #
     0b001000, //   #
     0b000110, //    ##
   ],
   G: [
     0b011110, //  ####
     0b100001, // #    #
     0b100000, // #
     0b101111, // # ####
     0b100001, // #    #
     0b011110, //  ####
   ],
   a: [
     0b000000, //
     0b011100, //  ###
     0b100010, // #   #
     0b011110, //  ####
     0b100010, // #   #
     0b011111, //  #####
   ],
   t: [
     0b001000, //   #
     0b001000, //   #
     0b111110, // #####
     0b001000, //   #
     0b001000, //   #
     0b000110, //    ##
   ],
   e: [
     0b000000, //
     0b011100, //  ###
     0b100010, // #   #
     0b111110, // #####
     0b100000, // #
     0b011100, //  ###
   ],
   O: [
     0b011100, //  ###
     0b100010, // #   #
     0b100010, // #   #
     0b100010, // #   #
     0b100010, // #   #
     0b011100, //  ###
   ],
   n: [
     0b000000, //
     0b000000, //
     0b101100, // # ##
     0b110010, // ##  #
     0b100010, // #   #
     0b100010, // #   #
   ],
   e: [
     0b000000, //
     0b011100, //  ###
     0b100010, // #   #
     0b111110, // #####
     0b100000, // #
     0b011100, //  ###
   ],
  " ": [
    0b000000, //
    0b000000, //
    0b000000, //
    0b000000, //
    0b000000, //
    0b000000, //
  ],
};

// LED matrix dimensions
const LED_ROWS = 8;
const LED_COLS = 8;
const TOTAL_LEDS = LED_ROWS * LED_COLS;

/**
 * Converts a character to its LED representation
 * @param {string} char - The character to convert
 * @returns {Array} Array of 3 rows, each containing 5 bits representing the character
 */
function charToLEDMatrix(char) {
  return CHARACTER_SET[char] || CHARACTER_SET[" "];
}

/**
 * Converts LED matrix coordinates to MIDI note number for APC Mini
 * The APC Mini has an 8x8 grid mapped to notes 0-63
 * Note: The layout is inverted - Row 8 (bottom) = notes 0-7, Row 1 (top) = notes 56-63
 * @param {number} row - Row index (0-7, where 0 is top and 7 is bottom)
 * @param {number} col - Column index (0-7)
 * @returns {number} MIDI note number
 */
function matrixToNote(row, col) {
  // APC Mini 8x8 grid mapping: inverted layout
  // Row 0 (top) = notes 56-63, Row 7 (bottom) = notes 0-7
  const invertedRow = 7 - row; // Invert the row
  return invertedRow * 8 + col;
}

/**
 * Gets a random color using the existing colorToVelocity system
 * @param {Function} colorToVelocity - Function to convert hex color to velocity
 * @returns {number} Velocity value for the color
 */
function getRandomColor(colorToVelocity) {
  // Use the existing colorToVelocity function from the main script
  const randomColor = RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];
  return colorToVelocity(randomColor);
}

/**
 * Generates character colors for the entire animation
 * @param {string} text - Text to display
 * @param {boolean} randomizeColors - Whether to randomize colors per character
 * @param {Function} colorToVelocity - Function to convert hex color to velocity
 * @returns {Map} Map of character index to color data
 */
function generateCharacterColors(text, randomizeColors, colorToVelocity) {
  const characterColors = new Map();
  
  if (randomizeColors && colorToVelocity) {
    for (let charIndex = 0; charIndex < text.length; charIndex++) {
      const randomColor = RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];
      const velocity = colorToVelocity(randomColor);
      characterColors.set(charIndex, { color: randomColor, velocity: velocity });
      log(LOG_LEVELS.DEBUG, `🎨 Character ${charIndex} ('${text[charIndex]}'): ${randomColor} -> velocity ${velocity}`);
    }
  }
  
  return characterColors;
}

/**
 * Displays a frame of the marquee animation
 * @param {Object} frameData - Object containing frame data and character colors
 * @param {Object} output - MIDI output device
 * @param {Object} config - Marquee configuration
 * @param {Function} colorToVelocity - Function to convert hex color to velocity
 */
function displayFrame(frameData, output, config, colorToVelocity) {
  try {
    const { frame, characterColors } = frameData;
    
    // Clear all LEDs first
    for (let row = 0; row < LED_ROWS; row++) {
      for (let col = 0; col < LED_COLS; col++) {
        const note = matrixToNote(row, col);
        output.send("noteon", { note: note, velocity: 0, channel: 6 });
      }
    }

    // Count how many LEDs we're turning on
    let ledCount = 0;

    // Display the frame
    for (let row = 0; row < LED_ROWS; row++) {
      for (let col = 0; col < LED_COLS; col++) {
        const charIndex = frame[row] && frame[row][col];
        if (charIndex !== false && charIndex !== undefined) {
          const note = matrixToNote(row, col);
          let color;
          
          if (config.randomizeColors && characterColors.has(charIndex)) {
            // Use the character's assigned color
            const charColor = characterColors.get(charIndex);
            color = charColor.velocity;
          } else {
            // Use white for non-randomized or missing character colors
            color = colorToVelocity('#FFFFFF');
          }
          
          output.send("noteon", {
            note: note,
            velocity: color,
            channel: 6, // Use channel 6 for 100% brightness
          });
          ledCount++;
        }
      }
    }
  } catch (error) {
    log(LOG_LEVELS.ERROR, "💥 Error displaying marquee frame:", error);
  }
}

/**
 * Creates a frame for the marquee animation
 * @param {string} text - Text to display
 * @param {number} offset - Horizontal offset for scrolling
 * @param {Map} characterColors - Pre-generated character colors (optional)
 * @returns {Object} Object containing frame data and character colors
 */
function createFrame(text, offset, characterColors = null) {
  const frame = Array(LED_ROWS)
    .fill()
    .map(() => Array(LED_COLS).fill(false));

  // Convert text to LED matrices
  const textMatrices = text.split("").map(charToLEDMatrix);

  // Calculate total width of text (6 bits per character + 1 for spacing)
  const textWidth = textMatrices.length * 7; // 6 bits per character + 1 for spacing

  // Calculate starting position (right edge)
  let currentX = 8 - offset; // Start from the right edge of the 8x8 grid

  // Place each character
  for (let charIndex = 0; charIndex < textMatrices.length; charIndex++) {
    const matrix = textMatrices[charIndex];
    const charWidth = 6; // Fixed width for 6x6 characters

    // Skip if character is completely off-screen
    if (currentX + charWidth <= 0) {
      currentX += charWidth + 1; // +1 for spacing
      continue;
    }

    // Place character pixels (6x6 characters)
    let pixelCount = 0;
    for (let row = 0; row < 6; row++) {
      const rowBits = matrix[row];
      for (let col = 0; col < charWidth; col++) {
        const bit = (rowBits >> (5 - col)) & 1; // 6-bit characters, so shift by 5-col
        if (bit) {
          const ledRow = row + 1; // Center vertically (rows 1-6)
          const ledCol = currentX + col;
          if (ledRow >= 0 && ledRow < LED_ROWS && ledCol >= 0 && ledCol < LED_COLS) {
            frame[ledRow][ledCol] = charIndex; // Store character index instead of true
            pixelCount++;
          }
        }
      }
    }

    currentX += charWidth + 1; // +1 for spacing
  }

  return { frame, characterColors };
}

/**
 * Runs the marquee animation
 * @param {Object} output - MIDI output device
 * @param {Object} config - Marquee configuration (optional, uses default if not provided)
 * @param {Function} colorToVelocity - Function to convert hex color to velocity
 * @returns {Promise} Promise that resolves when animation completes
 */
async function runMarquee(output, config = null, colorToVelocity = null) {
  // Use provided config or default config
  const marqueeConfig = config || MARQUEE_CONFIG;

  if (!marqueeConfig.enabled) {
    log(LOG_LEVELS.INFO, "🎭 Marquee animation disabled in config");
    return;
  }

  if (!output) {
    log(LOG_LEVELS.WARN, "⚠️ No MIDI output available for marquee animation");
    return;
  }

  if (!colorToVelocity) {
    log(LOG_LEVELS.WARN, "⚠️ No colorToVelocity function provided, using default colors");
    // Fallback to simple colors if colorToVelocity not provided
    colorToVelocity = (color) => {
      const colorMap = { '#FFFFFF': 7, '#FF0000': 1, '#00FF00': 3, '#0000FF': 4 };
      return colorMap[color] || 7;
    };
  }

  log(LOG_LEVELS.INFO, `🎭 Starting marquee animation: "${marqueeConfig.text}"`);

  try {
    const text = marqueeConfig.text;
    const textWidth = text.length * 7; // 6 bits per character + 1 for spacing

    const totalFrames = 8 + textWidth; // 8 columns + text width

    // Generate character colors once at the start of the animation
    const characterColors = generateCharacterColors(text, marqueeConfig.randomizeColors, colorToVelocity);

    for (let repeat = 0; repeat < marqueeConfig.repeat; repeat++) {
      log(LOG_LEVELS.INFO, `🎭 Marquee repeat ${repeat + 1}/${marqueeConfig.repeat}`);

      for (let frame = 0; frame < totalFrames; frame++) {
        const frameData = createFrame(text, frame, characterColors);
        displayFrame(frameData, output, marqueeConfig, colorToVelocity);

        // Wait for next frame
        await new Promise((resolve) => setTimeout(resolve, marqueeConfig.speed));
      }
    }

    // Clear LEDs after animation if configured
    if (marqueeConfig.clearAfter) {
      log(LOG_LEVELS.INFO, "🎭 Clearing LEDs after marquee animation");
      for (let row = 0; row < LED_ROWS; row++) {
        for (let col = 0; col < LED_COLS; col++) {
          const note = matrixToNote(row, col);
          output.send("noteon", { note: note, velocity: 0, channel: 6 });
        }
      }
    }
  } catch (error) {
    log(LOG_LEVELS.ERROR, "💥 Error during marquee animation:", error);
  }
}

/**
 * Updates marquee configuration
 * @param {Object} newConfig - New configuration object
 */
function updateMarqueeConfig(newConfig) {
  Object.assign(MARQUEE_CONFIG, newConfig);
  log(LOG_LEVELS.INFO, "🎭 Marquee configuration updated");
}

module.exports = {
  runMarquee,
  updateMarqueeConfig,
  MARQUEE_CONFIG,
};
