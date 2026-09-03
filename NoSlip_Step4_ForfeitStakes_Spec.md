# NoSlip — Step 4 Spec: Forfeit Stakes

Each user can declare something they'll owe if their streak breaks — a real-world dare, not fake in-app currency. When a streak breaks, the buddy gets told exactly what's owed. No payments, no Cloud Functions — this is purely a commitment/accountability mechanic, detected client-side using the existing streak logic from Step 0.

---

## Mechanic

1. Either user can set a **stake**: free text describing what they forfeit if they break their streak (e.g. "Buy Pavithra bubble tea", "50 pushups"). Optional, not required to check in.
2. Editable any time the streak is alive — no lock-in needed, this is a hobby app between two friends, not a contract.
3. When the app detects the user's streak just reset to 0 after previously being >0 (a missed day), that's a **forfeit event**:
   - Show the user a "streak broken" screen naming their own stake.
   - Push-notify the buddy with the stake text.
   - Clear the stake (so they're prompted to set a fresh one for the new attempt).
4. No stake set when a forfeit happens? Just show the broken-streak screen without a forfeit line — stakes are opt-in, not mandatory.

---

## Design

- **Stake display:** small line near the check-in button on the user's own tree page — `Stake: {text}` in muted (`#B8AE9C`), with a small edit icon. Tapping opens a simple text input sheet (single line, ~40 char limit, keep it snappy to set).
- **No stake set:** show a subtle `+ Set a stake` prompt in the same spot instead — low pressure, not a nag.
- **Forfeit screen:** appears once, right when the reset is detected (on app open, same moment the streak logic already fires). Full-screen, same dimmed-tree treatment as the SOS overlay for visual consistency, but growth-accent tinted rather than stormy-blue (this isn't a crisis, it's a reset). Text: `Streak broken. {stake}` and a single `Start again` button that dismisses and clears the old stake.

```
┌─────────────────────────┐
│   (dimmed tree behind)   │
│                          │
│    Streak broken          │
│    Buy Pavithra           │
│    bubble tea              │
│                          │
│   [   Start again    ]   │
└─────────────────────────┘
```

---

## Data Model

`users/{uid}` — add two fields:
| Field | Type | Purpose |
|---|---|---|
| `currentStake` | string \| null | What this user forfeits if their streak breaks |
| `forfeitsCount` | number (default 0) | Increments on every forfeit event — same pattern as `cravingsSurvived`, sets up Step 6's trophy wall without redesigning anything |

No new collections, no Cloud Functions.

---

## Buddy Notification (reuses Step 2/3's push setup)

- Only fires if `currentStake` was non-empty at the moment of the break.
- Title: `NoSlip`
- Body: `{name}'s streak broke. Owed: {stake}.`
- Same `sendExpoPushNotification()` helper as before — just a third title/body pairing.

---

## Implementation Notes for Antigravity

- **Hook point:** find wherever the existing Step 0 logic currently resets `currentStreak` to 0 after a missed day (almost certainly a client-side check on app load/foreground, comparing `lastCheckInDate` to today). Add the forfeit trigger right there — don't build a second, separate streak-break detector.
- **Trigger conditions:** old `currentStreak` was `> 0` AND new calculated value is `0` AND it wasn't already handled this session (guard with a local flag so it doesn't refire on every re-render).
- **On trigger:**
  1. If `currentStake` is non-empty, call `sendExpoPushNotification()` to the buddy with the body above.
  2. `FieldValue.increment(1)` on `forfeitsCount`.
  3. Show the forfeit screen locally with the (pre-clear) stake text.
  4. Set `currentStake` to `null` in Firestore.
- **Stake editor:** simple `TextInput` in a bottom sheet or modal, single line, save button writes straight to `users/{uid}.currentStake`. No validation needed beyond a length cap.
- No changes to check-in, nudge, or SOS logic — fully additive, reads/writes only the two new fields plus the existing streak fields it already has to read anyway.

---

## Prompt to paste into Antigravity

> Add a "Forfeit Stakes" feature to NoSlip. Add two fields to the `users/{uid}` Firestore doc: `currentStake` (string, nullable, default null) and `forfeitsCount` (number, default 0). On the user's own tree page, show a small line near the check-in button: "Stake: {currentStake}" in muted color #B8AE9C with a small edit icon, or "+ Set a stake" if none is set — tapping either opens a single-line text input (bottom sheet or modal, ~40 char cap) that saves directly to `currentStake`. Find the existing logic that resets `currentStreak` to 0 after a missed day (from the Step 0 streak system) and hook a forfeit event into that same reset, guarded so it only fires once per detection (old streak was >0, new streak is 0). On a forfeit event: if `currentStake` was non-empty, send a push notification to the buddy using the existing `sendExpoPushNotification()` helper with title "NoSlip" and body "{name}'s streak broke. Owed: {stake}.", increment `forfeitsCount` by 1 via `FieldValue.increment(1)`, show a full-screen dimmed-tree overlay (growth-accent tinted, not the SOS stormy-blue) reading "Streak broken. {stake}" with a single "Start again" button, then clear `currentStake` to null. If no stake was set, skip the push but still show the broken-streak screen without a stake line. Don't touch existing check-in, nudge, or SOS logic.

