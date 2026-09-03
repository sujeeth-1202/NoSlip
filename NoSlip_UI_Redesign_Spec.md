# NoSlip — UI Redesign Spec (Step 1.5: Visual Overhaul)

Full aesthetic pass on the tree screen, navigation, and check-in flow. UI-only — no changes to Firestore schema, auth, or streak logic from Step 0/1.

---

## Design Direction — "Quiet Growth"

Comfy, minimalist, low-saturation. The tree is the hero; everything else stays quiet.

**Color**
| Role | Hex | Use |
|---|---|---|
| Background | `#E7DFCE` | Warm stone base, all screens |
| Surface | `#F6F1E4` | Cards, drawer, sheet backgrounds |
| Ink | `#2E2B24` | Primary text (soft near-black, not pure black) |
| Accent — growth | `#3E5C43` | Tree, primary CTA, streak numbers, success states |
| Accent — buddy | `#6B5B73` | Pavithra's page/pager dot, social elements |
| Muted | `#B8AE9C` | Disabled states, dividers, secondary text |

No bright greens, no neon, no pure white/black anywhere.

**Type**
- Display (streak count, day number): **Fraunces** — serif, gives the numbers warmth instead of a cold dashboard feel. `@expo-google-fonts/fraunces`
- UI/body (buttons, labels, menu): **Manrope** — clean humanist sans, high legibility at small sizes. `@expo-google-fonts/manrope`
- No all-caps labels, no tracked-out eyebrow text above things.

**Motion**
- One signature moment: the tree visibly grows when the day is logged (scale/foliage change). Everything else — drawer open, page swipe — uses simple, fast transitions. No fade-slide-up on every element.

---

## Screen 1: Tree View (full-bleed)

Tree fills the entire screen edge-to-edge (minus safe area) — not boxed in a card.

```
┌─────────────────────────┐
│ ☰                        │  <- hamburger, top-left, no app icon/emoji here
│                          │
│                          │
│      🌳  (tree art,      │
│       fills the screen)  │
│                          │
│                          │
│   Day 14 · unbroken      │  <- small, low-contrast caption, lower third
│                          │
│  [   Water the tree   ]  │  <- primary CTA, bottom safe area
│                          │
│         ●  ○             │  <- pager dots: filled = current page
└─────────────────────────┘
```

- Horizontal pager (`react-native-pager-view` or Reanimated Carousel), 2 pages:
  - Page 0: "You" — tree grows off the user's own streak, CTA active
  - Page 1: "Pavithra" (buddy) — read-only tree, same visual treatment, CTA replaced with a small "Day X · unbroken" label only (no nudge button yet — that's Step 2)
- Dot indicator at bottom uses accent-growth for page 0, accent-buddy for page 1.
- No swipe hint text needed — the second dot signals there's more.

---

## Screen 2: Navigation — Hamburger Menu

Replaces whatever nav exists today. Opens as a left-side drawer/sheet over a dimmed background.

```
┌───────────────────┐
│  NoSlip             │
│  ────────────────  │
│  Edit Profile        │
│  Notifications        │
│  About                 │
│                     │
│                     │
│  ────────────────  │  <- divider, pinned near bottom
│  Sign Out              │  <- accent-buddy or muted-rust, NOT bright red
└───────────────────┘
```

- Top group: everyday items (Edit Profile, Notifications, About/Help — adjust list to whatever screens actually exist).
- Sign Out is visually separated at the bottom, own section, own divider — never mixed into the same list as the rest so it can't be mis-tapped.
- Custom `Animated` + `react-native-gesture-handler` slide-in panel is enough for this scope; no need for a full drawer-navigation library.

---

## Check-in Button

Replace "You are clean today" — it reads like a status label, not a button.

Ties the action to the actual mechanic (watering → growth):

- **Primary copy:** `Water the tree`
- **After tap (confirmed state):** `Watered today ✓` (disabled, accent-growth fill)

Alt if you want it plainer: `Log today` → `Logged ✓`.

---

## App Name / Header Emoji

Current header likely leans on a candy/restriction emoji (🍬 / 🚫). Drop it — it fights the calm aesthetic. Two options:

1. Clean wordmark only: **NoSlip**, no emoji.
2. If you want a mark: 🌱 next to the wordmark, nowhere else in the app.

Default to option 1 unless you tell Antigravity otherwise.

---

## Implementation Notes for Antigravity

- Fonts: `expo-font` + `@expo-google-fonts/fraunces` + `@expo-google-fonts/manrope`, loaded at app root before render.
- Pager: `react-native-pager-view` (Expo-compatible) for the tree swipe.
- Drawer: custom `Animated.View` + `react-native-gesture-handler`, not a full nav-drawer package — keeps bundle small.
- Tree art: keep existing SVG/Lottie asset from Step 1, just re-scale to fill screen and re-skin colors to the new palette above.
- No Firestore/schema changes — this is a presentation-layer pass over existing Step 0/1 data (streak count, buddy's streak, auth state).

---

## Prompt to paste into Antigravity

> Redesign the NoSlip tree screen, navigation, and check-in button per the "Quiet Growth" spec: warm stone background (#E7DFCE), surface #F6F1E4, ink #2E2B24, growth accent #3E5C43, buddy accent #6B5B73, muted #B8AE9C. Use Fraunces for streak/day numbers, Manrope for all other UI text. Make the tree full-bleed (fills the screen, not boxed), and add a horizontal swipeable pager with 2 pages — "You" (own tree, active check-in) and the buddy's tree (read-only, same visual treatment, no check-in control). Show small pager dots at the bottom, growth-accent color for page 1, buddy-accent for page 2. Replace the current top nav with a hamburger icon (top-left) that opens a left-side drawer: top section has Edit Profile / Notifications / About, bottom section (visually separated by a divider) has Sign Out alone. Rename the check-in button from "You are clean today" to "Water the tree", switching to a disabled "Watered today ✓" state after it's tapped for the day. Remove the emoji from the app name in the header — plain "NoSlip" wordmark only. Keep all existing Firestore logic, auth flow, and streak calculations untouched — this is UI/visual only.

