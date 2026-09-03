# NoSlip

A two-person accountability app for cutting sugar — built to make quitting something you don't have to do alone.

## What It Is

NoSlip pairs two people together to hold each other accountable on a sugar-cut / no-junk-food streak. Each person grows a tree that visually reflects their streak, can nudge or support their partner, and can confess a slip in real time rather than waiting for the day to reset.

## Features

- **Daily check-in & streak tracking** — mark each clean day, track your current and best-ever streak
- **Living streak tree** — grows visibly the longer your streak runs, with continuous growth well past 100 days
- **Two-way nudges** — poke your partner if they haven't checked in yet (1/day cooldown)
- **Craving SOS** — a calm breathing-exercise flow for cravings, with the option to notify your partner for support
- **Slip confessions** — report a slip the moment it happens instead of waiting for the day to end; your partner decides in real time whether the streak continues or ends
- **Forfeit stakes** — set what you owe if your streak breaks, shown to your partner if it does
- **AI roast/hype messages** — a short AI-generated line celebrating a good day or ribbing a broken one (Gemini)
- **Shared trophy wall** — side-by-side stats and streak-length badges for both of you

## Tech Stack

- [Expo](https://expo.dev) (SDK ~57) / React Native
- Firebase Auth (email/password) + Firestore
- Google Gemini API (free tier) for AI-generated messages
- Expo push notifications

## Getting Started

### Prerequisites

- Node.js and npm
- A free [Expo](https://expo.dev) account
- A Firebase project with Auth (email/password) and Firestore enabled
- A free Gemini API key from [Google AI Studio](https://aistudio.google.com)

### Setup

```bash
git clone https://github.com/sujeeth-1202/NoSlip.git
cd NoSlip
npm install
```

Copy `.env.example` to `.env` and fill in your own Firebase config and Gemini API key.

Link the project to EAS (needed for push notifications):

```bash
npm install -g eas-cli
eas login
eas init
```

Run the app:

```bash
npx expo start
```

## Environment Variables

See `.env.example` for the full list. Never commit your actual `.env` file — make sure it's listed in `.gitignore` before pushing.

## License

Personal project — add a license here if you want one to apply.
