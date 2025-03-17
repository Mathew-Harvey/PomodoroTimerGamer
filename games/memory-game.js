/**
 * Memory Game - Implements a card matching memory game
 * Extends the GameInterface base class
 */
class MemoryGame extends GameInterface {
    constructor(containerId, connectionState) {
      super(containerId, connectionState);
      
      // Game state
      this.gameState = {
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        moves: 0,
        playerTurn: true, // true for local player, false for remote player
        playerScore: 0,
        opponentScore: 0,
        totalGames: 0,
        gameComplete: false
      };
      
      // Card symbols (emojis) for matching pairs
      this.cardSymbols = [
        '🐱', '🐶', '🐼', '🦊', '🐵', '🦁', '🐮', '🐷', 
        '🦄', '🐢', '🐘', '🦒', '🐠', '🦋', '🐝', '🦜'
      ];
      
      // DOM elements - will be set in initialize()
      this.boardContainer = null;
      this.gameBoard = null;
      this.gameStatus = null;
      this.newGameBtn = null;
      this.playerScoreDisplay = null;
      this.opponentScoreDisplay = null;
      this.movesDisplay = null;
    }
    
    /**
     * Initialize the game - set up DOM elements, event listeners, etc.
     */
    initialize() {
      // Create a container for this specific game
      this.boardContainer = document.createElement('div');
      this.boardContainer.className = 'memory-game';
      this.container.appendChild(this.boardContainer);
      
      // Set up the HTML structure
      this.setupHTML();
      
      // Get DOM elements
      this.gameStatus = this.boardContainer.querySelector('.game-status');
      this.gameBoard = this.boardContainer.querySelector('.memory-board');
      this.playerScoreDisplay = this.boardContainer.querySelector('.player-score');
      this.opponentScoreDisplay = this.boardContainer.querySelector('.opponent-score');
      this.movesDisplay = this.boardContainer.querySelector('.moves');
      this.newGameBtn = this.boardContainer.querySelector('.new-game-btn');
      
      // Add event listener for new game button
      this.newGameBtn.addEventListener('click', () => this.startNewGame());
  
      // Initialize game board with cards
      this.createInitialGameBoard();
    }
    
    /**
     * Set up the HTML structure for the game
     */
    setupHTML() {
      this.boardContainer.innerHTML = `
        <h2>Memory Game</h2>
        <div class="game-info">
          <div class="game-status">Your turn! Find matching pairs.</div>
          <div class="score-display">
            <div class="score-card">You: <span class="player-score">0</span></div>
            <div class="score-card">Opponent: <span class="opponent-score">0</span></div>
            <div class="score-card">Moves: <span class="moves">0</span></div>
          </div>
        </div>
        <div class="memory-board"></div>
        <button class="new-game-btn secondary">New Game</button>
      `;
      
      // Add specific styles for memory game
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .memory-board {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-gap: 10px;
          margin: 20px 0;
        }
        
        .memory-card {
          aspect-ratio: 1;
          background-color: var(--primary);
          border-radius: 5px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 2rem;
          cursor: pointer;
          transition: transform 0.3s ease, background-color 0.3s ease;
          transform-style: preserve-3d;
        }
        
        .memory-card.flipped {
          transform: rotateY(180deg);
          background-color: var(--card-bg);
        }
        
        .memory-card.matched {
          background-color: var(--secondary);
          transform: rotateY(180deg);
          cursor: default;
        }
        
        .memory-card .card-content {
          display: none;
        }
        
        .memory-card.flipped .card-content, 
        .memory-card.matched .card-content {
          display: block;
          transform: rotateY(180deg);
        }
      `;
      document.head.appendChild(styleElement);
    }
    
    /**
     * Create the initial game board with shuffled cards
     */
    createInitialGameBoard() {
      // Create and shuffle cards
      this.shuffleCards();
      
      // Clear the board
      this.gameBoard.innerHTML = '';
      
      // Create the cards and add to the board
      this.gameState.cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'memory-card';
        cardElement.dataset.index = index;
        cardElement.innerHTML = `<div class="card-content">${card.symbol}</div>`;
        
        // Add click event handler
        cardElement.addEventListener('click', () => this.handleCardClick(index));
        
        this.gameBoard.appendChild(cardElement);
      });
      
      // Update game status
      this.updateGameStatus();
    }
    
    /**
     * Shuffle cards and create a new game board
     */
    shuffleCards() {
      // Select pairs of symbols based on board size (4x4 = 8 pairs)
      const selectedSymbols = this.cardSymbols.slice(0, 8);
      
      // Create pairs
      let cards = [];
      selectedSymbols.forEach(symbol => {
        cards.push({ symbol, matched: false });
        cards.push({ symbol, matched: false });
      });
      
      // Shuffle cards using Fisher-Yates algorithm
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }
      
      this.gameState.cards = cards;
      this.gameState.flippedCards = [];
      this.gameState.matchedPairs = 0;
      this.gameState.moves = 0;
      this.gameState.gameComplete = false;
    }
    
    /**
     * Handle card click
     * @param {number} index - Index of the clicked card
     */
    handleCardClick(index) {
      // Ignore if not player's turn, game complete, or clicking on already flipped/matched card
      if (!this.gameState.playerTurn || 
          this.gameState.gameComplete || 
          this.gameState.flippedCards.includes(index) || 
          this.gameState.cards[index].matched) {
        return;
      }
      
      // Limit to flipping at most 2 cards at once
      if (this.gameState.flippedCards.length >= 2) {
        return;
      }
      
      // Flip the card
      this.flipCard(index);
      
      // Send move to peer if connected
      if (this.connectionState.connection) {
        this.connectionState.connection.send({
          type: 'game-card-flip',
          gameType: 'memory',
          cardIndex: index
        });
      }
      
      // Check for match if two cards are flipped
      if (this.gameState.flippedCards.length === 2) {
        this.gameState.moves++;
        this.movesDisplay.textContent = this.gameState.moves;
        
        const [firstIndex, secondIndex] = this.gameState.flippedCards;
        const firstCard = this.gameState.cards[firstIndex];
        const secondCard = this.gameState.cards[secondIndex];
        
        // Check if the symbols match
        if (firstCard.symbol === secondCard.symbol) {
          // Match found
          setTimeout(() => {
            this.markAsMatched(firstIndex, secondIndex);
            
            // Update score
            this.gameState.playerScore++;
            this.playerScoreDisplay.textContent = this.gameState.playerScore;
            
            // Check if game is complete
            if (this.gameState.matchedPairs === 8) {
              this.gameComplete();
            } else {
              // Keep the turn since player found a match
              this.updateGameStatus();
              this.gameState.flippedCards = [];
            }
            
            // Send match notification to peer
            if (this.connectionState.connection) {
              this.connectionState.connection.send({
                type: 'game-match-found',
                gameType: 'memory',
                cardIndices: [firstIndex, secondIndex],
                playerScore: this.gameState.playerScore,
                playerTurn: true // Keep the turn
              });
            }
          }, 1000);
        } else {
          // No match, flip back after delay
          setTimeout(() => {
            this.flipCardBack(firstIndex);
            this.flipCardBack(secondIndex);
            
            // Switch turn to opponent
            this.gameState.playerTurn = false;
            this.gameState.flippedCards = [];
            this.updateGameStatus();
            
            // Send turn switch to peer
            if (this.connectionState.connection) {
              this.connectionState.connection.send({
                type: 'game-turn-switch',
                gameType: 'memory',
                playerTurn: true // Setting to true for them
              });
            }
          }, 1000);
        }
      }
    }
    
    /**
     * Flip a card to show its symbol
     * @param {number} index - Index of the card to flip
     */
    flipCard(index) {
      // Add to flipped cards array
      this.gameState.flippedCards.push(index);
      
      // Update the UI
      const cardElement = this.gameBoard.querySelector(`.memory-card[data-index="${index}"]`);
      cardElement.classList.add('flipped');
    }
    
    /**
     * Flip a card back to hide its symbol
     * @param {number} index - Index of the card to flip back
     */
    flipCardBack(index) {
      // Remove from flipped cards array
      this.gameState.flippedCards = this.gameState.flippedCards.filter(i => i !== index);
      
      // Update the UI
      const cardElement = this.gameBoard.querySelector(`.memory-card[data-index="${index}"]`);
      cardElement.classList.remove('flipped');
    }
    
    /**
     * Mark cards as matched (permanently revealed)
     * @param {number} index1 - Index of the first card
     * @param {number} index2 - Index of the second card
     */
    markAsMatched(index1, index2) {
      // Update the game state
      this.gameState.cards[index1].matched = true;
      this.gameState.cards[index2].matched = true;
      this.gameState.matchedPairs++;
      
      // Update the UI
      const card1 = this.gameBoard.querySelector(`.memory-card[data-index="${index1}"]`);
      const card2 = this.gameBoard.querySelector(`.memory-card[data-index="${index2}"]`);
      
      card1.classList.remove('flipped');
      card2.classList.remove('flipped');
      card1.classList.add('matched');
      card2.classList.add('matched');
    }
    
    /**
     * Handle game completion
     */
    gameComplete() {
      this.gameState.gameComplete = true;
      this.gameState.totalGames++;
      
      // Determine winner
      let statusText = '';
      if (this.gameState.playerScore > this.gameState.opponentScore) {
        statusText = 'You win! 🎉';
      } else if (this.gameState.playerScore < this.gameState.opponentScore) {
        statusText = 'Opponent wins. Try again!';
      } else {
        statusText = "It's a tie!";
      }
      
      this.gameStatus.textContent = `Game complete! ${statusText}`;
      
      // Send game complete notification to peer
      if (this.connectionState.connection) {
        this.connectionState.connection.send({
          type: 'game-complete',
          gameType: 'memory',
          playerScore: this.gameState.playerScore,
          opponentScore: this.gameState.opponentScore,
          totalGames: this.gameState.totalGames
        });
      }
    }
    
    /**
     * Update the game status text
     */
    updateGameStatus() {
      if (this.gameState.gameComplete) {
        return; // Don't update if game is completed
      }
      
      if (this.gameState.playerTurn) {
        this.gameStatus.textContent = 'Your turn! Find matching pairs.';
      } else {
        this.gameStatus.textContent = "Opponent's turn.";
      }
    }
    
    /**
     * Start a new game - reset board and scores
     */
    startNewGame() {
      this.shuffleCards();
      this.gameState.playerTurn = this.connectionState.isHost || !this.connectionState.isConnected;
      this.gameState.moves = 0;
      this.movesDisplay.textContent = '0';
      this.updateGameStatus();
      
      // Recreate the board with new cards
      this.createInitialGameBoard();
      
      // Send new game notification to peer
      if (this.connectionState.connection) {
        this.connectionState.connection.send({
          type: 'new-game',
          gameType: 'memory',
          cards: this.gameState.cards,
          playerTurn: !this.gameState.playerTurn
        });
      }
    }
    
    /**
     * Reset the game
     */
    reset() {
      // Only reset if game is complete
      if (this.gameState.gameComplete) {
        this.startNewGame();
      }
    }
    
    /**
     * Handle data received from peer
     * @param {Object} data - Data received from peer
     */
    handlePeerData(data) {
      console.log('Memory Game received data:', data);
      
      switch (data.type) {
        case 'new-game':
          // Sync game state with peer
          this.gameState.cards = data.cards;
          this.gameState.playerTurn = data.playerTurn;
          this.gameState.flippedCards = [];
          this.gameState.matchedPairs = 0;
          this.gameState.moves = 0;
          this.gameState.gameComplete = false;
          
          // Update UI
          this.createInitialGameBoard();
          this.movesDisplay.textContent = '0';
          this.updateGameStatus();
          break;
          
        case 'game-card-flip':
          // Opponent flipped a card
          this.flipCard(data.cardIndex);
          break;
          
        case 'game-match-found':
          // Opponent found a match
          const [firstIndex, secondIndex] = data.cardIndices;
          
          // Mark cards as matched
          this.markAsMatched(firstIndex, secondIndex);
          
          // Update opponent score
          this.gameState.opponentScore++;
          this.opponentScoreDisplay.textContent = this.gameState.opponentScore;
          
          // Update turn
          this.gameState.playerTurn = !data.playerTurn;
          this.gameState.flippedCards = [];
          
          // Check if game is complete
          if (this.gameState.matchedPairs === 8) {
            this.gameComplete();
          } else {
            this.updateGameStatus();
          }
          break;
          
        case 'game-turn-switch':
          // Opponent's turn ended
          this.gameState.playerTurn = data.playerTurn;
          this.gameState.flippedCards = [];
          this.updateGameStatus();
          break;
          
        case 'game-complete':
          // Sync final game state
          this.gameState.playerScore = data.opponentScore; // Reversed from their perspective
          this.gameState.opponentScore = data.playerScore; // Reversed from their perspective
          this.gameState.totalGames = data.totalGames;
          this.gameState.gameComplete = true;
          
          // Update UI
          this.playerScoreDisplay.textContent = this.gameState.playerScore;
          this.opponentScoreDisplay.textContent = this.gameState.opponentScore;
          
          // Determine winner from our perspective
          let statusText = '';
          if (this.gameState.playerScore > this.gameState.opponentScore) {
            statusText = 'You win! 🎉';
          } else if (this.gameState.playerScore < this.gameState.opponentScore) {
            statusText = 'Opponent wins. Try again!';
          } else {
            statusText = "It's a tie!";
          }
          
          this.gameStatus.textContent = `Game complete! ${statusText}`;
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