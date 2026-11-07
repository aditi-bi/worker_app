# Running the live app

`server/start.ts` serves the built app and adds two things the browser cannot do safely on its own:

| Path | What it does |
|---|---|
| `/profile-api/worker-profile...` | Forwards to the existing backend and adds its bearer token. The token stays on the server and the backend needs no CORS setup. Any other backend path is refused. |
| `/jobs-api/api/jobs/` | Forwards to the job list server (`JOBS_API_TARGET`) and keeps the answer for a minute. Nothing else on that server is reachable. |
| `/voice/transcribe`, `/voice/speak` | Calls Sarvam directly with your key (speech to text, text to speech). If the key is missing the app uses the phone's own voice. |
| everything else | The app (`dist`), with `index.html` for app routes. `/health` answers `{"status":"ok"}`. |

## Settings (environment variables on the host)

| Name | Needed | Meaning |
|---|---|---|
| `PROFILE_API_TARGET` | yes | Backend address, for example `https://api.example.in` (no trailing slash) |
| `PROFILE_API_TOKEN` | yes | The backend's `BEARER_TOKEN` |
| `JOBS_API_TARGET` | for jobs | The job list server, for example `https://jobs.example.in` (no path, no trailing slash) |
| `JOBS_API_TOKEN` | if asked | Bearer token for the job list server, only if it needs one |
| `SARVAM_API_KEY` | for voice | Your Sarvam key |
| `SARVAM_TTS_SPEAKER`, `SARVAM_TTS_MODEL` | no | A Sarvam voice / model name |
| `PORT` | no | Default 8080 |

## Run

    npm ci && npm run build      # uses .env.production
    PROFILE_API_TARGET=... PROFILE_API_TOKEN=... SARVAM_API_KEY=... npm run serve

Or with Docker: `docker build -t phala . && docker run -p 8080:8080 -e PROFILE_API_TARGET=... -e PROFILE_API_TOKEN=... -e SARVAM_API_KEY=... phala`.

Any host that runs Node or Docker works (Render, Railway, Fly.io, a small VPS). Put HTTPS in front (most hosts do this for you).

## Hosting on Vercel

`vercel.json` builds the app and the single function in `api/[...path].ts` does the same job as `start.ts` (profile, jobs and voice go through it, so the backend token and the Sarvam key stay on the server).
Add these in Vercel: Project Settings -> Environment Variables (all environments):

| Name | Value |
| --- | --- |
| `PROFILE_API_TARGET` | the backend address, for example `https://kural.phala.work` |
| `PROFILE_API_TOKEN` | the backend bearer token |
| `JOBS_API_TARGET` and `VITE_JOBS_API_URL=/api/jobs-api` | the job list server address (no `/api/jobs/` at the end); add both only when the address works, until then the app shows sample jobs |
| `JOBS_API_TOKEN` | only if the job server needs one |
| `VITE_APPLY_SCRIPT_URL` | the Google Apps Script web app address |
| `SARVAM_API_KEY` and `VITE_VOICE_API_URL=/api/voice` | optional, to turn on Sarvam voice |

`VITE_` values are read while the app is built, so redeploy after changing one.
