/**
 * BOW Sports Capital — Track 101 · Module 1 · Lesson 2
 * "Trade Deadline War Room"
 *
 * simulation.js — Pure game logic (no DOM).
 * Core topic: NBA salary cap & luxury tax. Students run a team's front office
 * at the trade deadline, balancing Cap Space, Wins, Chemistry, and Buzz across
 * two decision rounds split by a pressure moment from ownership.
 *
 * This file works in the browser (window.BSCSim) AND in Node (module.exports)
 * so the logic can be unit-tested with `node tests/simulation.test.js`.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.BSCSim = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // The four metrics students manage. Each is a 0–100 score shown as a bar.
  var METRIC_KEYS = ['cash', 'wins', 'chemistry', 'clout'];

  // "cash" is really room under the tax line, so it reads as "Cap Space";
  // "clout" is fan/media/sponsor hype, so it reads as "Buzz".
  var METRIC_LABELS = {
    cash: 'Cap Space',
    wins: 'Wins',
    chemistry: 'Chemistry',
    clout: 'Buzz'
  };

  // Plain-language one-liners explaining each metric.
  var METRIC_HELP = {
    cash: 'Room under the luxury-tax line. Drop below 40 and you pay a penalty.',
    wins: 'How strong your team is on the court right now.',
    chemistry: 'How well your players fit together.',
    clout: 'How hyped fans, media and sponsors are.'
  };

  // On the 0–100 Cap Space scale, this is the "Luxury Tax Line".
  // Below it, the team is paying the luxury-tax penalty.
  var TAX_LINE = 40;

  function clamp(n, min, max) {
    n = Number(n);
    if (!isFinite(n)) n = min;
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  // Always return a complete, valid {cash,wins,chemistry,clout} object.
  function clampMetrics(m) {
    var out = {};
    var src = (m && typeof m === 'object') ? m : {};
    for (var i = 0; i < METRIC_KEYS.length; i++) {
      out[METRIC_KEYS[i]] = clamp(src[METRIC_KEYS[i]], 0, 100);
    }
    return out;
  }

  // Add a set of +/- deltas to a base metric set (clamped 0–100).
  function applyDeltas(base, deltas) {
    var out = clampMetrics(base);
    if (deltas && typeof deltas === 'object') {
      for (var i = 0; i < METRIC_KEYS.length; i++) {
        var k = METRIC_KEYS[i];
        if (typeof deltas[k] === 'number' && isFinite(deltas[k])) {
          out[k] = clamp(out[k] + deltas[k], 0, 100);
        }
      }
    }
    return out;
  }

  /**
   * Legacy projection: apply the pressure effect, then the trade. Kept for
   * back-compat with earlier callers/tests. The two-round flow uses the
   * ordered snapshots below instead.
   */
  function projectMetrics(baseMetrics, pressure, trade) {
    var m = clampMetrics(baseMetrics);
    if (pressure && pressure.effect) m = applyDeltas(m, pressure.effect);
    if (trade && trade.deltas) m = applyDeltas(m, trade.deltas);
    return m;
  }

  /**
   * Deterministic snapshot chain for the two-round simulation. No randomness:
   *   start -> after Round 1 trade -> after pressure -> after Round 2 move.
   * Any argument may be missing; every step clamps to 0–100.
   */
  function projectChain(baseMetrics, trade, pressure, round2) {
    var start = clampMetrics(baseMetrics);
    var afterTrade = applyDeltas(start, trade && trade.deltas);
    var afterPressure = applyDeltas(afterTrade, pressure && pressure.effect);
    var afterRound2 = applyDeltas(afterPressure, round2 && round2.deltas);
    return { start: start, afterTrade: afterTrade, afterPressure: afterPressure, final: afterRound2 };
  }

  function isInLuxuryTax(metrics) {
    return clampMetrics(metrics).cash < TAX_LINE;
  }

  // Find the strongest / weakest metric (stable order on ties).
  function pickMetric(metrics, wantMax) {
    var m = clampMetrics(metrics);
    var best = METRIC_KEYS[0];
    for (var i = 1; i < METRIC_KEYS.length; i++) {
      var k = METRIC_KEYS[i];
      if (wantMax ? m[k] > m[best] : m[k] < m[best]) best = k;
    }
    return best;
  }
  function strongestMetric(m) { return pickMetric(m, true); }
  function weakestMetric(m) { return pickMetric(m, false); }

  // A student's strategy type comes from the Round 1 trade they lock in.
  function strategyTypeFor(tradeId) {
    switch (tradeId) {
      case 'star': return 'Star Chaser';
      case 'depth': return 'Balanced Builder';
      case 'future': return 'Future Planner';
      case 'standpat': return 'Safe Operator';
      default: return 'Front Office Strategist';
    }
  }
  // Editorial display name used on the front page.
  function strategyNameFor(tradeId) {
    switch (tradeId) {
      case 'star': return 'The Star Chaser';
      case 'depth': return 'The Balanced Builder';
      case 'future': return 'The Future Planner';
      case 'standpat': return 'The Safe Operator';
      default: return 'The Front Office Strategist';
    }
  }

  /**
   * Front Office Score (0–100). Average of the four metrics, with the metric
   * ownership cares about most (the Pressure Moment's priority) counted twice.
   * Paying the luxury tax naturally lowers Cap Space and the score — but a big
   * winning team earns a small "it was worth it" bonus.
   */
  function computeScore(metrics, priorityMetric) {
    var m = clampMetrics(metrics);
    var total = 0, weight = 0;
    for (var i = 0; i < METRIC_KEYS.length; i++) {
      var k = METRIC_KEYS[i];
      var w = (k === priorityMetric) ? 2 : 1;
      total += m[k] * w;
      weight += w;
    }
    var score = total / weight;
    if (isInLuxuryTax(m) && m.wins >= 75) score += 5; // big wins can justify the tax
    return clamp(score, 0, 100);
  }

  // Encouraging badge — never shames the student.
  function badgeFor(score) {
    if (score >= 85) return { label: 'Front Office All-Star', tier: 3, stars: 3 };
    if (score >= 70) return { label: 'Sharp Executive', tier: 2, stars: 2 };
    if (score >= 55) return { label: 'Solid GM', tier: 1, stars: 1 };
    return { label: 'Bold Gambler', tier: 0, stars: 0 };
  }

  /**
   * Luxury-tax consequence note, keyed by whether the team crossed the line.
   * Four branches: crossed over / pulled back under / still over / stayed under.
   */
  function taxNote(start, after) {
    var s = clampMetrics(start), a = clampMetrics(after);
    var wasOver = s.cash < TAX_LINE, isOver = a.cash < TAX_LINE;
    if (!wasOver && isOver) {
      return { tone: 'negative', label: 'Luxury Tax', text: 'You just crossed the luxury-tax line. From here, every extra dollar costs you roughly triple.' };
    }
    if (wasOver && !isOver) {
      return { tone: 'positive', label: 'Cap Relief', text: 'You pulled back under the luxury-tax line. No penalty — clean books heading into the stretch.' };
    }
    if (isOver) {
      return { tone: 'negative', label: 'Luxury Tax', text: 'Still over the line. The tax meter is running on every move you make.' };
    }
    return { tone: 'positive', label: 'Under the Line', text: 'You stayed under the luxury-tax line. No penalty — smart cap management.' };
  }

  /**
   * Generate the final newspaper headline + dek from the final metrics.
   * Tiers, in order: pay-past-the-line big win / built-for-now / expensive
   * middle / powder-dry / pick-their-lane.
   */
  function frontpageHeadline(finalMetrics, nick) {
    var f = clampMetrics(finalMetrics);
    nick = nick || 'YOUR TEAM';
    var over = f.cash < TAX_LINE;
    var bigWins = f.wins >= 75;
    if (bigWins && over) {
      return { tier: 'bet-the-bank', head: nick + ' BET THE BANK',
        dek: 'You spent past the luxury-tax line to chase a banner. Expensive, risky — and terrifying for everyone else if it hits.' };
    }
    if (bigWins) {
      return { tier: 'built-for-now', head: nick + ' ARE BUILT FOR NOW',
        dek: 'A loaded roster and a clean cap sheet. This is the version of contention every owner dreams about.' };
    }
    if (over && f.wins < 62) {
      return { tier: 'expensive-middle', head: nick + ' PAY A FORTUNE FOR THE MIDDLE',
        dek: 'The bill came due without the wins to match. The hardest place in sports is expensive and ordinary.' };
    }
    if (f.cash >= 70) {
      return { tier: 'powder-dry', head: nick + ' KEEP THEIR POWDER DRY',
        dek: 'You guarded the books and the future. The patience play — now you have to make it pay off.' };
    }
    return { tier: 'pick-their-lane', head: nick + ' PICK THEIR LANE',
      dek: 'No panic, no fireworks — a steady deadline that kept your team whole and your books honest.' };
  }

  // One positive sentence about the result — focused on tradeoffs, not "wrong".
  function explainResult(strategyType, strongest, weakest, metrics) {
    var phrases = {
      'Star Chaser': 'You chased star power and made your team exciting.',
      'Balanced Builder': 'You built a balanced team that fits together well.',
      'Future Planner': 'You protected your budget and planned for the future.',
      'Safe Operator': 'You kept your team steady and avoided big risks.',
      'Front Office Strategist': 'You made a thoughtful front office move.'
    };
    var lead = phrases[strategyType] || phrases['Front Office Strategist'];
    return lead + ' Your team is strongest in ' + METRIC_LABELS[strongest] +
      ', and there’s still room to grow your ' + METRIC_LABELS[weakest] + '.';
  }

  // Did the team answer the owner's pressure? Always framed as a fair tradeoff.
  function pressureNoteFor(pressure, metrics) {
    if (!pressure || !pressure.priority) {
      return 'You ran a calm, steady trade deadline.';
    }
    var m = clampMetrics(metrics);
    var label = METRIC_LABELS[pressure.priority] || 'your goal';
    if (m[pressure.priority] >= 60) {
      return 'Ownership wanted more ' + label + ' — and you delivered. Nice read of the room.';
    }
    return 'Ownership pushed for more ' + label + '. You chose a different path — a fair tradeoff you can defend.';
  }

  // Luxury-tax teaching note tied to the Cap Space result.
  function budgetNoteFor(metrics) {
    var m = clampMetrics(metrics);
    if (!isInLuxuryTax(m)) {
      return { status: 'safe', text: 'You stayed above the Luxury Tax Line — no penalty. Smart cap management!' };
    }
    if (m.wins >= 75) {
      return { status: 'tax-worth-it', text: 'You crossed the Luxury Tax Line and paid a penalty — but you bought real Wins. Sometimes that’s worth it.' };
    }
    return { status: 'tax', text: 'You crossed the Luxury Tax Line, so your team pays a penalty. Every move has a cost!' };
  }

  /**
   * Build the full Performance Report from a completed game state.
   * opts: { teamName, trade {id,...}, baseMetrics, pressure, round2 }
   * Never throws, even with partial/empty input.
   */
  function buildReport(opts) {
    opts = opts || {};
    var trade = opts.trade || {};
    var pressure = opts.pressure || null;
    var round2 = opts.round2 || null;
    var finalMetrics = opts.metrics ||
      projectChain(opts.baseMetrics, trade, pressure, round2).final;
    var priority = pressure && pressure.priority;

    var strongest = strongestMetric(finalMetrics);
    var weakest = weakestMetric(finalMetrics);
    var score = computeScore(finalMetrics, priority);
    var badge = badgeFor(score);
    var strategyType = strategyTypeFor(trade.id);

    return {
      strategyType: strategyType,
      strategyName: strategyNameFor(trade.id),
      tradeId: trade.id || null,
      tradeLabel: trade.label || 'No move',
      round2Id: round2 && round2.id || null,
      metrics: finalMetrics,
      strongest: strongest,
      strongestLabel: METRIC_LABELS[strongest],
      weakest: weakest,
      weakestLabel: METRIC_LABELS[weakest],
      score: score,
      badge: badge,
      explanation: explainResult(strategyType, strongest, weakest, finalMetrics),
      pressureNote: pressureNoteFor(pressure, finalMetrics),
      budget: budgetNoteFor(finalMetrics),
      tax: taxNote(opts.baseMetrics || finalMetrics, finalMetrics),
      inLuxuryTax: isInLuxuryTax(finalMetrics)
    };
  }

  // Defend-your-move memo never crashes on blank input — provide a safe default.
  function safeMemo(text) {
    var clean = (typeof text === 'string') ? text.trim() : '';
    if (clean.length === 0) {
      return {
        provided: false,
        text: 'This GM let their moves do the talking — and trusted the plan.'
      };
    }
    // Guard against absurdly long input from a student mashing keys.
    if (clean.length > 600) clean = clean.slice(0, 600) + '…';
    return { provided: true, text: clean };
  }

  // Small formatting helpers shared by the view layer.
  function signed(n) { n = Number(n) || 0; return n > 0 ? '+' + n : String(n); }

  /**
   * Assemble the Highway-World-compatible completion object. Lightweight and
   * local — this is NOT a shared platform, just a future-friendly shape.
   */
  function buildCompletionResult(state) {
    state = state || {};
    var report = state.report || buildReport(state);
    var memo = safeMemo(state.memo);
    return {
      simulationId: 'bsc-t101-m1-l2-trade-deadline',
      track: '101',
      module: 'Module 1',
      lesson: 'Lesson 2',
      missionTitle: 'Trade Deadline War Room',
      studentRole: 'General Manager',
      teamId: state.teamId || null,
      teamName: state.teamName || null,
      gmName: (typeof state.gmName === 'string' && state.gmName.trim()) ? state.gmName.trim().slice(0, 40) : 'GM',
      metrics: clampMetrics(report.metrics),
      selectedStrategy: report.tradeId,
      strategyType: report.strategyType,
      closingMove: report.round2Id,
      pressureMoment: state.pressure ? { id: state.pressure.id, priority: state.pressure.priority } : null,
      performanceReport: report,
      boardroomMemo: memo.text,
      completionResult: {
        score: report.score,
        badge: report.badge,
        completedAt: (typeof state.completedAt === 'number') ? state.completedAt : Date.now()
      },
      highwayWorldLocation: 'front-office'
    };
  }

  return {
    METRIC_KEYS: METRIC_KEYS,
    METRIC_LABELS: METRIC_LABELS,
    METRIC_HELP: METRIC_HELP,
    TAX_LINE: TAX_LINE,
    clamp: clamp,
    clampMetrics: clampMetrics,
    applyDeltas: applyDeltas,
    projectMetrics: projectMetrics,
    projectChain: projectChain,
    isInLuxuryTax: isInLuxuryTax,
    pickMetric: pickMetric,
    strongestMetric: strongestMetric,
    weakestMetric: weakestMetric,
    strategyTypeFor: strategyTypeFor,
    strategyNameFor: strategyNameFor,
    computeScore: computeScore,
    badgeFor: badgeFor,
    taxNote: taxNote,
    frontpageHeadline: frontpageHeadline,
    buildReport: buildReport,
    safeMemo: safeMemo,
    signed: signed,
    buildCompletionResult: buildCompletionResult
  };
});
