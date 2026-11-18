// Generates docs/agente-conocimiento-los-primos.md from src/data.js (single source of truth),
// to upload to the ElevenLabs agent's knowledge base so it never invents branches, dishes or prices.
import fs from "node:fs";
import { COMBOS, COMBO_PRICE, MENU, SUCURSALES, WHATSAPP_LABEL, HISTORIA } from "../src/data.js";

const L = [];
L.push("# Los Primos Restaurante: información oficial para el asistente de voz");
L.push("");
L.push("Fuente única de verdad. Si algo no está en este documento, el asistente debe decir que no lo maneja y ofrecer WhatsApp.");
L.push("");
L.push("## Reglas para el asistente");
L.push("- Habla en español de México, con tono cálido y regio, frases cortas.");
L.push("- Nunca inventes sucursales, platillos, bebidas, promociones ni precios. Solo existen las seis sucursales y los platillos de abajo.");
L.push("- No ofrezcas jugos, naranjada, refrescos distintos de los listados ni queso fundido con camarones: no están en el menú.");
L.push("- Los precios son en pesos mexicanos. Al dar un subtotal o total, suma exactamente los precios de la lista, uno por uno, y repítelos al cliente.");
L.push(`- Para pedir, reservar o resolver dudas que no estén aquí, ofrece WhatsApp: ${WHATSAPP_LABEL}.`);
L.push("- Plaza Andenes está en San Nicolás de los Garza, no en Monterrey. No existe ninguna sucursal llamada Plaza Fiesta Anáhuac.");
L.push("");
L.push("## Quiénes somos");
L.push("Restaurante de mariscos con el sabor regiomontano original, fundado en 1995 por Martha Flores y Juan Elizondo. Eslogan: «El lugar para comer delicioso».");
HISTORIA.forEach((h) => L.push(`- ${h.year}: ${h.text}`));
L.push("");
L.push("## Sucursales (solo estas seis)");
SUCURSALES.forEach((s) => {
  L.push(`### ${s.name}`);
  L.push(`- Dirección: ${s.addr}`);
  L.push(`- Teléfono: ${s.tel.join(" / ")}`);
  L.push(`- Horario: ${s.hours}`);
  L.push(`- Mapa: ${s.map}`);
});
L.push("");
L.push("Fechas especiales: cerrado el 25 de diciembre y el 1 de enero. El 24 y 31 de diciembre todas las sucursales cierran a las 18:00.");
L.push("");
L.push("## Menú y precios (MXN)");
MENU.forEach((c) => {
  L.push(`### ${c.label}`);
  c.items.forEach(([n, d, p]) => L.push(`- ${n}${d ? " (" + d + ")" : ""}: ${p}`));
  if (c.note) L.push(`- Nota: ${c.note}`);
});
L.push("");
L.push(`### Combos (cada uno ${COMBO_PRICE})`);
COMBOS.forEach((c) => L.push(`- ${c.name}: ${c.items}`));
L.push("");
fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync("docs/agente-conocimiento-los-primos.md", L.join("\n"), "utf8");
console.log("docs/agente-conocimiento-los-primos.md", L.length, "lineas");
