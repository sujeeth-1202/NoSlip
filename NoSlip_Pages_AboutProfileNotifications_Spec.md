# NoSlip — About / Edit Profile / Notifications Pages

Fleshes out three menu items that have been placeholders since the Step 1.5 redesign. All three are simple, low-logic screens — no new mechanics.

---

## About Page

Two sections, styled with the existing Quiet Growth palette/type:

**About the app** — short description of what NoSlip is and why it exists. Starting copy (edit freely):
> NoSlip is a two-person accountability app — built to make cutting sugar something you don't have to do alone. Your tree grows with every clean day; your buddy sees it too.

**About the creator** — a short personal note. Leave this as a template for you to fill in with your own words rather than final copy:
> Built by Sujeeth, for Pavithra, to make quitting sugar a little less lonely.
> [Add a line or two about yourself here.]

Optional footer line: `Built with Expo, Firebase, and a bit of Gemini.` — small, muted text.

---

## Edit Profile Page

Keep it minimal — this doesn't need to grow beyond what's actually useful:
- **Display Name** — editable text field, saves to the user's Firestore doc. If there's no `displayName` field yet, add one (string).
- **Email** — read-only, pulled from Firebase Auth, shown for reference only (can't be changed here since it's tied to login).
- **Save** button — writes the name change, simple success toast on save.

No avatar/photo upload for now — that's a real feature (needs image storage) and isn't something you asked for; add it later if you actually want it rather than building it speculatively.

---

## Notifications Page

Toggle switches for each push category that already exists in the app, so either of you can mute what you don't want:
- **Nudges from buddy** (Step 2)
- **Support requests** — when your buddy hits SOS and chooses to notify you (Step 3)
- **Streak updates** — forfeit alerts and (once built) slip-confession decisions

Each toggle saves to a `notificationPrefs` object on the user's Firestore doc, e.g. `{ nudges: true, support: true, streakUpdates: true }`, default all `true`.

**Important:** this only matters if the sending side actually checks it. Every existing push call (nudge, SOS-notify, forfeit-alert) needs to read the *recipient's* `notificationPrefs` for the matching category before sending, and skip silently if that category is off. Toggling this page's switches does nothing on its own unless that check gets added at each send site.

---

## Prompt to paste into Antigravity

> Build out three menu pages in NoSlip that currently exist only as placeholders. About page: two sections, "About the app" (a short paragraph on what NoSlip is) and "About the creator" (a short personal note, use placeholder text the user can edit later), styled with the existing Quiet Growth palette. Edit Profile page: an editable Display Name text field (add a `displayName` string field to the user's Firestore doc if one doesn't exist), a read-only Email field pulled from Firebase Auth, and a Save button. Notifications page: three toggle switches — "Nudges from buddy", "Support requests", "Streak updates" — saving to a `notificationPrefs` object on the user's Firestore doc (`{ nudges: true, support: true, streakUpdates: true }` by default). Then go back to every existing place a push notification is sent (nudges, SOS-notify-buddy, forfeit alerts) and add a check against the *recipient's* `notificationPrefs` for the matching category before sending — skip the send silently if that category is toggled off. No other logic changes.

