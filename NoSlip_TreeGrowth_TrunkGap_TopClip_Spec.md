# NoSlip — Tree Growth: Trunk-Canopy Gap + Top Clipping

The previous audit fixed the left/right overflow clipping (Day 25 now sits fully in frame, no horizontal clipping) but missed two things: the trunk doesn't actually connect to the canopy on any stage, and past day 120 the top of the canopy is now getting clipped vertically — same root cause as the horizontal clipping before, just on the other axis.

---

## 1. Trunk Disconnected From Canopy — Every Stage

This isn't limited to the early sapling stage anymore — it's the trunk-to-canopy junction itself, on every stage that has a distinct trunk graphic (from whenever the trunk first appears through the fully grown tree). There's a visible gap between where the trunk graphic ends and where the canopy graphic begins, instead of the two overlapping or meeting cleanly.

**Fix properly this time:** go stage by stage and confirm the trunk's top coordinate and the canopy's bottom coordinate actually meet or slightly overlap — don't fix one stage and assume the rest inherit it, since that's what happened last time. Verify every stage individually, not just a sample of them.

---

## 2. Top Clipping Past Day 120

The earlier fix addressed horizontal (left/right) clipping, but only on that axis. Past roughly day 120, the canopy is now getting cut off at the **top** of its container — same underlying cause as the left/right clipping before (continuous-growth scaling not properly contained), just showing up vertically now instead of horizontally, likely because only the horizontal dimension was corrected.

**Fix:** apply the same containment logic to the vertical axis that was applied horizontally — cap the scale to what the viewBox can hold in both dimensions, or size the viewBox/frame to fit the largest stage in both width and height, not just width.

---

## Prompt to paste into Antigravity

> Two more fixes needed in the NoSlip tree growth system, both missed by the last pass. First: the trunk doesn't actually connect to the canopy on any growth stage that has a distinct trunk — there's a visible gap between where the trunk graphic ends and the canopy begins. This isn't isolated to one stage; go through every stage that has a trunk and canopy as separate elements and verify individually that the trunk's top coordinate meets or slightly overlaps the canopy's bottom coordinate, with zero visible gap — don't fix one stage and assume the others inherit the fix, verify each one. Second: the horizontal (left/right) overflow clipping was fixed correctly — Day 25 now sits fully in frame — but past roughly day 120 the canopy is now getting clipped at the top of its container. This is the same containment issue as the left/right clipping, just on the vertical axis, likely because only horizontal containment was corrected last time. Apply the identical fix (capping scale to fit the viewBox, or sizing the frame to the largest stage) to the vertical dimension as well, not just horizontal. After both fixes, do a pass checking renders across the full range — early stages, mid stages like day 25, and high stages past day 120 — to confirm neither issue is still present anywhere in the sequence.

