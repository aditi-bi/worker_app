# Phala Worker App

A simple mobile app for workers in Hindi, Marathi and English. Workers can browse jobs without logging in, make a profile by voice or by tapping, get a call from Phala to fill it, and apply to jobs.

Built with React, TypeScript, Vite and Tailwind. Tests use Vitest.

## Run it on your computer

```bash
npm install
npm run dev        # http://localhost:5173
```

By default the app runs on built-in sample data. To connect real services, put the settings below in a file named `.env.local` (private, never uploaded), then restart `npm run dev`.

## What is connected

| Part | Connected to | Settings |
|---|---|---|
| Profile and "Receive a call" | The Phala backend | `PROFILE_API_PROXY_TARGET`, `PROFILE_API_TOKEN`, `VITE_PROFILE_API_URL=/profile-api` |
| Jobs and rates | The job list server | `JOBS_API_PROXY_TARGET`, `VITE_JOBS_API_URL=/jobs-api` |
| Applications | A Google Sheet through Apps Script | `VITE_APPLY_SCRIPT_URL` |
| Voice (optional) | Sarvam | `SARVAM_API_KEY`, `VITE_VOICE_API_URL=/voice` |
| "Call Phala" button | The inbound phone number | `VITE_PHALA_INBOUND_NUMBER` |

Without a voice key, the phone's own speech recognition is used.

The backend token and the Sarvam key stay on the server. The browser never sees them.

## Commands

`npm run build` · `npm test` · `npm run lint` · `npm run typecheck`

## Rules

No login, no ratings or reviews, no pay promises, and no Naka features. Location is asked only when needed and sent with an application only when the worker taps Apply.
