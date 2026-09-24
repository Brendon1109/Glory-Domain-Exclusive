# Moving Glory Domain to Cloudflare Workers

The cutover runbook. Written 24 September 2026 alongside the pull request that made the code run on both hosts.

## Where things stand

- The code builds and runs on Vercel and on Cloudflare Workers. Vercel is production and `main` keeps deploying there until the DNS cutover.
- Nothing exists on Cloudflare yet. No Worker, no R2 bucket, no zone, no secrets.
- The Worker build is proven on Linux by the `Workers build` GitHub Actions job (OpenNext build plus `wrangler deploy --dry-run`). On 24 September 2026 it came to 14,773 KiB uncompressed, 3,319 KiB gzipped, against a 64 MiB uncompressed limit on both plans (there is no compressed limit any more).
- The Neon database (`dawn-meadow-29743559`, Frankfurt, Postgres 18) stays where it is. Both hosts talk to it over Neon's HTTP driver, so during the cutover both can serve at once with no data to move.
- `wrangler.jsonc` targets the personal Cloudflare account `def57486f42c3f50263d4ae8edf11cd0`. Never deploy this Worker to any other account.

## Decisions needed before starting

1. **The church's OK** on moving `glorydomain.org`. It is their name.
2. **Workers Paid** on the personal account, USD 5 a month (Manage Account, Billing, Subscriptions). Free will not run this app: 10 ms of CPU per request and per cron run is less than one Next page render, and 50 subrequests per request caps a push broadcast at about 40 subscribers (each push is one subrequest, plus the database queries).
3. **The admin password.** `ADMIN_PASSWORD` is sensitive on Vercel and cannot be read back. Either the pastor keeps his current password and types it in when the secret is set, or a new one is set and given to him in person or on a call. Never through a chat.
4. **Push notifications.** Setting the VAPID pair turns push on. Today it is off on Vercel (no VAPID variables there at all).
5. **Domain renewal.** Auto renew on `glorydomain.org` is off and it expires on 1 July 2027. Turn it on at Vercel or diarise it, and write down who pays.
6. **Placement.** `wrangler.jsonc` uses Smart Placement, which only moves a Worker once it sees steady traffic from several locations. This app has little traffic, so it may stay near the visitor and pay a southern Africa to Frankfurt round trip on every database query. The alternative is `"placement": { "region": "aws:eu-central-1" }`, which pins it next to Neon the way `fra1` did on Vercel.

## Worker secrets and variables

Secrets are set with `npx wrangler secret put NAME` (it prompts for the value, so nothing lands in shell history) or in the dashboard. They are write only on Cloudflare, so bank each value before setting it. Variables live in `wrangler.jsonc` and every deploy rewrites them from that file.

| Name | Kind | Where the value comes from |
|---|---|---|
| `DATABASE_URL` | secret | Neon API, project `dawn-meadow-29743559`, the pooled connection string (`GET /api/v2/projects/dawn-meadow-29743559/connection_uri?database_name=<db>&role_name=<role>&pooled=true` with the Neon API key). Sensitive on Vercel, cannot be read back there. The HTTP driver accepts the pooled or the direct string. |
| `SESSION_SECRET` | secret | Generate a new one, at least 32 characters (`openssl rand -base64 48`). Sensitive on Vercel. A new value signs the pastor out once. |
| `ADMIN_PASSWORD` | secret | The pastor's decision above. Sensitive on Vercel. |
| `CRON_SECRET` | secret | Banked as `GLORY_CRON_SECRET` in Brendon's vault file (Breazy `.claude/.env`). The same value as Vercel production. Set it only at the cron cutover step, never earlier. |
| `VAPID_PRIVATE_KEY` | secret | Banked as `GLORY_VAPID_PRIVATE_KEY`. Only if push goes on. |
| `VAPID_SUBJECT` | secret or var | Banked as `GLORY_VAPID_SUBJECT`. Only if push goes on. It must be a mailbox someone reads, the code's fallback `admin@glorydomain.org` has no mail records behind it. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | **build** variable | Banked as `GLORY_VAPID_PUBLIC_KEY`. Only if push goes on. Next bakes `NEXT_PUBLIC_` values into the bundle at build time, so it goes under Workers Builds, Settings, Build, Variables. A runtime secret alone does nothing. |
| `MEDIA_R2_ACCESS_KEY_ID`, `MEDIA_R2_SECRET_ACCESS_KEY` | secret | An R2 API token with Object Read and Write on the `glory-domain-media` bucket only (R2, Manage API tokens). The secret is shown once, bank it as `GLORY_R2_ACCESS_KEY_ID` and `GLORY_R2_SECRET_ACCESS_KEY` first. |
| `MEDIA_PUBLIC_BASE_URL` | var | `https://media.glorydomain.org`, added to `vars` in `wrangler.jsonc` by pull request once that hostname serves the bucket. Until all R2 values exist, uploads answer "Uploads are not set up yet" instead of half working. |
| `MEDIA_STORAGE`, `MEDIA_R2_ACCOUNT_ID`, `MEDIA_R2_BUCKET` | var | Already in `wrangler.jsonc` (`r2`, the account id, `glory-domain-media`). |
| `BIBLE_BRAIN_KEY` | secret | Optional and not set on Vercel today. Without it the listen button uses the phone's own voice. |

Not needed on the Worker: `DIRECT_URL` (only drizzle-kit reads it, from a local `.env.local`), and `BLOB_STORE_ID` and `BLOB_WEBHOOK_PUBLIC_KEY` (Vercel Blob only).

## Order of steps

### 1. Merge and bank

1. Merge the Next 16.3.6 pull request, then the Workers preparation one. Check `https://glorydomain.org` after each merge, Vercel is still production.
2. Upgrade the personal account to Workers Paid.
3. Bank before anything is set: the Neon connection strings (fetched from the Neon API), a freshly generated `SESSION_SECRET`, and the admin password decision.

### 2. Create the Worker through Workers Builds

Production only ever comes from the pipeline, never from a laptop (OpenNext's bundle step fails on Windows anyway).

1. Dashboard, Workers and Pages, Create, Import a repository. Pick `Brendon1109/Glory-Domain-Exclusive` (the Cloudflare GitHub app needs access to it once). The Worker name must be `glory-domain`, matching `wrangler.jsonc`.
2. Production branch `main`. Build command `npx opennextjs-cloudflare build`. Deploy command `npx wrangler deploy`. Root directory `/`. Node comes from `.node-version` (22). Builds for other branches off.
3. The first build deploys to `https://glory-domain.<account subdomain>.workers.dev`. From now on every merge to `main` deploys to Vercel and to the Worker, which is what lets the cutover be a DNS change.

### 3. Secrets, then verify on workers.dev

1. Set `DATABASE_URL`, `SESSION_SECRET` and `ADMIN_PASSWORD`. Not `CRON_SECRET`, not VAPID, not R2 yet.
2. Check on `workers.dev`, on a phone as well as a laptop:
   - `/`, `/bible`, `/bible/JHN/3`, `/bible/search` (search "love" and a word that matches nothing), `/teachings`, `/worship`, `/prayer` all load.
   - Load `/worship` five times in a row. The old `pg` Pool hung from the second request on Workers, this is the regression check.
   - Switch translation to Shona on Genesis 1, it should say the chapter is not in that translation.
   - `/admin` redirects to `/admin/login`, the password works, every admin page opens.
   - `/api/push/daily` answers 503 (no `CRON_SECRET` yet), which is correct.
   - Workers Logs show no errors, apart from the daily cron run, which fails with 503 every morning until step 4. That is the fail closed check doing its job while Vercel still runs the real cron.

### 4. Cron cutover, one scheduler only

Both schedulers fire at 05:00 UTC against the same database, and each sends every queued push it finds, so if both hold the secret the members get every queued message twice. Move it in one sitting:

1. `npx wrangler secret put CRON_SECRET` with the banked `GLORY_CRON_SECRET` value.
2. In the same sitting, a pull request that removes the `crons` entry from `vercel.json`.
3. The next morning, check the Worker's cron events and logs for `[cron 0 5 * * *] /api/push/daily 200`. A non 2xx answer marks the run failed there.

Note that while push is off, the route still marks queued rows as sent, so anything the pastor queues after hours is dropped. That is how the code behaved before this move too.

### 5. DNS

`glorydomain.org` stays registered at Vercel (Name.com is the registrar of record). Only the nameservers move, to a zone on the personal Cloudflare account. There are no mail records, only the apex A, `www` and CAA. `www` redirects to the apex today.

1. Add `glorydomain.org` as a zone on the personal account (Free zone plan). Note the two nameservers.
2. Before switching, create records in the new zone that copy today's Vercel ones, DNS only (grey cloud): the apex A and the `www` record, with the values shown in Vercel's DNS panel. Do not copy Vercel's CAA record. This way the switch itself changes nothing a visitor sees.
3. At Vercel, Domains, `glorydomain.org`, set custom nameservers to the two Cloudflare ones. Wait for the zone to show Active.
4. At a quiet hour (after 20:00 Harare time, when no pushes go out), delete the copied apex record and add `glorydomain.org` as a Custom Domain on the Worker (Settings, Domains and Routes). Expect a few minutes while its certificate is issued.
5. `www`: a proxied placeholder record (`AAAA 100::`) and a Redirect Rule sending `www.glorydomain.org/*` to `https://glorydomain.org/${path}` with a 301.
6. Verify on the real domain: the same checklist as step 3, plus the service worker and install prompt, and `curl -I https://glorydomain.org/` shows Cloudflare.
7. Keep the Vercel project deployed as the rollback for at least a week. Deleting the project later does not touch the domain registration.

### 6. R2 for sermon media

Needs the zone Active, because a bucket's custom domain must be a zone on the same account.

1. `npx wrangler r2 bucket create glory-domain-media --location weur`
2. CORS for the browser upload. Save as `r2-cors.json` and run `npx wrangler r2 bucket cors set glory-domain-media --file r2-cors.json`:

   ```json
   {
     "rules": [
       {
         "allowed": {
           "origins": ["https://glorydomain.org", "https://glory-domain.<account subdomain>.workers.dev"],
           "methods": ["PUT"],
           "headers": ["content-type"]
         },
         "exposeHeaders": ["ETag"],
         "maxAgeSeconds": 3600
       }
     ]
   }
   ```

   Playback needs no CORS, the players load media without `crossOrigin`.
3. Public playback: `npx wrangler r2 bucket domain add glory-domain-media --domain media.glorydomain.org --zone-id <zone id> --min-tls 1.2`. R2 serves range requests, so seeking works. Leave the `r2.dev` URL off, it is rate limited and meant for testing.
4. Create the R2 API token, bank it, set `MEDIA_R2_ACCESS_KEY_ID` and `MEDIA_R2_SECRET_ACCESS_KEY`, and merge the pull request adding `MEDIA_PUBLIC_BASE_URL`.
5. Test before telling the pastor: upload a small MP3 from a teaching in the admin, confirm it plays and seeks from `media.glorydomain.org`. Then prove the size lock: get a presigned URL for that file and PUT a different sized body with curl, which must answer 403 SignatureDoesNotMatch. Presigned URLs only work on the S3 endpoint `https://def57486f42c3f50263d4ae8edf11cd0.r2.cloudflarestorage.com`, never on the custom domain.

Cost: R2's free allowance is 10 GB-month of storage, 1 million Class A and 10 million Class B operations a month, with free egress, then USD 0.015 per GB-month (read 24 September 2026). Vercel Blob holds 0 files and 0 database rows point at it, so nothing is copied across.

### 7. Push, if Brendon says yes

Set `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` as secrets, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` as a Workers Builds build variable, then trigger a rebuild so the public key is baked in. Test with one subscribed phone before the pastor sends to everyone.

### 8. Clean up after a clean week

- Delete `vercel.json` and the Vercel Blob path (`src/app/api/blob/upload`, the `@vercel/blob` dependency and the `vercel-blob` branch in `src/lib/media-storage.ts`), and the empty Blob store.
- Pause, then later delete, the Vercel project. The domain registration stays at Vercel either way.

## Rollback

- **Before DNS:** nothing to undo, Vercel is production.
- **After DNS, fast:** remove the Worker's Custom Domain and put back the apex record pointing at Vercel (the value copied in step 5). Vercel still deploys `main`, so it serves the same code against the same database. Put the Vercel cron back and delete the Worker's `CRON_SECRET` in the same sitting, so only one scheduler runs.
- **A bad Worker deploy:** Deployments, roll back to the previous version, or revert the commit on `main`.
- Keep the zone on Cloudflare when rolling back. Moving the nameservers back takes hours and takes `media.glorydomain.org` down with it.

## What was not verified before cutover

These need a real Worker or a real bucket, which do not exist yet:

- The Neon HTTP driver, web-push and iron-session on a deployed Worker (the driver is proven on Vercel preview, the other two ran under `nodejs_compat` in a local probe).
- The Bible files through the ASSETS binding on a deployed Worker (proven through `fs` on Vercel with identical output).
- The cron firing on Cloudflare.
- The presigned PUT against a real bucket and its CORS, including R2 enforcing the signed Content-Length.
