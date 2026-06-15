# Trade Deadline War Room — QA Checklist

**Bow Sports Capital · Track 101 · Module 1 · Lesson 2**
Audience: 5th–6th grade. Topic: NBA salary cap & luxury tax.

This is a no-build static site (plain HTML/CSS/JS). It works by opening
`index.html` directly in a browser — there is **no server, no network call, and
no build step**. All content is inlined in `src/data.js`.

## How to run

- **Just open `index.html`** in any modern browser (Chrome, Safari, Edge,
  Firefox), or double-click it. It also works offline / from `file://`.
- No install required for students.

## Automated tests (developer)

Run with Node (no framework needed):

```bash
node tests/simulation.test.js      # 18 unit tests on the game logic
```

The full UI flow was also exercised in a headless DOM (jsdom) during
development — every screen, plus the edge cases below.

## Manual QA checklist

### Flow (start → finish)
- [ ] Mission Briefing shows the mission and the 4 metrics, "Enter the War Room" works.
- [ ] Setup: GM name optional; a team must be picked before continuing.
- [ ] War Room: dashboard shows 4 meters; Trade Board shows 4 cards.
- [ ] Tapping a trade updates the meters live and shows +/- change chips.
- [ ] Changing your mind re-selects cleanly (only one card selected at a time).
- [ ] "Lock In" reveals the Pressure Moment.
- [ ] Pressure Moment: "Rethink My Trade" returns to the board (with banner);
      "Keep It & Submit" goes to the report.
- [ ] After rethink, the button reads "Submit Final Strategy" (no second pressure).
- [ ] Performance Report shows badge, score, strategy type, 4 final meters,
      strongest/weakest, explanation, luxury-tax note, and pressure note.
- [ ] Boardroom Memo accepts text and "Save Memo" confirms.
- [ ] "Play Again (Same Team)" and "Try a New Team" both work.

### Learning goal (salary cap / luxury tax)
- [ ] Cash meter shows the dashed **Luxury Tax Line** at 40.
- [ ] A Big Star Trade visibly pushes Cash below the line (turns red, warning shows).
- [ ] A Future Pick Trade raises Cash (cap relief) back above the line.
- [ ] The report explains whether the team stayed under the line.

### Edge cases (should never crash)
- [ ] Rapid-clicking trade cards → exactly one stays selected.
- [ ] Double-clicking "Lock In"/"Submit" → only advances once (busy guard).
- [ ] Submitting with a trade selected always reaches a report.
- [ ] Blank Boardroom Memo → safe default message, no crash.
- [ ] Very long GM name → truncated to 40 chars.
- [ ] localStorage disabled/blocked → app still runs (wrapped in try/catch).
- [ ] No images are used (emoji only), so nothing can appear "broken".
- [ ] Browser refresh restarts cleanly at the Mission Briefing.

### Layout / accessibility
- [ ] Usable on a narrow phone, a tablet, and a laptop (cards stack on small screens).
- [ ] Buttons are large; text is high-contrast and readable.
- [ ] `prefers-reduced-motion` disables animations.

## Known limitations / follow-ups
- A browser refresh resets progress (no mid-game save). Acceptable for a
  ~3–5 minute classroom activity; could add resume-from-localStorage later.
- Player names in trades are illustrative, not a live roster feed.
- The Highway World completion object (`window.BSC_LAST_RESULT`) is local-only
  and future-friendly; it is not yet wired to any external platform.
