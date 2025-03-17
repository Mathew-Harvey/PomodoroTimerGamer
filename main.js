/**
 * Sync Pomodoro - Main JavaScript
 * Handles timer functionality, peer connections, and syncing
 */

// DOM Elements - will be initialized in the setupDOMReferences function
let timeDisplay, statusDisplay, startBtn, resetBtn, syncBtn;
let focusDurationInput, restDurationInput, connectionInfo;
let connectionStatus, connectionDot, shareUrl, notification;
let welcomeScreen, createSessionBtn, joinSessionBtn, reconnectBtn;

// Connection dialog elements
let connectionDialog, connectionDialogTitle, connectionDialogStatus;
let connectionProgressBar, connectionError, cancelConnectionBtn, retryConnectionBtn;

// Timer State
let timerState = {
  timeRemaining: 25 * 60, // in seconds
  isRunning: false,
  isFocusTime: true,
  focusDuration: 25 * 60, // in seconds
  restDuration: 5 * 60, // in seconds
  timerId: null
};

// Connection State
let connectionState = {
  peer: null,
  peerId: null,
  connection: null,
  isConnected: false,
  isHost: false,
  isJoining: false,
  connectionTimeout: null,
  lastPeerId: null
};

// Game Manager instance
let gameManager;

/**
 * Initialize the application when DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', () => {
  // Set up DOM references
  setupDOMReferences();
  
  // Initialize game manager first
  gameManager = new GameManager(connectionState);
  gameManager.initialize();
  
  // Set up event listeners after game manager is initialized
  setupEventListeners();
  
  // Initialize timer display
  updateTimerDisplay();
  
  // Check URL for peer ID
  checkURLForPeerId();
});

/**
 * Set up references to DOM elements
 */
function setupDOMReferences() {
  timeDisplay = document.getElementById('timeDisplay');
  statusDisplay = document.getElementById('statusDisplay');
  startBtn = document.getElementById('startBtn');
  resetBtn = document.getElementById('resetBtn');
  syncBtn = document.getElementById('syncBtn');
  focusDurationInput = document.getElementById('focusDuration');
  restDurationInput = document.getElementById('restDuration');
  connectionInfo = document.getElementById('connectionInfo');
  connectionStatus = document.getElementById('connectionStatus');
  connectionDot = document.getElementById('connectionDot');
  shareUrl = document.getElementById('shareUrl');
  notification = document.getElementById('notification');
  welcomeScreen = document.getElementById('welcomeScreen');
  createSessionBtn = document.getElementById('createSessionBtn');
  joinSessionBtn = document.getElementById('joinSessionBtn');
  reconnectBtn = document.getElementById('reconnectBtn');
  
  // Connection dialog elements
  connectionDialog = document.getElementById('connectionDialog');
  connectionDialogTitle = document.getElementById('connectionDialogTitle');
  connectionDialogStatus = document.getElementById('connectionDialogStatus');
  connectionProgressBar = document.getElementById('connectionProgressBar');
  connectionError = document.getElementById('connectionError');
  cancelConnectionBtn = document.getElementById('cancelConnectionBtn');
  retryConnectionBtn = document.getElementById('retryConnectionBtn');
}

/**
 * Set up event listeners for UI elements
 */
function setupEventListeners() {
  startBtn.addEventListener('click', toggleTimer);
  resetBtn.addEventListener('click', resetTimer);
  syncBtn.addEventListener('click', shareSession);
  focusDurationInput.addEventListener('change', updateTimerSettings);
  restDurationInput.addEventListener('change', updateTimerSettings);
  
  reconnectBtn.addEventListener('click', handleReconnect);
  createSessionBtn.addEventListener('click', handleCreateSession);
  joinSessionBtn.addEventListener('click', handleJoinSession);
  cancelConnectionBtn.addEventListener('click', handleCancelConnection);
  retryConnectionBtn.addEventListener('click', handleRetryConnection);
  document.getElementById('useTimerOnlyBtn').addEventListener('click', handleUseTimerOnly);
  
  // Add event listener for play now button
  const playNowBtn = document.getElementById('playNowBtn');
  if (playNowBtn) {
    playNowBtn.addEventListener('click', handlePlayNow);
  }
  
  // Add event listeners for game selection buttons
  const gameButtons = document.querySelectorAll('.game-select-btn');
  gameButtons.forEach(button => {
    button.addEventListener('click', () => {
      const gameId = button.dataset.game;
      if (gameManager) {
        gameManager.switchGame(gameId);
        // Highlight selected game button
        gameButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
      }
    });
  });
}

/**
 * Format seconds to MM:SS
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string (MM:SS)
 */
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Update timer display based on current timer state
 */
function updateTimerDisplay() {
  timeDisplay.textContent = formatTime(timerState.timeRemaining);
  
  if (timerState.isFocusTime) {
    statusDisplay.textContent = 'Focus Time';
    statusDisplay.className = 'status focus';
    // Only try to hide game if gameManager exists
    if (gameManager) {
      gameManager.hideCurrentGame();
    }
  } else {
    statusDisplay.textContent = 'Rest Time';
    statusDisplay.className = 'status rest';
    // Only try to show game if gameManager exists
    if (gameManager) {
      gameManager.showCurrentGame();
    }
  }
  
  startBtn.textContent = timerState.isRunning ? 'Pause' : 'Start';
}

/**
 * Start/pause timer
 */
function toggleTimer() {
  timerState.isRunning = !timerState.isRunning;
  
  if (timerState.isRunning) {
    timerState.timerId = setInterval(tickTimer, 1000);
    
    // Sync with peer
    if (connectionState.connection) {
      connectionState.connection.send({
        type: 'timer-start',
        state: timerState
      });
    }
  } else {
    clearInterval(timerState.timerId);
    
    // Sync with peer
    if (connectionState.connection) {
      connectionState.connection.send({
        type: 'timer-pause',
        state: timerState
      });
    }
  }
  
  updateTimerDisplay();
}

/**
 * Timer tick - update the timer every second
 */
function tickTimer() {
  timerState.timeRemaining -= 1;
  
  if (timerState.timeRemaining <= 0) {
    // Switch between focus and rest
    timerState.isFocusTime = !timerState.isFocusTime;
    timerState.timeRemaining = timerState.isFocusTime ? timerState.focusDuration : timerState.restDuration;
    
    // Show notification
    showNotification(timerState.isFocusTime ? 'Focus time started!' : 'Rest time! Game time!');
    
    // If starting a rest period, show the game container and reset the current game
    if (!timerState.isFocusTime) {
      const gameContainer = document.getElementById('gameContainer');
      gameContainer.style.display = 'flex';
      gameManager.showCurrentGame();
      gameManager.resetCurrentGame();
    } else {
      // If starting focus time, hide the game container
      const gameContainer = document.getElementById('gameContainer');
      gameContainer.style.display = 'none';
      gameManager.hideCurrentGame();
    }
    
    // Sync with peer
    if (connectionState.connection) {
      connectionState.connection.send({
        type: 'timer-phase-change',
        state: timerState
      });
    }
  }
  
  updateTimerDisplay();
}

/**
 * Reset timer to initial state
 */
function resetTimer() {
  clearInterval(timerState.timerId);
  timerState.isRunning = false;
  timerState.isFocusTime = true;
  timerState.timeRemaining = timerState.focusDuration;
  updateTimerDisplay();
  
  // Sync with peer
  if (connectionState.connection) {
    connectionState.connection.send({
      type: 'timer-reset',
      state: timerState
    });
  }
}

/**
 * Update timer settings based on input values
 */
function updateTimerSettings() {
  const newFocusDuration = parseInt(focusDurationInput.value) * 60;
  const newRestDuration = parseInt(restDurationInput.value) * 60;
  
  // Store original values to check if there's a change
  const oldFocusDuration = timerState.focusDuration;
  const oldRestDuration = timerState.restDuration;
  
  // Update the duration settings
  timerState.focusDuration = newFocusDuration;
  timerState.restDuration = newRestDuration;
  
  // If we're currently in the phase that was changed, update the time remaining
  if (timerState.isFocusTime && oldFocusDuration !== newFocusDuration) {
    // Only update if timer is not running or if we explicitly want to update running timers
    if (!timerState.isRunning) {
      timerState.timeRemaining = newFocusDuration;
    }
  } else if (!timerState.isFocusTime && oldRestDuration !== newRestDuration) {
    // Only update if timer is not running or if we explicitly want to update running timers
    if (!timerState.isRunning) {
      timerState.timeRemaining = newRestDuration;
    }
  }
  
  updateTimerDisplay();
  
  // Sync with peer
  if (connectionState.connection) {
    connectionState.connection.send({
      type: 'timer-settings-update',
      state: {
        focusDuration: timerState.focusDuration,
        restDuration: timerState.restDuration,
        timeRemaining: timerState.timeRemaining,
        isFocusTime: timerState.isFocusTime,
        isRunning: timerState.isRunning
      }
    });
  }
}

/**
 * Show notification
 * @param {string} message - Message to display in notification
 */
function showNotification(message) {
  notification.textContent = message;
  notification.classList.add('visible');
  
  setTimeout(() => {
    notification.classList.remove('visible');
  }, 3000);
}

/* ==================================
   Peer Connection Functions
   ================================== */

/**
 * Initialize PeerJS connection
 */
function initializePeer() {
  try {
    // Generate a more reliable ID
    const peerId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    connectionState.peer = new Peer(peerId, {
      debug: 2,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      }
    });
    
    connectionState.peerId = peerId;
    
    connectionState.peer.on('open', (id) => {
      console.log('My peer ID is: ' + id);
      connectionState.peerId = id;
      updateConnectionDialog('Peer initialized', 30);
      
      // If we're the host, show the share URL immediately
      if (!connectionState.isJoining) {
        shareSession();
      }
    });
    
    connectionState.peer.on('connection', (conn) => {
      handlePeerConnection(conn);
    });
    
    connectionState.peer.on('error', (err) => {
      console.error('Peer error:', err);
      showConnectionError('Connection error: ' + err.message);
    });
  } catch (error) {
    console.error('Failed to initialize PeerJS:', error);
    showConnectionError('Failed to initialize connection');
  }
}

/**
 * Handle peer connection
 * @param {Object} conn - PeerJS connection object
 */
function handlePeerConnection(conn) {
  connectionState.connection = conn;
  connectionState.isConnected = true;
  connectionState.isHost = true;
  
  conn.on('open', () => {
    connectionStatus.textContent = 'Connected with peer';
    connectionDot.classList.add('connected');
    showNotification('Peer connected!');
    updateConnectionDialog('Peer connected', 70);
    
    // Send current timer state
    conn.send({
      type: 'timer-sync',
      state: timerState
    });
    
    completeConnection();
  });
  
  conn.on('data', handlePeerData);
  
  conn.on('close', () => {
    connectionState.isConnected = false;
    connectionStatus.textContent = 'Connection closed';
    connectionDot.classList.remove('connected');
    showNotification('Peer disconnected');
    reconnectBtn.style.display = 'block';
  });
  
  conn.on('error', (err) => {
    console.error('Connection error:', err);
    showConnectionError('Connection error: ' + err.message);
  });
}

/**
 * Handle data received from peer
 * @param {Object} data - Data received from peer
 */
function handlePeerData(data) {
  console.log('Received data:', data);
  
  // Handle timer-related messages
  switch (data.type) {
    case 'timer-sync':
      // Sync entire timer state
      timerState = data.state;
      clearInterval(timerState.timerId);
      if (timerState.isRunning) {
        timerState.timerId = setInterval(tickTimer, 1000);
      }
      updateTimerDisplay();
      break;
      
    case 'timer-start':
      timerState.isRunning = true;
      clearInterval(timerState.timerId);
      timerState.timerId = setInterval(tickTimer, 1000);
      updateTimerDisplay();
      break;
      
    case 'timer-pause':
      timerState.isRunning = false;
      clearInterval(timerState.timerId);
      updateTimerDisplay();
      break;
      
    case 'timer-reset':
      clearInterval(timerState.timerId);
      timerState.isRunning = false;
      timerState.isFocusTime = true;
      timerState.timeRemaining = timerState.focusDuration;
      updateTimerDisplay();
      break;
      
    case 'timer-phase-change':
      timerState.isFocusTime = data.state.isFocusTime;
      timerState.timeRemaining = data.state.timeRemaining;
      updateTimerDisplay();
      showNotification(timerState.isFocusTime ? 'Focus time started!' : 'Rest time! Game time!');
      
      // Handle game container visibility based on phase
      if (!timerState.isFocusTime) {
        const gameContainer = document.getElementById('gameContainer');
        gameContainer.style.display = 'flex';
        gameManager.showCurrentGame();
        gameManager.resetCurrentGame();
      } else {
        const gameContainer = document.getElementById('gameContainer');
        gameContainer.style.display = 'none';
        gameManager.hideCurrentGame();
      }
      break;
      
    case 'timer-settings-update':
      // Update duration settings
      timerState.focusDuration = data.state.focusDuration;
      timerState.restDuration = data.state.restDuration;
      
      // Update UI input values
      focusDurationInput.value = timerState.focusDuration / 60;
      restDurationInput.value = timerState.restDuration / 60;
      
      // Update the current timer if needed
      if (data.state.isFocusTime === timerState.isFocusTime) {
        // Only update time remaining if we're in the same phase that was changed
        timerState.timeRemaining = data.state.timeRemaining;
      } else if (timerState.isFocusTime && !data.state.isRunning) {
        // If we're in focus time and the timer isn't running, update to the new focus duration
        timerState.timeRemaining = timerState.focusDuration;
      } else if (!timerState.isFocusTime && !data.state.isRunning) {
        // If we're in rest time and the timer isn't running, update to the new rest duration
        timerState.timeRemaining = timerState.restDuration;
      }
      
      // Update the timer display
      updateTimerDisplay();
      
      // Show notification about the update
      showNotification('Timer settings updated by peer');
      break;
      
    default:
      // Forward game-related messages to the game manager
      gameManager.handlePeerData(data);
      break;
  }
}

/**
 * Connect to a peer
 * @param {string} peerId - ID of the peer to connect to
 */
function connectToPeer(peerId) {
  try {
    updateConnectionDialog('Connecting to peer...', 40);
    
    // Clean up any existing connection
    if (connectionState.connection) {
      connectionState.connection.close();
    }
    
    const conn = connectionState.peer.connect(peerId);
    
    // Set a timeout for the connection
    connectionState.connectionTimeout = setTimeout(() => {
      if (!connectionState.isConnected) {
        showConnectionError('Connection timed out. Please check the code and try again.');
      }
    }, 10000);
    
    conn.on('open', () => {
      clearTimeout(connectionState.connectionTimeout);
      connectionState.connection = conn;
      connectionState.isConnected = true;
      connectionState.isHost = false;
      connectionStatus.textContent = 'Connected with host';
      connectionDot.classList.add('connected');
      showNotification('Connected to host!');
      updateConnectionDialog('Connected to host', 70);
      
      completeConnection();
    });
    
    conn.on('data', handlePeerData);
    
    conn.on('close', () => {
      clearTimeout(connectionState.connectionTimeout);
      connectionState.isConnected = false;
      connectionStatus.textContent = 'Connection closed';
      connectionDot.classList.remove('connected');
      showNotification('Disconnected from host');
      reconnectBtn.style.display = 'block';
    });
    
    conn.on('error', (error) => {
      clearTimeout(connectionState.connectionTimeout);
      console.error('Connection error:', error);
      showConnectionError('Failed to connect: ' + error.message);
    });
  } catch (error) {
    console.error('Failed to connect to peer:', error);
    showConnectionError('Failed to connect: ' + error.message);
  }
}

/**
 * Generate and share session code
 * @returns {string} - The generated share code
 */
function shareSession() {
  console.log("Sharing session with peerId:", connectionState.peerId);
  
  if (!connectionState.peerId) {
    showNotification('Connection not initialized yet');
    return;
  }
  
  // Create a simple code instead of a full URL
  const shareCode = connectionState.peerId;
  
  // Update UI with share code
  shareUrl.value = shareCode;
  shareUrl.style.display = 'block';
  
  // Store the ID for potential reconnection
  connectionState.lastPeerId = connectionState.peerId;
  
  // Copy to clipboard using modern API
  navigator.clipboard.writeText(shareCode).then(() => {
    showNotification('Share code copied to clipboard! Share this code with your friend.');
    connectionStatus.textContent = 'Ready! Share this code to connect';
  }).catch(() => {
    // Fallback for older browsers
    shareUrl.select();
    document.execCommand('copy');
    showNotification('Share code copied to clipboard! Share this code with your friend.');
    connectionStatus.textContent = 'Ready! Share this code to connect';
  });
  
  console.log("Share code generated:", shareCode);
  return shareCode;
}

/**
 * Update connection dialog
 * @param {string} message - Status message to display
 * @param {number} progress - Progress percentage (0-100)
 */
function updateConnectionDialog(message, progress) {
  connectionDialogStatus.textContent = message;
  connectionProgressBar.style.width = progress + '%';
}

/**
 * Show connection error in dialog
 * @param {string} message - Error message to display
 */
function showConnectionError(message) {
  console.log("Connection error:", message);
  connectionError.style.display = 'block';
  connectionError.textContent = message;
  connectionDialogStatus.textContent = 'Connection failed';
  retryConnectionBtn.style.display = 'block';
}

/**
 * Complete connection process and hide dialog
 */
function completeConnection() {
  updateConnectionDialog('Connection complete!', 100);
  
  // Hide the dialog after a brief delay
  setTimeout(() => {
    connectionDialog.style.display = 'none';
    if (!connectionState.isJoining) {
      shareSession();
    }
  }, 1000);
}

/**
 * Check URL for a peer ID parameter
 */
function checkURLForPeerId() {
  const urlParams = new URLSearchParams(window.location.search);
  const peerIdFromUrl = urlParams.get('peer');
  
  if (peerIdFromUrl) {
    joinSessionBtn.click();
  }
}

/* ==================================
   Event Handlers for UI Elements
   ================================== */

/**
 * Handle reconnect button click
 */
function handleReconnect() {
  if (connectionState.lastPeerId) {
    // Show connection dialog
    connectionDialog.style.display = 'flex';
    connectionDialogTitle.textContent = 'Reconnecting to Session';
    connectionState.isJoining = true;
    
    // Clear error display
    connectionError.style.display = 'none';
    retryConnectionBtn.style.display = 'none';
    
    // Update status
    updateConnectionDialog('Attempting to reconnect...', 20);
    
    // Clean up existing connection
    if (connectionState.connection) {
      connectionState.connection.close();
    }
    
    if (connectionState.peer) {
      connectionState.peer.destroy();
    }
    
    // Reinitialize and try to connect
    initializePeer();
    
    setTimeout(() => {
      connectToPeer(connectionState.lastPeerId);
    }, 1500);
  } else {
    showNotification('No previous connection found');
  }
}

/**
 * Handle create session button click
 */
function handleCreateSession() {
  console.log("Creating new session");
  welcomeScreen.style.display = 'none';
  connectionDialog.style.display = 'flex';
  connectionDialogTitle.textContent = 'Creating New Session';
  connectionState.isJoining = false;
  
  // Make sure URL field is clear and visible
  shareUrl.value = '';
  shareUrl.style.display = 'block';
  
  // Reset progress
  updateConnectionDialog('Initializing session...', 10);
  
  // Initialize after a short delay to ensure UI updates
  setTimeout(() => {
    initializePeer();
  }, 100);
}

/**
 * Handle join session button click
 */
function handleJoinSession() {
  console.log("Join session button clicked");
  const urlParams = new URLSearchParams(window.location.search);
  const peerId = urlParams.get('peer');
  
  if (peerId) {
    console.log("Found peer ID in URL:", peerId);
    welcomeScreen.style.display = 'none';
    connectionDialog.style.display = 'flex';
    connectionDialogTitle.textContent = 'Joining Session';
    connectionState.isJoining = true;
    connectionState.lastPeerId = peerId;
    
    // Reset progress
    updateConnectionDialog('Preparing to join session...', 10);
    
    // Initialize after a short delay to ensure UI updates
    setTimeout(() => {
      initializePeer();
      
      // Wait a bit for peer to initialize
      setTimeout(() => {
        connectToPeer(peerId);
      }, 1500);
    }, 100);
  } else {
    const peerIdInput = prompt('Enter the share code from your friend:');
    
    if (peerIdInput) {
      console.log("User entered peer ID:", peerIdInput);
      welcomeScreen.style.display = 'none';
      connectionDialog.style.display = 'flex';
      connectionDialogTitle.textContent = 'Joining Session';
      connectionState.isJoining = true;
      
      // Clean up the input - remove any spaces and convert to uppercase
      const extractedPeerId = peerIdInput.trim().toUpperCase();
      console.log("Cleaned peer ID:", extractedPeerId);
      
      connectionState.lastPeerId = extractedPeerId;
      
      // Reset progress
      updateConnectionDialog('Preparing to join session...', 10);
      
      // Initialize after a short delay to ensure UI updates
      setTimeout(() => {
        initializePeer();
        
        // Wait a bit for peer to initialize
        setTimeout(() => {
          connectToPeer(extractedPeerId);
        }, 1500);
      }, 100);
    }
  }
}

/**
 * Handle cancel connection button click
 */
function handleCancelConnection() {
  // Clean up connection attempts
  if (connectionState.connectionTimeout) {
    clearTimeout(connectionState.connectionTimeout);
  }
  
  if (connectionState.peer) {
    connectionState.peer.destroy();
  }
  
  // Reset the connection state
  connectionState = {
    peer: null,
    peerId: null,
    connection: null,
    isConnected: false,
    isHost: false,
    isJoining: false,
    connectionTimeout: null,
    lastPeerId: null
  };
  
  // Hide connection dialog and show welcome screen
  connectionDialog.style.display = 'none';
  welcomeScreen.style.display = 'flex';
}

/**
 * Handle retry connection button click
 */
function handleRetryConnection() {
  // Clear error state
  connectionError.style.display = 'none';
  retryConnectionBtn.style.display = 'none';
  
  // Update progress bar
  updateConnectionDialog('Retrying connection...', 20);
  
  // Clean up any existing connection
  if (connectionState.connection) {
    connectionState.connection.close();
  }
  
  if (connectionState.peer) {
    connectionState.peer.destroy();
  }
  
  // Reinitialize
  initializePeer();
  
  // If we were joining, try to reconnect
  if (connectionState.isJoining && connectionState.lastPeerId) {
    setTimeout(() => {
      connectToPeer(connectionState.lastPeerId);
    }, 1500);
  }
}

/**
 * Handle use timer only button click
 */
function handleUseTimerOnly() {
  // Hide welcome screen
  welcomeScreen.style.display = 'none';
  
  // Hide connection-related elements
  syncBtn.style.display = 'none';
  connectionInfo.style.display = 'none';
  
  // Show notification
  showNotification('Timer started in solo mode');
  
  // Initialize timer display
  updateTimerDisplay();
}

/**
 * Handle play now button click
 */
function handlePlayNow() {
  // Show game container
  const gameContainer = document.getElementById('gameContainer');
  gameContainer.style.display = 'flex';
  
  // Show current game
  if (gameManager) {
    gameManager.showCurrentGame();
    gameManager.resetCurrentGame();
  }
}