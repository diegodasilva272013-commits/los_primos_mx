import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useGSAP } from "@gsap/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, CaretDown, Play, WhatsappLogo, X } from "@phosphor-icons/react";
import { gsap, ScrollTrigger, getLenis, reduceMotion, scrollToTarget } from "../lib/motion.js";
import { ILU, PLATILLOS, WHATSAPP } from "../data.js";

/*
  VITRINA: dark stage (abismo) where every dish is a brand-color card and the HD cut-out FILLS it.
  Plate size is computed with container units against the card itself, capped at the file's natural
  width (never upscaled). Videos: set `video: "/video/<id>.mp4"` in PLATILLOS (data.js), nothing else.
*/

const PANELS = [
  { bg: "bg-cielo", light: "rgba(255,255,255,0.55)" },
  { bg: "bg-amarillo", light: "rgba(255,255,255,0.62)" },
  { bg: "bg-coral", light: "rgba(255,236,226,0.55)" },
  { bg: "bg-marino-2", light: "rgba(130,200,245,0.38)" },
];
const SHADOW = "radial-gradient(closest-side, rgba(12,21,56,0.42), rgba(12,21,56,0))";
const CATS = ["Todos", ...new Set(PLATILLOS.map((p) => p.cat))];
const MOBILE_LIMIT = 6;

/* Plate fills the nearest size container (the card), bleeding past the edges, capped at natural width. */
function plateStyle(p, kx, ky) {
  const ar = p.w / p.h;
  const y = ar < 1 ? Math.min(ky, 1.02) : ky; // tall glasses: fit height, do not crop the top
  return {
    width: `min(${p.w}px, ${Math.round(kx * 100)}cqw, ${(y * ar * 100).toFixed(1)}cqh)`,
    maxWidth: "none",
    height: "auto",
  };
}

/* Bento rhythm on 4 columns with an exact cell count (no holes), for any filtered length. */
const BLOCKS = [
  ["big", "one", "one", "one", "one"],
  ["one", "wide", "one"],
  ["one", "one", "big", "one", "one"],
  ["wide", "one", "one"],
];
const TAIL = { 1: ["full"], 2: ["wide", "wide"], 3: ["wide", "one", "one"], 4: ["one", "one", "one", "one"] };
function bento(n) {
  const out = [];
  let b = 0;
  while (out.length < n) {
    const blk = BLOCKS[b % BLOCKS.length];
    const r = n - out.length;
    if (r >= blk.length) {
      out.push(...blk);
      b++;
    } else out.push(...TAIL[r]);
  }
  return out;
}
const LG = {
  big: "lg:col-span-2 lg:row-span-2",
  wide: "lg:col-span-2 lg:row-span-1",
  one: "lg:col-span-1 lg:row-span-1",
  full: "lg:col-span-4 lg:row-span-1",
};
/* 2 columns: every third card spans both; a lone trailing card also spans so the last row is full. */
const smSpan = (i, n) => (i % 3 === 0 || (i === n - 1 && n % 3 === 2) ? "sm:col-span-2" : "sm:col-span-1");

const waLink = (name) => `${WHATSAPP}?text=${encodeURIComponent(`Hola, quiero pedir ${name}`)}`;

export default function Vitrina() {
  const root = useRef(null);
  const grid = useRef(null);
  const pills = useRef(null);
  const cardRefs = useRef({});
  const prevFilter = useRef(null);
  const exitTween = useRef(null);
  const lastOpen = useRef(null);
  const origin = useRef(null);
  const [filter, setFilter] = useState("Todos");
  const [showAll, setShowAll] = useState(false);
  const [openId, setOpenId] = useState(null);

  const list = useMemo(() => (filter === "Todos" ? PLATILLOS : PLATILLOS.filter((p) => p.cat === filter)), [filter]);
  const sizes = useMemo(() => bento(list.length), [list]);
  const limited = filter === "Todos" && !showAll;

  /* One-time: heading lines, intro, pills, decorative illustration float. */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(root);
        const head = q(".v-head")[0];
        gsap.from(q(".v-line"), {
          yPercent: 110,
          rotate: 4,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: { trigger: head, start: "top 85%", once: true },
        });
        gsap.from(q(".v-intro"), {
          y: 24,
          autoAlpha: 0,
          duration: 0.8,
          delay: 0.3,
          ease: "power3.out",
          scrollTrigger: { trigger: head, start: "top 85%", once: true },
        });
        gsap.from(q(".v-pill"), {
          y: 20,
          autoAlpha: 0,
          duration: 0.55,
          ease: "back.out(1.7)",
          stagger: 0.035,
          scrollTrigger: { trigger: pills.current, start: "top 92%", once: true },
        });
        gsap.to(q(".v-ilu"), { y: -24, rotate: 7, duration: 6, ease: "sine.inOut", yoyo: true, repeat: -1 });
      });
    },
    { scope: root }
  );

  /* Cards: staggered rise on first scroll; on every filter change a quick fade/scale stagger in. */
  useGSAP(
    () => {
      const initial = prevFilter.current === null || prevFilter.current === filter;
      prevFilter.current = filter;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray(".v-card", grid.current);
        if (initial) {
          gsap.set(cards, { autoAlpha: 0, y: 70, scale: 0.96 });
          ScrollTrigger.batch(cards, {
            start: "top 88%",
            once: true,
            onEnter: (batch) =>
              gsap.to(batch, { autoAlpha: 1, y: 0, scale: 1, duration: 1, ease: "expo.out", stagger: 0.08, overwrite: true }),
          });
        } else {
          gsap.fromTo(
            cards,
            { autoAlpha: 0, y: 28, scale: 0.96 },
            { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: "expo.out", stagger: 0.04, overwrite: true }
          );
        }
      });
    },
    { scope: root, dependencies: [filter], revertOnUpdate: true }
  );

  /* Page height changed: re-measure every ScrollTrigger below. */
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    ScrollTrigger.refresh();
  }, [filter, showAll]);

  useEffect(() => () => exitTween.current?.kill(), []);

  /* Return focus to the card of the last dish seen in the modal. */
  useEffect(() => {
    if (openId === null && lastOpen.current) {
      cardRefs.current[lastOpen.current]?.focus({ preventScroll: true });
      lastOpen.current = null;
    }
  }, [openId]);

  const choose = (c) => {
    if (c === filter) return;
    exitTween.current?.kill();
    const apply = () => {
      setFilter(c);
      const g = grid.current;
      if (g && g.getBoundingClientRect().top < 0) scrollToTarget(pills.current, { immediate: reduceMotion() });
    };
    const cards = grid.current ? gsap.utils.toArray(".v-card", grid.current) : [];
    if (reduceMotion() || !cards.length) return apply();
    exitTween.current = gsap.to(cards, {
      autoAlpha: 0,
      y: 16,
      scale: 0.97,
      duration: 0.18,
      ease: "power2.out",
      stagger: { amount: 0.1 },
      overwrite: true,
      onComplete: apply,
    });
  };

  const open = (p, el) => {
    const r = el.getBoundingClientRect();
    origin.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    setOpenId(p.id);
  };
  const nav = useCallback((id) => setOpenId(id), []);
  const close = useCallback(() => {
    setOpenId((id) => {
      lastOpen.current = id;
      return null;
    });
  }, []);

  return (
    <section
      id="platillos"
      ref={root}
      aria-labelledby="platillos-titulo"
      className="relative overflow-x-clip bg-abismo pb-24 pt-24 text-blanco md:pb-32 md:pt-32"
    >
      {/* Brand line illustration, decorative */}
      <img
        src={ILU.crab}
        width={1000}
        height={856}
        loading="lazy"
        decoding="async"
        alt=""
        aria-hidden="true"
        className="v-ilu pointer-events-none absolute -right-20 top-10 w-[min(60vw,440px)] opacity-[0.07]"
      />

      <div className="relative mx-auto max-w-[1400px] px-4 md:px-8">
        {/* Header */}
        <div className="v-head flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <h2
            id="platillos-titulo"
            aria-label="Nuestros platillos"
            className="display display-stack"
            style={{ fontSize: "clamp(3.75rem, 12vw, 11rem)" }}
          >
            <span aria-hidden="true" className="block" style={{ clipPath: "inset(-0.3em -0.2em -0.04em -0.2em)" }}>
              <span className="v-line block text-blanco">Nuestros</span>
            </span>
            <span aria-hidden="true" className="block" style={{ clipPath: "inset(-0.3em -0.2em -0.04em -0.2em)" }}>
              <span className="v-line block text-amarillo">platillos</span>
            </span>
          </h2>
          <p className="v-intro max-w-[30ch] text-pretty text-lg font-medium text-blanco/85 md:text-xl lg:pb-4 lg:text-right">
            Fotos y video de cada plato. Así llegan a tu mesa.
          </p>
        </div>

        {/* Filters */}
        <div
          ref={pills}
          role="group"
          aria-label="Filtrar platillos por categoría"
          className="-mx-4 mt-10 flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] md:mx-0 md:mt-14 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {CATS.map((c) => {
            const on = c === filter;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={on}
                onClick={() => choose(c)}
                className={`v-pill inline-flex min-h-12 shrink-0 items-center whitespace-nowrap rounded-full px-5 text-sm font-bold uppercase tracking-wider transition-[background-color,color,scale] duration-200 active:scale-[0.96] ${
                  on ? "bg-amarillo text-marino" : "bg-blanco/[0.08] text-blanco ring-1 ring-blanco/20 hover:bg-blanco/[0.16]"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
        <p className="sr-only" aria-live="polite">
          {filter === "Todos" ? `${list.length} platillos` : `${list.length} platillos en ${filter}`}
        </p>

        {/* Grid */}
        <ul
          ref={grid}
          className="mt-8 grid auto-rows-[320px] grid-cols-1 gap-3 sm:auto-rows-[280px] sm:grid-cols-2 md:mt-10 md:gap-4 lg:auto-rows-[250px] lg:grid-cols-4 xl:auto-rows-[290px]"
        >
          {list.map((p, i) => (
            <li
              key={p.id}
              className={`min-w-0 ${smSpan(i, list.length)} ${LG[sizes[i]]} ${limited && i >= MOBILE_LIMIT ? "max-sm:hidden" : ""}`}
            >
              <Card
                p={p}
                i={i}
                size={sizes[i]}
                cardRef={(el) => (cardRefs.current[p.id] = el)}
                onOpen={(e) => open(p, e.currentTarget)}
              />
            </li>
          ))}
        </ul>

        {limited && list.length > MOBILE_LIMIT && (
          <div className="mt-8 flex justify-center sm:hidden">
            <button type="button" onClick={() => setShowAll(true)} className="btn btn-ghost text-blanco">
              Ver los {list.length} platillos
              <CaretDown size={20} weight="bold" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {openId !== null &&
        createPortal(
          <Modal list={list} id={openId} origin={origin.current} onNav={nav} onClose={close} />,
          document.body
        )}
    </section>
  );
}

/* ---------------------------------------------------------------- Card */

function Card({ p, i, size, cardRef, onOpen }) {
  const video = useRef(null);
  const panel = PANELS[i % PANELS.length];
  const big = size === "big";

  // The clip plays by itself (muted, looped) while the card is on screen, on every device. The photo of the plate
  // stays until the first video frame is really playing, then crossfades out (never a photo behind the film, and
  // never an empty card while the clip buffers). Off screen: pause, photo back.
  const plate = useRef(null);
  useEffect(() => {
    const v = video.current;
    if (!v || reduceMotion()) return;
    const showFilm = () => {
      v.style.opacity = "1";
      if (plate.current) plate.current.style.opacity = "0";
    };
    const showPhoto = () => {
      v.style.opacity = "0";
      if (plate.current) plate.current.style.opacity = "1";
    };
    v.addEventListener("playing", showFilm);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(showPhoto);
        else {
          v.pause();
          showPhoto();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(v.parentElement);
    return () => {
      v.removeEventListener("playing", showFilm);
      io.disconnect();
    };
  }, []);
  const enter = () => {};
  const leave = () => {};

  return (
    <button
      ref={cardRef}
      type="button"
      aria-label={p.name}
      aria-haspopup="dialog"
      onClick={onOpen}
      onPointerEnter={enter}
      onPointerLeave={leave}
      className={`v-card group relative isolate block h-full w-full overflow-hidden rounded-[32px] text-left ${panel.bg} transition-[scale] duration-200 [container-type:size] active:scale-[0.985]`}
    >
      {/* Studio light behind the plate + soft contact shadow */}
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{ background: `radial-gradient(70% 62% at 50% 40%, ${panel.light}, rgba(255,255,255,0) 72%)` }}
      />
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-[56%] h-[24%] w-[74%] -translate-x-1/2 blur-md"
        style={{ background: SHADOW }}
      />

      {/* The plate: fills and bleeds past the card */}
      <span ref={plate} className="absolute inset-x-0 bottom-[16%] top-0 flex items-center justify-center transition-opacity duration-500">
        <img
          src={p.img}
          width={p.w}
          height={p.h}
          loading="lazy"
          decoding="async"
          alt={`${p.name}, platillo de Los Primos`}
          style={plateStyle(p, big ? 1.12 : 1.24, 1.3)}
          className="shrink-0 transition-[scale,rotate] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] [@media(pointer:fine)]:group-hover:rotate-3 [@media(pointer:fine)]:group-hover:scale-[1.06] group-focus-visible:scale-[1.06]"
        />
      </span>

      {/* Optional clip: plays muted on hover (fine pointer) */}
      {p.video && (
        <video
          ref={video}
          src={p.video}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500"
        />
      )}

      {/* Light sweep */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-[130%] skew-x-[-18deg] bg-linear-to-r from-transparent via-white/35 to-transparent transition-none [@media(pointer:fine)]:group-hover:translate-x-[430%] [@media(pointer:fine)]:group-hover:transition-[translate] [@media(pointer:fine)]:group-hover:duration-[1100ms] [@media(pointer:fine)]:group-hover:ease-[cubic-bezier(0.16,1,0.3,1)]"
      />

      {/* Badges */}
      {p.video && (
        <span
          aria-hidden="true"
          className="absolute left-4 top-4 z-10 inline-flex h-9 items-center gap-1.5 rounded-full bg-amarillo px-3.5 text-xs font-bold uppercase tracking-wider text-marino"
        >
          <Play size={14} weight="fill" />
          Video
        </span>
      )}
      <span
        aria-hidden="true"
        className="absolute right-4 top-4 z-10 inline-flex h-9 translate-y-2 items-center gap-1.5 rounded-full bg-marino px-3.5 text-xs font-bold uppercase tracking-wider text-blanco opacity-0 transition-[opacity,translate] duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
      >
        Ver platillo
        <ArrowUpRight size={14} weight="bold" />
      </span>

      {/* Text on a marino scrim */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[58%] bg-linear-to-t from-marino from-30% via-marino/85 via-60% to-transparent"
      />
      <span className="absolute inset-x-0 bottom-0 z-10 block p-5 md:p-6">
        <span className="block text-xs font-bold uppercase tracking-[0.18em] text-blanco/75">{p.cat}</span>
        <span className="mt-2 flex items-end justify-between gap-4">
          <span className={`display block min-w-0 text-balance pt-[0.12em] text-3xl leading-[0.95] text-blanco ${big ? "lg:text-5xl" : ""}`}>
            {p.name}
          </span>
          <span className={`display block shrink-0 text-2xl text-amarillo ${big ? "lg:text-3xl" : ""}`}>{p.price}</span>
        </span>
      </span>
    </button>
  );
}

/* ---------------------------------------------------------------- Modal */

function Media({ p, color, live }) {
  if (p.video) {
    return (
      <video
        src={p.video}
        controls={live}
        autoPlay={live}
        muted={!live}
        loop
        playsInline
        aria-label={`Video de ${p.name}`}
        className="absolute inset-0 h-full w-full bg-abismo object-cover"
      />
    );
  }
  const panel = PANELS[color % PANELS.length];
  return (
    <div className={`absolute inset-0 overflow-hidden ${panel.bg} [container-type:size]`}>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: `radial-gradient(60% 60% at 50% 45%, ${panel.light}, rgba(255,255,255,0) 72%)` }}
      />
      <img
        src={ILU.almeja}
        width={1000}
        height={829}
        loading="lazy"
        decoding="async"
        alt=""
        aria-hidden="true"
        className={`${live ? "vm-ilu" : ""} pointer-events-none absolute -right-[6%] top-[4%] w-[42%] opacity-30`}
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[62%] h-[22%] w-[70%] -translate-x-1/2 blur-lg"
        style={{ background: SHADOW }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`${live ? "vm-kb" : ""} will-change-transform`}>
          <img
            src={p.img}
            width={p.w}
            height={p.h}
            decoding="async"
            alt={`${p.name}, platillo de Los Primos`}
            style={{ ...plateStyle(p, 0.96, 0.92), filter: "drop-shadow(0 34px 34px rgba(12,21,56,0.4))" }}
            className={`${live ? "vm-plate" : ""} block`}
          />
        </div>
      </div>
    </div>
  );
}

function Modal({ list, id, origin, onNav, onClose }) {
  const root = useRef(null);
  const panel = useRef(null);
  const closeBtn = useRef(null);
  const closing = useRef(false);
  const dir = useRef(1);
  const isFirst = useRef(true);
  const last = useRef(null);

  const idx = Math.max(0, list.findIndex((d) => d.id === id));
  const p = list[idx];
  const n = list.length;
  const under = last.current && last.current.p.id !== p.id ? last.current : null;
  useEffect(() => {
    last.current = { p, idx };
  });

  const go = (step) => {
    if (n < 2) return;
    dir.current = step;
    onNav(list[(idx + step + n) % n].id);
  };

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    if (reduceMotion() || !panel.current) return onClose();
    gsap.to(panel.current, {
      clipPath: "inset(8% 10% 8% 10% round 32px)",
      scale: 0.92,
      autoAlpha: 0,
      duration: 0.32,
      ease: "power3.inOut",
    });
    gsap.to(root.current.querySelector(".vm-backdrop"), { autoAlpha: 0, duration: 0.32, ease: "power2.out", onComplete: onClose });
  }, [onClose]);

  /* Scroll lock + initial focus. */
  useEffect(() => {
    const lenis = getLenis();
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    lenis?.stop();
    html.style.overflow = "hidden";
    closeBtn.current?.focus({ preventScroll: true });
    return () => {
      lenis?.start();
      html.style.overflow = prevOverflow;
    };
  }, []);

  /* Keyboard: Esc, focus trap, arrows (not while a video has focus, it uses arrows to seek). */
  const keyRef = useRef(null);
  keyRef.current = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "Tab" && panel.current) {
      const f = [...panel.current.querySelectorAll('a[href], button:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])')].filter(
        (el) => el.getClientRects().length > 0
      );
      if (!f.length) return;
      const first = f[0];
      const lastEl = f[f.length - 1];
      const a = document.activeElement;
      if (!panel.current.contains(a) || a === panel.current) {
        e.preventDefault();
        (e.shiftKey ? lastEl : first).focus();
      } else if (e.shiftKey && a === first) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && a === lastEl) {
        e.preventDefault();
        first.focus();
      }
      return;
    }
    if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && e.target?.tagName !== "VIDEO") {
      e.preventDefault();
      go(e.key === "ArrowLeft" ? -1 : 1);
    }
  };
  useEffect(() => {
    const h = (e) => keyRef.current(e);
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  /* Open: card-to-modal (scale from the card's position + clip-path inset). */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const r = panel.current.getBoundingClientRect();
        const o = origin ? `${origin.x - r.left}px ${origin.y - r.top}px` : "50% 50%";
        gsap.fromTo(".vm-backdrop", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "power2.out" });
        gsap.fromTo(
          panel.current,
          { clipPath: "inset(14% 16% 14% 16% round 32px)", scale: 0.86, autoAlpha: 0, transformOrigin: o },
          { clipPath: "inset(0% 0% 0% 0% round 32px)", scale: 1, autoAlpha: 1, duration: 0.5, ease: "expo.out" }
        );
        gsap.from(".vm-info > *", { y: 18, autoAlpha: 0, duration: 0.5, ease: "expo.out", stagger: 0.05, delay: 0.12 });
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.fromTo(root.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 });
      });
    },
    { scope: root }
  );

  /* Ken Burns + illustration float; on prev/next a directional wipe and plate rotate-in. */
  useGSAP(
    () => {
      const first = isFirst.current;
      isFirst.current = false;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(".vm-kb", { scale: 1, x: 0 }, { scale: 1.08, x: "2.5%", duration: 9, ease: "sine.inOut", yoyo: true, repeat: -1 });
        gsap.to(".vm-ilu", { y: -18, rotate: 8, duration: 5, ease: "sine.inOut", yoyo: true, repeat: -1 });
        if (first) return;
        const from = dir.current > 0 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)";
        gsap.fromTo(".vm-media-top", { clipPath: from }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "expo.out" });
        gsap.fromTo(".vm-plate", { rotate: -10 * dir.current, scale: 0.86 }, { rotate: 0, scale: 1, duration: 0.9, ease: "expo.out" });
        gsap.fromTo(
          ".vm-info > *",
          { y: 14, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out", stagger: 0.04 }
        );
      });
    },
    { scope: root, dependencies: [p.id], revertOnUpdate: true }
  );

  const num = (v) => String(v).padStart(2, "0");

  return (
    <div ref={root} data-lenis-prevent className="fixed inset-0 z-[55] flex items-center justify-center p-3 md:p-6">
      <div aria-hidden="true" onClick={close} className="vm-backdrop absolute inset-0 bg-abismo/85 backdrop-blur-md" />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vm-title"
        tabIndex={-1}
        className="relative grid max-h-[calc(100dvh-1.5rem)] w-full max-w-[1180px] grid-cols-1 overflow-y-auto overscroll-contain rounded-[32px] bg-marino text-blanco shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)] outline-none lg:h-[min(720px,calc(100dvh-3rem))] lg:grid-cols-[1.35fr_1fr] lg:overflow-hidden"
      >
        {/* Media */}
        <div className="relative h-[44vh] min-h-[280px] overflow-hidden bg-abismo lg:h-full lg:min-h-0">
          {under && (
            <div aria-hidden="true" className="absolute inset-0">
              <Media p={under.p} color={under.idx} live={false} />
            </div>
          )}
          <div key={p.id} className="vm-media-top absolute inset-0">
            <Media p={p} color={idx} live />
          </div>
        </div>

        {/* Info */}
        <div className="flex min-h-0 flex-col p-6 pt-7 md:p-10 lg:overflow-y-auto lg:pt-20">
          <div key={p.id} className="vm-info flex flex-1 flex-col">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-amarillo">{p.cat}</p>
            <h3 id="vm-title" className="display display-stack mt-4 text-balance pt-[0.1em] text-5xl text-blanco md:text-6xl">
              {p.name}
            </h3>
            <p className="display mt-5 text-4xl text-amarillo md:text-5xl">{p.price}</p>
            <p className="mt-6 max-w-[40ch] text-pretty text-lg leading-relaxed text-blanco/85">{p.desc}</p>
            <div className="mt-8">
              <a href={waLink(p.name)} target="_blank" rel="noopener" className="btn btn-amarillo">
                <WhatsappLogo size={22} weight="bold" aria-hidden="true" />
                Pedir por WhatsApp
              </a>
            </div>
          </div>

          {n > 1 && (
            <div className="mt-10 flex items-center justify-between gap-3 border-t border-blanco/15 pt-6">
              <button
                type="button"
                onClick={() => go(-1)}
                className="inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-sm font-bold uppercase tracking-wider text-blanco ring-1 ring-blanco/25 transition-[background-color,scale] duration-200 hover:bg-blanco/10 active:scale-[0.96]"
              >
                <ArrowLeft size={18} weight="bold" aria-hidden="true" />
                Anterior
              </button>
              <span className="text-sm font-bold tabular-nums tracking-wider text-blanco/70" aria-hidden="true">
                {num(idx + 1)} / {num(n)}
              </span>
              <button
                type="button"
                onClick={() => go(1)}
                className="inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-sm font-bold uppercase tracking-wider text-blanco ring-1 ring-blanco/25 transition-[background-color,scale] duration-200 hover:bg-blanco/10 active:scale-[0.96]"
              >
                Siguiente
                <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Close */}
        <button
          ref={closeBtn}
          type="button"
          onClick={close}
          className="absolute right-3 top-3 z-10 inline-flex min-h-12 items-center gap-2 rounded-full bg-marino px-5 text-sm font-bold uppercase tracking-wider text-blanco shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] ring-1 ring-blanco/25 transition-[background-color,scale] duration-200 hover:bg-marino-2 active:scale-[0.96] md:right-5 md:top-5"
        >
          <X size={18} weight="bold" aria-hidden="true" />
          Cerrar
        </button>
      </div>
    </div>
  );
}
