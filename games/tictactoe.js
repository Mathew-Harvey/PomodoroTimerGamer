/**
 * TicTacToe - Implements the Tic-Tac-Toe game
 * Extends the GameInterface base class
 */
class TicTacToe extends GameInterface {
    constructor(containerId, connectionState) {
      super(containerId, connectionState);
      
      // Game state
      this.gameState = {
        board: Array(9).fill(''),
        isPlayerX: connectionState.isHost, // Host is always X
        isMyTurn: connectionState.isHost, // Host always goes first
        scoreX: 0,
        scoreO: 0,
        gamesPlayed: 0
      };
      
      // Track board state separately to check for game-in-progress
      this.currentBoardState = Array(9).fill('');
      
      // DOM elements - will be set in initialize()
      this.boardContainer = null;
      this.gameStatus = null;
      this.tictactoeBoard = null;
      this.scoreXDisplay = null;
      this.scoreODisplay = null;
      this.gamesPlayedDisplay = null;
      this.newGameBtn = null;
    }
    
    /**
     * Initialize the game - set up DOM elements, event listeners, etc.
     */
    initialize() {
      // Create a container for this specific game
      this.boardContainer = document.createElement('div');
      this.boardContainer.className = 'tictactoe-game';
      this.container.appendChild(this.boardContainer);
      
      // Set up the HTML structure
      this.setupHTML();
      
      // Get DOM elements
      this.gameStatus = this.boardContainer.querySelector('#gameStatus');
      this.tictactoeBoard = this.boardContainer.querySelector('#tictactoeBoard');
      this.scoreXDisplay = this.boardContainer.querySelector('#scoreX');
      this.scoreODisplay = this.boardContainer.querySelector('#scoreO');
      this.gamesPlayedDisplay = this.boardContainer.querySelector('#gamesPlayed');
      this.newGameBtn = this.boardContainer.querySelector('#newGameBtn');
      
      // Initialize the game board
      this.initializeGameBoard();
      this.updateScoreDisplay();
      
      // Event listener for new game button
      this.newGameBtn.addEventListener('click', () => this.startNewGame());
    }
    
    /**
     * Set up the HTML structure for the game
     */
    setupHTML() {
      this.boardContainer.innerHTML = `
        <h2>Tic-Tac-Toe</h2>
        <div class="game-status" id="gameStatus">Waiting for your move (X)</div>
        <div class="score-display">
          <div class="score-card">Player X: <span id="scoreX">0</span></div>
          <div class="score-card">Player O: <span id="scoreO">0</span></div>
          <div class="score-card">Games: <span id="gamesPlayed">0</span></div>
        </div>
        <div class="tictactoe-board" id="tictactoeBoard">
          <!-- Board cells will be added via JavaScript -->
        </div>
        <button id="newGameBtn" class="secondary" style="margin-top: 20px;">New Game</button>
      `;
    }
    
    /**
     * Initialize the game board by creating cells and adding event listeners
     */
    initializeGameBoard() {
      this.tictactoeBoard.innerHTML = '';
      for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'tictactoe-cell';
        cell.dataset.index = i;
        cell.addEventListener('click', () => {
          console.log("Cell clicked:", i);
          this.handleCellClick(i);
        });
        this.tictactoeBoard.appendChild(cell);
      }
      
      // Initialize with empty board
      this.gameState.board = Array(9).fill('');
    }
    
    /**
     * Update the game board UI based on the current state
     */
    updateGameBoard() {
      const cells = this.tictactoeBoard.getElementsByClassName('tictactoe-cell');
      
      console.log("Updating game board with state:", JSON.stringify(this.gameState.board));
      
      // Save the current state to our tracking variable
      this.currentBoardState = JSON.parse(JSON.stringify(this.gameState.board));
      
      // Ensure each cell's content matches the game state
      for (let i = 0; i < cells.length; i++) {
        cells[i].textContent = this.gameState.board[i];
        
        // Add styling to make cells more visible when occupied
        if (this.gameState.board[i] === 'X') {
          cells[i].style.color = '#ff6b6b';
          cells[i].style.backgroundColor = '#f8f9fa';
          cells[i].style.fontWeight = 'bold';
        } else if (this.gameState.board[i] === 'O') {
          cells[i].style.color = '#5e60ce';
          cells[i].style.backgroundColor = '#f8f9fa';
          cells[i].style.fontWeight = 'bold';
        } else {
          cells[i].style.color = '';
          cells[i].style.backgroundColor = '';
          cells[i].style.fontWeight = '';
        }
      }
      
      // Force a repaint to ensure the UI updates
      this.tictactoeBoard.style.display = 'none';
      setTimeout(() => {
        this.tictactoeBoard.style.display = 'grid';
      }, 5); // Slightly longer delay to ensure update completes
    }
    
    /**
     * Handle cell click in Tic Tac Toe
     * @param {number} index - Index of the clicked cell (0-8)
     */
    handleCellClick(index) {
      // Check if it's my turn and the cell is empty
      if (!this.gameState.isMyTurn || this.gameState.board[index] !== '') return;
  
      // Make a deep copy of the board
      const updatedBoard = JSON.parse(JSON.stringify(this.gameState.board));
      const symbol = this.gameState.isPlayerX ? 'X' : 'O';
      updatedBoard[index] = symbol;
      
      // Log before setting state
      console.log("Before setting board:", JSON.stringify(this.gameState.board));
      
      // Update local state
      this.gameState.board = updatedBoard;
      
      // Log after setting state
      console.log("After setting board:", JSON.stringify(this.gameState.board));
      
      // Update the UI immediately
      this.updateGameBoard();
  
      // Check for winner or draw
      const winner = this.checkWinner();
      if (winner) {
        this.gameStatus.textContent = `${winner} wins!`;
        // Update score
        if (winner === 'X') {
          this.gameState.scoreX++;
          this.scoreXDisplay.textContent = this.gameState.scoreX;
        } else {
          this.gameState.scoreO++;
          this.scoreODisplay.textContent = this.gameState.scoreO;
        }
        this.gameState.gamesPlayed++;
        this.gamesPlayedDisplay.textContent = this.gameState.gamesPlayed;
        
        // Send final game state to peer
        if (this.connectionState.connection) {
          this.connectionState.connection.send({
            type: 'game-end',
            gameType: 'tictactoe',
            winner: winner,
            board: JSON.parse(JSON.stringify(this.gameState.board)), // Send a deep copy
            scoreX: this.gameState.scoreX,
            scoreO: this.gameState.scoreO,
            gamesPlayed: this.gameState.gamesPlayed
          });
        }
        return;
      }
  
      if (this.gameState.board.every(cell => cell !== '')) {
        this.gameStatus.textContent = 'Game ended in a draw!';
        this.gameState.gamesPlayed++;
        this.gamesPlayedDisplay.textContent = this.gameState.gamesPlayed;
        
        // Send final game state to peer
        if (this.connectionState.connection) {
          this.connectionState.connection.send({
            type: 'game-end',
            gameType: 'tictactoe',
            winner: 'draw',
            board: JSON.parse(JSON.stringify(this.gameState.board)), // Send a deep copy
            scoreX: this.gameState.scoreX,
            scoreO: this.gameState.scoreO,
            gamesPlayed: this.gameState.gamesPlayed
          });
        }
        return;
      }
  
      // Toggle turn
      this.gameState.isMyTurn = false;
      this.gameStatus.textContent = "Opponent's turn";
  
      // Send move to peer - include the full updated board to ensure consistency
      if (this.connectionState.connection) {
        this.connectionState.connection.send({
          type: 'game-move',
          gameType: 'tictactoe',
          index: index,
          board: JSON.parse(JSON.stringify(this.gameState.board)) // Send a deep copy
        });
      }
    }
    
    /**
     * Check for a winner in Tic Tac Toe
     * @returns {string|null} - 'X', 'O', or null if no winner
     */
    checkWinner() {
      const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]             // diagonals
      ];
  
      for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (this.gameState.board[a] && 
            this.gameState.board[a] === this.gameState.board[b] && 
            this.gameState.board[a] === this.gameState.board[c]) {
          return this.gameState.board[a];
        }
      }
  
      return null;
    }
    
    /**
     * Start a new game - reset board but keep scores
     */
    startNewGame() {
      // Create a new empty board
      const newBoard = Array(9).fill('');
      console.log("Starting new game with empty board:", JSON.stringify(newBoard));
      
      // Set the board state
      this.gameState.board = newBoard;
      
      // Host is always X and goes first
      this.gameState.isPlayerX = this.connectionState.isHost;
      this.gameState.isMyTurn = this.connectionState.isHost;
      
      // Update the UI
      this.updateGameBoard();
      this.gameStatus.textContent = this.gameState.isMyTurn ? 
                                  `Your turn (${this.gameState.isPlayerX ? 'X' : 'O'})` : 
                                  "Opponent's turn";
                                  
      // Send new game state to peer
      if (this.connectionState.connection) {
        this.connectionState.connection.send({
          type: 'new-game',
          gameType: 'tictactoe',
          board: JSON.parse(JSON.stringify(newBoard)),
          isMyTurn: false, // Opponent always goes second
          isPlayerX: false // Opponent is always O
        });
      }
    }
    
    /**
     * Update the score display
     */
    updateScoreDisplay() {
      this.scoreXDisplay.textContent = this.gameState.scoreX;
      this.scoreODisplay.textContent = this.gameState.scoreO;
      this.gamesPlayedDisplay.textContent = this.gameState.gamesPlayed;
    }
    
    /**
     * Reset the game (only if no game is in progress)
     */
    reset() {
      // Check if we already have a game in progress
      if (!this.currentBoardState.every(cell => cell === '')) {
        console.log("Game in progress, not resetting board:", JSON.stringify(this.currentBoardState));
        return; // Don't reset if there's a game in progress
      }
      
      // Create a new empty board
      const newBoard = Array(9).fill('');
      console.log("Resetting game with empty board:", JSON.stringify(newBoard));
      
      // Update the game state
      this.gameState.board = newBoard;
      this.gameState.isPlayerX = this.connectionState.isHost; // Host is always X
      this.gameState.isMyTurn = this.connectionState.isHost; // Host always goes first
      
      // Update the UI
      this.updateGameBoard();
      this.updateScoreDisplay();
      this.gameStatus.textContent = this.gameState.isMyTurn ? 
                                  `Your turn (${this.gameState.isPlayerX ? 'X' : 'O'})` : 
                                  "Opponent's turn";
    }
    
    /**
     * Handle data received from peer
     * @param {Object} data - Data received from peer
     */
    handlePeerData(data) {
      console.log('TicTacToe received data:', data);
      
      switch (data.type) {
        case 'game-move':
          // Store the board state first to avoid losing it
          console.log("Received game move. Before update:", JSON.stringify(this.gameState.board));
          const updatedBoard = [...data.board];
          this.gameState.board = updatedBoard;
          console.log("After update:", JSON.stringify(this.gameState.board));
          
          // Update the UI immediately
          this.updateGameBoard();
          
          // Check for winner or draw
          const winner = this.checkWinner();
          if (winner) {
            this.gameStatus.textContent = `${winner} wins!`;
            return;
          }
          
          if (this.gameState.board.every(cell => cell !== '')) {
            this.gameStatus.textContent = 'Game ended in a draw!';
            return;
          }
          
          // It's my turn now (since opponent just moved)
          this.gameState.isMyTurn = true;
          this.gameStatus.textContent = `Your turn (${this.gameState.isPlayerX ? 'X' : 'O'})`;
          break;
          
        case 'game-end':
          // Store the board state to avoid losing it
          console.log("Received game end. Board state:", JSON.stringify(data.board));
          this.gameState.board = JSON.parse(JSON.stringify(data.board));
          this.gameState.scoreX = data.scoreX;
          this.gameState.scoreO = data.scoreO;
          this.gameState.gamesPlayed = data.gamesPlayed;
          this.updateGameBoard();
          this.updateScoreDisplay();
          
          if (data.winner === 'draw') {
            this.gameStatus.textContent = 'Game ended in a draw!';
          } else {
            this.gameStatus.textContent = `${data.winner} wins!`;
          }
          break;
          
        case 'new-game':
          // Store the board state to avoid losing it
          this.gameState.board = JSON.parse(JSON.stringify(data.board));
          this.gameState.isMyTurn = data.isMyTurn;
          this.gameState.isPlayerX = data.isPlayerX; // Set player symbol from peer
          this.updateGameBoard();
          this.gameStatus.textContent = this.gameState.isMyTurn ? 
                                    `Your turn (${this.gameState.isPlayerX ? 'X' : 'O'})` : 
                                    "Opponent's turn";
          break;
      }
    }
    
    /**
     * Show this game
     */
    show() {
      this.boardContainer.style.display = 'block';
    }
    
    /**
     * Hide this game
     */
    hide() {
      this.boardContainer.style.display = 'none';
    }
  }