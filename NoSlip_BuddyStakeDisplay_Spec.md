# NoSlip — Show Buddy's Stake Too

Small fix: Step 4 only ever displayed the logged-in user's own `currentStake`. Add the buddy's stake to the buddy's page in the pager, read-only, same visual treatment.

---

## Change

On the buddy's page (page 2 of the tree pager), near their streak caption, add a line showing their `currentStake` — same muted styling used for your own stake, but no edit icon and no tap action, since it's read-only. If the buddy has no stake set, show `No stake set` in the same muted tone rather than hiding the line entirely, so it's clear at a glance whether they've committed to anything.

No data model changes — `currentStake` already exists on every user doc, this is purely a display addition using data that's already being fetched for the buddy page.

---

## Prompt to paste into Antigravity

> On the buddy's page of the NoSlip tree pager, add a read-only display of the buddy's currentStake field, styled the same as the user's own stake line but without the edit icon or tap action. If currentStake is null, show "No stake set" in the same muted color (#B8AE9C) rather than omitting the line. No Firestore schema changes — currentStake is already being read for this page.

