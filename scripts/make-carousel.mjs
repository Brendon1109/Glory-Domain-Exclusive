// Builds a LinkedIn 4:5 carousel PDF (story + how-it-works) with fresh screenshots.
//   Setup (dev only): npm i -D playwright && npx playwright install chromium
//   Run: node scripts/make-carousel.mjs
// Inserts a little realistic sample content so screenshots aren't empty, captures,
// then deletes it again.
import { config } from "dotenv";
config({ path: ".env.local" });
import pg from "pg";
import { chromium } from "playwright";
import { readFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const BASE = "https://glory-domain-exclusive.vercel.app";
const SITE = "glorydomain.org";
const shotsDir = path.join(os.tmpdir(), "gd-carousel-shots");
const outPdf = path.join(process.cwd(), "Glory-Domain-LinkedIn-Carousel.pdf");
await mkdir(shotsDir, { recursive: true });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const browser = await chromium.launch();

async function warmup() {
  for (let i = 0; i < 6; i++) {
    try {
      await pool.query("select 1");
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
}

try {
  await warmup();
  const when = new Date(Date.now() + 20 * 3600 * 1000);
  await pool.query("insert into daily_words (title, body) values ($1,$2)", [
    "Walking by Faith",
    "Beloved, faith is trusting God even when the whole path isn’t clear. Today, take one step of obedience — and watch Him make a way. “We walk by faith, not by sight.”",
  ]);
  await pool.query(
    "insert into teachings (title, description, kind, scheduled_at, room_name, audio_only) values ($1,$2,'live',$3,$4,false)",
    ["Evening Prayer & The Word", "Join us as we pray together and open the Scriptures.", when, "glory-demo"],
  );
  await pool.query("insert into prayer_requests (name, body, status) values ($1,$2,'praying')", [
    "Grace",
    "Please pray for my family back home and for safe travels this week. Thank you, church family.",
  ]);

  const phone = await browser.newContext({
    viewport: { width: 400, height: 780 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const p = await phone.newPage();
  async function shot(url, name, waitSel) {
    await p.goto(BASE + url, { waitUntil: "load", timeout: 45000 });
    if (waitSel) await p.waitForSelector(waitSel, { timeout: 9000 }).catch(() => {});
    await p.waitForTimeout(1800);
    await p.screenshot({ path: path.join(shotsDir, name + ".png") });
    console.log("shot", name);
  }
  await shot("/", "home");
  await shot("/teachings", "teachings");
  await shot("/bible/JHN/3", "bible", "sup");
  await shot("/prayer", "prayer");
  await shot("/worship", "worship");
  await phone.close();
} finally {
  // clean up sample content by its unique markers (robust to partial failures)
  await pool.query("delete from daily_words where title='Walking by Faith'").catch(() => {});
  await pool.query("delete from teachings where room_name='glory-demo'").catch(() => {});
  await pool
    .query("delete from prayer_requests where name='Grace' and body like 'Please pray for my family back home%'")
    .catch(() => {});
  await pool.end();
  console.log("sample content removed");
}

async function img(name) {
  try {
    const b = await readFile(path.join(shotsDir, name + ".png"));
    return "data:image/png;base64," + b.toString("base64");
  } catch {
    return "";
  }
}

const slides = [
  { type: "s", bg: "ink", eyebrow: "Glory Domain", headline: "A pastor in Zimbabwe just wanted to pray with his people.", body: "The technology kept getting in the way.", footer: "swipe →" },
  { type: "s", bg: "paper", eyebrow: "The problem", headline: "Zoom cut every prayer short at 40 minutes.", body: ["A church family scattered across the world.", "Back home, costly data and weak networks made simply joining a battle."] },
  { type: "s", bg: "ink", eyebrow: "The idea", headline: "So I built something that fits the people — not the other way around." },
  { type: "s", bg: "paper", eyebrow: "Meet", headline: "Glory Domain", body: "A light, low-data web app that keeps a faith community connected — across borders.", footer: SITE },
  { type: "f", bg: "paper", eyebrow: "Gather", headline: "Live prayer & teaching — no time limits", body: "Low-data video & voice, right in the browser.", shot: "teachings" },
  { type: "f", bg: "paper", eyebrow: "Every day", headline: "A verse and a Word from the pastor", body: "Daily Scripture and a short teaching on the home screen.", shot: "home" },
  { type: "f", bg: "paper", eyebrow: "Scripture", headline: "The Bible — English & Shona", body: "KJV, modern English, and Shona (New Testament).", shot: "bible" },
  { type: "f", bg: "paper", eyebrow: "Prayer", headline: "Private prayer requests", body: "They go straight to the pastor — no one else sees them.", shot: "prayer" },
  { type: "f", bg: "paper", eyebrow: "Worship", headline: "Daily praise & worship", body: "Curated gospel songs and playlists — a fresh pick each day.", shot: "worship" },
  { type: "s", bg: "ink", eyebrow: "Built for real life", headline: "Works on any phone. One tap. No sign-ups.", body: "Light on data. Installable. Made for low connectivity." },
  { type: "s", bg: "paper", eyebrow: "The lesson", headline: "Good technology meets people where they are.", body: "A church, a small business, an NGO — design around the real barriers, and you include everyone." },
  { type: "s", bg: "ink", eyebrow: "See it live", headline: SITE, body: "If your organisation needs to reach people who keep getting left behind, let’s talk.", footer: "Built by Brendon — Portfolio · LinkedIn" },
];

async function render(s) {
  const src = s.shot ? await img(s.shot) : "";
  if (s.type === "f") {
    return `<div class="slide ${s.bg}"><div class="pad">
      <div class="eyebrow">${s.eyebrow}</div>
      <h2 class="hl">${s.headline}</h2>
      ${s.body ? `<p class="sub">${s.body}</p>` : ""}
      <div class="phone">${src ? `<img src="${src}"/>` : ""}</div>
    </div><div class="foot"><span>${SITE}</span><span>Glory Domain</span></div></div>`;
  }
  const body = s.body ? (Array.isArray(s.body) ? s.body.join("<br><br>") : s.body) : "";
  return `<div class="slide ${s.bg} center"><div class="pad col">
      ${s.eyebrow ? `<div class="eyebrow">${s.eyebrow}</div>` : ""}
      <h1 class="big">${s.headline}</h1>
      ${body ? `<p class="stmt">${body}</p>` : ""}
      ${s.footer ? `<div class="cta">${s.footer}</div>` : ""}
    </div><div class="foot"><span>${SITE}</span><span></span></div></div>`;
}

const body = (await Promise.all(slides.map(render))).join("");
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  .slide{width:1080px;height:1350px;page-break-after:always;position:relative;overflow:hidden;font-family:"Segoe UI",Arial,sans-serif}
  .slide.ink{background:#1b1a17;color:#f6f4ee}
  .slide.paper{background:#f6f4ee;color:#1b1a17}
  .pad{padding:94px 88px;height:100%}
  .center .pad.col{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
  .eyebrow{color:#9a7b3f;font-size:25px;letter-spacing:6px;text-transform:uppercase;font-weight:700;margin-bottom:22px}
  .hl{font-family:Georgia,serif;font-size:64px;line-height:1.12;font-weight:700}
  .big{font-family:Georgia,serif;font-size:78px;line-height:1.08;font-weight:700;max-width:900px}
  .sub{font-size:33px;margin-top:20px}
  .stmt{font-size:37px;line-height:1.42;margin-top:28px;max-width:840px}
  .cta{margin-top:38px;color:#9a7b3f;font-size:29px;font-weight:600}
  .phone{display:flex;justify-content:center;margin-top:50px}
  .phone img{width:360px;border-radius:26px;border:1px solid #e2ddd0;box-shadow:0 22px 55px rgba(20,18,15,.28)}
  .foot{position:absolute;bottom:50px;left:88px;right:88px;display:flex;justify-content:space-between;font-size:22px}
  .slide.paper .sub,.slide.paper .stmt{color:#4a463c}
  .slide.ink .sub,.slide.ink .stmt{color:rgba(246,244,238,.75)}
  .slide.paper .foot{color:#a49d8c}
  .slide.ink .foot{color:rgba(246,244,238,.45)}
</style></head><body>${body}</body></html>`;

const pdfPage = await browser.newPage();
await pdfPage.setContent(html, { waitUntil: "load" });
await pdfPage.pdf({
  path: outPdf,
  width: "1080px",
  height: "1350px",
  printBackground: true,
  margin: { top: "0", bottom: "0", left: "0", right: "0" },
});
await browser.close();

const { size } = await import("node:fs").then((fs) => fs.promises.stat(outPdf));
console.log(`\nDONE → ${outPdf} (${(size / 1024).toFixed(0)} KB, ${slides.length} slides)`);
