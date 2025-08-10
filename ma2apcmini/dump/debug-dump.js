const fs = require("fs");
const path = require("path");

// Create dump directory if it doesn't exist
const dumpDir = path.join(__dirname, "dumps");
if (!fs.existsSync(dumpDir)) {
  fs.mkdirSync(dumpDir, { recursive: true });
}

// Helper function to create timestamped filename
function getTimestampedFilename(prefix) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, -5);
  return `${prefix}_${timestamp}.txt`;
}

// Helper function to write formatted content to file
function writeDumpFile(filename, content) {
  const filepath = path.join(dumpDir, filename);
  try {
    fs.writeFileSync(filepath, content, "utf8");
    return filepath;
  } catch (error) {
    console.error(`Error writing dump file: ${error.message}`);
    return null;
  }
}

// LED Matrix Dump with detailed explanations
function dumpLEDMatrix(ledmatrix, led_isrun, pageIndex, pageIndex2, wingConfig, totalLeds, serverData = null) {
  const filename = getTimestampedFilename("led_matrix");

  let content = `=== LED MATRIX DUMP ===
Generated: ${new Date().toISOString()}
Wing Configuration: ${wingConfig}
Button Page (pageIndex): ${pageIndex}
Fader Page (pageIndex2): ${pageIndex2}
Total LEDs: ${totalLeds}

EXPLANATION:
- Each LED has a velocity (color) and channel (brightness/mode)
- Velocity range: 0-127 (0=off, 1-127=color values)
- Channel: Controls brightness and animation modes (0-15)
- LED ranges: 0-7=faders, 8-15=debug keys, 16-63=button grid

BRIGHTNESS MODES:
- Channel 0-6: Fixed brightness levels (10%, 25%, 50%, 65%, 75%, 90%, 100%)
- Channel 7-10: Pulsing modes (1/16, 1/8, 1/4, 1/2)
- Channel 11-15: Blinking modes (1/24, 1/16, 1/8, 1/4, 1/2)

COLOR REFERENCE TABLE:
Velocity | Color     | Velocity | Color     | Velocity | Color     | Velocity | Color
---------|-----------|----------|-----------|----------|-----------|----------|--------
0        | #000000   | 32       | #4CFFB7   | 64       | #033900   | 96       | #FF7F00
1        | #1E1E1E   | 33       | #00FF99   | 65       | #005735   | 97       | #B9B000
2        | #7F7F7F   | 34       | #005935   | 66       | #00547F   | 98       | #90FF00
3        | #FFFFFF   | 35       | #001912   | 67       | #0000FF   | 99       | #835D07
4        | #FF4C4C   | 36       | #4CC3FF   | 68       | #00454F   | 100      | #392b00
5        | #FF0000   | 37       | #00A9FF   | 69       | #2500CC   | 101      | #144C10
6        | #590000   | 38       | #004152   | 70       | #7F7F7F   | 102      | #0D5038
7        | #190000   | 39       | #001019   | 71       | #202020   | 103      | #15152A
8        | #FFBD6C   | 40       | #4C88FF   | 72       | #FF0000   | 104      | #16205A
9        | #FF5400   | 41       | #0055FF   | 73       | #BDFF2D   | 105      | #693C1C
10       | #591D00   | 42       | #001D59   | 74       | #AFED06   | 106      | #A8000A
11       | #271B00   | 43       | #000819   | 75       | #64FF09   | 107      | #DE513D
12       | #FFFF4C   | 44       | #4C4CFF   | 76       | #108B00   | 108      | #D86A1C
13       | #FFFF00   | 45       | #0000FF   | 77       | #00FF87   | 109      | #FFE126
14       | #595900   | 46       | #000059   | 78       | #00A9FF   | 110      | #9EE12F
15       | #191900   | 47       | #000019   | 79       | #002AFF   | 111      | #67B50F
16       | #88FF4C   | 48       | #874CFF   | 80       | #3F00FF   | 112      | #1E1E30
17       | #54FF00   | 49       | #5400FF   | 81       | #7A00FF   | 113      | #DCFF6B
18       | #1D5900   | 50       | #190064   | 82       | #B21A7D   | 114      | #80FFBD
19       | #142B00   | 51       | #0F0030   | 83       | #402100   | 115      | #9A99FF
20       | #4CFF4C   | 52       | #FF4CFF   | 84       | #FF4A00   | 116      | #8E66FF
21       | #00FF00   | 53       | #FF00FF   | 87       | #00FF00   | 117      | #404040
22       | #005900   | 54       | #590059   | 88       | #3BFF26   | 118      | #757575
23       | #001900   | 55       | #190019   | 89       | #59FF71   | 119      | #E0FFFF
24       | #4CFF5E   | 56       | #FF4C87   | 90       | #38FFCC   | 120      | #A00000
25       | #00FF19   | 57       | #FF0054   | 91       | #5B8AFF   | 121      | #350000
26       | #00590D   | 58       | #59001D   | 92       | #3151C6   | 122      | #1AD000
27       | #001902   | 59       | #220013   | 93       | #877FE9   | 123      | #074200
28       | #4CFF88   | 60       | #FF1500   | 94       | #D31DFF   | 124      | #B9B000
29       | #00FF55   | 61       | #993500   | 95       | #FF005D   | 125      | #3F3100
30       | #00591D   | 62       | #795100   | 96       | #FF7F00   | 126      | #B35F00
31       | #001F12   | 63       | #436400   | 97       | #B9B000   | 127      | #4B1502

LED MAPPING:
- LEDs 0-7: Fader buttons (Wing 1: 0-4, 5-7; Wing 2: 0-4, 3-7; Wing 3: 0-4, 5-7)
- LEDs 8-15: Debug keys (unused for feedback)
- LEDs 16-63: Button grid (48 LEDs total)
- LEDs 64-119: Unused

FORMAT: LED_Index: Color/Brightness_Mode [Server Data]

`;

  // Group LEDs by function for better readability
  const sections = [
    { name: "FADER BUTTONS (0-7)", start: 0, end: 7 },
    { name: "DEBUG KEYS (8-15)", start: 8, end: 15 },
    { name: "BUTTON GRID (16-63)", start: 16, end: 63 },
    { name: "UNUSED (64-119)", start: 64, end: 119 }
  ];

  sections.forEach(section => {
    content += `\n=== ${section.name} ===\n`;
    
    for (let i = section.start; i <= section.end; i++) {
      const velocity = ledmatrix[i] || 0;
      const channel = led_isrun[i] || 0;
      const colorDesc = getColorDescription(velocity);
      const brightnessDesc = getBrightnessModeDescription(channel);
      
      let ledLine = `LED ${i.toString().padStart(3)}: ${velocity}/${channel} (${colorDesc}, ${brightnessDesc})`;
      
      // Add server data if available
      if (serverData && serverData.leds && serverData.leds[i]) {
        const data = serverData.leds[i];
        ledLine += `\n    Server Data: Button=${data.buttonIndex}, Row=${data.rowIndex}, Running=${data.isRunning}, Color=${data.backgroundColor}`;
        ledLine += `\n    Config: AutoColor=${data.autoColor}, Blink=${data.blink}, Brightness=${data.brightness}`;
        ledLine += `\n    Timestamp: ${data.timestamp}`;
        if (data.mapping) { // Add mapping info if available
          ledLine += `\n    Mapping: Executor=${data.mapping.executor}, Desc="${data.mapping.description}"`;
          if (data.combinedItems > 1) {
            ledLine += `, CombinedItems=${data.combinedItems}, CurrentExecutor=${data.currentExecutor}, BaseExecutor=${data.baseExecutor}`;
            if (data.mapping.isFirstInCombined) {
              ledLine += ` (FIRST IN COMBINED)`;
            }
            if (data.mapping.inheritedFrom !== undefined) {
              ledLine += ` (INHERITED FROM LED ${data.mapping.inheritedFrom})`;
            }
          }
        }
      }
      
      content += ledLine + "\n";
    }
  });

  // Add server data summary if available
  if (serverData && serverData.leds) {
    content += `\n=== SERVER DATA SUMMARY ===\n`;
    content += `Last Update: ${serverData.timestamp}\n`;
    content += `LEDs with Server Data: ${Object.keys(serverData.leds).length}\n`;
    
    // Show which LEDs have server data
    const ledsWithData = Object.keys(serverData.leds).sort((a, b) => parseInt(a) - parseInt(b));
    content += `LEDs: ${ledsWithData.join(", ")}\n`;
  }

  // Add itemGroups structure information if available
  if (serverData && serverData.itemGroupsStructure) {
    content += `\n=== ITEMGROUPS STRUCTURE ===\n`;
    content += `Response Type: ${serverData.itemGroupsStructure.responseType}\n`;
    content += `Response Sub Type: ${serverData.itemGroupsStructure.responseSubType}\n`;
    content += `Item Groups Count: ${serverData.itemGroupsStructure.itemGroupsCount}\n`;
    content += `Items Count: ${serverData.itemGroupsStructure.itemsCount}\n`;
    content += `Structure:\n`;
    
    serverData.itemGroupsStructure.structure.forEach(row => {
      content += `  Row ${row.row}: ${row.itemCount} items`;
      if (row.firstItem) {
        content += ` (first: ${JSON.stringify(row.firstItem)})`;
      }
      content += `\n`;
    });
  }

  return writeDumpFile(filename, content);
}

// Page State Dump with explanations
function dumpPageState(pageIndex, pageIndex2, clientConfig, session, request, interval_on, blackout) {
  const filename = getTimestampedFilename("page_state");

  let content = `=== PAGE STATE DUMP ===
Generated: ${new Date().toISOString()}

EXPLANATION:
- pageIndex: Controls which page of executors is displayed on button grid
- pageIndex2: Controls which page of executors is controlled by faders
- Page select mode: 0=disabled, 1=buttons only, 2=buttons and faders
- Control OnPC page: Whether page changes are sent to GrandMA2 OnPC

CURRENT STATE:
Button Page (pageIndex): ${pageIndex}
Fader Page (pageIndex2): ${pageIndex2}
Page Select Mode: ${clientConfig.pageSelectMode} ${getPageModeDescription(clientConfig.pageSelectMode)}
Control OnPC Page: ${clientConfig.controlOnpcPage ? "Enabled" : "Disabled"}

CONNECTION STATE:
Session ID: ${session}
Request Count: ${request}
Interval Active: ${interval_on ? "Yes" : "No"}
Blackout State: ${blackout}

CONFIGURATION:
Username: ${clientConfig.username}
Auto Color: ${clientConfig.autoColor ? "Enabled" : "Disabled"}
Blink Mode: ${clientConfig.blink ? "Enabled" : "Disabled"}
Brightness: ${clientConfig.brightness}/6
Dark Mode: ${clientConfig.darkMode ? "Enabled" : "Disabled"}

PERFORMANCE SETTINGS:
LED Batching: ${clientConfig.enableLedBatching ? "Enabled" : "Disabled"}
MIDI Throttling: ${clientConfig.enableMidiThrottling ? "Enabled" : "Disabled"}
Adaptive Frequency: ${clientConfig.enableAdaptiveFrequency ? "Enabled" : "Disabled"}
Color Optimization: ${clientConfig.enableColorOptimization ? "Enabled" : "Disabled"}
Memory Optimization: ${clientConfig.enableMemoryOptimization ? "Enabled" : "Disabled"}

=== END PAGE STATE DUMP ===
`;

  const filepath = writeDumpFile(filename, content);
  return filepath;
}

// Performance Stats Dump with explanations
function dumpPerformanceStats(getLedBatchStats, getMidiThrottleStats, getWebsocketFrequencyStats, getColorMatchingStats, getMemoryOptimizationStats) {
  const filename = getTimestampedFilename("performance_stats");

  // Get all stats
  const ledStats = getLedBatchStats();
  const midiStats = getMidiThrottleStats();
  const wsStats = getWebsocketFrequencyStats();
  const colorStats = getColorMatchingStats();
  const memStats = getMemoryOptimizationStats();

  let content = `=== PERFORMANCE STATS DUMP ===
Generated: ${new Date().toISOString()}

EXPLANATION:
This dump shows performance metrics for various optimization systems.
Higher numbers generally indicate more activity, but not necessarily problems.

LED BATCHING SYSTEM:
- Batches LED updates to reduce MIDI traffic
- Total batches sent: ${ledStats.totalBatches}
- Pending updates in queue: ${ledStats.pendingUpdates}
- Average batch size: ${ledStats.totalBatches > 0 ? Math.round(ledStats.totalUpdates / ledStats.totalBatches) : 0}

MIDI THROTTLING SYSTEM:
- Prevents MIDI message flooding
- Total messages sent: ${midiStats.totalMessages}
- Current queue length: ${midiStats.queueLength}
- Priority messages sent: ${midiStats.priorityMessages || 0}
- Normal messages sent: ${midiStats.normalMessages || 0}

WEBSOCKET FREQUENCY SYSTEM:
- Adapts request frequency based on activity
- Total requests sent: ${wsStats.totalRequests}
- Current frequency: ${wsStats.currentFrequency}ms
- Active mode requests: ${wsStats.activeModeRequests || 0}
- Idle mode requests: ${wsStats.idleModeRequests || 0}

COLOR MATCHING SYSTEM:
- Optimizes color conversion performance
- Total color matches: ${colorStats.totalMatches}
- Cache hits: ${colorStats.cacheHits}
- Cache hit rate: ${colorStats.totalMatches > 0 ? Math.round((colorStats.cacheHits / colorStats.totalMatches) * 100) : 0}%

MEMORY OPTIMIZATION SYSTEM:
- Reduces memory allocation overhead
- Objects pooled: ${memStats.objectsPooled}
- Memory saved: ${memStats.memorySaved}KB
- Array optimizations: ${memStats.arrayOptimizations || 0}

PERFORMANCE ASSESSMENT:
${getPerformanceAssessment(ledStats, midiStats, wsStats, colorStats, memStats)}

=== END PERFORMANCE STATS DUMP ===
`;

  const filepath = writeDumpFile(filename, content);
  return filepath;
}

// Recent MIDI Messages Dump with history tracking
function dumpRecentMIDI(midiHistory = []) {
  const filename = getTimestampedFilename("recent_midi");

  let content = `=== RECENT MIDI MESSAGES DUMP ===
Generated: ${new Date().toISOString()}

EXPLANATION:
This dump shows recent MIDI messages sent to GrandMA2.
Use this to track button presses, fader movements, and page changes.
Messages are shown in chronological order (newest first).

MIDI MESSAGE TYPES:
- playbacks_userInput: Button presses and fader movements
- command: Direct GrandMA2 commands (page changes, special masters)
- login: Authentication messages
- getdata: Data requests

MESSAGE FORMAT:
Timestamp | Type | Details | Priority

`;

  if (midiHistory.length === 0) {
    content += `No recent MIDI messages recorded.
To enable MIDI message history, set enableMidiHistory: true in clientConfig.

`;
  } else {
    // Show last 50 messages (newest first)
    const recentMessages = midiHistory.slice(-50).reverse();

    content += `RECENT MIDI MESSAGES (Last ${recentMessages.length}):\n`;
    content += `${"=".repeat(80)}\n\n`;

    recentMessages.forEach((msg, index) => {
      const timestamp = new Date(msg.timestamp).toLocaleTimeString();
      const type = msg.message.requestType || msg.message.command ? "command" : "unknown";
      let details = "";

      if (msg.message.requestType === "playbacks_userInput") {
        details = `ExecIndex: ${msg.message.execIndex}, PageIndex: ${msg.message.pageIndex}, ButtonId: ${msg.message.buttonId}, Pressed: ${msg.message.pressed}`;
      } else if (msg.message.command) {
        details = `Command: ${msg.message.command}`;
      } else if (msg.message.requestType === "login") {
        details = "Login attempt";
      } else if (msg.message.requestType === "getdata") {
        details = "Data request";
      } else {
        details = JSON.stringify(msg.message);
      }

      content += `${timestamp} | ${type.padEnd(20)} | ${details.padEnd(40)} | ${msg.priority}\n`;
    });

    // Add statistics
    const stats = analyzeMidiHistory(midiHistory);
    content += `\nMIDI MESSAGE STATISTICS:\n`;
    content += `${"=".repeat(30)}\n`;
    content += `Total messages: ${midiHistory.length}\n`;
    content += `Messages in last minute: ${stats.lastMinute}\n`;
    content += `Messages in last 5 minutes: ${stats.last5Minutes}\n`;
    content += `High priority messages: ${stats.highPriority}\n`;
    content += `Normal priority messages: ${stats.normalPriority}\n`;
    content += `Most common type: ${stats.mostCommonType}\n`;
  }

  content += `\n=== END RECENT MIDI MESSAGES DUMP ===\n`;

  const filepath = writeDumpFile(filename, content);
  return filepath;
}

// Comprehensive Debug Dump
function dumpAllDebugInfo(debugMode, connectionState, midiDeviceState, pageIndex, pageIndex2, clientConfig, session, request, interval_on, blackout, ledmatrix, led_isrun, wingConfig, totalLeds, getLedBatchStats, getMidiThrottleStats, getWebsocketFrequencyStats, getColorMatchingStats, getMemoryOptimizationStats, midiHistory = []) {
  const filename = getTimestampedFilename("comprehensive_debug");

  let content = `=== COMPREHENSIVE DEBUG DUMP ===
Generated: ${new Date().toISOString()}

SYSTEM OVERVIEW:
This is a complete system state dump for troubleshooting APC mini MA2 integration issues.
Use this information to identify problems with LED feedback, page transitions, or performance.

DEBUG MODE: ${debugMode ? "ACTIVE" : "INACTIVE"}

CONNECTION STATUS:
WebSocket Connection: ${connectionState.isConnected ? "CONNECTED" : "DISCONNECTED"}
MIDI Device Connection: ${midiDeviceState.isConnected ? "CONNECTED" : "DISCONNECTED"}
Reconnection Attempts: ${connectionState.reconnectAttempts}/${connectionState.maxReconnectAttempts}

`;

  // Add page state
  content += `\nPAGE STATE:\n`;
  content += `Button Page (pageIndex): ${pageIndex}\n`;
  content += `Fader Page (pageIndex2): ${pageIndex2}\n`;
  content += `Page Select Mode: ${clientConfig.pageSelectMode}\n`;
  content += `Control OnPC Page: ${clientConfig.controlOnpcPage}\n`;
  content += `Session: ${session}\n`;
  content += `Request Count: ${request}\n`;
  content += `Interval Active: ${interval_on}\n`;
  content += `Blackout: ${blackout}\n`;

  // Add LED matrix summary
  content += `\nLED MATRIX SUMMARY:\n`;
  let onLeds = 0;
  let blinkLeds = 0;
  for (let i = 0; i < totalLeds; i++) {
    if (ledmatrix[i] > 0) onLeds++;
    if (led_isrun[i] === 8) blinkLeds++;
  }
  content += `Total LEDs: ${totalLeds}\n`;
  content += `LEDs ON: ${onLeds}\n`;
  content += `LEDs BLINKING: ${blinkLeds}\n`;
  content += `LEDs OFF: ${totalLeds - onLeds}\n`;

  // Add performance stats
  const ledStats = getLedBatchStats();
  const midiStats = getMidiThrottleStats();
  const wsStats = getWebsocketFrequencyStats();
  const colorStats = getColorMatchingStats();
  const memStats = getMemoryOptimizationStats();

  content += `\nPERFORMANCE SUMMARY:\n`;
  content += `LED Batches Sent: ${ledStats.totalBatches}\n`;
  content += `MIDI Messages Sent: ${midiStats.totalMessages}\n`;
  content += `WebSocket Requests: ${wsStats.totalRequests}\n`;
  content += `Color Matches: ${colorStats.totalMatches}\n`;
  content += `Objects Pooled: ${memStats.objectsPooled}\n`;

  content += `\n=== END COMPREHENSIVE DEBUG DUMP ===\n`;

  const filepath = writeDumpFile(filename, content);
  return filepath;
}

// Helper function to get page mode description
function getPageModeDescription(mode) {
  switch (mode) {
    case 0:
      return "(Disabled)";
    case 1:
      return "(Buttons only)";
    case 2:
      return "(Buttons and faders)";
    default:
      return "(Unknown)";
  }
}

// Helper function to get brightness mode description
function getBrightnessModeDescription(channel) {
  switch (channel) {
    case 0:
      return "10% brightness";
    case 1:
      return "25% brightness";
    case 2:
      return "50% brightness";
    case 3:
      return "65% brightness";
    case 4:
      return "75% brightness";
    case 5:
      return "90% brightness";
    case 6:
      return "100% brightness";
    case 7:
      return "Pulsing 1/16";
    case 8:
      return "Pulsing 1/8";
    case 9:
      return "Pulsing 1/4";
    case 10:
      return "Pulsing 1/2";
    case 11:
      return "Blinking 1/24";
    case 12:
      return "Blinking 1/16";
    case 13:
      return "Blinking 1/8";
    case 14:
      return "Blinking 1/4";
    case 15:
      return "Blinking 1/2";
    default:
      return `Unknown mode ${channel}`;
  }
}

// Helper function to get color description
function getColorDescription(velocity) {
  const colorMap = {
    0: "#000000",
    1: "#1E1E1E",
    2: "#7F7F7F",
    3: "#FFFFFF",
    4: "#FF4C4C",
    5: "#FF0000",
    6: "#590000",
    7: "#190000",
    8: "#FFBD6C",
    9: "#FF5400",
    10: "#591D00",
    11: "#271B00",
    12: "#FFFF4C",
    13: "#FFFF00",
    14: "#595900",
    15: "#191900",
    16: "#88FF4C",
    17: "#54FF00",
    18: "#1D5900",
    19: "#142B00",
    20: "#4CFF4C",
    21: "#00FF00",
    22: "#005900",
    23: "#001900",
    24: "#4CFF5E",
    25: "#00FF19",
    26: "#00590D",
    27: "#001902",
    28: "#4CFF88",
    29: "#00FF55",
    30: "#00591D",
    31: "#001F12",
    32: "#4CFFB7",
    33: "#00FF99",
    34: "#005935",
    35: "#001912",
    36: "#4CC3FF",
    37: "#00A9FF",
    38: "#004152",
    39: "#001019",
    40: "#4C88FF",
    41: "#0055FF",
    42: "#001D59",
    43: "#000819",
    44: "#4C4CFF",
    45: "#0000FF",
    46: "#000059",
    47: "#000019",
    48: "#874CFF",
    49: "#5400FF",
    50: "#190064",
    51: "#0F0030",
    52: "#FF4CFF",
    53: "#FF00FF",
    54: "#590059",
    55: "#190019",
    56: "#FF4C87",
    57: "#FF0054",
    58: "#59001D",
    59: "#220013",
    60: "#FF1500",
    61: "#993500",
    62: "#795100",
    63: "#436400",
    64: "#033900",
    65: "#005735",
    66: "#00547F",
    67: "#0000FF",
    68: "#00454F",
    69: "#2500CC",
    70: "#7F7F7F",
    71: "#202020",
    72: "#FF0000",
    73: "#BDFF2D",
    74: "#AFED06",
    75: "#64FF09",
    76: "#108B00",
    77: "#00FF87",
    78: "#00A9FF",
    79: "#002AFF",
    80: "#3F00FF",
    81: "#7A00FF",
    82: "#B21A7D",
    83: "#402100",
    84: "#FF4A00",
    85: "#88E106",
    86: "#72FF15",
    87: "#00FF00",
    88: "#3BFF26",
    89: "#59FF71",
    90: "#38FFCC",
    91: "#5B8AFF",
    92: "#3151C6",
    93: "#877FE9",
    94: "#D31DFF",
    95: "#FF005D",
    96: "#FF7F00",
    97: "#B9B000",
    98: "#90FF00",
    99: "#835D07",
    100: "#392b00",
    101: "#144C10",
    102: "#0D5038",
    103: "#15152A",
    104: "#16205A",
    105: "#693C1C",
    106: "#A8000A",
    107: "#DE513D",
    108: "#D86A1C",
    109: "#FFE126",
    110: "#9EE12F",
    111: "#67B50F",
    112: "#1E1E30",
    113: "#DCFF6B",
    114: "#80FFBD",
    115: "#9A99FF",
    116: "#8E66FF",
    117: "#404040",
    118: "#757575",
    119: "#E0FFFF",
    120: "#A00000",
    121: "#350000",
    122: "#1AD000",
    123: "#074200",
    124: "#B9B000",
    125: "#3F3100",
    126: "#B35F00",
    127: "#4B1502",
  };

  return colorMap[velocity] || `Unknown color ${velocity}`;
}

// Helper function to analyze MIDI message history
function analyzeMidiHistory(midiHistory) {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const fiveMinutesAgo = now - 300000;

  const lastMinute = midiHistory.filter((msg) => msg.timestamp > oneMinuteAgo).length;
  const last5Minutes = midiHistory.filter((msg) => msg.timestamp > fiveMinutesAgo).length;
  const highPriority = midiHistory.filter((msg) => msg.priority === "high").length;
  const normalPriority = midiHistory.filter((msg) => msg.priority === "normal").length;

  // Find most common message type
  const typeCounts = {};
  midiHistory.forEach((msg) => {
    const type = msg.message.requestType || "command";
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  const mostCommonType = Object.keys(typeCounts).reduce((a, b) => (typeCounts[a] > typeCounts[b] ? a : b), "unknown");

  return {
    lastMinute,
    last5Minutes,
    highPriority,
    normalPriority,
    mostCommonType,
  };
}

// Helper function to assess performance
function getPerformanceAssessment(ledStats, midiStats, wsStats, colorStats, memStats) {
  let assessment = "PERFORMANCE ASSESSMENT:\n";

  // LED batching assessment
  if (ledStats.pendingUpdates > 10) {
    assessment += "⚠️  High LED update queue - may indicate performance issues\n";
  } else if (ledStats.totalBatches > 0) {
    assessment += "✅ LED batching working normally\n";
  }

  // MIDI throttling assessment
  if (midiStats.queueLength > 5) {
    assessment += "⚠️  High MIDI queue - may indicate message flooding\n";
  } else if (midiStats.totalMessages > 0) {
    assessment += "✅ MIDI throttling working normally\n";
  }

  // WebSocket frequency assessment
  if (wsStats.currentFrequency < 50) {
    assessment += "⚠️  High WebSocket frequency - may indicate excessive requests\n";
  } else if (wsStats.currentFrequency > 200) {
    assessment += "⚠️  Low WebSocket frequency - may indicate connection issues\n";
  } else {
    assessment += "✅ WebSocket frequency normal\n";
  }

  // Color matching assessment
  const cacheHitRate = colorStats.totalMatches > 0 ? (colorStats.cacheHits / colorStats.totalMatches) * 100 : 0;
  if (cacheHitRate < 50) {
    assessment += "⚠️  Low color cache hit rate - may indicate performance issues\n";
  } else {
    assessment += "✅ Color matching working efficiently\n";
  }

  return assessment;
}

module.exports = {
  dumpLEDMatrix,
  dumpPageState,
  dumpPerformanceStats,
  dumpRecentMIDI,
  dumpAllDebugInfo,
};
