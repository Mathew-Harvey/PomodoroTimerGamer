/**
 * GameManager - Handles loading, switching, and coordinating between different games
 */
class GameManager {
    /**
     * @param {Object} connectionState - Shared connection state for P2P functionality
     */
    constructor(connectionState) {
      this.games = {};
      this.currentGame = null;
      this.connectionState = connectionState;
      this.gameContainerId = 'gameContainer';
      this.gameMenuContainer = null;
    }
    
    /**
     * Initialize the game manager and load all available games
     */
    initialize() {
      // Create the game container if it doesn't exist
      let gameContainer = document.getElementById(this.gameContainerId);
      if (!gameContainer) {
        gameContainer = document.createElement('div');
        gameContainer.id = this.gameContainerId;
        gameContainer.className = 'card game-container';
        gameContainer.style.display = 'none';
        document.querySelector('.container').appendChild(gameContainer);
      }
      
      // Create the game menu container
      this.gameMenuContainer = document.createElement('div');
      this.gameMenuContainer.className = 'game-menu-container';
      gameContainer.appendChild(this.gameMenuContainer);
      
      // Register available games
      this.registerGame('tictactoe', new TicTacToe(this.gameContainerId, this.connectionState));
      this.registerGame('memory', new MemoryGame(this.gameContainerId, this.connectionState));
      this.registerGame('minicraft', new MiniCraft(this.gameContainerId, this.connectionState));
      
      // Initialize all games
      for (const gameId in this.games) {
        this.games[gameId].initialize();
        this.games[gameId].hide();
        
        // Add instructions to each game container
        GameInstructions.addInstructions(gameId, this.games[gameId].boardContainer);
      }
      
      // Create the game selector menu
      this.createGameMenu();
      
      // Set default game
      this.switchGame('tictactoe');
    }
    
    /**
     * Create the game selection menu
     */
    createGameMenu() {
      this.gameMenuContainer.innerHTML = '<div class="game-selector"><h3>Select a Game:</h3><div class="game-buttons"></div></div>';
      const gameButtons = this.gameMenuContainer.querySelector('.game-buttons');
      
      // Create buttons for each game
      for (const gameId in this.games) {
        const button = document.createElement('button');
        button.className = 'game-select-btn';
        button.textContent = this.formatGameName(gameId);
        button.addEventListener('click', () => {
          this.switchGame(gameId);
          
          // Notify peer about game switch
          if (this.connectionState.connection) {
            this.connectionState.connection.send({
              type: 'game-switch',
              gameId: gameId
            });
          }
        });
        gameButtons.appendChild(button);
      }
    }
    
    /**
     * Format game ID to a readable name
     * @param {string} gameId - The game ID to format
     * @returns {string} - Formatted name
     */
    formatGameName(gameId) {
      // Simple formatter that capitalizes first letter and adds spaces before capital letters
      return gameId
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
    }
    
    /**
     * Register a new game with the manager
     * @param {string} gameId - Unique identifier for the game
     * @param {GameInterface} gameInstance - Instance of the game class
     */
    registerGame(gameId, gameInstance) {
      this.games[gameId] = gameInstance;
    }
    
    /**
     * Show the currently active game
     */
    showCurrentGame() {
      if (this.currentGame) {
        this.currentGame.show();
      }
    }
    
    /**
     * Hide the currently active game
     */
    hideCurrentGame() {
      if (this.currentGame) {
        this.currentGame.hide();
      }
    }
    
    /**
     * Reset the currently active game
     */
    resetCurrentGame() {
      if (this.currentGame) {
        this.currentGame.reset();
      }
    }
    
    /**
     * Switch to a different game
     * @param {string} gameId - ID of the game to switch to
     */
    switchGame(gameId) {
      if (this.games[gameId]) {
        if (this.currentGame) {
          this.currentGame.hide();
        }
        this.currentGame = this.games[gameId];
        this.currentGame.show();
        this.currentGame.reset();
        
        // Highlight the selected game button
        const buttons = document.querySelectorAll('.game-select-btn');
        buttons.forEach(btn => {
          if (btn.textContent === this.formatGameName(gameId)) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
      }
    }
    
    /**
     * Handle data received from peer
     * @param {Object} data - Data received from peer
     */
    handlePeerData(data) {
      // Handle game switching
      if (data.type === 'game-switch') {
        this.switchGame(data.gameId);
        return;
      }
      
      // Handle game-specific messages
      if (data.gameType && this.games[data.gameType]) {
        // Forward to specific game
        this.games[data.gameType].handlePeerData(data);
      } else if (this.currentGame) {
        // If no gameType is specified, pass to current game
        this.currentGame.handlePeerData(data);
      }
    }
  }