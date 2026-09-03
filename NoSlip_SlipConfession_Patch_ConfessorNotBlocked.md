# NoSlip — Patch: Confessor Should Not Be Blocked

Fixes a mismatch from the last build: `WaitingConfessionGate` currently blocks the confessor's entire app navigation after they submit a confession. That wasn't the intent — only the buddy who has to make the Allow/End Streak decision should be locked out of the app. The confessor should be free to use everything else normally while it's pending.

---

## Fix

- **Remove `WaitingConfessionGate` as a full-screen navigation block.** The confessor should be able to swipe to the buddy's page, open the menu, check the trophy wall — everything — while their confession is pending.
- **Replace it with a small non-blocking indicator** on their own tree page (page 0) only — e.g. a quiet pill/banner near the top or near the check-in area reading `Waiting for {buddy} to decide`. Informational only, doesn't prevent anything.
- **On page 0 specifically, while `pendingConfession` is active:** hide or disable the primary check-in button and the "I slipped today" link — they shouldn't be able to check in normally or confess again while one is already unresolved. That's the only actual restriction for the confessor; everything else in the app stays open.
- **`BuddyDecisionGate` is unchanged** — that one was correct as built: full-screen, no dismiss, no back button, persists across app restarts, exactly as specced. This patch only touches the confessor's side.

---

## Prompt to paste into Antigravity

> Patch the NoSlip slip confession feature. Remove WaitingConfessionGate as a full-screen blocking navigation gate for the confessor — they should be able to use the rest of the app normally (buddy page, menu, trophy wall, everything) while their confession is pending. Replace it with a small non-blocking indicator pill shown only on their own tree page (page 0), reading "Waiting for {buddy} to decide". On page 0 specifically, while pendingConfession is non-null for the current user, hide or disable the primary check-in button and the "I slipped today" link — that's the only restriction that should remain for the confessor. Do not change BuddyDecisionGate — it stays exactly as built, a full-screen non-dismissible block for the buddy making the Allow/End Streak decision.

