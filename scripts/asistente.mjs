import { chromium } from "playwright";
import fs from "node:fs";
const out = "audit/asis";
fs.mkdirSync(out, { recursive: true });
const args = ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"];
let browser;
try {
  browser = await chromium.launch({ channel: "chrome", args });
} catch {
  browser = await chromium.launch({ args });
}
for (const vp of [{ n: "d", w: 1440, h: 900, m: false }, { n: "m", w: 390, h: 844, m: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, hasTouch: vp.m, isMobile: vp.m, permissions: ["microphone"] });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push("PAGE " + String(e)));
  page.on("console", (m) => m.type() === "error" && errs.push("CONSOLE " + m.text().slice(0, 160)));
  await page.goto("http://127.0.0.1:5173", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(9500);
  await page.screenshot({ path: `${out}/${vp.n}-1-launcher.jpg`, type: "jpeg", quality: 72 });
  await page.click('[data-assistant] button[aria-label*="asistente"]');
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${out}/${vp.n}-2-panel.jpg`, type: "jpeg", quality: 72 });
  if (vp.n === "d") {
    await page.click("text=Iniciar llamada");
    for (const t of [2500, 6500]) {
      await page.waitForTimeout(t === 2500 ? 2500 : 4000);
      const info = await page.evaluate(() => ({
        status: document.querySelector('[role="dialog"] header p:last-child')?.textContent,
        msgs: [...document.querySelectorAll('[role="log"] p')].map((p) => p.textContent.slice(0, 90)),
        voiceFlag: window.__lpVoice,
      }));
      console.log("t", t, JSON.stringify(info));
      await page.screenshot({ path: `${out}/${vp.n}-3-call-${t}.jpg`, type: "jpeg", quality: 72 });
    }
    await page.fill("#as-draft", "Hola, cuanto cuesta el pulpo zarandeado?");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(7000);
    const info2 = await page.evaluate(() => [...document.querySelectorAll('[role="log"] p')].map((p) => p.textContent.slice(0, 160)));
    console.log("after text", JSON.stringify(info2));
    await page.screenshot({ path: `${out}/${vp.n}-4-chat.jpg`, type: "jpeg", quality: 72 });
    await page.click("text=Colgar");
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${out}/${vp.n}-5-ended.jpg`, type: "jpeg", quality: 72 });
    console.log("voiceFlag after hangup", await page.evaluate(() => window.__lpVoice));
  }
  console.log(vp.n, "scrollW", await page.evaluate(() => document.documentElement.scrollWidth), "errors", JSON.stringify(errs));
  await ctx.close();
}
await browser.close();
