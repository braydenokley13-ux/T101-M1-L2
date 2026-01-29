/**
 * MLB Money Maker - Main Game Module
 * Core state management and game logic
 */

const Game = {
    // Game state
    state: {
        // Current screen
        currentScreen: 'intro',

        // Allocation (in billions)
        allocation: {
            players: 3.6,
            owners: 2.4,
            networks: 1.2,
            league: 0.8
        },

        // Total deal value
        totalDeal: 8.0,

        // Detail settings
        minSalary: 750,      // $750K
        revenueShare: 35,    // 35%
        startTime: 2,        // Index (7:30 PM)
        streaming: 25,       // 25%
        salaryShare: 48.5,   // 48.5%

        // Satisfactions
        satisfactions: {
            players: 70,
            owners: 65,
            networks: 60,
            fans: 68
        },

        // Stability status
        stability: 'stable',

        // Mini-game bonus accumulated
        miniGameBonus: 0,

        // Game progress (0-100)
        progress: 0,

        // Interaction tracking
        interactions: 0
    },

    /**
     * Initialize the game
     */
    init() {
        console.log('MLB Money Maker - Initializing...');

        // Initialize UI components
        UI.init();

        // Initialize interactions
        Interactions.initSliders();
        Interactions.initMiniGames();

        // Set up button listeners
        this.setupEventListeners();

        // Calculate initial satisfactions
        this.updateSatisfactions();

        // Hide loading screen
        setTimeout(() => {
            UI.hideLoading();
        }, 1000);

        console.log('MLB Money Maker - Ready!');
    },

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Start button
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGame());
        }

        // Continue to game button
        const continueBtn = document.getElementById('continue-to-game-btn');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => this.showGameScreen());
        }

        // Finalize deal button
        const finalizeBtn = document.getElementById('finalize-deal-btn');
        if (finalizeBtn) {
            finalizeBtn.addEventListener('click', () => this.finalizeDeal());
        }

        // Try again button
        const tryAgainBtn = document.getElementById('try-again-btn');
        if (tryAgainBtn) {
            tryAgainBtn.addEventListener('click', () => this.restartGame());
        }

        // Share results button
        const shareBtn = document.getElementById('share-results-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareResults());
        }
    },

    /**
     * Start the game - show role screen
     */
    startGame() {
        UI.showScreen('role-screen');
        this.state.currentScreen = 'role';
    },

    /**
     * Show main game screen
     */
    showGameScreen() {
        UI.showScreen('game-screen');
        this.state.currentScreen = 'game';

        // Start progress tracking
        this.startProgressTracking();
    },

    /**
     * Track game progress based on interactions
     */
    startProgressTracking() {
        // Listen for any slider changes
        const sliders = document.querySelectorAll('input[type="range"]');
        sliders.forEach(slider => {
            slider.addEventListener('change', () => {
                this.state.interactions++;
                this.updateProgress();
            });
        });
    },

    /**
     * Update game progress
     */
    updateProgress() {
        // Progress based on interactions (max at 20 interactions)
        const interactionProgress = Math.min(100, this.state.interactions * 5);
        this.state.progress = interactionProgress;
        UI.updateProgress(this.state.progress);
    },

    /**
     * Update all satisfactions based on current state
     */
    updateSatisfactions() {
        const satisfactions = Calculations.calculateAllSatisfactions(this.state);
        this.state.satisfactions = satisfactions;

        // Check stability
        this.state.stability = Calculations.checkStability(satisfactions);

        // Update UI
        UI.updateSatisfactions(satisfactions);

        // Update charts
        UI.updatePieChart();
        UI.updateSankeyChart();
    },

    /**
     * Apply mini-game bonus to satisfactions
     */
    applyMiniGameBonus(bonus) {
        this.state.miniGameBonus += bonus;

        // Apply bonus to all satisfactions (temporary boost)
        Object.keys(this.state.satisfactions).forEach(key => {
            this.state.satisfactions[key] = Math.min(100,
                this.state.satisfactions[key] + bonus);
        });

        // Update UI
        UI.updateSatisfactions(this.state.satisfactions);
        UI.showToast(`+${bonus} satisfaction bonus earned!`, 'success');
    },

    /**
     * Finalize the deal and show results
     */
    finalizeDeal() {
        // Calculate final satisfactions
        const satisfactions = Calculations.calculateAllSatisfactions(this.state);

        // Apply any mini-game bonus
        if (this.state.miniGameBonus > 0) {
            Object.keys(satisfactions).forEach(key => {
                satisfactions[key] = Math.min(100,
                    satisfactions[key] + this.state.miniGameBonus);
            });
        }

        // Determine tier
        const tierInfo = Calculations.determineTier(satisfactions);

        // Generate result with claim code
        const result = CodeGenerator.generateResult(tierInfo, this.state, satisfactions);

        // Store result
        CodeGenerator.storeResult(result);

        // Stop heartbeat animation
        UI.stopHeartbeat();

        // Show results screen
        UI.showResults(result, satisfactions, this.state);

        this.state.currentScreen = 'results';
    },

    /**
     * Restart the game
     */
    restartGame() {
        // Reset state
        this.state = {
            currentScreen: 'intro',
            allocation: {
                players: 3.6,
                owners: 2.4,
                networks: 1.2,
                league: 0.8
            },
            totalDeal: 8.0,
            minSalary: 750,
            revenueShare: 35,
            startTime: 2,
            streaming: 25,
            salaryShare: 48.5,
            satisfactions: {
                players: 70,
                owners: 65,
                networks: 60,
                fans: 68
            },
            stability: 'stable',
            miniGameBonus: 0,
            progress: 0,
            interactions: 0
        };

        // Reset sliders to default values
        this.resetSliders();

        // Reinitialize UI
        UI.init();
        this.updateSatisfactions();

        // Show intro screen
        UI.showScreen('intro-screen');
    },

    /**
     * Reset all sliders to default values
     */
    resetSliders() {
        // Allocation sliders
        const allocationDefaults = {
            'players-slider': 3.6,
            'owners-slider': 2.4,
            'networks-slider': 1.2,
            'league-slider': 0.8
        };

        Object.keys(allocationDefaults).forEach(id => {
            const slider = document.getElementById(id);
            if (slider) {
                slider.value = allocationDefaults[id];
            }
        });

        // Detail sliders
        const detailDefaults = {
            'min-salary-slider': 750,
            'revenue-share-slider': 35,
            'start-time-slider': 2,
            'streaming-slider': 25,
            'salary-share-slider': 48.5
        };

        Object.keys(detailDefaults).forEach(id => {
            const slider = document.getElementById(id);
            if (slider) {
                slider.value = detailDefaults[id];
            }
        });

        // Update displays
        Object.keys(this.state.allocation).forEach(key => {
            UI.updateAllocationDisplay(key, this.state.allocation[key]);
        });

        UI.updateSliderDisplay('min-salary', '$750K');
        UI.updateSliderDisplay('revenue-share', '35%');
        UI.updateSliderDisplay('start-time', '7:30 PM');
        UI.updateSliderDisplay('streaming', '25%');
        UI.updateSliderDisplay('salary-share', '48.5%');
        UI.updateCompetitiveBalance(35);
        UI.updateViewerSplit(25);
        UI.updateProgress(0);
    },

    /**
     * Share results (copy to clipboard or show share options)
     */
    shareResults() {
        const code = document.getElementById('claim-code')?.textContent;
        const tier = this.state.satisfactions ?
            Calculations.determineTier(this.state.satisfactions).tier : 'unknown';

        const shareText = `I just completed MLB Money Maker with a ${tier.toUpperCase()} tier deal!\nClaim Code: ${code}\nCan you do better?`;

        // Try to copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                UI.showToast('Results copied to clipboard!', 'success');
            }).catch(() => {
                UI.showToast('Could not copy to clipboard', 'error');
            });
        } else {
            // Fallback - show alert
            alert(shareText);
        }
    },

    /**
     * Get current game state (for debugging)
     */
    getState() {
        return { ...this.state };
    },

    /**
     * Set game state (for debugging/testing)
     */
    setState(newState) {
        Object.assign(this.state, newState);
        this.updateSatisfactions();
    }
};

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});

// Also handle window load for any late-loading resources
window.addEventListener('load', () => {
    // Ensure loading screen is hidden
    setTimeout(() => {
        UI.hideLoading();
    }, 500);
});

// Export for module systems (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}
