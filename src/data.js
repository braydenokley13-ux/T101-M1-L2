/**
 * BOW Sports Capital — Track 101 · Module 1 · Lesson 2
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
  // Metrics are 0–100. The Luxury Tax Line sits at Cap Space (cash) = 40.
  var TEAMS = [
    {
      id: 'lakers',
      name: 'Los Angeles Lakers',
      abbr: 'LAL',
      tagline: 'Win-Now Giants',
      // cornerstone = the franchise face you would never trade (distinct from
      // the tradeable `players.star` used to flavor the trade cards).
      cornerstone: 'LeBron James',
      identity: 'A glamour market that spends like one — already pressed against the tax line.',
      blurb: 'Big stars, bigger bills. You are already pressed right up against the luxury-tax line.',
      colors: { primary: '#552583', secondary: '#FDB927' },
      metrics: { cash: 45, wins: 70, chemistry: 55, clout: 85 },
      players: { star: 'Paul George', depth: 'Marcus Smart', vet: 'D’Angelo Russell' }
    },
    {
      id: 'bucks',
      name: 'Milwaukee Bucks',
      abbr: 'MIL',
      tagline: 'Small-Market MVP',
      cornerstone: 'Giannis Antetokounmpo',
      identity: 'A small market that drafted an MVP — and pays the tax every year to keep him.',
      blurb: 'You drafted a superstar in a small market. Now the only way to keep the window open is to spend — and the tax bill never stops climbing.',
      colors: { primary: '#00471B', secondary: '#EEE1C6' },
      metrics: { cash: 55, wins: 72, chemistry: 60, clout: 68 },
      players: { star: 'DeMar DeRozan', depth: 'Bruce Brown', vet: 'Khris Middleton' }
    },
    {
      id: 'spurs',
      name: 'San Antonio Spurs',
      abbr: 'SAS',
      tagline: 'Young Risers',
      cornerstone: 'Victor Wembanyama',
      identity: 'A young team loaded with cap space and a generational rookie to build around.',
      blurb: 'A young team loaded with cap space. You can make the biggest swing in the league — if you dare.',
      colors: { primary: '#9aa7b0', secondary: '#1d1d1d' },
      metrics: { cash: 85, wins: 50, chemistry: 66, clout: 58 },
      players: { star: 'Zach LaVine', depth: 'Chris Paul', vet: 'Keldon Johnson' }
    }
  ];

  // ---- Per-team storylines (bespoke flavor on the shared engine) ----------
  // Milwaukee gets its own small-market storyline — the textbook luxury-tax
  // case. Lakers/Spurs carry lighter identity touches; any field can be
  // omitted and the generic, metric-driven copy is used instead.
  var TEAM_STORY = {
    bucks: {
      // Intel desk overrides
      capsheet: 'In a small market you can\'t outspend Los Angeles or New York — so every dollar over the tax line has to be worth it. Milwaukee doesn\'t get do-overs.',
      locker: 'Everything in Milwaukee runs through Giannis Antetokounmpo — drafted here, developed here, an MVP here. Keep the right pieces around him or risk the one thing this franchise can\'t survive: losing him.',
      stands: 'Cream City shows up loud. But a small market needs deep playoff runs to justify a tax bill — fans want a real contender, not just a big payroll.',
      analyst: 'Milwaukee is the textbook case: a small-market team that drafted an MVP and now pays the luxury tax just to stay a contender. There is no big-market bailout coming — you win by spending smart, not by spending the most.',
      // Round 1 reveal dek overrides, keyed by trade id
      reveal: {
        star: 'In a small market, chasing another star means doubling down on the tax bill. Milwaukee is betting that one more name keeps the title window — and Giannis — right where they want it.',
        future: 'A dangerous bet in a small market: trade away the present and you have to sell an in-his-prime MVP on patience.',
        standpat: 'Milwaukee held the line. In a small market that can be discipline — or it can be the sound of a window quietly closing.'
      }
    }
  };

  // ---- Decision Desk · Round 1 templates ---------------------------------
  // {star}/{depth}/{vet} placeholders are filled with each team's players.
  // deltas are applied to the team's current metrics (clamped 0–100).
  var TRADE_TEMPLATES = [
    {
      id: 'star',
      label: 'Land the Superstar',
      risk: 'High',
      blurb: 'Trade the future for a franchise name. Wins and Buzz spike — but the salary blows past the tax line.',
      give: 'Two young players + a future first-round pick',
      get: 'Superstar: {star}',
      cost: 'A massive contract. This almost certainly pushes you over the luxury-tax line.',
      deltas: { wins: 18, clout: 16, cash: -28, chemistry: -10 }
    },
    {
      id: 'depth',
      label: 'Add Real Depth',
      risk: 'Low',
      blurb: 'Bring in a steady, fair-priced starter. Better Chemistry and a few more Wins, small cost.',
      give: 'One bench player + a little cash',
      get: 'Steady starter: {depth}',
      cost: 'A fair contract that keeps your books healthy.',
      deltas: { wins: 8, chemistry: 14, clout: 4, cash: -10 }
    },
    {
      id: 'future',
      label: 'Cash In for the Future',
      risk: 'Medium',
      blurb: 'Trade an expensive veteran for picks and cap relief. More room now, fewer Wins today.',
      give: 'Veteran: {vet}',
      get: 'Future first-round picks + cap space',
      cost: 'Clears salary and pulls you safely back under the tax line.',
      deltas: { cash: 22, chemistry: 5, wins: -7, clout: -9 }
    },
    {
      id: 'standpat',
      label: 'Stand Pat',
      risk: 'Low',
      blurb: 'Make no trade. Keep the group together and trust it. Safe — but fans wanted fireworks.',
      give: 'Nothing',
      get: 'Your roster stays exactly the same',
      cost: 'No new salary. Your books hold steady.',
      deltas: { chemistry: 7, cash: 4, wins: 0, clout: -7 }
    }
  ];

  // ---- Pressure Moments (ownership steps in) -----------------------------
  // priority = the metric ownership now cares about most (weighted x2 in scoring).
  // effect   = a small immediate metric change representing the event.
  var PRESSURE_MOMENTS = [
    {
      id: 'playoffs',
      title: 'The Owner Wants a Banner',
      priority: 'wins',
      quote: 'I didn’t buy this team to make the second round. We win. This. Year.',
      who: 'Team Owner',
      text: 'Ownership just made the goal crystal clear. Wins matter most now.',
      effect: {}
    },
    {
      id: 'tax_crunch',
      title: 'Luxury-Tax Warning',
      priority: 'cash',
      quote: 'Every dollar over the line costs us three. Do not bury this franchise.',
      who: 'Team President',
      text: 'The money side is sounding the alarm on the tax bill. Cap Space matters most now.',
      effect: { cash: -5 }
    },
    {
      id: 'star_help',
      title: 'Your Star Wants Help',
      priority: 'wins',
      quote: 'Get me somebody. I can’t carry this alone in May.',
      who: 'Franchise Player',
      text: 'Your best player went public asking for reinforcements. The room feels unsettled.',
      effect: { chemistry: -6 }
    },
    {
      id: 'fans_restless',
      title: 'The Fans Are Turning',
      priority: 'clout',
      quote: 'Do something! We didn’t renew season tickets to watch you stand still.',
      who: 'The Arena',
      text: 'Fans packed the building chanting for a move. They want a statement. Buzz matters most now.',
      effect: { clout: -5 }
    },
    {
      id: 'injury',
      title: 'A Rotation Player Goes Down',
      priority: 'wins',
      quote: 'X-rays are negative, but he’s out several weeks. You’re thin now.',
      who: 'Head Athletic Trainer',
      text: 'A key role player just got hurt. Your on-court strength took a hit.',
      effect: { wins: -6 }
    }
  ];

  // ---- Decision Desk · Round 2 (the closing move) ------------------------
  // Three context-aware moves the student picks after the pressure moment.
  var ROUND2_MOVES = [
    {
      id: 'reinforce',
      label: 'Push Your Chips In',
      risk: 'High',
      blurb: 'Use your last move to chase impact — sign a buyout veteran who can play right now.',
      cost: 'More salary on the books. You go deeper under pressure on Cap Space.',
      deltas: { wins: 9, clout: 6, cash: -14, chemistry: -4 }
    },
    {
      id: 'balance',
      label: 'Protect the Budget',
      risk: 'Low',
      blurb: 'Make a small salary-dump deal. Clear money, get safely back under the tax line.',
      cost: 'You give up a little on-court strength to fix the books.',
      deltas: { cash: 18, wins: -5, clout: -3, chemistry: 2 }
    },
    {
      id: 'steady',
      label: 'Trust the Room',
      risk: 'Low',
      blurb: 'No more moves. Let the group gel and build continuity into the playoffs.',
      cost: 'No new salary. Stability now, but no extra firepower.',
      deltas: { chemistry: 9, clout: 2, cash: 3, wins: 1 }
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
        label: t.label,
        risk: t.risk,
        blurb: t.blurb,
        give: fill(t.give),
        get: fill(t.get),
        cost: t.cost,
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

  function getPressure(id) {
    for (var i = 0; i < PRESSURE_MOMENTS.length; i++) {
      if (PRESSURE_MOMENTS[i].id === id) return PRESSURE_MOMENTS[i];
    }
    return null;
  }

  function getRound2(id) {
    for (var i = 0; i < ROUND2_MOVES.length; i++) {
      if (ROUND2_MOVES[i].id === id) return ROUND2_MOVES[i];
    }
    return null;
  }

  // Bespoke storyline for a team (or an empty object so callers can always
  // read fields safely and fall back to the generic, metric-driven copy).
  function getStory(id) { return TEAM_STORY[id] || {}; }

  return {
    TEAMS: TEAMS,
    TRADE_TEMPLATES: TRADE_TEMPLATES,
    PRESSURE_MOMENTS: PRESSURE_MOMENTS,
    ROUND2_MOVES: ROUND2_MOVES,
    TEAM_STORY: TEAM_STORY,
    tradesForTeam: tradesForTeam,
    getTeam: getTeam,
    getPressure: getPressure,
    getRound2: getRound2,
    getStory: getStory
  };
});
