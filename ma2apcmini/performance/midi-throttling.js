// MIDI Message Throttling System - Performance Optimization Module
// Handles throttling of MIDI messages to prevent device overflow

const logger = require('./logger');
const { LOG_LEVELS } = logger;

// MIDI Message Throttling Configuration
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

// MIDI Throttling Statistics and Monitoring
let midiThrottleStats = {
  totalMessages: 0,
  priorityMessages: 0,
  normalMessages: 0,
  droppedMessages: 0,
  lastStatsTime: Date.now(),
};

// MIDI Message Throttling Functions
function addMidiMessage(message, priority, client, clientConfig, memoryOptimization) {
  if (!MIDI_THROTTLE_CONFIG.ENABLED || !clientConfig.enableMidiThrottling) {
    // Direct send if throttling is disabled
    client.send(JSON.stringify(message));
    return;
  }

  const messageEntry = memoryOptimization && memoryOptimization.OPTIMIZE_OBJECTS 
    ? memoryOptimization.getObjectFromPool('messageEntry')
    : { message: null, priority: 'normal', timestamp: 0 };
  
  messageEntry.message = message;
  messageEntry.priority = priority || 'normal';
  messageEntry.timestamp = Date.now();

  // Add to appropriate queue based on priority
  if (priority === 'high' || MIDI_THROTTLE_CONFIG.PRIORITY_MESSAGE_TYPES.includes(message.requestType)) {
    if (midiThrottleState.priorityQueue.length < MIDI_THROTTLE_CONFIG.PRIORITY_QUEUE_SIZE) {
      midiThrottleState.priorityQueue.push(messageEntry);
    } else {
      midiThrottleStats.droppedMessages++;
    }
  } else {
    if (midiThrottleState.normalQueue.length < MIDI_THROTTLE_CONFIG.NORMAL_QUEUE_SIZE) {
      midiThrottleState.normalQueue.push(messageEntry);
    } else {
      midiThrottleStats.droppedMessages++;
    }
  }

  // Start throttling if not already active
  if (!midiThrottleState.isThrottling) {
    startMidiThrottling(client);
  }
}

function startMidiThrottling(client) {
  if (midiThrottleState.isThrottling) return;
  
  midiThrottleState.isThrottling = true;
  processMidiQueue(client);
}

function processMidiQueue(client) {
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
      // Error handling would be passed from main module
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
      // Error handling would be passed from main module
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
      processMidiQueue(client);
    }, MIDI_THROTTLE_CONFIG.THROTTLE_DELAY);
  } else {
    midiThrottleState.isThrottling = false;
  }
}

function flushMidiQueue(client) {
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
      // Error handling would be passed from main module
    }
  }
  
  while (midiThrottleState.normalQueue.length > 0) {
    const messageEntry = midiThrottleState.normalQueue.shift();
    try {
      client.send(JSON.stringify(messageEntry.message));
    } catch (error) {
      // Error handling would be passed from main module
    }
  }
  
  midiThrottleState.isThrottling = false;
}

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
  logger.logInfo(`🎹 MIDI Throttling Stats: ${stats.totalMessages} sent, ${stats.priorityMessages} priority, ${stats.normalMessages} normal, ${stats.droppedMessages} dropped`);
}

// Export functions and configuration
module.exports = {
  MIDI_THROTTLE_CONFIG,
  midiThrottleState,
  midiThrottleStats,
  addMidiMessage,
  startMidiThrottling,
  processMidiQueue,
  flushMidiQueue,
  getMidiThrottleStats,
  logMidiThrottleStats,
}; 