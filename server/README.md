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
