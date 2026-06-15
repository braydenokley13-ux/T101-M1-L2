/**
 * Bow Sports Capital — Track 101 · Module 1 · Lesson 2
 * "Trade Deadline War Room"
 *
 * data.js — All game content, inlined as a plain object (NO network/fetch).
 * Inlining keeps the simulation working offline and even when index.html is
 * opened directly from a file (file://), which is common in classrooms.
 *
 * Exposes window.BSCData in the browser and module.exports in Node.
 */
(function (root, factory) {
  'use strict';
  var data = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  if (typeof window !== 'undefined') window.BSCData = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ---- Teams (the student's "role setup") --------------------------------
  // Metrics are 0–100. The Luxury Tax Line sits at Cash = 40.
  var TEAMS = [
    {
      id: 'lakers',
      name: 'Los Angeles Lakers',
      abbr: 'LAL',
      emoji: '🟣',
      tagline: 'Win-Now Giants',
      blurb: 'A famous team with big stars and big bills. You are already close to the Luxury Tax Line.',
      colors: { primary: '#552583', secondary: '#FDB927' },
      metrics: { cash: 45, wins: 70, chemistry: 55, clout: 85 },
      // Player names used to flavor the trade cards.
      players: { star: 'Paul George', depth: 'Marcus Smart', vet: 'D’Angelo Russell' }
    },
    {
      id: 'bucks',
      name: 'Milwaukee Bucks',
      abbr: 'MIL',
      emoji: '🟢',
      tagline: 'Contender Core',
      blurb: 'A strong team built around a superstar. You have a little room to spend — but not a lot.',
      colors: { primary: '#00471B', secondary: '#EEE1C6' },
      metrics: { cash: 55, wins: 72, chemistry: 60, clout: 68 },
      players: { star: 'DeMar DeRozan', depth: 'Bruce Brown', vet: 'Khris Middleton' }
    },
    {
      id: 'spurs',
      name: 'San Antonio Spurs',
      abbr: 'SAS',
      emoji: '⚪',
      tagline: 'Young Risers',
      blurb: 'A young team with lots of Cash to spend. You can make a big move — if you want to.',
      colors: { primary: '#9aa7b0', secondary: '#1d1d1d' },
      metrics: { cash: 85, wins: 50, chemistry: 66, clout: 58 },
      players: { star: 'Zach LaVine', depth: 'Chris Paul', vet: 'Keldon Johnson' }
    }
  ];

  // ---- Trade Board templates ---------------------------------------------
  // {team} placeholders are filled with each team's player names.
  // deltas are applied to the team's current metrics (clamped 0–100).
  var TRADE_TEMPLATES = [
    {
      id: 'star',
      icon: '⭐',
      label: 'Big Star Trade',
      risk: 'High',
      summary: 'Trade for a superstar. More Wins and Clout — but it costs a lot of Cash.',
      give: 'Two young players + a future draft pick',
      get: 'Superstar: {star}',
      costNote: 'Big salary — this can push you over the Luxury Tax Line.',
      deltas: { wins: 18, clout: 16, cash: -28, chemistry: -10 }
    },
    {
      id: 'depth',
      icon: '🧩',
      label: 'Depth Trade',
      risk: 'Low',
      summary: 'Add solid role players. Better Chemistry and a few more Wins, with a small cost.',
      give: 'One bench player + a little cash',
      get: 'Steady starter: {depth}',
      costNote: 'A fair salary that keeps your budget healthy.',
      deltas: { wins: 8, chemistry: 14, clout: 4, cash: -10 }
    },
    {
      id: 'future',
      icon: '🔮',
      label: 'Future Pick Trade',
      risk: 'Medium',
      summary: 'Trade a pricey veteran for draft picks and cap relief. More Cash now, fewer Wins.',
      give: 'Veteran: {vet}',
      get: 'Future draft picks + cap space',
      costNote: 'Saves money and pulls you back under the Luxury Tax Line.',
      deltas: { cash: 22, chemistry: 5, wins: -7, clout: -9 }
    },
    {
      id: 'standpat',
      icon: '🛡️',
      label: 'Stand Pat (No Trade)',
      risk: 'Low',
      summary: 'Make no trade. Keep your team together. Safe — but fans may get impatient.',
      give: 'Nothing',
      get: 'Your team stays exactly the same',
      costNote: 'No new salary. Your budget stays steady.',
      deltas: { chemistry: 7, cash: 4, wins: 0, clout: -7 }
    }
  ];

  // ---- Pressure Moments (the scenario twist) -----------------------------
  // priority = the metric ownership now cares about most (weighted in scoring).
  // effect   = an immediate metric change representing the event.
  var PRESSURE_MOMENTS = [
    {
      id: 'playoffs',
      icon: '📣',
      title: 'The Owner Wants the Playoffs!',
      text: 'Your owner walks in: “We need to WIN this year.” Wins matter most now.',
      priority: 'wins',
      effect: {}
    },
    {
      id: 'tax_crunch',
      icon: '💸',
      title: 'Luxury Tax Warning!',
      text: 'The money team is worried about the luxury tax bill. Spending too much will cost extra. Cash matters most now.',
      priority: 'cash',
      effect: { cash: -5 }
    },
    {
      id: 'star_help',
      icon: '🗣️',
      title: 'Your Star Wants Help',
      text: 'Your best player says, “Get me some backup!” The team feels unsettled, so Chemistry dips a little.',
      priority: 'wins',
      effect: { chemistry: -6 }
    },
    {
      id: 'fans_restless',
      icon: '🎟️',
      title: 'Fans Are Restless',
      text: 'Fans pack the arena chanting for a big move. They want excitement — Clout matters most now.',
      priority: 'clout',
      effect: { clout: -5 }
    },
    {
      id: 'injury',
      icon: '🤕',
      title: 'A Key Player Gets Hurt',
      text: 'Ouch! A key role player is injured for a while. Your team lost a little strength.',
      priority: 'wins',
      effect: { wins: -6 }
    }
  ];

  // Build the 4 trade offers for a specific team (fills in player names).
  function tradesForTeam(team) {
    if (!team || !team.players) team = { players: {} };
    return TRADE_TEMPLATES.map(function (t) {
      function fill(s) {
        return String(s)
          .replace('{star}', team.players.star || 'a star player')
          .replace('{depth}', team.players.depth || 'a solid starter')
          .replace('{vet}', team.players.vet || 'a veteran');
      }
      return {
        id: t.id,
        icon: t.icon,
        label: t.label,
        risk: t.risk,
        summary: t.summary,
        give: fill(t.give),
        get: fill(t.get),
        costNote: t.costNote,
        deltas: Object.assign({}, t.deltas)
      };
    });
  }

  function getTeam(id) {
    for (var i = 0; i < TEAMS.length; i++) {
      if (TEAMS[i].id === id) return TEAMS[i];
    }
    return null;
  }

  return {
    TEAMS: TEAMS,
    TRADE_TEMPLATES: TRADE_TEMPLATES,
    PRESSURE_MOMENTS: PRESSURE_MOMENTS,
    tradesForTeam: tradesForTeam,
    getTeam: getTeam
  };
});
