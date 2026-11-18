import { chromium } from "playwright";
let browser;
try {
  browser = await chromium.launch({ channel: "chrome" });
} catch {
  browser = await chromium.launch();
}
for (const vp of [{ n: "mobile", w: 390, h: 844, m: true }, { n: "desktop", w: 1440, h: 900, m: false }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, hasTouch: vp.m, isMobile: vp.m });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(8000);
  const has = () => page.evaluate(() => !!document.querySelector('[data-assistant] button[aria-label*="asistente"]'));
  console.log(vp.n, "launcher at top:", await has());
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, 420);
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(1800);
  console.log(vp.n, "launcher after hero:", await has(), "errors", JSON.stringify(errs));
  await page.screenshot({ path: `audit/asis/${vp.n}-after.jpg`, type: "jpeg", quality: 70 });
  await ctx.close();
}
await browser.close();
