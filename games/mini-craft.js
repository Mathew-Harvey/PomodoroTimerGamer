/**
 * MiniCraft - A simplified StarCraft-inspired strategy game
 * Extends the GameInterface base class
 */
class MiniCraft extends GameInterface {
    constructor(containerId, connectionState) {
      super(containerId, connectionState);
      
      // Game constants
      this.GRID_SIZE = 12; // 12x12 grid
      this.TILE_SIZE = 40; // 40px per tile
      this.RESOURCE_GAIN_INTERVAL = 1500; // ms
      this.ACTION_DELAY = 300; // ms delay between actions
      
      // Game state
      this.gameState = {
        map: [], // 2D array representing the game map
        playerResources: 50,
        opponentResources: 50,
        playerUnits: [],
        opponentUnits: [],
        playerBuildings: [],
        opponentBuildings: [],
        selectedEntity: null,
        isMyTurn: true,
        gameComplete: false,
        winner: null,
        resourceTimer: null,
        actionQueue: [],
        processingAction: false
      };
      
      // Entity types and their properties
      this.entityTypes = {
        // Units
        worker: {
          name: 'Worker',
          emoji: '👷',
          cost: 50,
          health: 40,
          attack: 5,
          range: 1,
          speed: 1,
          canHarvest: true,
          canBuild: true,
          buildTime: 5
        },
        soldier: {
          name: 'Soldier',
          emoji: '🗡️',
          cost: 100,
          health: 80,
          attack: 15,
          range: 1,
          speed: 1,
          canHarvest: false,
          canBuild: false,
          buildTime: 8
        },
        archer: {
          name: 'Archer',
          emoji: '🏹',
          cost: 125,
          health: 60,
          attack: 12,
          range: 3,
          speed: 1,
          canHarvest: false,
          canBuild: false,
          buildTime: 10
        },
        
        // Buildings
        commandCenter: {
          name: 'Command Center',
          emoji: '🏰',
          cost: 0, // Starting building
          health: 500,
          size: 2, // 2x2 tiles
          canProduce: ['worker'],
          isBase: true
        },
        barracks: {
          name: 'Barracks',
          emoji: '🏢',
          cost: 150,
          health: 300,
          size: 2, // 2x2 tiles
          canProduce: ['soldier'],
          isBase: false
        },
        range: {
          name: 'Range',
          emoji: '🏛️',
          cost: 200,
          health: 250,
          size: 2, // 2x2 tiles
          canProduce: ['archer'],
          isBase: false
        }
      };
      
      // Map tile types
      this.tileTypes = {
        empty: {
          name: 'Empty',
          symbol: ' ',
          passable: true,
          color: '#8db580' // Light green for grass
        },
        resource: {
          name: 'Crystal',
          symbol: '💎',
          passable: false,
          color: '#a2d6f9' // Light blue for crystal field
        },
        obstacle: {
          name: 'Rock',
          symbol: '🪨',
          passable: false,
          color: '#c2b280' // Sand color
        },
        water: {
          name: 'Water',
          symbol: '~',
          passable: false,
          color: '#5dadec' // Blue for water
        }
      };
      
      // DOM elements - will be set in initialize()
      this.gameBoard = null;
      this.boardContainer = null;
      this.gameStatus = null;
      this.resourceDisplay = null;
      this.opponentResourceDisplay = null;
      this.buildButtons = null;
      this.unitInfoPanel = null;
      this.instructionsBtn = null;
      this.instructionsPanel = null;
      
      // Action states
      this.currentAction = null; // 'move', 'attack', 'build', 'harvest'
      this.pendingBuilding = null;
    }
    
    /**
     * Initialize the game - set up DOM elements, event listeners, etc.
     */
    initialize() {
      // Create a container for this specific game
      this.boardContainer = document.createElement('div');
      this.boardContainer.className = 'mini-craft-game';
      this.container.appendChild(this.boardContainer);
      
      // Set up the HTML structure
      this.setupHTML();
      
      // Get DOM references
      this.gameBoard = this.boardContainer.querySelector('.game-board');
      this.gameStatus = this.boardContainer.querySelector('.game-status');
      this.resourceDisplay = this.boardContainer.querySelector('.player-resources');
      this.opponentResourceDisplay = this.boardContainer.querySelector('.opponent-resources');
      this.buildButtons = this.boardContainer.querySelector('.build-buttons');
      this.unitInfoPanel = this.boardContainer.querySelector('.unit-info-panel');
      this.instructionsBtn = this.boardContainer.querySelector('.instructions-btn');
      this.instructionsPanel = this.boardContainer.querySelector('.instructions-panel');
      
      // Set up instructions toggle
      this.instructionsBtn.addEventListener('click', () => {
        this.instructionsPanel.classList.toggle('show');
        if (this.instructionsPanel.classList.contains('show')) {
          this.instructionsBtn.textContent = 'Hide Instructions';
        } else {
          this.instructionsBtn.textContent = 'Show Instructions';
        }
      });
      
      // Set up action buttons
      this.setupActionButtons();
      
      // Generate the initial game map
      this.generateMap();
      
      // Update the UI
      this.updateResourceDisplay();
      this.updateBuildButtons();
      this.updateGameStatus();
      
      // Add window resize handler to ensure the game board stays properly sized
      window.addEventListener('resize', () => {
        this.updateBoardSize();
      });
    }
    
    /**
     * Set up the HTML structure for the game
     */
    setupHTML() {
      this.boardContainer.innerHTML = `
        <div class="game-header">
          <h2>MiniCraft</h2>
          <div class="resource-display">
            <div class="player-resource-container">Your Resources: <span class="player-resources">50</span> 💎</div>
            <div class="opponent-resource-container">Opponent: <span class="opponent-resources">50</span> 💎</div>
          </div>
        </div>
        
        <div class="game-status">Waiting for your move</div>
        
        <div class="game-controls">
          <div class="build-buttons">
            <!-- Build buttons will be added dynamically -->
          </div>
          
          <div class="action-buttons">
            <button class="action-btn move-btn" data-action="move">Move</button>
            <button class="action-btn attack-btn" data-action="attack">Attack</button>
            <button class="action-btn harvest-btn" data-action="harvest">Harvest</button>
            <button class="action-btn cancel-btn" data-action="cancel">Cancel</button>
          </div>
        </div>
        
        <div class="game-board-container">
          <div class="game-board"></div>
        </div>
        
        <div class="unit-info-panel">
          Select a unit or building to see details
        </div>
        
        <button class="instructions-btn">Show Instructions</button>
        
        <div class="instructions-panel">
          <h3>MiniCraft Instructions</h3>
          <p>MiniCraft is a simplified real-time strategy game inspired by StarCraft.</p>
          
          <h4>Game Objective</h4>
          <p>Defeat your opponent by destroying their Command Center while protecting your own.</p>
          
          <h4>Resources</h4>
          <p>Gather resources (💎) using Worker units. Workers can harvest resources from crystal fields.</p>
          
          <h4>Buildings</h4>
          <ul>
            <li><strong>Command Center (🏰)</strong>: Your main base. If destroyed, you lose the game. Can produce Workers.</li>
            <li><strong>Barracks (🏢)</strong>: Produces Soldiers for combat.</li>
            <li><strong>Range (🏛️)</strong>: Produces Archers for ranged combat.</li>
          </ul>
          
          <h4>Units</h4>
          <ul>
            <li><strong>Worker (👷)</strong>: Gathers resources and constructs buildings.</li>
            <li><strong>Soldier (🗡️)</strong>: Strong melee combat unit.</li>
            <li><strong>Archer (🏹)</strong>: Ranged combat unit that can attack from a distance.</li>
          </ul>
          
          <h4>How to Play</h4>
          <ol>
            <li>Start by building Workers to gather resources.</li>
            <li>Construct additional buildings to produce combat units.</li>
            <li>Select a unit by clicking on it.</li>
            <li>Use the action buttons (Move, Attack, Harvest) to command your units.</li>
            <li>Build up your army and defeat your opponent's Command Center!</li>
          </ol>
        </div>
      `;
      
      // Add specific styles for MiniCraft
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .mini-craft-game {
          width: 100%;
        }
        
        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .resource-display {
          display: flex;
          gap: 20px;
        }
        
        .player-resource-container, .opponent-resource-container {
          background-color: var(--light-gray);
          padding: 8px 15px;
          border-radius: 8px;
          font-weight: 600;
        }
        
        .game-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 15px;
          justify-content: space-between;
        }
        
        .build-buttons, .action-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .build-btn, .action-btn {
          padding: 8px 12px;
          font-size: 0.9rem;
          margin-bottom: 5px;
        }
        
        .game-board-container {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }
        
        .game-board {
          display: grid;
          grid-template-columns: repeat(12, ${this.TILE_SIZE}px);
          grid-template-rows: repeat(12, ${this.TILE_SIZE}px);
          border: 2px solid var(--primary);
          border-radius: 5px;
          overflow: hidden;
        }
        
        .map-tile {
          width: ${this.TILE_SIZE}px;
          height: ${this.TILE_SIZE}px;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          font-size: 1.5rem;
          user-select: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .map-tile:hover {
          filter: brightness(1.2);
        }
        
        .map-tile.selectable {
          box-shadow: inset 0 0 0 2px yellow;
          animation: pulse 1s infinite;
        }
        
        .entity {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2;
          font-size: 1.8rem;
        }
        
        .entity.player {
          text-shadow: 0 0 3px white, 0 0 6px var(--primary);
        }
        
        .entity.opponent {
          text-shadow: 0 0 3px white, 0 0 6px var(--focus);
        }
        
        .entity.selected {
          box-shadow: inset 0 0 0 2px white, inset 0 0 0 4px var(--primary);
          animation: selected-pulse 1.5s infinite;
        }
        
        .entity.building {
          font-size: 2.2rem;
        }
        
        .health-bar {
          position: absolute;
          bottom: 2px;
          left: 10%;
          width: 80%;
          height: 4px;
          background-color: #ddd;
          border-radius: 2px;
          overflow: hidden;
        }
        
        .health-bar-fill {
          height: 100%;
          background-color: #4caf50;
          transition: width 0.3s ease;
        }
        
        .unit-info-panel {
          background-color: var(--light-gray);
          padding: 15px;
          border-radius: 8px;
          margin-top: 15px;
          min-height: 100px;
        }
        
        .instructions-btn {
          margin-top: 15px;
          width: 100%;
        }
        
        .instructions-panel {
          background-color: var(--light-gray);
          padding: 20px;
          border-radius: 8px;
          margin-top: 15px;
          display: none;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .instructions-panel.show {
          display: block;
        }
        
        .instructions-panel h3 {
          margin-top: 0;
          margin-bottom: 10px;
        }
        
        .instructions-panel h4 {
          margin-top: 15px;
          margin-bottom: 5px;
        }
        
        .instructions-panel ul, .instructions-panel ol {
          padding-left: 20px;
          margin-bottom: 10px;
        }
        
        .instructions-panel li {
          margin-bottom: 5px;
        }
        
        @keyframes pulse {
          0% { box-shadow: inset 0 0 0 2px rgba(255, 255, 0, 0.8); }
          50% { box-shadow: inset 0 0 0 2px rgba(255, 255, 0, 0.4); }
          100% { box-shadow: inset 0 0 0 2px rgba(255, 255, 0, 0.8); }
        }
        
        @keyframes selected-pulse {
          0% { box-shadow: inset 0 0 0 2px white, inset 0 0 0 4px rgba(94, 96, 206, 1); }
          50% { box-shadow: inset 0 0 0 2px white, inset 0 0 0 4px rgba(94, 96, 206, 0.6); }
          100% { box-shadow: inset 0 0 0 2px white, inset 0 0 0 4px rgba(94, 96, 206, 1); }
        }
        
        /* Building in progress animation */
        .building-progress {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: repeating-linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.2),
            rgba(255, 255, 255, 0.2) 10px,
            rgba(255, 255, 255, 0.3) 10px,
            rgba(255, 255, 255, 0.3) 20px
          );
          animation: progress-animation 2s linear infinite;
          z-index: 1;
        }
        
        @keyframes progress-animation {
          0% { background-position: 0 0; }
          100% { background-position: 40px 0; }
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .game-board {
            grid-template-columns: repeat(12, 30px);
            grid-template-rows: repeat(12, 30px);
          }
          
          .map-tile {
            width: 30px;
            height: 30px;
            font-size: 1.2rem;
          }
          
          .entity {
            font-size: 1.4rem;
          }
          
          .entity.building {
            font-size: 1.8rem;
          }
        }
      `;
      document.head.appendChild(styleElement);
    }
    
    /**
     * Set up action buttons and their event handlers
     */
    setupActionButtons() {
      const actionButtons = this.boardContainer.querySelectorAll('.action-btn');
      
      actionButtons.forEach(button => {
        button.addEventListener('click', () => {
          const action = button.dataset.action;
          
          // Reset all buttons
          actionButtons.forEach(btn => btn.classList.remove('active'));
          
          if (action === 'cancel') {
            // Cancel current action
            this.currentAction = null;
            this.pendingBuilding = null;
            this.clearSelectableTiles();
            this.updateGameStatus();
            return;
          }
          
          // If we don't have a selected entity, can't perform actions
          if (!this.gameState.selectedEntity) {
            this.showMessage('Select a unit first');
            return;
          }
          
          // Check if the selected entity is an opponent's unit
          if (this.gameState.selectedEntity.owner === 'opponent') {
            this.showMessage('You can only control your own units');
            return;
          }
          
          // Setting the current action
          this.currentAction = action;
          button.classList.add('active');
          
          // Handle different actions
          switch (action) {
            case 'move':
              this.showMovableTiles();
              this.updateGameStatus('Select a destination');
              break;
              
            case 'attack':
              this.showAttackableTiles();
              this.updateGameStatus('Select a target');
              break;
              
            case 'harvest':
              this.showHarvestTiles();
              this.updateGameStatus('Select a resource to harvest');
              break;
          }
        });
      });
    }
    
    /**
     * Update the size of the game board based on window size
     */
    updateBoardSize() {
      const containerWidth = this.boardContainer.clientWidth;
      const maxBoardSize = Math.min(containerWidth, 600); // Max size of 600px
      const tileSize = Math.floor(maxBoardSize / this.GRID_SIZE);
      
      // Update tile size
      this.TILE_SIZE = tileSize;
      
      // Update CSS
      const boardElement = this.boardContainer.querySelector('.game-board');
      boardElement.style.gridTemplateColumns = `repeat(${this.GRID_SIZE}, ${tileSize}px)`;
      boardElement.style.gridTemplateRows = `repeat(${this.GRID_SIZE}, ${tileSize}px)`;
      
      const tiles = boardElement.querySelectorAll('.map-tile');
      tiles.forEach(tile => {
        tile.style.width = `${tileSize}px`;
        tile.style.height = `${tileSize}px`;
      });
    }
    
    /**
     * Generate a random game map with resources and obstacles
     */
    generateMap() {
      // Clear existing map
      this.gameState.map = [];
      
      // Create empty map
      for (let y = 0; y < this.GRID_SIZE; y++) {
        const row = [];
        for (let x = 0; x < this.GRID_SIZE; x++) {
          row.push({
            type: 'empty',
            x: x,
            y: y,
            entity: null
          });
        }
        this.gameState.map.push(row);
      }
      
      // Add resources - 2 resource patches (one closer to each player)
      this.addResourcePatch(2, 3, 3, 2);
      this.addResourcePatch(this.GRID_SIZE - 5, this.GRID_SIZE - 3, 3, 2);
      
      // Add obstacles - random rocks and water
      for (let i = 0; i < 10; i++) {
        const x = Math.floor(Math.random() * (this.GRID_SIZE - 2)) + 1;
        const y = Math.floor(Math.random() * (this.GRID_SIZE - 2)) + 1;
        
        // Don't place obstacles near starting positions
        if ((x < 4 && y < 4) || (x > this.GRID_SIZE - 5 && y > this.GRID_SIZE - 5)) {
          continue;
        }
        
        this.gameState.map[y][x].type = Math.random() < 0.5 ? 'obstacle' : 'water';
      }
      
      // Add starting bases
      this.addBuilding(1, 1, 'commandCenter', 'player');
      this.addBuilding(this.GRID_SIZE - 3, this.GRID_SIZE - 3, 'commandCenter', 'opponent');
      
      // Add starting workers
      this.addUnit(3, 1, 'worker', 'player');
      this.addUnit(this.GRID_SIZE - 4, this.GRID_SIZE - 3, 'worker', 'opponent');
      
      // Render the map
      this.renderMap();
      
      // Start resource gathering timer
      this.startResourceTimer();
    }
    
    /**
     * Add a resource patch to the map
     * @param {number} startX - Starting X coordinate
     * @param {number} endX - Ending X coordinate
     * @param {number} startY - Starting Y coordinate
     * @param {number} endY - Ending Y coordinate
     */
    addResourcePatch(startX, endX, startY, endY) {
      for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
          this.gameState.map[y][x].type = 'resource';
        }
      }
    }
    
    /**
     * Start the resource timer that gives periodic resources based on harvesting
     */
    startResourceTimer() {
      // Clear any existing timer
      if (this.gameState.resourceTimer) {
        clearInterval(this.gameState.resourceTimer);
      }
      
      // Create a new timer
      this.gameState.resourceTimer = setInterval(() => {
        this.processResourceGain();
      }, this.RESOURCE_GAIN_INTERVAL);
    }
    
    /**
     * Process resource gain for workers that are harvesting
     */
    processResourceGain() {
      // Check if game is complete
      if (this.gameState.gameComplete) {
        clearInterval(this.gameState.resourceTimer);
        return;
      }
      
      // Calculate resource gain for player's harvesting workers
      let playerGain = 0;
      this.gameState.playerUnits.forEach(unit => {
        if (unit.type === 'worker' && unit.isHarvesting) {
          playerGain += 5;
        }
      });
      
      // Calculate resource gain for opponent's harvesting workers
      let opponentGain = 0;
      this.gameState.opponentUnits.forEach(unit => {
        if (unit.type === 'worker' && unit.isHarvesting) {
          opponentGain += 5;
        }
      });
      
      // Update resources
      this.gameState.playerResources += playerGain;
      this.gameState.opponentResources += opponentGain;
      
      // Update the display
      this.updateResourceDisplay();
    }
    
    /**
     * Render the game map and entities
     */
    renderMap() {
      // Clear the existing board
      this.gameBoard.innerHTML = '';
      
      // Create the map tiles
      for (let y = 0; y < this.GRID_SIZE; y++) {
        for (let x = 0; x < this.GRID_SIZE; x++) {
          const tile = this.gameState.map[y][x];
          const tileType = this.tileTypes[tile.type];
          
          // Create the tile element
          const tileElement = document.createElement('div');
          tileElement.className = 'map-tile';
          tileElement.dataset.x = x;
          tileElement.dataset.y = y;
          tileElement.style.backgroundColor = tileType.color;
          
          // Add symbol if needed
          if (tileType.symbol && tileType.symbol !== ' ') {
            tileElement.textContent = tileType.symbol;
          }
          
          // Add click event
          tileElement.addEventListener('click', () => this.handleTileClick(x, y));
          
          // Add the tile to the board
          this.gameBoard.appendChild(tileElement);
          
          // If there's an entity on this tile, render it
          if (tile.entity) {
            this.renderEntity(tile.entity, tileElement);
          }
        }
      }
    }
    
    /**
     * Render an entity (unit or building) on a tile
     * @param {Object} entity - The entity to render
     * @param {HTMLElement} tileElement - The tile element to render the entity on
     */
    renderEntity(entity, tileElement) {
      // Create entity element
      const entityElement = document.createElement('div');
      entityElement.className = `entity ${entity.type} ${entity.owner}`;
      if (entity.isBuilding) {
        entityElement.classList.add('building');
      }
      
      // If this entity is selected, add selected class
      if (this.gameState.selectedEntity && 
          this.gameState.selectedEntity.id === entity.id) {
        entityElement.classList.add('selected');
      }
      
      // Add emoji representation
      entityElement.textContent = this.entityTypes[entity.type].emoji;
      
      // Add health bar
      const healthBar = document.createElement('div');
      healthBar.className = 'health-bar';
      
      const healthBarFill = document.createElement('div');
      healthBarFill.className = 'health-bar-fill';
      const healthPercent = (entity.health / this.entityTypes[entity.type].health) * 100;
      healthBarFill.style.width = `${healthPercent}%`;
      
      // Change color based on health percentage
      if (healthPercent < 30) {
        healthBarFill.style.backgroundColor = '#f44336'; // Red
      } else if (healthPercent < 60) {
        healthBarFill.style.backgroundColor = '#ff9800'; // Orange
      }
      
      healthBar.appendChild(healthBarFill);
      entityElement.appendChild(healthBar);
      
      // If building is in progress, add building progress animation
      if (entity.buildProgress && entity.buildProgress < 100) {
        const progressElement = document.createElement('div');
        progressElement.className = 'building-progress';
        entityElement.appendChild(progressElement);
      }
      
      // Add to the tile
      tileElement.appendChild(entityElement);
    }
    
    /**
     * Handle clicking on a map tile
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    handleTileClick(x, y) {
      // If game is complete, ignore clicks
      if (this.gameState.gameComplete) return;
      
      // If we're processing an action, ignore clicks
      if (this.gameState.processingAction) return;
      
      const tile = this.gameState.map[y][x];
      
      // If we have a pending building and the tile is valid for building
      if (this.pendingBuilding && this.isTileBuildable(x, y, this.pendingBuilding)) {
        this.executeBuildingPlacement(x, y, this.pendingBuilding);
        return;
      }
      
      // If we have a current action and the tile is selectable
      if (this.currentAction) {
        const tileElement = this.gameBoard.querySelector(`.map-tile[data-x="${x}"][data-y="${y}"]`);
        
        if (tileElement.classList.contains('selectable')) {
          switch (this.currentAction) {
            case 'move':
              this.executeMove(x, y);
              break;
              
            case 'attack':
              this.executeAttack(x, y);
              break;
              
            case 'harvest':
              this.executeHarvest(x, y);
              break;
          }
          
          // Reset current action
          this.currentAction = null;
          this.clearSelectableTiles();
          return;
        }
      }
      
      // If tile has an entity, select it
      if (tile.entity) {
        this.selectEntity(tile.entity);
        return;
      }
      
      // If no entity, deselect current selection
      this.gameState.selectedEntity = null;
      this.updateUnitInfoPanel();
      this.renderMap(); // Re-render to remove selection highlight
    }
    
    /**
     * Check if a tile is valid for building placement
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {string} buildingType - Type of building
     * @returns {boolean} - Whether the tile is valid for building
     */
    isTileBuildable(x, y, buildingType) {
      const building = this.entityTypes[buildingType];
      const size = building.size;
      
      // Check if all required tiles are empty and within bounds
      for (let yOffset = 0; yOffset < size; yOffset++) {
        for (let xOffset = 0; xOffset < size; xOffset++) {
          const checkX = x + xOffset;
          const checkY = y + yOffset;
          
          // Check if coordinates are within bounds
          if (checkX >= this.GRID_SIZE || checkY >= this.GRID_SIZE) {
            return false;
          }
          
          const checkTile = this.gameState.map[checkY][checkX];
          
          // Tile must be empty (not resource, obstacle, water)
          if (checkTile.type !== 'empty') {
            return false;
          }
          
          // Tile must not have an entity
          if (checkTile.entity) {
            return false;
          }
        }
      }
      
      // Check if there's a worker nearby
      let hasWorkerNearby = false;
      this.gameState.playerUnits.forEach(unit => {
        if (unit.type === 'worker' && this.getDistance(unit.x, unit.y, x, y) <= 1) {
          hasWorkerNearby = true;
        }
      });
      
      return hasWorkerNearby;
    }
    
    /**
     * Execute building placement at the specified location
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {string} buildingType - Type of building to place
     */
    executeBuildingPlacement(x, y, buildingType) {
      const building = this.entityTypes[buildingType];
      const cost = building.cost;
      
      // Check if player has enough resources
      if (this.gameState.playerResources < cost) {
        this.showMessage(`Not enough resources. Needed: ${cost}`);
        return;
      }
      
      // Deduct resources
      this.gameState.playerResources -= cost;
      this.updateResourceDisplay();
      
      // Add the building to the map
      this.addBuilding(x, y, buildingType, 'player');
      
      // Reset pending building
      this.pendingBuilding = null;
      
      // Update game state and UI
      this.updateGameStatus();
      this.updateBuildButtons();
      
      // Send building placement to opponent
      if (this.connectionState.connection) {
        this.connectionState.connection.send({
          type: 'building-placed',
          gameType: 'minicraft',
          x: x,
          y: y,
          buildingType: buildingType
        });
      }
    }
    
    /**
     * Show tiles that are valid for movement
     */
    showMovableTiles() {
      // Clear any previously selectable tiles
      this.clearSelectableTiles();
      
      const entity = this.gameState.selectedEntity;
      
      // Only units can move, not buildings
      if (!entity || entity.isBuilding) {
        this.showMessage('Buildings cannot move');
        return;
      }
      
      const speed = this.entityTypes[entity.type].speed;
      
      // Find all tiles within movement range
      for (let y = 0; y < this.GRID_SIZE; y++) {
        for (let x = 0; x < this.GRID_SIZE; x++) {
          const distance = this.getDistance(entity.x, entity.y, x, y);
          
          // Check if within movement range and tile is passable
          if (distance <= speed && this.isTilePassable(x, y)) {
            const tileElement = this.gameBoard.querySelector(`.map-tile[data-x="${x}"][data-y="${y}"]`);
            tileElement.classList.add('selectable');
          }
        }
      }
    }
    
    /**
     * Show tiles that are valid for attacking
     */
    showAttackableTiles() {
      // Clear any previously selectable tiles
      this.clearSelectableTiles();
      
      const entity = this.gameState.selectedEntity;
      
      // Check if we have a selected entity that can attack
      if (!entity) return;
      
      // Buildings can't attack
      if (entity.isBuilding) {
        this.showMessage('Buildings cannot attack');
        return;
      }
      
      const range = this.entityTypes[entity.type].range;
      
      // Find all tiles within attack range that have an enemy entity
      for (let y = 0; y < this.GRID_SIZE; y++) {
        for (let x = 0; x < this.GRID_SIZE; x++) {
          const distance = this.getDistance(entity.x, entity.y, x, y);
          const tile = this.gameState.map[y][x];
          
          // Check if within attack range and has an enemy entity
          if (distance <= range && tile.entity && tile.entity.owner === 'opponent') {
            const tileElement = this.gameBoard.querySelector(`.map-tile[data-x="${x}"][data-y="${y}"]`);
            tileElement.classList.add('selectable');
          }
        }
      }
    }
    
    /**
     * Show tiles that are valid for resource harvesting
     */
    showHarvestTiles() {
      // Clear any previously selectable tiles
      this.clearSelectableTiles();
      
      const entity = this.gameState.selectedEntity;
      
      // Check if we have a selected entity that can harvest
      if (!entity || !this.entityTypes[entity.type].canHarvest) {
        this.showMessage('This unit cannot harvest resources');
        return;
      }
      
      // Find all resource tiles within 1 tile of the worker
      for (let y = 0; y < this.GRID_SIZE; y++) {
        for (let x = 0; x < this.GRID_SIZE; x++) {
          const distance = this.getDistance(entity.x, entity.y, x, y);
          const tile = this.gameState.map[y][x];
          
          // Check if within harvest range and is a resource tile
          if (distance <= 1 && tile.type === 'resource') {
            const tileElement = this.gameBoard.querySelector(`.map-tile[data-x="${x}"][data-y="${y}"]`);
            tileElement.classList.add('selectable');
          }
        }
      }
    }
    
    /**
     * Clear selectable highlights from all tiles
     */
    clearSelectableTiles() {
      const selectableTiles = this.gameBoard.querySelectorAll('.selectable');
      selectableTiles.forEach(tile => {
        tile.classList.remove('selectable');
      });
    }
    
    /**
     * Execute unit movement to the specified coordinates
     * @param {number} x - Destination X coordinate
     * @param {number} y - Destination Y coordinate
     */
    executeMove(x, y) {
      const entity = this.gameState.selectedEntity;
      
      // Mark as processing action to prevent multiple clicks
      this.gameState.processingAction = true;
      
      // Remove from current location
      const currentTile = this.gameState.map[entity.y][entity.x];
      currentTile.entity = null;
      
      // Update entity position
      entity.x = x;
      entity.y = y;
      
      // If unit was harvesting, stop harvesting
      if (entity.isHarvesting) {
        entity.isHarvesting = false;
      }
      
      // Add to new location
      const newTile = this.gameState.map[y][x];
      newTile.entity = entity;
      
      // Update the game board
      this.renderMap();
      
      // Send move to opponent
      if (this.connectionState.connection) {
        this.connectionState.connection.send({
          type: 'unit-moved',
          gameType: 'minicraft',
          unitId: entity.id,
          fromX: currentTile.x,
          fromY: currentTile.y,
          toX: x,
          toY: y
        });
      }
      
      // Add short delay before allowing next action
      setTimeout(() => {
        this.gameState.processingAction = false;
        this.updateGameStatus();
      }, this.ACTION_DELAY);
    }
    
    /**
     * Execute attack on the specified coordinates
     * @param {number} x - Target X coordinate
     * @param {number} y - Target Y coordinate
     */
    executeAttack(x, y) {
      const attacker = this.gameState.selectedEntity;
      const targetTile = this.gameState.map[y][x];
      const target = targetTile.entity;
      
      if (!target) return;
      
      // Mark as processing action to prevent multiple clicks
      this.gameState.processingAction = true;
      
      // Calculate damage
      const damage = this.entityTypes[attacker.type].attack;
      target.health -= damage;
      
      // Check if target is destroyed
      if (target.health <= 0) {
        // Remove from the map
        targetTile.entity = null;
        
        // Remove from the appropriate array
        if (target.owner === 'player') {
          this.gameState.playerUnits = this.gameState.playerUnits.filter(u => u.id !== target.id);
          this.gameState.playerBuildings = this.gameState.playerBuildings.filter(b => b.id !== target.id);
        } else {
          this.gameState.opponentUnits = this.gameState.opponentUnits.filter(u => u.id !== target.id);
          this.gameState.opponentBuildings = this.gameState.opponentBuildings.filter(b => b.id !== target.id);
        }
        
        // Check if it was a command center
        if (target.type === 'commandCenter') {
          this.gameOver(target.owner === 'player' ? 'opponent' : 'player');
        }
      }
      
      // Update the game board
      this.renderMap();
      
      // Send attack to opponent
      if (this.connectionState.connection) {
        this.connectionState.connection.send({
          type: 'unit-attacked',
          gameType: 'minicraft',
          attackerId: attacker.id,
          targetId: target.id,
          damage: damage,
          targetDestroyed: target.health <= 0
        });
      }
      
      // Add short delay before allowing next action
      setTimeout(() => {
        this.gameState.processingAction = false;
        this.updateGameStatus();
      }, this.ACTION_DELAY);
    }
    
    /**
     * Execute resource harvesting at the specified coordinates
     * @param {number} x - Resource X coordinate
     * @param {number} y - Resource Y coordinate
     */
    executeHarvest(x, y) {
      const worker = this.gameState.selectedEntity;
      
      // Set worker to harvesting state
      worker.isHarvesting = true;
      
      // Update game status
      this.updateGameStatus(`Worker is now harvesting resources`);
      
      // Update the game board
      this.renderMap();
      
      // Send harvest action to opponent
      if (this.connectionState.connection) {
        this.connectionState.connection.send({
          type: 'unit-harvesting',
          gameType: 'minicraft',
          unitId: worker.id,
          x: x,
          y: y
        });
      }
    }
    
    /**
     * Check if a tile is passable (can be moved into)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} - Whether the tile is passable
     */
    isTilePassable(x, y) {
      // Check if coordinates are within bounds
      if (x < 0 || y < 0 || x >= this.GRID_SIZE || y >= this.GRID_SIZE) {
        return false;
      }
      
      const tile = this.gameState.map[y][x];
      
      // Tile type must be passable
      if (!this.tileTypes[tile.type].passable) {
        return false;
      }
      
      // Tile must not have an entity
      if (tile.entity) {
        return false;
      }
      
      return true;
    }
    
    /**
     * Calculate Manhattan distance between two points
     * @param {number} x1 - First X coordinate
     * @param {number} y1 - First Y coordinate
     * @param {number} x2 - Second X coordinate
     * @param {number} y2 - Second Y coordinate
     * @returns {number} - Distance between points
     */
    getDistance(x1, y1, x2, y2) {
      return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }
    
    /**
     * Select an entity and show its info
     * @param {Object} entity - The entity to select
     */
    selectEntity(entity) {
      this.gameState.selectedEntity = entity;
      this.updateUnitInfoPanel();
      this.renderMap(); // Re-render to add selection highlight
      
      // Reset current action
      this.currentAction = null;
      this.clearSelectableTiles();
      
      // Update build buttons if it's the player's entity
      if (entity.owner === 'player') {
        this.updateBuildButtons();
      }
      
      // Update game status
      let statusText = `Selected ${entity.owner}'s ${this.entityTypes[entity.type].name}`;
      if (entity.owner === 'player') {
        statusText += '. Choose an action.';
      }
      this.updateGameStatus(statusText);
    }
    
    /**
     * Update the unit info panel with details about the selected entity
     */
    updateUnitInfoPanel() {
      const entity = this.gameState.selectedEntity;
      
      if (!entity) {
        this.unitInfoPanel.innerHTML = 'Select a unit or building to see details';
        return;
      }
      
      const entityType = this.entityTypes[entity.type];
      
      let infoHTML = `
        <h4>${entity.owner === 'player' ? 'Your' : 'Opponent'} ${entityType.name}</h4>
        <div class="entity-stats">
          <div>Health: ${entity.health}/${entityType.health}</div>
      `;
      
      if (!entity.isBuilding) {
        infoHTML += `<div>Attack: ${entityType.attack}</div>`;
        infoHTML += `<div>Range: ${entityType.range}</div>`;
        
        if (entityType.canHarvest) {
          infoHTML += `<div>Status: ${entity.isHarvesting ? 'Harvesting' : 'Idle'}</div>`;
        }
      } else {
        if (entityType.canProduce && entityType.canProduce.length > 0) {
          const produceList = entityType.canProduce.map(
            unitType => this.entityTypes[unitType].name
          ).join(', ');
          infoHTML += `<div>Can produce: ${produceList}</div>`;
        }
        
        if (entity.buildProgress && entity.buildProgress < 100) {
          infoHTML += `<div>Building: ${entity.buildProgress}% complete</div>`;
        }
      }
      
      infoHTML += '</div>';
      
      // Add production buttons if this is a player building that can produce units
      if (entity.owner === 'player' && entity.isBuilding && entityType.canProduce) {
        infoHTML += '<div class="production-buttons">';
        
        entityType.canProduce.forEach(unitType => {
          const unit = this.entityTypes[unitType];
          infoHTML += `
            <button class="build-btn produce-btn" data-unit="${unitType}">
              ${unit.emoji} ${unit.name} (${unit.cost} 💎)
            </button>
          `;
        });
        
        infoHTML += '</div>';
      }
      
      this.unitInfoPanel.innerHTML = infoHTML;
      
      // Add event listeners to production buttons
      const produceButtons = this.unitInfoPanel.querySelectorAll('.produce-btn');
      produceButtons.forEach(button => {
        button.addEventListener('click', () => {
          const unitType = button.dataset.unit;
          this.produceUnit(unitType);
        });
      });
    }
    
    /**
     * Update the resource display
     */
    updateResourceDisplay() {
      this.resourceDisplay.textContent = this.gameState.playerResources;
      this.opponentResourceDisplay.textContent = this.gameState.opponentResources;
    }
    
    /**
     * Update the game status display
     * @param {string} message - Optional message to display
     */
    updateGameStatus(message = '') {
      if (this.gameState.gameComplete) {
        this.gameStatus.textContent = `Game over! ${this.gameState.winner === 'player' ? 'You won!' : 'Opponent won.'}`;
        return;
      }
      
      if (message) {
        this.gameStatus.textContent = message;
      } else {
        this.gameStatus.textContent = 'Select a unit or building';
      }
    }
    
    /**
     * Update the build buttons based on available resources and selected entity
     */
    updateBuildButtons() {
      this.buildButtons.innerHTML = '';
      
      const entity = this.gameState.selectedEntity;
      
      // Only show build buttons for player's workers
      if (!entity || entity.owner !== 'player' || 
          !this.entityTypes[entity.type].canBuild) {
        return;
      }
      
      // Add buttons for each building type
      Object.keys(this.entityTypes)
        .filter(type => this.entityTypes[type].size) // Only buildings have a size property
        .forEach(buildingType => {
          if (buildingType === 'commandCenter') return; // Can't build additional command centers
          
          const building = this.entityTypes[buildingType];
          const canAfford = this.gameState.playerResources >= building.cost;
          
          const button = document.createElement('button');
          button.className = `build-btn ${canAfford ? '' : 'disabled'}`;
          button.innerHTML = `${building.emoji} ${building.name} (${building.cost} 💎)`;
          
          if (canAfford) {
            button.addEventListener('click', () => {
              this.startBuildingPlacement(buildingType);
            });
          }
          
          this.buildButtons.appendChild(button);
        });
    }
    
    /**
     * Start the building placement process
     * @param {string} buildingType - Type of building to place
     */
    startBuildingPlacement(buildingType) {
      this.pendingBuilding = buildingType;
      this.currentAction = null;
      this.clearSelectableTiles();
      
      // Show where the building can be placed
      this.showBuildableTiles(buildingType);
      
      this.updateGameStatus(`Select a location to build ${this.entityTypes[buildingType].name}`);
    }
    
    /**
     * Show tiles where building placement is valid
     * @param {string} buildingType - Type of building to place
     */
    showBuildableTiles(buildingType) {
      // Check each tile on the map
      for (let y = 0; y < this.GRID_SIZE; y++) {
        for (let x = 0; x < this.GRID_SIZE; x++) {
          if (this.isTileBuildable(x, y, buildingType)) {
            const tileElement = this.gameBoard.querySelector(`.map-tile[data-x="${x}"][data-y="${y}"]`);
            tileElement.classList.add('selectable');
          }
        }
      }
    }
    
    /**
     * Start producing a unit from a building
     * @param {string} unitType - Type of unit to produce
     */
    produceUnit(unitType) {
      const building = this.gameState.selectedEntity;
      const unit = this.entityTypes[unitType];
      
      // Check if we have enough resources
      if (this.gameState.playerResources < unit.cost) {
        this.showMessage(`Not enough resources. Needed: ${unit.cost}`);
        return;
      }
      
      // Deduct resources
      this.gameState.playerResources -= unit.cost;
      this.updateResourceDisplay();
      
      // Find a valid spawn position near the building
      const spawnX = building.x;
      const spawnY = building.y + building.size;
      
      // Check if the spawn position is valid
      if (spawnY >= this.GRID_SIZE || this.gameState.map[spawnY][spawnX].entity) {
        this.showMessage('No space to deploy unit');
        
        // Refund resources
        this.gameState.playerResources += unit.cost;
        this.updateResourceDisplay();
        return;
      }
      
      // Create the unit
      this.addUnit(spawnX, spawnY, unitType, 'player');
      
      // Update UI
      this.updateGameStatus(`${unit.name} produced!`);
      
      // Send unit production to opponent
      if (this.connectionState.connection) {
        this.connectionState.connection.send({
          type: 'unit-produced',
          gameType: 'minicraft',
          unitType: unitType,
          x: spawnX,
          y: spawnY,
          buildingId: building.id
        });
      }
    }
    
    /**
     * Add a unit to the game
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {string} unitType - Type of unit
     * @param {string} owner - 'player' or 'opponent'
     */
    addUnit(x, y, unitType, owner) {
      const id = `unit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      const unit = {
        id: id,
        type: unitType,
        owner: owner,
        x: x,
        y: y,
        health: this.entityTypes[unitType].health,
        isBuilding: false,
        isHarvesting: false
      };
      
      // Add to appropriate array
      if (owner === 'player') {
        this.gameState.playerUnits.push(unit);
      } else {
        this.gameState.opponentUnits.push(unit);
      }
      
      // Place on the map
      this.gameState.map[y][x].entity = unit;
      
      // Update the game board
      this.renderMap();
    }
    
    /**
     * Add a building to the game
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {string} buildingType - Type of building
     * @param {string} owner - 'player' or 'opponent'
     */
    addBuilding(x, y, buildingType, owner) {
      const id = `building-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const buildingData = this.entityTypes[buildingType];
      
      const building = {
        id: id,
        type: buildingType,
        owner: owner,
        x: x,
        y: y,
        health: buildingData.health,
        isBuilding: true,
        size: buildingData.size
      };
      
      // Add to appropriate array
      if (owner === 'player') {
        this.gameState.playerBuildings.push(building);
      } else {
        this.gameState.opponentBuildings.push(building);
      }
      
      // Place on the map (buildings occupy multiple tiles)
      for (let yOffset = 0; yOffset < building.size; yOffset++) {
        for (let xOffset = 0; xOffset < building.size; xOffset++) {
          // Make sure we're not out of bounds
          if (y + yOffset < this.GRID_SIZE && x + xOffset < this.GRID_SIZE) {
            this.gameState.map[y + yOffset][x + xOffset].entity = building;
          }
        }
      }
      
      // Update the game board
      this.renderMap();
    }
    
    /**
     * Show a temporary message to the player
     * @param {string} message - Message to show
     */
    showMessage(message) {
      const notification = document.getElementById('notification');
      notification.textContent = message;
      notification.classList.add('visible');
      
      setTimeout(() => {
        notification.classList.remove('visible');
      }, 3000);
    }
    
    /**
     * Handle game over
     * @param {string} winner - 'player' or 'opponent'
     */
    gameOver(winner) {
      this.gameState.gameComplete = true;
      this.gameState.winner = winner;
      
      // Clear any timers
      if (this.gameState.resourceTimer) {
        clearInterval(this.gameState.resourceTimer);
      }
      
      this.updateGameStatus();
      
      // Send game over notification to opponent
      if (this.connectionState.connection) {
        this.connectionState.connection.send({
          type: 'game-over',
          gameType: 'minicraft',
          winner: winner
        });
      }
    }
    
    /**
     * Reset the game
     */
    reset() {
      // Clear any existing timers
      if (this.gameState.resourceTimer) {
        clearInterval(this.gameState.resourceTimer);
      }
      
      // Reset game state
      this.gameState = {
        map: [],
        playerResources: 50,
        opponentResources: 50,
        playerUnits: [],
        opponentUnits: [],
        playerBuildings: [],
        opponentBuildings: [],
        selectedEntity: null,
        isMyTurn: true,
        gameComplete: false,
        winner: null,
        resourceTimer: null,
        actionQueue: [],
        processingAction: false
      };
      
      this.currentAction = null;
      this.pendingBuilding = null;
      
      // Generate a new map
      this.generateMap();
      
      // Update UI
      this.updateResourceDisplay();
      this.updateBuildButtons();
      this.updateUnitInfoPanel();
      this.updateGameStatus();
    }
    
    /**
     * Start a new game
     */
    startNewGame() {
      this.reset();
    }
    
    /**
     * Handle data received from peer
     * @param {Object} data - Data received from peer
     */
    handlePeerData(data) {
      // Ignore if not for this game
      if (data.gameType !== 'minicraft') return;
      
      console.log('MiniCraft received data:', data);
      
      switch (data.type) {
        case 'building-placed':
          // Opponent placed a building
          this.addBuilding(data.x, data.y, data.buildingType, 'opponent');
          break;
          
        case 'unit-moved':
          // Opponent moved a unit
          const unit = this.findOpponentEntityById(data.unitId);
          if (unit) {
            // Remove from current location
            const currentTile = this.gameState.map[unit.y][unit.x];
            currentTile.entity = null;
            
            // Update entity position
            unit.x = data.toX;
            unit.y = data.toY;
            
            // If unit was harvesting, stop harvesting
            if (unit.isHarvesting) {
              unit.isHarvesting = false;
            }
            
            // Add to new location
            const newTile = this.gameState.map[data.toY][data.toX];
            newTile.entity = unit;
            
            // Update the game board
            this.renderMap();
          }
          break;
          
        case 'unit-attacked':
          // Opponent attacked a unit/building
          const target = this.findPlayerEntityById(data.targetId);
          if (target) {
            // Apply damage
            target.health -= data.damage;
            
            // Check if target is destroyed
            if (target.health <= 0 || data.targetDestroyed) {
              // Remove from the map
              const targetTile = this.gameState.map[target.y][target.x];
              targetTile.entity = null;
              
              // Remove from the appropriate array
              this.gameState.playerUnits = this.gameState.playerUnits.filter(u => u.id !== target.id);
              this.gameState.playerBuildings = this.gameState.playerBuildings.filter(b => b.id !== target.id);
              
              // Check if it was a command center
              if (target.type === 'commandCenter') {
                this.gameOver('opponent');
              }
            }
            
            // Update the game board
            this.renderMap();
          }
          break;
          
        case 'unit-harvesting':
          // Opponent set a unit to harvest
          const worker = this.findOpponentEntityById(data.unitId);
          if (worker) {
            worker.isHarvesting = true;
            this.renderMap();
          }
          break;
          
        case 'unit-produced':
          // Opponent produced a unit
          this.addUnit(data.x, data.y, data.unitType, 'opponent');
          break;
          
        case 'game-over':
          // Game is over
          this.gameState.gameComplete = true;
          this.gameState.winner = data.winner;
          
          // Clear any timers
          if (this.gameState.resourceTimer) {
            clearInterval(this.gameState.resourceTimer);
          }
          
          this.updateGameStatus();
          break;
      }
    }
    
    /**
     * Find an opponent entity by ID
     * @param {string} id - Entity ID
     * @returns {Object|null} - Entity object or null if not found
     */
    findOpponentEntityById(id) {
      // Check units
      const unit = this.gameState.opponentUnits.find(u => u.id === id);
      if (unit) return unit;
      
      // Check buildings
      const building = this.gameState.opponentBuildings.find(b => b.id === id);
      if (building) return building;
      
      return null;
    }
    
    /**
     * Find a player entity by ID
     * @param {string} id - Entity ID
     * @returns {Object|null} - Entity object or null if not found
     */
    findPlayerEntityById(id) {
      // Check units
      const unit = this.gameState.playerUnits.find(u => u.id === id);
      if (unit) return unit;
      
      // Check buildings
      const building = this.gameState.playerBuildings.find(b => b.id === id);
      if (building) return building;
      
      return null;
    }
    
    /**
     * Show the game
     */
    show() {
      // Make sure game container is visible
      this.boardContainer.style.display = 'block';
      
      // Make sure timer is running
      this.startResourceTimer();
      
      // Update board size in case window was resized
      this.updateBoardSize();
    }
    
    /**
     * Hide the game
     */
    hide() {
      this.boardContainer.style.display = 'none';
      
      // Pause resource timer to save resources
      if (this.gameState.resourceTimer) {
        clearInterval(this.gameState.resourceTimer);
      }
    }
  }