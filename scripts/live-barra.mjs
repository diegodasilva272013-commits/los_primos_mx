import { chromium } from "playwright";
let browser;
try {
  browser = await chromium.launch({ channel: "chrome" });
} catch {
  browser = await chromium.launch();
}
const BASE = process.env.BASE || "https://losprimosmx.vercel.app";
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const failed = [];
page.on("requestfailed", (r) => failed.push(r.url().split("/").pop() + " " + (r.failure() || {}).errorText));
page.on("response", (r) => r.url().includes("/video/") && console.log("net", r.status(), r.url().split("/").pop()));
page.on("pageerror", (e) => console.log("pageerror", String(e).slice(0, 200)));
await page.goto(BASE, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(6000);
const y = await page.evaluate(() => document.querySelector("#sabores").getBoundingClientRect().top + scrollY);
let cur = await page.evaluate(() => scrollY);
while (Math.abs(y - cur) > 40) {
  await page.mouse.wheel(0, Math.sign(y - cur) * Math.min(500, Math.abs(y - cur)));
  await page.waitForTimeout(260);
  cur = await page.evaluate(() => scrollY);
}
for (const t of [1000, 3000, 6000, 10000]) {
  await page.waitForTimeout(t === 1000 ? 1000 : t === 3000 ? 2000 : t === 6000 ? 3000 : 4000);
  const info = await page.evaluate(() => {
    const sec = document.querySelector("#sabores");
    const r = sec.getBoundingClientRect();
    return {
      secTop: Math.round(r.top),
      scrollY: Math.round(scrollY),
      vids: [...sec.querySelectorAll(".sb-vid")].map((v) => ({ i: v.dataset.i, paused: v.paused, rs: v.readyState, t: +v.currentTime.toFixed(1), o: (+getComputedStyle(v).opacity).toFixed(2), err: v.error && v.error.code })),
      img0: (+getComputedStyle(sec.querySelector('.sb-img[data-i="0"]')).opacity).toFixed(2),
    };
  });
  console.log("t+" + t, JSON.stringify(info));
}
await page.screenshot({ path: "audit/live-barra.jpg", type: "jpeg", quality: 70 });
console.log("failed", JSON.stringify(failed));
await browser.close();
