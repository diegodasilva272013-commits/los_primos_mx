import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../lib/motion.js";
import Bubbles from "../components/Bubbles.jsx";
import { FOTOS, HISTORIA, ILU, VALORES } from "../data.js";

const HEADLINE = "Una familia, una cocina, desde 1995.";
const WORDS = HEADLINE.split(" ");

/* HOY composition: three HD cut-outs fanned out (positions in % of the visual box, kept inside it). */
const FAN = [
  { src: "/food/preferida-del-tio.webp", w: 1600, h: 828, alt: "Preferida del Tío: camarones envueltos, empanizados, filete y aros para dos", cls: "left-0 top-[2%] w-[66%] z-10", rot: -8 },
  { src: "/food/molcajete-mixto.webp", w: 1519, h: 1073, alt: "Molcajete Mixto con chicharrón de pescado y pulpo y guacamole", cls: "right-0 top-[28%] w-[54%] z-20", rot: 7 },
  { src: "/food/tostada-ceviche.webp", w: 1600, h: 1015, alt: "Tostada de ceviche de camarón con aguacate y pico con pepino", cls: "left-[8%] bottom-[8%] w-[56%] z-30", rot: -4 },
];

const SHADOW = "drop-shadow-[0_28px_30px_rgba(6,10,30,0.55)]";

/* Visual for each step. `stage` = the pinned right column (absolute layers), otherwise inline per entry. */
function StepVisual({ i, stage = false }) {
  if (i === 0) {
    return (
      <div className={`h-frame relative w-full overflow-hidden rounded-[32px] bg-marino-2 ${stage ? "h-full" : "aspect-[4/3]"}`}>
        <img
          src={FOTOS.mesa}
          width={1800}
          height={1200}
          loading="lazy"
          decoding="async"
          alt="Mesa de Los Primos con mojarra frita, camarones envueltos, tostada y totopos con salsas de la casa"
          className="h-lobby absolute inset-0 h-full w-full object-cover object-[50%_70%] will-change-transform"
        />
      </div>
    );
  }
  if (i === 1) {
    return (
      <div className={`flex w-full items-center justify-center ${stage ? "h-full" : "py-4"}`}>
        <div className={`h-cut ${stage ? "w-[min(100%,62dvh)]" : "w-[86%] max-w-[480px]"}`}>
          <img
            src="/food/pulpo-zarandeado.webp"
            width={1600}
            height={1409}
            loading="lazy"
            decoding="async"
            alt="Pulpo Zarandeado, el platillo que define la casa"
            className={`h-idle h-auto w-full ${SHADOW}`}
          />
        </div>
      </div>
    );
  }
  return (
    <div className={`relative w-full ${stage ? "h-full" : "aspect-square sm:aspect-[5/4]"}`}>
      {FAN.map((f) => (
        <div key={f.src} className={`h-fan absolute ${f.cls}`}>
          <div style={{ transform: `rotate(${f.rot}deg)` }}>
            <img
              src={f.src}
              width={f.w}
              height={f.h}
              loading="lazy"
              decoding="async"
              alt={f.alt}
              className={`h-idle h-auto w-full ${SHADOW}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Mascot({ className = "" }) {
  return (
    <div className={`h-masc-pop shrink-0 ${className}`}>
      <div className="h-masc-step">
        <img
          src="/img/mascota.png"
          width={300}
          height={300}
          loading="lazy"
          decoding="async"
          alt="Primo, la mascota de Los Primos: un pescado chef con sombrero que levanta el pulgar"
          className="h-masc-idle h-auto w-full drop-shadow-[0_18px_24px_rgba(12,21,56,0.45)]"
        />
      </div>
    </div>
  );
}

/*
  Pinned storytelling (desktop, motion allowed, tall enough): the stage pins for +=220% while the
  counter runs 1995 > 2018 > HOY and the right column changes scene in the same timeline:
  1995 lobby photo (inset reveal) > 2018 the pulpo cut-out flies in > HOY three cut-outs fan out.
  Without pin (mobile / reduced motion / short screens / no JS) each entry is a stacked block with its
  own year and its own visual, in chronological order. Pinned-only layout lives behind .is-pinned.
  The mascot is rendered in two slots but CSS shows exactly one at a time (counter when pinned,
  next to the HOY entry otherwise).
*/
export default function Historia() {
  const root = useRef(null);

  useGSAP(
    (context, contextSafe) => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          pin: "(min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)",
          motion: "(prefers-reduced-motion: no-preference)",
        },
        (ctx) => {
          const { pin, motion } = ctx.conditions;
          if (!motion) return;
          const el = root.current;
          const q = gsap.utils.selector(el);

          /* Headline: char rise inside per-word masks. */
          gsap.from(q(".h-char"), {
            yPercent: 115,
            rotate: 8,
            duration: 1.05,
            ease: "expo.out",
            stagger: 0.022,
            scrollTrigger: { trigger: q(".h-head")[0], start: "top 85%", once: true },
          });

          /* Logo badge: rotates in, then sways gently (inner wrapper). */
          gsap.from(q(".h-logo"), {
            scale: 0.4,
            rotate: -200,
            autoAlpha: 0,
            duration: 1.3,
            delay: 0.2,
            ease: "back.out(1.6)",
            scrollTrigger: { trigger: q(".h-head")[0], start: "top 85%", once: true },
          });
          gsap.to(q(".h-logo-idle"), { rotate: 6, y: -8, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 });

          /* Idle float on every cut-out (inner img, never fights the timeline on the wrapper). */
          q(".h-idle").forEach((img, k) => {
            gsap.to(img, { y: -12, rotate: k % 2 ? -2 : 2, duration: 2 + (k % 3) * 0.35, ease: "sine.inOut", yoyo: true, repeat: -1, delay: k * 0.2 });
          });

          /* Mascot pop-in + idle bob. */
          gsap.to(q(".h-masc-idle"), { y: -10, rotate: 3, duration: 1.8, ease: "sine.inOut", yoyo: true, repeat: -1 });

          /* Boat line art: drifts across with the whole section, rocking on its own. */
          gsap.fromTo(
            q(".h-barco"),
            { xPercent: 12 },
            { xPercent: -22, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 } }
          );
          gsap.to(q(".h-barco-bob"), { y: -14, rotate: -2.5, duration: 3.4, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: "50% 80%" });

          if (pin) {
            el.classList.add("is-pinned");
            const stage = q(".h-stage")[0];
            const num = q(".h-num")[0];
            const hoy = q(".h-hoy")[0];
            const panels = q(".h-panel");
            const step = q(".h-counter .h-masc-step")[0];
            const v = q(".h-v");
            const setNum = (n) => {
              if (num) num.textContent = String(Math.round(n));
            };
            const proxy = { v: 1995 };
            setNum(1995);

            gsap.from(q(".h-counter .h-masc-pop"), {
              scale: 0,
              rotate: -120,
              duration: 1.1,
              ease: "back.out(1.8)",
              scrollTrigger: { trigger: stage, start: "top 75%", once: true },
            });

            gsap.set(panels.slice(1), { autoAlpha: 0, y: 60 });
            gsap.set(hoy, { autoAlpha: 1, yPercent: 115 });
            gsap.set(q(".h-bar-fill"), { scaleX: 0, transformOrigin: "left center" });
            gsap.set(v[1], { autoAlpha: 0, y: 140, rotate: -14, scale: 0.8 });
            const fans = q(".h-v2 .h-fan");
            gsap.set(fans, { autoAlpha: 0, x: (k) => [-160, 180, 0][k], y: (k) => [-80, 40, 180][k], scale: 0.7 });

            // 1995 frame: clip-path inset reveal while the stage scrolls up to the pin point.
            gsap.fromTo(
              q(".h-v0 .h-frame"),
              { clipPath: "inset(22% 18% 22% 18% round 32px)" },
              {
                clipPath: "inset(0% 0% 0% 0% round 32px)",
                ease: "none",
                scrollTrigger: { trigger: stage, start: "top 85%", end: "top top", scrub: 0.5 },
              }
            );

            const tl = gsap.timeline({
              defaults: { ease: "none" },
              scrollTrigger: {
                trigger: stage,
                start: "top top",
                end: "+=220%",
                scrub: 0.5,
                pin: true,
                invalidateOnRefresh: true,
              },
            });

            // Lobby parallax-zoom, always overscaled so the frame never shows the marino background.
            tl.fromTo(q(".h-v0 .h-lobby"), { scale: 1.32, yPercent: -5 }, { scale: 1.14, yPercent: 4, duration: 1.2 }, 0);

            // STEP 1: 1995 > 2018 (photo closes with an inset wipe, pulpo flies in)
            tl.to(proxy, { v: 2018, duration: 1, ease: "power1.inOut", snap: { v: 1 }, onUpdate: () => setNum(proxy.v) }, 0.3)
              .to(panels[0], { autoAlpha: 0, y: -60, duration: 0.4, ease: "power2.in" }, 0.3)
              .to(panels[1], { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.8)
              .to(q(".h-bar-fill")[0], { scaleX: 1, duration: 1 }, 0.3)
              .fromTo(
                v[0],
                { clipPath: "inset(0% 0% 0% 0% round 32px)" },
                { clipPath: "inset(0% 0% 100% 0% round 32px)", duration: 0.6, ease: "power2.in", immediateRender: false },
                0.45
              )
              .to(v[1], { autoAlpha: 1, y: 0, rotate: 0, scale: 1, duration: 0.7, ease: "back.out(1.4)" }, 0.75)
              .to(step, { y: -70, rotate: 180, duration: 0.35, ease: "power2.out" }, 0.3)
              .to(step, { y: 0, rotate: 360, duration: 0.55, ease: "bounce.out" }, 0.65);

            // STEP 2: 2018 > HOY (pulpo flies out, three cut-outs fan in)
            tl.to(num, { yPercent: -115, duration: 0.5, ease: "power2.in" }, 1.7)
              .to(hoy, { yPercent: 0, duration: 0.6, ease: "back.out(1.6)" }, 2.1)
              .to(panels[1], { autoAlpha: 0, y: -60, duration: 0.4, ease: "power2.in" }, 1.7)
              .to(panels[2], { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, 2.2)
              .to(q(".h-bar-fill")[1], { scaleX: 1, duration: 1 }, 1.7)
              .to(v[1], { autoAlpha: 0, x: -120, y: -160, rotate: 18, scale: 0.75, duration: 0.55, ease: "power2.in" }, 1.75)
              .to(fans, { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 0.7, ease: "back.out(1.5)", stagger: 0.12 }, 2.1)
              .to(step, { y: -80, scaleX: -1, rotate: 346, duration: 0.35, ease: "power2.out" }, 1.7)
              .to(step, { y: 0, scaleX: 1, rotate: 360, duration: 0.6, ease: "bounce.out" }, 2.05)
              .to({}, { duration: 0.5 }, 2.8); // breathing room on HOY before release

            return () => {
              el.classList.remove("is-pinned");
              setNum(1995);
            };
          }

          /* Stacked (mobile / short screens): each entry reveals in order with its own year and visual. */
          q(".h-panel").forEach((p) => {
            gsap.from(p.querySelectorAll(".h-rise"), {
              y: 36,
              autoAlpha: 0,
              duration: 0.6,
              ease: "power3.out",
              stagger: 0.08,
              scrollTrigger: { trigger: p, start: "top 88%", once: true },
            });
          });
          q(".h-panels .h-frame").forEach((f) => {
            gsap.fromTo(
              f,
              { clipPath: "inset(16% 12% 16% 12% round 32px)" },
              {
                clipPath: "inset(0% 0% 0% 0% round 32px)",
                ease: "none",
                scrollTrigger: { trigger: f, start: "top 95%", end: "top 50%", scrub: 0.5 },
              }
            );
          });
          gsap.fromTo(
            q(".h-panels .h-lobby"),
            { scale: 1.25, yPercent: -5 },
            { scale: 1.12, yPercent: 4, ease: "none", scrollTrigger: { trigger: q(".h-panels .h-frame")[0], start: "top bottom", end: "bottom top", scrub: true } }
          );
          q(".h-panels .h-cut, .h-panels .h-fan").forEach((c, k) => {
            gsap.from(c, {
              y: 80,
              scale: 0.8,
              autoAlpha: 0,
              duration: 0.7,
              ease: "back.out(1.5)",
              delay: (k % 3) * 0.08,
              scrollTrigger: { trigger: c, start: "top 92%", once: true },
            });
          });
          gsap.from(q(".h-panels .h-masc-pop"), {
            scale: 0,
            rotate: -120,
            duration: 1,
            ease: "back.out(1.8)",
            scrollTrigger: { trigger: q(".h-panels .h-masc-pop")[0], start: "top 90%", once: true },
          });
        }
      );

      /* Valores: chips pop in with a stagger and a slight random tilt, then wiggle on hover. */
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const chips = gsap.utils.toArray(".h-chip", root.current);
        const bases = chips.map(() => gsap.utils.random(-6, 6, 0.5));
        gsap.fromTo(
          chips,
          { scale: 0, rotate: (i) => bases[i] * 4, autoAlpha: 0 },
          {
            scale: 1,
            rotate: (i) => bases[i],
            autoAlpha: 1,
            duration: 0.75,
            ease: "back.out(2.2)",
            stagger: 0.07,
            scrollTrigger: { trigger: root.current.querySelector(".h-valores"), start: "top 85%", once: true },
          }
        );
        const handlers = chips.map((chip, i) => {
          const fn = contextSafe(() => {
            const b = bases[i];
            gsap.to(chip, {
              keyframes: { rotate: [b + 9, b - 7, b + 4, b], scale: [1.08, 1.08, 1.04, 1] },
              duration: 0.55,
              ease: "power1.inOut",
              overwrite: "auto",
            });
          });
          chip.addEventListener("pointerenter", fn);
          return fn;
        });
        return () => chips.forEach((chip, i) => chip.removeEventListener("pointerenter", handlers[i]));
      });
    },
    { scope: root }
  );

  return (
    <section
      id="historia"
      ref={root}
      aria-labelledby="historia-titulo"
      className="relative overflow-x-clip bg-marino pt-28 text-blanco md:pt-36"
    >
      <style>{`
        #historia .h-counter, #historia .h-progress, #historia .h-stage-vis { display: none; }
        #historia.is-pinned .h-stage-inner {
          height: 100dvh; padding-top: 7.5rem; padding-bottom: 2.5rem;
          grid-template-columns: repeat(12, minmax(0, 1fr)); align-items: center; column-gap: 2.5rem;
        }
        #historia.is-pinned .h-left { grid-column: span 7 / span 7; }
        #historia.is-pinned .h-stage-vis { display: block; grid-column: span 5 / span 5; }
        #historia.is-pinned .h-counter, #historia.is-pinned .h-progress { display: flex; }
        #historia.is-pinned .h-panels { display: grid; margin-top: 2rem; }
        #historia.is-pinned .h-panel { grid-area: 1 / 1; border: 0; padding: 0; display: block; }
        #historia.is-pinned .h-step-vis, #historia.is-pinned .h-panel-masc { display: none; }
        #historia.is-pinned .h-panel-year {
          position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap;
        }
      `}</style>

      {/* Headline + logo badge */}
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-10 px-4 md:px-8 lg:grid-cols-12">
        <h2
          id="historia-titulo"
          aria-label={HEADLINE}
          className="h-head display display-stack max-w-[13ch] text-blanco lg:col-span-7"
          style={{ fontSize: "clamp(3rem, 7.4vw, 8rem)" }}
        >
          {WORDS.map((w, wi) => (
            <span key={wi} aria-hidden="true" className="inline-block whitespace-nowrap align-top">
              <span className="inline-block" style={{ clipPath: "inset(-0.45em -0.1em -0.08em -0.1em)" }}>
                {[...w].map((c, ci) => (
                  <span key={ci} className={`h-char inline-block ${wi === WORDS.length - 1 ? "text-amarillo" : ""}`}>
                    {c}
                  </span>
                ))}
              </span>
              {wi < WORDS.length - 1 && <span>&nbsp;</span>}
            </span>
          ))}
        </h2>
        <div className="hidden justify-center lg:col-span-5 lg:flex">
          <div className="h-logo w-[220px]">
            <img
              src="/img/logo.png"
              width={512}
              height={512}
              loading="lazy"
              decoding="async"
              alt="Logotipo de Los Primos Restaurante"
              className="h-logo-idle h-auto w-full drop-shadow-[0_20px_28px_rgba(6,10,30,0.5)]"
            />
          </div>
        </div>
      </div>

      {/* Stage (pinned on desktop) */}
      <div className="h-stage relative mt-14 md:mt-20">
        {/* Brand line art: the fishing boat drifts behind everything at low opacity (decorative) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="h-barco absolute left-[18%] top-[14%] w-[min(88vw,760px)] opacity-[0.08] md:left-[26%]">
            <img
              src={ILU.barco}
              width={1000}
              height={838}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-barco-bob h-auto w-full"
            />
          </div>
        </div>
        <Bubbles count={18} color="232,246,253" />
        <div className="h-stage-inner relative mx-auto grid max-w-[1400px] grid-cols-1 px-4 pb-6 md:px-8">
          <div className="h-left min-w-0">
            {/* Counter + mascot (pinned only) */}
            <div className="h-counter items-end gap-6">
              <div
                aria-hidden="true"
                className="display grid overflow-hidden py-[0.08em] text-amarillo"
                style={{ fontSize: "clamp(5.5rem, 12vw, 12rem)" }}
              >
                <span className="h-num inline-block [grid-area:1/1]">1995</span>
                <span className="h-hoy inline-block [grid-area:1/1]" style={{ visibility: "hidden" }}>
                  HOY
                </span>
              </div>
              <Mascot className="w-[clamp(130px,11vw,180px)] pb-3" />
            </div>

            {/* Progress (pinned only) */}
            <div aria-hidden="true" className="h-progress mt-4 max-w-[420px] gap-2">
              {[0, 1].map((i) => (
                <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                  <span className="h-bar-fill block h-full w-full rounded-full bg-amarillo" />
                </span>
              ))}
            </div>

            <ol className="h-panels flex flex-col">
              {HISTORIA.map((h, i) => (
                <li
                  key={h.year}
                  className={`h-panel grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12 ${
                    i < HISTORIA.length - 1 ? "border-b border-white/15 pb-12" : ""
                  } ${i > 0 ? "pt-12" : ""}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-end gap-4">
                      <h3
                        className="h-panel-year h-rise display text-amarillo"
                        style={{ fontSize: "clamp(4.5rem, 16vw, 8rem)" }}
                      >
                        {h.year}
                      </h3>
                      {i === HISTORIA.length - 1 && <Mascot className="h-panel-masc w-24 pb-1 sm:w-28" />}
                    </div>
                    <p className="h-rise mt-4 max-w-[36ch] text-pretty text-xl leading-snug text-blanco md:text-2xl">{h.text}</p>
                  </div>
                  <div className="h-step-vis h-rise min-w-0 px-2">
                    <StepVisual i={i} />
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Scene column (pinned only): three layers crossfading in one timeline */}
          <div aria-hidden="true" className="h-stage-vis min-w-0">
            <div className="relative h-[min(66dvh,620px)] w-full">
              <div className="h-v h-v0 absolute inset-0">
                <StepVisual i={0} stage />
              </div>
              <div className="h-v h-v1 absolute inset-0">
                <StepVisual i={1} stage />
              </div>
              <div className="h-v h-v2 absolute inset-0">
                <StepVisual i={2} stage />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Valores */}
      <div className="h-valores mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-4 pb-24 pt-16 md:px-8 md:pb-32 md:pt-24 lg:grid-cols-12 lg:items-center lg:gap-10">
        <h3 className="display display-stack text-blanco lg:col-span-4" style={{ fontSize: "clamp(2.5rem, 4.5vw, 4.25rem)" }}>
          Lo que nos <span className="text-amarillo">mueve</span>
        </h3>
        <ul aria-label="Nuestros valores" className="flex flex-wrap gap-3 md:gap-4 lg:col-span-8">
          {VALORES.map((v, i) => (
            <li
              key={v}
              className={`h-chip display inline-flex min-h-12 cursor-default select-none items-center rounded-full px-6 text-2xl md:min-h-16 md:px-8 md:text-4xl ${
                i % 2 === 0 ? "bg-white/10 text-blanco ring-1 ring-white/20" : "bg-amarillo text-marino"
              }`}
            >
              {v}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
