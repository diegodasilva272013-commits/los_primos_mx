import { chromium } from "playwright";
import fs from "node:fs";
const out = "audit/nat";
fs.mkdirSync(out, { recursive: true });
let browser;
try {
  browser = await chromium.launch({ channel: "chrome" });
} catch {
  browser = await chromium.launch();
}
const vids = () =>
  [...document.querySelectorAll("video")]
    .filter((v) => !v.className.includes("hp-vid"))
    .map((v) => ({ src: v.src.split("/").pop(), paused: v.paused, t: +v.currentTime.toFixed(1), o: (+getComputedStyle(v).opacity).toFixed(2) }))
    .filter((x) => !x.paused && +x.o > 0);
for (const vp of [{ n: "d", w: 1440, h: 900, touch: false }, { n: "m", w: 390, h: 844, touch: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, hasTouch: vp.touch, isMobile: vp.touch });
  const page = await ctx.newPage();
  await page.goto(process.env.BASE || "http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  // plain wheel scrolling, like a person
  for (const id of ["sabores", "platillos"]) {
    const y = await page.evaluate((id) => document.querySelector("#" + id).getBoundingClientRect().top + scrollY, id);
    let cur = await page.evaluate(() => scrollY);
    while (Math.abs(y - cur) > 40) {
      const step = Math.sign(y - cur) * Math.min(500, Math.abs(y - cur));
      await page.mouse.wheel(0, step);
      await page.waitForTimeout(260);
      cur = await page.evaluate(() => scrollY);
      if (Math.abs(step) < 5) break;
    }
    await page.waitForTimeout(vp.n === "d" && id === "platillos" ? 600 : 3500);
    if (id === "platillos") {
      await page.mouse.wheel(0, 380);
      await page.waitForTimeout(2500);
    }
    console.log(vp.n, id, JSON.stringify(await page.evaluate(vids)));
    await page.screenshot({ path: `${out}/${vp.n}-${id}.jpg`, type: "jpeg", quality: 72 });
  }
  await ctx.close();
}
await browser.close();
