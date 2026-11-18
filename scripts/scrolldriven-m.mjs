import { chromium } from "playwright";
let browser;
try { browser = await chromium.launch({ channel: "chrome" }); } catch { browser = await chromium.launch(); }
const BASE = process.env.BASE || "http://127.0.0.1:5173";
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
await page.goto(BASE, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);
const active = () => page.evaluate(() => document.querySelector('#sabores [role=tab][aria-selected=true]')?.textContent);
const films = () => page.evaluate(() => [...document.querySelectorAll("#sabores .sb-vid")].filter((v) => !v.paused).map((v) => v.dataset.i + ":" + v.currentTime.toFixed(1)));
const top = await page.evaluate(() => document.querySelector("#sabores").getBoundingClientRect().top + scrollY);
await page.evaluate((t) => window.scrollTo(0, t), top);
await page.waitForTimeout(2500);
console.log("celular llego:", await active(), JSON.stringify(await films()));
const seq = [];
for (let k = 1; k <= 6; k++) {
  await page.evaluate((y) => window.scrollTo(0, y), top + k * 800);
  await page.waitForTimeout(2600);
  seq.push((await active()) + (JSON.stringify(await films()) !== "[]" ? " (video)" : ""));
}
console.log("celular con scroll de 800px por paso:", JSON.stringify(seq));
await page.screenshot({ path: "audit/scroll-celular.jpg", type: "jpeg", quality: 70 });
console.log("errors", JSON.stringify(errs));
await browser.close();
