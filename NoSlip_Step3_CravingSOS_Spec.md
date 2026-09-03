# NoSlip — Step 3 Spec: Craving SOS

A quiet, always-available "having a moment" button on the user's own tree page — walks them through a short breathing pause, then lets them either self-resolve or pull their buddy in for support. Not punitive, not alarming — matches the "Quiet Growth" tone.

---

## Mechanic

1. Small SOS affordance sits on the user's own tree page (page 0 only — doesn't make sense on the buddy's read-only page).
2. Tap opens a full-screen overlay: a slow breathing animation (box breathing, ~3 cycles, ~30–40 seconds).
3. After the cycles finish, two choices:
   - **"I'm okay now"** — dismiss, log it as survived, done.
   - **"Still tough — tell {buddy}"** — sends buddy a supportive push notification, then dismiss.
4. No cooldown — cravings aren't spam, the button should always be available.

---

## Design

- **Trigger button:** small icon (not a big red emergency button — that fights the calm aesthetic). A simple outlined leaf or wave glyph, muted color (`#B8AE9C`), tucked in a corner of page 0 — doesn't compete visually with the tree or the "Water the tree" CTA.
- **Overlay background:** background dims to a soft stormy grey-blue overlay over the tree (the tree stays visible underneath, slightly desaturated) — visually says "weathering something," not "failure."
- **Breathing animation:** a circle that slowly expands/contracts in sync with "Breathe in… hold… breathe out…" text, Manrope, low contrast, unhurried pacing. No countdown numbers ticking down aggressively — this should feel slow, not gamified.
- **End-state buttons:** both choices equal visual weight, no button styled as the "better" one — this isn't a test they can fail.

```
┌─────────────────────────┐
│   (dimmed tree behind)   │
│                          │
│        ◯  (breathing     │
│         circle, pulses)  │
│                          │
│    Breathe in...         │
│                          │
│  [ I'm okay now ]        │
│  [ Still tough — tell    │
│      Pavithra ]          │
└─────────────────────────┘
```

---

## Data Model

`users/{uid}` — add one field:
| Field | Type | Purpose |
|---|---|---|
| `cravingsSurvived` | number (default 0) | Increments on every SOS completion, regardless of which end choice they pick — sets up Step 6's trophy wall later without redesigning anything |

No separate log collection needed yet — a single counter is enough until a feature actually needs per-event history.

---

## Buddy Notification (reuses Step 2's push setup)

- Title: `NoSlip`
- Body: `{name} could use a bit of support right now.`
- Tapping deep-links the buddy straight to their partner's tree page (not their own) — so they land somewhere useful, not just the app's default screen.
- Uses the exact same `pushToken` / Expo Push API plumbing already built for nudges — no new push infrastructure.

---

## Implementation Notes for Antigravity

- Overlay: a full-screen `Modal` (or `Animated.View` if you want the tree to visibly desaturate underneath — nicer, but a plain `Modal` is fine if time's tight).
- Breathing animation: `Animated.timing` looped scale on a circle View, roughly 4s in / 4s hold / 4s out, repeated 3 times — no external animation library needed.
- On completion of either end choice: `increment(cravingsSurvived, 1)` via Firestore's `FieldValue.increment(1)` (atomic, avoids read-then-write races).
- "Still tough" path: reuse the `sendExpoPushNotification()` helper from Step 2's `services/notifications.ts` — just a different title/body, same function signature.
- No changes to streak, check-in, or nudge logic — fully additive.

---

## Prompt to paste into Antigravity

> Add a "Craving SOS" feature to NoSlip, matching the existing Quiet Growth aesthetic. On the user's own tree page (page 0 of the pager only), add a small outlined icon button in a corner, muted color #B8AE9C, that opens a full-screen overlay when tapped. The overlay dims the background to a soft stormy grey-blue over the (still-visible, slightly desaturated) tree, and shows a breathing circle animation that expands and contracts through 3 cycles of roughly 4s inhale / 4s hold / 4s exhale, with text "Breathe in... hold... breathe out..." in Manrope, low contrast. After the cycles finish, show two equal-weight buttons: "I'm okay now" and "Still tough — tell {buddyFirstName}". Both choices call `FieldValue.increment(1)` on a new `cravingsSurvived` field on the user's Firestore doc (create it, default 0). The "Still tough" option additionally reuses the existing `sendExpoPushNotification()` function from services/notifications.ts to send the buddy a push with title "NoSlip" and body "{name} could use a bit of support right now.", deep-linking the buddy's tap straight to the sender's tree page rather than the app's default screen. No cooldown on this button — it should always be tappable. Don't touch existing streak, check-in, or nudge logic.

