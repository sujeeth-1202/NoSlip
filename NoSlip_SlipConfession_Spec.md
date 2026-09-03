# NoSlip — Slip Confession + Buddy Decision

This is the biggest change in this batch — it's a new real-time reporting flow that sits alongside the existing end-of-day forfeit detection from Step 4, not a replacement for it. Give this its own focused Antigravity session rather than bundling it with smaller fixes — it touches check-in state, streak logic, and the forfeit/roast pipeline all at once.

---

## Mechanic

Instead of only detecting a broken streak passively the next time the app opens, either user can proactively confess mid-day: "I had something off-diet." That sends their buddy a **blocking decision** — allow the streak to continue, or end it right now. The buddy can't do anything else in the app until they decide, and this persists across closing and reopening the app.

**Flow:**
1. On your own tree page, a small secondary text link near the check-in area: `I slipped today` — muted, deliberately smaller/quieter than the primary check-in button since this isn't something to make visually loud.
2. Tapping it opens a simple prompt: `What did you have?` — free text, a `Send` button.
3. Submitting writes a pending confession to your own Firestore doc and shows you a `Waiting for {buddy} to decide` state — your own check-in/SOS/nudge UI is gated in this state too, since the day's outcome isn't settled yet.
4. Your buddy's app — on load, and every time it comes to the foreground — checks whether *you* have a pending confession. If so, it shows a full-screen blocking decision screen instead of normal navigation: `{name} says they had {food} today. Let their streak continue?` with two equal-weight buttons: `Allow` / `End Streak`. No way to dismiss without picking one — no back button, no swipe-away, and reopening the app after force-closing it lands right back on this same screen until it's resolved.
5. **Allow** → clears the pending confession, streak continues untouched, treat the day as checked-in (they don't need to also tap the normal check-in button — confessing today already counts as engaging with the day). Optionally notify the confessor: `{buddy} let it slide — keep going.`
6. **End Streak** → clears the pending confession, then runs the *exact same forfeit sequence already built in Step 4*: reset `currentStreak` to 0, increment `forfeitsCount`, clear `currentStake`, fire the Step 5 roast message, and notify the confessor `{buddy} ended your streak.` Don't build a second forfeit path — call the same function Step 4's automatic detection already uses.

---

## Data Model

`users/{uid}` — one new field:
| Field | Type | Purpose |
|---|---|---|
| `pendingConfession` | `{ food: string, confessedAt: timestamp } \| null` | Set when the user confesses, cleared once their buddy decides |

---

## The Blocking Gate

This is the part that needs care — "can't proceed to anything else, even after closing the app" means the check has to run at the root of the app, before the normal tab/screen navigation renders, the same way an auth-gate already does.

- On every app load and foreground event, after auth resolves: fetch the buddy's doc and check `pendingConfession`.
- If it's non-null → render the blocking decision screen in place of the normal navigator. Nothing else mounts underneath it.
- This has to re-run on foreground, not just on cold start — if the person backgrounds the app to avoid deciding and comes back, the gate needs to still be there.
- Symmetrically: if the user's *own* doc has a `pendingConfession`, show them the lighter `Waiting for {buddy} to decide` screen instead of normal navigation, for the same reason — the day's status is genuinely undetermined until it's resolved.

---

## Implementation Notes for Antigravity

- **Reuse, don't duplicate:** the "End Streak" path must call the same forfeit function Step 4 built for automatic end-of-day detection — refactor that logic into one shared function if it isn't already, so both triggers (passive daily check, and this new explicit end-streak decision) go through the same code.
- Entry point: the "I slipped today" link only needs to show if the user hasn't already checked in today and doesn't already have a pending confession.
- The confession prompt and the buddy's decision screen can both be simple full-screen modals — no need for a dedicated route/screen if the rest of the app doesn't use one for similar one-off flows.
- Push notifications for both outcomes reuse the existing `sendExpoPushNotification()` helper from Steps 2–4, just new title/body pairs.
- No changes to the nudge, SOS, or trophy wall logic — this only adds the confession field, the gate check, and hooks into the existing forfeit function.

---

## Prompt to paste into Antigravity

> Add a "slip confession" feature to NoSlip. Add one field to the users/{uid} Firestore doc: pendingConfession (object: { food: string, confessedAt: timestamp }, or null — default null). On the user's own tree page, add a small muted secondary text link "I slipped today" near the check-in area (only visible if they haven't checked in today and have no pending confession). Tapping it opens a simple modal: "What did you have?" with a text input and a Send button, which writes { food, confessedAt: serverTimestamp() } to pendingConfession on their own doc, then shows a "Waiting for {buddy} to decide" state that also gates their normal check-in/SOS/nudge UI until resolved. At the app root, after auth resolves, on every load and every foreground event, check the buddy's doc for a non-null pendingConfession — if present, render a full-screen blocking decision screen in place of normal navigation (no dismiss, no back button, persists across app restarts until resolved): "{name} says they had {food} today. Let their streak continue?" with two equal-weight buttons, "Allow" and "End Streak". Allow: clear pendingConfession on the confessor's doc, leave currentStreak untouched, treat the day as checked in, optionally push-notify the confessor "{buddy} let it slide — keep going." End Streak: clear pendingConfession, then call the exact same forfeit function already built for Step 4's automatic end-of-day streak-break detection (refactor it into a shared function first if it's currently inline) — reset currentStreak to 0, increment forfeitsCount, clear currentStake, fire the existing Step 5 roast message, and push-notify the confessor "{buddy} ended your streak." Reuse the existing sendExpoPushNotification() helper for all pushes here. Don't modify nudge, SOS, or trophy wall logic — only the new field, the two gate screens, and hooking into the existing forfeit function.

