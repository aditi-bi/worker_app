# Phala Worker App - frontend

Mobile-first React app for workers (Hindi, Marathi, English). The flow follows `design/phala-full-flow-design.html`:

language -> **location permission (or choose area)** -> **Phala asks 10 questions by voice, hands-free** (or tap) -> profile created -> **one scrolling list of matched jobs** -> Full details / I want this job (**live location is read and sent with the application**) -> application sent -> My applications.

There is no login and no verification call. The profile is saved on the phone (a device token); a worker can also skip the profile and browse, and is asked for it only when they try to open details or apply.

**Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query, React Hook Form + Zod, i18next (hi / mr / en), MSW (mock API), Vitest.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173 - uses the mock API (MSW)
```

Other commands: `npm run build`, `npm run build:mock` / `npm run preview:mock` (production build with mocks), `npm run typecheck`, `npm run lint`, `npm test`.

In mock mode every new browser tab starts from the first screen (it clears the `phala:*` storage once per tab).

## Screens and routes

| Route | Screen |
|---|---|
| `/language` | Welcome and language |
| `/talk` | Intro: Start talking / Fill by tapping / Skip, just browse jobs |
| `/talk/voice` | Phala asks name, work, experience, pay, home place, relocate, age (optional), kind of work, stay on site, mobile number. Hands-free: it listens by itself after each question, reads the answer back and moves on |
| `/talk/tap` | The same 10 questions, one per screen (also the fallback when the mic fails) |
| `/profile` | "Profile created" (first time) and edit details |
| `/location`, `/location/area` | Share location or choose area |
| `/jobs` | Scrolling list. With a profile: matched, full detail. Skipped: nearby, sheet asks for the profile |
| `/jobs/:id`, `/jobs/:id/applied` | Full details, application sent |
| `/applications` | My applications |
| `/me`, `/hisaab` | My profile (hero card, every detail tap-to-edit, help and settings, delete my data), work and pay log |
| `/rates`, `/help` | Open to everyone, reached from the profile menu |

Top bar: Phala logo on the left, profile button on the right. With a profile the button opens the My profile page (hero card, every detail, Help, Language, Rates, Hisaab, delete). A guest who skipped the profile gets a small menu instead (make profile, language, rates, help). Bottom bar (everyone): Jobs, **Ask Phala** (raised voice button) and Applied. Ask Phala opens a sheet; the **Call Phala** button only opens the phone dialler with `VITE_PHALA_INBOUND_NUMBER`. A call happens only when the worker taps it.

## Voice

`features/talk` uses the browser's own voice (Web Speech API) by default. With `VITE_VOICE_API_URL` set it uses Sarvam instead (below); the browser voice stays as the fallback. The app never calls Sarvam directly, only your voice server.

Hands-free loop (`pages/TalkPage.tsx`): Phala speaks the question -> the phone starts listening by itself -> the answer is read back quickly (rate 1.2) -> after a short pause the next question starts. There is no submit button; the worker can tap **Change** to say it again. The mic button stays only as a fallback (silence twice, or to restart). Choice questions (work, experience, yes/no, kind of work, age skip) also show tap chips. Unclear twice -> "could not hear" screen with the tapped form. `answers.ts` maps what was said to profile fields; `parse.ts` returns null when unsure.

Switch point: `hooks/useSpeak.ts` (text to speech) and `features/talk/useSpeechRecognition.ts` (speech to text); Sarvam code is in `features/voice`. Browser-voice limits: Marathi voices often fall back to Hindi, and recognition needs internet.

### Sarvam voice for the ten questions
Set `VITE_VOICE_API_URL` to use a Sarvam voice and Sarvam speech-to-text instead of the phone's built-in voice. The Sarvam key
stays on a server (`SARVAM_API_KEY`); locally put it in `.env.local` and use `VITE_VOICE_API_URL=/voice`. If Sarvam fails the
app falls back to the phone's voice. Live site: see `design/voice-proxy/README.md`. No calls are made to workers.

## Mock API vs real FastAPI

| Setting | Meaning |
|---|---|
| `VITE_USE_MOCKS=true` | In-browser mock server answers `/api/v1/*` (default in dev) |
| `VITE_USE_MOCKS=false` | App calls the real backend at `VITE_API_BASE_URL` |
| `VITE_API_PROXY_TARGET` | Dev proxy so `/api` reaches FastAPI without CORS setup |
| `VITE_PROFILE_API_URL` | Send only the profile calls to the real backend; jobs, hisaab and rates stay mock |
| `PROFILE_API_PROXY_TARGET`, `PROFILE_API_TOKEN` | Dev only (in `.env.local`): proxy `/profile-api` to the backend and add its token on the server side |
| `VITE_PHALA_INBOUND_NUMBER` | Number the Ask Phala button dials (placeholder in dev and mock) |
| `VITE_SUPPORT_PHONE` | Optional support line on Help |

Profile calls follow the backend's `/worker-profile` routes (`src/api/profileContract.ts`): `POST /worker-profile/register`, `PATCH /worker-profile`, `GET /worker-profile?phone_number=`, `POST /worker-profile/call`. The mock answers the same routes. Jobs (`/jobs/for-me`, `/jobs/{id}`), hisaab and rates are still proposals to check against the real routes. There is no delete-profile in the app. Responses are validated with Zod.

**Profile on the real backend, rest on the mock:** in `.env.local` set `PROFILE_API_PROXY_TARGET`, `PROFILE_API_TOKEN` and `VITE_PROFILE_API_URL=/profile-api`, keep `VITE_USE_MOCKS=true`, restart `npm run dev`. In the Network tab the profile calls go to `/profile-api/worker-profile` (not "from service worker").

Application tracking from the backend is not built; applications go to the Google Sheet when `VITE_APPLY_SCRIPT_URL` is set.

### Trying every UI state
In mock mode add `?scenario=empty` (or `error`, `slow`, `network-down`, `area-not-found`) to the address to see that state; it lasts for that browser tab.

## Structure

```
src/
  app/            providers, router, route guards
  pages/          one file per screen
  features/       talk (voice), profile, jobs, applications, help (Ask Phala), hisaab, location, preferences
  components/     ui, layout (BottomNav), feedback, icons
  api/            fetch client, endpoints, zod types, errors
  mocks/          MSW handlers, fixtures (SAMPLE data), scenarios, dev panel
  i18n/           en / hi / mr JSON (a test checks every key exists in all three)
```

## Rules followed
- No Naka features. No ratings, reviews, alerts or payment promises. All mock jobs and rates are sample data.
- Guest browsing works without a profile; the first tap on details or apply asks for it.
- Location is asked once at the start; only the district (and optional taluka) is kept on the phone. When the worker taps apply, the live position is read fresh and sent with that one application (`location` field, proposed). It is not kept on the phone, except inside an offline-saved application until it is sent. If location is denied, the application still goes without it.
- No new backend: everything uses the existing FastAPI (proposed paths above) or the MSW mock.
- Read-aloud buttons are switched off (`READ_ALOUD_ENABLED` in `ReadAloudButton.tsx`). Phala's questions are still spoken in the voice profile.

## Open questions
- The real inbound number for Ask Phala.
- Guest job cards use the public endpoint (no employer name); decide whether to expose employer and distance there too.
- Filters on the matched list run on the phone for now; move to the server when the real API is known.
- Rates are sample figures (`verified: false`) until checked.

## Applications go to a Google Sheet

When `VITE_APPLY_SCRIPT_URL` is set, tapping Apply sends the application to a Google Apps Script web app that adds a row
to a Google Sheet (`design/apps-script/Code.gs`, setup in `design/apps-script/README.md`). The phone keeps its own
"Applied" list and the worker's name and number (on the phone only). With the variable empty, the `/applications` API is used.
