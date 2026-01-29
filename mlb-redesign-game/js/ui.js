/**
 * MLB Money Maker - UI Module
 * DOM updates, animations, and character reactions
 */

const UI = {
    // Animation frame ID for heartbeat
    heartbeatAnimationId: null,
    heartbeatPhase: 0,

    /**
     * Initialize all UI components
     */
    init() {
        this.initHeartbeat();
        this.initPieChart();
        this.initSankeyChart();
    },

    /**
     * Show a specific screen and hide others
     */
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
        }
    },

    /**
     * Hide loading screen
     */
    hideLoading() {
        const loading = document.getElementById('loading-screen');
        if (loading) {
            loading.classList.add('hidden');
            setTimeout(() => {
                loading.style.display = 'none';
            }, 500);
        }
    },

    // ===== ALLOCATION DISPLAY =====

    /**
     * Update allocation display for a stakeholder
     */
    updateAllocationDisplay(stakeholder, value) {
        const amountEl = document.getElementById(`${stakeholder}-amount`);
        const percentEl = document.getElementById(`${stakeholder}-percent`);

        if (amountEl) {
            amountEl.textContent = `$${value.toFixed(1)}B`;
        }

        if (percentEl) {
            const percent = (value / 8.0 * 100).toFixed(0);
            percentEl.textContent = `${percent}%`;
        }

        // Update pie chart
        this.updatePieChart();
    },

    // ===== SLIDER DISPLAYS =====

    /**
     * Update slider value display
     */
    updateSliderDisplay(sliderId, value) {
        const el = document.getElementById(`${sliderId}-value`);
        if (el) {
            el.textContent = value;
        }
    },

    /**
     * Update competitive balance meter
     */
    updateCompetitiveBalance(revenueShare) {
        const fill = document.getElementById('balance-fill');
        const text = document.getElementById('balance-text');

        if (fill) {
            // Position indicator (0-100% of bar width)
            const position = ((revenueShare - 10) / 50) * 100;
            fill.style.left = `calc(${position}% - 8px)`;
        }

        if (text) {
            text.textContent = Calculations.getBalanceText(revenueShare);
        }
    },

    /**
     * Update start time impact text
     */
    updateStartTimeImpact(impact) {
        const el = document.getElementById('start-time-impact');
        if (el) {
            el.textContent = impact;
        }
    },

    /**
     * Update viewer split bar
     */
    updateViewerSplit(streaming) {
        const cable = document.getElementById('cable-viewers');
        const stream = document.getElementById('streaming-viewers');

        const cablePercent = 100 - streaming;

        if (cable) {
            cable.style.width = `${cablePercent}%`;
            cable.querySelector('span').textContent = `Cable ${cablePercent}%`;
        }

        if (stream) {
            stream.style.width = `${streaming}%`;
            stream.querySelector('span').textContent = `Stream ${streaming}%`;
        }
    },

    // ===== SATISFACTION DISPLAY =====

    /**
     * Update all satisfaction displays
     */
    updateSatisfactions(satisfactions) {
        Object.keys(satisfactions).forEach(stakeholder => {
            this.updateStakeholderSatisfaction(stakeholder, satisfactions[stakeholder]);
        });

        // Update overall score
        const overall = Calculations.calculateOverallScore(satisfactions);
        this.updateOverallScore(overall, satisfactions);

        // Update stability
        const stability = Calculations.checkStability(satisfactions);
        this.updateStability(stability);
    },

    /**
     * Update individual stakeholder satisfaction
     */
    updateStakeholderSatisfaction(stakeholder, satisfaction) {
        // Update bar
        const bar = document.getElementById(`${stakeholder}-satisfaction`);
        if (bar) {
            bar.style.width = `${satisfaction}%`;
        }

        // Update percent text
        const percent = document.getElementById(`${stakeholder}-sat-percent`);
        if (percent) {
            percent.textContent = `${satisfaction}%`;
        }

        // Update emoji
        const face = document.getElementById(`${stakeholder}-face`);
        if (face) {
            const emoji = Calculations.getEmoji(satisfaction);
            face.querySelector('.face-emoji').textContent = emoji;

            // Add animation class
            face.classList.remove('happy', 'angry');
            if (satisfaction >= 70) {
                face.classList.add('happy');
            } else if (satisfaction < 50) {
                face.classList.add('angry');
            }
        }

        // Update comment
        const comment = document.getElementById(`${stakeholder}-comment`);
        if (comment) {
            comment.textContent = Calculations.getComment(stakeholder, satisfaction);
        }
    },

    /**
     * Update overall score display
     */
    updateOverallScore(overall, satisfactions) {
        const scoreEl = document.getElementById('overall-score');
        const tierEl = document.getElementById('score-tier');

        if (scoreEl) {
            scoreEl.textContent = `${overall}%`;
        }

        if (tierEl) {
            const tierInfo = Calculations.determineTier(satisfactions);
            tierEl.textContent = tierInfo.label;
            tierEl.className = `score-tier ${tierInfo.tier}`;
        }
    },

    /**
     * Update stability status
     */
    updateStability(stability) {
        const statusEl = document.getElementById('stability-status');

        if (statusEl) {
            statusEl.className = `stability-status ${stability}`;

            switch (stability) {
                case 'stable':
                    statusEl.textContent = 'STABLE';
                    break;
                case 'warning':
                    statusEl.textContent = 'WARNING';
                    break;
                case 'danger':
                    statusEl.textContent = 'DANGER';
                    break;
                case 'collapsed':
                    statusEl.textContent = 'COLLAPSED';
                    break;
            }
        }
    },

    // ===== HEARTBEAT MONITOR =====

    /**
     * Initialize heartbeat animation
     */
    initHeartbeat() {
        const canvas = document.getElementById('heartbeat-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        this.heartbeatCtx = ctx;
        this.heartbeatData = [];

        // Fill with baseline
        for (let i = 0; i < canvas.width; i++) {
            this.heartbeatData.push(canvas.height / 2);
        }

        this.animateHeartbeat();
    },

    /**
     * Animate heartbeat based on stability
     */
    animateHeartbeat() {
        const canvas = document.getElementById('heartbeat-canvas');
        if (!canvas || !this.heartbeatCtx) return;

        const ctx = this.heartbeatCtx;
        const width = canvas.width;
        const height = canvas.height;
        const baseline = height / 2;

        // Get current stability
        const stability = Game.state.stability || 'stable';

        // Calculate new point based on stability
        this.heartbeatPhase += 0.1;

        let newValue = baseline;
        if (stability === 'stable') {
            // Normal heartbeat pattern
            const beat = Math.sin(this.heartbeatPhase * 2) * 0.5 +
                        Math.sin(this.heartbeatPhase * 4) * 0.3;
            newValue = baseline + beat * 12;
        } else if (stability === 'warning') {
            // Faster, irregular
            const beat = Math.sin(this.heartbeatPhase * 3) * 0.6 +
                        Math.sin(this.heartbeatPhase * 5) * 0.4;
            newValue = baseline + beat * 14;
        } else if (stability === 'danger') {
            // Very fast, erratic
            const beat = Math.sin(this.heartbeatPhase * 4) * 0.7 +
                        Math.random() * 0.3;
            newValue = baseline + beat * 16;
        } else if (stability === 'collapsed') {
            // Flatline
            newValue = baseline;
        }

        // Shift data and add new point
        this.heartbeatData.shift();
        this.heartbeatData.push(newValue);

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Set line style based on stability
        ctx.strokeStyle = stability === 'stable' ? '#28A745' :
                          stability === 'warning' ? '#FFC107' :
                          stability === 'danger' ? '#DC3545' : '#DC3545';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw line
        ctx.beginPath();
        this.heartbeatData.forEach((y, x) => {
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Continue animation
        this.heartbeatAnimationId = requestAnimationFrame(() => this.animateHeartbeat());
    },

    /**
     * Stop heartbeat animation
     */
    stopHeartbeat() {
        if (this.heartbeatAnimationId) {
            cancelAnimationFrame(this.heartbeatAnimationId);
        }
    },

    // ===== PIE CHART =====

    /**
     * Initialize pie chart
     */
    initPieChart() {
        this.updatePieChart();
    },

    /**
     * Update pie chart with current allocations
     */
    updatePieChart() {
        const canvas = document.getElementById('money-pie-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Get allocations
        const allocations = Game.state.allocation;
        const total = allocations.players + allocations.owners +
                      allocations.networks + allocations.league;

        // Colors for each stakeholder
        const colors = {
            players: '#2E86AB',
            owners: '#A23B72',
            networks: '#F18F01',
            league: '#3B1F2B'
        };

        // Draw pie slices
        let startAngle = -Math.PI / 2; // Start at top

        Object.keys(allocations).forEach(key => {
            const value = allocations[key];
            const sliceAngle = (value / total) * 2 * Math.PI;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.closePath();

            ctx.fillStyle = colors[key];
            ctx.fill();

            // Add subtle border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();

            startAngle += sliceAngle;
        });

        // Draw center circle (donut effect)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
        ctx.fillStyle = '#0A1628';
        ctx.fill();
    },

    // ===== SANKEY CHART =====

    /**
     * Initialize Sankey chart (simplified money flow)
     */
    initSankeyChart() {
        this.updateSankeyChart();
    },

    /**
     * Update Sankey chart
     */
    updateSankeyChart() {
        const canvas = document.getElementById('sankey-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Get allocations
        const allocations = Game.state.allocation;
        const total = 8.0;

        // Draw simplified flow
        const sourceX = 50;
        const destX = width - 80;
        const sourceY = height / 2;

        // Colors
        const colors = {
            players: '#2E86AB',
            owners: '#A23B72',
            networks: '#F18F01',
            league: '#3B1F2B'
        };

        // Destinations
        const destinations = ['players', 'owners', 'networks', 'league'];
        const destYs = [30, 70, 110, 150];

        // Draw source
        ctx.fillStyle = '#CE1141';
        ctx.font = 'bold 12px Inter';
        ctx.textAlign = 'right';
        ctx.fillText('$8B', sourceX - 10, sourceY + 4);

        ctx.beginPath();
        ctx.arc(sourceX, sourceY, 15, 0, 2 * Math.PI);
        ctx.fillStyle = '#CE1141';
        ctx.fill();

        // Draw flows
        destinations.forEach((dest, i) => {
            const value = allocations[dest];
            const thickness = (value / total) * 40;

            ctx.beginPath();
            ctx.moveTo(sourceX + 15, sourceY);

            // Bezier curve
            const cp1x = sourceX + 80;
            const cp1y = sourceY;
            const cp2x = destX - 80;
            const cp2y = destYs[i];

            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, destX - 15, destYs[i]);

            ctx.strokeStyle = colors[dest];
            ctx.lineWidth = Math.max(2, thickness);
            ctx.globalAlpha = 0.6;
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Draw destination circle
            ctx.beginPath();
            ctx.arc(destX, destYs[i], 12, 0, 2 * Math.PI);
            ctx.fillStyle = colors[dest];
            ctx.fill();

            // Label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '10px Inter';
            ctx.textAlign = 'left';
            ctx.fillText(`$${value.toFixed(1)}B`, destX + 18, destYs[i] + 4);
        });
    },

    // ===== RESULTS SCREEN =====

    /**
     * Show results screen with final data
     */
    showResults(result, satisfactions, gameState) {
        const tierDisplay = CodeGenerator.getTierDisplay(result.tier);

        // Update header
        document.getElementById('result-badge').textContent = tierDisplay.emoji;
        document.getElementById('results-title').textContent = tierDisplay.title;
        document.getElementById('results-subtitle').textContent = tierDisplay.subtitle;
        document.getElementById('results-subtitle').className = `results-subtitle ${result.tier}`;

        // Update message
        document.getElementById('results-message').querySelector('p').textContent = result.message;

        // Update final bars
        this.animateFinalBars(satisfactions);

        // Update summary
        document.getElementById('summary-players').textContent = `$${gameState.allocation.players.toFixed(1)}B`;
        document.getElementById('summary-owners').textContent = `$${gameState.allocation.owners.toFixed(1)}B`;
        document.getElementById('summary-min-salary').textContent = `$${gameState.minSalary}K`;
        document.getElementById('summary-revenue-share').textContent = `${gameState.revenueShare}%`;
        document.getElementById('summary-streaming').textContent = `${gameState.streaming}%`;
        document.getElementById('summary-salary-share').textContent = `${gameState.salaryShare}%`;

        // Handle claim code section
        const claimSection = document.getElementById('claim-code-section');
        const failedSection = document.getElementById('failed-section');

        if (result.success && result.code) {
            claimSection.style.display = 'block';
            claimSection.className = `claim-code-section ${result.tier}`;
            document.getElementById('claim-code').textContent = result.code;
            failedSection.style.display = 'none';
        } else {
            claimSection.style.display = 'none';
            failedSection.style.display = 'block';

            const lowest = Calculations.getLowestStakeholder(satisfactions);
            document.getElementById('failed-reason').textContent =
                `${lowest.name} walked away from negotiations (${lowest.value}% satisfaction).`;
        }

        // Show results screen
        this.showScreen('results-screen');
    },

    /**
     * Animate final satisfaction bars
     */
    animateFinalBars(satisfactions) {
        setTimeout(() => {
            Object.keys(satisfactions).forEach(stakeholder => {
                const bar = document.getElementById(`final-${stakeholder}-bar`);
                const percent = document.getElementById(`final-${stakeholder}-percent`);

                if (bar) {
                    bar.style.width = `${satisfactions[stakeholder]}%`;
                }
                if (percent) {
                    percent.textContent = `${satisfactions[stakeholder]}%`;
                }
            });
        }, 300);
    },

    // ===== PROGRESS BAR =====

    /**
     * Update game progress bar
     */
    updateProgress(percent) {
        const fill = document.getElementById('game-progress');
        if (fill) {
            fill.style.width = `${percent}%`;
        }
    },

    // ===== UTILITIES =====

    /**
     * Add visual feedback for an action
     */
    flashElement(elementId, type = 'success') {
        const el = document.getElementById(elementId);
        if (!el) return;

        el.classList.add(`flash-${type}`);
        setTimeout(() => {
            el.classList.remove(`flash-${type}`);
        }, 500);
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        // Add to body
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Export for module systems (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}
