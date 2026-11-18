import { useEffect } from "react";
import { initSmoothScroll, ScrollTrigger } from "./lib/motion.js";
import Preloader from "./components/Preloader.jsx";
import Nav from "./sections/Nav.jsx";
import Hero from "./sections/Hero.jsx";
import Ticker from "./sections/Ticker.jsx";
import Sabores from "./sections/Sabores.jsx";
import Vitrina from "./sections/Vitrina.jsx";
import Historia from "./sections/Historia.jsx";
import Menu from "./sections/Menu.jsx";
import Combos from "./sections/Combos.jsx";
import Sucursales from "./sections/Sucursales.jsx";
import CtaFinal from "./sections/CtaFinal.jsx";
import Footer from "./sections/Footer.jsx";
import Asistente from "./components/Asistente.jsx";

export default function App() {
  useEffect(() => {
    initSmoothScroll();
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh);
    return () => window.removeEventListener("load", refresh);
  }, []);

  return (
    <div className="grain">
      <a href="#menu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 btn btn-amarillo">
        Saltar al menú
      </a>
      <Preloader />
      <Nav />
      <main>
        <Hero />
        <Ticker />
        <Sabores />
        <Vitrina />
        <Historia />
        <Menu />
        <Combos />
        <Sucursales />
        <CtaFinal />
      </main>
      <Footer />
      <Asistente />
    </div>
  );
}
