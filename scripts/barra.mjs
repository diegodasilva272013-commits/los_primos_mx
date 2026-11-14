import { chromium } from "playwright";
import fs from "node:fs";
const out = "audit/barra"; fs.mkdirSync(out, { recursive: true });
let browser;
try { browser = await chromium.launch({ channel: "chrome" }); } catch { browser = await chromium.launch(); }
for (const vp of [{ n: "d", w: 1440, h: 900 }, { n: "m", w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(String(e))); page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await page.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4500);
  const y = await page.evaluate(() => document.querySelector("#sabores").getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(2500);
  const steps = vp.n === "d" ? 6 : 6;
  for (let i = 0; i < steps; i++) {
    await page.screenshot({ path: `${out}/${vp.n}-${i}.jpg`, type: "jpeg", quality: 72 });
    if (vp.n === "d") { await page.mouse.wheel(0, 720); await page.waitForTimeout(2200); }
    else await page.waitForTimeout(4400);
  }
  const ov = await page.evaluate(() => document.documentElement.scrollWidth);
  console.log(vp.n, "scrollW", ov, "errors", errs);
  await ctx.close();
}
await browser.close();
