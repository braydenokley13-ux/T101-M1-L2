/**
 * NBA Luxury Tax Challenge - UI Manager
 * Handles all screen rendering and user interactions
 * Made fun and simple for students!
 */

class UIManager {
    constructor() {
        this.currentScreen = 'start';
        this.tutorialStep = 1;
        this.totalTutorialSteps = 4;
    }

    // Initialize the UI
    init() {
        this.bindEvents();
        this.hideLoadingScreen();
        Animations.init();

        // Check if tutorial was completed before
        if (Game.checkTutorialStatus()) {
            Game.state.tutorialComplete = true;
        }

        console.log('UI Manager ready!');
    }

    // Hide loading screen
    hideLoadingScreen() {
        const loading = document.getElementById('loading-screen');
        if (loading) {
            setTimeout(() => {
                loading.classList.add('hidden');
            }, 500);
        }
    }

    // Bind all event listeners
    bindEvents() {
        // Start button
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.showTeamSelect());
        }

        // Back button
        const backBtn = document.getElementById('back-to-start');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showStartScreen());
        }

        // Team selection
        document.querySelectorAll('.select-team-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const team = btn.dataset.team;
                this.selectTeam(team);
            });
        });

        // Team card flip on click (mobile friendly)
        document.querySelectorAll('.team-card').forEach(card => {
            card.addEventListener('click', function() {
                this.classList.toggle('flipped');
            });
        });

        // Menu button
        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => this.showPauseMenu());
        }

        // Pause menu buttons
        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => this.hidePauseMenu());
        }

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartGame());
        }

        const quitBtn = document.getElementById('quit-btn');
        if (quitBtn) {
            quitBtn.addEventListener('click', () => this.quitToMenu());
        }

        // Results screen buttons
        const playAgainBtn = document.getElementById('play-again-btn');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => this.playAgain());
        }

        const shareBtn = document.getElementById('share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareResults());
        }

        // Tutorial navigation
        const tutorialNext = document.getElementById('tutorial-next');
        if (tutorialNext) {
            tutorialNext.addEventListener('click', () => this.nextTutorialStep());
        }

        const tutorialPrev = document.getElementById('tutorial-prev');
        if (tutorialPrev) {
            tutorialPrev.addEventListener('click', () => this.prevTutorialStep());
        }

        // Modal close
        const modalClose = document.getElementById('modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closePlayerModal());
        }
    }

    // Show start screen
    showStartScreen() {
        Animations.transitionScreen('team-select-screen', 'start-screen');
        this.currentScreen = 'start';
    }

    // Show team selection
    showTeamSelect() {
        Animations.transitionScreen('start-screen', 'team-select-screen');
        this.currentScreen = 'team-select';
    }

    // Select a team and start the game
    selectTeam(teamId) {
        if (Game.startGame(teamId)) {
            // Show tutorial if not completed
            if (!Game.state.tutorialComplete) {
                this.showTutorial();
            }

            Animations.transitionScreen('team-select-screen', 'game-screen', () => {
                this.updateGameUI();
                this.renderCurrentScenario();
            });
            this.currentScreen = 'game';
        }
    }

    // Update all game UI elements
    updateGameUI() {
        const state = Game.getGameState();
        const team = PlayerDatabase.getTeam(state.team);

        // Update team badge
        const badge = document.getElementById('current-team-badge');
        if (badge && team) {
            badge.querySelector('.team-abbr').textContent = team.abbr;
            badge.className = `team-badge ${state.team}`;
        }

        // Update round
        const roundNum = document.getElementById('round-number');
        if (roundNum) {
            roundNum.textContent = state.round;
        }

        // Update stat bars
        this.updateStatBars(state);

        // Update luxury tax display
        const taxValue = document.getElementById('tax-value');
        if (taxValue) {
            taxValue.textContent = Game.formatMoney(state.luxuryTax);
            taxValue.className = state.luxuryTax === 0 ? 'tax-value zero' : 'tax-value';
        }

        // Update decision history dots
        this.updateDecisionHistory(state);

        // Update pause menu stats
        this.updatePauseMenuStats(state);
    }

    // Update the stat bars
    updateStatBars(state) {
        // Cap bar
        const capValue = document.getElementById('cap-value');
        const capBar = document.getElementById('cap-bar');
        if (capValue && capBar) {
            capValue.textContent = `${Game.formatMoney(state.payroll)} / ${Game.formatMoney(Game.SALARY_CAP)}`;
            const capPercent = Math.min(100, (state.payroll / Game.SALARY_CAP) * 100);
            capBar.style.width = capPercent + '%';
        }

        // Budget bar
        const budgetValue = document.getElementById('budget-value');
        const budgetBar = document.getElementById('budget-bar');
        if (budgetValue && budgetBar) {
            budgetValue.textContent = `${Game.formatMoney(state.totalSpend)} / ${Game.formatMoney(Game.BUDGET_LIMIT)}`;
            const budgetPercent = Math.min(100, (state.totalSpend / Game.BUDGET_LIMIT) * 100);
            budgetBar.style.width = budgetPercent + '%';

            // Color warning
            if (budgetPercent >= 90) {
                budgetBar.style.background = 'linear-gradient(90deg, #FF4757, #FF6B6B)';
            }
        }

        // Wins bar
        const winsValue = document.getElementById('wins-value');
        const winsBar = document.getElementById('wins-bar');
        if (winsValue && winsBar) {
            winsValue.textContent = `${state.wins} / ${Game.PLAYOFF_WINS}`;
            const winsPercent = Math.min(100, (state.wins / Game.PLAYOFF_WINS) * 100);
            winsBar.style.width = winsPercent + '%';
        }
    }

    // Update decision history dots
    updateDecisionHistory(state) {
        const container = document.getElementById('decision-history');
        if (!container) return;

        container.innerHTML = '';
        for (let i = 1; i <= Game.TOTAL_ROUNDS; i++) {
            const dot = document.createElement('span');
            dot.className = 'history-dot';
            if (i < state.round) {
                dot.classList.add('completed');
            } else if (i === state.round) {
                dot.classList.add('current');
            }
            container.appendChild(dot);
        }
    }

    // Render the current scenario
    renderCurrentScenario() {
        const scenario = Game.getCurrentScenario();
        if (!scenario) {
            console.error('No scenario to render');
            return;
        }

        // Update title and description
        const title = document.getElementById('scenario-title');
        const desc = document.getElementById('scenario-description');
        if (title) title.textContent = scenario.title;
        if (desc) desc.textContent = scenario.description;

        // Render decision cards
        this.renderDecisionCards(scenario.choices);
    }

    // Render decision cards
    renderDecisionCards(choices) {
        const container = document.getElementById('decision-cards');
        if (!container) return;

        container.innerHTML = '';

        choices.forEach(choice => {
            const card = this.createDecisionCard(choice);
            container.appendChild(card);
        });

        // Animate cards entrance
        setTimeout(() => Animations.animateCards(container), 100);
    }

    // Create a single decision card
    createDecisionCard(choice) {
        const player = choice.player ? PlayerDatabase.getPlayer(choice.player) : null;

        const card = document.createElement('div');
        card.className = `decision-card ${choice.type}-player`;
        card.dataset.choiceId = choice.id;

        // Determine card accent based on type
        let typeIcon = '🏀';
        let typeLabel = 'Decision';
        if (choice.type === 'star') {
            typeIcon = '⭐';
            typeLabel = 'Star Move';
        } else if (choice.type === 'depth') {
            typeIcon = '👥';
            typeLabel = 'Add Depth';
        } else if (choice.type === 'rookie') {
            typeIcon = '🌟';
            typeLabel = 'Develop Youth';
        } else if (choice.type === 'strategy') {
            typeIcon = '🧠';
            typeLabel = 'Strategy';
        }

        card.innerHTML = `
            <div class="card-header">
                <div class="player-avatar">
                    ${player ? `<span class="player-initials">${PlayerDatabase.getPlayerInitials(player)}</span>` : `<span>${typeIcon}</span>`}
                    <span class="rarity-indicator ${choice.type}">${typeIcon}</span>
                </div>
                <div class="card-player-info">
                    <div class="card-player-name">${choice.title}</div>
                    ${player ? `<div class="card-player-position">${player.position} | ${player.team}</div>` : ''}
                    <div class="card-player-team">${typeLabel}</div>
                </div>
            </div>

            ${player ? `
            <div class="card-stats">
                <div class="card-stat">
                    <span class="card-stat-value">${player.stats.ppg}</span>
                    <span class="card-stat-label">PPG</span>
                </div>
                <div class="card-stat">
                    <span class="card-stat-value">${player.stats.rpg}</span>
                    <span class="card-stat-label">RPG</span>
                </div>
                <div class="card-stat">
                    <span class="card-stat-value">${player.stats.apg}</span>
                    <span class="card-stat-label">APG</span>
                </div>
            </div>
            ` : ''}

            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem; line-height: 1.5;">
                ${choice.description}
            </p>

            <div class="card-impact">
                <div class="impact-row">
                    <span class="impact-label">Wins Change</span>
                    <span class="impact-value ${choice.winChange >= 0 ? 'positive' : 'negative'}">
                        ${choice.winChange >= 0 ? '+' : ''}${choice.winChange} wins
                    </span>
                </div>
                <div class="impact-row">
                    <span class="impact-label">Cost</span>
                    <span class="impact-value ${choice.salaryChange > 0 ? 'negative' : 'positive'}">
                        ${choice.salaryChange > 0 ? '+' + Game.formatMoney(choice.salaryChange) : 'No cost'}
                    </span>
                </div>
                <div class="impact-row">
                    <span class="impact-label">Risk Level</span>
                    <span class="impact-value ${choice.riskLevel === 'high' ? 'negative' : choice.riskLevel === 'medium' ? 'neutral' : 'positive'}">
                        ${choice.riskLevel.charAt(0).toUpperCase() + choice.riskLevel.slice(1)}
                    </span>
                </div>
            </div>

            <button class="card-action">Choose This Option</button>
        `;

        // Add click handler
        card.querySelector('.card-action').addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleDecision(choice.id);
        });

        return card;
    }

    // Handle when player makes a decision
    handleDecision(choiceId) {
        const result = Game.makeDecision(choiceId);

        if (!result || !result.success) {
            console.error('Decision failed');
            return;
        }

        // Show consequence message
        this.showConsequence(result.consequence, () => {
            if (result.isGameOver) {
                this.showResults();
            } else {
                this.updateGameUI();
                this.renderCurrentScenario();
            }
        });

        // Play sound/animation based on decision impact
        if (result.newState.isOverBudget) {
            Animations.showMoneyFall();
            Animations.shakeElement(document.getElementById('budget-value'));
        }
    }

    // Show consequence popup
    showConsequence(message, callback) {
        // Create simple overlay
        const overlay = document.createElement('div');
        overlay.className = 'consequence-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
        `;

        overlay.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #001B4D 0%, #000B24 100%);
                border: 2px solid #0066FF;
                border-radius: 16px;
                padding: 2rem;
                max-width: 500px;
                text-align: center;
                animation: scaleIn 0.3s ease;
            ">
                <h3 style="font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; color: #FFD700; margin-bottom: 1rem;">
                    What Happened...
                </h3>
                <p style="color: rgba(255,255,255,0.8); line-height: 1.6; margin-bottom: 1.5rem;">
                    ${message}
                </p>
                <button id="continue-btn" style="
                    background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%);
                    border: none;
                    border-radius: 12px;
                    padding: 0.75rem 2rem;
                    color: white;
                    font-family: 'Poppins', sans-serif;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    Continue
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector('#continue-btn').addEventListener('click', () => {
            overlay.remove();
            if (callback) callback();
        });
    }

    // Show results screen
    showResults() {
        const state = Game.getGameState();
        const ending = Game.getEnding();
        const rating = Game.calculateGMRating();

        Animations.transitionScreen('game-screen', 'results-screen', () => {
            // Update results display
            const trophy = document.getElementById('trophy-container');
            const title = document.getElementById('results-title');
            const subtitle = document.getElementById('results-subtitle');

            if (trophy) {
                trophy.textContent = ending.icon;
                if (ending.type === 'victory') {
                    Animations.celebrateWin();
                    Animations.animateTrophy(trophy);
                }
            }

            if (title) title.textContent = ending.title;
            if (subtitle) {
                subtitle.textContent = ending.subtitle;
                subtitle.className = ending.type === 'failure' ? 'results-subtitle failure' : 'results-subtitle';
            }

            // Update stats
            document.getElementById('final-wins').textContent = state.wins;
            document.getElementById('final-spend').textContent = Game.formatMoney(state.totalSpend);
            document.getElementById('final-tax').textContent = Game.formatMoney(state.luxuryTax);

            // Update analysis
            const analysis = Game.getEndingAnalysis(ending);
            document.getElementById('analysis-text').textContent = analysis;

            // Update rating
            document.getElementById('gm-rating').textContent = rating;

            // Handle claim codes based on rating
            this.displayClaimCode(rating);

            // Render decision path
            this.renderDecisionPath(state.decisions);
        });

        this.currentScreen = 'results';
    }

    // Display claim code based on GM rating
    displayClaimCode(rating) {
        const claimCodeSection = document.getElementById('claim-code-section');
        const claimCodeDisplay = document.getElementById('claim-code-display');

        if (!claimCodeSection || !claimCodeDisplay) return;

        let claimCode = null;

        // A rating: Premium claim code
        if (rating === 'A+' || rating === 'A' || rating === 'A-') {
            claimCode = 'NBA-ELITE-GM-2026';
        }
        // B-C rating: Standard claim code
        else if (rating === 'B+' || rating === 'B' || rating === 'B-' ||
                 rating === 'C+' || rating === 'C' || rating === 'C-') {
            claimCode = 'NBA-RISING-STAR-2026';
        }
        // D or F rating: No claim code
        else {
            claimCodeSection.style.display = 'none';
            return;
        }

        // Display the claim code
        claimCodeDisplay.textContent = claimCode;
        claimCodeSection.style.display = 'block';
    }

    // Render the decision path visualization
    renderDecisionPath(decisions) {
        const container = document.getElementById('path-visualization');
        if (!container) return;

        container.innerHTML = '';

        decisions.forEach((decision, index) => {
            // Add node
            const node = document.createElement('div');
            node.className = 'path-node';

            let icon = '🏀';
            if (decision.choiceType === 'star') icon = '⭐';
            else if (decision.choiceType === 'depth') icon = '👥';
            else if (decision.choiceType === 'rookie') icon = '🌟';
            else if (decision.choiceType === 'strategy') icon = '🧠';

            node.innerHTML = `
                <div class="path-icon">${icon}</div>
                <span class="path-label">Round ${decision.round}</span>
            `;
            container.appendChild(node);

            // Add arrow (except for last)
            if (index < decisions.length - 1) {
                const arrow = document.createElement('span');
                arrow.className = 'path-arrow';
                arrow.textContent = '→';
                container.appendChild(arrow);
            }
        });
    }

    // Tutorial methods
    showTutorial() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            overlay.classList.add('active');
            this.tutorialStep = 1;
            this.updateTutorialDisplay();
        }
    }

    hideTutorial() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        Game.completeTutorial();
    }

    nextTutorialStep() {
        if (this.tutorialStep >= this.totalTutorialSteps) {
            this.hideTutorial();
            return;
        }
        this.tutorialStep++;
        this.updateTutorialDisplay();
    }

    prevTutorialStep() {
        if (this.tutorialStep <= 1) return;
        this.tutorialStep--;
        this.updateTutorialDisplay();
    }

    updateTutorialDisplay() {
        // Hide all steps
        document.querySelectorAll('.tutorial-step').forEach(step => {
            step.style.display = 'none';
        });

        // Show current step
        const currentStep = document.querySelector(`.tutorial-step[data-step="${this.tutorialStep}"]`);
        if (currentStep) {
            currentStep.style.display = 'block';
        }

        // Update dots
        document.querySelectorAll('.tutorial-dots .dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === this.tutorialStep - 1);
        });

        // Update buttons
        const prevBtn = document.getElementById('tutorial-prev');
        const nextBtn = document.getElementById('tutorial-next');

        if (prevBtn) {
            prevBtn.style.visibility = this.tutorialStep === 1 ? 'hidden' : 'visible';
        }

        if (nextBtn) {
            nextBtn.textContent = this.tutorialStep === this.totalTutorialSteps ? "Let's Play!" : 'Next →';
        }
    }

    // Pause menu methods
    showPauseMenu() {
        const menu = document.getElementById('pause-menu');
        if (menu) menu.classList.add('active');
    }

    hidePauseMenu() {
        const menu = document.getElementById('pause-menu');
        if (menu) menu.classList.remove('active');
    }

    updatePauseMenuStats(state) {
        const pauseRound = document.getElementById('pause-round');
        const pauseWins = document.getElementById('pause-wins');
        const pauseBudget = document.getElementById('pause-budget');

        if (pauseRound) pauseRound.textContent = state.round;
        if (pauseWins) pauseWins.textContent = state.wins;
        if (pauseBudget) pauseBudget.textContent = Game.formatMoney(state.totalSpend);
    }

    restartGame() {
        this.hidePauseMenu();
        const team = Game.state.selectedTeam;
        Game.resetGame();
        this.selectTeam(team);
    }

    quitToMenu() {
        this.hidePauseMenu();
        Game.resetGame();
        Animations.transitionScreen('game-screen', 'start-screen');
        this.currentScreen = 'start';
    }

    playAgain() {
        Game.resetGame();
        Animations.transitionScreen('results-screen', 'team-select-screen');
        this.currentScreen = 'team-select';
    }

    shareResults() {
        const state = Game.getGameState();
        const ending = Game.getEnding();
        const rating = Game.calculateGMRating();

        const text = `🏀 NBA Luxury Tax Challenge\n\nI played as the ${PlayerDatabase.getTeam(state.team).name}!\n📊 Final: ${state.wins} wins\n💰 Spent: ${Game.formatMoney(state.totalSpend)}\n🎯 Rating: ${rating}\n\n${ending.title}\n\nCan you do better?`;

        if (navigator.share) {
            navigator.share({
                title: 'NBA Luxury Tax Challenge',
                text: text
            }).catch(() => {
                this.copyToClipboard(text);
            });
        } else {
            this.copyToClipboard(text);
        }
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Results copied! Share with your friends!');
        }).catch(() => {
            alert('Could not copy results');
        });
    }

    closePlayerModal() {
        const modal = document.getElementById('player-modal');
        if (modal) modal.classList.remove('active');
    }
}

// Create global instance and initialize when DOM is ready
const UI = new UIManager();

document.addEventListener('DOMContentLoaded', () => {
    // Wait for game data to load
    setTimeout(() => {
        UI.init();
    }, 100);
});
