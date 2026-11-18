import { chromium } from "playwright";
let browser;
try {
  browser = await chromium.launch({ channel: "chrome" });
} catch {
  browser = await chromium.launch();
}
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(String(e)));
await page.goto(process.env.BASE || "http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);
const y = await page.evaluate(() => document.querySelector("#sabores").getBoundingClientRect().top + scrollY);
await page.evaluate((y) => window.scrollTo(0, y), y);
await page.waitForTimeout(2500);
const btn = page.locator("#sabores button:has-text('Ver video')").first();
console.log("boton visible:", await btn.isVisible().catch(() => false));
await page.screenshot({ path: "audit/reduced-1.jpg", type: "jpeg", quality: 70 });
await btn.click({ timeout: 4000 }).catch((e) => console.log("click fail", String(e).slice(0, 100)));
await page.waitForTimeout(3500);
console.log(
  "video:",
  JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("#sabores .sb-vid")].filter((v) => !v.paused).map((v) => ({ i: v.dataset.i, t: +v.currentTime.toFixed(1), o: getComputedStyle(v).opacity }))))
);
await page.screenshot({ path: "audit/reduced-2.jpg", type: "jpeg", quality: 70 });
console.log("errors", JSON.stringify(errs));
await browser.close();
