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

    /**
     * Show game rules in a modal dialog
     * @param {string} title - Game title
     * @param {string} rules - Game rules text
     */
    showRules(title, rules) {
      // Create modal container
      const modal = document.createElement('div');
      modal.className = 'game-rules-modal';
      modal.innerHTML = `
        <div class="game-rules-content">
          <h2>${title}</h2>
          <div class="rules-text">${rules}</div>
          <button class="close-rules-btn">Got it!</button>
        </div>
      `;

      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        .game-rules-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .game-rules-content {
          background: var(--card-bg);
          padding: 30px;
          border-radius: 15px;
          max-width: 500px;
          width: 90%;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .game-rules-content h2 {
          color: var(--primary);
          margin-bottom: 20px;
          font-size: 24px;
        }
        .rules-text {
          text-align: left;
          line-height: 1.6;
          margin-bottom: 20px;
          color: var(--text-color);
        }
        .close-rules-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.2s;
        }
        .close-rules-btn:hover {
          background: var(--primary-dark);
        }
      `;
      document.head.appendChild(style);

      // Add to document
      document.body.appendChild(modal);

      // Add close button handler
      modal.querySelector('.close-rules-btn').addEventListener('click', () => {
        modal.remove();
      });
    }
  }