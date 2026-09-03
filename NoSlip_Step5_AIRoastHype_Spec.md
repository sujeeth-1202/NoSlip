# NoSlip — Step 5 Spec: AI Roast/Hype Messages

A one-line AI-generated message riding on top of two moments that already exist: a successful check-in (hype) and a forfeit event from Step 4 (roast). No new screens, no new Firestore fields — this step is pure client-side text generation bolted onto existing UI.

---

## Mechanic

- **Hype:** right after a successful check-in ("Watered today ✓"), fetch a short celebratory one-liner and show it under/alongside the existing "Day X · unbroken" caption.
- **Roast:** on the Step 4 forfeit screen, fetch a short playful roast referencing the streak that just broke and the stake, shown under the existing "Streak broken. {stake}" text.
- Both are single API calls, fired the moment the trigger happens, non-blocking — the existing UI shows immediately with its static text, and the AI line fades in a beat later once it returns (or never, if the call fails — see fallback below).

---

## Model & API

- Google Gemini, via the free Google AI Studio tier — no billing, no credit card, matches the free-tier pattern the rest of this app already follows.
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent` — use the `-latest` alias, not a pinned version number, so this doesn't quietly break next time Google ships a new Flash model.
- Get a key free at aistudio.google.com → "Get API key." Store it as `EXPO_PUBLIC_GEMINI_API_KEY` in a `.env` file (add `.env` to `.gitignore` if it isn't already).

**Being upfront about the tradeoff:** any key prefixed `EXPO_PUBLIC_` ships inside the compiled app and can technically be pulled out of the binary. Since NoSlip is only ever installed on your two phones and never published to a store, that's a low-stakes exposure — worst case someone burns your free daily quota, there's no billing attached to steal. If this app ever goes public, move this call behind a Cloud Function first.

---

## Tone Rules (important — bake this into the system instruction)

Roasts need to stay *affectionate friend energy*, never actually mean. Hard constraints for both message types:
- Never mention weight, body, appearance, or health outcomes.
- Never frame a missed day as a personal failing or moral weakness — it's "you had ONE JOB" energy about the *day*, not judgment about the *person*.
- Under 20 words, one line, casual tone matching how you two actually talk, max one emoji.

---

## Prompts (send as the model's `system_instruction`)

**Hype (on successful check-in):**
> You are a witty, supportive friend writing one short hype line for someone who just logged a sugar-free day in their habit-tracking app. Under 20 words, casual, max one emoji. Never mention weight, body, or health — just celebrate the streak. Reference the day count if given: Day {streakCount}.

**Roast (on forfeit):**
> You are a witty, affectionate friend writing one short roast for someone who just broke their sugar-cut streak. Under 20 words, playful teasing like close friends give each other, never actually mean, never mention weight/body/health. "You had one job" energy, not "you're weak" energy. Their streak was {streakLength} days, stake was "{stake}".

---

## Fallback (required — don't let this block or blank out the UI)

Wrap the fetch in try/catch with a short timeout (~3s). On any failure or timeout, fall back to a small hardcoded array and pick one at random — the existing static caption text is already showing underneath, so a fallback just means the AI line never appears, nothing breaks visually.

```ts
const HYPE_FALLBACKS = [
  "Tree's looking good today.",
  "Another one in the books.",
  "Streak's still climbing.",
];
const ROAST_FALLBACKS = [
  "Rough one. Tree'll survive.",
  "Well, that happened.",
  "Back to day one, let's go.",
];
```

---

## Implementation Notes for Antigravity

- New file: `services/ai.ts`, exporting `generateHypeMessage(streakCount: number)` and `generateRoastMessage(streakLength: number, stake: string | null)`, both `async`, both wrapping the Gemini call in try/catch with the fallback arrays above.
- Request shape (both functions, only the `system_instruction` and one variable differ):
  ```ts
  fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.EXPO_PUBLIC_GEMINI_API_KEY },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: PROMPT_ABOVE }] },
      contents: [{ role: 'user', parts: [{ text: 'Generate the line.' }] }],
    }),
  })
  ```
- Call `generateHypeMessage()` right after the existing check-in success logic fires (Step 0), don't gate the "Watered today ✓" state on it — show that immediately, patch the AI line in when the promise resolves.
- Call `generateRoastMessage()` right when the Step 4 forfeit screen mounts, same non-blocking pattern.
- No Firestore fields, no new screens, no changes to streak/nudge/SOS/stake logic — purely additive text on two existing moments.

---

## Prompt to paste into Antigravity

> Add AI-generated hype/roast one-liners to NoSlip using the free Gemini API. Create services/ai.ts exporting two async functions: generateHypeMessage(streakCount) and generateRoastMessage(streakLength, stake). Both POST to https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent with header 'x-goog-api-key' set to process.env.EXPO_PUBLIC_GEMINI_API_KEY (add EXPO_PUBLIC_GEMINI_API_KEY to a .env file, gitignored). generateHypeMessage sends this system_instruction: "You are a witty, supportive friend writing one short hype line for someone who just logged a sugar-free day in their habit-tracking app. Under 20 words, casual, max one emoji. Never mention weight, body, or health — just celebrate the streak. Reference the day count if given: Day {streakCount}." generateRoastMessage sends: "You are a witty, affectionate friend writing one short roast for someone who just broke their sugar-cut streak. Under 20 words, playful teasing like close friends give each other, never actually mean, never mention weight/body/health. 'You had one job' energy, not 'you're weak' energy. Their streak was {streakLength} days, stake was '{stake}'." Both functions wrap the fetch in try/catch with a ~3 second timeout, falling back to a randomly picked line from a small hardcoded array on any failure (3 hype fallbacks, 3 roast fallbacks — write short generic ones matching the tone rules). Wire generateHypeMessage into the existing check-in success flow — show the existing "Watered today" state immediately, then fade in the AI line under the day-count caption once the promise resolves, don't block on it. Wire generateRoastMessage into the Step 4 forfeit screen the same non-blocking way, fading the line in under the existing "Streak broken. {stake}" text. No Firestore schema changes, no changes to existing streak/nudge/SOS/stake logic.

