// Captures screenshots of the live app and renders an easy-to-read PDF guide.
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

// Neutralise fixed/sticky bars so full-page screenshots don't duplicate them.
const INJECT =
  "header{position:static!important} nav{position:static!important} main{padding-bottom:20px!important} .fixed{position:static!important} .backdrop-blur{backdrop-filter:none!important}";

await mkdir(shotsDir, { recursive: true });
const browser = await chromium.launch();

// ---- Member screens (mobile) ----
const phone = await browser.newContext({
  viewport: { width: 400, height: 850 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const p = await phone.newPage();

async function shot(url, name, waitSel) {
  try {
    await p.goto(BASE + url, { waitUntil: "load", timeout: 45000 });
    await p.addStyleTag({ content: INJECT });
    if (waitSel) await p.waitForSelector(waitSel, { timeout: 9000 }).catch(() => {});
    await p.waitForTimeout(1800);
    await p.screenshot({ path: path.join(shotsDir, name + ".png"), fullPage: true });
    console.log("shot", name);
  } catch (e) {
    console.log("FAIL", name, e.message);
  }
}

await shot("/", "home");
await shot("/bible", "bible-list");
await shot("/bible/JHN/3", "bible-read", "sup");
// search with a sample query
try {
  await p.goto(BASE + "/bible/search", { waitUntil: "load" });
  await p.addStyleTag({ content: INJECT });
  await p.fill("input", "faith");
  await p.click('button[type="submit"]');
  await p.waitForTimeout(2200);
  await p.screenshot({ path: path.join(shotsDir, "bible-search.png"), fullPage: true });
  console.log("shot bible-search");
} catch (e) {
  console.log("FAIL bible-search", e.message);
}
await shot("/teachings", "teachings");
await shot("/worship", "worship");
await shot("/prayer", "prayer");
await phone.close();

// ---- Pastor / admin screens ----
const desk = await browser.newContext({
  viewport: { width: 760, height: 1000 },
  deviceScaleFactor: 2,
});
const a = await desk.newPage();
try {
  await a.goto(BASE + "/admin/login", { waitUntil: "load" });
  await a.waitForTimeout(800);
  await a.screenshot({ path: path.join(shotsDir, "admin-login.png"), fullPage: true });
  console.log("shot admin-login");
  await a.fill('input[name="password"]', ADMIN_PW);
  await a.click('button[type="submit"]');
  await a.waitForURL("**/admin", { timeout: 20000 });
  await a.waitForTimeout(1200);
} catch (e) {
  console.log("FAIL admin-login", e.message);
}
async function ashot(url, name) {
  try {
    await a.goto(BASE + url, { waitUntil: "load", timeout: 45000 });
    await a.waitForTimeout(1200);
    await a.screenshot({ path: path.join(shotsDir, name + ".png"), fullPage: true });
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
  {
    shot: "home",
    device: "phone",
    title: "Opening the app & the menu",
    steps: [
      `Open <b>${SITE}</b> in your phone's web browser.`,
      "That's it — no password needed. You're straight in.",
      "The <b>menu bar at the bottom</b> has five buttons: <b>Home</b>, <b>Bible</b>, <b>Teach</b>, <b>Worship</b> and <b>Prayer</b>. Tap any of them to move around.",
      "Tip: in your browser menu, tap <b>“Add to Home screen”</b> so it opens like a normal app.",
    ],
  },
  {
    shot: "home",
    device: "phone",
    title: "The Home screen",
    steps: [
      "The <b>Verse of the Day</b> is at the top — it changes every day.",
      "Below it, the pastor's <b>Word for Today</b> (a short teaching) appears when he posts one.",
      "You'll see the <b>Next teaching</b>, quick buttons, <b>Today's worship</b>, and buttons to open the <b>WhatsApp</b> group.",
    ],
  },
  {
    shot: "bible-list",
    device: "phone",
    title: "Reading the Bible — choose a book",
    steps: [
      "Tap <b>Bible</b> in the bottom menu.",
      "Scroll to the <b>Old Testament</b> or <b>New Testament</b> and tap the book you want (e.g. John).",
      "Tap <b>Search</b> (top right) to look for a word or phrase.",
    ],
  },
  {
    shot: "bible-read",
    device: "phone",
    title: "Reading the Bible — a chapter",
    steps: [
      "Read the chapter. Use <b>Previous</b> / <b>Next</b> at the bottom to move between chapters.",
      "Use the toggle (top right) to switch translation: <b>KJV</b>, <b>WEB</b> (modern English) or <b>Shona</b>.",
      "Note: the Shona Bible is the New Testament (Matthew–Revelation).",
    ],
  },
  {
    shot: "bible-search",
    device: "phone",
    title: "Searching the Bible",
    steps: [
      "Type a word or phrase and tap the search button.",
      "Tap any result to open that verse in the chapter.",
      "You can search in KJV, WEB or Shona using the small toggle.",
    ],
  },
  {
    shot: "teachings",
    device: "phone",
    title: "Live teachings & recordings",
    steps: [
      "Tap <b>Teach</b>. <b>Upcoming</b> shows live sessions; <b>Library</b> shows past recordings.",
      "Tap a session, type your <b>name</b>, then tap <b>Join the teaching</b> to enter the video call.",
      "To save data, you can keep your camera off, or join sessions marked <b>Audio only</b>.",
    ],
  },
  {
    shot: "worship",
    device: "phone",
    title: "Praise & Worship",
    steps: [
      "Tap <b>Worship</b> to see songs, albums and playlists.",
      "There's a fresh <b>Today's pick</b> each day, plus the full collection.",
      "Tap any card to play it (it opens the video / YouTube).",
    ],
  },
  {
    shot: "prayer",
    device: "phone",
    title: "The Prayer wall",
    steps: [
      "Tap <b>Prayer</b>. Type your request (your name is optional) and tap <b>Share request</b>.",
      "Everyone in the group can see requests and pray together.",
      "The pastor marks requests <b>Praying</b> or <b>Answered</b> — you'll see the badge update.",
    ],
  },
];

const PASTOR = [
  {
    shot: "admin-login",
    device: "screen",
    title: "Signing in as the pastor",
    steps: [
      `Go to <b>${SITE}/admin</b> (or tap the small <b>gear</b> icon at the top-right of the app).`,
      "Enter your <b>admin password</b> and tap <b>Sign in</b>.",
      "Keep this password private — it's only for you.",
    ],
  },
  {
    shot: "admin-dash",
    device: "screen",
    title: "Your dashboard",
    steps: [
      "The top row shows quick counts (upcoming teachings, prayer requests, etc.).",
      "The tabs — <b>Word, Teachings, Prayer, Worship, Settings</b> — are how you manage everything.",
      "Tap <b>View app</b> anytime to see it as members do, or <b>Sign out</b> when finished.",
    ],
  },
  {
    shot: "admin-word",
    device: "screen",
    title: "Post the Word for Today",
    steps: [
      "Open the <b>Word</b> tab. Add an optional title and write your teaching.",
      "Tap <b>Post teaching</b> — it instantly appears on every member's <b>Home</b> screen.",
      "Post a new one each day; the latest one always shows. Old ones are listed below and can be deleted.",
    ],
  },
  {
    shot: "admin-teachings",
    device: "screen",
    title: "Schedule teachings & add recordings",
    steps: [
      "Open <b>Teachings</b>. Choose <b>Live session</b> (set date & time — a private video room is created for you) or <b>Recording</b> (paste a YouTube or Google Drive link).",
      "Tap <b>Add teaching</b>.",
      "After a live session, paste its recording link on that teaching so members can re-watch it in the Library.",
    ],
  },
  {
    shot: "admin-prayer",
    device: "screen",
    title: "Answer prayer requests",
    steps: [
      "Open <b>Prayer</b> to see every request from the group.",
      "Tap <b>Praying</b> or <b>Answered</b> to update its status (members see the badge).",
      "Use the trash icon to remove anything inappropriate.",
    ],
  },
  {
    shot: "admin-worship",
    device: "screen",
    title: "Manage praise & worship",
    steps: [
      "Open <b>Worship</b>. Add a title, pick the type (song / album / playlist) and paste the <b>YouTube link</b>.",
      "Tap <b>Add</b> — it appears in the members' Worship section.",
      "The app automatically rotates a different “Today's pick” each day.",
    ],
  },
  {
    shot: "admin-settings",
    device: "screen",
    title: "Settings",
    steps: [
      "Set the <b>ministry name</b> and your <b>WhatsApp</b> links (message-the-pastor and the group invite).",
      "Optionally set a <b>daily verse override</b> to choose a specific verse.",
      "Tap <b>Save settings</b>.",
    ],
  },
];

async function sectionHtml(list) {
  const parts = [];
  for (const s of list) {
    const src = await img(s.shot);
    const steps = s.steps.map((t) => `<li>${t}</li>`).join("");
    parts.push(`
      <section class="screen">
        <div class="shot ${s.device}">${src ? `<img src="${src}"/>` : `<div class="missing">screen</div>`}</div>
        <div class="steps"><h3>${s.title}</h3><ol>${steps}</ol></div>
      </section>`);
  }
  return parts.join("");
}

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, sans-serif; color: #1b1a17; margin: 0; font-size: 12px; line-height: 1.5; }
  h1,h2,h3 { font-family: Georgia, "Times New Roman", serif; }
  .cover { background:#1b1a17; color:#f6f4ee; height: 1040px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; page-break-after: always; }
  .mono { width:96px; height:96px; border:3px solid #9a7b3f; border-radius:22px; display:flex; align-items:center; justify-content:center; color:#9a7b3f; font-family:Georgia,serif; font-size:44px; font-weight:bold; }
  .cover h1 { font-size:60px; margin:28px 0 6px; }
  .cover .sub { font-size:22px; color:rgba(246,244,238,.72); }
  .cover .rule { width:120px; height:5px; background:#9a7b3f; border-radius:3px; margin:34px 0; }
  .cover .addr { font-size:18px; color:#9a7b3f; letter-spacing:1px; }
  .cover .who { margin-top:10px; font-size:14px; color:rgba(246,244,238,.6); }
  .band { background:#f1ead9; border-left:6px solid #9a7b3f; padding:14px 18px; margin:30px 0 22px; page-break-after: avoid; }
  .band .eyebrow { color:#9a7b3f; font-size:11px; letter-spacing:3px; text-transform:uppercase; font-weight:bold; }
  .band h2 { margin:2px 0 0; font-size:26px; }
  .intro { padding: 26px 4px 0; }
  .intro h2 { font-size:22px; margin:0 0 8px; }
  .intro p { color:#4a463c; max-width: 640px; }
  .screen { display:flex; gap:22px; align-items:flex-start; padding:14px 4px; border-bottom:1px solid #eee; page-break-inside: avoid; }
  .shot img { display:block; border:1px solid #e2ddd0; border-radius:14px; box-shadow:0 2px 8px rgba(20,18,15,.08); }
  .shot.phone img { width:190px; }
  .shot.screen img { width:320px; }
  .missing { width:190px; height:300px; background:#eee; display:flex; align-items:center; justify-content:center; color:#999; border-radius:14px; }
  .steps { flex:1; }
  .steps h3 { font-size:17px; margin:2px 0 8px; color:#1b1a17; }
  .steps ol { margin:0; padding-left:18px; }
  .steps li { margin-bottom:7px; color:#33302a; }
  .steps b { color:#1b1a17; }
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
    <h2>Welcome</h2>
    <p>Glory Domain is our online home for Bible teachings, prayer and worship. This short guide shows you how to use every part of it. <b>Part 1</b> is for everyone in the group; <b>Part 2</b> is for the pastor. Just open <b>${SITE}</b> on your phone to begin.</p>
  </div>

  <div class="band"><div class="eyebrow">Part 1</div><h2>For Members</h2></div>
  ${await sectionHtml(MEMBER)}

  <div class="band" style="page-break-before: always;"><div class="eyebrow">Part 2</div><h2>For the Pastor</h2></div>
  ${await sectionHtml(PASTOR)}
</body></html>`;

const pdfPage = await browser.newPage();
await pdfPage.setContent(html, { waitUntil: "load" });
await pdfPage.pdf({
  path: outPdf,
  format: "A4",
  printBackground: true,
  margin: { top: "14mm", bottom: "16mm", left: "14mm", right: "14mm" },
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate:
    '<div style="width:100%;font-size:9px;color:#9a9384;font-family:Arial;padding:0 14mm;display:flex;justify-content:space-between;"><span>Glory Domain — App Guide</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
});
await browser.close();

const { size } = await import("node:fs").then((fs) => fs.promises.stat(outPdf));
console.log(`\nDONE → ${outPdf} (${(size / 1024).toFixed(0)} KB)`);
