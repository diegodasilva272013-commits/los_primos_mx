import { chromium } from "playwright";
import fs from "node:fs";
const out = "audit/barra2";
fs.mkdirSync(out, { recursive: true });
let browser;
try {
  browser = await chromium.launch({ channel: "chrome" });
} catch {
  browser = await chromium.launch();
}
for (const vp of [{ n: "d", w: 1440, h: 900 }, { n: "m", w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await page.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4500);
  const y = await page.evaluate(() => document.querySelector("#sabores").getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(1500);
  for (const [name, key] of [["Molcajete Mixto", "mol"], ["Sopa de Mariscos", "sopa"], ["Camarones BBQ", "bbq"]]) {
    await page.click(`#sabores [role=tab]:has-text("${name}")`, { force: true });
    const t0 = Date.now();
    for (const t of [2600, 4500, 7500, 11500]) {
      const w = t - (Date.now() - t0);
      if (w > 0) await page.waitForTimeout(w);
      const info = await page.evaluate(() =>
        [...document.querySelectorAll("#sabores .sb-vid")]
          .map((v) => ({ i: v.dataset.i, t: +v.currentTime.toFixed(1), p: v.paused, o: (+getComputedStyle(v).opacity).toFixed(2) }))
          .filter((x) => !x.p || +x.o > 0)
      );
      const bg = await page.evaluate(() => getComputedStyle(document.querySelector("#sabores")).backgroundColor);
      console.log(vp.n, key, t, JSON.stringify(info), bg);
      await page.screenshot({ path: `${out}/${vp.n}-${key}-${t}.jpg`, type: "jpeg", quality: 72 });
    }
  }
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  console.log(vp.n, "scrollW", sw, "errors", errs);
  await ctx.close();
}
await browser.close();
