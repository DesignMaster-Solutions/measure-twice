# Build report: Measure Twice

Built from `devpost/design-brief.md` with Snap's CLAD agents (specs-experience-builder, live-lens-tester) through the Lens Studio MCP. Lens Studio 5.24.1, Spectacles Interaction Kit 3.1.0, UI Kit, Leaf 3.0.0. Runs in the Lens Studio preview only; nothing has been tried on SPECS glasses.

## What works (logic proven in preview)

- Stand-in: a 122 x 56 x 3 cm light warm-white slab on a 90 cm stand, its center 60 cm in front of the user (moved from 80 cm after the IK reach test below). Its top is 70 cm below eye level. The only thing shown at start is "Slab is here".
- Three sink cards appear along the back edge, tilted toward the user. Each shows the name, an outline drawn at a shared scale, and the size in cm and inches.
- The cutout is laid flat on the slab at real size: a cyan 0.6 cm line, a center cross, and a 3.5 cm faucet hole 5 cm behind it. Four rail numbers sit on the stone (cm, one decimal), each with a dimension line. The back number is shifted right so it clears the faucet hole, also at half size.
- Drag: the hand ray is projected onto the slab-top plane and the result is clamped to the slab. The outline never leaves the slab.
- When a rail is below the shop minimum, its number turns amber and the rail is filled amber on the stone. While the front or back rail is amber, "Lock" is dimmed and its interactable is off.
- "Center" makes left and right equal. Both turn green and read "centered" when they match within 0.2 cm.
- The shop minimum slider (5 to 10 cm, starts at 7.5) recolors the rails without moving the outline.
- "Lock" freezes the drag and shows "Unlock" in the same place. A pulsing 3 cm marker steps through the 4 corners and then the faucet hole, one step per "Marked". For the oval, the corners are the front, right, back and left points. While tracing, the rail numbers shrink to half size.
- After the 5th mark, the summary line appears inside the outline, built from the values at lock time ("Front 10.9 cm · Back 12.1 cm · Centered · 5 marks"). A soft chime plays and "New layout" resets.
- When the next corner is out of view, an arrow on the stone points toward it and a tick plays from the corner. Both sounds are WAVs generated locally; no paid API was used.

## LEAF: 7/7 done criteria and the reach check pass

Scenarios are in `Assets/Tests/` and registered in `LeafIndex.ts`. Each one starts from `newLayout()` and drives the Lens with real SIK input (pinches on the UIKit buttons and cards, drags on the template and the slider). The controller is only read for assertions. The 7 runs below were done in sequence in the preview on 17 Nov 2026; the pass/fail lines are in `docs/leaf-run.log`.

| # | Scenario | Result |
|---|---|---|
| 1 | dc1-slab-here-shows-cards | PASSED |
| 2 | dc2-card-lays-outline | PASSED (oval 43.6 cm wide vs large 53.7 cm) |
| 3 | dc3-drag-front-amber-lock-blocked | PASSED (front 9.0 → 4.5 cm, amber, Lock refused) |
| 4 | dc4-center-equal-green | PASSED (42.8 / 33.2 → 38.0 / 38.0, green) |
| 5 | dc5-slider-turns-amber | PASSED (minimum 7.5 → 10, front 9.0 turns amber, outline unchanged) |
| 6 | dc6-lock-marker-steps | PASSED (drag refused while locked, marker 4 corners → faucet hole) |
| 7 | dc7-summary-locked-values | PASSED (summary equals the labels shown at lock) |
| 8 | dc8-ik-arm-reaches-controls | PASSED (IK arm, no fallback: every stand-edge control reached by touch, each sink card picked by the hand ray) |

To check that the tests can fail, dc5 was run once with a wrong assertion. It failed with `FAILED: dc5-slider-turns-amber - AssertionError: Expected: "7.5" - Received: "10"`, and passed again once the assertion was restored.

dc8 uses the LEAF IK body (shoulder 37 cm below and 20 cm beside the eye, 67.5 cm wrist reach, head at the default preview pose) with no SIK fallback and fail-fast diagnostics. It failed for real on the first layout: "Slab is here" was 7.7 cm out of reach with the slab 80 cm out and the buttons on the stand face. With the slab at 60 cm, Lock (x = 50, then 42) and the slider (x = -44.5) were still out of reach. The controls row now starts at x = -4 (Lock at 34) and the slider is centered at x = -34, and dc8 passes: the pinch ends on each control (0.7 cm or closer to its center) and SIK lists it as nearby, and the hand-ray pinch on each card really picks that sink. The same final test still fails with the slab put back at 80 cm. The 7 done-criteria scenarios were re-run on the new layout and pass.

## What is missing or unproven

- Touch press on the near controls: the IK hand reaches each button and SIK lists it as nearby, but SIK 3.1 in the preview runtime never turns that into hover, so the press by touch is not proven (the presses are proven by dc1-dc7 with simulated pinches, and by the hand ray on the cards).
- The rail numbers have a dark outline. It helps only against the virtual slab in the preview; on the additive display it renders as nothing.
- Feel unproven: registration and drift on a real slab, line and number legibility on polished stone under shop lights, and voice for "marked" (it is a button here).
- The preview panel is docked in a narrow column, so the prints below are crops of the Interactive Preview panel (Sunlit Room, SPECS 27), taken from a camera behind and above the user so the whole slab fits.

## Prints (Interactive Preview, after each LEAF run)

- `docs/prints/01-start-slab-is-here.png`: start, slab stand-in with "Slab is here"
- `docs/prints/02-sink-cards.png`: the three sink cards on the back edge
- `docs/prints/03-template-four-rails.png`: large rectangle at real size with the 4 distances, centered in green
- `docs/prints/04-amber-front-rail.png`: front rail 4.3 cm, below the 7.5 cm minimum, filled amber, Lock dimmed
- `docs/prints/05-locked-marker.png`: locked, marker on the faucet hole, half-size numbers, Marked and Unlock
- `docs/prints/06-summary.png`: summary line on the stone and New layout
