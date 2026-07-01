// Captures screenshots of the live app and renders a compact, easy-to-read PDF guide.
//   Setup (dev only, not committed): npm i -D playwright && npx playwright install chromium
//   Run: node scripts/make-guide.mjs
import { chromium } from "playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const BASE = "https://glory-domain-exclusive.vercel.app";
const SITE = "glorydomain.org";
const ADMIN_PW = "@glorydomain26";
const shotsDir = path.join(os.tmpdir(), "gd-guide-shots");
const outPdf = path.join(process.cwd(), "Glory-Domain-App-Guide.pdf");

await mkdir(shotsDir, { recursive: true });
const browser = await chromium.launch();

// ---- Member screens (mobile, fixed viewport → no elongated strips) ----
const phone = await browser.newContext({
  viewport: { width: 400, height: 780 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const p = await phone.newPage();

async function shot(url, name, waitSel) {
  try {
    await p.goto(BASE + url, { waitUntil: "load", timeout: 45000 });
    if (waitSel) await p.waitForSelector(waitSel, { timeout: 9000 }).catch(() => {});
    await p.waitForTimeout(1700);
    await p.screenshot({ path: path.join(shotsDir, name + ".png") }); // viewport only
    console.log("shot", name);
  } catch (e) {
    console.log("FAIL", name, e.message);
  }
}

await shot("/", "home");
await shot("/bible", "bible-list");
await shot("/bible/JHN/3", "bible-read", "sup");
try {
  await p.goto(BASE + "/bible/search", { waitUntil: "load" });
  await p.fill("input", "faith");
  await p.click('button[type="submit"]');
  await p.waitForTimeout(2000);
  await p.screenshot({ path: path.join(shotsDir, "bible-search.png") });
  console.log("shot bible-search");
} catch (e) {
  console.log("FAIL bible-search", e.message);
}
await shot("/teachings", "teachings");
await shot("/worship", "worship");
await shot("/prayer", "prayer");
await phone.close();

// ---- Pastor / admin screens (fixed viewport) ----
const desk = await browser.newContext({
  viewport: { width: 700, height: 860 },
  deviceScaleFactor: 2,
});
const a = await desk.newPage();
try {
  await a.goto(BASE + "/admin/login", { waitUntil: "load" });
  await a.waitForTimeout(700);
  await a.screenshot({ path: path.join(shotsDir, "admin-login.png") });
  console.log("shot admin-login");
  await a.fill('input[name="password"]', ADMIN_PW);
  await a.click('button[type="submit"]');
  await a.waitForURL("**/admin", { timeout: 20000 });
  await a.waitForTimeout(1000);
} catch (e) {
  console.log("FAIL admin-login", e.message);
}
async function ashot(url, name) {
  try {
    await a.goto(BASE + url, { waitUntil: "load", timeout: 45000 });
    await a.waitForTimeout(1000);
    await a.screenshot({ path: path.join(shotsDir, name + ".png") });
    console.log("shot", name);
  } catch (e) {
    console.log("FAIL", name, e.message);
  }
}
await ashot("/admin", "admin-dash");
await ashot("/admin/word", "admin-word");
await ashot("/admin/teachings", "admin-teachings");
await ashot("/admin/prayer", "admin-prayer");
await ashot("/admin/worship", "admin-worship");
await ashot("/admin/settings", "admin-settings");
await desk.close();

// ---- Build the PDF ----
async function img(name) {
  try {
    const b = await readFile(path.join(shotsDir, name + ".png"));
    return "data:image/png;base64," + b.toString("base64");
  } catch {
    return "";
  }
}

const MEMBER = [
  { shot: "home", title: "Opening the app & menu", steps: ["Open <b>" + SITE + "</b> in your phone browser — no password needed.", "Use the <b>bottom menu</b>: Home, Bible, Teach, Worship, Prayer.", "Tip: browser menu → <b>“Add to Home screen”</b> to use it like an app."] },
  { shot: "home", title: "The Home screen", steps: ["<b>Verse of the Day</b> at the top (changes daily).", "The pastor's <b>Word for Today</b> appears here when posted.", "See the next teaching, worship, and <b>WhatsApp</b> buttons."] },
  { shot: "bible-list", title: "Bible — choose a book", steps: ["Tap <b>Bible</b>, then tap a book (Old or New Testament).", "Tap <b>Search</b> (top right) to find a word or phrase."] },
  { shot: "bible-read", title: "Bible — read a chapter", steps: ["Use <b>Previous / Next</b> to move between chapters.", "Toggle translation: <b>KJV</b>, <b>WEB</b> (modern) or <b>Shona</b>.", "Shona covers the New Testament (Matthew–Revelation)."] },
  { shot: "bible-search", title: "Search the Bible", steps: ["Type a word and tap search.", "Tap a result to open that verse.", "Works in KJV, WEB or Shona."] },
  { shot: "teachings", title: "Teachings & recordings", steps: ["<b>Upcoming</b> = live sessions; <b>Library</b> = recordings.", "Tap a session, enter your name, tap <b>Join</b>.", "Keep camera off (or use audio-only) to save data."] },
  { shot: "worship", title: "Praise & Worship", steps: ["Tap <b>Worship</b> for songs, albums & playlists.", "A fresh <b>Today's pick</b> each day.", "Tap any card to play it."] },
  { shot: "prayer", title: "The Prayer wall", steps: ["Write a request (name optional), tap <b>Share request</b>.", "The pastor marks it <b>Praying</b> or <b>Answered</b>."] },
];

const PASTOR = [
  { shot: "admin-login", title: "Signing in", steps: ["Go to <b>" + SITE + "/admin</b> (or tap the gear icon).", "Enter your <b>admin password</b> → <b>Sign in</b>.", "Keep this password private."] },
  { shot: "admin-dash", title: "Your dashboard", steps: ["Quick counts up top.", "Tabs: <b>Word, Teachings, Prayer, Worship, Settings</b>.", "<b>View app</b> to preview; <b>Sign out</b> when done."] },
  { shot: "admin-word", title: "Post the daily Word", steps: ["Open <b>Word</b>, write your teaching, tap <b>Post</b>.", "It appears on every member's Home screen.", "Post a new one daily; the latest shows."] },
  { shot: "admin-teachings", title: "Schedule teachings", steps: ["Choose <b>Live session</b> (a video room is auto-created) or <b>Recording</b> (paste a link).", "Tap <b>Add teaching</b>.", "After a live session, paste its recording link."] },
  { shot: "admin-prayer", title: "Answer prayers", steps: ["See every request.", "Tap <b>Praying</b> or <b>Answered</b>.", "Delete anything inappropriate."] },
  { shot: "admin-worship", title: "Manage worship", steps: ["Add a title, type, and <b>YouTube link</b>, tap <b>Add</b>.", "It appears in the members' Worship section."] },
  { shot: "admin-settings", title: "Settings", steps: ["Set ministry name and <b>WhatsApp</b> links.", "Optionally set a <b>daily verse override</b>.", "Tap <b>Save settings</b>."] },
];

async function cards(list) {
  const out = [];
  for (const s of list) {
    const src = await img(s.shot);
    const steps = s.steps.map((t) => `<li>${t}</li>`).join("");
    out.push(
      `<div class="card ${list === MEMBER ? "phone" : "screen"}"><h3>${s.title}</h3>` +
        `<div class="thumb">${src ? `<img src="${src}"/>` : ""}</div>` +
        `<ol>${steps}</ol></div>`,
    );
  }
  return out.join("");
}

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}
  body{font-family:"Segoe UI",Arial,sans-serif;color:#1b1a17;margin:0;font-size:11px;line-height:1.45}
  h1,h2,h3{font-family:Georgia,"Times New Roman",serif}
  .cover{background:#1b1a17;color:#f6f4ee;height:990px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;page-break-after:always}
  .mono{width:88px;height:88px;border:3px solid #9a7b3f;border-radius:20px;display:flex;align-items:center;justify-content:center;color:#9a7b3f;font-family:Georgia,serif;font-size:40px;font-weight:bold}
  .cover h1{font-size:54px;margin:24px 0 6px}
  .cover .sub{font-size:20px;color:rgba(246,244,238,.72)}
  .cover .rule{width:110px;height:5px;background:#9a7b3f;border-radius:3px;margin:30px 0}
  .cover .addr{font-size:17px;color:#9a7b3f;letter-spacing:1px}
  .cover .who{margin-top:8px;font-size:13px;color:rgba(246,244,238,.6)}
  .intro{padding:6px 2px 0}
  .intro p{color:#4a463c;max-width:660px;margin:6px 0 0}
  .band{background:#f1ead9;border-left:5px solid #9a7b3f;padding:9px 14px;margin:16px 0 12px}
  .band .eyebrow{color:#9a7b3f;font-size:10px;letter-spacing:3px;text-transform:uppercase;font-weight:bold}
  .band h2{margin:1px 0 0;font-size:21px}
  .grid{column-count:2;column-gap:14px}
  .card{break-inside:avoid;-webkit-column-break-inside:avoid;margin:0 0 12px;padding:10px 11px;border:1px solid #ece7db;border-radius:11px;background:#fff}
  .card h3{font-size:13px;margin:0 0 7px;color:#1b1a17}
  .card .thumb{text-align:center;margin-bottom:8px}
  .card.phone img{width:150px}
  .card.screen img{width:100%}
  .card img{border:1px solid #e2ddd0;border-radius:8px;box-shadow:0 1px 4px rgba(20,18,15,.08);display:inline-block}
  .card ol{margin:0;padding-left:15px}
  .card li{margin-bottom:4px;color:#33302a}
  .card b{color:#1b1a17}
</style></head><body>
  <div class="cover">
    <div class="mono">GD</div>
    <h1>Glory Domain</h1>
    <div class="sub">A Simple Guide to Using the App</div>
    <div class="rule"></div>
    <div class="addr">${SITE}</div>
    <div class="who">For members &amp; for the pastor</div>
  </div>

  <div class="intro">
    <div class="band"><div class="eyebrow">Part 1</div><h2>For Members</h2></div>
    <p style="margin-bottom:12px">Just open <b>${SITE}</b> on your phone — no password needed. Everything is in the bottom menu.</p>
  </div>
  <div class="grid">${await cards(MEMBER)}</div>

  <div class="band"><div class="eyebrow">Part 2</div><h2>For the Pastor</h2></div>
  <div class="grid">${await cards(PASTOR)}</div>
</body></html>`;

const pdfPage = await browser.newPage();
await pdfPage.setContent(html, { waitUntil: "load" });
await pdfPage.pdf({
  path: outPdf,
  format: "A4",
  printBackground: true,
  margin: { top: "12mm", bottom: "14mm", left: "12mm", right: "12mm" },
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate:
    '<div style="width:100%;font-size:9px;color:#9a9384;font-family:Arial;padding:0 12mm;display:flex;justify-content:space-between;"><span>Glory Domain — App Guide</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
});
await browser.close();

const { size } = await import("node:fs").then((fs) => fs.promises.stat(outPdf));
console.log(`\nDONE → ${outPdf} (${(size / 1024).toFixed(0)} KB)`);
