/**
 * Bow Sports Capital — Track 101 · Module 1 · Lesson 2
 * "Trade Deadline War Room"
 *
 * app.js — UI controller. Renders every screen, wires up events, and keeps
 * the simulation state safe from edge cases (rapid clicks, missing data,
 * blank memo, long names, no localStorage, etc.).
 *
 * Pure game math lives in simulation.js (BSCSim). Content lives in data.js
 * (BSCData). This file only handles the DOM.
 */
(function () {
  'use strict';

  var Sim = window.BSCSim;
  var Data = window.BSCData;

  // ---- Safe localStorage wrapper (never throws) --------------------------
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  // ---- App state ---------------------------------------------------------
  var state = {
    phase: 'briefing',
    gmName: '',
    team: null,
    trades: [],
    selectedTradeId: null,
    pressure: null,
    pressureApplied: false,
    report: null,
    memo: '',
    busy: false
  };

  var root; // main container element

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Pick a pressure moment, rotating through them so replays feel fresh.
  function nextPressure() {
    var list = (Data && Data.PRESSURE_MOMENTS) || [];
    if (!list.length) return null;
    var idx = parseInt(store.get('bsc_pressure_idx') || '0', 10);
    if (isNaN(idx) || idx < 0) idx = 0;
    var pick = list[idx % list.length];
    store.set('bsc_pressure_idx', String((idx + 1) % list.length));
    return pick;
  }

  // Current "base" metrics shown on the dashboard (team + pressure effect).
  function baseMetrics() {
    if (!state.team) return Sim.clampMetrics({});
    return Sim.projectMetrics(state.team.metrics, state.pressureApplied ? state.pressure : null, null);
  }

  function selectedTrade() {
    if (!state.selectedTradeId) return null;
    for (var i = 0; i < state.trades.length; i++) {
      if (state.trades[i].id === state.selectedTradeId) return state.trades[i];
    }
    return null;
  }

  // Final projected metrics given the current selection.
  function projected() {
    return Sim.projectMetrics(
      state.team ? state.team.metrics : {},
      state.pressureApplied ? state.pressure : null,
      selectedTrade()
    );
  }

  // ---- Screen switching --------------------------------------------------
  function render(html) {
    root.innerHTML = html;
    root.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function transitionTo(phase, renderFn) {
    if (state.busy) return;
    state.busy = true;
    root.classList.add('is-leaving');
    setTimeout(function () {
      state.phase = phase;
      renderFn();
      root.classList.remove('is-leaving');
      root.classList.add('is-entering');
      setTimeout(function () {
        root.classList.remove('is-entering');
        state.busy = false;
      }, 260);
    }, 200);
  }

  // ====================================================================
  // SCREEN 1 — Mission Briefing
  // ====================================================================
  function renderBriefing() {
    render(
      '<section class="screen briefing">' +
        '<div class="brand-row">' +
          '<span class="brand-dot"></span>' +
          '<span class="brand-text">Bow Sports Capital</span>' +
          '<span class="brand-track">Track 101 · Module 1 · Lesson 2</span>' +
        '</div>' +
        '<div class="mission-card">' +
          '<div class="mission-kicker">Today’s Mission</div>' +
          '<h1 class="mission-title">Trade Deadline War Room</h1>' +
          '<p class="mission-lead">You are the <strong>General Manager</strong>. The trade deadline is here. ' +
          'You can make your team better — but <strong>every move has a cost</strong>. ' +
          'Spend too much and you cross the <strong>Luxury Tax Line</strong> and pay a penalty.</p>' +
          '<div class="how-steps">' +
            '<div class="how-step"><span class="how-num">1</span><span>Pick your team and look at your 4 meters.</span></div>' +
            '<div class="how-step"><span class="how-num">2</span><span>Compare trades. See what you give up and get.</span></div>' +
            '<div class="how-step"><span class="how-num">3</span><span>Handle a surprise, lock in your move, and defend it.</span></div>' +
          '</div>' +
          '<div class="metric-legend">' +
            metricChip('💰', 'Cash', 'budget health') +
            metricChip('🏆', 'Wins', 'team strength') +
            metricChip('🤝', 'Chemistry', 'how they fit') +
            metricChip('📣', 'Clout', 'fan buzz') +
          '</div>' +
          '<button class="btn btn-primary btn-xl" id="go-setup">Enter the War Room →</button>' +
        '</div>' +
        '<p class="footnote">A hands-on front office simulation. No right or wrong answer — your job is to choose a move you can explain.</p>' +
      '</section>'
    );
    $('#go-setup').addEventListener('click', function () {
      transitionTo('setup', renderSetup);
    });
  }

  function metricChip(icon, name, help) {
    return '<div class="legend-chip"><span class="legend-icon">' + icon + '</span>' +
      '<span class="legend-name">' + esc(name) + '</span>' +
      '<span class="legend-help">' + esc(help) + '</span></div>';
  }

  // ====================================================================
  // SCREEN 2 — Setup (role + team)
  // ====================================================================
  function renderSetup() {
    var savedName = state.gmName || store.get('bsc_gm_name') || '';
    var teams = (Data && Data.TEAMS) || [];

    var cards = teams.map(function (t) {
      var sel = (state.team && state.team.id === t.id) ? ' selected' : '';
      return (
        '<button class="team-card' + sel + '" data-team="' + esc(t.id) + '" ' +
          'style="--team-primary:' + esc(t.colors.primary) + ';--team-secondary:' + esc(t.colors.secondary) + '">' +
          '<div class="team-emoji">' + esc(t.emoji) + '</div>' +
          '<div class="team-abbr">' + esc(t.abbr) + '</div>' +
          '<div class="team-name">' + esc(t.name) + '</div>' +
          '<div class="team-tagline">' + esc(t.tagline) + '</div>' +
          '<p class="team-blurb">' + esc(t.blurb) + '</p>' +
          '<div class="team-meter-preview">' +
            miniMeter('💰', t.metrics.cash) + miniMeter('🏆', t.metrics.wins) +
            miniMeter('🤝', t.metrics.chemistry) + miniMeter('📣', t.metrics.clout) +
          '</div>' +
          '<span class="team-pick">' + (sel ? '✓ Picked' : 'Pick this team') + '</span>' +
        '</button>'
      );
    }).join('');

    render(
      '<section class="screen setup">' +
        '<button class="btn btn-ghost btn-back" id="back-briefing">← Back</button>' +
        '<h2 class="screen-title">Set Up Your Front Office</h2>' +
        '<p class="screen-sub">Add your GM name, then choose a team to run.</p>' +
        '<div class="name-row">' +
          '<label for="gm-name">GM Name <span class="optional">(optional)</span></label>' +
          '<input id="gm-name" class="text-input" type="text" maxlength="40" ' +
            'placeholder="e.g. Coach Riley" value="' + esc(savedName) + '" autocomplete="off">' +
        '</div>' +
        '<div class="team-grid">' + cards + '</div>' +
        '<div class="setup-actions">' +
          '<button class="btn btn-primary btn-xl" id="go-warroom"' +
            (state.team ? '' : ' disabled') + '>Enter the War Room →</button>' +
          '<p class="setup-hint" id="setup-hint">' +
            (state.team ? 'Running the ' + esc(state.team.name) + '.' : 'Pick a team to continue.') + '</p>' +
        '</div>' +
      '</section>'
    );

    $('#back-briefing').addEventListener('click', function () {
      transitionTo('briefing', renderBriefing);
    });

    var nameInput = $('#gm-name');
    nameInput.addEventListener('input', function () {
      state.gmName = nameInput.value.slice(0, 40);
      store.set('bsc_gm_name', state.gmName);
    });

    Array.prototype.forEach.call(root.querySelectorAll('.team-card'), function (card) {
      card.addEventListener('click', function () {
        var id = card.getAttribute('data-team');
        var team = Data.getTeam(id);
        if (!team) return;
        state.team = team;
        // Selection visuals
        Array.prototype.forEach.call(root.querySelectorAll('.team-card'), function (c) {
          c.classList.toggle('selected', c === card);
          var pick = $('.team-pick', c);
          if (pick) pick.textContent = (c === card) ? '✓ Picked' : 'Pick this team';
        });
        var btn = $('#go-warroom');
        if (btn) btn.removeAttribute('disabled');
        var hint = $('#setup-hint');
        if (hint) hint.textContent = 'Running the ' + team.name + '.';
      });
    });

    $('#go-warroom').addEventListener('click', function () {
      if (!state.team) return;
      startWarRoom();
    });
  }

  function miniMeter(icon, val) {
    var v = Sim.clamp(val, 0, 100);
    return '<div class="mini-meter"><span>' + icon + '</span>' +
      '<div class="mini-track"><div class="mini-fill" style="width:' + v + '%"></div></div></div>';
  }

  // ====================================================================
  // SCREEN 3 — War Room (dashboard + trade board)
  // ====================================================================
  function startWarRoom() {
    if (!state.team) { transitionTo('setup', renderSetup); return; }
    state.trades = Data.tradesForTeam(state.team);
    state.selectedTradeId = null;
    state.pressure = null;
    state.pressureApplied = false;
    transitionTo('warroom', renderWarRoom);
  }

  function renderWarRoom() {
    if (!state.team || !state.trades.length) { transitionTo('setup', renderSetup); return; }
    var t = state.team;
    var finalPhase = state.pressureApplied; // after pressure, next action is final submit

    var pressureBanner = '';
    if (state.pressureApplied && state.pressure) {
      pressureBanner =
        '<div class="pressure-banner">' +
          '<span class="pb-icon">' + esc(state.pressure.icon) + '</span>' +
          '<span class="pb-text"><strong>' + esc(state.pressure.title) + '</strong> — ' +
            'Ownership cares most about <strong>' + esc(Sim.METRIC_LABELS[state.pressure.priority]) + '</strong> now.</span>' +
        '</div>';
    }

    render(
      '<section class="screen warroom">' +
        '<header class="wr-head">' +
          '<div class="wr-team" style="--team-primary:' + esc(t.colors.primary) + '">' +
            '<span class="wr-emoji">' + esc(t.emoji) + '</span>' +
            '<span class="wr-team-name">' + esc(t.name) + '</span>' +
          '</div>' +
          '<div class="wr-phase">' + (finalPhase ? 'Final Decision' : 'Front Office Dashboard') + '</div>' +
        '</header>' +
        pressureBanner +
        '<div class="dashboard" id="dashboard">' + dashboardRows() + '</div>' +
        '<div class="impact-line" id="impact-line">' + impactText() + '</div>' +
        '<h3 class="board-title">Trade Board</h3>' +
        '<p class="board-help">Tap a card to see how it changes your team. You can change your mind.</p>' +
        '<div class="trade-board" id="trade-board">' + tradeCards() + '</div>' +
        '<div class="wr-actions">' +
          '<button class="btn btn-primary btn-xl" id="wr-go"' + (state.selectedTradeId ? '' : ' disabled') + '>' +
            (finalPhase ? 'Submit Final Strategy →' : 'Lock In This Move →') + '</button>' +
          '<button class="btn btn-ghost" id="wr-restart">Start Over</button>' +
        '</div>' +
      '</section>'
    );

    bindTradeCards();
    $('#wr-go').addEventListener('click', onWarRoomGo);
    $('#wr-restart').addEventListener('click', confirmRestart);
  }

  function dashboardRows() {
    var base = baseMetrics();
    var keys = Sim.METRIC_KEYS;
    var icons = { cash: '💰', wins: '🏆', chemistry: '🤝', clout: '📣' };
    return keys.map(function (k) {
      var taxMark = (k === 'cash')
        ? '<div class="tax-line" style="left:' + Sim.TAX_LINE + '%" title="Luxury Tax Line"></div>'
        : '';
      return (
        '<div class="meter-row" data-metric="' + k + '">' +
          '<div class="meter-top">' +
            '<span class="meter-label"><span class="meter-icon">' + icons[k] + '</span>' + esc(Sim.METRIC_LABELS[k]) + '</span>' +
            '<span class="meter-right"><span class="meter-delta" data-delta="' + k + '"></span>' +
              '<span class="meter-value" data-value="' + k + '">' + base[k] + '</span></span>' +
          '</div>' +
          '<div class="meter-track">' +
            '<div class="meter-fill" data-fill="' + k + '" style="width:' + base[k] + '%"></div>' +
            taxMark +
          '</div>' +
          (k === 'cash' ? '<div class="meter-help" data-budget>' + budgetStatusText(base.cash) + '</div>' :
            '<div class="meter-help">' + esc(Sim.METRIC_HELP[k]) + '</div>') +
        '</div>'
      );
    }).join('');
  }

  function budgetStatusText(cash) {
    if (cash < Sim.TAX_LINE) {
      return '⚠️ Below the Luxury Tax Line — your team is paying a penalty.';
    }
    return '✅ Above the Luxury Tax Line — no penalty. ' + esc(Sim.METRIC_HELP.cash);
  }

  function updateDashboard() {
    var base = baseMetrics();
    var fin = projected();
    Sim.METRIC_KEYS.forEach(function (k) {
      var fill = root.querySelector('[data-fill="' + k + '"]');
      var val = root.querySelector('[data-value="' + k + '"]');
      var delta = root.querySelector('[data-delta="' + k + '"]');
      if (fill) fill.style.width = fin[k] + '%';
      if (val) val.textContent = fin[k];
      if (delta) {
        var d = fin[k] - base[k];
        if (d === 0 || !state.selectedTradeId) {
          delta.textContent = '';
          delta.className = 'meter-delta';
        } else {
          delta.textContent = (d > 0 ? '+' + d : d);
          delta.className = 'meter-delta ' + (d > 0 ? 'up' : 'down');
        }
      }
      // Recolor cash meter when crossing the tax line
      if (k === 'cash' && fill) {
        fill.classList.toggle('in-tax', fin.cash < Sim.TAX_LINE);
        var budget = root.querySelector('[data-budget]');
        if (budget) budget.innerHTML = budgetStatusText(fin.cash);
      }
    });
    var impact = $('#impact-line');
    if (impact) impact.innerHTML = impactText();
  }

  function impactText() {
    var tr = selectedTrade();
    if (!tr) return '<span class="impact-empty">👆 Pick a trade above to see your team’s impact.</span>';
    return '<span class="impact-pick"><strong>' + esc(tr.icon + ' ' + tr.label) + ':</strong> ' + esc(tr.summary) + '</span>';
  }

  function tradeCards() {
    return state.trades.map(function (tr) {
      var sel = (state.selectedTradeId === tr.id) ? ' selected' : '';
      var riskClass = tr.risk.toLowerCase();
      return (
        '<button class="trade-card' + sel + '" data-trade="' + esc(tr.id) + '">' +
          '<div class="tc-head">' +
            '<span class="tc-icon">' + esc(tr.icon) + '</span>' +
            '<span class="tc-label">' + esc(tr.label) + '</span>' +
            '<span class="tc-risk risk-' + riskClass + '">' + esc(tr.risk) + ' risk</span>' +
          '</div>' +
          '<p class="tc-summary">' + esc(tr.summary) + '</p>' +
          '<div class="tc-trade">' +
            '<div class="tc-give"><span class="tc-tag give">You give up</span>' + esc(tr.give) + '</div>' +
            '<div class="tc-get"><span class="tc-tag get">You get</span>' + esc(tr.get) + '</div>' +
          '</div>' +
          '<div class="tc-deltas">' + deltaChips(tr.deltas) + '</div>' +
          '<div class="tc-cost">💵 ' + esc(tr.costNote) + '</div>' +
          '<span class="tc-choose">' + (sel ? '✓ Selected' : 'Choose this move') + '</span>' +
        '</button>'
      );
    }).join('');
  }

  function deltaChips(deltas) {
    var icons = { cash: '💰', wins: '🏆', chemistry: '🤝', clout: '📣' };
    return Sim.METRIC_KEYS.map(function (k) {
      var d = deltas[k] || 0;
      if (!d) return '<span class="dchip flat">' + icons[k] + ' 0</span>';
      var cls = d > 0 ? 'up' : 'down';
      return '<span class="dchip ' + cls + '">' + icons[k] + ' ' + (d > 0 ? '+' + d : d) + '</span>';
    }).join('');
  }

  function bindTradeCards() {
    Array.prototype.forEach.call(root.querySelectorAll('.trade-card'), function (card) {
      card.addEventListener('click', function () {
        var id = card.getAttribute('data-trade');
        state.selectedTradeId = id;
        Array.prototype.forEach.call(root.querySelectorAll('.trade-card'), function (c) {
          var isSel = c === card;
          c.classList.toggle('selected', isSel);
          var choose = $('.tc-choose', c);
          if (choose) choose.textContent = isSel ? '✓ Selected' : 'Choose this move';
        });
        var go = $('#wr-go');
        if (go) go.removeAttribute('disabled');
        updateDashboard();
      });
    });
  }

  function onWarRoomGo() {
    if (!state.selectedTradeId || state.busy) return;
    if (!state.pressureApplied) {
      // Reveal the Pressure Moment.
      state.pressure = nextPressure();
      transitionTo('pressure', renderPressure);
    } else {
      // Already saw pressure — go straight to the report.
      goToReport();
    }
  }

  // ====================================================================
  // SCREEN 4 — Pressure Moment
  // ====================================================================
  function renderPressure() {
    var p = state.pressure;
    if (!p) { state.pressureApplied = true; transitionTo('warroom', renderWarRoom); return; }
    var tr = selectedTrade();

    render(
      '<section class="screen pressure-screen">' +
        '<div class="pressure-card">' +
          '<div class="pressure-kicker">Pressure Moment</div>' +
          '<div class="pressure-emoji">' + esc(p.icon) + '</div>' +
          '<h2 class="pressure-title">' + esc(p.title) + '</h2>' +
          '<p class="pressure-text">' + esc(p.text) + '</p>' +
          '<div class="pressure-priority">Now most important: ' +
            '<strong>' + esc(Sim.METRIC_LABELS[p.priority]) + '</strong></div>' +
          '<div class="pressure-current">Your move on the table: ' +
            '<strong>' + esc(tr ? (tr.icon + ' ' + tr.label) : 'None yet') + '</strong></div>' +
          '<div class="pressure-actions">' +
            '<button class="btn btn-secondary btn-xl" id="pr-rethink">Rethink My Trade</button>' +
            '<button class="btn btn-primary btn-xl" id="pr-submit">Keep It & Submit →</button>' +
          '</div>' +
          '<p class="pressure-note">There’s no perfect answer. Pick the move you can defend.</p>' +
        '</div>' +
      '</section>'
    );

    // Apply the pressure effect once, now that it has been revealed.
    state.pressureApplied = true;

    $('#pr-rethink').addEventListener('click', function () {
      transitionTo('warroom', renderWarRoom);
    });
    $('#pr-submit').addEventListener('click', function () {
      goToReport();
    });
  }

  // ====================================================================
  // SCREEN 5 — Performance Report + Boardroom Memo
  // ====================================================================
  function goToReport() {
    if (state.busy) return;
    var tr = selectedTrade();
    if (!state.team || !tr) { // safety net — shouldn't happen
      transitionTo('warroom', renderWarRoom);
      return;
    }
    state.report = Sim.buildReport({
      teamName: state.team.name,
      trade: tr,
      baseMetrics: state.team.metrics,
      pressure: state.pressureApplied ? state.pressure : null
    });
    publishResult();
    transitionTo('report', renderReport);
  }

  function renderReport() {
    var r = state.report;
    if (!r) { transitionTo('warroom', renderWarRoom); return; }
    var icons = { cash: '💰', wins: '🏆', chemistry: '🤝', clout: '📣' };

    var bars = Sim.METRIC_KEYS.map(function (k) {
      var v = r.metrics[k];
      var taxMark = (k === 'cash') ? '<div class="tax-line" style="left:' + Sim.TAX_LINE + '%"></div>' : '';
      var fillCls = (k === 'cash' && v < Sim.TAX_LINE) ? ' in-tax' : '';
      return (
        '<div class="meter-row">' +
          '<div class="meter-top">' +
            '<span class="meter-label"><span class="meter-icon">' + icons[k] + '</span>' + esc(Sim.METRIC_LABELS[k]) + '</span>' +
            '<span class="meter-value">' + v + '</span>' +
          '</div>' +
          '<div class="meter-track"><div class="meter-fill' + fillCls + '" style="width:' + v + '%"></div>' + taxMark + '</div>' +
        '</div>'
      );
    }).join('');

    var stars = '';
    for (var i = 0; i < 3; i++) stars += '<span class="star' + (i < r.badge.stars ? ' on' : '') + '">★</span>';

    var gm = (state.gmName && state.gmName.trim()) ? esc(state.gmName.trim()) : 'GM';

    render(
      '<section class="screen report">' +
        '<div class="report-hero badge-' + r.badge.stars + '">' +
          '<div class="report-kicker">Performance Report</div>' +
          '<div class="badge-icon">' + esc(r.badge.icon) + '</div>' +
          '<div class="badge-label">' + esc(r.badge.label) + '</div>' +
          '<div class="badge-stars">' + stars + '</div>' +
          '<div class="badge-score">Front Office Score: <strong>' + r.score + '</strong>/100</div>' +
        '</div>' +

        '<div class="report-body">' +
          '<div class="strategy-row">' +
            '<div class="strategy-type"><span class="st-kicker">Your Strategy</span>' + esc(r.strategyType) + '</div>' +
            '<div class="strategy-move"><span class="st-kicker">Your Move</span>' + esc(r.tradeLabel) + '</div>' +
          '</div>' +

          '<h3 class="report-h3">Team Impact</h3>' +
          '<div class="report-meters">' + bars + '</div>' +

          '<div class="hilo">' +
            '<div class="hilo-item up"><span class="hilo-k">Strongest</span>' + esc(r.strongestLabel) + '</div>' +
            '<div class="hilo-item down"><span class="hilo-k">Room to grow</span>' + esc(r.weakestLabel) + '</div>' +
          '</div>' +

          '<div class="report-notes">' +
            '<p class="note">' + esc(r.explanation) + '</p>' +
            '<p class="note note-budget budget-' + esc(r.budget.status) + '">' + esc(r.budget.text) + '</p>' +
            '<p class="note note-pressure">' + esc(r.pressureNote) + '</p>' +
          '</div>' +

          '<div class="memo-block">' +
            '<h3 class="report-h3">Boardroom Memo</h3>' +
            '<p class="memo-prompt">Defend your strategy to ownership. Why was this the best move for your team?</p>' +
            '<textarea id="memo" class="memo-input" maxlength="600" rows="3" ' +
              'placeholder="Write 1–3 sentences… (optional)">' + esc(state.memo) + '</textarea>' +
            '<div class="memo-row">' +
              '<span class="memo-hint" id="memo-hint">Optional — you can leave this blank.</span>' +
              '<button class="btn btn-secondary" id="memo-save">Save Memo</button>' +
            '</div>' +
            '<div class="memo-saved" id="memo-saved" hidden></div>' +
          '</div>' +

          '<div class="report-actions">' +
            '<button class="btn btn-primary btn-xl" id="play-again">Play Again (Same Team)</button>' +
            '<button class="btn btn-secondary btn-xl" id="new-team">Try a New Team</button>' +
          '</div>' +
          '<p class="report-sign">Filed by <strong>' + gm + '</strong> · ' + esc(state.team.name) + ' Front Office</p>' +
        '</div>' +
      '</section>'
    );

    if (r.badge.stars >= 3) celebrate();

    var memo = $('#memo');
    memo.addEventListener('input', function () {
      state.memo = memo.value.slice(0, 600);
      publishResult();
      var saved = $('#memo-saved');
      if (saved) saved.hidden = true;
    });
    $('#memo-save').addEventListener('click', function () {
      var clean = Sim.safeMemo(state.memo);
      var saved = $('#memo-saved');
      if (saved) {
        saved.hidden = false;
        saved.textContent = clean.provided
          ? '✓ Memo saved. Nicely defended, ' + gm + '!'
          : '✓ Saved. (No memo written — that’s okay, your moves speak for themselves.)';
      }
      publishResult();
    });

    $('#play-again').addEventListener('click', function () {
      state.memo = '';
      startWarRoom();
    });
    $('#new-team').addEventListener('click', function () {
      state.memo = '';
      state.selectedTradeId = null;
      transitionTo('setup', renderSetup);
    });
  }

  // ---- Completion result (Highway World friendly) ------------------------
  function publishResult() {
    if (!state.report) return;
    try {
      window.BSC_LAST_RESULT = Sim.buildCompletionResult({
        teamId: state.team ? state.team.id : null,
        teamName: state.team ? state.team.name : null,
        gmName: state.gmName,
        report: state.report,
        pressure: state.pressureApplied ? state.pressure : null,
        memo: state.memo,
        completedAt: Date.now()
      });
    } catch (e) { /* never block the UI on this */ }
  }

  // ---- Restart helper ----------------------------------------------------
  function confirmRestart() {
    state.selectedTradeId = null;
    state.pressure = null;
    state.pressureApplied = false;
    state.memo = '';
    transitionTo('setup', renderSetup);
  }

  // ---- Lightweight confetti (no assets, fully guarded) -------------------
  function celebrate() {
    try {
      var colors = ['#FFD700', '#22c55e', '#3b82f6', '#f97316', '#a855f7'];
      var layer = document.createElement('div');
      layer.className = 'confetti-layer';
      document.body.appendChild(layer);
      for (var i = 0; i < 36; i++) {
        (function (i) {
          var piece = document.createElement('span');
          piece.className = 'confetti-piece';
          piece.style.left = Math.random() * 100 + '%';
          piece.style.background = colors[i % colors.length];
          piece.style.animationDelay = (Math.random() * 0.4) + 's';
          piece.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
          layer.appendChild(piece);
        })(i);
      }
      setTimeout(function () { if (layer.parentNode) layer.parentNode.removeChild(layer); }, 3200);
    } catch (e) { /* ignore */ }
  }

  // ---- Boot --------------------------------------------------------------
  function boot() {
    root = document.getElementById('app');
    if (!root) return;
    if (!Sim || !Data) {
      root.innerHTML = '<div class="fatal">The simulation could not load its files. ' +
        'Please refresh the page.</div>';
      return;
    }
    var savedName = store.get('bsc_gm_name');
    if (savedName) state.gmName = savedName;
    renderBriefing();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
