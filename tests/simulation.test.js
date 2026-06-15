/**
 * Lightweight unit tests for the Trade Deadline War Room logic.
 * No framework — runs with plain Node:  node tests/simulation.test.js
 *
 * Covers the math and edge cases that keep the classroom build from breaking.
 */
'use strict';

var assert = require('assert');
var Sim = require('../src/simulation.js');
var Data = require('../src/data.js');

var passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✓ ' + name);
  } catch (e) {
    console.error('  ✗ ' + name);
    console.error('    ' + (e && e.message));
    process.exitCode = 1;
  }
}

console.log('Trade Deadline War Room — logic tests\n');

// ---- clamp & metrics ----------------------------------------------------
test('clamp keeps values inside 0–100', function () {
  assert.strictEqual(Sim.clamp(150, 0, 100), 100);
  assert.strictEqual(Sim.clamp(-20, 0, 100), 0);
  assert.strictEqual(Sim.clamp(42.6, 0, 100), 43);
});

test('clampMetrics always returns all four keys, even from junk', function () {
  var m = Sim.clampMetrics(null);
  assert.deepStrictEqual(Object.keys(m).sort(), ['cash', 'chemistry', 'clout', 'wins']);
  assert.strictEqual(m.cash, 0);
  var m2 = Sim.clampMetrics({ cash: 'abc', wins: 999 });
  assert.strictEqual(m2.cash, 0);
  assert.strictEqual(m2.wins, 100);
});

test('applyDeltas adds and clamps; ignores missing/invalid keys', function () {
  var out = Sim.applyDeltas({ cash: 50, wins: 50, chemistry: 50, clout: 50 },
    { cash: -80, wins: 80, chemistry: undefined, clout: NaN });
  assert.strictEqual(out.cash, 0);
  assert.strictEqual(out.wins, 100);
  assert.strictEqual(out.chemistry, 50);
  assert.strictEqual(out.clout, 50);
});

// ---- projection ---------------------------------------------------------
test('projectMetrics applies pressure then trade', function () {
  var base = { cash: 50, wins: 50, chemistry: 50, clout: 50 };
  var pressure = { effect: { cash: -5 } };
  var trade = { deltas: { cash: -10, wins: 18 } };
  var out = Sim.projectMetrics(base, pressure, trade);
  assert.strictEqual(out.cash, 35); // 50 - 5 - 10
  assert.strictEqual(out.wins, 68);
});

test('projectMetrics tolerates missing pressure and trade', function () {
  var base = { cash: 50, wins: 50, chemistry: 50, clout: 50 };
  var out = Sim.projectMetrics(base, null, null);
  assert.deepStrictEqual(out, base);
});

// ---- luxury tax ---------------------------------------------------------
test('isInLuxuryTax respects the tax line', function () {
  assert.strictEqual(Sim.isInLuxuryTax({ cash: Sim.TAX_LINE - 1 }), true);
  assert.strictEqual(Sim.isInLuxuryTax({ cash: Sim.TAX_LINE }), false);
});

// ---- strongest / weakest ------------------------------------------------
test('strongest and weakest metrics found correctly', function () {
  var m = { cash: 30, wins: 90, chemistry: 60, clout: 10 };
  assert.strictEqual(Sim.strongestMetric(m), 'wins');
  assert.strictEqual(Sim.weakestMetric(m), 'clout');
});

// ---- strategy type ------------------------------------------------------
test('strategy type maps from trade id', function () {
  assert.strictEqual(Sim.strategyTypeFor('star'), 'Star Chaser');
  assert.strictEqual(Sim.strategyTypeFor('depth'), 'Balanced Builder');
  assert.strictEqual(Sim.strategyTypeFor('future'), 'Future Planner');
  assert.strictEqual(Sim.strategyTypeFor('standpat'), 'Safe Operator');
  assert.strictEqual(Sim.strategyTypeFor('???'), 'Front Office Strategist');
});

// ---- scoring & badges ---------------------------------------------------
test('computeScore weights the priority metric and clamps', function () {
  var perfect = Sim.computeScore({ cash: 100, wins: 100, chemistry: 100, clout: 100 }, 'wins');
  assert.strictEqual(perfect, 100);
  var zero = Sim.computeScore({ cash: 0, wins: 0, chemistry: 0, clout: 0 }, 'cash');
  assert.strictEqual(zero, 0);
});

test('badges never include a failing/shaming grade', function () {
  [0, 40, 55, 70, 85, 100].forEach(function (s) {
    var b = Sim.badgeFor(s);
    assert.ok(b.label && typeof b.label === 'string');
    assert.ok(b.stars >= 0 && b.stars <= 3);
  });
  assert.strictEqual(Sim.badgeFor(90).stars, 3);
  assert.strictEqual(Sim.badgeFor(30).stars, 0);
});

// ---- report -------------------------------------------------------------
test('buildReport returns a complete report for a real team + trade', function () {
  var team = Data.getTeam('lakers');
  var trades = Data.tradesForTeam(team);
  var starTrade = trades.filter(function (t) { return t.id === 'star'; })[0];
  var report = Sim.buildReport({
    teamName: team.name,
    trade: starTrade,
    baseMetrics: team.metrics,
    pressure: Data.PRESSURE_MOMENTS[0]
  });
  assert.ok(report.strategyType === 'Star Chaser');
  assert.ok(report.score >= 0 && report.score <= 100);
  assert.ok(report.badge && report.badge.label);
  assert.ok(report.explanation.length > 10);
  assert.ok(report.budget && report.budget.text);
  assert.ok(['cash', 'wins', 'chemistry', 'clout'].indexOf(report.strongest) !== -1);
});

test('buildReport never throws on empty input', function () {
  var report = Sim.buildReport({});
  assert.ok(report.metrics);
  assert.ok(report.badge);
  assert.strictEqual(typeof report.score, 'number');
});

test('big star trade can push a team into the luxury tax', function () {
  var team = Data.getTeam('lakers'); // starts at cash 45
  var trades = Data.tradesForTeam(team);
  var star = trades.filter(function (t) { return t.id === 'star'; })[0];
  var fin = Sim.projectMetrics(team.metrics, null, star);
  assert.ok(fin.cash < Sim.TAX_LINE, 'expected Lakers star trade to cross the tax line');
});

test('future pick trade improves cash (cap relief)', function () {
  var team = Data.getTeam('bucks');
  var trades = Data.tradesForTeam(team);
  var future = trades.filter(function (t) { return t.id === 'future'; })[0];
  var fin = Sim.projectMetrics(team.metrics, null, future);
  assert.ok(fin.cash > team.metrics.cash);
});

// ---- memo ---------------------------------------------------------------
test('safeMemo provides a default when blank', function () {
  var blank = Sim.safeMemo('   ');
  assert.strictEqual(blank.provided, false);
  assert.ok(blank.text.length > 0);
  var written = Sim.safeMemo('We needed wins now.');
  assert.strictEqual(written.provided, true);
  assert.strictEqual(written.text, 'We needed wins now.');
});

test('safeMemo truncates absurdly long input', function () {
  var long = new Array(2000).join('x');
  var out = Sim.safeMemo(long);
  assert.ok(out.text.length <= 601);
});

// ---- completion result --------------------------------------------------
test('buildCompletionResult has Highway-World-friendly shape', function () {
  var team = Data.getTeam('spurs');
  var trades = Data.tradesForTeam(team);
  var trade = trades[0];
  var result = Sim.buildCompletionResult({
    teamId: team.id,
    teamName: team.name,
    gmName: 'Coach Z',
    trade: trade,
    baseMetrics: team.metrics,
    pressure: Data.PRESSURE_MOMENTS[1],
    memo: ''
  });
  assert.strictEqual(result.simulationId, 'bsc-t101-m1-l2-trade-deadline');
  assert.strictEqual(result.track, '101');
  assert.strictEqual(result.module, 'Module 1');
  assert.strictEqual(result.lesson, 'Lesson 2');
  assert.strictEqual(result.studentRole, 'General Manager');
  assert.ok(result.metrics && typeof result.metrics.cash === 'number');
  assert.ok(result.performanceReport);
  assert.ok(result.completionResult && typeof result.completionResult.score === 'number');
  assert.strictEqual(result.highwayWorldLocation, 'front-office');
});

// ---- data integrity -----------------------------------------------------
test('every team builds exactly four trade offers with player names filled', function () {
  Data.TEAMS.forEach(function (team) {
    var trades = Data.tradesForTeam(team);
    assert.strictEqual(trades.length, 4);
    trades.forEach(function (t) {
      assert.ok(t.get.indexOf('{') === -1, 'unfilled placeholder in ' + t.id);
      assert.ok(t.give.indexOf('{') === -1, 'unfilled placeholder in ' + t.id);
    });
  });
});

console.log('\n' + passed + ' tests passed.');
if (process.exitCode === 1) {
  console.error('\nSome tests FAILED.');
} else {
  console.log('All tests passed. ✅');
}
