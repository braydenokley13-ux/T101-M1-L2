/**
 * MLB Money Maker - Claim Code Generator
 * Generates 3-tier claim codes (Gold/Silver/Bronze)
 */

const CodeGenerator = {
    /**
     * Character set for code generation
     */
    charset: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', // Removed similar looking chars (0,O,1,I)

    /**
     * Generate a unique claim code based on tier and game state
     * Format: MLB-{TIER}-{6CHARS}-{YEAR}
     */
    generateCode(tier, gameState) {
        const tierLabel = tier.toUpperCase();
        const hash = this.generateHash(gameState);
        const year = new Date().getFullYear();

        return `MLB-${tierLabel}-${hash}-${year}`;
    },

    /**
     * Generate a 6-character hash based on game state
     */
    generateHash(gameState) {
        // Create a seed from game state values
        const seed = this.createSeed(gameState);

        // Generate pseudo-random characters based on seed
        let hash = '';
        let currentSeed = seed;

        for (let i = 0; i < 6; i++) {
            currentSeed = this.nextRandom(currentSeed);
            const index = Math.abs(currentSeed) % this.charset.length;
            hash += this.charset[index];
        }

        return hash;
    },

    /**
     * Create a numeric seed from game state
     */
    createSeed(gameState) {
        // Combine various game state values into a seed
        const timestamp = Date.now();
        const stateValues = [
            Math.round((gameState.allocation?.players || 3.6) * 100),
            Math.round((gameState.allocation?.owners || 2.4) * 100),
            Math.round((gameState.minSalary || 750)),
            Math.round((gameState.revenueShare || 35)),
            Math.round((gameState.streaming || 25)),
            Math.round((gameState.salaryShare || 48.5) * 10),
            gameState.startTime || 2
        ];

        // Create hash from values
        let seed = timestamp % 1000000;
        stateValues.forEach((val, i) => {
            seed = seed * 31 + val * (i + 1);
            seed = seed % 2147483647; // Keep within 32-bit range
        });

        // Add randomness
        seed = seed * 1103515245 + 12345;
        seed = seed % 2147483647;

        return seed;
    },

    /**
     * Simple pseudo-random number generator
     */
    nextRandom(seed) {
        // Linear congruential generator
        return (seed * 1103515245 + 12345) % 2147483647;
    },

    /**
     * Validate a claim code format
     */
    validateCodeFormat(code) {
        const pattern = /^MLB-(GOLD|SILVER|BRONZE)-[A-Z0-9]{6}-\d{4}$/;
        return pattern.test(code);
    },

    /**
     * Extract tier from a claim code
     */
    extractTier(code) {
        if (!this.validateCodeFormat(code)) {
            return null;
        }

        const parts = code.split('-');
        return parts[1].toLowerCase();
    },

    /**
     * Extract year from a claim code
     */
    extractYear(code) {
        if (!this.validateCodeFormat(code)) {
            return null;
        }

        const parts = code.split('-');
        return parseInt(parts[3], 10);
    },

    /**
     * Generate a complete result object with code
     */
    generateResult(tierInfo, gameState, satisfactions) {
        // Don't generate code for failed deals
        if (tierInfo.tier === 'fail') {
            return {
                success: false,
                tier: 'fail',
                code: null,
                message: tierInfo.message,
                overall: tierInfo.overall,
                satisfactions: satisfactions
            };
        }

        const code = this.generateCode(tierInfo.tier, gameState);

        return {
            success: true,
            tier: tierInfo.tier,
            code: code,
            message: tierInfo.message,
            overall: tierInfo.overall,
            satisfactions: satisfactions,
            timestamp: new Date().toISOString()
        };
    },

    /**
     * Get display configuration for tier
     */
    getTierDisplay(tier) {
        const displays = {
            gold: {
                emoji: '🏆',
                title: 'CHAMPIONSHIP DEAL!',
                subtitle: 'Gold Tier Achievement',
                className: 'gold',
                color: '#FFD700'
            },
            silver: {
                emoji: '🥈',
                title: 'SOLID DEAL!',
                subtitle: 'Silver Tier Achievement',
                className: 'silver',
                color: '#C0C0C0'
            },
            bronze: {
                emoji: '🥉',
                title: 'ACCEPTABLE DEAL',
                subtitle: 'Bronze Tier Achievement',
                className: 'bronze',
                color: '#CD7F32'
            },
            fail: {
                emoji: '❌',
                title: 'DEAL COLLAPSED',
                subtitle: 'Negotiation Failed',
                className: 'fail',
                color: '#DC3545'
            }
        };

        return displays[tier] || displays.fail;
    },

    /**
     * Format code for display (with copy functionality)
     */
    formatCodeForDisplay(code) {
        if (!code) return '';

        // Add visual separators for readability
        return code;
    },

    /**
     * Store result to localStorage (for persistence)
     */
    storeResult(result) {
        try {
            const history = this.getResultHistory();
            history.push({
                ...result,
                storedAt: new Date().toISOString()
            });

            // Keep only last 10 results
            while (history.length > 10) {
                history.shift();
            }

            localStorage.setItem('mlb_money_maker_results', JSON.stringify(history));
            return true;
        } catch (e) {
            console.warn('Could not store result:', e);
            return false;
        }
    },

    /**
     * Get result history from localStorage
     */
    getResultHistory() {
        try {
            const stored = localStorage.getItem('mlb_money_maker_results');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    },

    /**
     * Get best result from history
     */
    getBestResult() {
        const history = this.getResultHistory();
        if (history.length === 0) return null;

        const tierRank = { gold: 3, silver: 2, bronze: 1, fail: 0 };

        return history.reduce((best, current) => {
            if (!best) return current;
            if (tierRank[current.tier] > tierRank[best.tier]) return current;
            if (tierRank[current.tier] === tierRank[best.tier] &&
                current.overall > best.overall) return current;
            return best;
        }, null);
    },

    /**
     * Clear result history
     */
    clearHistory() {
        try {
            localStorage.removeItem('mlb_money_maker_results');
            return true;
        } catch (e) {
            return false;
        }
    }
};

// Export for module systems (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CodeGenerator;
}
