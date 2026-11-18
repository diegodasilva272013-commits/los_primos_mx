import { chromium } from "playwright";
import fs from "node:fs";
const out = "audit/vit";
fs.mkdirSync(out, { recursive: true });
let browser;
try {
  browser = await chromium.launch({ channel: "chrome", args: ["--autoplay-policy=no-user-gesture-required"] });
} catch {
  browser = await chromium.launch();
}
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(String(e)));
page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await page.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4500);
const y = await page.evaluate(() => document.querySelector("#platillos").getBoundingClientRect().top + scrollY);
await page.evaluate((y) => window.scrollTo(0, y + 380), y);
await page.waitForTimeout(2500);
for (const name of ["Sopa de Mariscos", "Molcajete Mixto", "Camarones Envueltos BBQ"]) {
  const card = page.locator(`#platillos button[aria-label="${name}"]`).first();
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await card.hover();
  await page.waitForTimeout(1600);
  const st = await card.evaluate((el) => {
    const v = el.querySelector("video");
    return v ? { has: true, paused: v.paused, o: getComputedStyle(v).opacity, t: +v.currentTime.toFixed(1) } : { has: false };
  });
  console.log("card", name, JSON.stringify(st));
  await page.screenshot({ path: `${out}/card-${name.split(" ")[0]}.jpg`, type: "jpeg", quality: 72 });
}
const card = page.locator('#platillos button[aria-label="Sopa de Mariscos"]').first();
await card.scrollIntoViewIfNeeded();
await card.click();
await page.waitForTimeout(3500);
const m = await page.evaluate(() => {
  const v = document.querySelector('[role="dialog"] video');
  return v ? { paused: v.paused, muted: v.muted, t: +v.currentTime.toFixed(1), ctrl: v.controls } : null;
});
console.log("modal", JSON.stringify(m));
await page.screenshot({ path: `${out}/modal.jpg`, type: "jpeg", quality: 72 });
console.log("errors", errs);
await browser.close();
