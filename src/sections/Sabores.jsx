import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { SABORES, ILU } from "../data.js";
import { gsap, ScrollTrigger, scrollToTarget, reduceMotion } from "../lib/motion.js";

gsap.registerPlugin(useGSAP);

/*
  LA BARRA (reel reference): dishes pass one by one along a counter. Each dish brings its glass sign
  (name, what it has, price), tilted in 3D and tied to the plate by a leader line with a dot.
  - Desktop: the stage pins; each scroll step slides the conveyor one dish (always a complete, timed move).
  - Mobile: no pin; the conveyor advances by itself while on screen, names row to jump.
  - Reduced motion: same stage, instant changes, no auto-advance.
  Brand color field per dish (not the reel's black), counter band + spotlight for the "bar" feel.
*/
const N = SABORES.length;
const AUTO = 4.2; // seconds per dish on mobile
const STUDIO = "drop-shadow(0 30px 28px rgba(0,0,0,0.3)) drop-shadow(0 8px 10px rgba(0,0,0,0.18))";

export default function Sabores() {
  const root = useRef(null);
  const api = useRef({ jump: () => {} });
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const section = root.current;
      const stage = q(".sb-stage")[0];
      const track = q(".sb-track")[0];
      const cards = q(".sb-card");
      const line = q(".sb-line")[0];
      const dot = q(".sb-dot")[0];
      const svg = q(".sb-svg")[0];
      const still = reduceMotion();
      const st = { cur: 0, tl: null, pin: null, auto: null, user: false };

      gsap.set(cards, { autoAlpha: 0, transformPerspective: 1100, transformOrigin: "50% 50%" });
      gsap.set(cards[0], { autoAlpha: 1, rotationY: still ? 0 : 9, rotationZ: still ? 0 : -1.5 });
      gsap.set(line, { strokeDasharray: 1, strokeDashoffset: 0 });

      // Leader line: from the sign's dot to a point on the plate, measured from the real layout.
      const layout = () => {
        const s = stage.getBoundingClientRect();
        const a = q(".sb-anchor")[0].getBoundingClientRect();
        const t = q(".sb-target")[0].getBoundingClientRect();
        svg.setAttribute("viewBox", `0 0 ${s.width} ${s.height}`);
        line.setAttribute("x1", a.left + a.width / 2 - s.left);
        line.setAttribute("y1", a.top + a.height / 2 - s.top);
        line.setAttribute("x2", t.left - s.left);
        line.setAttribute("y2", t.top - s.top);
      };
      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(stage);

      const paint = (i, dur) =>
        gsap.to(section, { backgroundColor: SABORES[i].color, color: SABORES[i].ink, duration: dur, ease: "power2.inOut", overwrite: "auto" });

      const go = (next) => {
        if (next === st.cur) return;
        const prev = st.cur;
        const dir = next > prev ? 1 : -1;
        st.cur = next;
        setActive(next);
        st.tl?.kill();
        cards.forEach((c, k) => k !== prev && k !== next && gsap.set(c, { autoAlpha: 0 }));

        if (still) {
          gsap.set(track, { xPercent: (-100 / N) * next });
          gsap.set(cards[prev], { autoAlpha: 0 });
          gsap.set(cards[next], { autoAlpha: 1, xPercent: 0, rotationY: 0, rotationZ: 0 });
          gsap.set(section, { backgroundColor: SABORES[next].color, color: SABORES[next].ink });
          return;
        }

        st.tl = gsap
          .timeline()
          // sign lets go of the plate and flies off
          .to(line, { strokeDashoffset: 1, duration: 0.18, ease: "power1.in" }, 0)
          .to(dot, { scale: 0, duration: 0.18, ease: "power1.in" }, 0)
          .to(cards[prev], { xPercent: -45 * dir, rotationY: -38 * dir, rotationZ: -4 * dir, autoAlpha: 0, duration: 0.42, ease: "power2.in" }, 0.02)
          // the conveyor moves one dish
          .to(track, { xPercent: (-100 / N) * next, duration: 1.05, ease: "power3.inOut" }, 0.05)
          .add(() => paint(next, 0.75), 0.15)
          // new sign swings in and hooks onto the new plate
          .fromTo(
            cards[next],
            { xPercent: 45 * dir, rotationY: 42 * dir, rotationZ: 4 * dir, autoAlpha: 0 },
            { xPercent: 0, rotationY: 9, rotationZ: -1.5, autoAlpha: 1, duration: 0.7, ease: "back.out(1.25)" },
            0.6
          )
          .to(dot, { scale: 1, duration: 0.35, ease: "back.out(3)" }, 1.0)
          .to(line, { strokeDashoffset: 0, duration: 0.4, ease: "power2.out" }, 1.05);
      };

      const stopAuto = () => {
        st.auto?.kill();
        st.auto = null;
      };
      const startAuto = () => {
        stopAuto();
        if (still || st.user) return;
        st.auto = gsap.delayedCall(AUTO, () => {
          go((st.cur + 1) % N);
          startAuto();
        });
      };

      api.current.jump = (i) => {
        if (st.pin) {
          const y = st.pin.start + ((st.pin.end - st.pin.start) * i) / (N - 1);
          scrollToTarget(y, { offset: 0 });
        } else {
          st.user = true;
          stopAuto();
          go(i);
        }
      };

      const mm = gsap.matchMedia();

      // Desktop: pinned, one dish per scroll step.
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        st.pin = ScrollTrigger.create({
          trigger: stage,
          start: "top top",
          end: () => `+=${(N - 1) * window.innerHeight * 0.8}`,
          pin: true,
          invalidateOnRefresh: true,
          snap: { snapTo: 1 / (N - 1), duration: { min: 0.2, max: 0.5 }, delay: 0.06, inertia: false, ease: "power1.inOut" },
          onUpdate: (self) => {
            const idx = Math.round(self.progress * (N - 1));
            if (idx !== st.cur) go(idx);
          },
          onRefresh: layout,
        });
        return () => {
          st.pin?.kill();
          st.pin = null;
        };
      });

      // Mobile: the conveyor runs by itself while the stage is on screen.
      mm.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", () => {
        const t = ScrollTrigger.create({
          trigger: stage,
          start: "top 65%",
          end: "bottom 35%",
          onToggle: (self) => (self.isActive ? startAuto() : stopAuto()),
        });
        return () => {
          t.kill();
          stopAuto();
        };
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Entrance: the first dish slides in on the bar, its sign swings in and hooks on.
        gsap
          .timeline({ scrollTrigger: { trigger: stage, start: "top 72%", once: true } })
          .from(q(".sb-slot")[0], { xPercent: 60, autoAlpha: 0, duration: 1, ease: "power3.out" }, 0)
          .from(q(".sb-head"), { y: 24, autoAlpha: 0, duration: 0.7, ease: "power3.out" }, 0.1)
          .from(cards[0], { xPercent: 40, rotationY: 42, autoAlpha: 0, duration: 0.8, ease: "back.out(1.25)" }, 0.35)
          .from(dot, { scale: 0, duration: 0.35, ease: "back.out(3)" }, 0.95)
          .from(line, { strokeDashoffset: 1, duration: 0.45, ease: "power2.out" }, 1.0)
          .from(q(".sb-name"), { y: 18, autoAlpha: 0, duration: 0.5, stagger: 0.05, ease: "power3.out" }, 0.5);

        // Idle life: plates breathe on the bar, the sign hovers, line art drifts.
        gsap.fromTo(q(".sb-float"), { y: 5 }, { y: -7, duration: 2.8, ease: "sine.inOut", yoyo: true, repeat: -1 });
        gsap.fromTo(q(".sb-hover"), { y: -5 }, { y: 6, duration: 3.4, ease: "sine.inOut", yoyo: true, repeat: -1, onUpdate: layout });
        q(".sb-ilu").forEach((el, i) =>
          gsap.fromTo(
            el,
            { rotation: i ? 5 : -5, y: 0 },
            { rotation: i ? -5 : 5, y: i ? 18 : -18, duration: 12 + i * 4, ease: "sine.inOut", yoyo: true, repeat: -1 }
          )
        );
      });

      return () => {
        ro.disconnect();
        stopAuto();
        st.tl?.kill();
      };
    },
    { scope: root }
  );

  return (
    <section
      id="sabores"
      ref={root}
      aria-labelledby="sabores-titulo"
      className="relative overflow-hidden"
      style={{ backgroundColor: SABORES[0].color, color: SABORES[0].ink }}
    >
      <div className="sb-stage relative h-[100svh] max-h-[860px] min-h-[640px] overflow-hidden md:h-[100dvh] md:max-h-none">
        {/* Spotlight + brand line art (decorative) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 55% 50% at 62% 58%, rgba(255,255,255,0.28), transparent 70%)" }}
        />
        <img src={ILU.barco} alt="" aria-hidden="true" width={1000} height={838} loading="lazy" className="sb-ilu pointer-events-none absolute -right-[6%] top-[9%] w-[min(42vw,520px)] opacity-[0.13]" />
        <img src={ILU.almeja} alt="" aria-hidden="true" width={1000} height={829} loading="lazy" className="sb-ilu pointer-events-none absolute -left-[5%] bottom-[30%] hidden w-[min(24vw,340px)] opacity-[0.1] md:block" />

        {/* The bar: counter band the plates rest on */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[25%] border-t border-white/25 bg-black/20">
          <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/15 to-transparent" />
        </div>

        {/* Conveyor: one full-width slot per dish */}
        <div className="sb-track absolute inset-y-0 left-0 flex will-change-transform" style={{ width: `${N * 100}%` }}>
          {SABORES.map((s, i) => (
            <div key={s.id} className="sb-slot relative h-full" style={{ width: `${100 / N}%` }} aria-hidden={i === active ? undefined : "true"}>
              <div className="absolute bottom-[13%] left-4 right-4 top-[54%] flex items-end justify-center md:bottom-[12%] md:left-[38%] md:right-[3%] md:top-[26%]">
                <div className="sb-float relative flex h-full w-full items-end justify-center">
                  <span aria-hidden="true" className="absolute bottom-[-3%] left-1/2 h-[9%] w-[62%] -translate-x-1/2 rounded-[50%] bg-black/40 blur-xl" />
                  <img
                    src={s.img}
                    width={s.w}
                    height={s.h}
                    alt={`${s.name}: ${s.body}`}
                    loading="lazy"
                    decoding="async"
                    className="relative max-h-full w-auto max-w-full object-contain object-bottom"
                    style={{ filter: STUDIO }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Leader line from the sign to the plate */}
        <svg aria-hidden="true" className="sb-svg pointer-events-none absolute inset-0 z-10 h-full w-full" fill="none">
          <line className="sb-line" pathLength="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span aria-hidden="true" className="sb-target absolute left-[40%] top-[68%] md:left-[52%] md:top-[50%]" />

        {/* Heading + glass signs */}
        <div className="absolute left-4 right-4 top-[92px] z-20 md:left-[max(2rem,calc((100vw-1400px)/2+2rem))] md:right-auto md:top-[14%] md:w-[min(36vw,480px)]">
          <h2 id="sabores-titulo" className="sb-head display text-2xl md:text-4xl">
            Recién salidos de la cocina
          </h2>

          <div className="sb-hover relative mt-4 md:mt-7">
            <div className="grid" aria-live="polite">
              {SABORES.map((s, i) => (
                <article
                  key={s.id}
                  aria-hidden={i === active ? undefined : "true"}
                  className="sb-card col-start-1 row-start-1 rounded-[32px] bg-white/[0.16] p-5 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.55)] ring-1 ring-white/45 backdrop-blur-md md:p-8"
                  style={i === 0 ? undefined : { visibility: "hidden", opacity: 0 }}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-80">{s.tag}</p>
                  <h3 className="display display-stack mt-1 text-[clamp(2rem,9vw,2.75rem)] md:text-[clamp(2.5rem,4vw,4.25rem)]">{s.name}</h3>
                  <ul className="mt-3 space-y-1 text-[0.95rem] font-semibold leading-snug md:mt-4 md:text-lg">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex gap-2">
                        <span aria-hidden="true" className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-end justify-between gap-4 border-t border-current/30 pt-3 md:mt-6 md:pt-4">
                    <span className="text-sm font-semibold md:text-base">{s.line}</span>
                    <span className="display shrink-0 text-4xl md:text-6xl">{s.price}</span>
                  </div>
                </article>
              ))}
            </div>
            <span
              aria-hidden="true"
              className="sb-anchor absolute -bottom-2 left-8 grid h-4 w-4 place-items-center md:-right-2 md:bottom-12 md:left-auto"
            >
              <span className="sb-dot block h-3.5 w-3.5 rounded-full border-2 border-current bg-blanco" />
            </span>
          </div>
        </div>

        {/* Dish names: jump to any dish */}
        <div
          role="tablist"
          aria-label="Platillos de la barra"
          className="absolute inset-x-0 bottom-3 z-20 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] md:bottom-6 md:justify-center md:px-8 [&::-webkit-scrollbar]:hidden"
        >
          {SABORES.map((s, i) => {
            const on = i === active;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => api.current.jump(i)}
                className={`sb-name display inline-flex min-h-12 shrink-0 items-center rounded-full px-4 text-base transition-colors duration-300 md:px-5 md:text-lg ${
                  on ? "bg-marino text-blanco" : "bg-white/20 ring-1 ring-white/40 hover:bg-white/35"
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
