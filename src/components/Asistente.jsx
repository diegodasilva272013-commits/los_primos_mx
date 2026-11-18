import { useCallback, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { Conversation } from "@elevenlabs/client";
import {
  ChatCircleDots,
  Microphone,
  MicrophoneSlash,
  PaperPlaneRight,
  PhoneCall,
  PhoneDisconnect,
  WhatsappLogo,
  X,
} from "@phosphor-icons/react";
import { gsap, ScrollTrigger, reduceMotion } from "../lib/motion.js";
import { COMBOS, COMBO_PRICE, MENU, SUCURSALES, WHATSAPP, WHATSAPP_LABEL } from "../data.js";

gsap.registerPlugin(useGSAP);

/*
  ASISTENTE DE VOZ (custom UI over the ElevenLabs Conversational AI SDK, not the stock widget).
  - Launcher: a brand pill with the mascot, bottom-right. A speech bubble nudges once.
  - Panel: glass-dark card (32px radius) with the mascot as the "face", a live voice waveform driven by the real
    input/output volume, a transcript, mic mute, hang up and a text box (also a text-only chat if the mic is denied).
  - It never talks over the hero film music: starting a call tells the hero (event "lp:voice") to fade it out.
  - The agent gets the REAL branches and menu as a contextual update on connect, so it cannot invent them.
*/
const AGENT_ID = "agent_4701m7r3ndejfe9sfr0nqtenx347";
const BARS = 9;

function buildContext() {
  const sucursales = SUCURSALES.map((s) => `- ${s.name}: ${s.addr}. Teléfono ${s.tel.join(" / ")}. Horario: ${s.hours}.`).join("\n");
  const menu = MENU.map(
    (c) => `${c.label}: ` + c.items.map(([n, d, p]) => `${n}${d ? " (" + d + ")" : ""} ${p}`).join("; ")
  ).join("\n");
  const combos = COMBOS.map((c) => `${c.name}: ${c.items}`).join("; ");
  return [
    "INFORMACIÓN OFICIAL DE LOS PRIMOS RESTAURANTE. Úsala SIEMPRE y no inventes sucursales, platillos, bebidas ni precios.",
    "Si algo no está en esta lista, di con naturalidad que no lo manejan y ofrece pedirlo por WhatsApp al " + WHATSAPP_LABEL + ".",
    "Precios en pesos mexicanos. Cuando des un total o subtotal, suma exactamente los precios de la lista, uno por uno.",
    "No existe ninguna sucursal fuera de estas seis. Plaza Andenes está en San Nicolás de los Garza, no en Monterrey.",
    "",
    "SUCURSALES (solo estas seis):",
    sucursales,
    "Cierran el 25 de diciembre y el 1 de enero. El 24 y 31 de diciembre cierran a las 18:00.",
    "",
    "MENÚ:",
    menu,
    `COMBOS (cada uno ${COMBO_PRICE}): ${combos}`,
  ].join("\n");
}

function friendlyError(e) {
  const name = e && (e.name || "");
  const msg = String((e && e.message) || e || "");
  if (name === "NotAllowedError" || /permission|denied|notallowed/i.test(msg))
    return "No pudimos usar tu micrófono. Revisa el permiso del navegador o elige escribir.";
  if (name === "NotFoundError" || /device not found|no.*microphone/i.test(msg)) return "No encontramos un micrófono. Puedes escribirnos por aquí.";
  return "No pudimos conectar ahora mismo. Intenta de nuevo o pide por WhatsApp.";
}

export default function Asistente() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | connecting | connected | ended | error
  const [mode, setMode] = useState("listening"); // speaking | listening
  const [muted, setMuted] = useState(false);
  const [textOnly, setTextOnly] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [err, setErr] = useState("");
  const [draft, setDraft] = useState("");
  const [tip, setTip] = useState(false);
  const [past, setPast] = useState(false); // phones: the launcher waits until the hero (and its CTAs) is scrolled past

  const conv = useRef(null);
  const root = useRef(null);
  const launcher = useRef(null);
  const panel = useRef(null);
  const log = useRef(null);
  const mascot = useRef(null);
  const input = useRef(null);
  const live = status === "connected";

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    let trig = null;
    const apply = () => {
      trig?.kill();
      trig = null;
      if (!mq.matches) return setPast(true);
      setPast(false);
      trig = ScrollTrigger.create({ trigger: "#inicio", start: "bottom 70%", end: "max", onToggle: (self) => setPast(self.isActive) });
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      trig?.kill();
    };
  }, []);

  /* ---------- Appear after the preloader curtain; one friendly nudge per session ---------- */
  useEffect(() => {
    const show = () => setTimeout(() => setReady(true), 1400);
    if (window.__lpIntroDone) {
      const t = show();
      return () => clearTimeout(t);
    }
    let t;
    const on = () => (t = show());
    window.addEventListener("lp:intro-done", on, { once: true });
    return () => {
      window.removeEventListener("lp:intro-done", on);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem("lp-asistente-tip") === "1";
    } catch {}
    if (seen || !past) return;
    const a = setTimeout(() => setTip(true), 3200);
    const b = setTimeout(() => setTip(false), 11000);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [ready]);

  useGSAP(
    () => {
      if (!ready || !(past || live) || open || reduceMotion() || !launcher.current) return;
      gsap.from(launcher.current, { scale: 0, y: 28, rotation: -8, duration: 0.8, ease: "back.out(1.8)" });
      // the mascot waves from time to time
      gsap
        .timeline({ repeat: -1, repeatDelay: 5, delay: 2 })
        .to(".as-l-mascot", { rotation: 14, duration: 0.14, yoyo: true, repeat: 5, ease: "sine.inOut", transformOrigin: "50% 90%" })
        .to(".as-l-mascot", { rotation: 0, duration: 0.2 });
    },
    { scope: root, dependencies: [ready, past, open] }
  );

  useGSAP(
    () => {
      if (!tip || reduceMotion()) return;
      gsap.fromTo(".as-tip", { autoAlpha: 0, y: 12, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.6)", transformOrigin: "100% 100%" });
    },
    { scope: root, dependencies: [tip] }
  );

  /* ---------- Panel open / close ---------- */
  useGSAP(
    () => {
      if (!open || !panel.current) return;
      if (reduceMotion()) {
        gsap.set(panel.current, { autoAlpha: 1 });
        return;
      }
      gsap.fromTo(
        panel.current,
        { autoAlpha: 0, y: 28, scale: 0.94, transformOrigin: "100% 100%" },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "expo.out" }
      );
      gsap.from(".as-in", { y: 14, autoAlpha: 0, duration: 0.5, stagger: 0.06, ease: "power3.out", delay: 0.15 });
    },
    { scope: root, dependencies: [open] }
  );

  const openPanel = () => {
    setTip(false);
    try {
      sessionStorage.setItem("lp-asistente-tip", "1");
    } catch {}
    setOpen(true);
  };
  const closePanel = () => {
    if (!panel.current || reduceMotion()) return setOpen(false);
    gsap.to(panel.current, { autoAlpha: 0, y: 20, scale: 0.95, duration: 0.28, ease: "power2.in", onComplete: () => setOpen(false) });
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && closePanel();
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => panel.current?.querySelector("[data-first]")?.focus(), 80);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open]);

  /* ---------- Mascot "face": reacts to who is talking ---------- */
  useGSAP(
    () => {
      const el = mascot.current;
      if (!el || reduceMotion()) return;
      gsap.killTweensOf(el);
      gsap.set(el, { transformOrigin: "50% 90%" });
      if (live && mode === "speaking") {
        gsap.to(el, { y: -7, rotation: 3, duration: 0.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
      } else if (live) {
        gsap.fromTo(el, { rotation: -3 }, { rotation: 3, duration: 1.8, ease: "sine.inOut", yoyo: true, repeat: -1 });
      } else {
        gsap.fromTo(el, { y: 3 }, { y: -5, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
      }
    },
    { scope: root, dependencies: [live, mode, open] }
  );

  /* ---------- Live waveform: real mic / agent volume ---------- */
  useEffect(() => {
    if (!live || textOnly) return;
    let raf = 0;
    let smooth = 0;
    const phases = Array.from({ length: BARS }, (_, i) => i * 0.7);
    const tick = (t) => {
      const c = conv.current;
      let v = 0;
      try {
        v = c && c.getOutputVolume ? (mode === "speaking" ? c.getOutputVolume() : c.getInputVolume() * 0.9) : 0;
      } catch {}
      smooth += (v - smooth) * 0.35;
      document.querySelectorAll(".as-bar").forEach((el) => {
        const k = Number(el.dataset.k);
        const wob = 0.5 + 0.5 * Math.sin(t / 150 + phases[k]);
        el.style.transform = `scaleY(${Math.max(0.14, Math.min(1, 0.14 + smooth * (0.55 + wob * 0.9)))})`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, mode, textOnly]);

  /* ---------- Transcript autoscroll ---------- */
  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion() ? "auto" : "smooth" });
  }, [msgs, open]);

  /* ---------- Call lifecycle ---------- */
  const voiceFlag = (on) => {
    window.__lpVoice = on;
    window.dispatchEvent(new CustomEvent("lp:voice", { detail: { on } }));
  };

  const addMsg = useCallback((role, text) => {
    const clean = String(text || "").trim();
    if (!clean) return;
    setMsgs((m) => [...m, { id: m.length + "-" + Date.now(), role, text: clean }]);
  }, []);

  const start = async (asText = false) => {
    if (status === "connecting" || live) return;
    setErr("");
    setMsgs([]);
    setMuted(false);
    setStatus("connecting");
    setTextOnly(asText);
    const base = {
      agentId: AGENT_ID,
      onMessage: ({ role, message }) => addMsg(role === "agent" ? "agent" : "user", message),
      onModeChange: ({ mode: m }) => setMode(m),
      onDisconnect: () => {
        conv.current = null;
        voiceFlag(false);
        setStatus((s) => (s === "error" ? s : "ended"));
      },
      onError: (m) => {
        if (typeof m === "string" && m) setErr(friendlyError(m));
      },
    };
    try {
      let c;
      try {
        c = await Conversation.startSession({ ...base, textOnly: asText, connectionType: asText ? "websocket" : "webrtc" });
      } catch (e1) {
        if (asText || /NotAllowed|Permission|denied|NotFound/i.test(String(e1 && (e1.name + e1.message)))) throw e1;
        c = await Conversation.startSession({ ...base, textOnly: false, connectionType: "websocket" });
      }
      conv.current = c;
      setStatus("connected");
      voiceFlag(true);
      try {
        c.sendContextualUpdate(buildContext());
      } catch {}
      setTimeout(() => input.current?.focus({ preventScroll: true }), 300);
    } catch (e) {
      conv.current = null;
      voiceFlag(false);
      setErr(friendlyError(e));
      setStatus("error");
    }
  };

  const hangUp = async () => {
    const c = conv.current;
    conv.current = null;
    try {
      await c?.endSession();
    } catch {}
    voiceFlag(false);
    setStatus("ended");
  };

  const toggleMic = () => {
    const next = !muted;
    try {
      conv.current?.setMicMuted?.(next);
    } catch {}
    setMuted(next);
  };

  const send = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !conv.current) return;
    try {
      conv.current.sendUserMessage(text);
      addMsg("user", text);
      setDraft("");
    } catch {}
  };

  useEffect(
    () => () => {
      conv.current?.endSession?.().catch?.(() => {});
      voiceFlag(false);
    },
    []
  );

  if (!ready) return null;

  const idleLike = status === "idle" || status === "ended" || status === "error";
  const label =
    status === "connecting" ? "Conectando…" : live ? (textOnly ? "Chat de texto" : mode === "speaking" ? "Hablando…" : muted ? "Micrófono apagado" : "Te escucho") : status === "ended" ? "Llamada terminada" : "Asistente de Los Primos";

  const bars = (className = "") => (
    <span aria-hidden="true" className={`flex items-center gap-[3px] ${className}`}>
      {Array.from({ length: BARS }, (_, k) => (
        <i
          key={k}
          data-k={k}
          className="as-bar block w-[3px] origin-center rounded-full bg-current"
          style={{ height: "100%", transform: `scaleY(${0.2 + ((k * 37) % 5) * 0.06})` }}
        />
      ))}
    </span>
  );

  return (
    <div ref={root}>
      {/* ---------------------------------------------------------- Launcher */}
      <div data-assistant className="fixed bottom-4 right-4 z-[45] flex flex-col items-end gap-3 md:bottom-6 md:right-6">
        {tip && !open && (past || live) && (
          <button
            type="button"
            onClick={openPanel}
            className="as-tip relative max-w-[17rem] rounded-[28px] bg-blanco px-5 py-3.5 text-left text-base font-semibold leading-snug text-marino shadow-[0_18px_40px_-16px_rgba(12,21,56,0.7)]"
          >
            ¿Qué se te antoja? Pídelo hablando con nosotros.
            <span aria-hidden="true" className="absolute -bottom-1.5 right-10 h-3.5 w-3.5 rotate-45 rounded-[3px] bg-blanco" />
          </button>
        )}

        {!open && (past || live) && (
          <button
            ref={launcher}
            type="button"
            onClick={openPanel}
            aria-label={live ? "Abrir la llamada con el asistente" : "Hablar con el asistente de Los Primos"}
            className="group relative inline-flex h-16 items-center gap-3 rounded-full bg-amarillo py-2 pl-2.5 pr-6 text-marino shadow-[0_18px_36px_-14px_rgba(12,21,56,0.7),inset_0_-3px_0_rgba(0,0,0,0.12)] transition-[transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95"
          >
            <span className="relative grid h-12 w-12 place-items-center rounded-full bg-marino">
              <img src="/img/mascota.png" width={300} height={300} alt="" className="as-l-mascot h-10 w-10 object-contain" />
            </span>
            {live ? (
              <span className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider">
                En llamada
                {bars("h-5")}
              </span>
            ) : (
              <span className="text-left leading-tight">
                <span className="block text-sm font-bold uppercase tracking-wider">Pedir hablando</span>
                <span className="block text-xs font-semibold opacity-80">Responde en segundos</span>
              </span>
            )}
          </button>
        )}
      </div>

      {/* -------------------------------------------------------------- Panel */}
      {open && (
        <section
          ref={panel}
          role="dialog"
          aria-label="Asistente de voz de Los Primos"
          data-assistant
          className="fixed inset-x-0 bottom-0 z-[47] flex max-h-[min(720px,92dvh)] flex-col overflow-hidden rounded-t-[32px] bg-marino text-blanco shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/12 md:inset-x-auto md:bottom-6 md:right-6 md:w-[420px] md:rounded-[32px]"
          style={{ visibility: "hidden" }}
        >
          {/* Header */}
          <header className="as-in flex items-center gap-3 px-4 pb-2 pt-4 md:px-5">
            <img src="/img/logo.png" width={512} height={512} alt="" className="h-12 w-12 shrink-0 object-contain" />
            <div className="min-w-0 flex-1">
              <p className="display text-xl leading-none">Los Primos</p>
              <p className="mt-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blanco/75" aria-live="polite">
                {label}
              </p>
            </div>
            <button
              type="button"
              data-first
              onClick={closePanel}
              aria-label="Cerrar asistente"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10 text-blanco transition-colors hover:bg-white/20"
            >
              <X size={22} weight="bold" />
            </button>
          </header>

          {/* Stage: the mascot is the face, the waveform is its voice */}
          <div className="as-in relative mx-4 overflow-hidden rounded-[32px] bg-abismo md:mx-5">
            <img src="/ilu/almeja.webp" alt="" aria-hidden="true" width={1000} height={829} className="pointer-events-none absolute -left-6 bottom-[-18%] w-44 opacity-[0.09]" />
            <img src="/ilu/barco.webp" alt="" aria-hidden="true" width={1000} height={838} className="pointer-events-none absolute -right-8 top-[-10%] w-48 opacity-[0.08]" />
            <div className={`relative flex flex-col items-center ${live ? "py-3" : "py-6"}`}>
              <img
                ref={mascot}
                src="/img/mascota.png"
                width={300}
                height={300}
                alt=""
                className={`relative object-contain drop-shadow-[0_14px_16px_rgba(0,0,0,0.4)] ${live ? "h-20 w-20" : "h-32 w-32"}`}
              />
              <div className={`mt-2 flex h-9 items-center justify-center text-amarillo ${live && !textOnly ? "opacity-100" : "opacity-30"}`}>
                {bars("h-9")}
              </div>
            </div>
          </div>

          {/* Body */}
          {idleLike || status === "connecting" ? (
            <div className="flex-1 overflow-y-auto px-4 pb-5 pt-4 md:px-5">
              <h2 className="as-in display text-[clamp(2rem,9vw,2.6rem)] leading-[1.02]">
                {status === "ended" ? "Gracias por llamar" : "¿Qué se te antoja?"}
              </h2>
              <p className="as-in mt-2 text-base leading-snug text-blanco/85">
                {status === "ended"
                  ? "Cuando quieras, vuelve a llamar. También puedes terminar tu pedido por WhatsApp."
                  : "Habla con nosotros: te ayudamos a elegir y a armar tu pedido, con el menú y las sucursales reales."}
              </p>

              {err && (
                <p role="alert" className="as-in mt-3 rounded-[28px] bg-coral px-4 py-3 text-sm font-semibold leading-snug text-marino">
                  {err}
                </p>
              )}

              <div className="as-in mt-4 grid gap-2.5">
                <button
                  type="button"
                  onClick={() => start(false)}
                  disabled={status === "connecting"}
                  className="btn btn-amarillo w-full !text-base disabled:opacity-70"
                >
                  <PhoneCall size={22} weight="bold" aria-hidden="true" />
                  {status === "connecting" ? "Conectando…" : status === "ended" ? "Llamar de nuevo" : "Iniciar llamada"}
                </button>
                <button
                  type="button"
                  onClick={() => start(true)}
                  disabled={status === "connecting"}
                  className="btn btn-ghost w-full !text-base disabled:opacity-60"
                >
                  <ChatCircleDots size={22} weight="bold" aria-hidden="true" />
                  Prefiero escribir
                </button>
                <a
                  href={WHATSAPP}
                  target="_blank"
                  rel="noopener"
                  className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-full text-sm font-bold uppercase tracking-wider text-blanco/85 transition-colors hover:text-amarillo"
                >
                  <WhatsappLogo size={20} weight="bold" aria-hidden="true" />
                  O pide por WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <>
              <div
                ref={log}
                role="log"
                aria-live="polite"
                aria-label="Conversación"
                data-lenis-prevent
                className="min-h-[140px] flex-1 space-y-2.5 overflow-y-auto px-4 pb-2 pt-4 md:px-5"
              >
                {msgs.length === 0 && (
                  <p className="text-center text-sm font-semibold text-blanco/70">
                    {textOnly ? "Escribe lo que se te antoja." : "Ya puedes hablar. Cuéntanos qué se te antoja."}
                  </p>
                )}
                {msgs.map((m) => (
                  <p
                    key={m.id}
                    className={`max-w-[86%] rounded-[26px] px-4 py-2.5 text-[0.95rem] font-medium leading-snug ${
                      m.role === "user" ? "ml-auto bg-amarillo text-marino" : "mr-auto bg-white/10 text-blanco"
                    }`}
                  >
                    {m.text}
                  </p>
                ))}
              </div>

              <div className="space-y-2.5 px-4 pb-4 pt-2 md:px-5 md:pb-5">
                <form onSubmit={send} className="flex items-center gap-2">
                  <label htmlFor="as-draft" className="sr-only">
                    Escribe tu mensaje
                  </label>
                  <input
                    id="as-draft"
                    ref={input}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Escribe aquí si prefieres"
                    autoComplete="off"
                    className="h-12 min-w-0 flex-1 rounded-full bg-white/10 px-5 text-base text-blanco placeholder:text-blanco/60 focus:bg-white/15 focus:outline-none focus-visible:outline-amarillo"
                  />
                  <button
                    type="submit"
                    aria-label="Enviar mensaje"
                    disabled={!draft.trim()}
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-amarillo text-marino transition-opacity disabled:opacity-40"
                  >
                    <PaperPlaneRight size={20} weight="bold" />
                  </button>
                </form>
                <div className="flex gap-2.5">
                  {!textOnly && (
                    <button
                      type="button"
                      onClick={toggleMic}
                      aria-pressed={muted}
                      className="btn btn-ghost flex-1 !min-h-12 !px-4 !text-sm"
                    >
                      {muted ? <MicrophoneSlash size={20} weight="bold" aria-hidden="true" /> : <Microphone size={20} weight="bold" aria-hidden="true" />}
                      {muted ? "Activar" : "Silenciar"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={hangUp}
                    className="btn flex-1 !min-h-12 !px-4 !text-sm bg-coral text-marino hover:brightness-95"
                  >
                    <PhoneDisconnect size={20} weight="bold" aria-hidden="true" />
                    {textOnly ? "Terminar" : "Colgar"}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
