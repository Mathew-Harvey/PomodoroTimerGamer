/**
 * GameInstructions - Adds polished instructions to all games
 * This is added as a separate module to keep game implementations cleaner
 */
class GameInstructions {
    /**
     * Add instructions to a game container
     * @param {string} gameId - ID of the game
     * @param {HTMLElement} container - Container element where instructions will be added
     */
    static addInstructions(gameId, container) {
        // Create instructions button and panel
        const instructionsBtn = document.createElement('button');
        instructionsBtn.className = 'instructions-btn';
        instructionsBtn.textContent = 'Show Instructions';

        const instructionsPanel = document.createElement('div');
        instructionsPanel.className = 'instructions-panel';

        // Get appropriate instructions HTML based on game ID
        instructionsPanel.innerHTML = this.getInstructionsHTML(gameId);

        // Toggle instructions visibility when button is clicked
        instructionsBtn.addEventListener('click', () => {
            instructionsPanel.classList.toggle('show');
            instructionsBtn.textContent = instructionsPanel.classList.contains('show')
                ? 'Hide Instructions'
                : 'Show Instructions';
        });

        // Add elements to container
        container.appendChild(instructionsBtn);
        container.appendChild(instructionsPanel);

        // Add specific styles for instructions
        if (!document.getElementById('instructions-styles')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'instructions-styles';
            styleElement.textContent = `
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
            color: var(--primary);
          }
          
          .instructions-panel h4 {
            margin-top: 15px;
            margin-bottom: 5px;
            color: var(--primary-dark);
          }
          
          .instructions-panel p {
            margin-bottom: 10px;
            line-height: 1.5;
          }
          
          .instructions-panel ul, .instructions-panel ol {
            padding-left: 20px;
            margin-bottom: 10px;
          }
          
          .instructions-panel li {
            margin-bottom: 5px;
            line-height: 1.4;
          }
          
          .instructions-panel .tip {
            background-color: rgba(94, 96, 206, 0.1);
            border-left: 3px solid var(--primary);
            padding: 10px 15px;
            margin: 10px 0;
            border-radius: 0 5px 5px 0;
          }
          
          .instructions-panel .tip-title {
            font-weight: bold;
            margin-bottom: 5px;
            color: var(--primary);
          }
          
          .instructions-panel .key-controls {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 10px 0;
          }
          
          .instructions-panel .key-control {
            display: flex;
            align-items: center;
            margin-right: 15px;
          }
          
          .instructions-panel .key {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 2px 8px;
            font-family: monospace;
            margin-right: 8px;
            font-weight: bold;
          }
        `;
            document.head.appendChild(styleElement);
        }
    }

    /**
     * Get HTML instructions content for a specific game
     * @param {string} gameId - ID of the game
     * @returns {string} - HTML content for the instructions
     */
    static getInstructionsHTML(gameId) {
        switch (gameId) {
            case 'tictactoe':
                return this.getTicTacToeInstructions();
            case 'memory':
                return this.getMemoryGameInstructions();
            case 'minicraft':
                return this.getMiniCraftInstructions();
            default:
                return '<h3>Instructions</h3><p>No specific instructions available for this game.</p>';
        }
    }

    /**
     * Get TicTacToe instructions HTML
     * @returns {string} - HTML content for TicTacToe instructions
     */
    static getTicTacToeInstructions() {
        return `
        <h3>Tic-Tac-Toe Instructions</h3>
        
        <h4>Game Objective</h4>
        <p>Be the first player to get three of your symbols (X or O) in a row, column, or diagonal.</p>
        
        <h4>How to Play</h4>
        <ol>
          <li>The game is played on a 3×3 grid.</li>
          <li>You are X, your friend is O. Players take turns placing their symbols on the board.</li>
          <li>The first player to get 3 of their symbols in a row (horizontally, vertically, or diagonally) wins the round.</li>
          <li>If all 9 squares are filled and no player has 3 symbols in a row, the game is a draw.</li>
        </ol>
        
        <h4>Scoring</h4>
        <p>The game keeps track of how many rounds each player has won and the total number of games played.</p>
        
        <div class="tip">
          <div class="tip-title">Strategy Tip</div>
          <p>Try to create multiple winning opportunities at once to force your opponent into a difficult decision.</p>
        </div>
        
        <h4>During the Break</h4>
        <p>Tic-Tac-Toe is played during your Pomodoro break time. It's a perfect quick game to refresh your mind before returning to focused work!</p>
      `;
    }

    /**
     * Get Memory Game instructions HTML
     * @returns {string} - HTML content for Memory Game instructions
     */
    static getMemoryGameInstructions() {
        return `
        <h3>Memory Game Instructions</h3>
        
        <h4>Game Objective</h4>
        <p>Find and match all pairs of identical cards to win the game. The player with more matches at the end wins!</p>
        
        <h4>How to Play</h4>
        <ol>
          <li>The game consists of a grid of face-down cards.</li>
          <li>On your turn, flip two cards by clicking on them one after another.</li>
          <li>If the two cards match (have the same symbol), you keep them face up and score a point.</li>
          <li>If they don't match, they're flipped back face down after a short delay.</li>
          <li>When you find a match, you get another turn. If you don't find a match, it becomes your opponent's turn.</li>
          <li>The game ends when all pairs have been found.</li>
        </ol>
        
        <h4>Scoring</h4>
        <p>Each matched pair is worth one point. The player with the most points at the end of the game wins.</p>
        
        <div class="tip">
          <div class="tip-title">Memory Tips</div>
          <p>Pay attention to what cards your opponent flips - this information can help you find matches on your turn!</p>
          <p>Try to remember the positions of cards you've seen but couldn't match yet.</p>
        </div>
        
        <h4>During the Break</h4>
        <p>The Memory Game is a perfect brain exercise during your Pomodoro break. It helps improve concentration and short-term memory while giving you a fun break from your focused work.</p>
      `;
    }

    /**
     * Get MiniCraft instructions HTML
     * @returns {string} - HTML content for MiniCraft instructions
     */
    static getMiniCraftInstructions() {
        return `
        <h3>MiniCraft Instructions</h3>
        <p>MiniCraft is a simplified real-time strategy game inspired by StarCraft.</p>
        
        <h4>Game Objective</h4>
        <p>Defeat your opponent by destroying their Command Center while protecting your own.</p>
        
        <h4>Resources</h4>
        <p>Gather resources (💎) using Worker units. Workers can harvest resources from crystal fields by selecting a Worker, clicking the "Harvest" button, and then clicking on a nearby crystal field.</p>
        
        <h4>Buildings</h4>
        <ul>
          <li><strong>Command Center (🏰)</strong>: Your main base. If destroyed, you lose the game. Can produce Workers.</li>
          <li><strong>Barracks (🏢)</strong>: Produces Soldiers for combat.</li>
          <li><strong>Range (🏛️)</strong>: Produces Archers for ranged combat.</li>
        </ul>
        
        <p>To build a structure, select a Worker, then click on one of the building buttons that appear in the control panel. Then click on a valid location (highlighted in yellow) to place the building.</p>
        
        <h4>Units</h4>
        <ul>
          <li><strong>Worker (👷)</strong>: Gathers resources and constructs buildings. Cost: 50 resources</li>
          <li><strong>Soldier (🗡️)</strong>: Strong melee combat unit. Cost: 100 resources</li>
          <li><strong>Archer (🏹)</strong>: Ranged combat unit that can attack from a distance. Cost: 125 resources</li>
        </ul>
        
        <p>To produce units, select a building that can create units, then click on the unit button in the information panel.</p>
        
        <h4>Controls</h4>
        <div class="key-controls">
          <div class="key-control">
            <span class="key">Click</span> Select a unit or building
          </div>
          <div class="key-control">
            <span class="key">Move</span> + <span class="key">Click</span> Move selected unit
          </div>
          <div class="key-control">
            <span class="key">Attack</span> + <span class="key">Click</span> Attack enemy unit/building
          </div>
          <div class="key-control">
            <span class="key">Harvest</span> + <span class="key">Click</span> Gather resources
          </div>
        </div>
        
        <h4>Strategy Tips</h4>
        <ol>
          <li>Start by building additional Workers to gather resources faster.</li>
          <li>Build a mix of units - Soldiers for close combat and Archers for ranged attacks.</li>
          <li>Protect your resource-gathering Workers as they're vital to your economy.</li>
          <li>Scout the map to locate your opponent's base.</li>
          <li>Focus your attacks on your opponent's Command Center to win quickly.</li>
        </ol>
        
        <div class="tip">
          <div class="tip-title">Pro Tip</div>
          <p>When starting out, aim for a balanced approach: get your economy running with 2-3 Workers, then build military structures and units to defend and attack.</p>
        </div>
        
        <h4>During the Break</h4>
        <p>MiniCraft is a more involved game for longer Pomodoro breaks. It's perfect for stimulating strategic thinking and planning before returning to your focused work.</p>
      `;
    }
}
