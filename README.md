# Glory Domain

A simple, mobile-first ministry app for **Pastor Sethwatchman** and his prayer group — live video/voice teachings, an embedded Bible with a daily verse, curated praise & worship, and a prayer wall. Built to be **easy to use**, **cheap to run**, and **light on mobile data**.

## Features

- **Live teachings & prayer calls** — group video/voice powered by Jitsi (free, unlimited), embedded in the app. Built-in chat, screen share and an audio-only mode for low data.
- **Recorded teachings library** — past sessions added as YouTube/Drive links and replayed in-app.
- **Holy Bible** — full **KJV** and **WEB** (public domain), browsable by book/chapter with search. Loads one chapter at a time and is cached for offline reading.
- **Verse of the day** — a deterministic daily verse (same for everyone each day), with an optional pastor override.
- **Praise & Worship** — curated YouTube songs/albums/playlists with a daily rotating pick.
- **Prayer wall** — members post requests; the pastor marks them *Praying* / *Answered*.
- **WhatsApp** — one-tap links to message the pastor and join the WhatsApp group.
- **Installable PWA** — "Add to home screen", works offline for Scripture you've opened.
- **Private** — one shared member passcode unlocks the app; a separate admin login lets the pastor manage everything.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Drizzle ORM + Neon Postgres · iron-session · Jitsi External API · deployed on Vercel.

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local      # then fill in the values (see below)

# 3. Create the database tables (uses DIRECT_URL / DATABASE_URL)
npm run db:push

# 4. Seed the default settings + worship items
npm run db:seed                 # default member passcode: "glory"

# 5. (Optional) Download the full Bible text — already included if committed
npm run bible:fetch

# 6. Run it
npm run dev                     # http://localhost:3000
```

### Environment variables (`.env.local`)

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection string (host contains `-pooler`). |
| `DIRECT_URL` | Neon **direct** (unpooled) string — used only for migrations. |
| `SESSION_SECRET` | Random string, **32+ characters**, for encrypting login cookies. |
| `ADMIN_PASSWORD` | The pastor's password for `/admin/login`. |

## How the pastor uses it

1. Go to **`/admin/login`** and sign in with `ADMIN_PASSWORD`.
2. **Settings** — set the ministry name, the member passcode (share it in WhatsApp), the WhatsApp links, and an optional daily-verse override.
3. **Teachings** — add a *Live session* (a private video room is created automatically) or a *Recording* (paste a YouTube/Drive link). After a live session, paste its recording link so it appears in the Library.
4. **Worship** — paste YouTube playlist/song links; the home screen rotates a "Today's pick".
5. **Prayer** — read requests and mark them *Praying* or *Answered*.

Members just open the app URL, enter the passcode once, and everything is in the bottom tab bar.

## Deploy to Vercel

1. Push to GitHub (`Brendon1109/Glory-Domain-Exclusive`).
2. In Vercel: **Add New → Project → import the repo** (Next.js auto-detected).
3. Add **Storage → Neon Postgres** (free tier) — it sets `DATABASE_URL`. Add `DIRECT_URL`, `SESSION_SECRET` and `ADMIN_PASSWORD` in **Project → Settings → Environment Variables**.
4. (Recommended) Set the function region to **Cape Town `cpt1`** (closest to Zimbabwe).
5. Deploy. Then run once against the production DB: `npm run db:push && npm run db:seed`.
6. Share the URL + passcode in the WhatsApp group.

## Notes

- **Recordings**: record a Jitsi session locally (or with OBS/phone), upload to YouTube *unlisted* or Google Drive, and paste the link in admin. The app stores links only — no video is hosted here.
- **Jitsi**: uses the free public `meet.jit.si`. For guaranteed moderation/branding later, switch the single `src/components/jitsi-room.tsx` to 8×8 JaaS.
- **App icon**: `public/icons/icon.svg` is used for the PWA. For the crispest iOS home-screen icon, you can add PNG versions (192/512) later.
- **Bible data** lives in `data/bible/{kjv,web}.json`; re-run `npm run bible:fetch` to refresh it.
- **Bible serving**: `npm run bible:split` (run automatically before every dev and build) splits that data into small files under `public/bible-data`, one per chapter plus search shards, so no request reads a whole translation. The output is generated and not committed.

## Moving to Cloudflare Workers

The app builds for both Vercel and Cloudflare Workers. Vercel stays production until the cutover, and the steps, secrets, DNS plan and rollback are in [docs/CLOUDFLARE-MOVE.md](docs/CLOUDFLARE-MOVE.md).
