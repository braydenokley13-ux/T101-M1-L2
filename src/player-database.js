/**
 * NBA Luxury Tax Challenge - Player Database
 * Real NBA 2025-26 Season Data
 *
 * Note: Salaries are approximations based on current contracts
 * projected to 2025-26 season
 */

const PlayerDatabase = {
    // Salary Cap Constants
    SALARY_CAP: 136000000,        // $136M
    LUXURY_TAX_LINE: 165000000,   // $165M luxury tax threshold
    BUDGET_LIMIT: 150000000,      // $150M max total spend for game
    PLAYOFF_WINS: 46,             // Target wins for playoffs

    // Tax Brackets (simplified for educational purposes)
    TAX_BRACKETS: [
        { threshold: 5000000, rate: 1.5 },    // $0-5M over: 1.5x
        { threshold: 10000000, rate: 1.75 },  // $5-10M over: 1.75x
        { threshold: 15000000, rate: 2.5 },   // $10-15M over: 2.5x
        { threshold: Infinity, rate: 3.25 }   // $15M+ over: 3.25x
    ],

    // Team Configurations
    teams: {
        lakers: {
            id: 'lakers',
            name: 'Los Angeles Lakers',
            abbr: 'LAL',
            city: 'Los Angeles',
            colors: {
                primary: '#552583',
                secondary: '#FDB927',
                accent: '#FFFFFF'
            },
            startingWins: 42,
            startingPayroll: 138000000,
            difficulty: 'hard',
            description: 'Legacy franchise with high expectations. Already over the cap with star contracts.',
            situation: 'The Lakers are in win-now mode with an aging core. LeBron is entering his twilight years, and every decision matters for championship aspirations.',
            currentRoster: ['lebron_james', 'anthony_davis', 'austin_reaves', 'rui_hachimura', 'dangelo_russell']
        },
        bucks: {
            id: 'bucks',
            name: 'Milwaukee Bucks',
            abbr: 'MIL',
            city: 'Milwaukee',
            colors: {
                primary: '#00471B',
                secondary: '#EEE1C6',
                accent: '#FFFFFF'
            },
            startingWins: 44,
            startingPayroll: 134000000,
            difficulty: 'medium',
            description: 'Championship-caliber team built around a generational superstar.',
            situation: 'Giannis is in his prime and the championship window is wide open. The supporting cast needs optimization to make another Finals run.',
            currentRoster: ['giannis', 'damian_lillard', 'khris_middleton', 'brook_lopez', 'bobby_portis']
        },
        spurs: {
            id: 'spurs',
            name: 'San Antonio Spurs',
            abbr: 'SAS',
            city: 'San Antonio',
            colors: {
                primary: '#C4CED4',
                secondary: '#000000',
                accent: '#FFFFFF'
            },
            startingWins: 38,
            startingPayroll: 98000000,
            difficulty: 'moderate',
            description: 'Rebuilding around a generational talent with cap flexibility.',
            situation: 'Victor Wembanyama leads the Spurs rebuild. With significant cap space, you must decide whether to accelerate or stay patient.',
            currentRoster: ['wembanyama', 'devin_vassell', 'keldon_johnson', 'jeremy_sochan', 'tre_jones']
        }
    },

    // All Players Database
    players: {
        // ==================
        // STAR PLAYERS
        // ==================
        lebron_james: {
            id: 'lebron_james',
            name: 'LeBron James',
            firstName: 'LeBron',
            lastName: 'James',
            position: 'SF',
            team: 'LAL',
            number: 23,
            age: 41,
            salary: 48000000,
            stats: { ppg: 25.2, rpg: 7.5, apg: 8.1 },
            rarity: 'star',
            winImpact: 6,
            description: 'The King. Still performing at an elite level in his 22nd season.'
        },
        anthony_davis: {
            id: 'anthony_davis',
            name: 'Anthony Davis',
            firstName: 'Anthony',
            lastName: 'Davis',
            position: 'PF/C',
            team: 'LAL',
            number: 3,
            age: 32,
            salary: 45000000,
            stats: { ppg: 24.8, rpg: 12.2, apg: 3.1 },
            rarity: 'star',
            winImpact: 5,
            description: 'Dominant two-way big man when healthy. Elite rim protector.'
        },
        giannis: {
            id: 'giannis',
            name: 'Giannis Antetokounmpo',
            firstName: 'Giannis',
            lastName: 'Antetokounmpo',
            position: 'PF',
            team: 'MIL',
            number: 34,
            age: 30,
            salary: 52000000,
            stats: { ppg: 31.5, rpg: 11.8, apg: 5.7 },
            rarity: 'star',
            winImpact: 8,
            description: 'Two-time MVP. Unstoppable force attacking the rim.'
        },
        damian_lillard: {
            id: 'damian_lillard',
            name: 'Damian Lillard',
            firstName: 'Damian',
            lastName: 'Lillard',
            position: 'PG',
            team: 'MIL',
            number: 0,
            age: 35,
            salary: 48000000,
            stats: { ppg: 26.4, rpg: 4.4, apg: 7.2 },
            rarity: 'star',
            winImpact: 5,
            description: 'Dame Time. Elite scorer and clutch performer.'
        },
        wembanyama: {
            id: 'wembanyama',
            name: 'Victor Wembanyama',
            firstName: 'Victor',
            lastName: 'Wembanyama',
            position: 'C',
            team: 'SAS',
            number: 1,
            age: 21,
            salary: 13000000,
            stats: { ppg: 24.5, rpg: 11.2, apg: 4.1 },
            rarity: 'star',
            winImpact: 7,
            description: 'Generational talent. 7\'4" with guard skills and elite shot blocking.'
        },
        stephen_curry: {
            id: 'stephen_curry',
            name: 'Stephen Curry',
            firstName: 'Stephen',
            lastName: 'Curry',
            position: 'PG',
            team: 'GSW',
            number: 30,
            age: 37,
            salary: 52000000,
            stats: { ppg: 27.1, rpg: 4.8, apg: 5.3 },
            rarity: 'star',
            winImpact: 6,
            description: 'Greatest shooter ever. Revolutionized the modern NBA.'
        },
        luka_doncic: {
            id: 'luka_doncic',
            name: 'Luka Dončić',
            firstName: 'Luka',
            lastName: 'Dončić',
            position: 'PG/SG',
            team: 'DAL',
            number: 77,
            age: 26,
            salary: 48000000,
            stats: { ppg: 33.2, rpg: 9.1, apg: 9.5 },
            rarity: 'star',
            winImpact: 7,
            description: 'Walking triple-double. Elite playmaker and scorer.'
        },
        kevin_durant: {
            id: 'kevin_durant',
            name: 'Kevin Durant',
            firstName: 'Kevin',
            lastName: 'Durant',
            position: 'SF/PF',
            team: 'PHX',
            number: 35,
            age: 36,
            salary: 51000000,
            stats: { ppg: 27.3, rpg: 6.7, apg: 5.2 },
            rarity: 'star',
            winImpact: 5,
            description: 'Unguardable scorer. One of the greatest ever.'
        },
        joel_embiid: {
            id: 'joel_embiid',
            name: 'Joel Embiid',
            firstName: 'Joel',
            lastName: 'Embiid',
            position: 'C',
            team: 'PHI',
            number: 21,
            age: 31,
            salary: 54000000,
            stats: { ppg: 34.2, rpg: 11.1, apg: 5.8 },
            rarity: 'star',
            winImpact: 6,
            description: 'MVP-caliber center. Dominant on both ends when healthy.'
        },
        jayson_tatum: {
            id: 'jayson_tatum',
            name: 'Jayson Tatum',
            firstName: 'Jayson',
            lastName: 'Tatum',
            position: 'SF/PF',
            team: 'BOS',
            number: 0,
            age: 27,
            salary: 36000000,
            stats: { ppg: 27.0, rpg: 8.2, apg: 4.6 },
            rarity: 'star',
            winImpact: 5,
            description: 'Two-way superstar leading a championship contender.'
        },

        // ==================
        // MID-TIER / ROLE PLAYERS
        // ==================
        austin_reaves: {
            id: 'austin_reaves',
            name: 'Austin Reaves',
            firstName: 'Austin',
            lastName: 'Reaves',
            position: 'SG',
            team: 'LAL',
            number: 15,
            age: 27,
            salary: 14000000,
            stats: { ppg: 15.8, rpg: 4.2, apg: 5.5 },
            rarity: 'role',
            winImpact: 2,
            description: 'Crafty guard who exceeds expectations. Great value contract.'
        },
        rui_hachimura: {
            id: 'rui_hachimura',
            name: 'Rui Hachimura',
            firstName: 'Rui',
            lastName: 'Hachimura',
            position: 'PF',
            team: 'LAL',
            number: 28,
            age: 27,
            salary: 17000000,
            stats: { ppg: 13.2, rpg: 4.8, apg: 1.2 },
            rarity: 'role',
            winImpact: 2,
            description: 'Versatile forward with improving three-point shot.'
        },
        dangelo_russell: {
            id: 'dangelo_russell',
            name: "D'Angelo Russell",
            firstName: "D'Angelo",
            lastName: 'Russell',
            position: 'PG',
            team: 'LAL',
            number: 1,
            age: 29,
            salary: 19000000,
            stats: { ppg: 14.5, rpg: 3.1, apg: 6.2 },
            rarity: 'role',
            winImpact: 2,
            description: 'Skilled playmaker. Can get hot from three.'
        },
        khris_middleton: {
            id: 'khris_middleton',
            name: 'Khris Middleton',
            firstName: 'Khris',
            lastName: 'Middleton',
            position: 'SF',
            team: 'MIL',
            number: 22,
            age: 34,
            salary: 32000000,
            stats: { ppg: 15.1, rpg: 4.5, apg: 5.1 },
            rarity: 'role',
            winImpact: 3,
            description: 'Silky smooth scorer. Clutch playoff performer when healthy.'
        },
        brook_lopez: {
            id: 'brook_lopez',
            name: 'Brook Lopez',
            firstName: 'Brook',
            lastName: 'Lopez',
            position: 'C',
            team: 'MIL',
            number: 11,
            age: 37,
            salary: 23000000,
            stats: { ppg: 12.5, rpg: 5.2, apg: 1.6 },
            rarity: 'role',
            winImpact: 2,
            description: 'Elite rim protector who can stretch the floor.'
        },
        bobby_portis: {
            id: 'bobby_portis',
            name: 'Bobby Portis',
            firstName: 'Bobby',
            lastName: 'Portis',
            position: 'PF/C',
            team: 'MIL',
            number: 9,
            age: 30,
            salary: 12500000,
            stats: { ppg: 13.8, rpg: 7.4, apg: 1.5 },
            rarity: 'role',
            winImpact: 2,
            description: 'Fan favorite. Energy and rebounding off the bench.'
        },
        devin_vassell: {
            id: 'devin_vassell',
            name: 'Devin Vassell',
            firstName: 'Devin',
            lastName: 'Vassell',
            position: 'SG/SF',
            team: 'SAS',
            number: 24,
            age: 24,
            salary: 19000000,
            stats: { ppg: 19.2, rpg: 3.8, apg: 4.1 },
            rarity: 'role',
            winImpact: 3,
            description: '3-and-D wing with developing playmaking.'
        },
        keldon_johnson: {
            id: 'keldon_johnson',
            name: 'Keldon Johnson',
            firstName: 'Keldon',
            lastName: 'Johnson',
            position: 'SF',
            team: 'SAS',
            number: 3,
            age: 25,
            salary: 12000000,
            stats: { ppg: 16.5, rpg: 5.8, apg: 2.8 },
            rarity: 'role',
            winImpact: 2,
            description: 'High-energy wing. Tough, physical player.'
        },
        jeremy_sochan: {
            id: 'jeremy_sochan',
            name: 'Jeremy Sochan',
            firstName: 'Jeremy',
            lastName: 'Sochan',
            position: 'PF',
            team: 'SAS',
            number: 10,
            age: 22,
            salary: 6000000,
            stats: { ppg: 13.1, rpg: 7.2, apg: 3.5 },
            rarity: 'role',
            winImpact: 2,
            description: 'Versatile defender. Unique skill set and improving offense.'
        },
        tre_jones: {
            id: 'tre_jones',
            name: 'Tre Jones',
            firstName: 'Tre',
            lastName: 'Jones',
            position: 'PG',
            team: 'SAS',
            number: 33,
            age: 24,
            salary: 8000000,
            stats: { ppg: 11.8, rpg: 2.8, apg: 6.2 },
            rarity: 'role',
            winImpact: 1,
            description: 'Solid floor general. Makes smart decisions.'
        },

        // Additional role players for decisions
        marcus_smart: {
            id: 'marcus_smart',
            name: 'Marcus Smart',
            firstName: 'Marcus',
            lastName: 'Smart',
            position: 'PG/SG',
            team: 'MEM',
            number: 36,
            age: 31,
            salary: 14500000,
            stats: { ppg: 11.2, rpg: 3.5, apg: 6.1 },
            rarity: 'role',
            winImpact: 2,
            description: 'DPOY winner. Elite perimeter defender and leader.'
        },
        malik_monk: {
            id: 'malik_monk',
            name: 'Malik Monk',
            firstName: 'Malik',
            lastName: 'Monk',
            position: 'SG',
            team: 'SAC',
            number: 0,
            age: 27,
            salary: 12000000,
            stats: { ppg: 15.4, rpg: 2.9, apg: 5.1 },
            rarity: 'role',
            winImpact: 2,
            description: 'Microwave scorer off the bench. Can erupt for big numbers.'
        },
        bruce_brown: {
            id: 'bruce_brown',
            name: 'Bruce Brown',
            firstName: 'Bruce',
            lastName: 'Brown',
            position: 'SG/SF',
            team: 'TOR',
            number: 11,
            age: 28,
            salary: 11000000,
            stats: { ppg: 10.2, rpg: 4.1, apg: 3.5 },
            rarity: 'role',
            winImpact: 2,
            description: 'Versatile defender who does all the little things.'
        },
        nic_claxton: {
            id: 'nic_claxton',
            name: 'Nic Claxton',
            firstName: 'Nic',
            lastName: 'Claxton',
            position: 'C',
            team: 'BKN',
            number: 33,
            age: 26,
            salary: 22000000,
            stats: { ppg: 11.8, rpg: 9.2, apg: 2.5 },
            rarity: 'role',
            winImpact: 2,
            description: 'Athletic rim protector with improving offensive game.'
        },
        bogdan_bogdanovic: {
            id: 'bogdan_bogdanovic',
            name: 'Bogdan Bogdanović',
            firstName: 'Bogdan',
            lastName: 'Bogdanović',
            position: 'SG/SF',
            team: 'ATL',
            number: 13,
            age: 32,
            salary: 16500000,
            stats: { ppg: 12.8, rpg: 3.2, apg: 3.8 },
            rarity: 'role',
            winImpact: 2,
            description: 'Sharpshooting wing with crafty playmaking.'
        },

        // ==================
        // ROOKIES / YOUNG PLAYERS
        // ==================
        bronny_james: {
            id: 'bronny_james',
            name: 'Bronny James',
            firstName: 'Bronny',
            lastName: 'James',
            position: 'SG',
            team: 'LAL',
            number: 9,
            age: 21,
            salary: 2000000,
            stats: { ppg: 5.2, rpg: 2.1, apg: 1.8 },
            rarity: 'rookie',
            winImpact: 1,
            description: "LeBron's son. High ceiling, still developing."
        },
        dalton_knecht: {
            id: 'dalton_knecht',
            name: 'Dalton Knecht',
            firstName: 'Dalton',
            lastName: 'Knecht',
            position: 'SG/SF',
            team: 'LAL',
            number: 4,
            age: 24,
            salary: 4500000,
            stats: { ppg: 12.1, rpg: 3.4, apg: 1.8 },
            rarity: 'rookie',
            winImpact: 2,
            description: 'Sharpshooting rookie. Ready to contribute immediately.'
        },
        aj_johnson: {
            id: 'aj_johnson',
            name: 'AJ Johnson',
            firstName: 'AJ',
            lastName: 'Johnson',
            position: 'PG',
            team: 'MIL',
            number: 5,
            age: 20,
            salary: 3000000,
            stats: { ppg: 8.5, rpg: 2.5, apg: 4.2 },
            rarity: 'rookie',
            winImpact: 1,
            description: 'Young point guard with great vision and potential.'
        },
        andre_jackson: {
            id: 'andre_jackson',
            name: 'Andre Jackson Jr.',
            firstName: 'Andre',
            lastName: 'Jackson Jr.',
            position: 'SF',
            team: 'MIL',
            number: 44,
            age: 23,
            salary: 2000000,
            stats: { ppg: 5.8, rpg: 3.2, apg: 2.1 },
            rarity: 'rookie',
            winImpact: 1,
            description: 'Athletic defender with developing offensive game.'
        },
        stephon_castle: {
            id: 'stephon_castle',
            name: 'Stephon Castle',
            firstName: 'Stephon',
            lastName: 'Castle',
            position: 'PG/SG',
            team: 'SAS',
            number: 5,
            age: 20,
            salary: 8500000,
            stats: { ppg: 14.2, rpg: 3.8, apg: 4.5 },
            rarity: 'rookie',
            winImpact: 3,
            description: '2024 lottery pick. Two-way guard with star potential.'
        },
        sidy_cissoko: {
            id: 'sidy_cissoko',
            name: 'Sidy Cissoko',
            firstName: 'Sidy',
            lastName: 'Cissoko',
            position: 'SF',
            team: 'SAS',
            number: 2,
            age: 20,
            salary: 2000000,
            stats: { ppg: 5.5, rpg: 2.8, apg: 1.5 },
            rarity: 'rookie',
            winImpact: 1,
            description: 'Athletic wing. Raw but high upside project.'
        },
        zach_edey: {
            id: 'zach_edey',
            name: 'Zach Edey',
            firstName: 'Zach',
            lastName: 'Edey',
            position: 'C',
            team: 'MEM',
            number: 15,
            age: 23,
            salary: 5000000,
            stats: { ppg: 10.5, rpg: 8.2, apg: 0.8 },
            rarity: 'rookie',
            winImpact: 2,
            description: '7\'4" mountain. Dominant post presence.'
        },
        reed_sheppard: {
            id: 'reed_sheppard',
            name: 'Reed Sheppard',
            firstName: 'Reed',
            lastName: 'Sheppard',
            position: 'SG',
            team: 'HOU',
            number: 5,
            age: 20,
            salary: 7000000,
            stats: { ppg: 13.8, rpg: 3.2, apg: 4.5 },
            rarity: 'rookie',
            winImpact: 2,
            description: 'Elite shooter with great basketball IQ.'
        },

        // ==================
        // FREE AGENT TARGETS
        // ==================
        paul_george: {
            id: 'paul_george',
            name: 'Paul George',
            firstName: 'Paul',
            lastName: 'George',
            position: 'SF/SG',
            team: 'PHI',
            number: 8,
            age: 35,
            salary: 42000000,
            stats: { ppg: 22.5, rpg: 5.5, apg: 4.2 },
            rarity: 'star',
            winImpact: 4,
            description: 'Elite two-way wing. Championship experience.'
        },
        jimmy_butler: {
            id: 'jimmy_butler',
            name: 'Jimmy Butler',
            firstName: 'Jimmy',
            lastName: 'Butler',
            position: 'SF',
            team: 'MIA',
            number: 22,
            age: 36,
            salary: 46000000,
            stats: { ppg: 20.8, rpg: 5.5, apg: 5.0 },
            rarity: 'star',
            winImpact: 4,
            description: 'Playoff Jimmy. Elevates his game when it matters most.'
        },
        bradley_beal: {
            id: 'bradley_beal',
            name: 'Bradley Beal',
            firstName: 'Bradley',
            lastName: 'Beal',
            position: 'SG',
            team: 'PHX',
            number: 3,
            age: 32,
            salary: 46000000,
            stats: { ppg: 18.2, rpg: 4.4, apg: 5.0 },
            rarity: 'star',
            winImpact: 3,
            description: 'Skilled scorer. Has battled injuries recently.'
        },
        demar_derozan: {
            id: 'demar_derozan',
            name: 'DeMar DeRozan',
            firstName: 'DeMar',
            lastName: 'DeRozan',
            position: 'SF/SG',
            team: 'SAC',
            number: 10,
            age: 36,
            salary: 25000000,
            stats: { ppg: 24.0, rpg: 4.3, apg: 5.8 },
            rarity: 'star',
            winImpact: 3,
            description: 'Mid-range master. Clutch scorer and playmaker.'
        },
        chris_paul: {
            id: 'chris_paul',
            name: 'Chris Paul',
            firstName: 'Chris',
            lastName: 'Paul',
            position: 'PG',
            team: 'SAS',
            number: 3,
            age: 40,
            salary: 11000000,
            stats: { ppg: 8.5, rpg: 3.2, apg: 8.1 },
            rarity: 'role',
            winImpact: 2,
            description: 'Point God. Leadership and basketball IQ still elite.'
        }
    },

    // Helper Methods
    getPlayer(playerId) {
        return this.players[playerId] || null;
    },

    getTeam(teamId) {
        return this.teams[teamId] || null;
    },

    getPlayersByTeam(teamId) {
        return Object.values(this.players).filter(p => p.team === this.teams[teamId]?.abbr);
    },

    getPlayersByRarity(rarity) {
        return Object.values(this.players).filter(p => p.rarity === rarity);
    },

    getStarPlayers() {
        return this.getPlayersByRarity('star');
    },

    getRolePlayers() {
        return this.getPlayersByRarity('role');
    },

    getRookies() {
        return this.getPlayersByRarity('rookie');
    },

    calculateLuxuryTax(payroll) {
        if (payroll <= this.SALARY_CAP) return 0;

        const amountOver = payroll - this.SALARY_CAP;
        let tax = 0;
        let remaining = amountOver;
        let previousThreshold = 0;

        for (const bracket of this.TAX_BRACKETS) {
            const bracketSize = bracket.threshold - previousThreshold;
            const taxableInBracket = Math.min(remaining, bracketSize);

            if (taxableInBracket > 0) {
                tax += taxableInBracket * bracket.rate;
                remaining -= taxableInBracket;
            }

            if (remaining <= 0) break;
            previousThreshold = bracket.threshold;
        }

        return Math.round(tax);
    },

    formatSalary(amount) {
        if (amount >= 1000000) {
            return '$' + (amount / 1000000).toFixed(1) + 'M';
        }
        return '$' + (amount / 1000).toFixed(0) + 'K';
    },

    formatFullSalary(amount) {
        return '$' + amount.toLocaleString();
    },

    getPlayerInitials(player) {
        return player.firstName[0] + player.lastName[0];
    },

    getTeamRoster(teamId) {
        const team = this.getTeam(teamId);
        if (!team) return [];
        return team.currentRoster.map(id => this.getPlayer(id)).filter(p => p);
    }
};

// Freeze the database to prevent modifications
Object.freeze(PlayerDatabase.teams);
Object.freeze(PlayerDatabase.players);
Object.freeze(PlayerDatabase.TAX_BRACKETS);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerDatabase;
}
