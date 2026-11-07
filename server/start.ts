/**
 * One small server for the live app, with nothing to install beyond Node 22:
 *  - serves the built app (dist) and falls back to index.html for app routes,
 *  - /profile-api/*  -> the existing backend (PROFILE_API_TARGET) with its bearer token added here, so the browser never sees the token
 *                       and the backend needs no CORS setup,
 *  - /jobs-api/api/jobs/ -> the job list server (JOBS_API_TARGET), so the browser needs no CORS setup there either,
 *  - /voice/transcribe and /voice/speak -> Sarvam directly with SARVAM_API_KEY (same code as the dev server).
 * Run: npm run build && npm run serve   (settings in the environment, see server/README.md)
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'
import { MAX_AUDIO_BYTES, speakText, transcribeAudio, type VoiceConfig } from '../voice-proxy.ts'

const env = process.env
const PORT = Number(env.PORT ?? 8080)
const DIST = resolve(env.DIST_DIR ?? 'dist')
const TARGET = (env.PROFILE_API_TARGET ?? '').replace(/\/$/, '')
const TOKEN = env.PROFILE_API_TOKEN ?? ''
const JOBS_TARGET = (env.JOBS_API_TARGET ?? '').replace(/\/$/, '')
const JOBS_TOKEN = env.JOBS_API_TOKEN ?? ''
const voice: VoiceConfig = { apiKey: env.SARVAM_API_KEY ?? '', speaker: env.SARVAM_TTS_SPEAKER || undefined, model: env.SARVAM_TTS_MODEL || undefined }

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webmanifest': 'application/manifest+json',
}

const text = (res: ServerResponse, status: number, body: string, type = 'application/json') => {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' })
  res.end(body)
}

function readBody(req: IncomingMessage, limit: number): Promise<Buffer | null> {
  return new Promise((done) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > limit) {
        done(null)
        req.destroy()
      } else chunks.push(c)
    })
    req.on('end', () => done(Buffer.concat(chunks)))
    req.on('error', () => done(null))
  })
}

/** Forward /profile-api/<rest> to the backend. Only the profile routes are reachable. */
async function profileProxy(req: IncomingMessage, res: ServerResponse, rest: string) {
  if (!TARGET) return text(res, 503, JSON.stringify({ error: 'PROFILE_API_TARGET is not set' }))
  if (!rest.startsWith('/worker-profile')) return text(res, 404, JSON.stringify({ error: 'not_found' }))
  const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await readBody(req, 256 * 1024)
  if (body === null) return text(res, 413, JSON.stringify({ error: 'too_large' }))
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (req.headers['content-type']) headers['Content-Type'] = String(req.headers['content-type'])
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`
  try {
    const up = await fetch(TARGET + rest, { method: req.method, headers, body: body && body.length ? new Uint8Array(body) : undefined })
    text(res, up.status, await up.text(), up.headers.get('content-type') ?? 'application/json')
  } catch {
    text(res, 502, JSON.stringify({ error: 'backend_unreachable' }))
  }
}

/** Forward /jobs-api/api/jobs/ to the job list server. Only the list is reachable; the answer is kept for a minute. */
let jobsCache: { at: number; status: number; type: string; body: string } | null = null
async function jobsProxy(res: ServerResponse, rest: string) {
  if (!JOBS_TARGET) return text(res, 503, JSON.stringify({ error: 'JOBS_API_TARGET is not set' }))
  if (rest !== '/api/jobs/' && rest !== '/api/jobs') return text(res, 404, JSON.stringify({ error: 'not_found' }))
  if (jobsCache && Date.now() - jobsCache.at < 60_000) return text(res, jobsCache.status, jobsCache.body, jobsCache.type)
  try {
    const up = await fetch(JOBS_TARGET + '/api/jobs/', { headers: { Accept: 'application/json', ...(JOBS_TOKEN ? { Authorization: `Bearer ${JOBS_TOKEN}` } : {}) } })
    const body = await up.text()
    const type = up.headers.get('content-type') ?? 'application/json'
    if (up.ok) jobsCache = { at: Date.now(), status: up.status, type, body }
    text(res, up.status, body, type)
  } catch {
    text(res, 502, JSON.stringify({ error: 'jobs_unreachable' }))
  }
}

async function voiceRoute(req: IncomingMessage, res: ServerResponse, url: URL) {
  if (req.method !== 'POST') return text(res, 405, JSON.stringify({ error: 'method_not_allowed' }))
  if (!voice.apiKey) return text(res, 503, JSON.stringify({ error: 'SARVAM_API_KEY is not set' }))
  const body = await readBody(req, MAX_AUDIO_BYTES)
  if (!body) return text(res, 413, JSON.stringify({ error: 'too_large' }))
  const send = (r: { status: number; contentType: string; body: Uint8Array | string }) => {
    res.writeHead(r.status, { 'Content-Type': r.contentType, 'Cache-Control': 'no-store' })
    res.end(typeof r.body === 'string' ? r.body : Buffer.from(r.body))
  }
  if (url.pathname === '/voice/transcribe') {
    return send(await transcribeAudio(new Uint8Array(body), String(req.headers['content-type'] ?? ''), url.searchParams.get('language') ?? '', voice))
  }
  let parsed: unknown = null
  try {
    parsed = JSON.parse(body.toString('utf8'))
  } catch {
    /* speakText answers 400 */
  }
  return send(await speakText(parsed, voice))
}

async function staticFile(res: ServerResponse, pathname: string) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '')
  let file = join(DIST, clean)
  if (!file.startsWith(DIST)) return text(res, 403, 'Forbidden', 'text/plain')
  const info = await stat(file).catch(() => null)
  if (!info || info.isDirectory()) file = join(DIST, 'index.html') // app routes (/jobs, /profile ...) are handled in the browser
  try {
    const data = await readFile(file)
    const hashed = file.includes(`${join(DIST, 'assets')}`)
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache' })
    res.end(data)
  } catch {
    text(res, 404, 'Not found', 'text/plain')
  }
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const run = async () => {
    if (url.pathname === '/health') return text(res, 200, '{"status":"ok"}')
    if (url.pathname.startsWith('/jobs-api/') && req.method === 'GET') return jobsProxy(res, url.pathname.slice('/jobs-api'.length))
    if (url.pathname.startsWith('/profile-api/')) return profileProxy(req, res, url.pathname.slice('/profile-api'.length) + url.search)
    if (url.pathname === '/voice/transcribe' || url.pathname === '/voice/speak') return voiceRoute(req, res, url)
    if (req.method !== 'GET' && req.method !== 'HEAD') return text(res, 405, 'Method not allowed', 'text/plain')
    return staticFile(res, url.pathname)
  }
  run().catch(() => text(res, 500, JSON.stringify({ error: 'server_error' })))
}).listen(PORT, () => console.log(`Phala app on :${PORT} (profile backend: ${TARGET || 'NOT SET'}, voice: ${voice.apiKey ? 'on' : 'no key'})`))
