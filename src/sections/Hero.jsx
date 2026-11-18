import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowDownRight, WhatsappLogo, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { HERO_PLATOS, WHATSAPP, ILU } from "../data.js";
import { gsap, ScrollTrigger, scrollToTarget, magnetic, reduceMotion } from "../lib/motion.js";

gsap.registerPlugin(useGSAP);

/*
  v3 hero: the FOOD is the star. One HD cut-out plate per flavor, floating on a full-bleed brand color.
  Grid (lg): heading block (cols 1-5, row 1) + actions block (cols 1-5, row 2) | product stage (cols 6-12, both rows).
  Mobile: heading, product, badge, CTAs, switcher. Giant MARISCOS word lives in its own band below (in flow).
  Product box has a fixed aspect (BOX); every plate is fitted inside it from its real w/h (object-contain math),
  never wider than its natural width. Neutral studio shadow on the plate + a contact shadow under its real bottom edge.
  Brand line illustrations drift behind, never over text (crab inside the stage, boat + clam on lg only).
*/
const MASK = { clipPath: "inset(-0.3em -0.1em -0.1em -0.1em)" };
const AUTO_SECONDS = 5.5;
const N = HERO_PLATOS.length;
const BOX = 1.45; // stage aspect (w / h)
const HIDDEN = { visibility: "hidden", opacity: 0 };
const STUDIO = "drop-shadow(0 34px 34px rgba(0,0,0,0.26)) drop-shadow(0 10px 12px rgba(0,0,0,0.16))";
// Video plates: edges feathered into the hero color (no boxes). After the clip ends, hold the HD plate this long.
const VIDEO_HOLD = 4;
const FEATHER = "radial-gradient(ellipse closest-side at 50% 50%, #000 66%, rgba(0,0,0,0.55) 84%, transparent 100%)";
// Dark films have bright moments (fire, vortex): a longer, softer falloff so no oval edge ever reads.
const FEATHER_SOFT = "radial-gradient(ellipse closest-side at 50% 50%, #000 42%, rgba(0,0,0,0.75) 58%, rgba(0,0,0,0.35) 76%, transparent 96%)";
// Per film: width relative to the stage and vertical anchor, measured so the plate in the LAST frame matches the
// size/position of the HD cut-out it dissolves into (seamless hand-off).
const VFIT = { pulpo: { w: 138, y: -56 }, aguachile: { w: 116, y: -50 }, tio: { w: 121, y: -50 } };

const ALT = {
  pulpo: "Pulpo zarandeado a las brasas con arroz amarillo y verdura fresca en plato blanco",
  aguachile: "Aguachile House: camarón curtido en salsa verde con pepino, zanahoria y cebolla morada",
  tio: "Preferida del Tío: camarones envueltos y empanizados, filete, aros de cebolla, arroz y papas",
};
const SHORT = { pulpo: "Pulpo", aguachile: "Aguachile", tio: "Del Tío" };

/** Size of a w x h image fitted (contain) in a box of aspect `box`, as % of the box. */
function fit(w, h, box) {
  const r = w / h;
  return r >= box ? { wp: 100, hp: (box / r) * 100 } : { wp: (r / box) * 100, hp: 100 };
}

function Chars({ text, className }) {
  return [...text].map((c, i) => (
    <span key={i} className={`inline-block ${className}`}>
      {c === " " ? " " : c}
    </span>
  ));
}

export default function Hero() {
  const root = useRef(null);
  const cta = useRef(null);
  const tabs = useRef([]);
  const api = useRef({ go: () => {}, setHover: () => {}, setFocus: () => {} });
  const firstBadge = useRef(true);
  const [active, setActive] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const audio = useRef({ on: false, toggle: () => {} });

  useEffect(() => magnetic(cta.current), []);

  const { contextSafe } = useGSAP(
    (_ctx, contextSafe) => {
      const q = gsap.utils.selector(root);
      const section = root.current;
      const items = q(".hp-item");
      const shadows = q(".hp-cshadow");
      const punch = q(".hp-punch");
      const st = { cur: 0, tl: null, auto: null, stopped: false, hover: false, focus: false, inView: true, dark: false, playing: -1 };
      const vids = q(".hp-vid");
      const imgs = q(".hp-img");
      const iOS = /iP(hone|ad|od)/.test(navigator.userAgent);

      gsap.set(punch, { transformOrigin: "50% 85%" });

      /* ---------- Cinematic video plates ---------- */
      const ambience = (i, dark, dur = 0.8) => {
        const p = HERO_PLATOS[i];
        gsap.to(section, {
          backgroundColor: dark ? p.darkBg : p.bg,
          color: dark ? "#fbfdff" : p.ink,
          duration: dur,
          ease: dark || dur < 0.3 ? "none" : "power2.inOut",
          overwrite: "auto",
        });
      };

      // Keep the hero dimmed exactly while the clip is in its black (fire) segment.
      const watch = (i) => {
        const v = vids[i];
        const p = HERO_PLATOS[i];
        if (!v || !p.dark) return;
        const check = (t) => {
          const dark = t >= p.dark[0] && t < p.dark[1];
          if (dark !== st.dark) {
            st.dark = dark;
            ambience(i, dark, 0.12);
          }
        };
        if ("requestVideoFrameCallback" in v) {
          const loop = (_now, meta) => {
            check(meta.mediaTime);
            if (st.playing === i) v.requestVideoFrameCallback(loop);
          };
          v.requestVideoFrameCallback(loop);
        } else {
          v.ontimeupdate = () => st.playing === i && check(v.currentTime);
        }
      };

      const fadeVolume = (v, to, dur = 0.6) => {
        if (!v) return;
        if (iOS) {
          v.muted = to === 0;
          return;
        }
        if (to > 0) v.muted = false;
        gsap.to(v, { volume: to, duration: dur, ease: "power1.out", overwrite: true, onComplete: () => to === 0 && (v.muted = true) });
      };

      const stopVideo = (i) => {
        const v = vids[i];
        if (!v) return;
        if (st.playing === i) st.playing = -1;
        v.pause();
        gsap.killTweensOf(v);
        gsap.set(v, { opacity: 0 });
        v.muted = true;
      };

      // Clip finished (or could not play): dissolve into the HD cut-out, which keeps floating.
      const finishVideo = (i) => {
        const v = vids[i];
        if (st.playing === i) st.playing = -1;
        if (st.dark) {
          st.dark = false;
          ambience(i, false, 0.4);
        }
        gsap.to(imgs[i], { opacity: 1, duration: 0.9, ease: "power2.out" });
        gsap.fromTo(imgs[i], { scale: 0.96 }, { scale: 1, duration: 1.1, ease: "power3.out" });
        gsap.to(shadows[i], { autoAlpha: 1, duration: 0.8 });
        if (v) gsap.to(v, { opacity: 0, duration: 0.9, ease: "power2.inOut", onComplete: () => v.pause() });
      };

      const playVideo = (i) => {
        const v = vids[i];
        if (!v || reduceMotion()) {
          gsap.set(imgs[i], { opacity: 1 });
          return;
        }
        vids.forEach((_, k) => k !== i && stopVideo(k));
        gsap.set(imgs[i], { opacity: 0 });
        gsap.set(shadows[i], { autoAlpha: 0 });
        st.playing = i;
        st.dark = false;
        v.currentTime = 0;
        v.muted = !audio.current.on || !st.inView;
        v.volume = v.muted ? 0 : 1;
        v.onended = () => st.playing === i && finishVideo(i);
        gsap.to(v, { opacity: 1, duration: 0.35, ease: "power1.out" });
        watch(i);
        const pr = v.play();
        if (pr && pr.catch) pr.catch(() => finishVideo(i));
      };

      // Sound: browsers only allow audio after a user gesture. First tap/click anywhere turns the music on;
      // the speaker pill toggles it. Leaving the hero fades it out; coming back fades it in.
      const setAudio = (on) => {
        audio.current.on = on;
        setSoundOn(on);
        const v = vids[st.playing];
        if (!v) return;
        fadeVolume(v, on && st.inView ? 1 : 0);
      };
      audio.current.toggle = () => setAudio(!audio.current.on);
      const firstGesture = (e) => {
        if (e.target.closest?.(".hp-sound, [data-assistant]") || window.__lpVoice) return; // handled elsewhere / on a call
        document.removeEventListener("pointerdown", firstGesture);
        document.removeEventListener("keydown", firstGesture);
        if (!audio.current.on) setAudio(true);
      };
      document.addEventListener("pointerdown", firstGesture);
      document.addEventListener("keydown", firstGesture);
      // The voice assistant: while a call is live the hero music is off (no echo into the mic, no talking over it).
      const onVoice = (e) => {
        if (e.detail && e.detail.on) {
          document.removeEventListener("pointerdown", firstGesture);
          document.removeEventListener("keydown", firstGesture);
          if (audio.current.on) setAudio(false);
        }
      };
      window.addEventListener("lp:voice", onVoice);

      const syncAuto = () => {
        if (!st.auto) return;
        if (st.hover || st.focus || !st.inView) st.auto.pause();
        else st.auto.resume();
      };

      const stopAuto = () => {
        st.stopped = true;
        st.auto?.kill();
        st.auto = null;
        gsap.to(q(".hp-progress"), { scaleX: 0, duration: 0.3, overwrite: true });
      };

      // The progress bar inside the active pill IS the timer: when it fills, the next plate lands.
      const startAuto = contextSafe(() => {
        st.auto?.kill();
        st.auto = null;
        if (st.stopped || reduceMotion()) return;
        const bars = q(".hp-progress");
        gsap.set(bars, { scaleX: 0 });
        const v = vids[st.cur];
        const clip = v && HERO_PLATOS[st.cur].video ? (Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 10) : 0;
        st.auto = gsap.to(bars[st.cur], {
          scaleX: 1,
          duration: clip ? clip + VIDEO_HOLD : AUTO_SECONDS,
          ease: "none",
          onComplete: () => go((st.cur + 1) % N, false),
        });
        syncAuto();
      });

      // Landing: squash on impact, small hop, elastic settle.
      const addSettle = (tl, at) =>
        tl
          .fromTo(punch, { scaleX: 1.05, scaleY: 0.93 }, { scaleX: 1, scaleY: 1, duration: 1, ease: "elastic.out(1, 0.35)" }, at)
          .to(punch, { keyframes: [{ yPercent: -3, duration: 0.16, ease: "power2.out" }, { yPercent: 0, duration: 0.45, ease: "bounce.out" }] }, at);

      const go = contextSafe((next, user) => {
        if (user) stopAuto();
        if (next === st.cur) return;
        const prev = st.cur;
        st.cur = next;
        setActive(next);
        const p = HERO_PLATOS[next];
        st.tl?.progress(1).kill();

        if (reduceMotion()) {
          gsap.set([items[prev], shadows[prev]], { autoAlpha: 0 });
          gsap.set([items[next], shadows[next]], { autoAlpha: 1, yPercent: 0, rotation: 0, scale: 1 });
          gsap.set(imgs[next], { opacity: 1 });
          gsap.set(section, { backgroundColor: p.bg, color: p.ink });
          return;
        }

        const hasVideo = Boolean(p.video && vids[next]);
        if (vids[prev]) fadeVolume(vids[prev], 0, 0.35);

        // Old plate drops away, the field takes the new dish's ambience, the new plate (or its film) lands.
        st.tl = gsap
          .timeline()
          .to(items[prev], { yPercent: 16, rotation: 7, scale: 0.88, autoAlpha: 0, duration: 0.42, ease: "power2.in" }, 0)
          .to(shadows[prev], { autoAlpha: 0, duration: 0.3, ease: "power1.in" }, 0)
          .add(() => {
            stopVideo(prev);
            st.dark = false;
            ambience(next, false);
          }, 0.15)
          .add(() => hasVideo && playVideo(next), 0.36)
          .fromTo(items[next], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: "none" }, 0.38)
          .fromTo(items[next], { yPercent: -38 }, { yPercent: 0, duration: 0.5, ease: "power2.in" }, 0.38)
          .fromTo(items[next], { rotation: -9, scale: 0.9 }, { rotation: 0, scale: 1, duration: 0.5, ease: "power2.out" }, 0.38);
        if (!hasVideo) {
          st.tl
            .set(imgs[next], { opacity: 1 }, 0.38)
            .fromTo(shadows[next], { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: "power2.out" }, 0.62);
        }
        addSettle(st.tl, 0.88);
        if (!user) startAuto();
      });

      api.current = {
        go,
        setHover: (v) => {
          st.hover = v;
          syncAuto();
        },
        setFocus: (v) => {
          st.focus = v;
          syncAuto();
        },
      };

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        /* Appetite idle: float, slow +/-2deg turn (different period = organic), contact shadow breathes. */
        gsap.fromTo(q(".hp-float"), { y: 12 }, { y: -12, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1 });
        gsap.fromTo(
          q(".hp-breathe"),
          { scaleX: 1, opacity: 1 },
          { scaleX: 0.78, opacity: 0.55, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1 }
        );
        gsap.fromTo(q(".hp-spin"), { rotation: -2 }, { rotation: 2, duration: 7.5, ease: "sine.inOut", yoyo: true, repeat: -1 });
        q(".hp-ilu").forEach((el, i) => {
          gsap.fromTo(
            el,
            { rotation: i % 2 ? 6 : -6, x: 0, y: 0 },
            {
              rotation: i % 2 ? -6 : 6,
              x: i % 2 ? -22 : 18,
              y: i % 2 ? 16 : -20,
              duration: 11 + i * 3,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
            }
          );
        });
        gsap.set(q(".hp-mascot-wave"), { rotation: -7, transformOrigin: "50% 90%" });
        gsap.to(q(".hp-mascot-wave"), { rotation: 9, duration: 1.1, ease: "sine.inOut", yoyo: true, repeat: -1 });

        /* Intro (<= 1.9s), waits for the preloader curtain. The first plate falls in and settles. */
        const intro = gsap.timeline({ paused: true, defaults: { ease: "expo.out" }, onComplete: startAuto });
        intro
          .from(
            q(".hp-word-char"),
            { yPercent: 110, rotation: (i) => (i % 2 ? 8 : -8), duration: 1, stagger: 0.06, ease: "power4.out" },
            0.1
          )
          .from(q(".hp-line"), { yPercent: 115, duration: 0.95, stagger: 0.12, ease: "power4.out" }, 0)
          .from(q(".hp-ilu-wrap"), { autoAlpha: 0, scale: 0.85, duration: 1.4, stagger: 0.12, ease: "power2.out" }, 0.15)
          .from(q(".hp-intro"), { autoAlpha: 0, duration: 0.3, ease: "none" }, 0.3)
          .from(q(".hp-intro"), { yPercent: -45, duration: 0.6, ease: "power2.in" }, 0.3)
          .from(q(".hp-intro"), { rotation: -10, scale: 0.88, duration: 0.6, ease: "power2.out" }, 0.3)
          .from(q(".hp-shadow-in"), { scale: 0.4, autoAlpha: 0, duration: 0.55, ease: "power2.out" }, 0.6)
          .from(q(".hp-fade"), { y: 26, opacity: 0, duration: 0.7, stagger: 0.07 }, 0.3)
          .from(q(".hp-pill"), { scale: 0, opacity: 0, duration: 0.5, stagger: 0.07, ease: "back.out(2)" }, 0.75)
          .from(q(".hp-badge"), { scale: 0, rotation: -10, duration: 0.6, ease: "back.out(2)" }, 1.05)
          .from(q(".hp-mascot-pop"), { yPercent: 130, rotation: -30, duration: 0.8, ease: "back.out(1.7)" }, 0.9);
        addSettle(intro, 0.9);

        // The first dish's film starts with the intro (its first frames are an empty scene on the hero color).
        intro.add(() => playVideo(0), 0.25);

        const safety = gsap.delayedCall(4, () => play());
        function play() {
          safety.kill();
          if (intro.progress() === 0 && !intro.isActive()) intro.play();
        }
        if (window.__lpIntroDone) play();
        else window.addEventListener("lp:intro-done", play, { once: true });

        /* Scroll out (scrub): plate grows a touch and turns, copy lifts away, giant word slides. */
        const out = () => ({ trigger: section, start: "top top", end: "bottom top", scrub: true });
        gsap.to(q(".hp-scroll"), { scale: 1.08, rotation: 6, ease: "none", scrollTrigger: out() });
        gsap.to(q(".hp-copy"), { y: -110, opacity: 0, ease: "none", scrollTrigger: { ...out(), end: "70% top" } });
        gsap.to(q(".hp-word-track"), { xPercent: -12, ease: "none", scrollTrigger: out() });

        // Auto-advance only runs while the hero is on screen.
        ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => {
            st.inView = self.isActive;
            syncAuto();
            // Sound and film live only in the hero: fade out when it leaves, resume when it comes back.
            const v = vids[st.playing];
            if (!v) return;
            if (self.isActive) {
              if (v.paused && !v.ended) v.play().catch(() => {});
              if (audio.current.on) fadeVolume(v, 1, 0.8);
            } else {
              fadeVolume(v, 0, 0.8);
              gsap.delayedCall(0.85, () => !st.inView && v.pause());
            }
          },
        });
        // Fade the music as the hero scrolls away (before it fully leaves).
        ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: "bottom top",
          onUpdate: (self) => {
            const v = vids[st.playing];
            if (!v || !audio.current.on || iOS || gsap.isTweening(v)) return;
            v.volume = Math.max(0, Math.min(1, 1 - self.progress * 1.25));
          },
        });

        /* Pointer tilt +/-12deg on the plate, illustrations drift the other way (fine pointer only). */
        let offPointer = () => {};
        if (window.matchMedia("(pointer: fine)").matches) {
          const tilt = q(".hp-tilt")[0];
          const stage = q(".hp-stage")[0];
          gsap.set(tilt, { transformPerspective: 900 });
          const rx = gsap.quickTo(tilt, "rotationX", { duration: 0.7, ease: "power3.out" });
          const ry = gsap.quickTo(tilt, "rotationY", { duration: 0.7, ease: "power3.out" });
          const ilus = q(".hp-ilu-wrap").map((el) => [
            gsap.quickTo(el, "x", { duration: 1.4, ease: "power3.out" }),
            gsap.quickTo(el, "y", { duration: 1.4, ease: "power3.out" }),
          ]);
          const clamp = gsap.utils.clamp(-1, 1);
          const move = (e) => {
            const r = stage.getBoundingClientRect();
            const nx = clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2));
            const ny = clamp((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2));
            ry(nx * 12);
            rx(-ny * 12);
            ilus.forEach(([x, y]) => {
              x(-nx * 28);
              y(-ny * 28);
            });
          };
          const leave = () => {
            rx(0);
            ry(0);
            ilus.forEach(([x, y]) => {
              x(0);
              y(0);
            });
          };
          section.addEventListener("pointermove", move);
          section.addEventListener("pointerleave", leave);
          offPointer = () => {
            section.removeEventListener("pointermove", move);
            section.removeEventListener("pointerleave", leave);
          };
        }

        return () => {
          window.removeEventListener("lp:intro-done", play);
          offPointer();
          st.auto?.kill();
          st.auto = null;
        };
      });

      // Reduced motion: no films, the HD plates show directly.
      if (reduceMotion()) gsap.set(imgs, { opacity: 1 });

      return () => {
        document.removeEventListener("pointerdown", firstGesture);
        document.removeEventListener("keydown", firstGesture);
        window.removeEventListener("lp:voice", onVoice);
        vids.forEach((v) => v && v.pause());
      };
    },
    { scope: root }
  );

  // Name + price badge: new chars rise on every switch.
  useGSAP(
    () => {
      if (firstBadge.current) {
        firstBadge.current = false;
        return;
      }
      if (reduceMotion()) return;
      gsap.from(".hp-badge-char", { yPercent: 115, duration: 0.5, stagger: 0.018, ease: "power3.out", delay: 0.5 });
      gsap.from(".hp-badge-price", { yPercent: 115, duration: 0.6, ease: "back.out(2)", delay: 0.65 });
    },
    { scope: root, dependencies: [active] }
  );

  const jump = contextSafe(() => {
    if (reduceMotion() || gsap.isTweening(".hp-mascot-jump")) return;
    gsap
      .timeline()
      .to(".hp-mascot-jump", { y: -70, rotation: -12, duration: 0.3, ease: "power2.out" })
      .to(".hp-mascot-jump", { y: 0, rotation: 0, duration: 0.8, ease: "bounce.out" });
  });

  const onTabKey = (e, i) => {
    const map = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: N - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    const next = (map[e.key] + N) % N;
    api.current.go(next, true);
    tabs.current[next]?.focus();
  };

  const p = HERO_PLATOS[active];

  return (
    <section
      id="inicio"
      ref={root}
      aria-label="Inicio"
      className="relative isolate flex min-h-[100dvh] flex-col overflow-hidden pt-28"
      style={{ backgroundColor: HERO_PLATOS[0].bg, color: HERO_PLATOS[0].ink }}
    >
      {/* Brand line art (lg): boat behind the stage's lower right, clam bottom left behind the giant word */}
      <div aria-hidden="true" className="hp-ilu-wrap pointer-events-none absolute bottom-[3%] right-[1%] z-0 hidden w-[min(26vw,420px)] lg:block">
        <img src={ILU.barco} width={1000} height={838} alt="" decoding="async" className="hp-ilu w-full opacity-[0.16]" />
      </div>
      <div aria-hidden="true" className="hp-ilu-wrap pointer-events-none absolute -bottom-[5%] -left-[3vw] z-0 hidden w-[min(22vw,360px)] lg:block">
        <img src={ILU.almeja} width={1000} height={829} alt="" decoding="async" className="hp-ilu w-full opacity-[0.14]" />
      </div>

      {/* Mascot: fully visible in the bottom-left corner (xl+, where it clears the MARISCOS letters and the
          switcher). Sits 24px in from both edges with headroom above for the jump; nothing clips it. */}
      <div aria-hidden="true" className="absolute bottom-6 left-6 z-20 hidden w-[clamp(140px,9vw,165px)] xl:block">
        <div className="hp-mascot-pop">
          <div className="hp-mascot-wave">
            <div className="hp-mascot-jump" onPointerEnter={jump}>
              <img
                src="/img/mascota.png"
                width={300}
                height={300}
                alt=""
                className="w-full drop-shadow-[0_18px_24px_rgba(0,0,0,0.28)]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 content-center px-4 md:px-8 lg:grid-cols-12 lg:grid-rows-[auto_auto] lg:gap-x-6">
        {/* Heading block */}
        <div className="hp-copy lg:col-span-5 lg:row-start-1 lg:self-end">
          <p className="hp-fade text-sm font-bold uppercase tracking-[0.2em]">Desde 1995 en Monterrey</p>
          <h1 className="display mt-3 lg:mt-4" style={{ fontSize: "clamp(3rem, min(6.2vw, 10dvh), 7rem)", lineHeight: 1.12 }}>
            <span className="block" style={MASK}>
              <span className="hp-line block">Mariscos con </span>
            </span>
            <span className="block" style={MASK}>
              <span className="hp-line block">sazón regia</span>
            </span>
          </h1>
          <p className="hp-fade mt-3 max-w-[34rem] text-pretty text-base font-semibold leading-snug md:text-xl lg:mt-4">
            Aguachiles, cócteles y pulpo zarandeado en seis sucursales. Como en casa, desde 1995.
          </p>
        </div>

        {/* The product: active HD cut-out plate, fitted from its real size */}
        <div
          id="hero-panel"
          role="tabpanel"
          aria-labelledby={`hero-tab-${p.id}`}
          className="hp-stage relative mx-auto mt-5 flex w-[92vw] max-w-[640px] flex-col lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:-mr-4 lg:mt-0 lg:w-[min(52vw,860px,calc((100dvh-330px)*1.45))] lg:max-w-none lg:self-center lg:justify-self-end"
          onPointerEnter={() => api.current.setHover(true)}
          onPointerLeave={() => api.current.setHover(false)}
        >
          <div className="hp-scroll relative w-full" style={{ aspectRatio: BOX }}>
            {/* Crab line art: behind the plate, bleeding off the right edge only */}
            <div
              aria-hidden="true"
              className="hp-ilu-wrap pointer-events-none absolute -right-[20%] top-0 z-0 w-[66%] lg:-right-[14%] lg:-top-[14%] lg:w-[60%]"
            >
              <img src={ILU.crab} width={1000} height={856} alt="" decoding="async" className="hp-ilu w-full opacity-[0.18]" />
            </div>

            {/* Contact shadows: one per plate, under its real bottom edge, breathing with the float */}
            <div aria-hidden="true" className="hp-shadow-in pointer-events-none absolute inset-0 z-[1]">
              {HERO_PLATOS.map((pl, i) => {
                const f = fit(pl.w, pl.h, BOX);
                return (
                  <span
                    key={pl.id}
                    className="hp-cshadow absolute block h-[9%]"
                    style={{
                      left: `${50 - (f.wp * 0.36)}%`,
                      width: `${f.wp * 0.72}%`,
                      top: `${50 + f.hp / 2 - 6}%`,
                      ...(i === 0 ? null : HIDDEN),
                    }}
                  >
                    <span className="hp-breathe block h-full w-full rounded-[50%] bg-black/35 blur-xl md:blur-2xl" />
                  </span>
                );
              })}
            </div>

            <div className="hp-intro absolute inset-0 z-[2]">
              <div className="hp-tilt h-full w-full">
                <div className="hp-punch h-full w-full">
                  <div className="hp-float h-full w-full">
                    <div className="hp-spin relative h-full w-full will-change-transform">
                      {HERO_PLATOS.map((pl, i) => {
                        const f = fit(pl.w, pl.h, BOX);
                        return (
                          <div
                            key={pl.id}
                            aria-hidden={i === active ? undefined : "true"}
                            className="hp-item absolute inset-0 flex items-center justify-center"
                            style={i === 0 ? undefined : HIDDEN}
                          >
                            {pl.video ? (
                              /* The film: edges feathered into the hero ambience, no frame. Decorative (the HD photo
                                 below carries the alt text); muted until the visitor's first interaction. */
                              <video
                                className="hp-vid pointer-events-none absolute left-1/2 top-1/2 max-w-none"
                                style={{
                                  width: `${(VFIT[pl.id] || { w: 110 }).w}%`,
                                  aspectRatio: `${pl.vw} / ${pl.vh}`,
                                  transform: `translate(-50%, ${(VFIT[pl.id] || { y: -50 }).y}%)`,
                                  opacity: 0,
                                  WebkitMaskImage: pl.dark ? FEATHER : FEATHER_SOFT,
                                  maskImage: pl.dark ? FEATHER : FEATHER_SOFT,
                                }}
                                src={pl.video}
                                poster={pl.poster}
                                muted
                                playsInline
                                preload={i === 0 ? "auto" : "metadata"}
                                aria-hidden="true"
                                tabIndex={-1}
                              />
                            ) : null}
                            <div
                              className="hp-img relative"
                              style={{ width: `${f.wp}%`, maxWidth: pl.w, aspectRatio: `${pl.w} / ${pl.h}`, opacity: pl.video ? 0 : 1 }}
                            >
                              <img
                                src={pl.img}
                                width={pl.w}
                                height={pl.h}
                                alt={ALT[pl.id] || pl.name}
                                decoding="async"
                                fetchpriority={i === 0 ? "high" : undefined}
                                className="h-full w-full object-contain"
                                style={{ filter: STUDIO }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Name + price: under the plate on mobile, top corner on desktop, never over the food center */}
          <div className="hp-badge relative z-20 mt-3 flex items-center gap-3 self-start rounded-full bg-marino px-4 py-2 text-blanco shadow-[0_16px_34px_-14px_rgba(0,0,0,0.5)] lg:absolute lg:-top-8 lg:right-4 lg:mt-0 lg:gap-4 lg:px-6 lg:py-3">
            <span className="sr-only">
              {p.name}, {p.price}
            </span>
            <span key={`n-${active}`} aria-hidden="true" className="display block text-base lg:text-2xl" style={MASK}>
              <Chars text={p.name} className="hp-badge-char" />
            </span>
            <span aria-hidden="true" className="block" style={MASK}>
              <span key={`p-${active}`} className="hp-badge-price display block text-xl text-amarillo lg:text-4xl">
                {p.price}
              </span>
            </span>
          </div>
        </div>

        {/* Actions block: CTAs + flavor switcher */}
        <div className="hp-copy mt-5 lg:col-span-5 lg:row-start-2 lg:mt-0 lg:self-start">
          <div className="hp-fade grid gap-3 sm:flex sm:flex-wrap lg:mt-6">
            <a
              ref={cta}
              href="#menu"
              onClick={(e) => {
                e.preventDefault();
                scrollToTarget("#menu");
              }}
              className="btn btn-marino"
            >
              Ver el menú
              <ArrowDownRight size={20} weight="bold" aria-hidden="true" />
            </a>
            <a href={WHATSAPP} target="_blank" rel="noopener" className="btn btn-ghost">
              <WhatsappLogo size={20} weight="bold" aria-hidden="true" />
              Pedir por WhatsApp
            </a>
          </div>

          {/* Flavor switcher: recolors the whole hero */}
          <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3 lg:mt-6">
            <span className="hp-fade hidden text-xs font-bold uppercase tracking-[0.18em] sm:block lg:hidden xl:block">
              Elige tu antojo
            </span>
            <div
              role="tablist"
              aria-label="Platillos de la casa"
              className="inline-flex max-w-full flex-wrap gap-1 rounded-full bg-marino/90 p-1.5 shadow-[0_14px_30px_-14px_rgba(0,0,0,0.5)]"
              onFocus={() => api.current.setFocus(true)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) api.current.setFocus(false);
              }}
              onPointerEnter={() => api.current.setHover(true)}
              onPointerLeave={() => api.current.setHover(false)}
            >
              {HERO_PLATOS.map((pl, i) => {
                const on = i === active;
                return (
                  <button
                    key={pl.id}
                    ref={(el) => (tabs.current[i] = el)}
                    id={`hero-tab-${pl.id}`}
                    type="button"
                    role="tab"
                    aria-label={pl.name}
                    aria-selected={on}
                    aria-controls="hero-panel"
                    tabIndex={on ? 0 : -1}
                    onClick={() => api.current.go(i, true)}
                    onKeyDown={(e) => onTabKey(e, i)}
                    className={`hp-pill display relative inline-flex min-h-12 items-center overflow-hidden rounded-full px-4 text-lg transition-[background-color,color] duration-300 sm:px-5 xl:px-6 xl:text-xl ${
                      on ? "bg-amarillo text-marino" : "text-blanco hover:bg-blanco/15"
                    }`}
                  >
                    <span className="relative">{SHORT[pl.id] || pl.name}</span>
                    <span
                      aria-hidden="true"
                      className="hp-progress absolute inset-x-3 bottom-1.5 h-[3px] rounded-full bg-marino"
                      style={{ transform: "scaleX(0)", transformOrigin: "0% 50%" }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Music of the films: on after the first interaction, toggle here, fades out when leaving the hero */}
            <button
              type="button"
              onClick={() => audio.current.toggle()}
              aria-pressed={soundOn}
              aria-label={soundOn ? "Silenciar música" : "Activar música"}
              className="hp-sound hp-pill relative inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-full bg-marino/90 px-4 text-blanco shadow-[0_14px_30px_-14px_rgba(0,0,0,0.5)] transition-colors hover:bg-marino"
            >
              {soundOn ? <SpeakerHigh size={20} weight="bold" aria-hidden="true" /> : <SpeakerSlash size={20} weight="bold" aria-hidden="true" />}
              <span aria-hidden="true" className={`lp-eq flex h-4 items-end gap-[3px] ${soundOn ? "is-on" : ""}`}>
                <i /><i /><i /><i />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Giant word: its own band at the bottom, in flow, so no UI can ever sit on it */}
      <div aria-hidden="true" className="pointer-events-none relative z-[1] mt-2 flex justify-center overflow-hidden">
        <div
          className="hp-word-track display whitespace-nowrap"
          style={{ fontSize: "clamp(5rem, min(22vw, 26dvh), 24rem)", lineHeight: 0.92 }}
        >
          <Chars text="MARISCOS" className="hp-word-char" />
        </div>
      </div>
    </section>
  );
}
