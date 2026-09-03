# NoSlip — SOS Flow Redesign

Reworks Step 3's craving flow from "always breathing first" into a choice up front, plus a second choice after the breathing exercise finishes. Also fixes the trigger itself, which is apparently too easy to miss.

---

## New Flow

**State A — on tap, ask first:** `What do you need right now?`
- `Breathing exercise` → runs the existing 3-cycle breathing animation, then moves to State B.
- `Notify {buddy}` → sends the push immediately (same as before), shows a brief `Sent — hang in there.` confirmation, increments `cravingsSurvived`, done. No breathing forced on someone who just wants their buddy to know.

**State B — after breathing finishes:** `Feeling better?`
- `I'm okay now` → increment `cravingsSurvived`, dismiss.
- `Still tough — notify {buddy}` → send the push, increment `cravingsSurvived`, dismiss.

`cravingsSurvived` increments exactly once per session, at whichever terminal action ends it — no double-counting risk since each path only reaches one terminal button.

---

## Trigger Redesign

The current version is icon-only, no label — that's almost certainly why it's easy to miss. Fix:
- Give it an actual short label alongside the icon, not just a glyph: `Need a moment?` — small pill button (icon + text), muted-buddy accent color (`#6B5B73`).
- Bigger touch target than before, but still visually quiet — this isn't a competing CTA next to the check-in button, just more discoverable than a tiny corner icon. Roughly the footprint of a small secondary button, not a full-width one.
- Keep it in a low-traffic corner of the screen, just sized and labeled well enough to actually notice.

---

## Implementation Notes for Antigravity

- This replaces the existing SOS overlay's entry logic — the breathing animation itself (3-cycle box breathing) doesn't need to change, just when it runs and what surrounds it.
- Both `Notify {buddy}` paths (from State A directly, or from State B after breathing) call the exact same push-sending code already built in Step 3 — don't duplicate it.
- No Firestore field changes — `cravingsSurvived` already exists and increments the same way, just now from one of three possible trigger points instead of two.

---

## Prompt to paste into Antigravity

> Rework the Craving SOS flow in NoSlip. On tapping the SOS trigger, first show a choice screen: "What do you need right now?" with two options, "Breathing exercise" and "Notify {buddyFirstName}". If they choose Notify, send the existing push immediately, show a brief "Sent — hang in there." confirmation, increment cravingsSurvived, and dismiss — don't force the breathing exercise. If they choose Breathing exercise, run the existing 3-cycle breathing animation as before, then afterward show a second choice screen: "Feeling better?" with "I'm okay now" and "Still tough — notify {buddyFirstName}", each incrementing cravingsSurvived and dismissing, the second option also sending the push. Reuse the exact same push-sending function for both notify paths — don't duplicate it. Separately, redesign the SOS trigger itself: change it from an icon-only button to a small pill with both an icon and a short label, "Need a moment?", in muted-buddy accent color #6B5B73, with a larger touch target than before, but still visually quiet and positioned in a low-traffic corner — not competing with the primary check-in button. No Firestore schema changes.

