import { chromium } from "playwright";
import fs from "node:fs";
const out = "capturas-sitio-publicado";
fs.mkdirSync(out, { recursive: true });
const BASE = "https://losprimosmx.vercel.app";
let browser;
try {
  browser = await chromium.launch({ channel: "chrome" });
} catch {
  browser = await chromium.launch();
}
async function goTo(page, id, extra = 0) {
  const y = await page.evaluate((id) => document.querySelector("#" + id).getBoundingClientRect().top + scrollY, id);
  let cur = await page.evaluate(() => scrollY);
  while (Math.abs(y - cur) > 40) {
    await page.mouse.wheel(0, Math.sign(y - cur) * Math.min(500, Math.abs(y - cur)));
    await page.waitForTimeout(260);
    cur = await page.evaluate(() => scrollY);
  }
  if (extra) {
    await page.mouse.wheel(0, extra);
    await page.waitForTimeout(500);
  }
}
for (const vp of [{ n: "escritorio", w: 1440, h: 900, m: false }, { n: "celular", w: 390, h: 844, m: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, hasTouch: vp.m, isMobile: vp.m });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(6000);
  await goTo(page, "sabores");
  await page.waitForTimeout(5500);
  await page.screenshot({ path: `${out}/${vp.n}-1-la-barra-sopa.jpg`, type: "jpeg", quality: 85 });
  await goTo(page, "platillos", 380);
  await page.waitForTimeout(4500);
  await page.screenshot({ path: `${out}/${vp.n}-2-vitrina-platillos.jpg`, type: "jpeg", quality: 85 });
  await ctx.close();
}
await browser.close();
console.log("listo");
