# NoSlip — Step 2 Spec: Two-Way Nudges

Lets either user poke the other when they haven't watered their tree yet today. Builds on the Step 1.5 "Quiet Growth" UI — same palette/type, no new screens, just new state on the buddy's page.

---

## Mechanic

- On the buddy's pager page (Screen 1, page 2), if the buddy hasn't checked in today, show a nudge control instead of the current read-only label.
- Cooldown: **1 nudge per buddy per day** — keeps it a gentle poke, not spam, and needs no complex rate-limit logic.
- Nudge sends a push notification to the buddy. No in-app-only fallback needed for a 2-person app — if the push fails, it just fails silently, no retry queue.

---

## Data Model (additions to existing Firestore, no breaking changes)

`users/{uid}` document — add two fields:
| Field | Type | Purpose |
|---|---|---|
| `pushToken` | string | Expo push token, captured on login |
| `lastNudgedAt` | timestamp \| null | Last time *this user* was nudged — drives the cooldown |

No new collection needed for now. (A `nudges` history collection would be easy to bolt on later for the Step 6 trophy wall, but skip it for Step 2 — don't build for a feature that isn't specced yet.)

---

## UI: Buddy Page States

```
Buddy hasn't checked in, cooldown clear:
┌─────────────────────────┐
│      🌳  (buddy's tree)  │
│                          │
│   Day 9 · unbroken       │
│  [   Nudge Pavithra   ]  │  <- accent-buddy (#6B5B73) fill
└─────────────────────────┘

Buddy hasn't checked in, already nudged today:
┌─────────────────────────┐
│      🌳                  │
│   Day 9 · unbroken       │
│      Nudged today ✓      │  <- muted (#B8AE9C) text, no button
└─────────────────────────┘

Buddy already checked in:
┌─────────────────────────┐
│      🌳                  │
│   Day 10 · watered today │  <- growth-accent text, no nudge control at all
└─────────────────────────┘
```

- Button copy: `Nudge {buddyFirstName}` — active voice, names who it goes to.
- After tap: button becomes the disabled `Nudged today ✓` state immediately (optimistic UI), no loading spinner needed for something this lightweight.

---

## Push Notification

- Title: `NoSlip`
- Body: `Your tree's thirsty — check in today.` (plain, matches the calm tone, no emoji-per-notification)
- Tapping the notification deep-links straight into the app's tree screen (own page, page 1 of the pager).

---

## Implementation Notes for Antigravity

- **Push token capture:** on login/app-open, request notification permission via `expo-notifications`, get the Expo push token, write it to `users/{uid}.pushToken`. Skip silently if permission is denied — don't block the check-in flow on it.
- **Sending the nudge (client-side, no Cloud Function needed):** on nudge tap, read the buddy's `pushToken` from Firestore, POST directly to `https://exp.host/--/api/v2/push/send` with title/body above. This keeps things on the free Firestore Spark plan — no Cloud Functions billing setup required. Fine for a 2-user app; revisit with a Cloud Function later only if abuse becomes a concern.
- **Cooldown check:** before showing the active nudge button, compare `lastNudgedAt` to "start of today" (local device time is fine for 2 users). If nudged already today, render the disabled state instead.
- **Writing `lastNudgedAt`:** the nudger writes `lastNudgedAt: serverTimestamp()` to the *buddy's* user doc (not their own) at nudge time.
- No changes to existing streak/check-in/tree-growth logic — this only adds a read of the buddy's `pushToken`/`lastNudgedAt` and one new write path.

---

## Prompt to paste into Antigravity

> Add a two-way nudge feature to NoSlip, building on the existing "Quiet Growth" UI. On the buddy's page of the tree pager, if the buddy hasn't checked in today, show a button "Nudge {buddyFirstName}" styled with the accent-buddy color (#6B5B73). Add two fields to the `users/{uid}` Firestore doc: `pushToken` (string, captured via expo-notifications on login) and `lastNudgedAt` (timestamp, null by default). Enforce a 1-nudge-per-day cooldown per buddy by comparing `lastNudgedAt` to the start of the current day — if already nudged today, replace the button with disabled muted (#B8AE9C) text reading "Nudged today ✓". If the buddy has already checked in today, show no nudge control at all, just the existing day-count label in growth-accent color. On tap, write `serverTimestamp()` to the buddy's `lastNudgedAt`, then POST directly to `https://exp.host/--/api/v2/push/send` with the buddy's stored `pushToken`, title "NoSlip", body "Your tree's thirsty — check in today." Tapping the notification should deep-link to the user's own tree page. No Cloud Functions — keep this entirely client-side. Don't touch existing check-in, streak, or tree-growth logic.

