// Real data extracted from losprimosrestaurante.mx (menu, sucursales, nosotros). Prices MXN.

export const WHATSAPP = "https://wa.me/528123727515";
export const WHATSAPP_LABEL = "81 2372 7515";

export const SOCIAL = {
  instagram: "https://www.instagram.com/losprimosrestaurante/",
  facebook: "https://www.facebook.com/losprimosrestaurante.mx",
  tripadvisor:
    "https://www.tripadvisor.com.mx/Restaurant_Review-g1136270-d10630872-Reviews-Los_Primos_Restaurante-Apodaca_Northern_Mexico.html",
  facturacion: "https://www.wansoft.net/LosPrimos/FE.html",
  bolsa: "https://losprimosrestaurante.mx/bolsa-de-trabajo/",
  privacidad: "https://losprimosrestaurante.mx/aviso-de-privacidad/",
};

// Sabores: the color-block story (one per signature dish)
export const SABORES = [
  // La barra: dishes pass one by one on the counter, each with its glass sign (reel reference). Real menu data.
  { id: "aguachile", name: "Aguachile Negro", line: "Frío, picoso y sin rodeos.", body: "Camarón curtido en salsa negra con pepino, zanahoria y cebolla morada.", img: "/food/aguachile-negro.webp", w: 1600, h: 1011, color: "#26a0dc", ink: "#1b2766", bullets: ["Camarón curtido en salsa negra", "Pepino y zanahoria", "Cebolla morada"], tag: "Barra fría", price: "$299", specs: [["Precio", "$299"], ["Picor", "Alto"], ["Servido", "Frío"]] },
  { id: "bbq", name: "Camarones BBQ", line: "Dulce, ahumado y regio.", body: "Camarones envueltos en tocino, bañados en salsa barbecue, con arroz y verdura.", img: "/food/camarones-bbq.webp", w: 1336, h: 752, color: "#0a0801", ink: "#fbfdff", video: "/video/bbq.mp4", poster: "/video/bbq-poster.jpg", vw: 1280, vh: 720, bullets: ["Camarones envueltos en tocino", "Salsa barbecue de la casa", "Arroz y verdura fresca"], tag: "Especialidad", price: "$339", specs: [["Precio", "$339"], ["Proteína", "Camarón"], ["Salsa", "Barbecue"]] },
  { id: "molcajete", name: "Molcajete Mixto", line: "Crujiente y para compartir.", body: "Chicharrón de pescado y de pulpo servido en molcajete con guacamole picosito.", img: "/food/molcajete-mixto.webp", w: 1519, h: 1073, color: "#0a0801", ink: "#fbfdff", video: "/video/molcajete.mp4", poster: "/video/molcajete-poster.jpg", vw: 1280, vh: 720, bullets: ["Chicharrón de pescado", "Chicharrón de pulpo", "Guacamole picosito"], tag: "Para compartir", price: "$489", specs: [["Precio", "$489"], ["Para", "Compartir"], ["Con", "Guacamole"]] },
  { id: "sopa", name: "Sopa de Mariscos", line: "Caliente y bien servida.", body: "Filete, camarón, pulpo, ostión, almeja y jaiba en caldo de la casa.", img: "/food/sopa-mariscos.webp", w: 1600, h: 1448, color: "#0a0801", ink: "#fbfdff", video: "/video/sopa.mp4", poster: "/video/sopa-poster.jpg", vw: 1280, vh: 720, bullets: ["Filete, camarón y pulpo", "Ostión, almeja y jaiba", "Caldo de la casa"], tag: "Caldos", price: "$269", specs: [["Precio", "$269"], ["Mariscos", "Seis"], ["Servida", "Caliente"]] },
  { id: "mojarra", name: "Mojarra Frita", line: "Dorada por fuera, jugosa por dentro.", body: "Mojarra entera frita, al ajillo o a las brasas, con arroz, papas y ensalada.", img: "/food/mojarra-frita.webp", w: 1600, h: 1181, color: "#26a0dc", ink: "#1b2766", bullets: ["Mojarra entera", "Frita, al ajillo o a las brasas", "Arroz, papas y ensalada"], tag: "Pescados", price: "$349", specs: [["Precio", "$349"], ["Estilos", "Tres"], ["Pieza", "Entera"]] },
  { id: "estrella", name: "Combo Estrella", line: "Un poquito de todo.", body: "Tostada de ceviche de pescado, camaroncitos empanizados, camarón envuelto y taco de camarón chipotle.", img: "/food/combo-estrella.webp", w: 1600, h: 928, color: "#f6d840", ink: "#1b2766", bullets: ["Tostada de ceviche de pescado", "Camaroncitos y camarón envuelto", "Taco de camarón chipotle"], tag: "Combo", price: "$258", specs: [["Precio", "$258"], ["Incluye", "4 piezas"], ["Para", "Uno"]] },
];

export const MENU = [
  {
    id: "barra-fria",
    label: "Barra fría",
    img: "/food/aguachile-house.webp", w: 1600, h: 963,
    items: [
      ["Torre de Mariscos", "Camarón curtido, atún, pulpo y camarón cocido", "$359"],
      ["Aguachile House", "Camarón curtido en salsa verde de la casa", "$299"],
      ["Aguachile Negro", "Camarón en salsa negra", "$299"],
      ["Ceviche de Camarón", "", "$289"],
      ["Camarones para Pelar", "8 piezas", "$259"],
      ["Ostión en su Concha", "6 piezas", "$259"],
      ["Ceviche de Pescado", "", "$209"],
    ],
  },
  {
    id: "cocteles",
    label: "Cócteles",
    img: "/food/coctel-camaron.webp", w: 593, h: 952,
    items: [
      ["Cóctel de Camarón", "Sencillo $146 · Doble $204", "$289"],
      ["Cóctel de Pulpo", "Sencillo $169 · Doble $229", "$319"],
      ["Cóctel de Ostión", "Sencillo $146 · Doble $204", "$289"],
      ["Campechano", "Elige 2 o 3: camarón, pulpo, ostión", "$289"],
    ],
    note: "Precio de tamaño grande. Con salsa coctelera de la casa, aguacate, cebolla y cilantro.",
  },
  {
    id: "tacos",
    label: "Tacos y tostadas",
    img: "/food/tostada-ceviche.webp", w: 1600, h: 1015,
    items: [
      ["Taco Gobernador", "Machaca de camarón con queso", "$82"],
      ["Taco Camarón Baja", "Capeado, col morada, aderezo chipotle", "$82"],
      ["Chilaca Gobernador", "Rellena de machaca de camarón y queso", "$105"],
      ["Taco Pulpo al Ajillo", "Con chile cambray y queso", "$105"],
      ["Tostada Ceviche de Camarón", "Aguacate, chipotle, pico con pepino", "$123"],
      ["Tostada de Pulpo", "Aguacate y pico de gallo", "$146"],
      ["Tostada Mixta", "Elige 2 ingredientes", "$146"],
    ],
  },
  {
    id: "caldos",
    label: "Caldos",
    img: "/food/sopa-mariscos.webp", w: 1600, h: 1448,
    items: [
      ["Sopa de Mariscos", "Filete, camarón, pulpo, ostión, almeja, jaiba", "$269"],
      ["Camarón Macuil", "", "$239"],
      ["Caldo de Camarón", "Mediano $169", "$209"],
      ["Caldo Mixto", "Elige 2 mariscos", "$199"],
      ["Caldo de Filete", "Mediano $120", "$164"],
    ],
    note: "Envenena tu caldo por $59 o agrégale queso fundido por $49.",
  },
  {
    id: "camarones",
    label: "Camarones",
    img: "/food/camarones-ajillo.webp", w: 1600, h: 890,
    items: [
      ["Camarones Envueltos", "", "$335"],
      ["Camarones al Coco", "", "$326"],
      ["En Crema de Champiñones", "", "$309"],
      ["Al Ajillo", "", "$305"],
      ["A la Mantequilla", "", "$305"],
      ["Empanizados", "", "$305"],
      ["A la Diabla", "", "$289"],
      ["Rancheros o Veracruzana", "", "$289"],
    ],
  },
  {
    id: "especialidades",
    label: "Especialidades",
    img: "/food/filete-philadelphia.webp", w: 1600, h: 882,
    items: [
      ["Pulpo Zarandeado", "Sazón original, a las brasas", "$559"],
      ["Salmón en Salsa Los Cabos", "", "$369"],
      ["Salmón a las Brasas", "Aderezo de la casa", "$359"],
      ["Camarones Envueltos BBQ", "", "$339"],
      ["Brochetas de Camarón", "Champiñón, cebolla, pimiento, tocino", "$335"],
      ["Filete del Rey", "Camarones, champiñones y queso", "$303"],
      ["Filete Philadelphia", "Tocino, queso crema, crema de champiñones", "$303"],
      ["Filete del Primo Cremas", "Crema con ajo y queso gratinado", "$279"],
    ],
  },
  {
    id: "compartir",
    label: "Para compartir",
    img: "/food/preferida-del-tio.webp", w: 1600, h: 828,
    items: [
      ["Preferida del Tío", "Para 2 personas. Individual $338", "$638"],
      ["Tradicional", "Para 2 personas. Individual $294", "$544"],
      ["Molcajete de Chicharrón de Pulpo", "", "$539"],
      ["Molcajete Mixto", "", "$489"],
      ["Huachinango", "En temporada. Frito, ajillo o brasas", "$622"],
      ["Mojarra", "Frita, ajillo o brasas", "$349"],
      ["Rib Eye Asado", "Papa al horno, guacamole y cebolla asada", "$409"],
    ],
  },
  {
    id: "bebidas",
    label: "Bebidas",
    img: "/photo/bebidas.webp", w: 1800, h: 1200, photo: true,
    items: [
      ["Alma de Jamaica", "Mezcal 400 Conejos, jamaica, limón", "$179"],
      ["Fuego Dorado", "Mezcal 400 Conejos, mango, limón", "$179"],
      ["Margarita de Mango", "", "$159"],
      ["Piña Colada", "", "$159"],
      ["Tarro Michelado con Clamato", "Grande", "$68"],
      ["Agrégale camarón a tu cerveza", "60 g", "$52"],
      ["Aguas frescas", "Limonada, jamaica, pepino, piña chía, sandía", "$54"],
    ],
  },
];

export const COMBOS = [
  { name: "Estrella", items: "Tostada de ceviche de pescado, camaroncitos empanizados, camarón envuelto y taco de camarón chipotle", img: "/food/combo-estrella.webp", w: 1600, h: 928 },
  { name: "Clásico", items: "Tostada de ceviche de camarón, posta de mojarra y camarones envueltos", img: "/food/mojarra-frita.webp", w: 1600, h: 1181 },
  { name: "Estelar", items: "Tostada de ceviche de pescado, filete empanizado y taco gobernador", img: "/food/chilaca-gobernador.webp", w: 1600, h: 1184 },
  { name: "Súper", items: "Tostada de ceviche de pescado, camaroncitos empanizados y filete empanizado", img: "/food/camarones-empanizados.webp", w: 1345, h: 786 },
  { name: "Universitario", items: "Medio filete empanizado y medio caldo de filete", img: "/food/caldo-mariscos.webp", w: 1121, h: 768 },
];
export const COMBO_PRICE = "$258";

export const SUCURSALES = [
  { name: "Apodaca Centro", addr: "Escobedo 604-D, entre Aldama y Blvd. Carlos Salinas, Apodaca", tel: ["81 8386 2816", "81 8386 9245"], hours: "Lun a Dom, 11:00 a 20:00", map: "https://goo.gl/maps/m3giPono4bdvmjNS6", origin: true },
  { name: "Plaza Andenes", addr: "Av. Universidad 1250, San Nicolás de los Garza", tel: ["81 1415 4702"], hours: "Lun a Dom, 11:00 a 22:00", map: "https://goo.gl/maps/hXFjWuyBmFB4DySDA" },
  { name: "Las Hadas", addr: "Gral. Escobedo 340, Col. Las Hadas, Escobedo", tel: ["81 1405 0729"], hours: "Lun a Dom, 11:00 a 20:00", map: "https://maps.app.goo.gl/d82FmLTzi5V2WrF8A" },
  { name: "Moderna", addr: "Pablo A. de la Garza 3000, Col. Moderna, Monterrey", tel: ["81 8351 0808", "81 8351 9999"], hours: "Lun a Dom, 11:00 a 20:00", map: "https://goo.gl/maps/Frfi5A1iQMyQyFQh9" },
  { name: "Plaza Aviana", addr: "Av. Benito Juárez 1410-L4, Plaza Aviana, Escobedo", tel: ["81 1358 9513"], hours: "Lun a Sáb, 11:00 a 22:00. Dom, 11:00 a 20:00", map: "https://goo.gl/maps/fGw5NaA6EGEsEWe17" },
  { name: "Rinconada Colonial", addr: "Carretera Santa Rosa a Apodaca 888, Apodaca", tel: ["81 2593 0677"], hours: "Lun a Dom, 11:00 a 22:00", map: "https://maps.app.goo.gl/ZyvD9iappUchBfpx8" },
];

export const HISTORIA = [
  { year: "1995", text: "Martha Flores y Juan Elizondo abren Coctelería Los Primos en Monterrey: un comedor sencillo con unos diez platillos. Filete empanizado, mojarritas y caldo de pescado." },
  { year: "2018", text: "Después de años creciendo con sus clientes, el comedor se convierte en Los Primos Restaurante." },
  { year: "Hoy", text: "Seis sucursales en el área metropolitana y la misma sazón regia de la primera cocina." },
];

export const VALORES = ["Amor", "Humildad", "Congruencia", "Pasión", "Lealtad", "Persistencia", "Constancia"];

// Hero flavor switcher (clean local cutouts in /public/cut). CHISPA-style: each one recolors the hero.
export const HERO_PLATOS = [
  // video: cinematic intro (plays once per activation, then dissolves into the HD cut-out, which keeps floating).
  // bg/ink = hero ambience matched to the video's own background so its feathered edges disappear.
  // dark = [start, end] seconds where the video goes to black (fire scene): the hero dims in sync.
  { id: "pulpo", name: "Pulpo Zarandeado", price: "$559", line: "El platillo de la casa, a las brasas.", img: "/food/pulpo-zarandeado.webp", w: 1600, h: 1409, bg: "#48a4d5", ink: "#1b2766", video: "/video/hero-pulpo.mp4", poster: "/video/hero-pulpo-poster.jpg", vw: 1600, vh: 900, dark: [4.77, 6.49], darkBg: "#050608" },
  { id: "aguachile", name: "Aguachile House", price: "$299", line: "Camarón curtido, pepino y cebolla morada.", img: "/food/aguachile-house.webp", w: 1600, h: 963, bg: "#030606", ink: "#fbfdff", video: "/video/hero-aguachile.mp4", poster: "/video/hero-aguachile-poster.jpg", vw: 1280, vh: 682 },
  { id: "tio", name: "Preferida del Tío", price: "$638", line: "Para dos: envueltos, empanizados, filete y aros.", img: "/food/preferida-del-tio.webp", w: 1600, h: 828, bg: "#1f1406", ink: "#fbfdff", video: "/video/hero-tio.mp4", poster: "/video/hero-tio-poster.jpg", vw: 1280, vh: 682 },
];

// VITRINA: every dish with HD cut-out photo. `video` = "/video/<id>.mp4" once the client sends the clips.
export const PLATILLOS = [
  { id: "pulpo-zarandeado", name: "Pulpo Zarandeado", cat: "Especialidades", price: "$559", desc: "Pulpo entero a las brasas con nuestro sazón original.", img: "/food/pulpo-zarandeado.webp", w: 1600, h: 1409, video: null },
  { id: "aguachile-house", name: "Aguachile House", cat: "Barra fría", price: "$299", desc: "Camarón curtido en salsa verde de la casa, pepino y cebolla.", img: "/food/aguachile-house.webp", w: 1600, h: 963, video: null },
  { id: "aguachile-negro", name: "Aguachile Negro", cat: "Barra fría", price: "$299", desc: "Camarón curtido en salsa negra, picoso y fresco.", img: "/food/aguachile-negro.webp", w: 1600, h: 1011, video: null },
  { id: "coctel-camaron", name: "Cóctel de Camarón", cat: "Cócteles", price: "Desde $146", desc: "Salsa coctelera de la casa, aguacate, cebolla y cilantro.", img: "/food/coctel-camaron.webp", w: 593, h: 952, video: null },
  { id: "tostada-ceviche", name: "Tostada de Ceviche", cat: "Tostadas", price: "$123", desc: "Ceviche de camarón, aguacate, chipotle y pico con pepino.", img: "/food/tostada-ceviche.webp", w: 1600, h: 1015, video: null },
  { id: "chilaca-gobernador", name: "Chilaca Gobernador", cat: "Tacos", price: "$105", desc: "Chile chilaca relleno de machaca de camarón y queso gratinado.", img: "/food/chilaca-gobernador.webp", w: 1600, h: 1184, video: null },
  { id: "taco-baja", name: "Taco Camarón Baja", cat: "Tacos", price: "$82", desc: "Camarón capeado, col morada, queso y aderezo chipotle.", img: "/food/taco-baja.webp", w: 1090, h: 934, video: null },
  { id: "sopa-mariscos", name: "Sopa de Mariscos", cat: "Caldos", price: "$269", desc: "Filete, camarón, pulpo, ostión, almeja y jaiba.", img: "/food/sopa-mariscos.webp", w: 1600, h: 1448, video: "/video/sopa.mp4", poster: "/video/sopa-poster.jpg" },
  { id: "camarones-bbq", name: "Camarones Envueltos BBQ", cat: "Especialidades", price: "$339", desc: "Envueltos en tocino con salsa barbecue.", img: "/food/camarones-bbq.webp", w: 1336, h: 752, video: "/video/bbq.mp4", poster: "/video/bbq-poster.jpg" },
  { id: "camarones-envueltos", name: "Camarones Envueltos", cat: "Camarones", price: "$335", desc: "Camarones envueltos en tocino, con arroz y papas.", img: "/food/camarones-envueltos.webp", w: 1322, h: 791, video: null },
  { id: "camarones-empanizados", name: "Camarones Empanizados", cat: "Camarones", price: "$305", desc: "Dorados y crujientes, con arroz, papas y ensalada.", img: "/food/camarones-empanizados.webp", w: 1345, h: 786, video: null },
  { id: "camarones-gratinados", name: "Camarones Gratinados", cat: "Especialidades", price: "$309", desc: "Con champiñones, salsa chipotle y queso gratinado.", img: "/food/camarones-gratinados.webp", w: 1477, h: 817, video: null },
  { id: "camarones-ajillo", name: "Camarones al Ajillo", cat: "Camarones", price: "$305", desc: "Al ajo con chile, arroz, papas y aguacate.", img: "/food/camarones-ajillo.webp", w: 1600, h: 890, video: null },
  { id: "filete-philadelphia", name: "Filete Philadelphia", cat: "Especialidades", price: "$303", desc: "Tocino, queso crema y crema de champiñones.", img: "/food/filete-philadelphia.webp", w: 1600, h: 882, video: null },
  { id: "filete-diabla", name: "Filete a la Diabla", cat: "Filetes", price: "$229", desc: "Filete de pescado en salsa endiablada.", img: "/food/filete-diabla.webp", w: 1218, h: 745, video: null },
  { id: "filete-ajillo", name: "Filete al Ajillo", cat: "Filetes", price: "$229", desc: "Filete de pescado al ajo con cebolla.", img: "/food/filete-ajillo.webp", w: 1042, h: 596, video: null },
  { id: "preferida-del-tio", name: "Preferida del Tío", cat: "Para compartir", price: "$638", desc: "Envueltos, empanizados, filete, aros y taco gobernador. Para 2.", img: "/food/preferida-del-tio.webp", w: 1600, h: 828, video: null },
  { id: "tradicional", name: "Tradicional", cat: "Para compartir", price: "$544", desc: "Camarones empanizados, mojarra, filete y aros de cebolla. Para 2.", img: "/food/tradicional.webp", w: 1600, h: 1204, video: null },
  { id: "molcajete-mixto", name: "Molcajete Mixto", cat: "Para compartir", price: "$489", desc: "Chicharrón de pescado y pulpo con guacamole picosito.", img: "/food/molcajete-mixto.webp", w: 1519, h: 1073, video: "/video/molcajete.mp4", poster: "/video/molcajete-poster.jpg" },
  { id: "mojarra-frita", name: "Mojarra", cat: "Pescados", price: "$349", desc: "Frita, al ajillo o a las brasas.", img: "/food/mojarra-frita.webp", w: 1600, h: 1181, video: null },
  { id: "ostiones", name: "Ostión en su Concha", cat: "Barra fría", price: "$259", desc: "Seis piezas frescas con limón y salsa.", img: "/food/ostiones.webp", w: 1010, h: 597, video: null },
  { id: "ribeye", name: "Rib Eye Asado", cat: "Carnes", price: "$409", desc: "Con papa al horno, guacamole y cebolla asada.", img: "/food/ribeye.webp", w: 1524, h: 928, video: null },
  { id: "combo-estrella", name: "Combo Estrella", cat: "Combos", price: "$258", desc: "Tostada, camaroncitos, camarón envuelto y taco chipotle.", img: "/food/combo-estrella.webp", w: 1600, h: 928, video: null },
];

export const ILU = { crab: "/ilu/crab.webp", barco: "/ilu/barco.webp", almeja: "/ilu/almeja.webp" };
export const FOTOS = { mesa: "/photo/mesa-mojarra.webp", aros: "/photo/aros.webp", pulpoMesa: "/photo/pulpo-mesa.webp", bebidas: "/photo/bebidas.webp", mariscada: "/photo/mariscada-mesa.webp" };
