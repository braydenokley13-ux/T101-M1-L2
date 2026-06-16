/**
 * BOW Sports Capital — Track 101 · Module 1 · Lesson 2
 * "Trade Deadline War Room"
 *
 * app.js — UI controller for the no-build static site.
 * Renders the 12-screen front-office flow (cold open → brief → intel →
 * decision desk R1 → reveal → ownership pressure → decision desk R2 →
 * buzzer → front page → debrief → economics) over a single client-side
 * state object. Pure logic lives in simulation.js; content in data.js.
 *
 * No framework, no build step, no network calls. Works from file://.
 */
(function () {
  'use strict';

  var Sim = window.BSCSim;
  var Data = window.BSCData;
  var APP = document.getElementById('app');

  // --------------------------------------------------------------- state ---
  var SAVE_KEY = 'bsc_t101m1l2_v2';
  var PRESSURE_IDX_KEY = 'bsc_pressure_idx';
  var RESUMABLE = ['intel', 'decision1', 'reveal1', 'pressure', 'decision2', 'reveal2', 'frontpage', 'debrief'];

  var state = {
    phase: 'loading',
    showResume: false,
    showRestart: false,
    intelActive: 'capsheet',
    intelReviewed: ['capsheet'],
    gmName: '',
    teamId: null,
    selectedTradeId: null,
    tradeLocked: false,
    pressureId: null,
    round2Id: null,
    round2Locked: false,
    memo: '',
    reduce: false
  };

  var savedSnapshot = null; // last loaded save, for "Resume"

  // ----------------------------------------------------------- utilities ---
  // Tiny hyperscript helper. props: { style, cls, onClick, onInput, attrs, html, value, ... }
  function h(tag, props, children) {
    var node = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (key) {
      var val = props[key];
      if (val == null) return;
      if (key === 'style') node.setAttribute('style', val);
      else if (key === 'cls') node.className = val;
      else if (key === 'html') node.innerHTML = val;
      else if (key === 'onClick') node.addEventListener('click', val);
      else if (key === 'onInput') node.addEventListener('input', val);
      else if (key === 'attrs') Object.keys(val).forEach(function (a) { if (val[a] != null) node.setAttribute(a, val[a]); });
      else if (key === 'value') node.value = val;
      else node.setAttribute(key, val);
    });
    appendChildren(node, children);
    return node;
  }
  function appendChildren(node, children) {
    if (children == null) return;
    if (Array.isArray(children)) {
      children.forEach(function (c) { appendChildren(node, c); });
    } else if (typeof children === 'string' || typeof children === 'number') {
      node.appendChild(document.createTextNode(String(children)));
    } else if (children instanceof Node) {
      node.appendChild(children);
    }
  }

  function deltaColor(n) { return n > 0 ? 'var(--bow-positive)' : (n < 0 ? 'var(--bow-negative)' : '#9a9da6'); }
  function riskTone(risk) { return risk === 'High' ? 'var(--bow-negative)' : (risk === 'Medium' ? 'var(--bow-warning)' : 'var(--bow-positive)'); }
  function riskTint(risk) { return risk === 'High' ? 'var(--bow-negative-tint)' : (risk === 'Medium' ? 'var(--bow-warning-tint)' : 'var(--bow-positive-tint)'); }
  function nickOf(t) { return t ? t.name.split(' ').slice(-1)[0].toUpperCase() : 'YOUR TEAM'; }
  function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // -------------------------------------------------------- persistence ----
  function persist() {
    try {
      var keep = {
        phase: state.phase, gmName: state.gmName, teamId: state.teamId,
        selectedTradeId: state.selectedTradeId, tradeLocked: state.tradeLocked,
        pressureId: state.pressureId, round2Id: state.round2Id,
        round2Locked: state.round2Locked, memo: state.memo
      };
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(keep));
    } catch (e) { /* storage disabled / file:// — run without saving */ }
  }
  function loadSaved() {
    try {
      var raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      savedSnapshot = JSON.parse(raw);
      return savedSnapshot;
    } catch (e) { return null; }
  }
  function clearSave() { try { window.localStorage.removeItem(SAVE_KEY); } catch (e) {} }

  function go(phase, extra) {
    Object.assign(state, { phase: phase }, extra || {});
    try { window.scrollTo(0, 0); } catch (e) {}
    persist();
    render();
  }
  function set(extra) { Object.assign(state, extra); render(); }
  // Fall back to an earlier phase (used when a screen's prerequisites are
  // missing, e.g. an inconsistent resume). Returns the fallback view node
  // directly so render() never clobbers the screen.
  function redirect(phase) { state.phase = phase; persist(); return (VIEWS[phase] || viewColdOpen)(); }

  // --------------------------------------------------------- data access ---
  function team() { return Data.getTeam(state.teamId); }
  function trades() { return Data.tradesForTeam(team()); }
  function tradeById(id) { return trades().filter(function (t) { return t.id === id; })[0] || null; }
  function pressure() { return Data.getPressure(state.pressureId); }
  function round2ById(id) { return Data.getRound2(id); }
  function snaps() {
    return Sim.projectChain(
      team() ? team().metrics : {},
      tradeById(state.selectedTradeId),
      pressure(),
      round2ById(state.round2Id)
    );
  }

  function nextPressureId() {
    if (state.pressureId) return state.pressureId;
    var idx = 0;
    try { idx = parseInt(window.localStorage.getItem(PRESSURE_IDX_KEY) || '0', 10) || 0; } catch (e) {}
    var list = Data.PRESSURE_MOMENTS;
    var pick = list[idx % list.length];
    try { window.localStorage.setItem(PRESSURE_IDX_KEY, String((idx + 1) % list.length)); } catch (e) {}
    return pick.id;
  }

  // -------------------------------------------------------- meter models ---
  function dashMeters(m) {
    m = Sim.clampMetrics(m);
    return Sim.METRIC_KEYS.map(function (k) {
      var isCash = k === 'cash';
      var inTax = isCash && m[k] < Sim.TAX_LINE;
      return {
        key: k, label: Sim.METRIC_LABELS[k], val: m[k], pct: m[k], isCash: isCash,
        barColor: isCash ? (inTax ? 'var(--bow-negative)' : 'var(--bow-positive)') : 'rgba(255,255,255,0.9)',
        status: isCash ? (inTax ? 'OVER LINE' : 'UNDER LINE') : ''
      };
    });
  }
  function dashMetersCompare(baseM, projM) {
    baseM = Sim.clampMetrics(baseM); projM = Sim.clampMetrics(projM);
    return Sim.METRIC_KEYS.map(function (k) {
      var isCash = k === 'cash';
      var inTax = isCash && projM[k] < Sim.TAX_LINE;
      var delta = projM[k] - baseM[k];
      return {
        key: k, label: Sim.METRIC_LABELS[k], val: projM[k], pct: projM[k], isCash: isCash,
        barColor: isCash ? (inTax ? 'var(--bow-negative)' : 'var(--bow-positive)') : 'rgba(255,255,255,0.9)',
        status: isCash ? (inTax ? 'OVER LINE' : 'UNDER LINE') : '',
        delta: delta, deltaText: delta === 0 ? '' : Sim.signed(delta), deltaColor: deltaColor(delta)
      };
    });
  }
  function revealMeters(start, after) {
    return Sim.METRIC_KEYS.map(function (k) {
      var isCash = k === 'cash';
      var inTax = isCash && after[k] < Sim.TAX_LINE;
      var delta = after[k] - start[k];
      return {
        key: k, label: Sim.METRIC_LABELS[k], from: start[k], to: after[k], pct: after[k], fromPct: start[k],
        isCash: isCash,
        barColor: isCash ? (inTax ? 'var(--bow-negative)' : 'var(--bow-positive)') : 'rgba(255,255,255,0.92)',
        deltaText: delta === 0 ? 'no change' : Sim.signed(delta), deltaColor: deltaColor(delta)
      };
    });
  }
  function tradeChips(deltas) {
    var ab = { cash: 'CAP', wins: 'WIN', chemistry: 'CHE', clout: 'BUZ' };
    return Sim.METRIC_KEYS.map(function (k) {
      var d = deltas[k] || 0;
      return { label: ab[k], text: Sim.signed(d), color: deltaColor(d) };
    });
  }

  // ====================================================== SHARED BLOCKS ===
  function capLine(width, color) {
    color = color || 'var(--bow-blue)';
    var w = width || 220;
    return h('svg', { cls: 'wr-rise-2', width: String(w), height: '14', viewBox: '0 0 100 14',
      preserveAspectRatio: 'none', style: 'display:block;margin:22px 0', attrs: { 'aria-hidden': 'true' },
      html: '<rect x="0" y="0" width="62" height="6" fill="' + color + '"></rect>' +
            '<rect x="59" y="0" width="3" height="14" fill="' + color + '"></rect>' +
            '<rect x="59" y="8" width="41" height="6" fill="' + color + '"></rect>' });
  }

  // Dark scoreboard strip used on intel / decision desks.
  function scoreboardStrip(subtitle, meters, withDelta) {
    var t = team();
    var monogram = h('div', { style: 'display:flex;align-items:center;gap:12px;padding:14px 4vw;border-right:1px solid var(--bow-dark-border);min-width:200px' }, [
      h('span', { style: 'display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:4px;font-family:var(--font-display);font-weight:900;font-size:16px;color:#fff;background:' + (t ? t.colors.primary : '#555') }, t ? t.abbr : '—'),
      h('span', { style: 'display:flex;flex-direction:column;gap:1px' }, [
        h('span', { style: 'font-family:var(--font-display);font-weight:900;text-transform:uppercase;font-size:15px;line-height:1' }, t ? t.name : ''),
        h('span', { style: 'font-family:var(--font-data);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--bow-blue)' }, subtitle)
      ])
    ]);
    var cells = meters.map(function (d) {
      var valRow = withDelta
        ? h('span', { style: 'display:flex;align-items:baseline;gap:6px' }, [
            h('span', { style: 'font-family:var(--font-data);font-size:12px;font-weight:600;color:' + d.deltaColor }, d.deltaText || ''),
            h('span', { style: 'font-family:var(--font-data);font-weight:600;font-size:17px;color:' + d.barColor }, String(d.val))
          ])
        : h('span', { style: 'font-family:var(--font-data);font-weight:600;font-size:17px;color:' + d.barColor }, String(d.val));
      var fillStyle = 'position:absolute;left:0;top:0;height:6px;background:' + d.barColor + ';width:' + d.pct + '%' + (withDelta ? ';transition:width 420ms cubic-bezier(0.2,0.7,0.2,1)' : '');
      var bar = h('span', { style: 'position:relative;height:6px;background:rgba(255,255,255,0.12);display:block' }, [
        h('span', { style: fillStyle }),
        d.isCash ? h('span', { style: 'position:absolute;left:40%;top:-3px;width:2px;height:12px;background:var(--bow-warning)' }) : null
      ]);
      return h('div', { style: 'display:flex;flex-direction:column;gap:7px;padding:14px 20px;border-left:1px solid var(--bow-dark-border)' }, [
        h('div', { style: 'display:flex;align-items:baseline;justify-content:space-between;gap:8px' }, [
          h('span', { style: 'font-family:var(--font-display);font-weight:700;text-transform:uppercase;font-size:11px;letter-spacing:0.06em;color:#9a9da6' }, d.label),
          valRow
        ]),
        bar,
        d.isCash ? h('span', { style: 'font-family:var(--font-data);font-size:9.5px;letter-spacing:0.08em;color:' + d.barColor }, d.status) : null
      ]);
    });
    return h('div', { style: 'display:flex;flex-wrap:wrap;align-items:stretch;border-bottom:1px solid var(--bow-dark-border);background:#0e0e10' }, [
      monogram,
      h('div', { cls: 'wr-grid-4', style: 'flex:1' }, cells)
    ]);
  }

  function topbar(leftLabel, leftOnClick, rightChildren) {
    return h('div', { style: 'display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 4vw;border-bottom:1px solid var(--bow-dark-border)' }, [
      h('button', { cls: 'wr-link', onClick: leftOnClick, style: 'background:none;border:none;cursor:pointer;font-family:var(--font-data);font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:var(--bow-slate);padding:6px 0' }, leftLabel),
      h('div', { style: 'display:flex;align-items:center;gap:16px' }, rightChildren)
    ]);
  }

  function cta(label, onClick, opts) {
    opts = opts || {};
    var bg = opts.bg || 'var(--bow-blue)';
    var disabled = !!opts.disabled;
    var size = opts.size || 18;
    return h('button', {
      cls: 'wr-cta', onClick: disabled ? function () {} : onClick,
      attrs: disabled ? { disabled: 'disabled' } : null,
      style: 'background:' + bg + ';color:#fff;border:none;border-radius:var(--radius-control);font-family:var(--font-display);font-weight:700;text-transform:uppercase;letter-spacing:0.04em;font-size:' + size + 'px;padding:15px 32px;cursor:' + (disabled ? 'not-allowed' : 'pointer')
    }, label);
  }
  function startOverLink() {
    return h('button', { cls: 'wr-link', onClick: openRestart, style: 'background:none;border:none;cursor:pointer;font-family:var(--font-data);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:var(--bow-slate);padding:6px 0' }, '↺ Start over');
  }

  // ============================================================ SCREENS ===

  // 0 — Loading splash ------------------------------------------------------
  function viewLoading() {
    return h('div', { cls: 'wr-grain', style: 'min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bow-ink);color:var(--bow-white)' }, [
      h('div', { style: 'display:flex;flex-direction:column;align-items:center;gap:22px;text-align:center;padding:40px' }, [
        h('div', { cls: 'wr-spin', attrs: { 'aria-hidden': 'true' }, style: 'width:60px;height:60px;border:3px solid var(--bow-dark-border);border-top-color:var(--bow-blue);border-radius:50%' }),
        h('div', { style: 'font-family:var(--font-display);font-weight:900;text-transform:uppercase;letter-spacing:0.04em;font-size:30px;line-height:1', html: 'BOW <span style="color:var(--bow-slate);font-weight:700">Sports Capital</span>' }),
        h('div', { cls: 'wr-pulse', style: 'font-family:var(--font-data);font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:var(--bow-slate)' }, 'Opening the war room…')
      ])
    ]);
  }

  // 1 — Cold open -----------------------------------------------------------
  function viewColdOpen() {
    var resumeBanner = state.showResume ? h('div', { style: 'display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:space-between;padding:14px 5vw;background:rgba(49,87,255,0.12);border-bottom:1px solid var(--bow-blue)' }, [
      h('span', { style: 'font-family:var(--font-data);font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#aab6ff' }, 'You have a deadline already in progress.'),
      h('span', { style: 'display:flex;gap:10px' }, [
        h('button', { cls: 'wr-cta', onClick: resumeGame, style: 'background:var(--bow-blue);color:#fff;border:1px solid var(--bow-blue);border-radius:var(--radius-control);font-family:var(--font-display);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;font-size:13px;padding:9px 18px;cursor:pointer' }, 'Resume the War Room'),
        h('button', { cls: 'wr-cta', onClick: dismissResume, style: 'background:transparent;color:#aab6ff;border:1px solid var(--bow-dark-border);border-radius:var(--radius-control);font-family:var(--font-display);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;font-size:13px;padding:9px 18px;cursor:pointer' }, 'Start Fresh')
      ])
    ]) : null;

    var tickerInner = '<span style="padding:0 28px">Breaking · The deadline is the loudest hour in sports</span><span style="color:var(--bow-blue)">●</span><span style="padding:0 28px">Every great roster eventually gets the same bill</span><span style="color:var(--bow-orange)">●</span><span style="padding:0 28px">The salary cap isn\'t a limit — it\'s a weapon</span><span style="color:var(--bow-blue)">●</span>';

    return h('div', { cls: 'wr-grain', style: 'min-height:100vh;background:var(--bow-ink);color:var(--bow-white);display:flex;flex-direction:column' }, [
      h('div', { style: 'display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 5vw;border-bottom:1px solid var(--bow-dark-border)' }, [
        h('div', { style: 'font-family:var(--font-display);font-weight:900;text-transform:uppercase;letter-spacing:0.02em;font-size:22px;line-height:1', html: 'BOW <span style="color:var(--bow-slate);font-weight:700;font-size:13px;letter-spacing:0.22em">SPORTS CAPITAL</span>' }),
        h('div', { style: 'font-family:var(--font-data);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--bow-slate)' }, 'Track 101 · Module 1 · Lesson 2')
      ]),
      resumeBanner,
      h('div', { cls: 'wr-split', style: 'flex:1;align-items:stretch' }, [
        h('div', { style: 'padding:6vh 4vw 6vh 5vw;display:flex;flex-direction:column;justify-content:center;gap:26px;max-width:760px' }, [
          h('div', { cls: 'wr-rise', style: 'font-family:var(--font-display);font-weight:700;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:var(--bow-orange);display:flex;align-items:center;gap:10px' }, [
            h('span', { cls: 'wr-pulse-fast', style: 'width:8px;height:8px;border-radius:50%;background:var(--bow-orange)' }),
            'Trade Deadline · Live · 2:58 PM ET'
          ]),
          h('h1', { cls: 'wr-rise', style: 'margin:0;font-family:var(--font-display);font-weight:900;text-transform:uppercase;letter-spacing:-0.01em;font-size:clamp(54px,7.2vw,104px);line-height:0.86', html: 'Your team<br>has a<br><span style="color:var(--bow-blue)">problem.</span>' }),
          capLine(220),
          h('p', { cls: 'wr-rise-2', style: 'margin:0;font-family:var(--font-editorial);font-size:clamp(19px,2vw,23px);line-height:1.5;color:#d3d5db;max-width:34ch', html: 'The buzzer is 60 minutes away. Your roster isn\'t good enough to win it all — and your owner just walked in wanting answers. Every fix costs money. Spend too much, and the salary cap starts <em style="font-style:italic;color:#fff">fighting back</em>.' }),
          h('div', { cls: 'wr-rise-3', style: 'display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-top:6px' }, [
            h('button', { cls: 'wr-cta', onClick: enterBrief, style: 'background:var(--bow-blue);color:#fff;border:1px solid var(--bow-blue);border-radius:var(--radius-control);font-family:var(--font-display);font-weight:700;text-transform:uppercase;letter-spacing:0.04em;font-size:19px;padding:16px 34px;cursor:pointer' }, 'Step Into the War Room →'),
            h('span', { style: 'font-family:var(--font-data);font-size:12px;letter-spacing:0.06em;color:var(--bow-slate)' }, "You're the GM. You make the call.")
          ])
        ]),
        h('div', { cls: 'wr-hero-clock', style: 'position:relative;overflow:hidden;border-left:1px solid var(--bow-dark-border);background:linear-gradient(150deg,#10131f 0%,#0a0a0b 60%);display:flex;align-items:center;justify-content:center' }, [
          h('div', { style: 'position:absolute;top:-6%;right:-12%;width:60%;height:48%;background:var(--bow-blue);opacity:0.16;transform:rotate(-12deg)' }),
          h('div', { style: 'position:absolute;bottom:-10%;left:-8%;width:55%;height:40%;background:var(--bow-orange);opacity:0.12;transform:rotate(8deg)' }),
          h('div', { style: 'position:relative;text-align:center;padding:30px' }, [
            h('div', { cls: 'wr-rise-2', style: 'font-family:var(--font-data);font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:var(--bow-slate);margin-bottom:8px' }, 'Deadline Clock'),
            h('div', { cls: 'wr-rise-2', style: 'font-family:var(--font-display);font-weight:900;font-size:clamp(80px,13vw,180px);line-height:0.82;letter-spacing:-0.02em;color:#fff;font-variant-numeric:tabular-nums', html: '60<span style="color:var(--bow-orange)">:</span>00' }),
            h('div', { cls: 'wr-rise-3', style: 'margin-top:22px;display:inline-flex;flex-direction:column;gap:8px;text-align:left;border-left:3px solid var(--bow-blue);padding-left:14px', html:
              '<span style="font-family:var(--font-data);font-size:12px;letter-spacing:0.06em;color:#c8cad0">CAP HEALTH&nbsp;&nbsp;<strong style="color:var(--bow-warning)">TIGHT</strong></span>' +
              '<span style="font-family:var(--font-data);font-size:12px;letter-spacing:0.06em;color:#c8cad0">OWNER&nbsp;&nbsp;<strong style="color:#fff">IN THE BUILDING</strong></span>' +
              '<span style="font-family:var(--font-data);font-size:12px;letter-spacing:0.06em;color:#c8cad0">FANS&nbsp;&nbsp;<strong style="color:var(--bow-orange)">RESTLESS</strong></span>' })
          ])
        ])
      ]),
      h('div', { style: 'overflow:hidden;border-top:1px solid var(--bow-dark-border);background:#0e0e10;white-space:nowrap' }, [
        h('div', { cls: 'wr-tickline', style: 'padding:10px 0;font-family:var(--font-data);font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:var(--bow-slate)', html: tickerInner + tickerInner })
      ])
    ]);
  }

  // 2 — Brief ---------------------------------------------------------------
  function viewBrief() {
    var teamPicked = !!state.teamId;
    var metricCards = Sim.METRIC_KEYS.map(function (k) {
      return h('div', { style: 'display:flex;flex-direction:column;gap:8px;padding:20px;border-left:1px solid var(--border-rule)' }, [
        h('span', { style: 'font-family:var(--font-display);font-weight:900;text-transform:uppercase;font-size:19px;letter-spacing:0.02em;color:var(--bow-ink)' }, Sim.METRIC_LABELS[k]),
        h('span', { style: 'font-family:var(--font-interface);font-size:13.5px;line-height:1.5;color:var(--bow-slate)' }, Sim.METRIC_HELP[k]),
        k === 'cash' ? h('span', { style: 'margin-top:auto;font-family:var(--font-data);font-size:10.5px;letter-spacing:0.06em;text-transform:uppercase;color:var(--bow-warning);background:var(--bow-warning-tint);padding:4px 7px;align-self:flex-start' }, '⌁ Luxury-tax line = 40') : null
      ]);
    });

    var teamCards = Data.TEAMS.map(function (t) {
      var selected = state.teamId === t.id;
      var cardStyle = 'text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:14px;padding:24px;background:var(--bow-white);'
        + 'border:1px solid ' + (selected ? 'var(--bow-blue)' : 'var(--border-rule)') + ';'
        + 'border-top:5px solid ' + t.colors.primary + ';border-radius:var(--radius-card);'
        + 'box-shadow:' + (selected ? '0 0 0 3px rgba(49,87,255,0.16)' : 'none') + ';transition:box-shadow 180ms,border-color 180ms;';
      var meters = Sim.METRIC_KEYS.map(function (k) {
        return h('div', { style: 'display:flex;align-items:center;gap:8px' }, [
          h('span', { style: 'flex:0 0 78px;font-family:var(--font-data);font-size:10px;letter-spacing:0.04em;text-transform:uppercase;color:var(--bow-slate)' }, Sim.METRIC_LABELS[k]),
          h('span', { style: 'flex:1;height:6px;background:#e7e4dc;display:block;position:relative' }, [
            h('span', { style: 'position:absolute;left:0;top:0;height:6px;background:var(--bow-ink);width:' + t.metrics[k] + '%' })
          ]),
          h('span', { style: 'flex:0 0 26px;text-align:right;font-family:var(--font-data);font-size:11px;font-weight:600' }, String(t.metrics[k]))
        ]);
      });
      return h('button', { cls: 'wr-pick', onClick: pickTeam(t.id), style: cardStyle }, [
        h('div', { style: 'display:flex;align-items:center;gap:12px' }, [
          h('span', { style: 'display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:4px;font-family:var(--font-display);font-weight:900;font-size:17px;letter-spacing:0.02em;color:#fff;background:' + t.colors.primary }, t.abbr),
          h('span', { style: 'display:flex;flex-direction:column;gap:2px' }, [
            h('span', { style: 'font-family:var(--font-display);font-weight:900;text-transform:uppercase;font-size:17px;line-height:1;letter-spacing:0.01em' }, t.name),
            h('span', { style: 'font-family:var(--font-data);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:var(--bow-blue)' }, t.tagline)
          ])
        ]),
        h('p', { style: 'margin:0;font-family:var(--font-interface);font-size:13.5px;line-height:1.5;color:#46474d' }, t.blurb),
        t.cornerstone ? h('span', { style: 'font-family:var(--font-data);font-size:10.5px;letter-spacing:0.04em;text-transform:uppercase;color:var(--bow-slate)', html: 'Built around <strong style="color:var(--bow-ink)">' + escapeHtml(t.cornerstone) + '</strong>' }) : null,
        h('div', { style: 'display:flex;flex-direction:column;gap:7px;margin-top:2px' }, meters),
        h('span', { style: 'margin-top:4px;font-family:var(--font-display);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;font-size:12px;color:' + (selected ? 'var(--bow-blue)' : 'var(--bow-slate)') }, selected ? '✓ Running this team' : 'Run this team')
      ]);
    });

    return h('div', { cls: 'wr-grain-dark', style: 'min-height:100vh;background:var(--bow-paper);color:var(--bow-ink)' }, [
      h('div', { style: 'display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 5vw;border-bottom:1px solid var(--border-rule)' }, [
        h('button', { cls: 'wr-link', onClick: function () { go('coldopen'); }, style: 'background:none;border:none;cursor:pointer;font-family:var(--font-data);font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:var(--bow-slate);padding:6px 0' }, '← Back'),
        h('div', { style: 'display:flex;align-items:center;gap:14px' }, [
          h('span', { style: 'font-family:var(--font-data);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--bow-blue)' }, 'Brief · Step 1 of 4'),
          h('span', { style: 'font-family:var(--font-display);font-weight:900;text-transform:uppercase;letter-spacing:0.02em;font-size:16px' }, 'BOW')
        ])
      ]),
      h('div', { style: 'max-width:1080px;margin:0 auto;padding:clamp(28px,5vw,56px) 5vw 120px' }, [
        h('div', { cls: 'wr-rise', style: 'font-family:var(--font-display);font-weight:700;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:var(--bow-blue);margin-bottom:14px' }, 'Your Assignment'),
        h('h1', { cls: 'wr-rise', style: 'margin:0;font-family:var(--font-editorial);font-weight:600;font-size:clamp(38px,5.6vw,68px);line-height:0.98;letter-spacing:-0.01em;max-width:16ch' }, 'You run the front office now.'),
        capLine(180),
        h('p', { cls: 'wr-rise-2', style: 'margin:0;max-width:60ch;font-family:var(--font-editorial);font-size:clamp(18px,2vw,22px);line-height:1.55;color:#33343a', html: "You're the <strong style=\"font-weight:700\">General Manager</strong>. It's the trade deadline, and you have one hour and one rule you can't ignore — the <strong style=\"font-weight:700\">salary cap</strong>. Build the best team you can. But every dollar you spend over the luxury-tax line costs you triple, and your owner is watching every move." }),

        h('div', { style: 'margin-top:48px;display:flex;align-items:baseline;gap:14px' }, [
          h('h2', { style: 'margin:0;font-family:var(--font-display);font-weight:900;text-transform:uppercase;font-size:clamp(22px,2.6vw,30px);letter-spacing:0.01em' }, "What You're Juggling"),
          h('span', { style: 'flex:1;height:2px;background:var(--bow-ink)' })
        ]),
        h('p', { style: 'margin:10px 0 22px;font-family:var(--font-interface);font-size:15px;color:var(--bow-slate);max-width:62ch' }, "Four numbers move every time you make a deal. Watch them trade off against each other — you can't win all four at once."),
        h('div', { cls: 'wr-grid-4', style: 'border:1px solid var(--border-rule);background:var(--bow-white)' }, metricCards),

        h('div', { style: 'margin-top:52px;display:flex;align-items:baseline;gap:14px' }, [
          h('h2', { style: 'margin:0;font-family:var(--font-display);font-weight:900;text-transform:uppercase;font-size:clamp(22px,2.6vw,30px);letter-spacing:0.01em' }, 'Pick Your Franchise'),
          h('span', { style: 'flex:1;height:2px;background:var(--bow-ink)' })
        ]),
        h('p', { style: 'margin:10px 0 22px;font-family:var(--font-interface);font-size:15px;color:var(--bow-slate);max-width:62ch' }, 'Each team starts in a different spot. One is already deep in the money. One has room to swing big. Choose your situation.'),
        h('div', { cls: 'wr-grid-3', style: 'gap:18px' }, teamCards),

        h('div', { style: 'margin-top:36px;display:flex;flex-wrap:wrap;gap:24px;align-items:flex-end;justify-content:space-between;padding-top:28px;border-top:1px solid var(--border-rule)' }, [
          h('label', { style: 'display:flex;flex-direction:column;gap:8px;flex:1;min-width:240px;max-width:340px' }, [
            h('span', { style: 'font-family:var(--font-data);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--bow-slate)', html: 'GM Name <span style="color:#b3b0a8">(optional)</span>' }),
            h('input', { type: 'text', maxlength: '40', placeholder: 'e.g. Coach Riley', value: state.gmName, onInput: setGm, style: 'font-family:var(--font-interface);font-size:16px;padding:12px 14px;border:1px solid var(--border-rule);border-radius:var(--radius-control);background:var(--bow-white);color:var(--bow-ink);outline:none' })
          ]),
          h('div', { style: 'display:flex;flex-direction:column;gap:8px;align-items:flex-end' }, [
            h('span', { style: 'font-family:var(--font-data);font-size:12px;color:' + (teamPicked ? 'var(--bow-positive)' : 'var(--bow-slate)') }, teamPicked ? team().name : 'Pick a team to continue.'),
            h('button', { cls: 'wr-cta', onClick: toIntel, attrs: teamPicked ? null : { disabled: 'disabled' }, style: 'background:' + (teamPicked ? 'var(--bow-blue)' : '#c7c4bc') + ';color:#fff;border:none;border-radius:var(--radius-control);font-family:var(--font-display);font-weight:700;text-transform:uppercase;letter-spacing:0.04em;font-size:18px;padding:15px 32px;cursor:' + (teamPicked ? 'pointer' : 'not-allowed') }, 'Walk Into the War Room →')
          ])
        ])
      ])
    ]);
  }

  // 3 — Intel ---------------------------------------------------------------
  function intelSources() {
    var t = team();
    var m = snaps().start;
    var p = t ? t.players : {};
    var story = Data.getStory(state.teamId); // bespoke per-team copy (Milwaukee, etc.)
    var cornerstone = (t && t.cornerstone) || (p.star || 'your star');
    var overText = m.cash < Sim.TAX_LINE
      ? 'You are already OVER the luxury-tax line. Every dollar you add now is taxed — it costs you roughly triple.'
      : 'You are UNDER the luxury-tax line with room to spend. But a big contract can flip that in one move.';
    var chemText = m.chemistry >= 60 ? 'The locker room is tight. A big personality change is a real risk to that.'
      : 'Chemistry is shaky. The group needs stability more than star power right now.';
    var fanText = m.clout >= 70 ? 'Fans are buzzing and expect you to keep swinging. Stand pat and the energy drains fast.'
      : 'The building has gone quiet. Fans want a reason to believe — a statement move would bring them back.';
    return [
      { id: 'capsheet', name: 'The Cap Sheet', kicker: 'Finances', q: 'How much room do you actually have?',
        body: story.capsheet || (overText + ' This is the single number that turns a smart roster into an expensive disaster.'),
        facts: [ { label: 'Cap Space', value: String(m.cash), tone: m.cash < Sim.TAX_LINE ? 'negative' : 'positive' }, { label: 'Tax Line', value: '40' }, { label: 'Status', value: m.cash < Sim.TAX_LINE ? 'OVER' : 'UNDER', tone: m.cash < Sim.TAX_LINE ? 'negative' : 'positive' } ],
        watch: 'Watch what each trade does to Cap Space before you fall in love with the talent.' },
      { id: 'locker', name: 'The Locker Room', kicker: 'Players', q: 'Is the group actually healthy?',
        body: story.locker || ('Your cornerstone, ' + cornerstone + ', is the engine of everything. ' + chemText),
        facts: [ { label: 'Wins', value: String(m.wins) }, { label: 'Chemistry', value: String(m.chemistry), tone: m.chemistry >= 60 ? 'positive' : 'warning' }, { label: 'Cornerstone', value: cornerstone.split(' ').slice(-1)[0].toUpperCase() } ],
        watch: 'A move that adds talent can still cost you wins if it breaks up a group that already fits.' },
      { id: 'stands', name: 'The Stands', kicker: 'Fans & Media', q: 'What are the fans paying for?',
        body: story.stands || (fanText + ' Buzz keeps the building full and the sponsors happy — it is real money, just slower money.'),
        facts: [ { label: 'Buzz', value: String(m.clout), tone: m.clout >= 70 ? 'positive' : 'warning' }, { label: 'Mood', value: m.clout >= 70 ? 'HYPED' : 'RESTLESS', tone: m.clout >= 70 ? 'positive' : 'warning' } ],
        watch: 'The safe move protects your books but can quietly cost you Buzz — and fans have long memories.' },
      { id: 'analyst', name: 'The BOW Analyst', kicker: 'Analysis', q: 'What does the smart money say?',
        body: story.analyst || 'Here is the cold math: every great roster eventually gets the same bill. The question is never just "can I add talent?" It is "can I afford the bill when it comes due — and is the prize worth it?" There is no clean answer here. There is only the trade-off you can defend.',
        facts: [ { label: 'Read', value: 'NO FREE LUNCH' }, { label: 'Rule', value: 'CAP = WEAPON', tone: 'info' } ],
        watch: 'Pick the move that matches your situation — not the move that looks the flashiest.' }
    ];
  }
  function factTone(tone) {
    return tone === 'negative' ? 'var(--bow-negative)' : (tone === 'positive' ? 'var(--bow-positive)' : (tone === 'warning' ? 'var(--bow-warning)' : (tone === 'info' ? 'var(--bow-blue)' : '#fff')));
  }
  function viewIntel() {
    var sources = intelSources();
    var active = sources.filter(function (s) { return s.id === state.intelActive; })[0] || sources[0];

    var sourceList = sources.map(function (s) {
      var reviewed = state.intelReviewed.indexOf(s.id) >= 0;
      var isActive = state.intelActive === s.id;
      return h('button', { cls: 'wr-opt', onClick: openSource(s.id), style: 'text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:5px;padding:15px 16px;border-radius:var(--radius-control);color:#fff;background:' + (isActive ? 'rgba(49,87,255,0.14)' : 'transparent') + ';border:1px solid ' + (isActive ? 'var(--bow-blue)' : 'var(--bow-dark-border)') + ';transition:border-color 180ms,background 180ms' }, [
        h('span', { style: 'display:flex;align-items:center;justify-content:space-between;gap:8px' }, [
          h('span', { style: 'font-family:var(--font-data);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--bow-orange)' }, s.kicker),
          h('span', { style: 'font-family:var(--font-data);font-size:10px;letter-spacing:0.06em;color:' + (reviewed ? 'var(--bow-positive)' : 'var(--bow-slate)') }, reviewed ? '✓ Read' : 'New')
        ]),
        h('span', { style: 'font-family:var(--font-display);font-weight:900;text-transform:uppercase;font-size:18px;line-height:1;letter-spacing:0.01em' }, s.name),
        h('span', { style: 'font-family:var(--font-interface);font-size:12.5px;line-height:1.4;color:#9a9da6' }, s.q)
      ]);
    });

    var facts = active.facts.map(function (f) {
      return h('div', { style: 'flex:1 1 auto;min-width:110px;display:flex;flex-direction:column;gap:3px;padding:12px 18px;border-left:1px solid var(--bow-dark-border)' }, [
        h('span', { style: 'font-family:var(--font-display);font-weight:600;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#9a9da6' }, f.label),
        h('span', { style: 'font-family:var(--font-data);font-weight:600;font-size:18px;color:' + factTone(f.tone) }, f.value)
      ]);
    });

    var panel = h('div', { style: 'border:1px solid var(--bow-dark-border);border-top:4px solid var(--bow-blue);border-radius:var(--radius-card);background:var(--bow-dark-surface);padding:clamp(20px,2.6vw,30px);display:flex;flex-direction:column;gap:16px;min-height:340px' }, [
      h('div', { style: 'font-family:var(--font-data);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:var(--bow-orange)' }, active.kicker + ' · ' + active.name),
      h('h2', { style: 'margin:0;font-family:var(--font-editorial);font-weight:600;font-size:clamp(24px,2.8vw,32px);line-height:1.12' }, active.q),
      h('div', { style: 'display:flex;flex-wrap:wrap;border:1px solid var(--bow-dark-border)' }, facts),
      h('p', { style: 'margin:0;font-family:var(--font-interface);font-size:16px;line-height:1.6;color:#d3d5db' }, active.body),
      h('div', { style: 'margin-top:auto;border-left:3px solid var(--bow-blue);padding:4px 0 4px 14px' }, [
        h('span', { style: 'font-family:var(--font-data);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:var(--bow-blue);display:block;margin-bottom:3px' }, 'What to watch'),
        h('span', { style: 'font-family:var(--font-editorial);font-style:italic;font-size:16px;line-height:1.45;color:#fff' }, active.watch)
      ])
    ]);

    return h('div', { cls: 'wr-grain', style: 'min-height:100vh;background:var(--bow-ink);color:var(--bow-white);display:flex;flex-direction:column' }, [
      topbar('← Brief', function () { go('brief'); }, [
        h('span', { style: 'font-family:var(--font-data);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--bow-orange)' }, 'Intel · Step 2 of 4'),
        h('span', { style: 'font-family:var(--font-data);font-size:12px;letter-spacing:0.06em;color:#c8cad0', html: 'DEADLINE <strong style="color:#fff">58:00</strong>' })
      ]),
      scoreboardStrip('Front Office Dashboard', dashMeters(snaps().start), false),
      h('div', { style: 'max-width:1180px;width:100%;margin:0 auto;padding:clamp(22px,3.5vw,42px) 4vw 40px;flex:1' }, [
        h('div', { style: 'font-family:var(--font-display);font-weight:700;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:var(--bow-blue);margin-bottom:6px' }, 'Gather Your Intel'),
        h('h1', { style: 'margin:0 0 4px;font-family:var(--font-editorial);font-weight:600;font-size:clamp(28px,3.6vw,42px);line-height:1.05;max-width:20ch' }, 'Open the files before you make the call.'),
        h('p', { style: 'margin:0 0 26px;font-family:var(--font-interface);font-size:15px;color:#9a9da6;max-width:60ch' }, "Four people see this deadline differently. Tap each one — every file points to a different trade-off you'll have to weigh."),
        h('div', { cls: 'wr-split-intel', style: 'gap:22px;align-items:start' }, [
          h('div', { style: 'display:flex;flex-direction:column;gap:10px' }, sourceList),
          panel
        ]),
        h('div', { style: 'margin-top:30px;display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between;padding-top:22px;border-top:1px solid var(--bow-dark-border)' }, [
          h('span', { style: 'font-family:var(--font-data);font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#9a9da6', html: 'Intel reviewed · <strong style="color:#fff">' + state.intelReviewed.length + '</strong> of 4' }),
          cta('Go to the Decision Desk →', function () { go('decision1'); })
        ])
      ])
    ]);
  }

  // Decision desk option card (shared by R1 + R2) ---------------------------
  function optionCard(opt, selected, onClick, opts) {
    opts = opts || {};
    var bg = selected ? 'rgba(49,87,255,0.12)' : '#141417';
    var border = selected ? 'var(--bow-blue)' : 'var(--bow-dark-border)';
    var shadow = selected ? '0 0 0 3px rgba(49,87,255,0.14)' : 'none';
    var cardStyle = 'text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:' + (opts.gap || 12) + 'px;padding:20px;border-radius:var(--radius-control);color:#fff;background:' + bg + ';border:1px solid ' + border + ';box-shadow:' + shadow + ';transition:border-color 180ms,background 180ms,box-shadow 180ms;';
    var chips = h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;padding-top:' + (opts.chipPad || 4) + 'px;border-top:1px solid var(--bow-dark-border)' }, tradeChips(opt.deltas).map(function (c) {
      return h('span', { style: 'font-family:var(--font-data);font-size:11px;font-weight:600;letter-spacing:0.04em;color:' + c.color }, c.label + ' ' + c.text);
    }));
    var children = [
      h('div', { style: 'display:flex;align-items:center;justify-content:space-between;gap:10px' }, [
        h('span', { style: 'font-family:var(--font-display);font-weight:900;text-transform:uppercase;font-size:' + (opts.titleSize || 21) + 'px;line-height:1;letter-spacing:0.01em' }, opt.label),
        h('span', { style: 'font-family:var(--font-data);font-weight:600;font-size:' + (opts.riskSize || 10) + 'px;letter-spacing:0.06em;text-transform:uppercase;padding:4px 8px;border-radius:3px;color:' + riskTone(opt.risk) + ';background:' + riskTint(opt.risk) }, opt.risk + (opts.riskWord ? ' Risk' : ''))
      ]),
      h('p', { style: 'margin:0;font-family:var(--font-interface);font-size:13.5px;line-height:1.5;color:#c8cad0' }, opt.blurb)
    ];
    if (opts.showGiveGet) {
      children.push(h('div', { style: 'display:flex;flex-direction:column;gap:5px' }, [
        h('span', { style: 'font-family:var(--font-interface);font-size:12.5px;color:#9a9da6', html: '<span style="font-family:var(--font-data);font-size:9.5px;letter-spacing:0.08em;text-transform:uppercase;color:var(--bow-negative);margin-right:7px">Give</span>' + escapeHtml(opt.give) }),
        h('span', { style: 'font-family:var(--font-interface);font-size:12.5px;color:#fff', html: '<span style="font-family:var(--font-data);font-size:9.5px;letter-spacing:0.08em;text-transform:uppercase;color:var(--bow-positive);margin-right:7px">Get</span>' + escapeHtml(opt.get) })
      ]));
    } else {
      children.push(h('span', { style: 'font-family:var(--font-interface);font-size:12px;line-height:1.45;color:#9a9da6', html: '<span style="font-family:var(--font-data);font-size:9px;letter-spacing:0.08em;text-transform:uppercase;color:var(--bow-warning);margin-right:6px">Cost</span>' + escapeHtml(opt.cost) }));
    }
    children.push(chips);
    children.push(h('span', { style: 'font-family:var(--font-display);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;font-size:12px;color:' + (selected ? 'var(--bow-blue)' : '#9a9da6') }, selected ? (opts.selectedLabel || '✓ On the table') : (opts.idleLabel || 'Put this on the table')));
    return h('button', { cls: 'wr-opt', onClick: onClick, style: cardStyle }, children);
  }

  // 4 — Decision Desk · Round 1 ---------------------------------------------
  function viewDecision1() {
    var sel = state.selectedTradeId;
    var s = snaps();
    var live = dashMetersCompare(s.start, sel ? s.afterTrade : s.start);
    var cards = trades().map(function (t) {
      return optionCard(t, sel === t.id, selectTrade(t.id), { showGiveGet: true, riskWord: true, titleSize: 21, selectedLabel: '✓ On the table', idleLabel: 'Put this on the table' });
    });
    return h('div', { cls: 'wr-grain', style: 'min-height:100vh;background:var(--bow-ink);color:var(--bow-white);display:flex;flex-direction:column' }, [
      topbar('← Intel', function () { go('intel'); }, [
        h('span', { style: 'font-family:var(--font-data);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--bow-orange)' }, 'Decision · Step 3 of 4'),
        h('span', { style: 'font-family:var(--font-data);font-size:12px;letter-spacing:0.06em;color:#c8cad0', html: 'DEADLINE <strong style="color:#fff">12:00</strong>' }),
        startOverLink()
      ]),
      scoreboardStrip('Projected impact', live, true),
      h('div', { style: 'max-width:1180px;width:100%;margin:0 auto;padding:clamp(22px,3.5vw,40px) 4vw 40px;flex:1' }, [
        h('div', { style: 'display:flex;align-items:center;gap:10px;margin-bottom:6px' }, [
          h('span', { style: 'font-family:var(--font-data);font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--bow-orange)' }, 'Decision Desk'),
          h('span', { style: 'font-family:var(--font-data);font-size:12px;letter-spacing:0.12em;color:#9a9da6' }, '· Round 01')
        ]),
        h('h1', { style: 'margin:0 0 4px;font-family:var(--font-editorial);font-weight:600;font-size:clamp(30px,4vw,48px);line-height:1.02;max-width:18ch' }, 'Make your move.'),
        h('p', { style: 'margin:0 0 24px;font-family:var(--font-interface);font-size:15px;color:#9a9da6;max-width:64ch' }, "Tap a deal to see it ripple through your numbers above. There's no clean winner — every option is a real strategy with a real cost."),
        h('div', { cls: 'wr-grid-2', style: 'gap:16px' }, cards),
        h('div', { style: 'margin-top:30px;display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between;padding-top:22px;border-top:1px solid var(--bow-dark-border)' }, [
          h('span', { style: 'font-family:var(--font-data);font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#9a9da6', html: 'Your call · <strong style="color:#fff">' + escapeHtml(sel ? tradeById(sel).label : 'Nothing on the table yet') + '</strong>' }),
          cta('Lock In This Trade →', lockTrade, { bg: sel ? 'var(--bow-orange)' : '#3a3a42', disabled: !sel })
        ])
      ])
    ]);
  }

  // 5 — Reveal · Round 1 ----------------------------------------------------
  function revealView() {
    var tr = tradeById(state.selectedTradeId); if (!tr) return null;
    var nick = nickOf(team());
    var s = snaps(); var start = s.start, after = s.afterTrade;
    var gainK = 'wins', lossK = 'cash', gMax = -99, lMin = 99;
    Sim.METRIC_KEYS.forEach(function (k) { var d = tr.deltas[k] || 0; if (d > gMax) { gMax = d; gainK = k; } if (d < lMin) { lMin = d; lossK = k; } });
    var H = {
      star: { dek: 'They paid a king’s ransom and crossed every line to do it. The ' + nick + ' just told the league they are chasing a banner — right now.', a: 'This is the move that wins titles or sinks front offices. There is no middle. You bought star power and a tax bill in the same breath.' },
      depth: { dek: 'No fireworks — just a smart, fair-priced deal that makes the ' + nick + ' harder to beat when the games get heavy.', a: 'Unglamorous and underrated. You added real basketball value without lighting your cap sheet on fire. Quietly, this is how contenders get built.' },
      future: { dek: 'They cashed in a veteran for picks and breathing room. The ' + nick + ' are betting on tomorrow over tonight.', a: 'Discipline is a strategy. You protected the books and stacked future assets — but now you have to sell your fans on patience.' },
      standpat: { dek: 'The phone rang all day. The ' + nick + ' did not blink. Sometimes the boldest move is no move at all.', a: 'Conviction or cold feet? You kept your group intact and your books clean — but the fans wanted a statement, and silence is loud.' }
    };
    var headMap = { star: nick + ' GO ALL IN', depth: nick + ' GET TOUGHER', future: nick + ' PLAY THE LONG GAME', standpat: nick + ' STAND PAT' };
    var info = H[tr.id] || H.standpat;
    // A team with its own storyline (Milwaukee) overrides the generic dek.
    var storyReveal = Data.getStory(state.teamId).reveal || {};
    var dek = storyReveal[tr.id] || info.dek;
    var gainTxt = gMax > 0 ? Sim.METRIC_LABELS[gainK] + ' jumped ' + Sim.signed(gMax) : 'you held your ground';
    var lossTxt = lMin < 0 ? Sim.METRIC_LABELS[lossK] + ' took the hit at ' + Sim.signed(lMin) : 'nothing slipped badly';
    return {
      headline: headMap[tr.id] || (nick + ' MAKE THE CALL'), dek: dek, analyst: info.a,
      causal: 'Because you chose to ' + tr.label.toLowerCase() + ', ' + gainTxt + ' — but ' + lossTxt + '. That is the trade-off you signed for.',
      meters: revealMeters(start, after), tax: Sim.taxNote(start, after)
    };
  }
  function revealMeterCell(d) {
    return h('div', { style: 'display:flex;flex-direction:column;gap:9px;padding:18px 20px;border-left:1px solid var(--bow-dark-border)' }, [
      h('span', { style: 'font-family:var(--font-display);font-weight:700;text-transform:uppercase;font-size:12px;letter-spacing:0.06em;color:#9a9da6' }, d.label),
      h('div', { style: 'display:flex;align-items:baseline;gap:8px' }, [
        h('span', { style: 'font-family:var(--font-data);font-weight:700;font-size:30px;line-height:1;color:' + d.barColor }, String(d.to)),
        h('span', { style: 'font-family:var(--font-data);font-size:12px;font-weight:600;color:' + d.deltaColor }, d.deltaText)
      ]),
      h('span', { style: 'position:relative;height:7px;background:rgba(255,255,255,0.12);display:block' }, [
        h('span', { cls: 'wr-bar', style: 'position:absolute;left:0;top:0;height:7px;background:' + d.barColor + ';width:' + d.pct + '%' }),
        h('span', { style: 'position:absolute;top:-3px;width:2px;height:13px;background:#fff;opacity:0.5;left:' + d.fromPct + '%' }),
        d.isCash ? h('span', { style: 'position:absolute;left:40%;top:-3px;width:2px;height:13px;background:var(--bow-warning)' }) : null
      ]),
      h('span', { style: 'font-family:var(--font-data);font-size:10px;letter-spacing:0.04em;color:var(--bow-slate)' }, 'was ' + d.from)
    ]);
  }
  function viewReveal1() {
    var r = revealView();
    if (!r) return redirect('decision1');
    return h('div', { cls: 'wr-grain', style: 'min-height:100vh;background:var(--bow-ink);color:var(--bow-white);display:flex;flex-direction:column' }, [
      h('div', { style: 'max-width:1100px;width:100%;margin:0 auto;padding:clamp(34px,6vh,72px) 5vw 64px' }, [
        h('div', { cls: 'wr-rise', style: 'font-family:var(--font-display);font-weight:700;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:var(--bow-orange);display:flex;align-items:center;gap:10px;margin-bottom:16px' }, [
          h('span', { style: 'width:8px;height:8px;border-radius:50%;background:var(--bow-orange)' }), 'The League Reacts · Round 01 Result'
        ]),
        h('h1', { cls: 'wr-rise', style: 'margin:0;font-family:var(--font-display);font-weight:900;text-transform:uppercase;letter-spacing:-0.01em;font-size:clamp(46px,7vw,96px);line-height:0.88' }, r.headline),
        capLine(220),
        h('p', { cls: 'wr-rise-2', style: 'margin:0 0 38px;font-family:var(--font-editorial);font-size:clamp(20px,2.4vw,26px);line-height:1.45;color:#d3d5db;max-width:46ch' }, r.dek),
        h('div', { style: 'font-family:var(--font-data);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#9a9da6;margin-bottom:14px' }, 'How your numbers moved'),
        h('div', { cls: 'wr-grid-4', style: 'border:1px solid var(--bow-dark-border);background:var(--bow-dark-surface);margin-bottom:36px' }, r.meters.map(revealMeterCell)),
        h('div', { cls: 'wr-split-even', style: 'gap:22px;align-items:stretch' }, [
          h('div', { style: 'display:flex;flex-direction:column;gap:16px' }, [
            h('div', { style: 'border-left:3px solid var(--bow-blue);padding:2px 0 2px 16px' }, [
              h('span', { style: 'font-family:var(--font-data);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--bow-blue);display:block;margin-bottom:5px' }, 'The Cause & Effect'),
              h('p', { style: 'margin:0;font-family:var(--font-interface);font-size:16px;line-height:1.6;color:#e6e7eb' }, r.causal)
            ]),
            h('div', { style: 'display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border:1px solid ' + (r.tax.tone === 'negative' ? 'var(--bow-negative)' : 'var(--bow-positive)') + ';border-radius:var(--radius-control);background:rgba(255,255,255,0.02)' }, [
              h('span', { style: 'font-family:var(--font-data);font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;padding:4px 8px;border-radius:3px;white-space:nowrap;color:#fff;background:' + (r.tax.tone === 'negative' ? 'var(--bow-negative)' : 'var(--bow-positive)') }, r.tax.label),
              h('span', { style: 'font-family:var(--font-interface);font-size:14px;line-height:1.5;color:#e6e7eb' }, r.tax.text)
            ])
          ]),
          h('div', { style: 'border:1px solid var(--bow-dark-border);border-top:4px solid var(--bow-orange);border-radius:var(--radius-card);background:#121215;padding:24px;display:flex;flex-direction:column;gap:12px' }, [
            h('span', { style: 'font-family:var(--font-data);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:var(--bow-orange)' }, "Analyst's Take"),
            h('p', { style: 'margin:0;font-family:var(--font-editorial);font-style:italic;font-size:20px;line-height:1.4;color:#fff' }, '"' + r.analyst + '"'),
            h('span', { style: 'font-family:var(--font-data);font-size:12px;letter-spacing:0.06em;color:#9a9da6;margin-top:auto' }, '— BOW Analyst')
          ])
        ]),
        h('div', { style: 'margin-top:34px;display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between' }, [
          h('span', { style: 'font-family:var(--font-interface);font-size:14px;color:#9a9da6;max-width:42ch' }, "The deal is done. But the deadline isn't over — and someone upstairs has thoughts."),
          cta('Take It to Ownership →', toPressure)
        ])
      ])
    ]);
  }

  // 6 — Pressure ------------------------------------------------------------
  function viewPressure() {
    var p = pressure();
    if (!p) return redirect('decision1');
    var ek = Object.keys(p.effect || {})[0];
    var effectNote = ek ? (Sim.METRIC_LABELS[ek] + ' slipped ' + Sim.signed(p.effect[ek]) + ' as the news broke.') : '';
    var tickerInner = '<span style="padding:0 26px">Breaking · Ownership steps into the war room</span><span>●</span>';
    return h('div', { cls: 'wr-grain', style: 'min-height:100vh;background:var(--bow-ink);color:var(--bow-white);display:flex;flex-direction:column;justify-content:center' }, [
      h('div', { style: 'overflow:hidden;background:var(--bow-orange);white-space:nowrap' }, [
        h('div', { cls: 'wr-tickline-fast', style: 'padding:9px 0;font-family:var(--font-display);font-weight:700;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;color:#fff', html: tickerInner + tickerInner + tickerInner + tickerInner })
      ]),
      h('div', { style: 'max-width:1000px;width:100%;margin:0 auto;padding:clamp(34px,7vh,80px) 5vw' }, [
        h('div', { cls: 'wr-rise', style: 'font-family:var(--font-data);font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:var(--bow-orange);margin-bottom:18px' }, 'Pressure Moment · ' + p.title),
        h('div', { cls: 'wr-rise', style: 'display:flex;gap:22px;align-items:flex-start' }, [
          h('span', { style: 'font-family:var(--font-editorial);font-size:90px;line-height:0.7;color:var(--bow-orange);flex:0 0 auto' }, '“'),
          h('div', { style: 'display:flex;flex-direction:column;gap:18px' }, [
            h('p', { style: 'margin:0;font-family:var(--font-editorial);font-weight:600;font-size:clamp(28px,4.4vw,52px);line-height:1.08;color:#fff' }, p.quote),
            h('span', { style: 'font-family:var(--font-data);font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#9a9da6' }, '— ' + p.who)
          ])
        ]),
        capLine(200, 'var(--bow-orange)'),
        h('div', { cls: 'wr-rise-2 wr-split-pressure', style: 'gap:22px;align-items:stretch' }, [
          h('p', { style: 'margin:0;font-family:var(--font-interface);font-size:17px;line-height:1.6;color:#d3d5db;align-self:center' }, [
            p.text,
            effectNote ? h('span', { style: 'display:block;margin-top:10px;font-family:var(--font-data);font-size:13px;color:var(--bow-warning)' }, effectNote) : null
          ]),
          h('div', { style: 'border:1px solid var(--bow-dark-border);border-left:4px solid var(--bow-blue);border-radius:var(--radius-control);background:var(--bow-dark-surface);padding:20px;display:flex;flex-direction:column;gap:8px;justify-content:center' }, [
            h('span', { style: 'font-family:var(--font-data);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9a9da6' }, 'Now most important'),
            h('span', { style: 'font-family:var(--font-display);font-weight:900;text-transform:uppercase;font-size:38px;line-height:0.9;color:var(--bow-blue)' }, Sim.METRIC_LABELS[p.priority]),
            h('span', { style: 'font-family:var(--font-interface);font-size:13px;line-height:1.5;color:#9a9da6' }, "This is what ownership will judge your final move on. Weigh it heavily — but don't ignore the rest.")
          ])
        ]),
        h('div', { cls: 'wr-rise-3', style: 'margin-top:36px;display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between' }, [
          h('span', { style: 'font-family:var(--font-interface);font-size:14px;color:#9a9da6;max-width:44ch' }, "You've got one move left before the buzzer. Make it count — or protect what you built."),
          cta('Make Your Closing Move →', function () { go('decision2'); }, { bg: 'var(--bow-orange)' })
        ])
      ])
    ]);
  }

  // 7 — Decision Desk · Round 2 ---------------------------------------------
  function d2Context() {
    var after = snaps().afterPressure; var p = pressure();
    var base = after.cash < Sim.TAX_LINE ? 'You are over the luxury-tax line, so every new dollar stings.' : 'You still have a little room under the tax line.';
    var want = p ? (' Ownership is judging this on your ' + Sim.METRIC_LABELS[p.priority] + '.') : '';
    return base + want;
  }
  function viewDecision2() {
    var sel = state.round2Id;
    var s = snaps();
    var live = dashMetersCompare(s.afterPressure, sel ? s.final : s.afterPressure);
    var cards = Data.ROUND2_MOVES.map(function (t) {
      return optionCard(t, sel === t.id, selectR2(t.id), { gap: 11, titleSize: 18, riskSize: 9.5, selectedLabel: '✓ Locked in', idleLabel: 'Choose this move' });
    });
    return h('div', { cls: 'wr-grain', style: 'min-height:100vh;background:var(--bow-ink);color:var(--bow-white);display:flex;flex-direction:column' }, [
      topbar('← Ownership', function () { go('pressure'); }, [
        h('span', { style: 'font-family:var(--font-data);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--bow-orange)' }, 'Closing Move · Round 02'),
        h('span', { style: 'font-family:var(--font-data);font-size:12px;letter-spacing:0.06em;color:#c8cad0', html: 'DEADLINE <strong style="color:var(--bow-orange)">02:00</strong>' }),
        startOverLink()
      ]),
      scoreboardStrip('After the trade', live, true),
      h('div', { style: 'max-width:1100px;width:100%;margin:0 auto;padding:clamp(22px,3.5vw,40px) 4vw 40px;flex:1' }, [
        h('div', { style: 'display:flex;align-items:center;gap:10px;margin-bottom:6px' }, [
          h('span', { style: 'font-family:var(--font-data);font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--bow-orange)' }, 'Decision Desk'),
          h('span', { style: 'font-family:var(--font-data);font-size:12px;letter-spacing:0.12em;color:#9a9da6' }, '· Round 02 · Final Hour')
        ]),
        h('h1', { style: 'margin:0 0 8px;font-family:var(--font-editorial);font-weight:600;font-size:clamp(28px,3.8vw,46px);line-height:1.04;max-width:20ch' }, 'One move left. Adjust — or hold the line.'),
        h('div', { style: 'display:inline-flex;align-items:center;gap:10px;margin-bottom:22px;padding:9px 14px;border:1px solid var(--bow-dark-border);border-left:3px solid var(--bow-blue);border-radius:var(--radius-control);background:rgba(255,255,255,0.02)' }, [
          h('span', { style: 'font-family:var(--font-data);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--bow-blue)' }, 'Where you stand'),
          h('span', { style: 'font-family:var(--font-interface);font-size:13.5px;color:#e6e7eb' }, d2Context())
        ]),
        h('div', { cls: 'wr-grid-3', style: 'gap:16px' }, cards),
        h('div', { style: 'margin-top:30px;display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between;padding-top:22px;border-top:1px solid var(--bow-dark-border)' }, [
          h('span', { style: 'font-family:var(--font-data);font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#9a9da6', html: 'Closing move · <strong style="color:#fff">' + escapeHtml(sel ? round2ById(sel).label : 'Undecided') + '</strong>' }),
          cta('Beat the Buzzer →', lockR2, { bg: sel ? 'var(--bow-orange)' : '#3a3a42', disabled: !sel })
        ])
      ])
    ]);
  }

  // 8 — Reveal · Round 2 (buzzer) -------------------------------------------
  function reveal2View() {
    var r2 = round2ById(state.round2Id); if (!r2) return null;
    var nick = nickOf(team());
    var s = snaps(); var base = s.afterPressure, after = s.final;
    var heads = { reinforce: nick + ' GO FOR THE THROAT', balance: nick + ' BALANCE THE BOOKS', steady: nick + ' TRUST THE ROOM' };
    var a = { reinforce: 'You used your last bullet. No leftovers, no regrets — this team is all-in.', balance: 'Unsexy and smart. You eased the tax pressure and kept yourself flexible for what comes next.', steady: 'You bet on chemistry over chaos. Continuity is a real edge when the playoffs get tight.' };
    return { headline: heads[r2.id] || (nick + ' CLOSE IT OUT'), analyst: a[r2.id] || a.steady, meters: revealMeters(base, after) };
  }
  function viewReveal2() {
    var r = reveal2View();
    if (!r) return redirect('decision2');
    var meterCells = r.meters.map(function (d) {
      return h('div', { style: 'display:flex;flex-direction:column;gap:8px;padding:16px 18px;border-left:1px solid var(--bow-dark-border)' }, [
        h('span', { style: 'font-family:var(--font-display);font-weight:700;text-transform:uppercase;font-size:11px;letter-spacing:0.06em;color:#9a9da6' }, d.label),
        h('div', { style: 'display:flex;align-items:baseline;gap:7px' }, [
          h('span', { style: 'font-family:var(--font-data);font-weight:700;font-size:26px;line-height:1;color:' + d.barColor }, String(d.to)),
          h('span', { style: 'font-family:var(--font-data);font-size:12px;font-weight:600;color:' + d.deltaColor }, d.deltaText)
        ]),
        h('span', { style: 'position:relative;height:6px;background:rgba(255,255,255,0.12);display:block' }, [
          h('span', { cls: 'wr-bar', style: 'position:absolute;left:0;top:0;height:6px;background:' + d.barColor + ';width:' + d.pct + '%' }),
          h('span', { style: 'position:absolute;top:-3px;width:2px;height:12px;background:#fff;opacity:0.5;left:' + d.fromPct + '%' }),
          d.isCash ? h('span', { style: 'position:absolute;left:40%;top:-3px;width:2px;height:12px;background:var(--bow-warning)' }) : null
        ])
      ]);
    });
    return h('div', { cls: 'wr-grain', style: 'min-height:100vh;background:var(--bow-ink);color:var(--bow-white);display:flex;flex-direction:column;justify-content:center' }, [
      h('div', { style: 'max-width:1040px;width:100%;margin:0 auto;padding:clamp(34px,6vh,72px) 5vw' }, [
        h('div', { cls: 'wr-rise', style: 'font-family:var(--font-data);font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:var(--bow-orange);margin-bottom:14px' }, 'The Buzzer · Round 02 Result'),
        h('h1', { cls: 'wr-rise', style: 'margin:0 0 22px;font-family:var(--font-display);font-weight:900;text-transform:uppercase;letter-spacing:-0.01em;font-size:clamp(42px,6.4vw,88px);line-height:0.88' }, r.headline),
        h('div', { cls: 'wr-grid-4', style: 'border:1px solid var(--bow-dark-border);background:var(--bow-dark-surface);margin-bottom:26px' }, meterCells),
        h('div', { cls: 'wr-rise-2', style: 'border-left:3px solid var(--bow-orange);padding:6px 0 6px 18px;margin-bottom:34px' }, [
          h('p', { style: 'margin:0;font-family:var(--font-editorial);font-style:italic;font-size:clamp(19px,2.2vw,24px);line-height:1.4;color:#fff;max-width:48ch' }, '"' + r.analyst + '"'),
          h('span', { style: 'font-family:var(--font-data);font-size:12px;letter-spacing:0.06em;color:#9a9da6;display:block;margin-top:8px' }, '— BOW Analyst')
        ]),
        h('div', { style: 'display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between' }, [
          h('span', { style: 'font-family:var(--font-interface);font-size:14px;color:#9a9da6' }, 'The deadline has passed. The story writes itself now.'),
          cta("See Tomorrow's Front Page →", function () { go('frontpage'); })
        ])
      ])
    ]);
  }

  // 9 — Front page ----------------------------------------------------------
  function reportView() {
    var tr = tradeById(state.selectedTradeId);
    var r2 = round2ById(state.round2Id);
    var t = team(); if (!t) return null;
    var nick = nickOf(t);
    var p = pressure(); var priority = p ? p.priority : 'wins';
    var final = snaps().final;
    var score = Sim.computeScore(final, priority);
    var strongest = Sim.strongestMetric(final);
    var weakest = Sim.weakestMetric(final);
    var over = final.cash < Sim.TAX_LINE;
    var head = Sim.frontpageHeadline(final, nick);
    var badge = Sim.badgeFor(score);
    var closePhrase = { reinforce: 'pushed the chips in', balance: 'protected the budget', steady: 'trusted the room' }[r2 ? r2.id : 'steady'];
    var delivered = final[priority] >= 60;
    return {
      headline: head.head, dek: head.dek, teamName: t.name,
      gm: (state.gmName || '').trim() || 'GM',
      strategyName: Sim.strategyNameFor(tr ? tr.id : 'standpat'), closingPhrase: closePhrase,
      score: score, badgeLabel: badge.label,
      metrics: dashMeters(final),
      prioritized: delivered ? ('You read the room. Ownership wanted ' + Sim.METRIC_LABELS[priority] + ', and you delivered (' + final[priority] + ').') : ('Ownership wanted ' + Sim.METRIC_LABELS[priority] + '. You chose a different path (' + final[priority] + ') — a fair trade-off you can defend.'),
      strongPart: 'Your ' + Sim.METRIC_LABELS[strongest] + ' is the strongest part of your team, sitting at ' + final[strongest] + '.',
      tradeoff: over ? 'You accepted a luxury-tax bill to get here — the price of going for it.' : ('You accepted a lower ' + Sim.METRIC_LABELS[weakest] + ' (' + final[weakest] + ') to keep everything else in balance.'),
      nextMove: over ? 'Next, a real exec hunts for a cheap salary dump to ease the tax before it snowballs into next season.' : 'Next, a real exec turns that cap space into one more difference-maker on the buyout market.',
      memo: state.memo
    };
  }
  function reportBlock(label, body, color) {
    return h('div', {}, [
      h('span', { style: 'font-family:var(--font-display);font-weight:900;text-transform:uppercase;font-size:13px;letter-spacing:0.1em;color:' + color + ';display:block;margin-bottom:6px' }, label),
      h('p', { style: 'margin:0;font-family:var(--font-interface);font-size:16px;line-height:1.6;color:#2a2b30' }, body)
    ]);
  }
  function viewFrontpage() {
    var rep = reportView();
    if (!rep) return redirect('decision1');
    var finalBars = rep.metrics.map(function (d) {
      return h('div', { style: 'display:flex;align-items:center;gap:10px' }, [
        h('span', { style: 'flex:0 0 78px;font-family:var(--font-data);font-size:10.5px;letter-spacing:0.04em;text-transform:uppercase;color:#9a9da6' }, d.label),
        h('span', { style: 'flex:1;height:7px;background:rgba(255,255,255,0.14);display:block;position:relative' }, [
          h('span', { style: 'position:absolute;left:0;top:0;height:7px;background:' + d.barColor + ';width:' + d.pct + '%' })
        ]),
        h('span', { style: 'flex:0 0 26px;text-align:right;font-family:var(--font-data);font-size:13px;font-weight:600;color:' + d.barColor }, String(d.val))
      ]);
    });
    return h('div', { cls: 'wr-grain-dark', style: 'min-height:100vh;background:var(--bow-paper);color:var(--bow-ink)' }, [
      h('div', { style: 'max-width:1140px;margin:0 auto;padding:0 5vw 110px' }, [
        h('div', { style: 'display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:3px solid var(--bow-ink);padding:20px 0 12px;flex-wrap:wrap' }, [
          h('span', { style: 'font-family:var(--font-display);font-weight:900;text-transform:uppercase;letter-spacing:0.02em;font-size:clamp(26px,3.6vw,40px);line-height:1' }, 'The BOW Dispatch'),
          h('span', { style: 'font-family:var(--font-data);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:var(--bow-slate);text-align:right', html: 'Trade Deadline · Final Edition<br>' + escapeHtml(rep.teamName) + ' Front Office' })
        ]),
        h('div', { style: 'border-bottom:1px solid var(--bow-ink);padding:5px 0;margin-bottom:26px;display:flex;justify-content:space-between;font-family:var(--font-data);font-size:10.5px;letter-spacing:0.1em;text-transform:uppercase;color:var(--bow-slate)' }, [
          h('span', {}, 'Vol. 101 · No. 2'), h('span', {}, 'Front Office Intelligence'), h('span', {}, 'Filed by ' + rep.gm)
        ]),
        h('div', { cls: 'wr-rise', style: 'font-family:var(--font-display);font-weight:700;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:var(--bow-orange);margin-bottom:12px' }, 'The Verdict'),
        h('h1', { cls: 'wr-rise', style: 'margin:0;font-family:var(--font-display);font-weight:900;text-transform:uppercase;letter-spacing:-0.01em;font-size:clamp(46px,8vw,108px);line-height:0.85' }, rep.headline),
        h('p', { cls: 'wr-rise-2', style: 'margin:20px 0 14px;font-family:var(--font-editorial);font-size:clamp(20px,2.4vw,28px);line-height:1.35;color:#2a2b30;max-width:52ch' }, rep.dek),
        h('div', { cls: 'wr-rise-2', style: 'font-family:var(--font-data);font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:var(--bow-slate);border-bottom:1px solid var(--border-rule);padding-bottom:20px;margin-bottom:24px' }, 'By the BOW Newsroom · ' + rep.strategyName + ' who ' + rep.closingPhrase),
        h('div', { cls: 'wr-split-report', style: 'gap:34px;align-items:start' }, [
          h('div', { style: 'display:flex;flex-direction:column;gap:22px' }, [
            reportBlock('What you prioritized', rep.prioritized, 'var(--bow-blue)'),
            h('div', { style: 'height:1px;background:var(--border-rule)' }),
            reportBlock('The strongest part of your team', rep.strongPart, 'var(--bow-blue)'),
            h('div', { style: 'height:1px;background:var(--border-rule)' }),
            reportBlock('The trade-off you accepted', rep.tradeoff, 'var(--bow-orange)'),
            h('div', { style: 'border-left:4px solid var(--bow-ink);padding:8px 0 8px 18px;margin:4px 0' }, [
              h('span', { style: 'font-family:var(--font-data);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--bow-slate);display:block;margin-bottom:5px' }, 'What a real exec considers next'),
              h('p', { style: 'margin:0;font-family:var(--font-editorial);font-style:italic;font-size:19px;line-height:1.4;color:var(--bow-ink)' }, rep.nextMove)
            ]),
            h('div', { style: 'margin-top:6px;border:1px solid var(--border-rule);border-top:4px solid var(--bow-blue);border-radius:var(--radius-card);background:var(--bow-white);padding:22px' }, [
              h('span', { style: 'font-family:var(--font-display);font-weight:900;text-transform:uppercase;font-size:14px;letter-spacing:0.08em;display:block;margin-bottom:4px' }, 'Defend your move'),
              h('p', { style: 'margin:0 0 12px;font-family:var(--font-interface);font-size:13.5px;color:var(--bow-slate)', html: 'Ownership wants one line. Why was this the right call for your team? <span style="color:#b3b0a8">(optional)</span>' }),
              h('textarea', { maxlength: '600', rows: '3', placeholder: 'We did this because…', value: rep.memo, onInput: setMemo, style: 'width:100%;box-sizing:border-box;resize:vertical;font-family:var(--font-interface);font-size:15px;line-height:1.5;padding:12px 14px;border:1px solid var(--border-rule);border-radius:var(--radius-control);background:var(--bow-paper);color:var(--bow-ink);outline:none' })
            ])
          ]),
          h('div', { style: 'display:flex;flex-direction:column;gap:18px' }, [
            h('div', { style: 'border:1px solid var(--bow-ink);background:var(--bow-ink);color:#fff;padding:24px;border-radius:var(--radius-card)' }, [
              h('span', { style: 'font-family:var(--font-data);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#9a9da6' }, 'Front Office Score'),
              h('div', { style: 'display:flex;align-items:baseline;gap:6px;margin:4px 0 2px' }, [
                h('span', { style: 'font-family:var(--font-display);font-weight:900;font-size:76px;line-height:0.85;color:#fff' }, String(rep.score)),
                h('span', { style: 'font-family:var(--font-data);font-size:16px;color:#9a9da6' }, '/100')
              ]),
              h('div', { style: 'display:inline-flex;align-items:center;gap:8px;margin-top:8px;font-family:var(--font-display);font-weight:700;text-transform:uppercase;letter-spacing:0.04em;font-size:15px;color:var(--bow-orange)' }, rep.badgeLabel),
              h('div', { style: 'height:1px;background:var(--bow-dark-border);margin:18px 0' }),
              h('span', { style: 'font-family:var(--font-data);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#9a9da6;display:block;margin-bottom:12px' }, 'Final Numbers'),
              h('div', { style: 'display:flex;flex-direction:column;gap:11px' }, finalBars)
            ]),
            h('div', { style: 'background:var(--bow-blue);color:#fff;padding:22px;border-radius:var(--radius-card)' }, [
              h('span', { style: 'font-family:var(--font-editorial);font-size:24px;line-height:1.25;font-weight:600' }, "The salary cap isn't a limit. It's a weapon."),
              h('span', { style: 'display:block;margin-top:10px;font-family:var(--font-data);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.7)' }, 'And today, ' + rep.gm + ', you used it.')
            ])
          ])
        ]),
        h('div', { style: 'margin-top:38px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;padding-top:24px;border-top:3px solid var(--bow-ink)' }, [
          h('div', { style: 'display:flex;gap:10px;flex-wrap:wrap' }, [
            h('button', { cls: 'wr-cta', onClick: playAgainSame, style: 'background:transparent;color:var(--bow-ink);border:1px solid var(--bow-ink);border-radius:var(--radius-control);font-family:var(--font-display);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;font-size:14px;padding:12px 22px;cursor:pointer' }, 'Run It Back'),
            h('button', { cls: 'wr-cta', onClick: tryNewTeam, style: 'background:transparent;color:var(--bow-slate);border:1px solid var(--border-rule);border-radius:var(--radius-control);font-family:var(--font-display);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;font-size:14px;padding:12px 22px;cursor:pointer' }, 'New Team')
          ]),
          cta("The Analyst's Breakdown →", function () { go('debrief'); })
        ])
      ])
    ]);
  }

  // 10 — Debrief ------------------------------------------------------------
  function debriefData() {
    return {
      concept: 'The Salary Cap & the Luxury Tax',
      conceptBody: 'Every team can only spend so much on players before the league charges a penalty called the luxury tax. That dashed line on your Cap Space meter was the threshold. Cross it and every extra dollar costs roughly triple — so the cap quietly shapes almost every roster decision in pro sports.',
      tradeoff: 'You managed the trade-off between winning now and staying financially healthy. More talent usually costs more money. Protecting the budget usually costs some wins. There is no free upgrade — that is the whole game.',
      whyDiffer: 'A win-now team chasing a title might happily pay the tax for one great season. A rebuilding team would protect its cap space and collect draft picks instead. Same rules, opposite smart move — it all depends on where your franchise is in its story.',
      realWorld: 'Real GMs live inside this math every February. The biggest trades in the NBA are often less about talent and more about which contracts fit under the line.'
    };
  }
  function debriefRow(num, title, body, lastBorder) {
    return h('div', { style: 'display:grid;grid-template-columns:auto 1fr;gap:22px;padding:24px 0;border-top:1px solid var(--bow-dark-border)' + (lastBorder ? ';border-bottom:1px solid var(--bow-dark-border)' : '') }, [
      h('span', { style: 'font-family:var(--font-display);font-weight:900;font-size:34px;line-height:0.9;color:var(--bow-blue)' }, num),
      h('div', {}, [
        h('span', { style: 'font-family:var(--font-display);font-weight:900;text-transform:uppercase;font-size:18px;letter-spacing:0.04em;color:#fff;display:block;margin-bottom:8px' }, title),
        h('p', { style: 'margin:0;font-family:var(--font-interface);font-size:16px;line-height:1.65;color:#d3d5db' }, body)
      ])
    ]);
  }
  function smallCta(label, onClick, bg, border, color) {
    return h('button', { cls: 'wr-cta', onClick: onClick, style: 'background:' + bg + ';color:' + (color || '#fff') + ';border:' + (border || 'none') + ';border-radius:var(--radius-control);font-family:var(--font-display);font-weight:700;text-transform:uppercase;letter-spacing:0.04em;font-size:15px;padding:13px 24px;cursor:pointer' }, label);
  }
  function viewDebrief() {
    var d = debriefData();
    return h('div', { cls: 'wr-grain', style: 'min-height:100vh;background:var(--bow-ink);color:var(--bow-white)' }, [
      h('div', { style: 'max-width:980px;margin:0 auto;padding:clamp(34px,6vh,72px) 5vw 90px' }, [
        h('button', { cls: 'wr-link', onClick: function () { go('frontpage'); }, style: 'background:none;border:none;cursor:pointer;font-family:var(--font-data);font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:var(--bow-slate);padding:6px 0;margin-bottom:18px' }, '← Front Page'),
        h('div', { cls: 'wr-rise', style: 'font-family:var(--font-data);font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:var(--bow-orange);margin-bottom:12px' }, "Postgame Breakdown · The Analyst's Desk"),
        h('h1', { cls: 'wr-rise', style: 'margin:0 0 10px;font-family:var(--font-editorial);font-weight:600;font-size:clamp(34px,5vw,60px);line-height:1.0;max-width:18ch' }, "Here's what just happened."),
        h('p', { cls: 'wr-rise-2', style: 'margin:0 0 8px;font-family:var(--font-interface);font-size:16px;line-height:1.6;color:#9a9da6;max-width:58ch' }, "Forget the score for a second. The real win is understanding the game you just played. Here's the breakdown."),
        capLine(200),
        h('div', { style: 'display:flex;flex-direction:column' }, [
          debriefRow('01', 'The concept you used · ' + d.concept, d.conceptBody),
          debriefRow('02', 'The trade-off you managed', d.tradeoff),
          debriefRow('03', 'Why another GM would choose differently', d.whyDiffer),
          debriefRow('04', 'Where this shows up in real sports', d.realWorld, true)
        ]),
        h('div', { style: 'margin-top:36px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between' }, [
          h('span', { style: 'font-family:var(--font-editorial);font-style:italic;font-size:18px;color:#9a9da6;max-width:36ch' }, 'Same rules, different teams, different smart moves. Want to feel it again?'),
          h('div', { style: 'display:flex;gap:10px;flex-wrap:wrap' }, [
            smallCta('The Economics Behind It →', function () { go('economics'); }, 'var(--bow-orange)'),
            smallCta('Run It Back', playAgainSame, 'var(--bow-blue)'),
            smallCta('New Team', tryNewTeam, 'transparent', '1px solid var(--bow-dark-border)'),
            smallCta('Start Fresh', openRestart, 'transparent', '1px solid var(--bow-dark-border)', '#9a9da6')
          ])
        ])
      ])
    ]);
  }

  // 11 — Economics ----------------------------------------------------------
  function viewEconomics() {
    return h('div', { cls: 'wr-grain-dark', style: 'min-height:100vh;background:var(--bow-paper);color:var(--bow-ink)' }, [
      h('div', { style: 'display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 5vw;border-bottom:1px solid var(--bow-border);max-width:1240px;margin:0 auto' }, [
        h('div', { style: 'font-family:var(--font-display);font-weight:900;text-transform:uppercase;letter-spacing:0.02em;font-size:20px;line-height:1', html: 'BOW <span style="color:var(--bow-slate);font-weight:700;font-size:12px;letter-spacing:0.22em">SPORTS CAPITAL</span>' }),
        h('button', { cls: 'wr-link', onClick: function () { go('debrief'); }, style: 'background:none;border:none;cursor:pointer;font-family:var(--font-data);font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:var(--bow-slate);padding:6px 0' }, '← Back')
      ]),
      h('div', { style: 'max-width:1140px;margin:0 auto;padding:clamp(36px,6vh,76px) 5vw 110px' }, [
        h('div', { html: ECONOMICS_BODY_HTML }),
        h('div', { style: 'margin-top:48px;display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between' }, [
          h('span', { style: 'font-family:var(--font-editorial);font-style:italic;font-size:19px;color:var(--bow-slate);max-width:34ch' }, 'Now you know the machine. Go run it.'),
          h('div', { style: 'display:flex;gap:12px;flex-wrap:wrap' }, [
            h('button', { cls: 'wr-cta', onClick: function () { go('coldopen', { showResume: false }); }, style: 'background:var(--bow-blue);color:#fff;border:none;border-radius:var(--radius-control);font-family:var(--font-display);font-weight:700;text-transform:uppercase;letter-spacing:0.04em;font-size:16px;padding:14px 28px;cursor:pointer' }, 'Enter the War Room →'),
            h('button', { cls: 'wr-cta', onClick: function () { go('debrief'); }, style: 'background:transparent;color:var(--bow-ink);border:1px solid var(--bow-border);border-radius:var(--radius-control);font-family:var(--font-display);font-weight:700;text-transform:uppercase;letter-spacing:0.04em;font-size:16px;padding:14px 28px;cursor:pointer' }, 'Back')
          ])
        ])
      ])
    ]);
  }

  // Restart confirm modal ---------------------------------------------------
  function restartModal() {
    return h('div', { onClick: closeRestart, style: 'position:fixed;inset:0;z-index:50;background:rgba(10,10,11,0.72);display:flex;align-items:center;justify-content:center;padding:24px;animation:wrFadeIn 180ms ease-out both' }, [
      h('div', { onClick: function (e) { e.stopPropagation(); }, style: 'max-width:420px;width:100%;background:var(--bow-dark-surface);border:1px solid var(--bow-dark-border);border-top:4px solid var(--bow-orange);border-radius:var(--radius-card);padding:28px;color:#fff;box-shadow:var(--shadow-pop)' }, [
        h('span', { style: 'font-family:var(--font-data);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:var(--bow-orange)' }, 'Start Over'),
        h('h2', { style: 'margin:8px 0 6px;font-family:var(--font-editorial);font-weight:600;font-size:26px;line-height:1.15' }, 'Wipe the deadline and start fresh?'),
        h('p', { style: 'margin:0 0 20px;font-family:var(--font-interface);font-size:14.5px;line-height:1.55;color:#9a9da6' }, "This clears your team, your trades, and your saved progress. There's no undo."),
        h('div', { style: 'display:flex;gap:10px;justify-content:flex-end' }, [
          h('button', { cls: 'wr-cta', onClick: closeRestart, style: 'background:transparent;color:#fff;border:1px solid var(--bow-dark-border);border-radius:var(--radius-control);font-family:var(--font-display);font-weight:700;text-transform:uppercase;letter-spacing:0.04em;font-size:14px;padding:11px 20px;cursor:pointer' }, 'Keep Going'),
          h('button', { cls: 'wr-cta', onClick: doRestart, style: 'background:var(--bow-orange);color:#fff;border:none;border-radius:var(--radius-control);font-family:var(--font-display);font-weight:700;text-transform:uppercase;letter-spacing:0.04em;font-size:14px;padding:11px 20px;cursor:pointer' }, 'Yes, Start Over')
        ])
      ])
    ]);
  }

  // ============================================================= HANDLERS ==
  function enterBrief() { go('brief'); }
  function resumeGame() {
    var o = savedSnapshot || {};
    go(o.phase || 'brief', {
      gmName: o.gmName || '', teamId: o.teamId || null, selectedTradeId: o.selectedTradeId || null,
      tradeLocked: !!o.tradeLocked, pressureId: o.pressureId || null, round2Id: o.round2Id || null,
      round2Locked: !!o.round2Locked, memo: o.memo || '', showResume: false
    });
  }
  function dismissResume() { clearSave(); set({ showResume: false }); }
  function pickTeam(id) { return function () { state.teamId = id; persist(); render(); }; }
  function setGm(e) { state.gmName = String(e.target.value || '').slice(0, 40); persist(); }
  function toIntel() { if (!state.teamId) return; go('intel'); }
  function openSource(id) {
    return function () {
      var seen = state.intelReviewed.indexOf(id) >= 0 ? state.intelReviewed : state.intelReviewed.concat([id]);
      set({ intelActive: id, intelReviewed: seen });
    };
  }
  function selectTrade(id) { return function () { set({ selectedTradeId: id }); }; }
  function lockTrade() { if (!state.selectedTradeId) return; go('reveal1', { tradeLocked: true }); }
  function toPressure() { go('pressure', { pressureId: nextPressureId() }); }
  function selectR2(id) { return function () { set({ round2Id: id }); }; }
  function lockR2() { if (!state.round2Id) return; go('reveal2', { round2Locked: true }); }
  function setMemo(e) { state.memo = String(e.target.value || '').slice(0, 600); persist(); broadcastResult(); }
  function openRestart() { set({ showRestart: true }); }
  function closeRestart() { set({ showRestart: false }); }
  function doRestart() {
    clearSave();
    Object.assign(state, { phase: 'brief', showRestart: false, teamId: null, selectedTradeId: null, tradeLocked: false, pressureId: null, round2Id: null, round2Locked: false, memo: '', intelActive: 'capsheet', intelReviewed: ['capsheet'] });
    try { window.scrollTo(0, 0); } catch (e) {}
    persist(); render();
  }
  function playAgainSame() {
    Object.assign(state, { selectedTradeId: null, tradeLocked: false, pressureId: null, round2Id: null, round2Locked: false, memo: '', intelActive: 'capsheet', intelReviewed: ['capsheet'] });
    go('decision1');
  }
  function tryNewTeam() {
    Object.assign(state, { teamId: null, selectedTradeId: null, tradeLocked: false, pressureId: null, round2Id: null, round2Locked: false, memo: '', intelActive: 'capsheet', intelReviewed: ['capsheet'] });
    go('brief');
  }

  // Publish a local, Highway-World-friendly completion object once finished.
  function broadcastResult() {
    if (['reveal2', 'frontpage', 'debrief', 'economics'].indexOf(state.phase) < 0) return;
    if (!state.teamId || !state.selectedTradeId || !state.round2Id) return;
    try {
      window.BSC_LAST_RESULT = Sim.buildCompletionResult({
        teamId: state.teamId, teamName: team() ? team().name : null, gmName: state.gmName,
        trade: tradeById(state.selectedTradeId), round2: round2ById(state.round2Id),
        pressure: pressure(), baseMetrics: team() ? team().metrics : {}, memo: state.memo
      });
    } catch (e) {}
  }

  // ================================================================ RENDER ==
  var VIEWS = {
    loading: viewLoading, coldopen: viewColdOpen, brief: viewBrief, intel: viewIntel,
    decision1: viewDecision1, reveal1: viewReveal1, pressure: viewPressure, decision2: viewDecision2,
    reveal2: viewReveal2, frontpage: viewFrontpage, debrief: viewDebrief, economics: viewEconomics
  };

  function render() {
    if (!APP) return;
    var view = VIEWS[state.phase] || viewColdOpen;
    var screen = view();
    APP.textContent = '';
    APP.appendChild(screen);
    if (state.showRestart) APP.appendChild(restartModal());
    broadcastResult();
  }

  // ================================================================ BOOT ===
  function boot() {
    var reduce = false;
    try { reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    state.reduce = reduce;
    var saved = loadSaved();
    var resumable = saved && saved.phase && RESUMABLE.indexOf(saved.phase) >= 0;
    var startCold = function () { go('coldopen', { showResume: !!resumable }); };
    if (reduce) { startCold(); return; }
    render(); // show the loading splash first
    var beat = function () { setTimeout(startCold, 650); };
    try { (document.fonts && document.fonts.ready) ? document.fonts.ready.then(beat) : beat(); } catch (e) { beat(); }
  }

  // ------ Static markup for the Economics ("Cap Sheet") explainer page -----
  function econStat(label, value, color, border) {
    return '<div style="padding:22px 22px;' + (border ? 'border-right:1px solid var(--bow-border)' : '') + '">' +
      '<div style="font-family:var(--font-display);font-weight:700;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:var(--bow-slate);margin-bottom:10px">' + label + '</div>' +
      '<div style="font-family:var(--font-data);font-weight:600;font-size:clamp(24px,3vw,34px);color:' + color + ';font-variant-numeric:tabular-nums">' + value + '</div></div>';
  }
  function econSection(num, title, bodyHtml) {
    return '<div class="wr-split-econ" style="margin-top:56px;gap:40px;align-items:start;border-top:1px solid var(--bow-border);padding-top:34px">' +
      '<div><span style="font-family:var(--font-data);font-size:13px;letter-spacing:0.08em;color:var(--bow-blue)">' + num + '</span>' +
      '<h2 style="margin:8px 0 0;font-family:var(--font-display);font-weight:900;text-transform:uppercase;font-size:clamp(26px,3vw,40px);line-height:0.98;letter-spacing:-0.01em">' + title + '</h2></div>' +
      '<div>' + bodyHtml + '</div></div>';
  }
  function taxRow(range, rate, color, last) {
    return '<div style="display:grid;grid-template-columns:1fr auto;gap:12px;padding:13px 18px;' + (last ? '' : 'border-bottom:1px solid var(--bow-border)') + '"><span style="font-family:var(--font-interface);font-size:15px;color:#33353c">' + range + '</span><span style="font-family:var(--font-data);font-weight:600;font-size:15px;color:' + color + ';font-variant-numeric:tabular-nums">' + rate + '</span></div>';
  }
  function apronRow(text, last) {
    return '<div style="display:grid;grid-template-columns:auto 1fr;gap:16px;padding:14px 0;border-top:1px solid var(--bow-border)' + (last ? ';border-bottom:1px solid var(--bow-border)' : '') + '"><span style="font-family:var(--font-data);font-size:13px;color:var(--bow-negative);font-weight:600">✕</span><span style="font-family:var(--font-interface);font-size:16px;line-height:1.5;color:#33353c">' + text + '</span></div>';
  }
  var ECONOMICS_BODY_HTML =
    '<div class="wr-rise" style="font-family:var(--font-display);font-weight:700;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:var(--bow-orange);margin-bottom:18px">The Cap Sheet · Economics</div>' +
    '<h1 class="wr-rise" style="margin:0;font-family:var(--font-editorial);font-weight:600;font-size:clamp(40px,6.4vw,84px);line-height:1.0;letter-spacing:-0.01em;max-width:15ch">The salary cap isn\'t a limit. It\'s a weapon.</h1>' +
    '<svg class="wr-rise-2" width="240" height="14" viewBox="0 0 100 14" preserveAspectRatio="none" style="display:block;margin:30px 0" aria-hidden="true"><rect x="0" y="0" width="62" height="6" fill="var(--bow-blue)"></rect><rect x="59" y="0" width="3" height="14" fill="var(--bow-blue)"></rect><rect x="59" y="8" width="41" height="6" fill="var(--bow-blue)"></rect></svg>' +
    '<p class="wr-rise-2" style="margin:0;font-family:var(--font-editorial);font-size:clamp(20px,2.1vw,25px);line-height:1.5;color:#33353c;max-width:42ch">Every contender eventually receives the same bill. Build a great roster, and the cap stops being a rulebook and starts fighting back. Here\'s the machine you were running in the War Room.</p>' +
    '<p class="wr-rise-3" style="margin:18px 0 0;font-family:var(--font-data);font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:var(--bow-slate)">By BOW Research · 5 min read · NBA 2024–25</p>' +
    '<div class="wr-rise-3 wr-grid-4" style="margin-top:46px;border:1px solid var(--bow-border);background:var(--bow-white)">' +
      econStat('Salary Cap', '$140.6M', 'var(--bow-ink)', true) +
      econStat('Luxury-Tax Line', '$170.8M', 'var(--bow-negative)', true) +
      econStat('First Apron', '$178.1M', 'var(--bow-ink)', true) +
      econStat('Second Apron', '$188.9M', 'var(--bow-ink)', false) +
    '</div>' +
    econSection('01', 'A soft cap with sharp edges',
      '<p style="margin:0 0 16px;font-family:var(--font-interface);font-size:17px;line-height:1.65;color:#33353c">The NBA runs a <strong>soft cap</strong>. The $140.6M cap is the line you\'re supposed to stay under — but a long list of exceptions lets teams blow past it to keep their own stars. Re-signing a homegrown player almost always wins out over the spreadsheet.</p>' +
      '<p style="margin:0;font-family:var(--font-interface);font-size:17px;line-height:1.65;color:#33353c">So the real ceiling isn\'t the cap. It\'s the <strong>luxury-tax line</strong> at $170.8M — the moment spending stops being free and the league starts billing you for it. Cross it, and the math turns against you fast.</p>') +
    econSection('02', 'The tax: paying to win',
      '<p style="margin:0 0 22px;font-family:var(--font-interface);font-size:17px;line-height:1.65;color:#33353c">The luxury tax is <strong>progressive</strong> — the deeper over the line you go, the more every extra dollar costs. Go $20M over and you\'re paying nearly four dollars in tax for every one you spend on payroll.</p>' +
      '<div style="border:1px solid var(--bow-border);background:var(--bow-white)">' +
      '<div style="display:grid;grid-template-columns:1fr auto;gap:12px;padding:12px 18px;border-bottom:1px solid var(--bow-border);background:var(--bow-ink)"><span style="font-family:var(--font-data);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#c8cad0">Amount Over the Line</span><span style="font-family:var(--font-data);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#c8cad0">Tax Per $1</span></div>' +
      taxRow('$0 – $5M over', '$1.50', 'var(--bow-ink)') +
      taxRow('$5M – $10M over', '$1.75', 'var(--bow-ink)') +
      taxRow('$10M – $15M over', '$2.50', 'var(--bow-ink)') +
      taxRow('$15M – $20M over', '$3.25', 'var(--bow-ink)') +
      taxRow('$20M+ over', '$3.75+', 'var(--bow-negative)', true) +
      '</div>' +
      '<p style="margin:16px 0 0;font-family:var(--font-data);font-size:12.5px;letter-spacing:0.04em;color:var(--bow-slate)">REPEATER PENALTY · Pay the tax in 3 of the last 4 years and every bracket gets steeper still.</p>') +
    econSection('03', 'The second apron',
      '<p style="margin:0 0 22px;font-family:var(--font-interface);font-size:17px;line-height:1.65;color:#33353c">Money was never the real deterrent for the richest owners. So the league added a harder ceiling at <strong>$188.9M</strong> — the second apron — where the penalty stops being dollars and starts being <strong>roster-building power itself</strong>. Cross it and you lose the tools that make you good:</p>' +
      '<div style="display:flex;flex-direction:column">' +
      apronRow('No mid-level exception to sign outside free agents') +
      apronRow('Can\'t combine salaries to match in a trade') +
      apronRow('Future first-round picks get frozen — and can drop to the back of the draft') +
      apronRow('No taking back more salary than you send out', true) +
      '</div>') +
    '<div style="margin-top:64px;border:1px solid var(--bow-border);border-left:4px solid var(--bow-blue);background:var(--bow-white);padding:clamp(26px,4vw,44px)">' +
    '<div style="font-family:var(--font-data);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--bow-blue);margin-bottom:14px">Front Office Memo · From the desk to the sim</div>' +
    '<h3 style="margin:0 0 14px;font-family:var(--font-editorial);font-weight:600;font-size:clamp(24px,3vw,34px);line-height:1.1;max-width:24ch">This is the bill you were managing in the War Room.</h3>' +
    '<p style="margin:0 0 14px;font-family:var(--font-interface);font-size:17px;line-height:1.65;color:#33353c;max-width:62ch">Your <strong>Cap Space</strong> meter was never just a number — it was room under that $170.8M tax line. Every star you chased pushed you toward it. Drop below <strong>40</strong> and you crossed the line: the penalty fired, and the price of one more win climbed.</p>' +
    '<p style="margin:0;font-family:var(--font-interface);font-size:17px;line-height:1.65;color:#33353c;max-width:62ch">The great GMs aren\'t the ones who refuse to pay. They\'re the ones who know exactly which wins are worth the tax — and which ones quietly turn a contender into an expensive disaster.</p>' +
    '</div>';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
