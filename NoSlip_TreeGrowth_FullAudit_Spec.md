# NoSlip — Tree Growth System: Full Audit & Fix

Replaces the narrower Day-2-only patch — this covers the whole growth progression in one pass instead of chasing individual stages one at a time. Two categories of bug, both stemming from the recent tree-growth change:

1. **Attachment bug** — foliage not actually connected to the stem, confirmed on Day 2, unconfirmed elsewhere (needs auditing, not assuming it's isolated).
2. **Containment bug** — canopy and background glow overflow and get hard-clipped at higher streak counts, confirmed on Day 55 and Day 150.

Day 1 is the confirmed-correct reference for attachment. Day 10 is confirmed-correct for containment (fully in frame). Use both as the baseline every other stage should be checked against.

---

## 1. Attachment — Audit Every Stage, Not Just Day 2

Day 1 is correct: leaves meet cleanly at the stem's exact top point, zero gap. Day 2 is confirmed wrong: leaves (plus a bud) sit offset to the side with a visible gap from the stem.

**Don't just patch Day 2 in isolation.** Go through every growth-stage asset in the sequence and check whether its foliage/canopy element actually shares the same base anchor coordinate as the stem's top point, the way Day 1 does. Fix any stage where there's a visible gap or offset between the stem and what's supposed to be growing from it — not just the one already reported.

---

## 2. Containment — Canopy and Glow Overflowing at High Streaks

Day 10 is correct: fully contained, centered. Day 55 shows the canopy clipped by a hard edge on the right; Day 150 shows clipping on **both** left and right, worse than Day 55 — confirming the canopy is scaling from a fixed edge rather than from center, and outgrowing its own container as the streak number climbs.

Fix by either:
- Capping the scale factor to whatever the current viewBox can actually contain at its largest stage, or
- Resizing the viewBox to fit the largest growth stage, with smaller/earlier stages sitting centered within that same fixed frame instead of the frame being sized around the small stages.

Whichever approach: the canopy must scale from its **center**, not a fixed origin — that's what's producing the asymmetric clipping pattern. Apply the same fix to the background glow shape behind the sparkles/decorations, which shows the identical hard-edge clipping — or switch it to a radial gradient that fades to transparent before reaching any edge, removing the hard boundary entirely.

---

## Prompt to paste into Antigravity

> Do a full audit and fix of the NoSlip tree growth system — two related bugs from the recent growth change, both in one pass rather than fixing them stage by stage. First: Day 1 is the correct reference for how foliage should attach to the stem — leaves meet cleanly at the stem's top point with zero gap. Day 2 is confirmed broken (leaves offset to the side, visible gap from the stem) — but instead of only patching Day 2, go through every growth-stage asset in the sequence and check whether each one's foliage shares the same base anchor coordinate as the stem's top point the way Day 1 does; fix any stage with a visible gap or misalignment, not just the one already reported. Second: Day 10 is the correct reference for containment — fully visible, centered, nothing clipped. Day 55 and Day 150 both show the canopy getting hard-clipped by the edge of its container (right side only at day 55, both left and right by day 150), caused by the continuous-growth scaling not being centered or contained within the viewBox as it scales up. Fix this by either capping the scale to what the viewBox can hold, or resizing the viewBox to fit the largest stage and keeping smaller stages centered within that same frame — either way, make sure scaling happens from center, not a fixed edge, since the asymmetric clipping pattern shows it's currently anchored to one side. Apply the same containment fix to the background glow shape behind the sparkles, which has the identical clipping issue, or convert it to a radial gradient fading to transparent before any edge.

