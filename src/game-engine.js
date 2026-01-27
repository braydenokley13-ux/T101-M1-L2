/**
 * NBA Luxury Tax Challenge - Game Engine
 * Core game logic and state management
 * Simplified for 5th-6th grade students
 */

class GameEngine {
    constructor() {
        // Game Constants (simplified for students)
        this.SALARY_CAP = 136000000;      // $136 Million
        this.BUDGET_LIMIT = 150000000;    // $150 Million max
        this.PLAYOFF_WINS = 46;           // Need 46 wins for playoffs
        this.TOTAL_ROUNDS = 4;

        // Game State
        this.state = {
            currentScreen: 'start',
            selectedTeam: null,
            currentRound: 1,
            wins: 0,
            payroll: 0,
            totalSpend: 0,
            luxuryTax: 0,
            decisions: [],
            roster: [],
            scenarioPath: [],
            gameOver: false,
            tutorialComplete: false
        };

        // Data storage
        this.scenarios = null;
        this.endings = null;

        // Initialize
        this.init();
    }

    async init() {
        try {
            // Load game data
            await this.loadGameData();
            console.log('Game Engine initialized!');
        } catch (error) {
            console.error('Failed to initialize game:', error);
        }
    }

    async loadGameData() {
        try {
            // Load scenarios
            const scenarioResponse = await fetch('data/scenarios.json');
            this.scenarios = await scenarioResponse.json();

            // Load endings
            const endingsResponse = await fetch('data/endings.json');
            this.endings = await endingsResponse.json();

            return true;
        } catch (error) {
            console.error('Error loading game data:', error);
            return false;
        }
    }

    // Start a new game with selected team
    startGame(teamId) {
        const team = PlayerDatabase.getTeam(teamId);
        if (!team) {
            console.error('Invalid team:', teamId);
            return false;
        }

        // Reset state
        this.state = {
            currentScreen: 'game',
            selectedTeam: teamId,
            currentRound: 1,
            wins: team.startingWins,
            payroll: team.startingPayroll,
            totalSpend: team.startingPayroll,
            luxuryTax: this.calculateLuxuryTax(team.startingPayroll),
            decisions: [],
            roster: [...team.currentRoster],
            scenarioPath: [`${teamId}_r1`],
            gameOver: false,
            tutorialComplete: this.state.tutorialComplete
        };

        return true;
    }

    // Calculate luxury tax (simplified explanation for students)
    // "When teams spend over $136M, they pay extra money as a penalty!"
    calculateLuxuryTax(payroll) {
        if (payroll <= this.SALARY_CAP) {
            return 0;
        }

        const amountOver = payroll - this.SALARY_CAP;

        // Simplified tax calculation for educational purposes
        // Every dollar over the cap costs $1.50 extra (simplified)
        let tax = 0;

        if (amountOver <= 5000000) {
            tax = amountOver * 1.5;
        } else if (amountOver <= 10000000) {
            tax = (5000000 * 1.5) + ((amountOver - 5000000) * 1.75);
        } else if (amountOver <= 15000000) {
            tax = (5000000 * 1.5) + (5000000 * 1.75) + ((amountOver - 10000000) * 2.5);
        } else {
            tax = (5000000 * 1.5) + (5000000 * 1.75) + (5000000 * 2.5) + ((amountOver - 15000000) * 3.25);
        }

        return Math.round(tax);
    }

    // Make a decision
    makeDecision(choiceId) {
        const currentScenario = this.getCurrentScenario();
        if (!currentScenario) {
            console.error('No current scenario found');
            return null;
        }

        // Find the selected choice
        const choice = currentScenario.choices.find(c => c.id === choiceId);
        if (!choice) {
            console.error('Invalid choice:', choiceId);
            return null;
        }

        // Apply the choice effects
        this.state.wins += choice.winChange;
        this.state.payroll += choice.salaryChange;
        this.state.luxuryTax = this.calculateLuxuryTax(this.state.payroll);
        this.state.totalSpend = this.state.payroll + this.state.luxuryTax;

        // Record the decision
        this.state.decisions.push({
            round: this.state.currentRound,
            choiceId: choiceId,
            choiceType: choice.type,
            title: choice.title,
            winChange: choice.winChange,
            salaryChange: choice.salaryChange,
            player: choice.player || null
        });

        // Add player to roster if applicable
        if (choice.player) {
            this.state.roster.push(choice.player);
        }

        // Move to next scenario
        this.state.scenarioPath.push(choice.nextScenario);
        this.state.currentRound++;

        // Check if game is over
        if (this.state.currentRound > this.TOTAL_ROUNDS ||
            choice.nextScenario.includes('final')) {
            this.state.gameOver = true;
        }

        return {
            success: true,
            newState: this.getGameState(),
            consequence: choice.consequence,
            isGameOver: this.state.gameOver
        };
    }

    // Get current scenario
    getCurrentScenario() {
        if (!this.scenarios || !this.state.selectedTeam) {
            return null;
        }

        const teamScenarios = this.scenarios.teams[this.state.selectedTeam];
        if (!teamScenarios) {
            return null;
        }

        const currentScenarioId = this.state.scenarioPath[this.state.scenarioPath.length - 1];
        return teamScenarios.rounds.find(r => r.id === currentScenarioId);
    }

    // Get team intro
    getTeamIntro() {
        if (!this.scenarios || !this.state.selectedTeam) {
            return null;
        }
        return this.scenarios.teams[this.state.selectedTeam].intro;
    }

    // Get current game state (for UI updates)
    getGameState() {
        return {
            team: this.state.selectedTeam,
            round: this.state.currentRound,
            wins: this.state.wins,
            payroll: this.state.payroll,
            totalSpend: this.state.totalSpend,
            luxuryTax: this.state.luxuryTax,
            capRemaining: Math.max(0, this.SALARY_CAP - this.state.payroll),
            budgetRemaining: Math.max(0, this.BUDGET_LIMIT - this.state.totalSpend),
            winsNeeded: Math.max(0, this.PLAYOFF_WINS - this.state.wins),
            isOverCap: this.state.payroll > this.SALARY_CAP,
            isOverBudget: this.state.totalSpend > this.BUDGET_LIMIT,
            madePlayoffs: this.state.wins >= this.PLAYOFF_WINS,
            roster: this.state.roster,
            decisions: this.state.decisions
        };
    }

    // Determine game ending
    getEnding() {
        const state = this.getGameState();

        // Check failure conditions first
        if (state.isOverBudget && !state.madePlayoffs) {
            return this.endings.endings.complete_disaster;
        }

        if (state.isOverBudget) {
            return this.endings.endings.budget_blown;
        }

        if (!state.madePlayoffs && state.totalSpend < 130000000) {
            return this.endings.endings.rebuild_mode;
        }

        if (!state.madePlayoffs) {
            return this.endings.endings.missed_playoffs;
        }

        // Victory conditions
        if (state.wins >= 50 && state.totalSpend <= this.BUDGET_LIMIT) {
            return this.endings.endings.championship_run;
        }

        if (state.totalSpend <= 130000000) {
            return this.endings.endings.development_win;
        }

        if (state.totalSpend <= 140000000) {
            return this.endings.endings.savvy_gm;
        }

        if (state.luxuryTax >= 10000000) {
            return this.endings.endings.big_spender;
        }

        return this.endings.endings.playoff_success;
    }

    // Get ending analysis for current team
    getEndingAnalysis(ending) {
        if (ending.analysis && this.state.selectedTeam) {
            return ending.analysis[this.state.selectedTeam] || ending.description;
        }
        return ending.description;
    }

    // Calculate GM rating
    calculateGMRating() {
        const state = this.getGameState();
        let score = 0;

        // Wins (max 50 points)
        score += Math.min(50, state.wins);

        // Budget management (max 30 points)
        if (state.totalSpend <= 130000000) score += 30;
        else if (state.totalSpend <= 140000000) score += 20;
        else if (state.totalSpend <= 150000000) score += 10;
        else score -= 20;

        // Luxury tax efficiency (max 20 points)
        if (state.luxuryTax === 0) score += 20;
        else if (state.luxuryTax < 5000000) score += 15;
        else if (state.luxuryTax < 10000000) score += 10;
        else if (state.luxuryTax < 20000000) score += 5;

        // Determine letter grade
        if (score >= 90) return 'A+';
        if (score >= 85) return 'A';
        if (score >= 80) return 'A-';
        if (score >= 75) return 'B+';
        if (score >= 70) return 'B';
        if (score >= 65) return 'B-';
        if (score >= 60) return 'C+';
        if (score >= 55) return 'C';
        if (score >= 45) return 'D';
        return 'F';
    }

    // Format money for display (kid-friendly)
    formatMoney(amount) {
        if (amount >= 1000000) {
            return '$' + (amount / 1000000).toFixed(1) + 'M';
        } else if (amount >= 1000) {
            return '$' + (amount / 1000).toFixed(0) + 'K';
        }
        return '$' + amount;
    }

    // Get simple explanation of current financial state (for kids)
    getFinancialExplanation() {
        const state = this.getGameState();
        let explanation = '';

        if (state.payroll <= this.SALARY_CAP) {
            explanation = "Great job! You're under the salary cap. No extra tax to pay!";
        } else if (state.payroll <= this.SALARY_CAP + 5000000) {
            explanation = `You're a little over the cap. You'll pay ${this.formatMoney(state.luxuryTax)} in luxury tax.`;
        } else if (state.payroll <= this.SALARY_CAP + 10000000) {
            explanation = `You're over the cap! The luxury tax is getting expensive: ${this.formatMoney(state.luxuryTax)}`;
        } else {
            explanation = `Whoa! Way over the cap! Your luxury tax bill is huge: ${this.formatMoney(state.luxuryTax)}`;
        }

        if (state.isOverBudget) {
            explanation += " WARNING: You've gone over the budget limit!";
        }

        return explanation;
    }

    // Save game to localStorage
    saveGame() {
        try {
            const saveData = {
                state: this.state,
                timestamp: Date.now()
            };
            localStorage.setItem('nba_tax_game_save', JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }

    // Load game from localStorage
    loadGame() {
        try {
            const saveData = localStorage.getItem('nba_tax_game_save');
            if (saveData) {
                const parsed = JSON.parse(saveData);
                this.state = parsed.state;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load game:', error);
            return false;
        }
    }

    // Clear saved game
    clearSave() {
        try {
            localStorage.removeItem('nba_tax_game_save');
            return true;
        } catch (error) {
            console.error('Failed to clear save:', error);
            return false;
        }
    }

    // Reset game to initial state
    resetGame() {
        this.state = {
            currentScreen: 'start',
            selectedTeam: null,
            currentRound: 1,
            wins: 0,
            payroll: 0,
            totalSpend: 0,
            luxuryTax: 0,
            decisions: [],
            roster: [],
            scenarioPath: [],
            gameOver: false,
            tutorialComplete: this.state.tutorialComplete
        };
        this.clearSave();
    }

    // Mark tutorial as complete
    completeTutorial() {
        this.state.tutorialComplete = true;
        try {
            localStorage.setItem('nba_tax_tutorial_complete', 'true');
        } catch (e) {
            // Ignore localStorage errors
        }
    }

    // Check if tutorial was completed before
    checkTutorialStatus() {
        try {
            return localStorage.getItem('nba_tax_tutorial_complete') === 'true';
        } catch (e) {
            return false;
        }
    }
}

// Create global game instance
const Game = new GameEngine();
