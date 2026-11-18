import { chromium } from "playwright";
let browser;
try {
  browser = await chromium.launch({ channel: "chrome" });
} catch {
  browser = await chromium.launch();
}
const BASE = process.env.BASE || "http://127.0.0.1:5173";
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: "domcontentloaded" });

// ---- HERO: while the film plays, the HD photo must be hidden
const hero = [];
for (let i = 0; i < 14; i++) {
  await page.waitForTimeout(700);
  hero.push(
    await page.evaluate(() => {
      const v = document.querySelector(".hp-vid");
      const img = document.querySelector(".hp-img");
      return { playing: !v.paused && v.currentTime > 0.05, vo: +getComputedStyle(v).opacity, io: +getComputedStyle(img).opacity };
    })
  );
}
const heroGhost = hero.filter((h) => h.playing && h.vo > 0.3 && h.io > 0.3).length;
console.log("hero: muestras con video visible y foto visible a la vez =", heroGhost, "de", hero.filter((h) => h.playing).length, "reproduciendo");

async function goTo(id, extra = 0) {
  const y = await page.evaluate((id) => document.querySelector("#" + id).getBoundingClientRect().top + scrollY, id);
  let cur = await page.evaluate(() => scrollY);
  while (Math.abs(y - cur) > 40) {
    await page.mouse.wheel(0, Math.sign(y - cur) * Math.min(500, Math.abs(y - cur)));
    await page.waitForTimeout(260);
    cur = await page.evaluate(() => scrollY);
  }
  if (extra) {
    await page.mouse.wheel(0, extra);
    await page.waitForTimeout(400);
  }
}

// ---- BARRA: film dish: photo (sb-img) must stay hidden while the film shows
await goTo("sabores");
const bar = [];
for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(500);
  bar.push(
    await page.evaluate(() => {
      const v = document.querySelector('#sabores .sb-vid[data-i="0"]');
      const img = document.querySelector('#sabores .sb-img[data-i="0"]');
      return { playing: !v.paused && v.currentTime > 0.05, vo: +getComputedStyle(v).opacity, io: +getComputedStyle(img).opacity };
    })
  );
}
console.log("barra: muestras con video y foto a la vez =", bar.filter((h) => h.playing && h.vo > 0.3 && h.io > 0.3).length, "de", bar.filter((h) => h.playing).length, "reproduciendo");

// ---- VITRINA: cards crossfade, never both for long
await goTo("platillos", 380);
const vit = [];
for (let i = 0; i < 16; i++) {
  await page.waitForTimeout(250);
  vit.push(
    await page.evaluate(() => {
      const card = document.querySelector('#platillos button[aria-label="Sopa de Mariscos"]');
      const v = card.querySelector("video");
      const plate = card.querySelector("img").parentElement;
      return { playing: !v.paused && v.currentTime > 0.05, vo: +getComputedStyle(v).opacity, po: +getComputedStyle(plate).opacity };
    })
  );
}
const both = vit.filter((h) => h.vo > 0.3 && h.po > 0.3);
console.log("vitrina: muestras con video y foto a la vez =", both.length, "de", vit.length, "(el crossfade dura 0.5s = hasta 2 muestras es normal)");
console.log("vitrina trazas:", JSON.stringify(vit.slice(0, 8).map((x) => [x.playing ? 1 : 0, +x.vo.toFixed(2), +x.po.toFixed(2)])));
await browser.close();
