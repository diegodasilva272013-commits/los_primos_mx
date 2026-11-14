import { chromium } from "playwright";
let browser;
try { browser = await chromium.launch({ channel: "chrome" }); } catch { browser = await chromium.launch(); }
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);
const total = await page.evaluate(() => document.documentElement.scrollHeight);
const seen = new Set();
for (let y = 0; y < total; y += 600) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(350);
  const r = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth, sw = document.documentElement.scrollWidth, out = [];
    if (sw > vw) document.querySelectorAll("body *").forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.width && b.right > vw + 2) {
        let p = el.parentElement, clipped = false;
        while (p && p !== document.body) { const o = getComputedStyle(p); if (/(hidden|clip)/.test(o.overflowX)) { clipped = true; break; } p = p.parentElement; }
        if (!clipped) out.push(el.tagName + "." + String(el.className).slice(0, 70) + " r=" + Math.round(b.right));
      }
    });
    return { sw, out: out.slice(0, 5) };
  });
  if (r.sw > 1440) { const k = r.out.join("|"); if (!seen.has(k)) { seen.add(k); console.log("y", y, JSON.stringify(r)); } }
}
console.log("done total", total);
await browser.close();
