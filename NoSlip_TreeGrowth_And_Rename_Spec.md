# NoSlip — Tree Growth Fix + Check-in Rename

Two fixes to the existing tree screen: a rendering bug at low streaks, a growth curve that flatlines after ~30 days, and a rename of the check-in action everywhere it appears.

---

## 1. Day-2 Sapling Bug

The early-growth tree asset (used around day 2) has its leaves positioned off to the side instead of centered/top, breaking the silhouette compared to every other stage. Have Antigravity locate that specific stage asset (SVG or Lottie, whichever the tree is built with) and fix the leaf anchor points so they match the top-centered composition used by neighboring stages. This is an asset/positioning bug, not new logic — no data model changes.

---

## 2. Tree Plateaus After ~30 Days

Right now visual growth stalls out around day 30 — there's nothing left to look forward to, which kills the engagement the whole mechanic is built on. Two changes, ideally both:

**A. More discrete milestone stages.** Extend the growth-stage set further out — suggested checkpoints: day 1 (sapling, fixed per above), 3, 7, 14, 21, 30, 45, 60, 90, 120+ (a fully mature/flowering form as the top end, so there's still a "final form" to reach). Each is its own asset, same as the existing stages.

**B. Continuous growth between stages (do this even if A is skipped for now — cheaper to build, no new art needed).** Between milestone stages, scale the tree slightly and/or increase leaf density/color richness smoothly as streak count climbs, rather than holding perfectly static until the next hard-coded stage jump. This means there's *always* some subtle visual feedback day to day, even between big jumps and past whatever the highest stage is — solves the "no difference" complaint without requiring a artist to draw ten new assets.

If B is implemented, A becomes a nice-to-have rather than a requirement — the continuous scaling alone fixes the core complaint.

---

## 3. Rename "Water the tree"

Change the check-in button copy from "Water the tree" / "Watered today ✓" to something tied to the app's own name rather than just the tree metaphor.

**Recommended:** `No Slip Today` → confirmed state `No Slip ✓`. Ties directly to the app's name instead of only the growth mechanic — if you'd rather keep it tree-themed, "Water the tree" → "Grow today" is a lighter alternative, but the "No Slip" version is the stronger pick since it doubles as reinforcing the app's identity every time it's tapped.

**Search-and-replace, not a single edit:** this string may appear in more than one place — the button itself, the confirmed-state label, and possibly any onboarding or tutorial copy. Have Antigravity search the whole codebase for "Water the tree" / "Watered today" and replace every occurrence consistently, not just the most visible one.

---

## Prompt to paste into Antigravity

> Fix two things on the NoSlip tree screen and rename the check-in action everywhere. First, locate the early-growth tree asset (used around day 2 of the streak) — its leaves are rendering off to the side instead of centered/top like every other growth stage; fix the leaf positioning to match the intended top-centered silhouette. Second, the tree currently stops visibly changing after around day 30 — add continuous growth between whatever milestone stages already exist: as streak count increases, gradually scale the tree slightly and/or increase leaf density/color richness, so there's always some subtle day-to-day visual change rather than a hard plateau. If it's easy to also add a few more discrete milestone stages further out (e.g. day 45, 60, 90, 120+ as a "mature" form), do that too, but the continuous scaling is the priority. Third, search the entire codebase for every occurrence of "Water the tree" and "Watered today" and replace them consistently with "No Slip Today" and "No Slip ✓" respectively — check button labels, state text, and any onboarding copy, not just the main check-in button.

