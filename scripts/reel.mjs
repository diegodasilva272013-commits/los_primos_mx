import { chromium } from "playwright";
import fs from "node:fs";
let browser;
try { browser = await chromium.launch({ channel: "chrome" }); } catch { browser = await chromium.launch(); }
const ctx = await browser.newContext({ viewport: { width: 500, height: 900 }, userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36" });
const page = await ctx.newPage();
const urls = new Set();
page.on("response", (r) => { const u = r.url(); const ct = r.headers()["content-type"] || ""; if (ct.startsWith("video/") || /\.mp4/.test(u)) urls.add(u); });
for (const u of ["https://www.instagram.com/reel/DdWhNtsSjdc/embed/", "https://www.instagram.com/reel/DdWhNtsSjdc/"]) {
  try {
    await page.goto(u, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(5000);
    for (const sel of ["video", "[aria-label*='Play']", "[role=button]"]) { try { await page.click(sel, { timeout: 2000 }); } catch {} }
    await page.waitForTimeout(6000);
    const src = await page.evaluate(() => [...document.querySelectorAll("video")].map((v) => v.currentSrc || v.src));
    src.filter(Boolean).forEach((s) => urls.add(s));
    const txt = await page.evaluate(() => document.body.innerText.slice(0, 600));
    fs.writeFileSync(`_reel/page-${urls.size}.txt`, txt);
    await page.screenshot({ path: `_reel/page.jpg`, type: "jpeg", quality: 60 });
    if ([...urls].some((x) => !x.startsWith("blob:"))) break;
  } catch (e) { console.log("err", String(e).slice(0, 120)); }
}
const list = [...urls].filter((x) => !x.startsWith("blob:"));
fs.writeFileSync("_reel/urls.json", JSON.stringify(list, null, 1));
console.log("found", list.length, [...urls].length);
await browser.close();
