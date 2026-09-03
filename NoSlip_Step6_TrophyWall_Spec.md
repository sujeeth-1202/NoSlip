# NoSlip — Step 6 Spec: Shared Trophy Wall

The payoff screen — finally surfaces the counters that have been quietly accumulating since Steps 3 and 4 (`cravingsSurvived`, `forfeitsCount`), side by side for both of you. New screen, reachable from the hamburger menu built back in Step 1.5.

---

## Mechanic

- New screen: **Trophy Wall**, opened via a real menu item in the hamburger drawer (swap in for one of the placeholder items from the redesign — "Edit Profile" / "Notifications" / "About").
- Shows both users' stats side by side, read live from Firestore — reuses the exact same "fetch the buddy's doc" logic already built for the buddy pager page in Step 1, just displayed differently.
- Adds simple streak-length badges (7 / 30 / 100 days) so there's something visual beyond a stat table.

---

## Data Model

`users/{uid}` — one new field:
| Field | Type | Purpose |
|---|---|---|
| `longestStreak` | number (default 0) | Best streak ever reached — separate from `currentStreak`, which resets on a break |

**Check first:** Step 0 may already track this — if `longestStreak` (or equivalent) already exists, use it as-is instead of adding a duplicate field.

If it doesn't exist yet: hook into the existing check-in success logic (same place Step 4 hooked into for streak-reset detection) — every time `currentStreak` increments, compare against `longestStreak` and bump it if the new value is higher. One extra conditional write, nothing structural.

Everything else the screen needs already exists: `currentStreak`, `cravingsSurvived` (Step 3), `forfeitsCount` (Step 4).

---

## Design

```
┌─────────────────────────┐
│  Trophy Wall              │
│  ────────────────────    │
│              You  Pavithra│
│   Streak      14      9   │
│   Best        21     15   │
│   Survived     6      3   │
│   Forfeits     2      4   │
│                          │
│   🌱 7-day   🌳 30-day    │
│   🏆 100-day (locked)     │
└─────────────────────────┘
```

- Numbers in Fraunces (same as the streak count on the tree screen), labels in Manrope, "Quiet Growth" palette throughout — no new colors introduced.
- "Survived" = `cravingsSurvived`, "Forfeits" = `forfeitsCount` — label them plainly, don't editorialize (forfeits aren't something to hide, they're part of the same playful accountability as the roast messages).
- Badges: three fixed thresholds (7/30/100), each rendered in growth-accent if `longestStreak >= threshold`, muted/outlined otherwise. Per-user, so each person's row of badges reflects their own `longestStreak`.

---

## Implementation Notes for Antigravity

- New screen file (match whatever routing pattern the rest of the app already uses — likely `app/(tabs)/trophy-wall.tsx` or similar with expo-router).
- Hamburger drawer: add a "Trophy Wall" item, wire it to navigate to the new screen.
- Data: reuse the existing function that fetches the buddy's user doc (already built for the Step 1 pager) rather than writing a second fetcher — just also read the fields this screen needs (`currentStreak`, `longestStreak`, `cravingsSurvived`, `forfeitsCount`) for both the own doc and buddy's doc.
- `longestStreak`: check the existing Step 0 streak logic first — only add the field and the comparison-write if it isn't already there.
- No pushes, no new triggers, purely a read-and-display screen plus one small write hook if `longestStreak` needs adding.

---

## Prompt to paste into Antigravity

> Add a "Trophy Wall" screen to NoSlip, reachable from the hamburger menu (add it as a real item, replacing one of the placeholder menu entries). The screen shows a two-column stat table, "You" vs the buddy's name, with rows: Streak (currentStreak), Best (longestStreak), Survived (cravingsSurvived), Forfeits (forfeitsCount) — reuse the existing function that already fetches the buddy's Firestore doc for the Step 1 pager page rather than writing a new fetcher, just read the additional fields it needs. First check whether the existing Step 0 streak logic already tracks a "longest streak ever" value under any field name — if so use it as-is; if not, add a longestStreak field (number, default 0) to users/{uid} and hook a comparison into the existing check-in success logic so it updates whenever currentStreak exceeds it. Below the stat table, show three badge indicators for 7-day, 30-day, and 100-day milestones per user, filled in growth-accent color (#3E5C43) if that user's longestStreak meets the threshold, muted (#B8AE9C) and outlined otherwise. Use Fraunces for the numbers and Manrope for labels, matching the existing Quiet Growth palette — no new colors. No push notifications, no new Firestore collections, purely a display screen plus the one optional write hook for longestStreak.

