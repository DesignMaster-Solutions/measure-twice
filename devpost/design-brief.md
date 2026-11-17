---
status: approved
---

# Design brief: Measure Twice

<!-- Filled in by plan-lens from the interview. Values the team didn't choose are marked (default). -->

## The one spatial moment
I'm at the shop table with a vanity top blank in front of me, pencil in one hand and a square in the other, about to mark the sink cutout. The cutout outline lies on the stone at real size, the distance to each edge is written on the stone right where I would hold the tape, and the edge that is too thin glows amber before I draw a single line. Once the position is right I lock it and trace it, corner by corner, without putting the pencil down.

## Why it belongs on glasses
- Uses: draws in the world (the cutout outline at 1:1 on the slab, numbers on the edges they measure), leaves your body free (pencil and square stay in my hands, eyes stay on the stone).
- Why it's better than the phone or laptop version: today the layout is a paper template taped to the slab plus a tape measure, checked four times because a cutout in the wrong place scraps the piece. A phone can show the drawing but I would have to put the pencil down, and it can't put the line on the stone. Here the template is on the stone, it moves with one drag, and all four distances update while I look at the slab, not at a screen.

## Product or overlay
- Type: overlay: it responds to a real slab on a work table.
- What the real version would sense: the top surface and outline of the slab.
- Stand-in for the preview: a virtual vanity top blank at real size (122 x 56 cm, 3 cm thick, light warm-white stone) lying on a simple work stand 90 cm high (default), 0.6 m in front of the user (moved from 0.8 m: the LEAF IK reach test showed the controls were out of reach), with one big "Slab is here" button on its front edge that marks it as found. Everything after that is real logic.

## Where things live
- Where the user is looking during the main task: down at the slab, about 0.8 m ahead and 0.7 m below eye level.
- Slab (stand-in): 122 x 56 cm, long side facing the user, on the stand.
- Sink picker: three big cards in a row, 22 cm wide each, standing along the back edge of the slab and tilted toward the user, each with the sink name, an outline drawing and the cutout size in cm and inches.
- Cutout template: a bright outline (cyan, 0.6 cm line) lying flat on the slab top at real size, with a small cross at its center and a 3.5 cm faucet hole circle 5 cm behind the cutout (default).
- Rail numbers: four short labels lying on the stone between the outline and each slab edge (front, back, left, right), each with a thin dimension line, reading the distance in cm with one decimal. No floating panel.
- Shop minimum slider: on the front edge of the stand, left side, 25 cm wide. Sets the thinnest front or back rail the shop allows, 5 to 10 cm, starts at 7.5 cm (default; a sample shop rule, not an industry standard).
- Buttons: "Center" and "Lock" side by side on the front edge of the stand, right side, each about 12 x 6 cm. After locking, one "Marked" button takes their place.
- Corner marker: a pulsing dot, 3 cm, on the corner to trace next.
- Summary: one line lying on the stone inside the outline after the last corner.

## Hands and input
- Tell the Lens where the slab is: pinch "Slab is here".
- Pick a sink: pinch a card.
- Move the template: grab and drag it across the slab (it stays flat on the top and can't leave the slab).
- Center it left to right: pinch "Center".
- Freeze the position: pinch "Lock". Locked means the drag does nothing. "Unlock" appears in the same place.
- Step through the tracing: pinch "Marked" after each corner (four times), then once more for the faucet hole.
- Change the shop minimum: drag the slider.
- Targets are big and highlight when aimed at.
- Voice (if any) and the button that does the same job: in real use "marked" would be said aloud because both hands hold tools; voice is not built in this version, the "Marked" button does the job.

## When things show
- "Slab is here": shows at start, hides once pinched.
- Sink picker cards: show after "Slab is here" and after "Change sink"; hide once a sink is placed.
- Template and rail numbers: show while a sink is placed. A rail number is white when the rail is at or above the shop minimum and amber when it is below; the thin rail itself is filled amber on the stone. "Lock" is dimmed and does nothing while any front or back rail is amber.
- Left and right numbers turn green and read "centered" when they match within 0.2 cm.
- Slider, "Center", "Lock", "Change sink": show while positioning; hide while tracing.
- Corner marker and "Marked": show only after "Lock". Rail numbers shrink to half size while tracing so the outline is the main thing in view.
- Summary: shows after the faucet hole is marked: "Front 9.0 cm · Back 11.0 cm · Centered · 5 marks". A soft chime plays. "New layout" resets.
- If something needs attention out of view: when the next corner is outside the view (the slab is wider than the view at this distance), a small arrow on the stone points along the outline toward it and a short tick sound plays from the corner.

## Done criteria
Each one can be checked in Lens Studio's preview.
1. Pinching "Slab is here" shows the three sink cards along the back edge of the slab.
2. Pinching a card lays that sink's cutout outline flat on the slab at real size, with four distances in cm on the stone (the 53 x 38 cm card makes an outline visibly larger than the 43 x 36 cm one).
3. Dragging the outline toward the front edge makes the front number go down, and below the shop minimum the front rail turns amber and "Lock" stops working.
4. Pinching "Center" makes the left and right numbers equal and green.
5. Moving the shop minimum slider up turns a rail amber that was white before, without moving the outline.
6. Pinching "Lock" stops the outline from being dragged and shows the pulsing marker on the first corner; each "Marked" moves it to the next corner, then to the faucet hole.
7. After the fifth "Marked" the summary line appears on the stone with the front and back distances that were on screen when it was locked.

## Out of scope
- Recognizing a real slab, its edges or its veining.
- Real sink models: the three cutouts are hard-coded sample sizes, not a manufacturer's template.
- Radius corners per manufacturer spec, reveal type (positive, flush, negative), cooktops, L-shaped tops, seams.
- Cutting guidance of any kind. The Lens stops at pencil marks.
- Saving the layout between sessions.

## Risks and open questions
- The slab is a stand-in; on real glasses the outline would need real surface detection and has to hold still on the stone within a couple of millimeters to be worth tracing. Feel unproven: registration accuracy and drift.
- Feel unproven: whether a 0.6 cm cyan line and 1-decimal numbers read on polished light stone under shop lights on an additive display.
- "Marked" is a button here; in a real shop both hands hold tools, so the real version needs voice. Kept as a button so it can be tried with the mouse and tested with LEAF.
- The 7.5 cm starting minimum is a sample value. Each shop has its own rule, which is why it is a slider.

## Sample data (hard-coded)
| Sink (sample) | Cutout shape | Cutout size |
|---|---|---|
| Oval undermount | ellipse | 43 x 36 cm (17 x 14 in) |
| Rectangle undermount | rectangle, 2 cm corner radius | 46 x 33 cm (18 x 13 in) |
| Large rectangle undermount | rectangle, 2 cm corner radius | 53 x 38 cm (21 x 15 in) |

For the oval, the four "corners" to mark are the four points where the ellipse meets its center lines (front, right, back, left).

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources
