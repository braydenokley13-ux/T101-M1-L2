/**
 * MLB Money Maker - Game Data
 * All 30 MLB teams, real player data, and financial metrics
 */

const MLBData = {
    // Current year for the game
    currentYear: 2025,

    // Deal parameters
    dealValue: 8.0, // $8 billion
    dealYears: 8,
    currentDealExpires: "December 2028",

    // Real financial metrics
    financialMetrics: {
        currentNationalDeal: 1.85, // $1.85B annually
        proposedNewDeal: 8.0, // $8B total over 8 years
        nbaComparison: 76, // NBA's 2023 deal: $76B/10 years
        currentPlayerShare: 48.5, // Current percentage to players
        luxuryTaxThreshold: 241, // $241M (2024)
        revenueSharePool: 120, // $120M distributed to smaller teams
        minSalary: 0.75, // $750K minimum
        smallMarketPayroll: { min: 80, max: 120 }, // $80M-$120M
        bigMarketPayroll: { min: 200, max: 290 } // $200M-$290M
    },

    // All 30 MLB Teams with real data
    teams: {
        // AL East
        yankees: {
            name: "New York Yankees",
            abbr: "NYY",
            city: "New York",
            division: "AL East",
            market: "large",
            colors: { primary: "#003087", secondary: "#FFFFFF" },
            payroll: 270,
            revenue: 680
        },
        redsox: {
            name: "Boston Red Sox",
            abbr: "BOS",
            city: "Boston",
            division: "AL East",
            market: "large",
            colors: { primary: "#BD3039", secondary: "#0C2340" },
            payroll: 235,
            revenue: 520
        },
        rays: {
            name: "Tampa Bay Rays",
            abbr: "TB",
            city: "Tampa Bay",
            division: "AL East",
            market: "small",
            colors: { primary: "#092C5C", secondary: "#8FBCE6" },
            payroll: 95,
            revenue: 280
        },
        orioles: {
            name: "Baltimore Orioles",
            abbr: "BAL",
            city: "Baltimore",
            division: "AL East",
            market: "medium",
            colors: { primary: "#DF4601", secondary: "#000000" },
            payroll: 115,
            revenue: 300
        },
        bluejays: {
            name: "Toronto Blue Jays",
            abbr: "TOR",
            city: "Toronto",
            division: "AL East",
            market: "large",
            colors: { primary: "#134A8E", secondary: "#1D2D5C" },
            payroll: 195,
            revenue: 380
        },

        // AL Central
        whitesox: {
            name: "Chicago White Sox",
            abbr: "CWS",
            city: "Chicago",
            division: "AL Central",
            market: "large",
            colors: { primary: "#27251F", secondary: "#C4CED4" },
            payroll: 145,
            revenue: 340
        },
        guardians: {
            name: "Cleveland Guardians",
            abbr: "CLE",
            city: "Cleveland",
            division: "AL Central",
            market: "small",
            colors: { primary: "#00385D", secondary: "#E50022" },
            payroll: 105,
            revenue: 290
        },
        tigers: {
            name: "Detroit Tigers",
            abbr: "DET",
            city: "Detroit",
            division: "AL Central",
            market: "medium",
            colors: { primary: "#0C2340", secondary: "#FA4616" },
            payroll: 110,
            revenue: 305
        },
        royals: {
            name: "Kansas City Royals",
            abbr: "KC",
            city: "Kansas City",
            division: "AL Central",
            market: "small",
            colors: { primary: "#004687", secondary: "#BD9B60" },
            payroll: 90,
            revenue: 265
        },
        twins: {
            name: "Minnesota Twins",
            abbr: "MIN",
            city: "Minnesota",
            division: "AL Central",
            market: "medium",
            colors: { primary: "#002B5C", secondary: "#D31145" },
            payroll: 130,
            revenue: 315
        },

        // AL West
        astros: {
            name: "Houston Astros",
            abbr: "HOU",
            city: "Houston",
            division: "AL West",
            market: "large",
            colors: { primary: "#002D62", secondary: "#EB6E1F" },
            payroll: 220,
            revenue: 450
        },
        athletics: {
            name: "Oakland Athletics",
            abbr: "OAK",
            city: "Oakland",
            division: "AL West",
            market: "small",
            colors: { primary: "#003831", secondary: "#EFB21E" },
            payroll: 60,
            revenue: 220
        },
        rangers: {
            name: "Texas Rangers",
            abbr: "TEX",
            city: "Texas",
            division: "AL West",
            market: "large",
            colors: { primary: "#003278", secondary: "#C0111F" },
            payroll: 215,
            revenue: 400
        },
        mariners: {
            name: "Seattle Mariners",
            abbr: "SEA",
            city: "Seattle",
            division: "AL West",
            market: "medium",
            colors: { primary: "#0C2C56", secondary: "#005C5C" },
            payroll: 140,
            revenue: 330
        },
        angels: {
            name: "Los Angeles Angels",
            abbr: "LAA",
            city: "Anaheim",
            division: "AL West",
            market: "large",
            colors: { primary: "#BA0021", secondary: "#003263" },
            payroll: 185,
            revenue: 390
        },

        // NL East
        mets: {
            name: "New York Mets",
            abbr: "NYM",
            city: "New York",
            division: "NL East",
            market: "large",
            colors: { primary: "#002D72", secondary: "#FF5910" },
            payroll: 290,
            revenue: 480
        },
        braves: {
            name: "Atlanta Braves",
            abbr: "ATL",
            city: "Atlanta",
            division: "NL East",
            market: "large",
            colors: { primary: "#CE1141", secondary: "#13274F" },
            payroll: 195,
            revenue: 420
        },
        nationals: {
            name: "Washington Nationals",
            abbr: "WSH",
            city: "Washington",
            division: "NL East",
            market: "medium",
            colors: { primary: "#AB0003", secondary: "#14225A" },
            payroll: 105,
            revenue: 330
        },
        phillies: {
            name: "Philadelphia Phillies",
            abbr: "PHI",
            city: "Philadelphia",
            division: "NL East",
            market: "large",
            colors: { primary: "#E81828", secondary: "#002D72" },
            payroll: 245,
            revenue: 440
        },
        marlins: {
            name: "Miami Marlins",
            abbr: "MIA",
            city: "Miami",
            division: "NL East",
            market: "medium",
            colors: { primary: "#00A3E0", secondary: "#EF3340" },
            payroll: 85,
            revenue: 260
        },

        // NL Central
        cardinals: {
            name: "St. Louis Cardinals",
            abbr: "STL",
            city: "St. Louis",
            division: "NL Central",
            market: "medium",
            colors: { primary: "#C41E3A", secondary: "#0C2340" },
            payroll: 175,
            revenue: 380
        },
        pirates: {
            name: "Pittsburgh Pirates",
            abbr: "PIT",
            city: "Pittsburgh",
            division: "NL Central",
            market: "small",
            colors: { primary: "#27251F", secondary: "#FDB827" },
            payroll: 75,
            revenue: 255
        },
        brewers: {
            name: "Milwaukee Brewers",
            abbr: "MIL",
            city: "Milwaukee",
            division: "NL Central",
            market: "small",
            colors: { primary: "#12284B", secondary: "#B6922E" },
            payroll: 115,
            revenue: 295
        },
        cubs: {
            name: "Chicago Cubs",
            abbr: "CHC",
            city: "Chicago",
            division: "NL Central",
            market: "large",
            colors: { primary: "#0E3386", secondary: "#CC3433" },
            payroll: 180,
            revenue: 510
        },
        reds: {
            name: "Cincinnati Reds",
            abbr: "CIN",
            city: "Cincinnati",
            division: "NL Central",
            market: "small",
            colors: { primary: "#C6011F", secondary: "#000000" },
            payroll: 95,
            revenue: 275
        },

        // NL West
        dodgers: {
            name: "Los Angeles Dodgers",
            abbr: "LAD",
            city: "Los Angeles",
            division: "NL West",
            market: "large",
            colors: { primary: "#005A9C", secondary: "#FFFFFF" },
            payroll: 285,
            revenue: 620
        },
        padres: {
            name: "San Diego Padres",
            abbr: "SD",
            city: "San Diego",
            division: "NL West",
            market: "medium",
            colors: { primary: "#2F241D", secondary: "#FFC425" },
            payroll: 230,
            revenue: 360
        },
        giants: {
            name: "San Francisco Giants",
            abbr: "SF",
            city: "San Francisco",
            division: "NL West",
            market: "large",
            colors: { primary: "#FD5A1E", secondary: "#27251F" },
            payroll: 165,
            revenue: 430
        },
        rockies: {
            name: "Colorado Rockies",
            abbr: "COL",
            city: "Colorado",
            division: "NL West",
            market: "medium",
            colors: { primary: "#33006F", secondary: "#C4CED4" },
            payroll: 100,
            revenue: 300
        },
        diamondbacks: {
            name: "Arizona Diamondbacks",
            abbr: "ARI",
            city: "Arizona",
            division: "NL West",
            market: "medium",
            colors: { primary: "#A71930", secondary: "#E3D4AD" },
            payroll: 120,
            revenue: 310
        }
    },

    // Real MLB Players with 2025 salaries (in millions)
    players: [
        // Superstars ($30M+)
        { name: "Shohei Ohtani", team: "dodgers", salary: 70, tier: "superstar" },
        { name: "Mike Trout", team: "angels", salary: 36, tier: "superstar" },
        { name: "Juan Soto", team: "mets", salary: 45, tier: "superstar" },
        { name: "Aaron Judge", team: "yankees", salary: 40, tier: "superstar" },
        { name: "Mookie Betts", team: "dodgers", salary: 30, tier: "superstar" },
        { name: "Freddie Freeman", team: "dodgers", salary: 27, tier: "superstar" },
        { name: "Trea Turner", team: "phillies", salary: 33, tier: "superstar" },
        { name: "Corey Seager", team: "rangers", salary: 32.5, tier: "superstar" },

        // All-Stars ($15M-$30M)
        { name: "Francisco Lindor", team: "mets", salary: 35, tier: "allstar" },
        { name: "Bryce Harper", team: "phillies", salary: 26, tier: "allstar" },
        { name: "Marcus Semien", team: "rangers", salary: 26, tier: "allstar" },
        { name: "Jose Ramirez", team: "guardians", salary: 26, tier: "allstar" },
        { name: "Ronald Acuna Jr.", team: "braves", salary: 17, tier: "allstar" },
        { name: "Julio Rodriguez", team: "mariners", salary: 21, tier: "allstar" },
        { name: "Corbin Burnes", team: "orioles", salary: 15, tier: "allstar" },
        { name: "Gerrit Cole", team: "yankees", salary: 36, tier: "allstar" },
        { name: "Max Scherzer", team: "rangers", salary: 43, tier: "allstar" },
        { name: "Jacob deGrom", team: "rangers", salary: 37, tier: "allstar" },
        { name: "Justin Verlander", team: "astros", salary: 43, tier: "allstar" },
        { name: "Zack Wheeler", team: "phillies", salary: 24, tier: "allstar" },

        // Mid-Tier ($5M-$15M)
        { name: "Kyle Tucker", team: "astros", salary: 12, tier: "midtier" },
        { name: "Bo Bichette", team: "bluejays", salary: 10, tier: "midtier" },
        { name: "Willy Adames", team: "brewers", salary: 8, tier: "midtier" },
        { name: "Pete Alonso", team: "mets", salary: 15, tier: "midtier" },
        { name: "Vladimir Guerrero Jr.", team: "bluejays", salary: 15, tier: "midtier" },
        { name: "Rafael Devers", team: "redsox", salary: 17, tier: "midtier" },
        { name: "Ozzie Albies", team: "braves", salary: 7, tier: "midtier" },
        { name: "Tyler Glasnow", team: "dodgers", salary: 12, tier: "midtier" },
        { name: "Spencer Strider", team: "braves", salary: 3, tier: "midtier" },
        { name: "Gunnar Henderson", team: "orioles", salary: 1, tier: "midtier" },

        // Minimum/Rookie (<$5M)
        { name: "Jackson Holliday", team: "orioles", salary: 0.75, tier: "minimum" },
        { name: "Evan Carter", team: "rangers", salary: 0.75, tier: "minimum" },
        { name: "Jackson Chourio", team: "brewers", salary: 0.75, tier: "minimum" },
        { name: "Wyatt Langford", team: "rangers", salary: 0.75, tier: "minimum" },
        { name: "Paul Skenes", team: "pirates", salary: 0.75, tier: "minimum" },
        { name: "Jackson Merrill", team: "padres", salary: 0.75, tier: "minimum" },
        { name: "Colton Cowser", team: "orioles", salary: 0.75, tier: "minimum" },
        { name: "Junior Caminero", team: "rays", salary: 0.75, tier: "minimum" }
    ],

    // Network partners
    networks: [
        { id: "espn", name: "ESPN", logo: "ESPN", color: "#CC0000" },
        { id: "fox", name: "FOX Sports", logo: "FOX", color: "#003087" },
        { id: "mlb-network", name: "MLB Network", logo: "MLBN", color: "#002D72" },
        { id: "apple", name: "Apple TV+", logo: "Apple", color: "#000000" },
        { id: "amazon", name: "Amazon Prime", logo: "Prime", color: "#FF9900" }
    ],

    // Stakeholder data
    stakeholders: {
        players: {
            name: "Players Union",
            representative: "Tony Clark",
            title: "MLBPA Executive Director",
            emoji: "happy",
            comments: {
                veryHappy: "This is a championship deal for the players! ⚾",
                happy: "The players are pleased with these terms.",
                neutral: "We can work with this, but we'd like more.",
                unhappy: "The players deserve better than this!",
                veryUnhappy: "This is unacceptable. We're walking away!"
            }
        },
        owners: {
            name: "Team Owners",
            representative: "Owner Coalition",
            title: "30 MLB Franchise Owners",
            emoji: "happy",
            comments: {
                veryHappy: "Excellent! This ensures franchise profitability!",
                happy: "A reasonable deal for sustainable business.",
                neutral: "Margins are tight, but it could work.",
                unhappy: "Our profit margins are too thin!",
                veryUnhappy: "We can't operate under these terms!"
            }
        },
        networks: {
            name: "Broadcast Networks",
            representative: "Network Coalition",
            title: "ESPN, FOX, Apple TV+, Amazon",
            emoji: "happy",
            comments: {
                veryHappy: "Prime content at prime times! Perfect!",
                happy: "Good package, solid viewership potential.",
                neutral: "We need better time slots for this price.",
                unhappy: "The viewership projections are concerning.",
                veryUnhappy: "We can't justify this investment!"
            }
        },
        fans: {
            name: "Baseball Fans",
            representative: "The Fans",
            title: "Millions of Baseball Supporters",
            emoji: "happy",
            comments: {
                veryHappy: "Best. Season. Ever! Go baseball! 🎉",
                happy: "Excited for competitive baseball!",
                neutral: "Hope we can actually watch the games...",
                unhappy: "Same teams winning, games too late!",
                veryUnhappy: "Baseball is losing us as fans!"
            }
        }
    },

    // Game start time options
    startTimes: [
        { value: 0, time: "6:00 PM", label: "Early Evening", impact: "Great for families, less prime TV" },
        { value: 1, time: "7:00 PM", label: "Prime Time Start", impact: "Good balance for most viewers" },
        { value: 2, time: "7:30 PM", label: "Traditional", impact: "Classic baseball time slot" },
        { value: 3, time: "8:00 PM", label: "Late Prime", impact: "Better for West Coast, worse for East" },
        { value: 4, time: "9:00 PM+", label: "Late Night", impact: "Streaming-focused, loses East Coast" }
    ],

    // Mini-game team categorization
    teamsByMarket: {
        small: ["rays", "athletics", "royals", "guardians", "pirates", "reds", "brewers", "marlins"],
        medium: ["orioles", "tigers", "twins", "mariners", "nationals", "cardinals", "rockies", "diamondbacks", "padres"],
        large: ["yankees", "redsox", "bluejays", "whitesox", "astros", "rangers", "angels", "mets", "braves", "phillies", "cubs", "dodgers", "giants"]
    },

    // Tier thresholds
    tiers: {
        gold: { min: 90, label: "GOLD", message: "CHAMPIONSHIP DEAL! You've balanced every stakeholder perfectly. The league is thriving!" },
        silver: { min: 80, label: "SILVER", message: "SOLID DEAL! The league accepted your proposal. One group had to compromise." },
        bronze: { min: 70, label: "BRONZE", message: "ACCEPTABLE DEAL! The league signed your proposal, but some are unhappy." },
        fail: { min: 0, label: "FAILED", message: "DEAL COLLAPSED! Try again." }
    }
};

// Helper function to get teams by market size
function getTeamsByMarket(marketSize) {
    return MLBData.teamsByMarket[marketSize].map(key => ({
        key: key,
        ...MLBData.teams[key]
    }));
}

// Helper function to get random players for mini-game
function getRandomPlayers(count = 8) {
    const shuffled = [...MLBData.players].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// Helper function to get team by key
function getTeam(teamKey) {
    return MLBData.teams[teamKey];
}

// Export for module systems (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MLBData, getTeamsByMarket, getRandomPlayers, getTeam };
}
