/**
 * GameInterface - Base class that all games must extend
 * Defines the standard interface for interacting with the timer system
 */
class GameInterface {
    /**
     * @param {string} containerId - ID of the container element where the game will be rendered
     * @param {Object} connectionState - Shared connection state for P2P functionality
     */
    constructor(containerId, connectionState) {
      this.container = document.getElementById(containerId);
      this.connectionState = connectionState;
    }
    
    /**
     * Initialize the game - set up DOM elements, event listeners, etc.
     * This method must be implemented by each game.
     */
    initialize() {
      throw new Error("Method 'initialize()' must be implemented by each game");
    }
    
    /**
     * Start a new game or round
     * This method must be implemented by each game.
     */
    startNewGame() {
      throw new Error("Method 'startNewGame()' must be implemented by each game");
    }
    
    /**
     * Handle data received from peer
     * @param {Object} data - Data received from peer
     * This method must be implemented by each game.
     */
    handlePeerData(data) {
      throw new Error("Method 'handlePeerData()' must be implemented by each game");
    }
    
    /**
     * Reset the game state
     * Called when switching to focus time or when initializing a new game
     * This method must be implemented by each game.
     */
    reset() {
      throw new Error("Method 'reset()' must be implemented by each game");
    }
    
    /**
     * Show the game
     */
    show() {
      this.container.style.display = 'flex';
    }
    
    /**
     * Hide the game
     */
    hide() {
      this.container.style.display = 'none';
    }
  }