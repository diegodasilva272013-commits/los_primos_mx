import { chromium } from "playwright";
let browser;
try { browser = await chromium.launch({ channel: "chrome" }); } catch { browser = await chromium.launch(); }
const BASE = process.env.BASE || "http://127.0.0.1:5173";
for (const vp of [{ n: "escritorio", w: 1440, h: 900, m: false }, { n: "celular", w: 390, h: 844, m: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, hasTouch: vp.m, isMobile: vp.m });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  const active = () => page.evaluate(() => { const t = document.querySelector('#sabores [role=tab][aria-selected=true]'); return t ? t.textContent : "?"; });
  const filmPlaying = () => page.evaluate(() => [...document.querySelectorAll("#sabores .sb-vid")].filter((v) => !v.paused).map((v) => v.dataset.i + ":" + v.currentTime.toFixed(1)));
  const y = await page.evaluate(() => document.querySelector("#sabores").getBoundingClientRect().top + scrollY);
  let cur = await page.evaluate(() => scrollY);
  while (Math.abs(y - cur) > 40) { await page.mouse.wheel(0, Math.sign(y - cur) * Math.min(500, Math.abs(y - cur))); await page.waitForTimeout(260); cur = await page.evaluate(() => scrollY); }
  await page.waitForTimeout(1500);
  console.log(vp.n, "llego:", await active(), "| video:", JSON.stringify(await filmPlaying()));
  // 1) quieto 20s: NO debe cambiar de plato solo
  await page.waitForTimeout(20000);
  console.log(vp.n, "tras 20s quieto:", await active(), "| video:", JSON.stringify(await filmPlaying()));
  // 2) scroll a mano: debe avanzar un plato por paso
  const seq = [];
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, vp.m ? 600 : 650); await page.waitForTimeout(1800); seq.push(await active()); }
  console.log(vp.n, "con scroll:", JSON.stringify(seq));
  await page.screenshot({ path: `audit/scroll-${vp.n}.jpg`, type: "jpeg", quality: 70 });
  console.log(vp.n, "scrollW", await page.evaluate(() => document.documentElement.scrollWidth), "errors", JSON.stringify(errs));
  await ctx.close();
}
await browser.close();
