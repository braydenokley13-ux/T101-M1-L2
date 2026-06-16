# Trade Deadline War Room — QA Checklist

**BOW Sports Capital · Track 101 · Module 1 · Lesson 2**
Audience: 5th–6th grade. Topic: NBA salary cap & luxury tax.

This is a no-build static site (plain HTML/CSS/JS) built against the **BOW
Sports Capital design system** (tokens in `styles/tokens.css`). It works by
opening `index.html` directly in a browser — there is **no server, no network
call, and no build step**. All content is inlined in `src/data.js` and
`src/app.js`. Webfonts load from Google Fonts with a system-font fallback, so
the simulation still runs offline / from `file://`.

## How to run

- **Just open `index.html`** in any modern browser (Chrome, Safari, Edge,
  Firefox), or double-click it. It also works offline / from `file://`.
- No install required for students.

## Automated tests (developer)

Run with Node (no framework needed):

```bash
node tests/simulation.test.js      # 28 unit tests on the game logic
```

The full UI flow was also exercised headlessly during development (a minimal
DOM shim drives all 12 screens end-to-end, plus the star-trade tax crossing,
the restart modal, and autosave).

## The flow (12 screens)

`loading → coldopen → brief → intel → decision1 → reveal1 → pressure →
decision2 → reveal2 → frontpage → debrief → economics`

Plus overlays: **resume banner** (cold open), **restart-confirm modal**.

## Manual QA checklist

### Flow (start → finish)
- [ ] Cold open shows the "Your team has a problem" hook + deadline clock + ticker.
- [ ] "Step Into the War Room" goes to the Brief.
- [ ] Brief: 4 metric cards (Cap Space / Wins / Chemistry / Buzz), 3 franchises,
      each with its cornerstone star line. GM name optional; a team must be
      picked before "Walk Into the War Room".
- [ ] Intel: 4 source files open into the panel; "Read" badges accumulate.
- [ ] Decision Desk R1: tapping a trade updates the scoreboard live (with +/- chips);
      only one card stays selected; "Lock In" is disabled until a choice exists.
- [ ] Reveal R1: meters animate from prior→new with a ghost marker; cause/effect
      names the right metrics; the tax note matches the crossing.
- [ ] Pressure: ownership pull-quote + a "Now most important" priority callout.
- [ ] Decision Desk R2: 3 closing moves; live projection; "Beat the Buzzer" gated.
- [ ] Reveal R2 (buzzer): final meters + analyst line.
- [ ] Front Page: newspaper masthead, generated headline + dek, breakdown,
      score/badge/final-numbers sidebar, and the "Defend your move" memo.
- [ ] Debrief: numbered analyst breakdown of the concept.
- [ ] Economics: the Cap Sheet explainer (cap, tax line, brackets, second apron).
- [ ] "Run It Back", "New Team", and "Start Fresh" all work.

### Per-team character
- [ ] Each franchise names its cornerstone (Lakers · LeBron, Bucks · Giannis,
      Spurs · Wembanyama) in the Brief card and Intel "Locker Room".
- [ ] **Milwaukee Bucks** runs its own small-market storyline: the Intel files,
      the analyst's read, and the reveal headlines speak to keeping a homegrown
      MVP and paying the tax in a small market.

### Learning goal (salary cap / luxury tax)
- [ ] The Cap Space meter shows the dashed **Luxury Tax marker** at 40 and a
      non-color **UNDER LINE / OVER LINE** label.
- [ ] A Lakers **Land the Superstar** trade pushes Cap Space below 40 (bar turns
      red, OVER LINE, the Luxury Tax note fires).
- [ ] **Cash In for the Future** / **Protect the Budget** raise Cap Space back up.
- [ ] The pressure priority metric is weighted ×2 in the Front Office Score.
- [ ] Debrief + Economics both explain the tax line and the trade-off.

### Edge cases (should never crash)
- [ ] Rapid-clicking trade/move cards → exactly one stays selected.
- [ ] Lock-In / Beat the Buzzer disabled until a choice exists.
- [ ] Blank "Defend your move" memo → safe default in the saved result, no crash.
- [ ] Very long GM name → truncated to 40 chars; memo truncated to 600.
- [ ] localStorage disabled/blocked → app still runs (wrapped in try/catch).
- [ ] No images are used, so nothing can appear "broken".
- [ ] Refresh mid-game → **Resume banner** restores phase + choices;
      **Start Fresh** clears the save.

### Layout / accessibility
- [ ] Scoreboard + option grids reflow to 2-up / 1-up on tablet and phone with
      no horizontal scroll.
- [ ] Buttons are large (≥44px hit targets); focus rings are visible.
- [ ] Non-color tax indicator (label + dashed marker), high-contrast type.
- [ ] `prefers-reduced-motion` disables all animation (and skips the splash).

## Known limitations / follow-ups
- A browser refresh mid-game offers Resume; otherwise progress autosaves to
  `localStorage` on every transition. Acceptable for a ~5-minute activity.
- Player names and league dollar figures are illustrative (NBA 2024–25 era),
  not a live feed.
- The completion object (`window.BSC_LAST_RESULT`) is local-only and
  future-friendly; it is not yet wired to any external platform.
