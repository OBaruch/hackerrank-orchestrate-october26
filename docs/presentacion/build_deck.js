// Genera "Ghost Data - Como funciona la solucion.pptx"
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const lu = require("react-icons/lu");

// apply_theme.js comes from the pptx skill; without it the deck keeps Office's stock theme colors.
const SKILL = process.env.PPTX_SKILL_DIR || "";
let applyTheme = async () => console.warn("PPTX_SKILL_DIR not set: theme colors not applied");
if (SKILL) ({ applyTheme } = require(path.join(SKILL, "scripts/apply_theme.js")));
const OUT = process.argv[2] || path.join(__dirname, "ghost_data_solucion.pptx");

const THEME = {
  name: "Ghost Data",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "16212C", lt1: "FFFFFF", dk2: "24425A", lt2: "EEF3F5",
    accent1: "0F8A80", accent2: "D9512C", accent3: "F0A92B", accent4: "5E7385",
    accent5: "8ED6CC", accent6: "6A4FC4", hlink: "0F8A80", folHlink: "5E7385",
  },
};
const HX = THEME.colors;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.author = "Baruch";
pres.title = "Ghost Data Still Exists: cómo funciona la solución";
pres.subject = "Guía de estudio del agente de auditoría de borrado";
const C = pres.SchemeColor;
const W = 13.333, M = 0.6, CW = W - 2 * M;
const CODE = "Courier New";

// ------------------------------------------------------------------ icons
const ICON_NAMES = [
  "LuGhost", "LuDatabase", "LuFileText", "LuImage", "LuScrollText", "LuSearch", "LuFingerprint", "LuClock",
  "LuShieldCheck", "LuSparkles", "LuScale", "LuListChecks", "LuArchive", "LuRefreshCw", "LuTrash2", "LuEyeOff",
  "LuUserX", "LuLock", "LuPowerOff", "LuTerminal", "LuCircleCheck", "LuTriangleAlert", "LuCoins", "LuGitCompare",
  "LuLink", "LuLayers", "LuBug", "LuFlaskConical", "LuRotateCw", "LuInbox", "LuFileSearch", "LuScanSearch",
  "LuFileSpreadsheet", "LuPaperclip", "LuDownload", "LuChartBar", "LuIdCard", "LuMessageSquareText", "LuScanEye",
  "LuShuffle", "LuBraces", "LuTable", "LuCircleHelp", "LuLightbulb", "LuTarget", "LuCheck", "LuWorkflow",
  "LuKeyRound", "LuPlay", "LuHistory", "LuPackage", "LuSigma", "LuMic", "LuCpu", "LuGauge", "LuFlag", "LuBlend",
  "LuHash", "LuServer", "LuMonitor",
];
const ICON_COLORS = ["FFFFFF", HX.dk1, HX.accent1, HX.accent5, HX.accent3];
const ICONS = {};
async function renderIcons() {
  for (const name of ICON_NAMES) {
    const Comp = lu[name];
    if (!Comp) throw new Error("icono inexistente " + name);
    for (const col of ICON_COLORS) {
      const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { size: 256, color: "#" + col, strokeWidth: 2 }));
      const buf = await sharp(Buffer.from(svg)).png().toBuffer();
      ICONS[name + "_" + col] = "image/png;base64," + buf.toString("base64");
    }
  }
}

// ------------------------------------------------------------------ layouts
function defineLayouts() {
  pres.defineSlideMaster({
    title: "PORTADA",
    background: { color: C.text1 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.0, w: 8.4, h: 1.5, fontSize: 54, bold: true, color: C.background1, valign: "bottom", align: "left", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 3.7, w: 8.4, h: 1.2, fontSize: 24, color: C.accent5, valign: "top", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "kicker", type: "body", x: 0.8, y: 5.6, w: 8.4, h: 0.9, fontSize: 14, color: C.background2, valign: "top", margin: 0 }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "SECCION",
    background: { color: C.text1 },
    objects: [
      { placeholder: { options: { name: "num", type: "body", x: 0.8, y: 1.9, w: 3.0, h: 1.1, fontSize: 60, bold: true, color: C.accent5, valign: "bottom", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 3.1, w: 8.2, h: 1.0, fontSize: 40, bold: true, color: C.background1, valign: "top", align: "left", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 4.25, w: 8.0, h: 1.4, fontSize: 18, color: C.background2, valign: "top", margin: 0 }, text: "" } },
    ],
    slideNumber: { x: 12.1, y: 6.95, w: 0.6, h: 0.3, fontSize: 10, color: C.accent5, align: "right" },
  });
  pres.defineSlideMaster({
    title: "CONTENIDO",
    background: { color: C.background1 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: M, y: 0.32, w: CW, h: 0.85, fontSize: 32, bold: true, color: C.text1, valign: "middle", align: "left", margin: 0 }, text: "" } },
      { text: { text: "Ghost Data Still Exists  ·  Cómo funciona la solución", options: { x: M, y: 7.0, w: 8, h: 0.3, fontSize: 10, color: C.accent4, margin: 0 } } },
    ],
    slideNumber: { x: 12.1, y: 7.0, w: 0.63, h: 0.3, fontSize: 10, color: C.accent4, align: "right" },
  });
}

// ------------------------------------------------------------------ helpers
let section = "";
function newSection(title) { section = title; pres.addSection({ title }); }
function content(title, notes) {
  const s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: section });
  s.addText(title, { placeholder: "title" });
  if (notes) s.addNotes(notes);
  return s;
}
function txt(s, text, x, y, w, h, o = {}) {
  s.addText(text, Object.assign({ x, y, w, h, isTextBox: true, margin: 0, fontSize: 14, color: C.text1, valign: "top" }, o));
}
function box(s, x, y, w, h, fill, o = {}) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, Object.assign({ x, y, w, h, fill: { color: fill }, line: { color: o.line || fill, width: o.lineW || 0.75 }, rectRadius: o.r || 0.1 }, o.extra || {}));
}
function iconCircle(s, name, x, y, d, fill, iconColor = "FFFFFF") {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill } });
  s.addImage({ data: ICONS[name + "_" + iconColor], x: x + d * 0.22, y: y + d * 0.22, w: d * 0.56, h: d * 0.56 });
}
function icon(s, name, x, y, d, color) {
  s.addImage({ data: ICONS[name + "_" + color], x, y, w: d, h: d });
}
function numCircle(s, n, x, y, d, fill, color = C.background1, fs = 16) {
  s.addText(String(n), { shape: pres.shapes.OVAL, x, y, w: d, h: d, fill: { color: fill }, line: { color: fill }, color, bold: true, fontSize: fs, align: "center", valign: "middle", margin: 0 });
}
function arrow(s, x1, y1, x2, y2, color = C.accent4, width = 2) {
  s.addShape(pres.shapes.LINE, {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
    flipH: x2 < x1, flipV: y2 < y1, line: { color, width, endArrowType: "triangle" },
  });
}
function line(s, x1, y1, x2, y2, color = C.accent4, width = 2) {
  s.addShape(pres.shapes.LINE, { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), flipH: x2 < x1, flipV: y2 < y1, line: { color, width } });
}
// code panel: "#" starts a comment, coloured differently
function code(s, lines, x, y, w, h, fs = 13) {
  box(s, x, y, w, h, C.text1, { r: 0.08 });
  const runs = [];
  lines.forEach((ln, i) => {
    const last = i === lines.length - 1;
    const k = ln.indexOf("#");
    if (k >= 0) {
      if (k > 0) runs.push({ text: ln.slice(0, k), options: { color: C.background2 } });
      runs.push({ text: ln.slice(k), options: { color: C.accent5, breakLine: !last } });
    } else {
      runs.push({ text: ln.length ? ln : " ", options: { color: C.background2, breakLine: !last } });
    }
  });
  s.addText(runs, { x: x + 0.2, y: y + 0.15, w: w - 0.4, h: h - 0.3, fontFace: CODE, fontSize: fs, valign: "top", margin: 0, isTextBox: true });
}
function bullets(items, o = {}) {
  return items.map((t, i) => {
    const runs = Array.isArray(t) ? t : [{ text: t }];
    return runs.map((r, j) => ({
      text: r.text,
      options: Object.assign({}, r.options || {}, j === 0 ? { bullet: o.bullet === false ? false : { indent: 14 }, paraSpaceAfter: o.space || 6 } : {}, j === runs.length - 1 && i < items.length - 1 ? { breakLine: true } : {}),
    }));
  }).flat();
}
function sectionSlide(num, title, body, iconName, notes) {
  newSection(`${num} · ${title}`);
  const s = pres.addSlide({ masterName: "SECCION", sectionTitle: section });
  s.addText(num, { placeholder: "num" });
  s.addText(title, { placeholder: "title" });
  s.addText(body, { placeholder: "body" });
  s.addImage({ data: ICONS[iconName + "_" + HX.accent5], x: 9.6, y: 2.1, w: 2.9, h: 2.9, transparency: 30 });
  if (notes) s.addNotes(notes);
  return s;
}
function stat(s, x, y, w, h, big, label, color, fill = C.background2) {
  box(s, x, y, w, h, fill);
  txt(s, big, x + 0.25, y + 0.3, w - 0.5, 1.0, { fontSize: 40, bold: true, color, fontFace: THEME.headFontFace, valign: "middle" });
  txt(s, label, x + 0.25, y + 1.4, w - 0.5, h - 1.55, { fontSize: 16, color: C.text2 });
}
function table(s, rows, x, y, colW, o = {}) {
  const fs = o.fontSize || 12;
  const head = rows[0].map((t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.text2 }, fontSize: fs } }));
  const body = rows.slice(1).map((r, i) => r.map((t) => {
    const cell = typeof t === "object" ? t : { text: t };
    return { text: cell.text, options: Object.assign({ color: C.text1, fill: { color: i % 2 ? C.background1 : C.background2 }, fontSize: fs }, cell.options || {}) };
  }));
  s.addTable([head].concat(body), {
    x, y, w: colW.reduce((a, b) => a + b, 0), colW, fontSize: fs, valign: "middle", margin: [3, 6, 3, 6],
    border: { type: "solid", pt: 0.5, color: "D3DCE1" }, rowH: o.rowH || 0.36, autoPage: false,
  });
}
const chartBase = () => ({
  catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", dataLabelFontFace: "+mn-lt",
  titleFontFace: "+mn-lt", legendFontFace: "+mn-lt",
  catAxisLabelColor: HX.dk1, valAxisLabelColor: HX.accent4, dataLabelColor: HX.dk1,
  catAxisLabelFontSize: 12, valAxisLabelFontSize: 11, dataLabelFontSize: 12, titleFontSize: 14, titleColor: HX.dk1,
  valGridLine: { color: "DCE3E7", size: 0.5 }, catGridLine: { style: "none" },
  catAxisLineShow: false, valAxisLineShow: false,
});

// ================================================================== slides
function build() {
  // ---------------------------------------------------------------- portada
  newSection("Inicio");
  let s = pres.addSlide({ masterName: "PORTADA", sectionTitle: section });
  s.addText("Ghost Data Still Exists", { placeholder: "title" });
  s.addText("Cómo funciona el agente de auditoría de borrado, de punta a punta", { placeholder: "body" });
  s.addText("HackerRank Orchestrate · Octubre 2026\nGuía de estudio para la entrevista con el AI Judge", { placeholder: "kicker" });
  s.addShape(pres.shapes.OVAL, { x: 9.55, y: 1.75, w: 3.2, h: 3.2, fill: { color: C.text2 }, line: { color: C.text2 } });
  s.addImage({ data: ICONS["LuGhost_" + HX.accent5], x: 10.25, y: 2.45, w: 1.8, h: 1.8 });
  s.addNotes([
    "PARA QUÉ SIRVE ESTA PRESENTACIÓN",
    "Es una guía de estudio: cada diapositiva tiene una sola idea, y estas notas explican qué decir y los detalles técnicos que el AI Judge puede preguntar.",
    "",
    "CÓMO ESTÁ ORGANIZADA (8 secciones)",
    "1. El problema y el contrato de entrada y salida.",
    "2. Los datos que entrega el reto.",
    "3. La arquitectura, el flujo de datos, la ventana temporal y el flujo del operador.",
    "4. El código módulo por módulo, con pseudocódigo y un caso real de punta a punta (case_12).",
    "5. Dónde se usa Claude y dónde no.",
    "6. La evaluación: métricas, casos propios, fallos encontrados y mejoras.",
    "7. La comparación Haiku 5.5 contra Opus 5.5.",
    "8. Preparación para la entrevista: decisiones de diseño, límites y preguntas probables.",
    "",
    "DÓNDE ESTÁ TODO",
    "Repositorio OBaruch/hackerrank-orchestrate-october26, rama main. Código en code/ghost_audit/, punto de entrada code/main.py, evaluación en code/evaluation/, pruebas en code/tests/.",
  ].join("\n"));

  // ---------------------------------------------------------------- idea en una frase
  s = content("La solución en una frase", [
    "QUÉ DECIR (pitch de 30 segundos)",
    "«Construí un agente que no confía en lo que dicen los sistemas. Para cada solicitud de borrado reconstruye qué copias de los datos de la persona existían realmente a la hora de la auditoría, usando solo evidencia observada: filas de bases de datos, búsquedas en logs, capturas de pantalla y PDFs. Después aplica la política de borrado y genera un plan ordenado de hallazgos, remediación y verificación. El núcleo es determinista; Claude solo lee la intención del texto y transcribe capturas.»",
    "",
    "LOS NÚMEROS",
    "• 32 de 32 estados correctos en las muestras públicas (COMPLETE, INCOMPLETE o NOT_APPLICABLE).",
    "• F1 de pasos 98,7 %: se encontraron 189 de los 193 pasos esperados y solo sobra 1.",
    "• Costo de Claude para las 518 solicitudes: 0,0507 USD con claude-haiku-5-5 (409 llamadas).",
    "• Al repetir todo con claude-opus-5-5 el output.csv salió idéntico en las 518 filas, a 2,01 USD (40 veces más).",
    "",
    "LA IDEA CLAVE",
    "El modelo nunca escribe un paso del plan. Eso hace que la salida sea reproducible, auditable y barata, y que cada paso se pueda justificar con un archivo de evidencia concreto.",
  ].join("\n"));
  iconCircle(s, "LuGhost", M, 1.55, 0.85, C.text2);
  txt(s, [
    { text: "Un núcleo determinista reconstruye el estado real de cada copia del dato a la hora ", options: {} },
    { text: "audit_at", options: { fontFace: CODE, bold: true } },
    { text: ". Claude solo interviene donde hace falta percibir: leer la intención del texto y transcribir capturas de pantalla.", options: {} },
  ], 1.7, 1.45, 11.0, 1.2, { fontSize: 22, color: C.text2, valign: "middle", italic: true });
  const sw = (CW - 3 * 0.25) / 4;
  [["32 / 32", "estados correctos en las 32 muestras públicas", C.accent1],
   ["98,7 %", "F1 de pasos: 189 de 193 pasos esperados encontrados", C.accent1],
   ["$0,05", "costo de Claude para las 518 solicitudes (Haiku 5.5)", C.accent3],
   ["518 / 518", "filas idénticas al repetir todo con Opus 5.5", C.text2]].forEach((d, i) => {
    stat(s, M + i * (sw + 0.25), 3.0, sw, 2.4, d[0], d[1], d[2]);
  });
  iconCircle(s, "LuShieldCheck", M, 5.85, 0.65, C.accent1);
  txt(s, "Todo el plan de pasos sale de reglas explícitas y verificables. El modelo nunca escribe un paso ni elige una evidencia.", 1.45, 5.85, 11.3, 0.65, { fontSize: 17, color: C.text2, valign: "middle" });

  // ---------------------------------------------------------------- agenda
  s = content("Recorrido", [
    "Este es el orden recomendado para estudiar. Si en la entrevista te piden explicar la solución en 5 minutos, usa las secciones 1, 3 y 6: el problema, la arquitectura y los resultados.",
    "",
    "Para preguntas técnicas profundas, la sección 4 tiene el pseudocódigo de cada pieza y la sección 5 explica exactamente qué hace Claude.",
    "",
    "La sección 8 resume las decisiones de diseño y sus compromisos, que es lo que un juez suele querer escuchar: por qué elegiste esto y no otra cosa.",
  ].join("\n"));
  const ag = [
    ["El problema y el contrato", "Qué pide el reto y qué debe devolver el agente"],
    ["Los datos de entrada", "Archivos, evidencias, reglas y actividad global"],
    ["Arquitectura y flujo de datos", "Etapas, objetos que viajan y la ventana temporal"],
    ["El código módulo por módulo", "Pseudocódigo de cada pieza y un caso completo"],
    ["Dónde y cómo se usa Claude", "Intención, visión, caché y respaldo sin modelo"],
    ["Evaluación y resultados", "Métricas, casos propios y fallos corregidos"],
    ["Haiku 5.5 vs Opus 5.5", "La misma salida a 1/40 del costo"],
    ["Preparación para la entrevista", "Decisiones, límites y preguntas probables"],
  ];
  ag.forEach((a, i) => {
    const col = i < 4 ? 0 : 1, row = i % 4;
    const x = M + col * 6.25, y = 1.55 + row * 1.3;
    numCircle(s, String(i + 1).padStart(2, "0"), x, y, 0.75, i === 4 ? C.accent3 : C.text2, i === 4 ? C.text1 : C.background1, 18);
    txt(s, a[0], x + 1.0, y - 0.02, 4.9, 0.45, { fontSize: 19, bold: true, color: C.text1 });
    txt(s, a[1], x + 1.0, y + 0.42, 4.9, 0.4, { fontSize: 14, color: C.accent4 });
  });

  // ================================================================ 01
  sectionSlide("01", "El problema y el contrato", "Por qué un borrado marcado como «Complete» no prueba nada, y qué forma exacta debe tener la respuesta del agente.", "LuTarget",
    "Sección 1. Aquí se explica el reto de negocio y el contrato de entrada y salida. Es la base para entender por qué la solución desconfía de los estados reportados.");

  s = content("Un borrado «Complete» que no lo era", [
    "QUÉ DECIR",
    "El reto parte de una historia: Northstar Shop, una tienda ficticia, perdió 2,4 millones de dólares porque una clienta «borrada» seguía existiendo en sus sistemas. Todos los paneles decían Complete, pero cuando la persona quiso registrarse otra vez, el sistema respondió que el email ya estaba registrado.",
    "",
    "La investigación encontró datos personales en bases secundarias, adjuntos de soporte, índices de búsqueda, exportaciones de analítica, logs, archivos y backups. Incluso un trabajo de sincronización había recreado datos que el servicio de cuentas sí había borrado.",
    "",
    "LA LECCIÓN QUE GUÍA TODO EL DISEÑO",
    "reported_status (COMPLETE, PARTIALLY_COMPLETE, NOT_STARTED) y reported_result de la actividad (SUCCESS, PARTIAL, FAILED) son afirmaciones. El agente solo acepta como prueba una observación del registro: una fila en una foto de base de datos, una búsqueda que devolvió filas o un 404, un escaneo, una configuración de conector, un documento o una pantalla.",
    "",
    "LOS NUEVE LUGARES",
    "Cada uno corresponde a un system_id del contrato: account_service (perfil), réplicas (failover, lectura, reporting, regionales), support_platform (mensajes y adjuntos), export_service (exportaciones descargables), search_service (índice), analytics_platform (perfiles de analítica y copias de contacto), backup_service (archivos que se pueden restaurar), integration_service (conectores que sincronizan) e identity_service (tombstones que deben quedar solo con el user_id).",
  ].join("\n"));
  txt(s, "La historia", M, 1.5, 5.6, 0.45, { fontSize: 20, bold: true });
  txt(s, "Northstar Shop perdió 2,4 millones de dólares. Todos sus paneles marcaban la solicitud de borrado como «Complete». Semanas después, la clienta quiso crear una cuenta nueva y el sistema respondió: «This email is already registered».", M, 2.05, 5.6, 2.0, { fontSize: 16, color: C.text2 });
  box(s, M, 4.95, 5.6, 1.6, C.background2);
  iconCircle(s, "LuTriangleAlert", M + 0.3, 5.35, 0.8, C.accent2);
  txt(s, "La lección: un estado reportado es una afirmación, no una prueba.", M + 1.35, 5.1, 4.0, 1.3, { fontSize: 18, bold: true, color: C.text2, valign: "middle" });
  txt(s, "Dónde se esconden los datos fantasma", 6.75, 1.5, 6.0, 0.45, { fontSize: 20, bold: true });
  const tiles = [["LuDatabase", "Réplicas de base de datos"], ["LuScrollText", "Logs de servicios"], ["LuPaperclip", "Adjuntos de soporte"],
    ["LuDownload", "Exportaciones descargables"], ["LuSearch", "Índices de búsqueda"], ["LuChartBar", "Perfiles de analítica"],
    ["LuArchive", "Backups restaurables"], ["LuRefreshCw", "Sincronizaciones activas"], ["LuIdCard", "Tombstones de cuenta"]];
  tiles.forEach((t, i) => {
    const x = 6.75 + (i % 3) * 2.03, y = 2.1 + Math.floor(i / 3) * 1.55;
    box(s, x, y, 1.9, 1.4, C.background2);
    iconCircle(s, t[0], x + 0.67, y + 0.15, 0.56, i === 7 || i === 6 ? C.accent2 : C.text2);
    txt(s, t[1], x + 0.1, y + 0.78, 1.7, 0.55, { fontSize: 12, align: "center", color: C.text1, valign: "middle" });
  });

  s = content("Qué recibe y qué devuelve el agente", [
    "QUÉ DECIR",
    "Cada fila de deletion_requests.csv es un caso. El agente devuelve exactamente una fila por caso en output.csv: 518 filas, ordenadas por case_id, con tres columnas.",
    "",
    "LOS CAMPOS DE ENTRADA, UNO POR UNO",
    "• case_id: identifica el caso y su fila de salida.",
    "• email: la identidad que llegó con la solicitud. Puede ser el email actual o uno antiguo; por eso hay que resolver la identidad histórica.",
    "• requested_at: cuándo se pidió. Es el inicio de la ventana de evidencia.",
    "• reported_status y reported_at: lo que el workflow afirmó y cuándo. No es prueba, pero el reported_at sirve para agrupar solicitudes procesadas en la misma corrida del worker.",
    "• audit_at: la hora de corte. Nada posterior puede cambiar la respuesta ni citarse.",
    "• request_text: el texto libre de la persona, en varios idiomas. Hay que decidir si de verdad pide borrar.",
    "",
    "LOS TRES ESTADOS",
    "• COMPLETE: cada copia tiene el trato que exige la política, lo retenido sigue disponible y nada puede recrear los datos. Solo lleva pasos VERIFICATION y cada uno cita la evidencia que lo prueba.",
    "• INCOMPLETE: queda algo. Lleva hallazgos (FINDING) que citan evidencia, el plan de remediación completo y las verificaciones que deben pasar después. Remediación y verificación son trabajo futuro, por eso su evidence_id va vacío.",
    "• NOT_APPLICABLE: el texto no autoriza borrar (acceso, corrección, exportación, baja de marketing, soporte). steps_json es [].",
  ].join("\n"));
  box(s, M, 1.45, 5.75, 3.05, C.background2);
  txt(s, "Entrada · una fila de deletion_requests.csv", M + 0.25, 1.58, 5.3, 0.4, { fontSize: 15, bold: true, color: C.text2 });
  const fin = [["case_id", "identificador del caso"], ["email", "actual o histórico"], ["requested_at", "cuándo se pidió"], ["reported_status", "lo que dice el workflow"], ["reported_at", "cuándo lo dijo"], ["audit_at", "hora de corte de la respuesta"], ["request_text", "texto libre, varios idiomas"]];
  txt(s, fin.map((f, i) => [{ text: f[0].padEnd(16, " "), options: { fontFace: CODE, bold: true, color: C.text1 } }, { text: f[1], options: { color: C.text2, breakLine: i < fin.length - 1 } }]).flat(),
    M + 0.25, 2.05, 5.3, 2.35, { fontSize: 13, paraSpaceAfter: 3 });
  arrow(s, 6.5, 2.97, 6.95, 2.97, C.accent4, 3);
  box(s, 7.1, 1.45, 5.63, 3.05, C.background2);
  txt(s, "Salida · una fila de output.csv", 7.35, 1.58, 5.2, 0.4, { fontSize: 15, bold: true, color: C.text2 });
  txt(s, [{ text: "case_id, deletion_status, steps_json", options: { fontFace: CODE, bold: true, breakLine: true } },
    { text: "518 filas, ordenadas por case_id. Cada paso de steps_json:", options: { color: C.text2 } }], 7.35, 2.05, 5.2, 0.75, { fontSize: 13 });
  code(s, ['{"step_no": 1, "phase": "FINDING",', ' "system_id": "account_service",', ' "resource_id": "account_005",', ' "operation": "REPORT_REMAINING_RECORD",', ' "state": "PRESENT", "evidence_id": "evidence_01"}'], 7.35, 2.85, 5.15, 1.5, 11);
  const stc = [["COMPLETE", "LuCircleCheck", C.accent1, "Cada copia tiene el trato exigido y nada puede recrearla. Solo pasos VERIFICATION, cada uno con su evidencia."],
    ["INCOMPLETE", "LuTriangleAlert", C.accent2, "Queda algo. Hallazgos con evidencia, plan de remediación y verificaciones futuras con evidence_id vacío."],
    ["NOT_APPLICABLE", "LuCircleHelp", C.accent4, "El texto no autoriza borrar: acceso, corrección, exportación, baja de marketing. steps_json = []."]];
  const cw3 = (CW - 0.5) / 3;
  stc.forEach((c, i) => {
    const x = M + i * (cw3 + 0.25);
    box(s, x, 4.8, cw3, 1.95, C.background1, { line: "D3DCE1", lineW: 1 });
    iconCircle(s, c[1], x + 0.2, 4.98, 0.55, c[2]);
    txt(s, c[0], x + 0.9, 4.98, cw3 - 1.0, 0.55, { fontSize: 16, bold: true, fontFace: CODE, color: c[2], valign: "middle" });
    txt(s, c[3], x + 0.2, 5.65, cw3 - 0.4, 1.0, { fontSize: 13, color: C.text2 });
  });

  s = content("Vocabulario: 15 operaciones en 3 fases", [
    "QUÉ DECIR",
    "El contrato fija un vocabulario cerrado. Cada operación pertenece a una fase y tiene un único estado, así que el estado nunca se elige: se deduce de la operación (en el código, OP_PHASE y OP_STATE en policy.py).",
    "",
    "LAS FASES",
    "• FINDING (4): lo que está mal hoy. Siempre cita la evidencia que lo prueba (file_id, activity_id o audit_id).",
    "• REMEDIATION (5): lo que hay que hacer. Siempre sin evidencia, porque es trabajo futuro.",
    "• VERIFICATION (6): lo que hay que comprobar. En un caso COMPLETE cita la prueba del estado actual; en uno INCOMPLETE es una comprobación futura y va sin evidencia.",
    "",
    "EL ORDEN",
    "Dentro de cada fase se sigue el orden de la tabla del enunciado, y los empates se resuelven por system_id y después por resource_id. Ese orden no es arbitrario: primero se desactivan los flujos y se bloquean las restauraciones (para que nada vuelva a crear el dato) y solo después se borran, redactan o anonimizan los registros.",
    "",
    "DETALLE QUE SUELE PREGUNTARSE",
    "REPORT_EXPOSED_PII se usa cuando el registro puede quedarse (política REDACT o ANONYMIZE) pero todavía expone identificadores. REPORT_REMAINING_RECORD se usa cuando el registro entero debía desaparecer (política DELETE).",
  ].join("\n"));
  const phases = [
    ["FINDING", "4 hallazgos", C.accent2, [["REPORT_REMAINING_RECORD", "PRESENT · queda un registro que debía borrarse"], ["REPORT_EXPOSED_PII", "PRESENT · el registro sigue exponiendo identificadores"], ["REPORT_ACTIVE_DATA_FLOW", "ACTIVE · un proceso puede copiar o recrear el dato"], ["REPORT_RESTORE_RISK", "ACTIVE · un backup puede restaurarlo"]]],
    ["REMEDIATION", "5 acciones", C.accent6, [["DISABLE_DATA_FLOW", "DISABLED · detener el proceso"], ["BLOCK_RESTORE", "BLOCKED · impedir la restauración"], ["DELETE_RECORD", "ABSENT · borrar el registro entero"], ["REDACT_RECORD", "REDACTED · quitar los campos prohibidos"], ["ANONYMIZE_RECORD", "ANONYMIZED · desvincularlo de la persona"]]],
    ["VERIFICATION", "6 comprobaciones", C.accent1, [["VERIFY_RECORD_ABSENT", "ABSENT"], ["VERIFY_RECORD_PRESENT", "PRESENT · lo retenido sigue ahí"], ["VERIFY_RECORD_REDACTED", "REDACTED"], ["VERIFY_RECORD_ANONYMIZED", "ANONYMIZED"], ["VERIFY_DATA_FLOW_DISABLED", "DISABLED"], ["VERIFY_RESTORE_BLOCKED", "BLOCKED"]]],
  ];
  phases.forEach((p, i) => {
    const x = M + i * (cw3 + 0.25);
    box(s, x, 1.45, cw3, 4.55, C.background2);
    box(s, x + 0.15, 1.6, cw3 - 0.3, 0.8, p[2], { r: 0.08 });
    txt(s, [{ text: p[0], options: { bold: true, fontFace: CODE, fontSize: 16, breakLine: true } }, { text: p[1], options: { fontSize: 12 } }], x + 0.35, 1.6, cw3 - 0.7, 0.8, { color: C.background1, valign: "middle" });
    const items = p[3].map((o, j) => [{ text: o[0], options: { bold: true, fontFace: CODE, fontSize: 12, color: C.text1, breakLine: true } }, { text: o[1], options: { fontSize: 12, color: C.text2, breakLine: j < p[3].length - 1, paraSpaceAfter: 7 } }]).flat();
    txt(s, items, x + 0.3, 2.55, cw3 - 0.5, 3.35, { fontSize: 12 });
  });
  box(s, M, 6.2, CW, 0.62, C.background1, { line: "D3DCE1", lineW: 1 });
  icon(s, "LuListChecks", M + 0.2, 6.3, 0.42, HX.accent1);
  txt(s, "Orden obligatorio: fase → orden de esta tabla → system_id → resource_id. Así se cortan los flujos y las restauraciones antes de tocar los registros.", M + 0.8, 6.2, CW - 1.0, 0.62, { fontSize: 14, color: C.text2, valign: "middle" });

  // ================================================================ 02
  sectionSlide("02", "Los datos de entrada", "Nueve archivos CSV y 94 evidencias en seis formatos. Datos globales con señuelos: nada dice a qué caso pertenece cada archivo.", "LuDatabase",
    "Sección 2. Qué datos entrega el reto. Lo importante: la evidencia es global y mezcla a muchas personas, y el manifiesto no dice qué archivo corresponde a qué caso. El agente tiene que conectarlo todo a través de identificadores.");

  s = content("Nueve archivos y 94 evidencias", [
    "QUÉ DECIR",
    "Todo lo que usa el agente está dentro de dataset/. No usa ningún archivo del organizador.",
    "",
    "CADA ARCHIVO",
    "• deletion_requests.csv: las 518 solicitudes que hay que responder.",
    "• sample_deletion_requests.csv y sample_output.csv: 32 solicitudes con su respuesta correcta. Sirven para medir y para iterar; nunca se copian etiquetas.",
    "• user_identities.csv: 850 usuarios con su identidad actual (user_id estable, nombre, email, teléfono, hash del email, fecha de actualización).",
    "• user_audit_log.csv: 306 cambios históricos de email, teléfono o hash. Con esto se recuperan identificadores viejos que pueden seguir en sistemas antiguos.",
    "• system_activity.csv: 4.011 eventos globales (borrados, syncs, exportaciones, backups, restauraciones, indexación). Muchos son de otras personas.",
    "• deletion_rules.csv: 15 reglas de política, una por categoría de dato.",
    "• evidence_files.csv: el manifiesto de las 94 evidencias: file_id, ruta, origen y captured_at (cuándo se capturó el archivo).",
    "",
    "LAS EVIDENCIAS (gráfico)",
    "28 JSON (bundles de snapshots, exportaciones de servicios, historiales de lookups, configuraciones de conectores), 26 logs en seis formatos distintos, 24 exportaciones SQL de SQLite (primarias y réplicas), 11 capturas PNG de consolas internas, 4 PDFs (extractos, registros de retención, un adjunto) y 1 texto de handover.",
    "",
    "LA TRAMPA",
    "El manifiesto no dice qué caso toca cada archivo. La conexión se hace por contenido: emails actuales e históricos, hashes, teléfonos, user_id, resource_id y referencias de negocio.",
  ].join("\n"));
  table(s, [
    ["Archivo", "Filas", "Para qué sirve"],
    [{ text: "deletion_requests.csv", options: { fontFace: CODE } }, "518", "solicitudes a auditar"],
    [{ text: "sample_*.csv", options: { fontFace: CODE } }, "32", "muestras con la respuesta correcta"],
    [{ text: "user_identities.csv", options: { fontFace: CODE } }, "850", "identidad actual: user_id, nombre, email, teléfono, hash"],
    [{ text: "user_audit_log.csv", options: { fontFace: CODE } }, "306", "cambios históricos de email, teléfono y hash"],
    [{ text: "system_activity.csv", options: { fontFace: CODE } }, "4.011", "eventos globales: afirmaciones, no pruebas"],
    [{ text: "deletion_rules.csv", options: { fontFace: CODE } }, "15", "trato exigido por categoría de dato"],
    [{ text: "evidence_files.csv", options: { fontFace: CODE } }, "94", "manifiesto: file_id, ruta, origen, captured_at"],
  ], M, 1.5, [3.2, 0.8, 3.5], { fontSize: 13, rowH: 0.6 });
  s.addChart(pres.charts.BAR, [{ name: "Archivos", labels: ["JSON", "Logs", "SQL", "PNG", "PDF", "TXT"], values: [28, 26, 24, 11, 4, 1] }],
    Object.assign(chartBase(), { x: 8.4, y: 1.4, w: 4.33, h: 4.3, barDir: "bar", chartColors: [HX.dk2], showValue: true, dataLabelPosition: "outEnd",
      showTitle: true, title: "Evidencias por formato", valAxisHidden: true, valGridLine: { style: "none" }, showLegend: false, catAxisOrientation: "maxMin", barGapWidthPct: 45 }));
  box(s, 8.4, 5.85, 4.33, 0.95, C.background2);
  txt(s, "El manifiesto no dice a qué caso pertenece cada archivo: hay que conectarlo por su contenido.", 8.6, 5.85, 3.95, 0.95, { fontSize: 13, color: C.text2, valign: "middle" });

  s = content("La política: 15 reglas, 5 tratos", [
    "QUÉ DECIR",
    "deletion_rules.csv asigna a cada categoría de dato una acción. El agente no borra todo: borra lo que hay que borrar, redacta o anonimiza lo que debe quedarse sin identificar a la persona, y conserva lo que la ley o la seguridad obligan a retener.",
    "",
    "LOS CINCO TRATOS",
    "• DELETE (reglas 01, 02, 03, 04, 06, 09, 10): perfil de usuario, identificador secundario (por ejemplo copias de contacto), entrada del índice de búsqueda, caché, adjunto de soporte que pertenece solo a la persona, exportación de usuario y perfil de marketing.",
    "• REDACT (05, 11, 15): mensajes de soporte que tienen contexto compartido con agentes o pedidos, logs de entrega de email que contienen la dirección, y el ACCOUNT_TOMBSTONE.",
    "• ANONYMIZE (07, 08): perfiles de analítica y telemetría que todavía se pueden atribuir a la persona.",
    "• RETAIN (12, 13, 14): logs de auditoría de seguridad dentro del periodo de retención, registros con retención legal activa y archivos de backup. El backup se conserva, pero hay que bloquear su restauración.",
    "• DISABLE: los flujos de datos activos (conectores, syncs) no son una categoría de las reglas, pero el contrato exige reportarlos y desactivarlos.",
    "",
    "EL TOMBSTONE (pregunta frecuente)",
    "Algunas cuentas dejan una lápida para que los registros retenidos sigan apuntando al mismo user_id interno. La regla 15 dice: se queda el user_id estable y se quitan nombre, email, teléfono y hash del email. Por eso es REDACT y no DELETE.",
    "",
    "EN EL CÓDIGO",
    "policy.py, clase Policy: action(categoría) devuelve la acción de la regla. DATA_FLOW → DISABLE, BACKUP_ARCHIVE → BLOCK_RESTORE, y una categoría desconocida → DELETE (la opción más segura para la privacidad).",
  ].join("\n"));
  const pol = [
    ["DELETE", "LuTrash2", C.accent2, ["01 Perfil de usuario", "02 Identificador secundario", "03 Índice de búsqueda", "04 Caché", "06 Adjunto de soporte", "09 Exportación", "10 Perfil de marketing"]],
    ["REDACT", "LuEyeOff", C.accent6, ["05 Mensaje de soporte con contexto compartido", "11 Log de entrega de email", "15 Tombstone: queda solo el user_id"]],
    ["ANONYMIZE", "LuShuffle", C.accent3, ["07 Perfil de analítica atribuible", "08 Telemetría de producto atribuible"]],
    ["RETAIN", "LuLock", C.accent1, ["12 Log de auditoría de seguridad", "13 Retención legal activa", "14 Backup: se conserva y se bloquea la restauración"]],
    ["DISABLE", "LuPowerOff", C.text2, ["Flujos de datos activos (conectores y syncs). No es una regla: lo exige el contrato."]],
  ];
  const pw = (CW - 4 * 0.18) / 5;
  pol.forEach((p, i) => {
    const x = M + i * (pw + 0.18);
    box(s, x, 1.45, pw, 4.7, C.background2);
    iconCircle(s, p[1], x + 0.2, 1.65, 0.7, p[2], p[0] === "ANONYMIZE" ? HX.dk1 : "FFFFFF");
    txt(s, p[0], x + 0.2, 2.5, pw - 0.4, 0.45, { fontSize: 17, bold: true, fontFace: CODE, color: p[0] === "ANONYMIZE" ? C.text1 : p[2] });
    txt(s, bullets(p[3], { space: 7 }), x + 0.2, 3.05, pw - 0.3, 3.0, { fontSize: 14, color: C.text1 });
  });
  txt(s, [{ text: "En el código: ", options: { bold: true } }, { text: "Policy.action(categoría)", options: { fontFace: CODE } }, { text: " devuelve la acción. Una categoría desconocida se trata como DELETE, la opción más segura para la privacidad." }],
    M, 6.35, CW, 0.5, { fontSize: 14, color: C.text2, valign: "middle" });

  s = content("La actividad global: afirmaciones, no pruebas", [
    "QUÉ DECIR",
    "system_activity.csv tiene 4.011 eventos de todo el sistema. La mayoría son de otras personas o son ruido operativo. Lo crucial es que reported_result = SUCCESS no prueba que el dato desapareciera: solo dice que alguien envió o completó una orden.",
    "",
    "PARA QUÉ LA USA EL AGENTE (y para qué no)",
    "1. Enlaces del catálogo de datos: los 12 eventos LINK_RESOURCE_IDENTITY dicen, por ejemplo, «Data catalog linked account_5762 (account_5762) to haruka.s1838@zoho.com and user_11». Son la forma de conectar una captura de pantalla o un PDF (que a veces solo muestran una referencia como un número de extracto) con la persona.",
    "2. Atribución por lotes: los 1.466 eventos del deletion_worker nombran recursos que a veces no tienen ningún identificador en ninguna evidencia (un perfil que ya da 404, una fila de analítica ya anonimizada). Con el tiempo de cada evento y el reported_at de las solicitudes se asignan a su caso. Se explica en la sección 4.",
    "3. Nunca decide un estado. Un DELETE_RECORD con SUCCESS no hace que un registro sea ABSENT; solo una observación lo hace.",
    "",
    "OTROS EVENTOS",
    "CLASSIFY_REQUEST (10 eventos de privacy_intake) afirma que ciertas solicitudes no son de borrado. Tampoco se toman como prueba: la intención se decide leyendo el texto.",
  ].join("\n"));
  s.addChart(pres.charts.BAR, [{ name: "Eventos", labels: ["DELETE_RECORD", "UPDATE_RECORD", "SYNC_RECORD", "INDEX_RECORD", "SEND_EMAIL", "REFRESH_CACHE", "RETAIN_RECORD", "ANONYMIZE_RECORD", "REDACT_RECORD", "CREATE_EXPORT", "CHECK_DATA_FLOW", "otros"], values: [890, 672, 447, 400, 368, 284, 206, 204, 173, 155, 89, 123] }],
    Object.assign(chartBase(), { x: M, y: 1.4, w: 7.3, h: 5.45, barDir: "bar", chartColors: [HX.accent4], showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 11, catAxisLabelFontSize: 11,
      showTitle: true, title: "Eventos de system_activity.csv por tipo", valAxisHidden: true, valGridLine: { style: "none" }, showLegend: false, catAxisOrientation: "maxMin", barGapWidthPct: 35 }));
  const acts = [["LuWorkflow", C.accent4, "1.466 eventos del deletion_worker", "«SUCCESS» solo dice que la orden se envió. No prueba que el dato desapareciera."],
    ["LuLink", C.accent1, "12 enlaces del catálogo", "LINK_RESOURCE_IDENTITY une recurso, referencia, email y user_id: así se conectan capturas y PDFs."],
    ["LuShieldCheck", C.text2, "Uso en el agente", "Atribuir recursos sin identificadores a su solicitud. Nunca para decidir un estado."]];
  acts.forEach((a, i) => {
    const y = 1.5 + i * 1.8;
    box(s, 8.2, y, 4.53, 1.6, C.background2);
    iconCircle(s, a[0], 8.4, y + 0.2, 0.6, a[1]);
    txt(s, a[2], 9.2, y + 0.18, 3.4, 0.6, { fontSize: 15, bold: true, valign: "middle" });
    txt(s, a[3], 8.4, y + 0.85, 4.15, 0.7, { fontSize: 12.5, color: C.text2 });
  });

  // ================================================================ 03
  sectionSlide("03", "Arquitectura y flujo de datos", "Ocho etapas en línea, los objetos que pasan de una a otra, la ventana temporal de cada caso y cómo se opera el sistema.", "LuWorkflow",
    "Sección 3. La vista de arriba: cómo se encadenan las etapas, qué estructura de datos viaja entre ellas, qué significa la ventana [requested_at, audit_at] y cómo se ejecuta todo desde la terminal.");

  s = content("Arquitectura: un pipeline neuro-simbólico", [
    "QUÉ DECIR",
    "La solución es un pipeline de ocho etapas. Lo llamo neuro-simbólico porque combina un núcleo simbólico (reglas explícitas, deterministas) con un modelo neuronal (Claude) solo en dos puntos de percepción.",
    "",
    "LAS ETAPAS",
    "1. Solicitud: una fila de deletion_requests.csv.",
    "2. Intención (intent.py): ¿el texto autoriza borrar? Claude Haiku con salida JSON; respaldo por palabras clave. Si no autoriza → NOT_APPLICABLE, [].",
    "3. Identidad (identity.py): con el snapshot actual y el historial de cambios se juntan todos los emails, teléfonos, hashes y el user_id de la persona.",
    "4. Evidencia (observations.py, media.py): cada uno de los 94 archivos se convierte en Observaciones: «en el archivo F, a la hora T, el recurso R estaba presente o ausente, exponía o no PII, estaba activo o no, y aparecía junto a los identificadores L». Las capturas PNG las transcribe Claude visión.",
    "5. Investigador (investigate.py): busca los recursos de la persona y reconstruye su estado en audit_at con la última observación válida.",
    "6. Política (policy.py): aplica deletion_rules.csv y produce hallazgos, remediación y verificación, ordenados y numerados.",
    "7. Validador (validate.py): comprueba el contrato antes de escribir.",
    "8. Salida (pipeline.py): output.csv, más trace.jsonl con el porqué de cada caso y usage.json con tokens y costo.",
    "",
    "COLORES",
    "Verde azulado = determinista. Ámbar = interviene Claude. La etapa de evidencia es determinista salvo las 11 capturas.",
  ].join("\n"));
  const chips = [
    ["LuInbox", "Solicitud", "una fila de deletion_requests.csv", C.text2, false],
    ["LuSparkles", "Intención", "Claude Haiku + palabras clave · intent.py", C.accent3, true],
    ["LuFingerprint", "Identidad", "emails, teléfonos y hashes, actuales e históricos · identity.py", C.accent1, false],
    ["LuFileSearch", "Evidencia", "logs, SQL, JSON, TXT, PDF y capturas · observations.py, media.py", C.accent1, false],
    ["LuScanSearch", "Investigador", "recursos de la persona y su estado en audit_at · investigate.py", C.accent1, false],
    ["LuScale", "Política", "15 reglas → hallazgo, remediación, verificación · policy.py", C.accent1, false],
    ["LuShieldCheck", "Validador", "contrato de salida · validate.py", C.accent1, false],
    ["LuFileSpreadsheet", "output.csv", "+ trace.jsonl + usage.json · pipeline.py", C.text2, false],
  ];
  const chw = 2.6, gap = (CW - 4 * chw) / 3;
  const pos = (i) => { const row = i < 4 ? 0 : 1; const col = row === 0 ? i : 7 - i; return [M + col * (chw + gap), 1.5 + row * 2.2]; };
  chips.forEach((c, i) => {
    const [x, y] = pos(i);
    box(s, x, y, chw, 1.7, c[3]);
    const fg = c[4] ? C.text1 : C.background1;
    icon(s, c[0], x + 0.2, y + 0.18, 0.45, c[4] ? HX.dk1 : "FFFFFF");
    txt(s, c[1], x + 0.78, y + 0.15, chw - 0.9, 0.5, { fontSize: 17, bold: true, color: fg, valign: "middle" });
    txt(s, c[2], x + 0.2, y + 0.75, chw - 0.35, 0.9, { fontSize: 12, color: fg });
    if (i === 3) {
      s.addText("+ visión Claude", { shape: pres.shapes.ROUNDED_RECTANGLE, x: x + chw - 1.45, y: y - 0.2, w: 1.35, h: 0.36, fill: { color: C.accent3 }, line: { color: C.accent3 }, rectRadius: 0.08, fontSize: 11, bold: true, color: C.text1, align: "center", valign: "middle", margin: 0 });
    }
  });
  for (let i = 0; i < 3; i++) { const [x, y] = pos(i); arrow(s, x + chw + 0.06, y + 0.85, x + chw + gap - 0.06, y + 0.85, C.accent4, 2.5); }
  { const [x, y] = pos(3); arrow(s, x + chw / 2, y + 1.76, x + chw / 2, y + 2.14, C.accent4, 2.5); }
  for (let i = 4; i < 7; i++) { const [x, y] = pos(i); arrow(s, x - 0.06, y + 0.85, x - gap + 0.06, y + 0.85, C.accent4, 2.5); }
  const take = [["LuSigma", C.accent1, "Determinista", "Identidad, estado, política, orden y validación: reglas explícitas y reproducibles.", "FFFFFF"],
    ["LuSparkles", C.accent3, "Claude", "Solo intención del texto y lectura de 11 capturas. Sus respuestas se validan.", HX.dk1],
    ["LuArchive", C.text2, "Caché", "Cada respuesta se guarda: sin clave, la salida es idéntica byte a byte.", "FFFFFF"]];
  take.forEach((t, i) => {
    const x = M + i * (cw3 + 0.25);
    iconCircle(s, t[0], x, 5.95, 0.6, t[1], t[4]);
    txt(s, [{ text: t[2] + ". ", options: { bold: true, color: C.text1 } }, { text: t[3], options: { color: C.text2 } }], x + 0.75, 5.85, cw3 - 0.8, 0.95, { fontSize: 13, valign: "middle" });
  });

  s = content("Flujo de datos: qué viaja entre etapas", [
    "QUÉ DECIR",
    "Cada etapa recibe y entrega una estructura concreta. Es la mejor forma de explicar el código: seguir el dato.",
    "",
    "1. Solicitud: el diccionario de la fila CSV, con sus siete campos.",
    "2. Intención: un diccionario con authorizes_deletion (sí o no), request_type (DELETION, DELETION_VERIFICATION, ACCESS, EXPORT, CORRECTION, MARKETING_OPT_OUT, ACCOUNT_SUPPORT, OTHER), language, rationale y source (llm o keywords).",
    "3. Subject (identity.py): user_id, nombre, conjuntos de emails, teléfonos y hashes, matched_via (current, history o unresolved) y los audit_id usados. Su propiedad link_keys es la unión de todo: la llave para buscar.",
    "4. Observation (observations.py): la unidad común de evidencia. file_id y captured_at (del archivo, para saber si se puede citar), ts (cuándo ocurrió el hecho), system y resource_id, category, los tres estados present, exposed y active (pueden ser None si el archivo no lo dice), links (identificadores vistos junto al registro) y kind (record, lookup o scope; scope = una foto completa de un sistema).",
    "5. ResourceState (investigate.py): el estado final de un recurso en audit_at, con la evidencia que lo prueba, la hora observada y las razones por las que se vinculó a la persona (por ejemplo «evidence_01:minjun.kim@gmail.com» o «activity_4000:catalog»).",
    "6. Paso: los siete campos del contrato. Los pasos se serializan como JSON compacto y forman la fila de salida. Además, cada caso escribe una línea en trace.jsonl con intención, identidad y recursos: es la explicación auditable del resultado.",
  ].join("\n"));
  const df = [
    ["LuInbox", "Solicitud", "fila CSV", ["case_id, email", "requested_at, audit_at", "reported_status", "request_text"]],
    ["LuSparkles", "Intención", "intent.py", ["authorizes_deletion", "request_type, language", "rationale", "source: llm | keywords"]],
    ["LuFingerprint", "Subject", "identity.py", ["user_id, name", "emails{} phones{} hashes{}", "matched_via, audit_ids[]", "→ link_keys"]],
    ["LuFileSearch", "Observation", "observations.py", ["file_id, captured_at, ts", "system, resource_id, category", "present / exposed / active", "links{}, kind"]],
    ["LuScanSearch", "ResourceState", "investigate.py", ["system, resource_id, category", "present / exposed / active", "evidence_id, observed_at", "reasons[]"]],
    ["LuFileSpreadsheet", "Paso y fila", "policy.py · validate.py", ["step_no, phase, operation", "system_id, resource_id", "state, evidence_id", "→ output.csv + trace.jsonl"]],
  ];
  const dw = 3.75, dg = (CW - 3 * dw) / 2;
  const dpos = (i) => { const row = i < 3 ? 0 : 1; const col = row === 0 ? i : 5 - i; return [M + col * (dw + dg), 1.45 + row * 2.75]; };
  df.forEach((d, i) => {
    const [x, y] = dpos(i);
    box(s, x, y, dw, 2.4, C.background2);
    iconCircle(s, d[0], x + 0.2, y + 0.2, 0.55, i === 1 ? C.accent3 : (i === 0 || i === 5 ? C.text2 : C.accent1), i === 1 ? HX.dk1 : "FFFFFF");
    txt(s, [{ text: d[1], options: { bold: true, fontSize: 16, color: C.text1, breakLine: true } }, { text: d[2], options: { fontSize: 11.5, color: C.accent4, fontFace: CODE } }], x + 0.9, y + 0.15, dw - 1.0, 0.7);
    txt(s, d[3].map((t, j) => ({ text: t, options: { breakLine: j < d[3].length - 1 } })), x + 0.25, y + 0.95, dw - 0.4, 1.35, { fontSize: 12, fontFace: CODE, color: C.text2, paraSpaceAfter: 3 });
  });
  for (let i = 0; i < 2; i++) { const [x, y] = dpos(i); arrow(s, x + dw + 0.05, y + 1.2, x + dw + dg - 0.05, y + 1.2, C.accent4, 2.5); }
  { const [x, y] = dpos(2); arrow(s, x + dw / 2, y + 2.45, x + dw / 2, y + 2.7, C.accent4, 2.5); }
  for (let i = 3; i < 5; i++) { const [x, y] = dpos(i); arrow(s, x - 0.05, y + 1.2, x - dg + 0.05, y + 1.2, C.accent4, 2.5); }

  s = content("La ventana temporal de cada caso", [
    "QUÉ DECIR",
    "Cada caso se responde «como si fuera audit_at». Eso define qué evidencia vale.",
    "",
    "LA REGLA EXACTA (Investigator.in_window)",
    "Una observación cuenta si el archivo se capturó entre requested_at y audit_at (requested_at ≤ captured_at ≤ audit_at) y el hecho observado no es posterior a audit_at (ts ≤ audit_at).",
    "",
    "• Evidencia capturada antes de requested_at: no cuenta, porque describe un estado anterior a la solicitud.",
    "• Evidencia en la ventana: cuenta. Si hay varias sobre el mismo recurso, gana la de ts más alto. Si empatan en ts, se fusionan de forma conservadora: presente si alguna copia está presente, expuesto si alguna expone, activo si alguno está activo.",
    "• Evidencia capturada después de audit_at: nunca se cita ni decide el estado. El validador además rechaza cualquier paso que cite un archivo posterior.",
    "",
    "EL MATIZ DE LOS RETENIDOS (mejora n.º 5)",
    "A veces el vínculo entre la persona y un registro retenido (un log de auditoría de seguridad) solo aparece en una foto capturada después de audit_at. Ese archivo no se cita, pero el registro se añade a las verificaciones futuras de un caso INCOMPLETE (VERIFY_RECORD_PRESENT sin evidencia), porque después de remediar ese registro tiene que seguir ahí. Esto corrigió los casos 09, 23, 24, 29 y 30.",
    "",
    "CASO PROPIO custom_04",
    "Se movió audit_at de case_24 tres días después. Entonces evidence_02 (capturada el 17-09) entra en la ventana, su observación es más reciente, pasa a ser la cita de los hallazgos, y el registro retenido audit_record_7095 entra en las verificaciones. El agente lo acierta.",
  ].join("\n"));
  const tl = { x0: 0.9, x1: 12.4, y: 3.05 };
  const xr = 2.6, xp = 6.2, xa = 10.2;
  s.addShape(pres.shapes.RECTANGLE, { x: xr, y: 1.95, w: xa - xr, h: 2.2, fill: { color: C.background2 }, line: { color: C.background2 } });
  txt(s, "ventana de evidencia válida", xr + 0.15, 2.0, 4, 0.35, { fontSize: 12, color: C.accent1, bold: true });
  arrow(s, tl.x0, tl.y, tl.x1, tl.y, C.text2, 2.5);
  [[xr, "requested_at", "se pide el borrado", C.text2], [xp, "reported_at", "el workflow afirma un estado", C.accent4], [xa, "audit_at", "hora de corte", C.accent2]].forEach((m) => {
    s.addShape(pres.shapes.RECTANGLE, { x: m[0] - 0.03, y: 2.55, w: 0.06, h: 1.0, fill: { color: m[3] }, line: { color: m[3] } });
    txt(s, m[1], m[0] - 1.2, 3.65, 2.4, 0.35, { fontSize: 14, bold: true, fontFace: CODE, align: "center", color: m[3] });
    txt(s, m[2], m[0] - 1.2, 3.98, 2.4, 0.35, { fontSize: 12, align: "center", color: C.accent4 });
  });
  [[1.55, C.accent4, "antes: no cuenta"], [4.3, C.accent1, "cuenta"], [8.6, C.accent1, "la más reciente gana"], [11.4, C.accent2, "después: no se cita"]].forEach((d) => {
    s.addShape(pres.shapes.OVAL, { x: d[0] - 0.17, y: tl.y - 0.17, w: 0.34, h: 0.34, fill: { color: d[1] }, line: { color: C.background1, width: 1.5 } });
    txt(s, d[2], d[0] - 1.0, 2.45, 2.0, 0.35, { fontSize: 12, align: "center", color: d[1], bold: true });
  });
  const rules = [["LuClock", C.accent1, "Regla de la ventana", "Cuenta si el archivo se capturó entre requested_at y audit_at y el hecho no es posterior a audit_at."],
    ["LuHistory", C.text2, "La más reciente gana", "Decide la observación con el ts más alto. En empate se fusiona de forma conservadora: presente si alguna copia lo está."],
    ["LuLock", C.accent2, "Evidencia posterior", "Nunca decide ni se cita. Solo añade a las verificaciones futuras los registros retenidos que debe conservar."]];
  rules.forEach((r, i) => {
    const x = M + i * (cw3 + 0.25);
    box(s, x, 4.65, cw3, 2.15, C.background1, { line: "D3DCE1", lineW: 1 });
    iconCircle(s, r[0], x + 0.2, 4.85, 0.55, r[1]);
    txt(s, r[2], x + 0.9, 4.85, cw3 - 1.0, 0.55, { fontSize: 16, bold: true, valign: "middle" });
    txt(s, r[3], x + 0.2, 5.55, cw3 - 0.4, 1.2, { fontSize: 13, color: C.text2 });
  });

  s = content("Flujo del operador: de la instalación a la entrega", [
    "QUÉ DECIR",
    "Así se usa el sistema desde la terminal, en la raíz del repositorio.",
    "",
    "1. Instalar: pip install -r code/requirements.txt. Python 3.10 o superior; solo necesita anthropic y pypdf.",
    "2. Clave (opcional): ORCHESTRATE_ANTHROPIC_API_KEY o ANTHROPIC_API_KEY. Solo se lee del entorno, nunca se imprime ni se guarda en el log.",
    "3. Ejecutar: python code/main.py. El modo --llm decide cómo se usa Claude: auto (llama a la API si hay clave, si no usa la caché), cache (nunca llama a la API), live (exige la clave) u off (sin modelo: palabras clave y solo PDFs). Escribe output.csv, code/runs/trace.jsonl y code/runs/usage.json. Con la caché caliente tarda unos 2 segundos; la corrida que llenó la caché tardó unos 10 minutos.",
    "4. Evaluar: python code/evaluation/main.py --custom corre las 32 muestras y los 4 casos propios y calcula todas las métricas. Con --pred y --gold compara cualquier archivo.",
    "5. Probar: python -m unittest discover -s code/tests -t code. 39 pruebas, solo biblioteca estándar, unos 3 segundos, sin clave.",
    "6. Empaquetar: zip -rD code.zip README.md code -x \"*/__pycache__/*\" ... y subir code.zip, output.csv y log.txt a HackerRank.",
    "",
    "OTRAS OPCIONES ÚTILES",
    "--requests sample_deletion_requests.csv --out code/runs/sample_output.csv para correr solo las muestras; --model claude-opus-5-5 para reproducir la corrida con Opus desde su caché.",
  ].join("\n"));
  const ops = [
    ["Instalar", "pip install -r code/requirements.txt", "Python 3.10+, anthropic y pypdf"],
    ["Clave (opcional)", "export ORCHESTRATE_ANTHROPIC_API_KEY=…", "solo se lee del entorno; nunca se registra"],
    ["Ejecutar", "python code/main.py --llm auto", "output.csv, trace.jsonl, usage.json · ~2 s con caché"],
    ["Evaluar", "python code/evaluation/main.py --custom", "métricas en 32 muestras y 4 casos propios"],
    ["Probar", "python -m unittest discover -s code/tests -t code", "39 pruebas, ~3 s, sin clave"],
    ["Empaquetar", "zip -rD code.zip README.md code -x …", "code.zip + output.csv + log.txt a HackerRank"],
  ];
  ops.forEach((o, i) => {
    const y = 1.45 + i * 0.83;
    numCircle(s, i + 1, M, y + 0.08, 0.55, i === 2 ? C.accent1 : C.text2);
    txt(s, o[0], M + 0.8, y, 2.3, 0.7, { fontSize: 16, bold: true, valign: "middle" });
    box(s, 3.75, y + 0.04, 5.4, 0.62, C.background2, { r: 0.06 });
    txt(s, o[1], 3.9, y + 0.04, 5.15, 0.62, { fontSize: 12, fontFace: CODE, valign: "middle", color: C.text1 });
    txt(s, o[2], 9.4, y, 3.33, 0.7, { fontSize: 13, color: C.text2, valign: "middle" });
  });
  txt(s, "Modos de --llm:  auto (API si hay clave, si no caché) · cache · live · off (sin modelo)", M, 6.5, CW, 0.3, { fontSize: 12, color: C.accent4, fontFace: CODE });

  // ================================================================ 04
  sectionSlide("04", "El código módulo por módulo", "Doce archivos de Python, unas 2.000 líneas. Pseudocódigo de cada pieza y un caso real recorrido de punta a punta.", "LuBraces",
    "Sección 4. Aquí está el detalle técnico. Si el juez pregunta «muéstrame cómo decide el estado de un recurso» o «cómo encuentras los datos de un email antiguo», las respuestas están en estas diapositivas.");

  s = content("Mapa de módulos", [
    "QUÉ DECIR",
    "El paquete code/ghost_audit/ tiene doce archivos y unas 2.000 líneas de Python. Las dos piezas más grandes son las que hacen el trabajo difícil: observations.py (leer formatos heterogéneos) e investigate.py (decidir qué es de quién y en qué estado está).",
    "",
    "ORDEN DE LECTURA RECOMENDADO",
    "main.py → pipeline.py → dataset.py → observations.py → identity.py → investigate.py → policy.py → validate.py. Después intent.py, media.py y llm.py para la parte de Claude.",
    "",
    "DEPENDENCIAS",
    "Solo la biblioteca estándar más anthropic (cliente de Claude) y pypdf (texto de PDFs). SQLite viene con Python: las exportaciones SQL se ejecutan tal cual en una base en memoria.",
    "",
    "PRUEBAS (code/tests/, 39)",
    "test_extractors.py (los seis formatos de log, uniones por trace_id, fotos SQL), test_policy_and_contract.py (cada acción de política, el orden y cada violación del contrato), test_investigation.py (un mini dataset ficticio con email histórico y evidencia antes y después de la ventana), test_intent_and_llm.py (intención multilingüe, respaldo y caché) y test_regression.py (las métricas no bajan y la salida se reproduce byte a byte).",
  ].join("\n"));
  table(s, [
    ["Módulo", "Qué hace"],
    [{ text: "main.py", options: { fontFace: CODE } }, "CLI: argumentos, escribe la salida e imprime el uso"],
    [{ text: "pipeline.py", options: { fontFace: CODE } }, "orquesta el recorrido completo"],
    [{ text: "dataset.py", options: { fontFace: CODE } }, "carga CSVs y manifiesto; envía cada archivo a su extractor"],
    [{ text: "observations.py", options: { fontFace: CODE } }, "parsers de logs, SQL, JSON y texto → Observation"],
    [{ text: "media.py", options: { fontFace: CODE } }, "PDFs con pypdf y capturas con visión Claude"],
    [{ text: "identity.py", options: { fontFace: CODE } }, "identificadores actuales e históricos"],
    [{ text: "investigate.py", options: { fontFace: CODE } }, "recursos, estado en audit_at, lotes y plan"],
    [{ text: "policy.py", options: { fontFace: CODE } }, "reglas, vocabulario y orden de los pasos"],
    [{ text: "intent.py", options: { fontFace: CODE } }, "prompt de intención y respaldo por palabras clave"],
    [{ text: "llm.py", options: { fontFace: CODE } }, "cliente Claude: JSON estructurado, caché y costo"],
    [{ text: "validate.py", options: { fontFace: CODE } }, "comprobación del contrato de salida"],
    [{ text: "util.py", options: { fontFace: CODE } }, "tiempos, normalización, prefijo → sistema"],
  ], M, 1.45, [2.2, 5.0], { fontSize: 12.5, rowH: 0.415 });
  s.addChart(pres.charts.BAR, [{ name: "Líneas", labels: ["observations", "investigate", "media", "llm", "util", "dataset", "pipeline", "intent", "policy", "identity", "main", "validate"], values: [484, 463, 184, 180, 109, 100, 98, 95, 95, 73, 61, 60] }],
    Object.assign(chartBase(), { x: 8.05, y: 1.4, w: 4.68, h: 5.45, barDir: "bar", chartColors: [HX.accent1], showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 11, catAxisLabelFontSize: 11,
      showTitle: true, title: "Líneas de código por módulo", valAxisHidden: true, valGridLine: { style: "none" }, showLegend: false, catAxisOrientation: "maxMin", barGapWidthPct: 35 }));

  s = content("Pseudocódigo: el recorrido completo", [
    "QUÉ DECIR",
    "Esta es la función run() de pipeline.py, traducida a pseudocódigo. Es todo el sistema en una pantalla.",
    "",
    "DETALLES DE CADA LÍNEA",
    "• El LLM se crea con el modelo por defecto claude-haiku-5-5 (se puede cambiar con --model o la variable GHOST_AUDIT_MODEL). En modo off no hay LLM.",
    "• Investigator(ds) extrae todas las observaciones de los 94 archivos una sola vez, al construirse. Después indexa por resource_id, separa las fotos completas (kind = scope), arma el catálogo de enlaces y conecta referencias del catálogo con lo leído en capturas y PDFs.",
    "• El contexto incluye las muestras y la evaluación porque el deletion_worker mezcla solicitudes de ambos archivos en la misma corrida. Para atribuir bien un lote hay que ver todas sus solicitudes.",
    "• La intención se calcula una vez por texto distinto: 398 textos para 550 solicitudes. Los textos repetidos reutilizan la respuesta.",
    "• atribuir_lotes asigna objetivos del worker que no tienen identificadores. Se hace antes de auditar porque es un problema conjunto entre solicitudes de un mismo lote.",
    "• Cada caso se audita, se valida y se escribe. Si el validador encuentra errores, main.py los imprime y termina con código 1.",
  ].join("\n"));
  code(s, [
    "función run(dataset, archivo_solicitudes, modo_llm):",
    "    llm  ← LLM(\"claude-haiku-5-5\", modo_llm)        # nada si modo = off",
    "    ds   ← Dataset(dataset)                         # CSVs y manifiesto de 94 archivos",
    "    ds.media_reader ← MediaReader(ds, llm)          # PDFs con pypdf, PNG con visión",
    "    inv  ← Investigator(ds)                         # extrae TODAS las observaciones una vez",
    "    contexto ← muestras ∪ evaluación                # el worker mezcla ambas en sus corridas",
    "",
    "    para cada texto distinto en contexto:           # 398 textos, 1 llamada por texto",
    "        intención[texto] ← clasificar(texto)        # Claude + palabras clave",
    "    inv.atribuir_lotes(contexto)                    # objetivos sin identificadores",
    "",
    "    para cada solicitud r en orden de case_id:",
    "        res ← inv.auditar(r, intención[r].autoriza_borrado)",
    "        errores[r] ← validar_contrato(res.estado, res.pasos, r.audit_at, manifiesto)",
    "        filas  += (r.case_id, res.estado, json(res.pasos))",
    "        trazas += (intención, identidad, recursos, motivos)",
    "",
    "    escribir output.csv, code/runs/trace.jsonl, code/runs/usage.json",
  ], M, 1.45, CW, 5.4, 15);

  s = content("Extractores: todo archivo se vuelve Observación", [
    "QUÉ DECIR",
    "La idea central del diseño: seis formatos distintos se traducen a una sola estructura, Observation. A partir de ahí, el resto del sistema no sabe ni le importa si el dato vino de un log, de SQL o de una captura.",
    "",
    "CADA FORMATO",
    "• Logs (26 archivos): parse_log_line reconoce seis formatos: key=value, JSON, «[nivel] [servicio] [trace] evento:», separados por barras verticales, syslog RFC 5424 y el de funciones con requestId. Solo ciertos eventos producen observaciones (profile_lookup_completed, index_query_completed, analytics_profile_read_completed, contact_lookup_completed, connector_config_loaded, restore_candidate_evaluated, message_read, attachment_pii_scan, etc.).",
    "• La unión por trace_id (ejemplo de la derecha): la línea «_started» tiene el identificador buscado (lookup_key) pero no el recurso; la línea «_completed» tiene el recurso y el resultado pero no el identificador. extract_log junta las claves de búsqueda por trace_id y se las pasa a la observación final.",
    "• SQL (24): se ejecuta el script en sqlite3 en memoria. Hay tablas de primaria y de réplicas (failover, lectura, reporting, regionales), algunas con record_json. La tabla snapshot_scope indica que la foto es completa para un sistema: eso permite probar ausencia.",
    "• JSON (28): bundles de snapshots por colección, service_exports por servicio, historiales de operaciones y configuraciones de conectores.",
    "• Texto (1): el handover del 2026-10-01 con líneas «fecha | sistema | recurso | tipo | resultado | sujeto».",
    "• PDF (4): pypdf extrae el texto; los ids de recurso y los identificadores del mismo documento se toman como un registro.",
    "• PNG (11): Claude visión transcribe los registros a JSON. Sección 5.",
    "",
    "CÓMO SE DECIDE «EXPUESTO»",
    "Se miran campos directos (email, phone, full_name, requester_email, owner_email, etc.). «[REDACTED]» no cuenta como expuesto. En analítica, un user_id o customer_reference también cuenta, porque la regla dice «todavía atribuible».",
  ].join("\n"));
  const fmts = [["LuScrollText", "Logs · 26", "6 formatos (key=value, JSON, corchetes, barras, syslog, requestId). Las búsquedas se unen por trace_id."],
    ["LuDatabase", "SQL · 24", "Se ejecuta en SQLite en memoria. Primaria y réplicas; snapshot_scope marca una foto completa."],
    ["LuBraces", "JSON · 28", "Bundles de snapshots, exportaciones de servicios, historiales de lookups, conectores."],
    ["LuFileText", "Texto · 1", "Handover: fecha | sistema | recurso | tipo | resultado | sujeto."],
    ["LuFileSearch", "PDF · 4", "pypdf extrae el texto; ids de recurso e identificadores del mismo documento."],
    ["LuScanEye", "PNG · 11", "Claude visión transcribe los registros a un JSON con esquema fijo."]];
  fmts.forEach((f, i) => {
    const y = 1.5 + i * 0.89;
    iconCircle(s, f[0], M, y + 0.05, 0.55, i === 5 ? C.accent3 : C.text2, i === 5 ? HX.dk1 : "FFFFFF");
    txt(s, [{ text: f[1], options: { bold: true, breakLine: true, fontSize: 14.5 } }, { text: f[2], options: { color: C.text2, fontSize: 12.5 } }], M + 0.75, y, 5.5, 0.85);
  });
  txt(s, "Ejemplo: dos líneas de evidence_01 unidas por trace_id", 7.05, 1.45, 5.7, 0.4, { fontSize: 14, bold: true, color: C.text2 });
  code(s, [
    "11:56:49Z account_service trace_id=tr-8001359",
    "  event=profile_lookup_started",
    "  lookup_key=\"minjun.kim@gmail.com\"",
    "11:56:57Z account_service trace_id=tr-8001359",
    "  resource_id=account_9797",
    "  event=profile_lookup_completed rows=0 http_status=404",
  ], 7.05, 1.9, 5.68, 1.95, 11);
  arrow(s, 9.9, 3.92, 9.9, 4.32, C.accent4, 2.5);
  box(s, 7.05, 4.4, 5.68, 2.05, C.background2, { r: 0.08 });
  txt(s, [
    { text: "Observation(", options: { bold: true, breakLine: true } },
    { text: "  file_id  = evidence_01", options: { breakLine: true } },
    { text: "  ts       = 2026-09-15T11:56:57Z", options: { breakLine: true } },
    { text: "  resource = account_9797 (account_service)", options: { breakLine: true } },
    { text: "  present  = False", options: {} }, { text: "   # 404 y 0 filas", options: { color: C.accent1, breakLine: true } },
    { text: "  links    = {minjun.kim@gmail.com}", options: {} }, { text: " # vía trace_id", options: { color: C.accent1, breakLine: true } },
    { text: ")", options: { bold: true } },
  ], 7.25, 4.52, 5.35, 1.85, { fontSize: 11.5, fontFace: CODE, color: C.text1 });

  s = content("Identidad: el email viejo sigue dejando rastro", [
    "QUÉ DECIR",
    "La solicitud trae un email, pero los sistemas viejos pueden guardar el email anterior, su hash o un teléfono anterior. Por eso la identidad se reconstruye completa antes de buscar.",
    "",
    "EL CASO REAL: case_12 (muestra pública)",
    "• La solicitud llega con minjun.kim@gmail.com y el texto «I changed the email on this account before deleting it. Please check that nothing tied to the old address was left behind, even in systems that do not display the email».",
    "• user_identities.csv: ese es el email actual de user_12 (Min-jun Kim, +82 10 2466 4678, hash 6e34ae57…).",
    "• user_audit_log.csv: audit_282 dice que el 2026-05-18 cambió el email desde minjun.kim90@gmail.com; audit_283 dice que el hash cambió desde 44a65154…",
    "• Las link_keys quedan: los dos emails, el teléfono, los dos hashes, el sha256 de cada email (por si un sistema guarda el hash calculado y no el del snapshot) y user_12.",
    "• En evidence_01, la línea de analytics_9914 es contact_lookup_completed rows=1 con correlation_key = 44a65154…: el hash del email ANTIGUO. Esa copia de contacto no aparece buscando el email actual. Es exactamente lo que la persona temía.",
    "",
    "CÓMO FUNCIONA IdentityResolver.resolve",
    "Primero busca el email entre los emails actuales; si no está, entre los emails viejos y nuevos del historial (matched_via = history). Si nadie es dueño, la persona queda unresolved y solo se busca por el email y su sha256. Después une snapshot, historial y hashes.",
    "",
    "CASO PROPIO custom_03",
    "La misma solicitud de case_12 enviada desde el email antiguo minjun.kim90@gmail.com. El agente resuelve user_12 por historial y llega exactamente a la misma respuesta de 5 pasos.",
  ].join("\n"));
  const idb = [
    ["LuInbox", "Email de la solicitud", [["minjun.kim@gmail.com", true]], C.text2],
    ["LuIdCard", "user_identities.csv", [["user_12 · Min-jun Kim", false], ["+82 10 2466 4678", false], ["hash 6e34ae57…", true]], C.accent1],
    ["LuHistory", "user_audit_log.csv", [["audit_282: email antes", false], ["minjun.kim90@gmail.com", true], ["audit_283: hash antes 44a65154…", true]], C.accent1],
    ["LuKeyRound", "link_keys", [["2 emails, 1 teléfono", false], ["2 hashes + sha256(email)", false], ["user_12", true]], C.text2],
  ];
  const iw = 2.83, ig = (CW - 4 * iw) / 3;
  idb.forEach((b, i) => {
    const x = M + i * (iw + ig);
    box(s, x, 1.45, iw, 2.1, C.background2);
    iconCircle(s, b[0], x + 0.2, 1.62, 0.55, b[3]);
    txt(s, b[1], x + 0.85, 1.62, iw - 0.95, 0.55, { fontSize: 14, bold: true, valign: "middle" });
    txt(s, b[2].map((l, j) => ({ text: l[0], options: { bold: l[1], fontFace: CODE, breakLine: j < b[2].length - 1 } })), x + 0.2, 2.3, iw - 0.3, 1.2, { fontSize: 11.5, color: C.text1, paraSpaceAfter: 5 });
    if (i < 3) arrow(s, x + iw + 0.04, 2.5, x + iw + ig - 0.04, 2.5, C.accent4, 2.5);
  });
  txt(s, "En evidence_01 la copia solo aparece con el hash del email ANTIGUO", M, 3.8, 7.6, 0.4, { fontSize: 15, bold: true, color: C.accent2 });
  code(s, [
    "11:58:26Z analytics_platform trace_id=tr-9137340",
    "  resource_id=analytics_9914",
    "  event=contact_lookup_completed rows=1 email_opt_in=true",
    "  correlation_key=\"44a65154bfd8e408852578fbd76813d0…\"",
    "",
    "# links ∩ link_keys = {hash antiguo}  →  recurso de user_12",
  ], M, 4.3, 7.6, 2.1, 13);
  txt(s, "identity.py · resolve()", 8.5, 3.8, 4.23, 0.4, { fontSize: 15, bold: true, color: C.text2 });
  code(s, [
    "uid ← actual[email]",
    "      o histórico[email]",
    "claves ← {email}",
    "claves += snapshot(uid)",
    "claves += historial(uid)",
    "claves += sha256(cada email)",
    "claves += {uid}",
  ], 8.5, 4.3, 4.23, 2.1, 13);

  s = content("Investigador: recursos y estado en audit_at", [
    "QUÉ DECIR",
    "Esta es la función audit() de investigate.py y su ayudante resource_state(). Son el corazón del agente.",
    "",
    "ENCONTRAR LOS RECURSOS (find_resources)",
    "Tres fuentes, todas dentro de la ventana:",
    "1. Observaciones cuyos links comparten algún identificador con las link_keys de la persona. Se guarda la razón, por ejemplo «evidence_01:44a65154…».",
    "2. Enlaces del catálogo (LINK_RESOURCE_IDENTITY) cuyo email o user_id es de la persona.",
    "3. La atribución por lotes calculada antes para ese caso (siguiente diapositiva).",
    "",
    "DECIDIR EL ESTADO (resource_state)",
    "Se toman las observaciones del recurso dentro de la ventana, se queda la del ts más alto y, si hay varias con ese ts, se fusionan de forma conservadora. La cita es el archivo capturado más tarde entre ellas. Si no hay ninguna observación, el estado queda desconocido; para un perfil de cuenta eso se interpreta como ausente (en el plan, present = None en account_service → False).",
    "",
    "LOS CUATRO PRINCIPIOS",
    "• Afirmación ≠ prueba: solo observaciones del registro deciden.",
    "• La más reciente gana: el estado en audit_at es la última observación válida.",
    "• Empate conservador: prefiero un falso hallazgo a dejar un fantasma.",
    "• Réplicas: una foto completa vacía no oculta una copia en una réplica (siguiente diapositiva).",
  ].join("\n"));
  code(s, [
    "función auditar(r, autoriza):",
    "    si no autoriza: devolver NOT_APPLICABLE, []",
    "    sujeto  ← resolver_identidad(r.email)",
    "    ventana ← [r.requested_at, r.audit_at]",
    "    recursos ← encontrar_recursos(sujeto, ventana)     # identificadores y catálogo",
    "             ∪ atribución_por_lotes[r.case_id]       # objetivos sin identificadores",
    "    estados ← { estado_en(rid, ventana) para cada rid en recursos }",
    "    posteriores ← retenidos ligados a la persona solo por evidencia posterior",
    "    devolver planificar(estados, ventana, posteriores)",
    "",
    "función estado_en(rid, ventana):",
    "    obs ← observaciones de rid con captured_at en la ventana y ts ≤ audit_at",
    "    si obs está vacío: devolver desconocido           # un perfil sin rastro = ausente",
    "    top ← obs con el ts más alto                       # la más reciente gana",
    "    present ← algún top dice presente                  # fusión conservadora",
    "    exposed ← algún top expone PII;  active ← algún top está activo",
    "    cita    ← archivo de top capturado más tarde",
  ], M, 1.45, CW, 4.35, 13);
  const pr = [["LuScale", "Afirmación ≠ prueba", C.text2], ["LuHistory", "La más reciente gana", C.accent1], ["LuShieldCheck", "Empate → presente", C.accent2], ["LuDatabase", "Las réplicas cuentan", C.accent6]];
  const prw = (CW - 3 * 0.25) / 4;
  pr.forEach((p, i) => {
    const x = M + i * (prw + 0.25);
    box(s, x, 6.0, prw, 0.8, C.background2);
    iconCircle(s, p[0], x + 0.15, 6.1, 0.6, p[2]);
    txt(s, p[1], x + 0.9, 6.0, prw - 1.0, 0.8, { fontSize: 14.5, bold: true, valign: "middle" });
  });

  s = content("Prueba de ausencia y deriva de réplicas", [
    "QUÉ DECIR",
    "Probar que algo NO existe es más difícil que probar que existe. El agente lo resuelve con fotos completas.",
    "",
    "QUÉ ES UNA FOTO COMPLETA",
    "Una exportación SQL con la tabla snapshot_scope (que declara qué sistemas cubre y a qué hora), o un bundle JSON con colecciones completas como customer_profiles, customer_search_documents o deleted_customer_references. En el código son observaciones con kind = scope.",
    "",
    "CÓMO SE USA (absence_proof)",
    "Para un VERIFY_RECORD_ABSENT de un caso COMPLETE sin prueba directa, se cita la foto completa más reciente del sistema dentro de la ventana que no lista el recurso. Se prefieren archivos que ya aparecen en el caso y, si no, fotos no vacías de ese sistema.",
    "",
    "EL FALLO QUE ESTO CORRIGIÓ (mejora n.º 1)",
    "La primera versión decía «borrado» cuando una foto primaria más nueva no listaba el registro. Pero en otra captura, por ejemplo evidence_54 (réplica failover de cuentas, 2026-09-02), el registro seguía presente, mientras evidence_90 (inventario del 2026-09-05) ya no lo listaba. Ahora una foto completa solo prueba la ausencia de lo que ninguna otra observación muestra en la ventana: la fila de la réplica es una observación del registro, y la falta de fila no lo es.",
    "",
    "POR QUÉ IMPORTA",
    "Es literalmente el escenario del enunciado: el primario está limpio, la réplica no, y el panel dice Complete.",
  ].join("\n"));
  const cyl = (x, y, w, h, fill, title, sub, rowTxt, rowFill) => {
    s.addShape(pres.shapes.CAN, { x, y, w, h, fill: { color: fill }, line: { color: fill } });
    txt(s, title, x, y + 0.95, w, 0.4, { fontSize: 15, bold: true, color: C.background1, align: "center" });
    txt(s, sub, x, y + 1.32, w, 0.35, { fontSize: 12, color: C.background2, align: "center", fontFace: CODE });
    s.addText(rowTxt, { shape: pres.shapes.ROUNDED_RECTANGLE, x: x + 0.3, y: y + 1.85, w: w - 0.6, h: 0.55, fill: { color: rowFill }, line: { color: rowFill }, rectRadius: 0.06, fontSize: 12, fontFace: CODE, bold: true, color: rowFill === C.accent2 ? C.background1 : C.text1, align: "center", valign: "middle", margin: 0 });
  };
  cyl(M, 1.55, 2.9, 2.95, C.text2, "Inventario primario", "evidence_90 · 09-05", "fila ausente", C.background2);
  cyl(M + 3.3, 1.55, 2.9, 2.95, C.accent6, "Réplica failover", "evidence_54 · 09-02", "fila presente", C.accent2);
  box(s, M, 4.8, 6.2, 1.75, C.background2);
  iconCircle(s, "LuTriangleAlert", M + 0.2, 5.0, 0.6, C.accent2);
  txt(s, [{ text: "Resultado: PRESENTE", options: { bold: true, breakLine: true, fontSize: 16, color: C.accent2 } },
    { text: "La falta de fila no es una observación del registro. La fila de la réplica sí lo es, así que se reporta REPORT_REMAINING_RECORD.", options: { fontSize: 13, color: C.text2 } }], M + 1.0, 4.95, 5.0, 1.5);
  txt(s, "Cómo se prueba la ausencia", 7.25, 1.5, 5.48, 0.45, { fontSize: 18, bold: true });
  const absItems = [
    [{ text: "Foto completa: ", options: { bold: true } }, { text: "una exportación con snapshot_scope, o colecciones completas de perfiles o índice de búsqueda (kind = scope)." }],
    [{ text: "Solo prueba lo que nada más contradice: ", options: { bold: true } }, { text: "si otra observación en la ventana muestra el registro, gana esa observación." }],
    [{ text: "Qué se cita: ", options: { bold: true } }, { text: "la foto completa más reciente del sistema en la ventana que no lista el recurso, prefiriendo archivos que ya aparecen en el caso." }],
    [{ text: "Búsquedas explícitas: ", options: { bold: true } }, { text: "un 404, rows=0 o total_hits=0 sí son observaciones de ausencia, con su propio archivo como cita." }],
  ];
  txt(s, bullets(absItems, { space: 10 }), 7.25, 2.05, 5.48, 4.75, { fontSize: 14, color: C.text1 });

  s = content("Atribución por lotes: recursos sin identificadores", [
    "QUÉ DECIR",
    "Hay recursos que el deletion_worker tocó y que no llevan ningún identificador en ninguna evidencia: un perfil que ya responde 404, una fila de analítica ya anonimizada. Aun así pertenecen a un caso, y la respuesta correcta los incluye (normalmente como verificaciones). La atribución por lotes los asigna.",
    "",
    "PASO A PASO (attribute_batches)",
    "1. Agrupar: las solicitudes con el mismo reported_at se procesaron en una misma corrida del worker.",
    "2. Ubicar cada evento del worker en su corrida según su plantilla de mensaje y una ventana de minutos relativa a reported_at: «submitted primary profile» de −95 a −25 min; «Policy action completed» de −40 a 0; «received the final result», «Connector status check» y «Restore-access check» de +10 a +160; los mensajes de resultado de −15 a +25. Gana la corrida cuya distancia al centro de la ventana sea menor.",
    "3. Filtrar candidatos: (a) a la solicitud todavía le falta un recurso de ese sistema; (b) el objetivo aparece en los mismos archivos de evidencia que sus otros recursos; (c) para perfiles, el resultado del worker coincide con reported_status (COMPLETE↔SUCCESS, PARTIALLY_COMPLETE↔PARTIAL, NOT_STARTED↔FAILED); (d) los objetivos «Policy action completed» no van a solicitudes cuya corrida reportó fallos.",
    "4. Resolver: primero las asignaciones únicas, después empates de dos en orden estable.",
    "5. El anillo: el worker procesa los perfiles de una corrida en el orden de envío de las solicitudes, empezando en una arbitraria. Se midió en 42 corridas con dueños conocidos por identificadores: 42 de 42 son rotaciones del orden de envío. Anclado en los perfiles de dueño conocido, el anillo desempata casi todo.",
    "",
    "HONESTIDAD SOBRE LOS LÍMITES",
    "Lo que sigue ambiguo se marca batch-guess en trace.jsonl: 39 asignaciones de perfil en la evaluación. Y dos filas de analítica sin identificadores en la misma corrida son un 50/50 real (es el error de case_03).",
  ].join("\n"));
  const bsteps = [
    ["Agrupar", "Solicitudes con el mismo reported_at = una corrida del worker."],
    ["Ubicar", "Cada plantilla de mensaje cae en una ventana de minutos respecto a reported_at (perfil enviado: −95 a −25)."],
    ["Filtrar", "Le falta un recurso de ese sistema, el objetivo aparece en sus archivos y el resultado coincide: COMPLETE↔SUCCESS, NOT_STARTED↔FAILED."],
    ["Desempatar", "El anillo resuelve casi todo; lo ambiguo queda marcado batch-guess (39 en la evaluación)."],
  ];
  bsteps.forEach((b, i) => {
    const y = 1.5 + i * 1.33;
    numCircle(s, i + 1, M, y + 0.05, 0.6, C.text2);
    txt(s, [{ text: b[0], options: { bold: true, fontSize: 16, breakLine: true } }, { text: b[1], options: { fontSize: 13.5, color: C.text2 } }], M + 0.85, y, 6.3, 1.2);
  });
  const cx = 10.2, cy = 3.75, rr = 1.75;
  s.addShape(pres.shapes.OVAL, { x: cx - rr, y: cy - rr, w: 2 * rr, h: 2 * rr, fill: { color: C.background1 }, line: { color: C.accent4, width: 1.5, dashType: "dash" } });
  const labels = ["1", "2", "3", "4", "5"];
  labels.forEach((l, i) => {
    const a = -Math.PI / 2 + i * (2 * Math.PI / 5);
    const nx = cx + rr * Math.cos(a), ny = cy + rr * Math.sin(a);
    numCircle(s, l, nx - 0.32, ny - 0.32, 0.64, i === 2 ? C.accent1 : C.text2, C.background1, 16);
  });
  txt(s, [{ text: "orden de envío", options: { bold: true, breakLine: true } }, { text: "el worker empieza en cualquier punto y sigue la rueda" }], cx - 1.25, cy - 0.55, 2.5, 1.1, { fontSize: 12.5, align: "center", color: C.text2, valign: "middle" });
  box(s, 7.75, 6.0, 4.98, 0.8, C.background2);
  txt(s, "Medido en 42 corridas con dueños conocidos: 42 de 42 son rotaciones del orden de envío.", 7.95, 6.0, 4.6, 0.8, { fontSize: 13, color: C.text2, valign: "middle" });

  s = content("Política: del estado observado a los pasos", [
    "QUÉ DECIR",
    "plan_for() en policy.py es una tabla de decisión. Recibe la acción que exige la regla y los tres estados observados (present, exposed, active) y devuelve hasta tres operaciones: hallazgo, remediación y verificación.",
    "",
    "CÓMO LEER LA TABLA",
    "• Si el recurso ya tiene el trato exigido, no hay hallazgo ni remediación: solo la verificación que lo prueba.",
    "• DELETE: si sigue presente → REPORT_REMAINING_RECORD, DELETE_RECORD, VERIFY_RECORD_ABSENT.",
    "• REDACT y ANONYMIZE: si expone PII → REPORT_EXPOSED_PII y la remediación correspondiente. Si ya no existe → VERIFY_RECORD_ABSENT.",
    "• RETAIN: siempre VERIFY_RECORD_PRESENT. Nunca se borra lo que hay que conservar.",
    "• Flujos y backups: si están activos o restaurables → REPORT_ACTIVE_DATA_FLOW / REPORT_RESTORE_RISK, luego DISABLE_DATA_FLOW / BLOCK_RESTORE, luego la verificación.",
    "",
    "LA DECISIÓN DEL CASO",
    "Si hay al menos un hallazgo, el caso es INCOMPLETE. Si no hay ninguno, es COMPLETE y solo se conservan las verificaciones que pueden citar evidencia.",
    "",
    "OJO CON LA CATEGORÍA",
    "La categoría sale de la observación: por ejemplo, contact_lookup_completed en analytics_platform es un SECONDARY_IDENTIFIER (regla 02, DELETE), no un ANALYTICS_PROFILE (regla 07, ANONYMIZE). Por eso en case_12 el paso es REPORT_REMAINING_RECORD y DELETE_RECORD sobre analytics_9914.",
  ].join("\n"));
  const R = (t) => ({ text: t, options: { fontFace: CODE, fontSize: 11.5 } });
  table(s, [
    ["Acción", "Estado observado", "Hallazgo", "Remediación", "Verificación"],
    [R("DELETE"), "sigue presente", R("REPORT_REMAINING_RECORD"), R("DELETE_RECORD"), R("VERIFY_RECORD_ABSENT")],
    [R("DELETE"), "ausente", "—", "—", R("VERIFY_RECORD_ABSENT")],
    [R("REDACT"), "expone PII", R("REPORT_EXPOSED_PII"), R("REDACT_RECORD"), R("VERIFY_RECORD_REDACTED")],
    [R("REDACT"), "ya redactado", "—", "—", R("VERIFY_RECORD_REDACTED")],
    [R("ANONYMIZE"), "atribuible", R("REPORT_EXPOSED_PII"), R("ANONYMIZE_RECORD"), R("VERIFY_RECORD_ANONYMIZED")],
    [R("REDACT / ANONYMIZE"), "ausente", "—", "—", R("VERIFY_RECORD_ABSENT")],
    [R("RETAIN"), "cualquiera", "—", "—", R("VERIFY_RECORD_PRESENT")],
    [R("DISABLE"), "flujo activo", R("REPORT_ACTIVE_DATA_FLOW"), R("DISABLE_DATA_FLOW"), R("VERIFY_DATA_FLOW_DISABLED")],
    [R("BLOCK_RESTORE"), "restaurable", R("REPORT_RESTORE_RISK"), R("BLOCK_RESTORE"), R("VERIFY_RESTORE_BLOCKED")],
    [R("DISABLE / BLOCK"), "ya inactivo", "—", "—", R("VERIFY_…_DISABLED / _BLOCKED")],
  ], M, 1.45, [2.15, 1.75, 2.85, 2.3, 3.08], { fontSize: 12.5, rowH: 0.42 });
  const dec = [[C.accent2, "LuTriangleAlert", "≥ 1 hallazgo → INCOMPLETE", "hallazgos con evidencia; remediación y verificación sin evidencia"], [C.accent1, "LuCircleCheck", "ningún hallazgo → COMPLETE", "solo verificaciones, y solo las que pueden citar su prueba"]];
  dec.forEach((d, i) => {
    const x = M + i * (CW / 2 + 0.1), w = CW / 2 - 0.1;
    box(s, x, 6.05, w, 0.8, C.background2);
    iconCircle(s, d[1], x + 0.15, 6.15, 0.6, d[0]);
    txt(s, [{ text: d[2], options: { bold: true, fontFace: CODE, color: d[0], breakLine: true } }, { text: d[3], options: { color: C.text2 } }], x + 0.9, 6.05, w - 1.0, 0.8, { fontSize: 12.5, valign: "middle" });
  });

  s = content("Pseudocódigo: planificar y ordenar", [
    "QUÉ DECIR",
    "Esta es la función plan() de investigate.py más order_steps() de policy.py.",
    "",
    "DETALLES",
    "• La evidencia de cada hallazgo es el archivo que mostró el problema (la cita de ResourceState).",
    "• Las verificaciones de ausencia sin prueba directa buscan una foto completa (absence_proof).",
    "• En un caso INCOMPLETE se vacía la evidencia de todas las verificaciones porque son comprobaciones futuras, y se añaden los retenidos documentados solo después de audit_at.",
    "• En un caso COMPLETE se descartan las verificaciones que no pueden citar evidencia, porque el contrato exige que cada verificación de un caso COMPLETE cite su prueba.",
    "• order_steps ordena por (rango de la operación en OPERATION_ORDER, system_id, resource_id) y numera desde 1. Ese rango ya encadena fase y operación, así que la fase queda bien ordenada sin una regla aparte.",
    "",
    "POR QUÉ ESTE ORDEN",
    "Primero se reporta, después se cortan los caminos que recrean datos (desactivar flujos, bloquear restauraciones) y solo entonces se borran, redactan o anonimizan los registros. Al final se verifica todo. Si se borrara antes de detener un sync, el sync podría volver a escribir el dato.",
  ].join("\n"));
  code(s, [
    "función planificar(estados, ventana, posteriores):",
    "    para cada st en estados:",
    "        acción  ← política(st.categoría)            # deletion_rules.csv",
    "        h, r, v ← plan_para(acción, st.present, st.exposed, st.active)",
    "        si h: hallazgos     += (h, evidencia = st.cita)",
    "        si r: remediaciones += (r, evidencia = \"\")",
    "        ev ← st.cita",
    "        si v = VERIFY_RECORD_ABSENT y no hay prueba directa:",
    "            ev ← foto completa más reciente sin el recurso",
    "        verificaciones += (v, ev)",
    "    si hay hallazgos:",
    "        vaciar la evidencia de las verificaciones   # son futuras",
    "        verificaciones += VERIFY_RECORD_PRESENT(posteriores)",
    "        estado ← INCOMPLETE",
    "    si no:",
    "        verificaciones ← solo las que tienen evidencia",
    "        estado ← COMPLETE",
    "    pasos ← ordenar(rango_operación, system_id, resource_id)",
    "    numerar pasos 1..n;  devolver estado, pasos",
  ], M, 1.45, 8.3, 5.4, 13);
  box(s, 9.15, 1.45, 3.58, 5.4, C.background2);
  iconCircle(s, "LuListChecks", 9.4, 1.7, 0.65, C.accent6);
  txt(s, "Por qué este orden", 9.4, 2.5, 3.1, 0.45, { fontSize: 17, bold: true });
  txt(s, bullets([
    "Primero se reporta lo que está mal.",
    "Después se cortan los caminos que recrean datos: flujos y restauraciones.",
    "Solo entonces se borran, redactan o anonimizan los registros.",
    "Al final se verifica cada estado exigido.",
  ], { space: 10 }), 9.4, 3.05, 3.15, 3.7, { fontSize: 14, color: C.text2 });

  s = content("Validador del contrato", [
    "QUÉ DECIR",
    "check_row() en validate.py revisa cada fila antes de escribirla. El mismo validador lo usan el evaluador y las pruebas, y las respuestas oficiales de las muestras también lo pasan (es una de las pruebas de regresión).",
    "",
    "QUÉ COMPRUEBA",
    "• El estado es COMPLETE, INCOMPLETE o NOT_APPLICABLE.",
    "• NOT_APPLICABLE no tiene pasos. INCOMPLETE tiene al menos un hallazgo. COMPLETE solo tiene pasos de VERIFICATION, todos con evidencia.",
    "• Cada paso tiene exactamente los 7 campos, step_no consecutivo desde 1, una operación conocida y la fase y el estado que corresponden a esa operación.",
    "• Las fases nunca retroceden (FINDING, REMEDIATION, VERIFICATION).",
    "• Un hallazgo siempre cita evidencia; en un caso INCOMPLETE los pasos futuros nunca la citan.",
    "• Cada evidence_id que empieza por evidence_ existe en el manifiesto y no se capturó después de audit_at.",
    "",
    "RESULTADO",
    "En la corrida final, 0 violaciones en las 518 filas. Si hubiera alguna, main.py la imprime y termina con error, así que nunca se entrega una fila inválida en silencio.",
  ].join("\n"));
  const checks = [
    "El estado es uno de los tres permitidos",
    "NOT_APPLICABLE ⇒ steps_json = []",
    "INCOMPLETE ⇒ al menos un hallazgo",
    "COMPLETE ⇒ solo VERIFICATION, con evidencia",
    "Exactamente los 7 campos por paso",
    "step_no consecutivo desde 1",
    "Operación conocida, con su fase y su estado",
    "Las fases nunca retroceden",
    "Todo hallazgo cita evidencia",
    "Los pasos futuros no citan evidencia",
    "El evidence_id existe en el manifiesto",
    "Nunca evidencia capturada después de audit_at",
  ];
  checks.forEach((c, i) => {
    const col = i < 6 ? 0 : 1, row = i % 6;
    const x = M + col * 6.15, y = 1.5 + row * 0.75;
    iconCircle(s, "LuCheck", x, y + 0.05, 0.5, C.accent1);
    txt(s, c, x + 0.7, y, 5.3, 0.6, { fontSize: 15, valign: "middle" });
  });
  box(s, M, 6.1, CW, 0.75, C.background2);
  txt(s, [{ text: "check_row() ", options: { fontFace: CODE, bold: true } }, { text: "corre antes de escribir cada fila; el evaluador y las pruebas lo reutilizan. Corrida final: 0 violaciones en 518 filas." }], M + 0.25, 6.1, CW - 0.5, 0.75, { fontSize: 14, color: C.text2, valign: "middle" });

  s = content("Un caso completo: case_12", [
    "QUÉ DECIR",
    "Este caso resume todo el diseño. El workflow dice COMPLETE, la persona sospecha que quedó algo ligado a su email anterior, y tiene razón.",
    "",
    "LO QUE HACE EL AGENTE",
    "1. Intención: Claude lo clasifica como DELETION_VERIFICATION, que autoriza el borrado (la persona pide verificar y terminar un borrado).",
    "2. Identidad: user_12 con su email actual y el anterior, el teléfono y los dos hashes (diapositiva de identidad).",
    "3. Evidencia en la ventana (2026-08-24 12:00 a 2026-09-15 12:00), todo de evidence_01:",
    "   • account_9797: profile_lookup_completed con 404 y 0 filas, unido por trace_id a la búsqueda del email actual → ausente. Correcto: el perfil sí se borró.",
    "   • analytics_9914: contact_lookup_completed rows=1 con el hash del email antiguo → presente. Es una copia de contacto, categoría SECONDARY_IDENTIFIER, regla 02: DELETE.",
    "   • audit_record_2945: audit_record_read_completed con correlation_key user_12 → registro de auditoría de seguridad, regla 12: RETAIN.",
    "4. Política: un hallazgo (REPORT_REMAINING_RECORD), su remediación (DELETE_RECORD) y tres verificaciones futuras (perfil ausente, copia ausente, auditoría presente).",
    "5. Como hay un hallazgo, el caso es INCOMPLETE y las verificaciones van sin evidencia.",
    "",
    "RESULTADO",
    "Coincide paso por paso con la respuesta oficial de sample_output.csv.",
  ].join("\n"));
  box(s, M, 1.45, 3.4, 4.9, C.background2);
  txt(s, "Entrada", M + 0.25, 1.6, 3.0, 0.4, { fontSize: 16, bold: true, color: C.text2 });
  txt(s, [
    { text: "email  ", options: { fontFace: CODE, bold: true } }, { text: "minjun.kim@gmail.com", options: { fontFace: CODE, breakLine: true } },
    { text: "estado reportado  ", options: { bold: true } }, { text: "COMPLETE", options: { fontFace: CODE, color: C.accent1, bold: true, breakLine: true } },
    { text: "audit_at  ", options: { bold: true } }, { text: "2026-09-15 12:00", options: { fontFace: CODE } },
  ], M + 0.2, 2.05, 3.05, 1.2, { fontSize: 12, paraSpaceAfter: 4 });
  txt(s, "«I changed the email on this account before deleting it. Please check that nothing tied to the old address was left behind, even in systems that do not display the email.»", M + 0.25, 3.35, 2.95, 2.9, { fontSize: 13.5, italic: true, color: C.text2 });
  txt(s, "Lo que encontró en evidence_01", 4.25, 1.45, 3.55, 0.4, { fontSize: 16, bold: true, color: C.text2 });
  const found = [["LuCircleCheck", C.accent1, "account_9797", "404 y 0 filas, unido por trace_id al email actual → ausente"],
    ["LuTriangleAlert", C.accent2, "analytics_9914", "copia de contacto hallada por el hash del email antiguo → presente (regla 02: DELETE)"],
    ["LuLock", C.text2, "audit_record_2945", "auditoría de seguridad de user_12 → retener (regla 12)"]];
  found.forEach((f, i) => {
    const y = 1.95 + i * 1.5;
    box(s, 4.25, y, 3.55, 1.35, C.background1, { line: "D3DCE1", lineW: 1 });
    iconCircle(s, f[0], 4.4, y + 0.15, 0.5, f[1]);
    txt(s, f[2], 5.05, y + 0.15, 2.65, 0.5, { fontSize: 13.5, bold: true, fontFace: CODE, valign: "middle" });
    txt(s, f[3], 4.4, y + 0.7, 3.3, 0.6, { fontSize: 12, color: C.text2 });
  });
  txt(s, "Salida", 8.05, 1.45, 4.68, 0.4, { fontSize: 16, bold: true, color: C.text2 });
  const S = (t, c) => ({ text: t, options: { fontFace: CODE, fontSize: 10.5, color: c || C.text1 } });
  table(s, [
    ["#", "Operación", "Recurso"],
    ["1", S("REPORT_REMAINING_RECORD", C.accent2), S("analytics_9914")],
    ["2", S("DELETE_RECORD", C.accent6), S("analytics_9914")],
    ["3", S("VERIFY_RECORD_ABSENT", C.accent1), S("account_9797")],
    ["4", S("VERIFY_RECORD_ABSENT", C.accent1), S("analytics_9914")],
    ["5", S("VERIFY_RECORD_PRESENT", C.accent1), S("audit_record_2945")],
  ], 8.05, 1.95, [0.4, 2.5, 1.78], { fontSize: 11, rowH: 0.5 });
  txt(s, "El hallazgo cita evidence_01; los pasos 2 a 5 son futuros y van sin evidencia.", 8.05, 5.15, 4.68, 0.7, { fontSize: 13, color: C.accent4 });
  box(s, M, 6.6 - 0.05, CW, 0.32, C.background1);
  txt(s, [{ text: "Resultado: INCOMPLETE ", options: { bold: true, color: C.accent2 } }, { text: "aunque el workflow decía COMPLETE. Coincide paso por paso con la respuesta oficial.", options: { color: C.text2 } }], M, 6.5, CW, 0.4, { fontSize: 15, valign: "middle" });

  // ================================================================ 05
  sectionSlide("05", "Dónde y cómo se usa Claude", "Dos tareas de percepción, salida JSON con esquema fijo, caché por hash y un respaldo que funciona sin modelo.", "LuSparkles",
    "Sección 5. La pregunta más probable del juez: ¿dónde está la IA? La respuesta: en las dos tareas donde hace falta entender lenguaje o imagen. Todo lo demás es determinista a propósito.");

  s = content("Claude solo en dos tareas de percepción", [
    "QUÉ DECIR",
    "Claude hace dos cosas, y las dos son de percepción: leer intención en lenguaje natural multilingüe y leer pantallas. No decide estados, no elige evidencia y no escribe pasos.",
    "",
    "1. INTENCIÓN (intent.py)",
    "Una llamada por texto distinto: 398 textos de las 550 solicitudes (518 de evaluación más 32 de muestra). Devuelve authorizes_deletion, request_type, language y rationale.",
    "",
    "2. VISIÓN (media.py)",
    "Una llamada por captura: 11 imágenes PNG de consolas internas (cuentas, búsqueda, conectores, backups, soporte, analítica, exportaciones, seguridad, referencias de cuentas borradas, almacenamiento de objetos, marketing). Devuelve los registros visibles con sus etiquetas, emails, teléfonos, nombres, estado y estado de flujo.",
    "",
    "CÓMO SE LLAMA",
    "Salida JSON estructurada con esquema fijo (output_config.format = json_schema), esfuerzo bajo y thinking desactivado en Haiku. Con modelos que no permiten desactivar el thinking (Opus 5.5) se omite el campo y se dan 4.096 tokens de margen.",
    "",
    "LOS NÚMEROS DE LA CORRIDA COMPLETA",
    "409 llamadas (398 de intención y 11 de capturas), 311.344 tokens de entrada y 39.099 de salida, 0,0507 USD, 0 fallos. Intención: 270.299 de entrada y 35.920 de salida. Capturas: 41.045 y 3.179.",
  ].join("\n"));
  const llmCards = [
    ["LuMessageSquareText", "Intención", "398 textos distintos · 1 llamada por texto", "¿El texto autoriza borrar? Multilingüe y con negaciones («no quiero borrar la cuenta»).", ["authorizes_deletion", "request_type", "language", "rationale"], "intent.py"],
    ["LuScanEye", "Visión", "11 capturas PNG · 1 llamada por imagen", "Transcribe los registros de consolas internas tal como se ven en pantalla.", ["labels, record_type", "emails, phones, names", "state", "flow"], "media.py"],
  ];
  llmCards.forEach((c, i) => {
    const x = M + i * (CW / 2 + 0.12), w = CW / 2 - 0.12;
    box(s, x, 1.45, w, 3.65, C.background2);
    iconCircle(s, c[0], x + 0.25, 1.65, 0.75, C.accent3, HX.dk1);
    txt(s, [{ text: c[1], options: { bold: true, fontSize: 20, breakLine: true } }, { text: c[2], options: { fontSize: 13, color: C.accent4 } }], x + 1.2, 1.62, w - 1.4, 0.85);
    txt(s, c[3], x + 0.25, 2.6, w - 0.5, 0.75, { fontSize: 14, color: C.text2 });
    txt(s, "Devuelve JSON con:", x + 0.25, 3.4, 2.6, 0.35, { fontSize: 12.5, bold: true, color: C.text2 });
    txt(s, c[4].map((t, j) => ({ text: t, options: { breakLine: j < c[4].length - 1 } })), x + 0.25, 3.75, 3.3, 1.25, { fontSize: 12, fontFace: CODE, color: C.text1, paraSpaceAfter: 2 });
    txt(s, [{ text: "prompt y esquema: ", options: { color: C.accent4 } }, { text: c[5], options: { fontFace: CODE, bold: true } }], x + 3.4, 4.6, w - 3.6, 0.35, { fontSize: 12, align: "right" });
  });
  const ls = [["409", "llamadas"], ["311.344", "tokens de entrada"], ["39.099", "tokens de salida"], ["$0,0507", "costo total"]];
  const lw = (CW - 3 * 0.25) / 4;
  ls.forEach((l, i) => {
    const x = M + i * (lw + 0.25);
    txt(s, l[0], x, 5.3, lw, 0.6, { fontSize: 28, bold: true, color: i === 3 ? C.accent3 : C.text2, fontFace: THEME.headFontFace });
    txt(s, l[1], x, 5.9, lw, 0.35, { fontSize: 13, color: C.accent4 });
  });
  txt(s, [{ text: "Lo que Claude no hace: ", options: { bold: true, color: C.accent2 } }, { text: "decidir estados, elegir evidencia ni escribir pasos.", options: { color: C.text2 } }], M, 6.4, CW, 0.4, { fontSize: 15 });

  s = content("Intención: Claude y una red de seguridad", [
    "QUÉ DECIR",
    "Decidir si un texto autoriza borrar parece trivial, pero hay trampas: textos en siete idiomas, negaciones explícitas y solicitudes que mencionan borrar solo para decir que no lo quieren.",
    "",
    "EL PROMPT (SYSTEM en intent.py), resumido",
    "Cuenta como borrado: pedir borrar, eliminar, quitar o cerrar permanentemente la cuenta o el perfil; pedir verificar, auditar o terminar un borrado ya pedido o quitar copias sobrantes. No cuenta: acceso o copia de datos, exportación o descarga, correcciones, solo baja de marketing, soporte de login, facturas, o cualquier cosa que pida conservar la cuenta. Un texto que menciona el borrado solo para decir que no lo quiere tampoco cuenta.",
    "",
    "EL RESPALDO (keyword_intent)",
    "Dos expresiones regulares. Primero NOT_DELETION: frases como «not asking for deletion», «don't delete», «no quiero borrar», «sin eliminar», «não excluam», «ne supprimez pas», «nicht löschen», 삭제하지, 削除しないで, 不要删除. Después DELETION: delet, eras, remov, eliminar, borrar, supprim, lösch, cancellazione, 삭제, 削除, 删除, удал, entre otras. Si Claude no responde, decide el respaldo. Si responden distinto, se anota keyword_disagreement en la traza.",
    "",
    "EL FALLO QUE LO JUSTIFICA (mejora n.º 9)",
    "La primera versión del respaldo leía «No quiero borrar la cuenta» como borrado. El caso propio custom_01 lo detectó; ahora las negaciones se revisan antes.",
    "",
    "RESULTADO",
    "Claude marca 10 de las 518 solicitudes de evaluación como no autorizadas (case_533 a case_542): correcciones de teléfono, nombre o email, baja de marketing, exportación, acceso y facturas, y ayuda de login. El respaldo coincide en todas.",
  ].join("\n"));
  const isteps = [
    ["Claude decide", "Prompt de política y JSON con esquema fijo: authorizes_deletion, request_type, language, rationale."],
    ["Las palabras clave vigilan", "Primero frases de «no borrar» en 7 idiomas; después verbos de borrado multilingües."],
    ["Si falla o discrepa", "Sin respuesta del modelo decide el respaldo; una discrepancia queda anotada en la traza."],
  ];
  isteps.forEach((st, i) => {
    const y = 1.5 + i * 1.45;
    numCircle(s, i + 1, M, y + 0.05, 0.6, i === 0 ? C.accent3 : C.text2, i === 0 ? C.text1 : C.background1);
    txt(s, [{ text: st[0], options: { bold: true, fontSize: 17, breakLine: true } }, { text: st[1], options: { fontSize: 14, color: C.text2 } }], M + 0.85, y, 5.6, 1.3);
  });
  box(s, M, 5.95, 6.4, 0.85, C.background2);
  txt(s, [{ text: "10 de 518 ", options: { bold: true, color: C.accent2, fontSize: 18 } }, { text: "no autorizan borrar: correcciones, baja de marketing, exportación, acceso y facturas, ayuda de login.", options: { color: C.text2 } }], M + 0.25, 5.95, 6.0, 0.85, { fontSize: 13, valign: "middle" });
  box(s, 7.35, 1.45, 5.38, 5.35, C.text1);
  txt(s, "Caso propio custom_01", 7.65, 1.7, 4.8, 0.4, { fontSize: 14, bold: true, color: C.accent5 });
  txt(s, "«¿Pueden enviarme una copia de los datos personales que tienen sobre mí? No quiero borrar la cuenta.»", 7.65, 2.2, 4.8, 1.6, { fontSize: 18, italic: true, color: C.background1 });
  txt(s, [{ text: "Contiene «borrar», pero es una solicitud de acceso que rechaza el borrado.", options: { breakLine: true } }, { text: "→ NOT_APPLICABLE, []", options: { fontFace: CODE, bold: true, color: C.accent3 } }], 7.65, 4.0, 4.8, 1.2, { fontSize: 14, color: C.background2 });
  txt(s, "La primera versión del respaldo fallaba aquí. Ahora las negaciones se revisan antes que los verbos.", 7.65, 5.4, 4.8, 1.2, { fontSize: 13, color: C.accent5 });

  s = content("Visión: de una captura a observaciones", [
    "QUÉ DECIR",
    "Las capturas son evidencia que no se puede parsear con reglas. Claude las transcribe, pero el agente no confía ciegamente: valida lo que recibe y lo traduce a la misma Observation de siempre.",
    "",
    "EL PROMPT DE VISIÓN (VISION_SYSTEM en media.py), resumido",
    "Listar cada registro de la pantalla, copiando exactamente lo que se ve: etiquetas (ids de recurso, user_N, números de ticket, pedido, extracto o factura, nombres de archivo), emails, teléfonos y nombres visibles (lista vacía si están enmascarados), state (PRESENT, DELETED_OR_NOT_FOUND, MASKED_OR_ANONYMIZED, UNKNOWN) y flow (ENABLED, DISABLED, RESTORE_ALLOWED, RESTORE_BLOCKED, NOT_SHOWN). «No inventes registros ni identificadores.»",
    "",
    "LA VALIDACIÓN (record_state)",
    "Solo se aceptan ids de recurso, emails y teléfonos que cumplen su expresión regular. Un conector o un backup que muestra datos de la persona sin indicar que esté detenido o bloqueado se considera activo.",
    "",
    "EL CATÁLOGO",
    "Algunas evidencias nombran el registro por una referencia de negocio, no por su resource_id: el número de extracto NST-2026-0718-1842 en un PDF, o user_17 en el registro de referencias. El evento LINK_RESOURCE_IDENTITY une esa referencia con el resource_id, el email y el user_id; find_label busca la referencia en lo transcrito y lo convierte en observación del recurso (mejora n.º 10).",
    "",
    "IMPACTO",
    "Doce solicitudes de evaluación dependen de una captura o de un PDF enlazado por el catálogo. Sin las capturas, nueve saldrían vacías y case_46 perdería su paso de tombstone.",
  ].join("\n"));
  const vflow = [["LuImage", "Captura PNG", C.text2, "FFFFFF"], ["LuScanEye", "Claude visión", C.accent3, HX.dk1], ["LuBraces", "JSON con esquema", C.text2, "FFFFFF"], ["LuShieldCheck", "record_state() valida", C.accent1, "FFFFFF"], ["LuFileSearch", "Observation", C.accent1, "FFFFFF"]];
  const vw = 2.15, vg = (CW - 5 * vw) / 4;
  vflow.forEach((v, i) => {
    const x = M + i * (vw + vg);
    box(s, x, 1.45, vw, 0.9, v[2]);
    icon(s, v[0], x + 0.15, 1.65, 0.5, v[3]);
    txt(s, v[1], x + 0.75, 1.45, vw - 0.85, 0.9, { fontSize: 13.5, bold: true, color: v[2] === C.accent3 ? C.text1 : C.background1, valign: "middle" });
    if (i < 4) arrow(s, x + vw + 0.03, 1.9, x + vw + vg - 0.03, 1.9, C.accent4, 2);
  });
  const Rv = (t) => ({ text: t, options: { fontFace: CODE, fontSize: 11.5 } });
  table(s, [
    ["Caso", "Pantalla", "Lo que se lee", "Resultado"],
    [Rv("case_34"), "consola de cuentas", "account_5762 en vivo con email y teléfono", Rv("REPORT_REMAINING_RECORD")],
    [Rv("case_39"), "consola de conectores", "data_flow_1121 sano y sincronizando a la persona", Rv("REPORT_ACTIVE_DATA_FLOW")],
    [Rv("case_46"), "registro de referencias", "el tombstone conserva solo user_17", Rv("VERIFY_RECORD_REDACTED")],
    [Rv("case_53"), "consola de soporte", "support_1034 muestra nombre y email", Rv("REPORT_EXPOSED_PII")],
    [Rv("case_55"), "consola de backups", "backup_9287 guarda la cuenta sin bloqueo", Rv("REPORT_RESTORE_RISK")],
  ], M, 2.65, [1.2, 2.5, 4.9, 3.5], { fontSize: 12.5, rowH: 0.5 });
  box(s, M, 5.85, CW, 0.95, C.background2);
  iconCircle(s, "LuLink", M + 0.2, 6.0, 0.6, C.accent1);
  txt(s, [{ text: "Catálogo: ", options: { bold: true } }, { text: "cuando una pantalla o un PDF nombra el registro por una referencia (NST-2026-0718-1842, user_17), LINK_RESOURCE_IDENTITY la une con su resource_id y con la persona. 12 casos de evaluación dependen de esto." }], M + 1.0, 5.85, CW - 1.2, 0.95, { fontSize: 13, color: C.text2, valign: "middle" });

  s = content("Caché, modos y reproducibilidad", [
    "QUÉ DECIR",
    "Cada respuesta de Claude se guarda en disco con una llave que identifica exactamente la pregunta. Así la segunda corrida es gratis, rápida y da el mismo resultado byte a byte, incluso en una máquina sin clave.",
    "",
    "LA LLAVE",
    "sha256 de: el modelo, el prompt de sistema, el contenido (las imágenes se representan por el sha256 de sus bytes), el esquema JSON y max_tokens. El archivo es code/cache/llm/<2 primeros caracteres>/<hash>.json y guarda model, purpose, usage (tokens de la llamada original) y output. Si cambia cualquier parte del prompt, la llave cambia y se vuelve a llamar.",
    "",
    "LOS MODOS (--llm)",
    "• auto (por defecto): llama a la API si hay clave; si no, reproduce la caché.",
    "• cache: nunca llama a la API.",
    "• live: exige la clave; falla si no está.",
    "• off: sin modelo. Intención por palabras clave y solo PDFs. La salida sigue siendo válida.",
    "",
    "REPRODUCIBILIDAD (mejora n.º 11)",
    "Al comparar la corrida que llenó la caché con una repetición, 12 filas emparejaban distinto un empate de analítica. La causa: un bucle iteraba sobre un set de Python, cuyo orden depende de PYTHONHASHSEED. Ahora todos los bucles de desempate iteran en orden; la salida es idéntica con semillas de 0 a 5, y una prueba de regresión lo verifica.",
    "",
    "COSTO",
    "La corrida que llenó la caché costó 0,0507 USD; la corrida final que produjo output.csv reprodujo esas mismas respuestas y no facturó nada.",
  ].join("\n"));
  txt(s, "La llave de la caché", M, 1.45, 6.0, 0.4, { fontSize: 17, bold: true });
  code(s, [
    "llave = sha256(modelo, prompt,",
    "         contenido,  # imagen: su sha256",
    "         esquema, max_tokens)",
    "",
    "code/cache/llm/ab/abcd….json",
    "  { model, purpose, usage, output }",
  ], M, 1.95, 6.0, 2.35, 12.5);
  box(s, M, 4.55, 6.0, 2.25, C.background2);
  iconCircle(s, "LuRefreshCw", M + 0.25, 4.75, 0.6, C.accent1);
  txt(s, "Byte a byte", M + 1.05, 4.75, 4.7, 0.6, { fontSize: 17, bold: true, valign: "middle" });
  txt(s, "Un bucle sobre un set hacía depender 12 filas de PYTHONHASHSEED. Ahora todos los desempates iteran en orden: misma salida con semillas 0 a 5, verificado por una prueba.", M + 0.25, 5.45, 5.5, 1.3, { fontSize: 13, color: C.text2 });
  const modes = [["auto", "LuPlay", "API si hay clave; si no, caché. Es el modo por defecto.", C.accent1],
    ["cache", "LuArchive", "Nunca llama a la API. Reproduce la entrega sin clave.", C.text2],
    ["live", "LuKeyRound", "Exige la clave. Se usó para llenar la caché.", C.accent3],
    ["off", "LuPowerOff", "Sin modelo: palabras clave y solo PDFs. Salida válida igual.", C.accent4]];
  modes.forEach((m, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 6.95 + col * 2.95, y = 1.45 + row * 2.7, w = 2.78;
    box(s, x, y, w, 2.5, C.background1, { line: "D3DCE1", lineW: 1 });
    iconCircle(s, m[1], x + 0.2, y + 0.2, 0.6, m[3], m[3] === C.accent3 ? HX.dk1 : "FFFFFF");
    txt(s, "--llm " + m[0], x + 0.2, y + 0.95, w - 0.4, 0.4, { fontSize: 15, bold: true, fontFace: CODE });
    txt(s, m[2], x + 0.2, y + 1.4, w - 0.4, 1.0, { fontSize: 13, color: C.text2 });
  });

  // ================================================================ 06
  sectionSlide("06", "Evaluación y resultados", "Cómo se mide, qué tan bien funciona en las 32 muestras, los casos propios y la historia de fallos y mejoras.", "LuGauge",
    "Sección 6. El enunciado exige en evaluation_report.md: exactitud de estado, exactitud por paso y por campo, exactitud de secuencia, al menos tres casos propios, y fallos con mejoras. Todo eso está aquí.");

  s = content("Resultados en las 32 muestras públicas", [
    "QUÉ DECIR",
    "El evaluador (code/evaluation/main.py) compara la salida del agente con sample_output.csv. Estas son las cuatro métricas principales.",
    "",
    "DEFINICIONES",
    "• Exactitud de estado: proporción de casos con deletion_status correcto. 32/32 = 100 %. Matriz de confusión: COMPLETE→COMPLETE 10, INCOMPLETE→INCOMPLETE 22.",
    "• F1 de pasos: los pasos se comparan como multiconjuntos de la tupla (phase, system_id, resource_id, operation, state, evidence_id), micro promediado. Precisión 99,5 %, recall 97,9 %, F1 98,7 %: 189 de 193 pasos encontrados y 1 sobrante.",
    "• Exactitud de secuencia: el array steps_json idéntico al oficial, incluyendo orden y step_no. 28/32 = 87,5 %.",
    "• Exactitud de orden relativo: en todos los casos, los pasos que comparten agente y respuesta aparecen en el mismo orden. 100 %.",
    "",
    "SIN MODELO",
    "Con --llm off (solo palabras clave y PDFs) las métricas de las muestras son idénticas: todas las muestras son solicitudes de borrado y ninguna depende de una captura. Por eso las capturas se validan con la tabla de casos de evaluación de la sección 5.",
    "",
    "CÓMO REPRODUCIR",
    "python code/evaluation/main.py --custom (o --llm off, o --model claude-opus-5-5).",
  ].join("\n"));
  const ev = [["100 %", "exactitud de estado", "32 de 32 casos con el estado correcto", C.accent1],
    ["98,7 %", "F1 de pasos", "precisión 99,5 % · recall 97,9 % · 189 de 193", C.accent1],
    ["87,5 %", "secuencia exacta", "28 de 32 arrays idénticos, orden y step_no incluidos", C.text2],
    ["100 %", "orden relativo", "los pasos compartidos siempre en el mismo orden", C.text2]];
  ev.forEach((e, i) => {
    const x = M + i * (lw + 0.25);
    box(s, x, 1.5, lw, 3.15, C.background2);
    txt(s, e[0], x + 0.25, 1.75, lw - 0.5, 1.0, { fontSize: 44, bold: true, color: e[3], fontFace: THEME.headFontFace });
    txt(s, e[1], x + 0.25, 2.85, lw - 0.5, 0.45, { fontSize: 17, bold: true });
    txt(s, e[2], x + 0.25, 3.35, lw - 0.5, 1.2, { fontSize: 14.5, color: C.text2 });
  });
  box(s, M, 4.95, CW, 1.4, C.background1, { line: "D3DCE1", lineW: 1 });
  iconCircle(s, "LuFlaskConical", M + 0.25, 5.27, 0.75, C.text2);
  txt(s, [{ text: "Sin modelo, el mismo resultado. ", options: { bold: true } }, { text: "Con --llm off las métricas de las muestras son idénticas: ninguna muestra depende de una captura y todas son de borrado. El aporte de Claude se mide en los casos de evaluación con capturas." }],
    M + 1.25, 4.95, CW - 1.5, 1.4, { fontSize: 15, color: C.text2, valign: "middle" });

  s = content("Precisión por campo y los 4 casos que fallan", [
    "QUÉ DECIR",
    "La exactitud por campo alinea cada paso oficial con el paso del agente del mismo (system_id, resource_id, phase) y compara campo por campo. Un paso oficial sin pareja cuenta como error en todos sus campos. Todos los campos están en 97,9 %; step_no baja a 95,3 % porque un paso que falta desplaza la numeración de los siguientes.",
    "",
    "LOS 4 CASOS QUE NO SON EXACTOS (y por qué no se pueden arreglar con los datos visibles)",
    "• case_03: se esperaba analytics_9406 y se predijo analytics_5589. Dos filas de analítica ya anonimizadas se trataron en la misma corrida del worker para dos solicitudes, y ninguna tiene identificadores en ningún archivo. Es un 50/50 genuino que se resuelve en un orden estable.",
    "• case_04: falta VERIFY_RECORD_ABSENT de account_004 con evidence_54. account_004 no aparece en ningún archivo ni evento visible.",
    "• case_18 y case_20: falta VERIFY_RECORD_PRESENT de audit_record_6645 y audit_record_5569. Esos ids no aparecen en ningún archivo visible.",
    "",
    "CÓMO DEFENDERLO",
    "No forcé reglas para acertar estos cuatro, porque eso sería sobreajustar a las muestras o adivinar etiquetas. Prefiero que el agente diga solo lo que la evidencia sostiene.",
  ].join("\n"));
  s.addChart(pres.charts.BAR, [{ name: "Exactitud", labels: ["step_no", "phase", "system_id", "resource_id", "operation", "state", "evidence_id"], values: [95.3, 97.9, 97.9, 97.9, 97.9, 97.9, 97.9] }],
    Object.assign(chartBase(), { x: M, y: 1.4, w: 5.6, h: 5.45, barDir: "bar", chartColors: [HX.accent1], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0\"%\"",
      showTitle: true, title: "Exactitud por campo (%)", valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 110, valGridLine: { style: "none" }, showLegend: false, catAxisOrientation: "maxMin", barGapWidthPct: 40, catAxisLabelFontFace: CODE }));
  const Rf = (t) => ({ text: t, options: { fontFace: CODE, fontSize: 12 } });
  table(s, [
    ["Caso", "Diferencia", "Por qué"],
    [Rf("case_03"), "analytics_9406 esperado, analytics_5589 predicho", "dos filas anonimizadas sin identificadores en la misma corrida: un 50/50"],
    [Rf("case_04"), "falta account_004 VERIFY_RECORD_ABSENT", "account_004 no aparece en ningún archivo ni evento visible"],
    [Rf("case_18"), "falta audit_record_6645 VERIFY_RECORD_PRESENT", "el id no aparece en ningún archivo visible"],
    [Rf("case_20"), "falta audit_record_5569 VERIFY_RECORD_PRESENT", "igual que case_18"],
  ], 6.5, 1.5, [1.05, 2.6, 2.58], { fontSize: 12.5, rowH: 0.82 });
  box(s, 6.5, 6.05, 6.23, 0.8, C.background2);
  txt(s, "No se forzaron reglas para acertarlos: sería sobreajustar a las muestras.", 6.7, 6.05, 5.9, 0.8, { fontSize: 13.5, color: C.text2, valign: "middle", bold: true });

  s = content("Casos de evaluación propios", [
    "QUÉ DECIR",
    "El enunciado pide al menos tres casos creados por el participante. Hay cuatro, en code/evaluation/custom_cases.json, y cada uno aísla un comportamiento. Su respuesta esperada se derivó solo de evidencia visible.",
    "",
    "• custom_01: acceso en español que rechaza el borrado. «¿Pueden enviarme una copia de los datos personales que tienen sobre mí? No quiero borrar la cuenta.» Prueba la intención: contiene «borrar» pero es NOT_APPLICABLE.",
    "• custom_02: baja de marketing en portugués para la persona de case_24. «Quero apenas deixar de receber e-mails promocionais. Não excluam minha conta.» Hay evidencia de esa persona, pero no debe usarse: NOT_APPLICABLE.",
    "• custom_03: case_12 reenviado desde el email antiguo minjun.kim90@gmail.com (audit_282). Prueba la identidad histórica: debe resolver user_12 y dar exactamente la respuesta oficial de case_12 (5 pasos).",
    "• custom_04: case_24 con audit_at movido del 15-09 al 18-09. Prueba el corte temporal en las dos direcciones: evidence_02 (capturada el 17-09) entra en la ventana y pasa a ser la cita de los dos hallazgos, y audit_record_7095 (documentado solo en evidence_02) entra en las verificaciones. 7 pasos esperados.",
    "",
    "RESULTADO",
    "4 de 4: estado 100 %, F1 de pasos 100 %, secuencia 100 %, todos los campos 100 %. custom_01 falló en la primera versión del respaldo por palabras clave y motivó la mejora n.º 9.",
  ].join("\n"));
  const cc = [
    ["custom_01", "Acceso que rechaza el borrado", "«… No quiero borrar la cuenta.» Contiene «borrar», pero no autoriza.", "NOT_APPLICABLE", "LuMessageSquareText", C.accent3],
    ["custom_02", "Baja de marketing en portugués", "«Não excluam minha conta.» Hay evidencia de la persona, pero no debe usarse.", "NOT_APPLICABLE", "LuMessageSquareText", C.accent3],
    ["custom_03", "Solicitud desde un email histórico", "case_12 desde minjun.kim90@gmail.com: debe resolver user_12 por audit_282.", "INCOMPLETE, 5 pasos", "LuFingerprint", C.accent1],
    ["custom_04", "audit_at más tarde", "case_24 con corte el 18-09: evidence_02 se vuelve citable y entra audit_record_7095.", "INCOMPLETE, 7 pasos", "LuClock", C.text2],
  ];
  cc.forEach((c, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = M + col * (CW / 2 + 0.12), y = 1.45 + row * 2.3, w = CW / 2 - 0.12;
    box(s, x, y, w, 2.1, C.background2);
    iconCircle(s, c[4], x + 0.2, y + 0.2, 0.6, c[5], c[5] === C.accent3 ? HX.dk1 : "FFFFFF");
    txt(s, [{ text: c[0] + "  ", options: { fontFace: CODE, bold: true, color: C.accent4, fontSize: 13 } }, { text: c[1], options: { bold: true, fontSize: 15.5 } }], x + 0.95, y + 0.2, w - 1.1, 0.6, { valign: "middle" });
    txt(s, c[2], x + 0.25, y + 0.95, w - 0.5, 0.65, { fontSize: 13.5, color: C.text2 });
    txt(s, [{ text: "esperado: ", options: { color: C.accent4 } }, { text: c[3], options: { fontFace: CODE, bold: true } }, { text: "   ✓ acertado", options: { color: C.accent1, bold: true } }], x + 0.25, y + 1.62, w - 0.5, 0.38, { fontSize: 12.5 });
  });
  box(s, M, 6.15, CW, 0.68, C.text1);
  txt(s, "4 de 4 casos propios exactos: estado, pasos, secuencia y cada campo al 100 %.", M + 0.3, 6.15, CW - 0.6, 0.68, { fontSize: 15, bold: true, color: C.background1, valign: "middle" });

  s = content("Fallos encontrados y mejoras", [
    "QUÉ DECIR",
    "El desarrollo fue iterativo contra las muestras públicas: cada fallo que mostraba el evaluador se convertía en una regla general (nunca en un caso especial). El gráfico muestra cómo subieron las secuencias exactas en las iteraciones donde se registró el puntaje.",
    "",
    "LAS 13 MEJORAS, EN UNA LÍNEA CADA UNA",
    "1. Deriva de réplicas: una foto primaria vacía más nueva ocultaba registros vivos en una réplica. Ahora una foto completa solo prueba la ausencia de lo que nada más muestra.",
    "2. Atribución por lotes: objetivos del worker sin identificadores se perdían o iban a la corrida vecina. Ahora hay ventanas por plantilla y solo son elegibles objetivos visibles en los archivos del caso.",
    "3. Perfiles intercambiados en una corrida (case_18, case_20): el resultado del worker debe coincidir con reported_status.",
    "4. Objetivos de analítica en corridas con fallos (case_09): «Policy action completed» no va a solicitudes cuya corrida reportó fallos. → 31/22.",
    "5. Faltaba el registro de auditoría retenido (casos 09, 23, 24, 29, 30): los retenidos ligados solo por evidencia posterior entran en las verificaciones futuras. → 31/26.",
    "6. Regresión de una corrida de una sola solicitud (case_04): una solicitud sin otra evidencia es dueña de respaldo. → 31/26.",
    "7. case_07 salía COMPLETE con un documento de identidad aún guardado, visible solo en un PDF: extracción con pypdf. → 32/27.",
    "8. Empate a tres entre perfiles invisibles (case_23): el anillo. → 32/28.",
    "9. «No quiero borrar la cuenta» leído como borrado (custom_01): negaciones primero, en siete idiomas.",
    "10. Solicitudes que solo tenían captura o PDF salían vacías: catálogo + visión.",
    "11. 12 filas dependían de PYTHONHASHSEED: bucles ordenados.",
    "12. Conexiones SQLite abiertas detectadas por las pruebas con warnings como errores: se cierran.",
    "13. Opus 5.5 rechaza thinking desactivado con un 400: se omite el campo en esos modelos.",
  ].join("\n"));
  s.addChart(pres.charts.LINE, [
    { name: "Estados correctos", labels: ["n.º 4", "n.º 5", "n.º 6", "n.º 7", "n.º 8", "n.º 11", "n.º 13"], values: [31, 31, 31, 32, 32, 32, 32] },
    { name: "Secuencias exactas", labels: ["n.º 4", "n.º 5", "n.º 6", "n.º 7", "n.º 8", "n.º 11", "n.º 13"], values: [22, 26, 26, 27, 28, 28, 28] },
  ], Object.assign(chartBase(), { x: M, y: 1.4, w: 6.2, h: 5.45, chartColors: [HX.accent1, HX.accent2], lineSize: 3, lineDataSymbol: "circle", lineDataSymbolSize: 9,
    showValue: true, dataLabelPosition: "t", valAxisMinVal: 15, valAxisMaxVal: 34, valAxisMajorUnit: 5, showLegend: true, legendPos: "b", legendFontSize: 12, legendColor: HX.dk1,
    showTitle: true, title: "Puntaje en las muestras (de 32) tras cada mejora", catAxisTitle: "mejora", showCatAxisTitle: false }));
  const imp = [["LuDatabase", "Deriva de réplicas", "una foto vacía ya no oculta una réplica"], ["LuWorkflow", "Atribución por lotes", "ventanas por plantilla y el anillo"],
    ["LuLock", "Retenidos posteriores", "entran en las verificaciones futuras"], ["LuFileSearch", "PDFs y catálogo", "documentos y capturas enlazados"],
    ["LuMessageSquareText", "Negaciones multilingües", "«no quiero borrar» ya no es borrado"], ["LuHash", "Orden determinista", "misma salida con cualquier semilla"]];
  imp.forEach((m, i) => {
    const y = 1.5 + i * 0.89;
    iconCircle(s, m[0], 7.15, y + 0.05, 0.55, i === 4 ? C.accent3 : C.text2, i === 4 ? HX.dk1 : "FFFFFF");
    txt(s, [{ text: m[1], options: { bold: true, fontSize: 15, breakLine: true } }, { text: m[2], options: { fontSize: 13, color: C.text2 } }], 7.9, y, 4.83, 0.85);
  });

  s = content("Resultado en las 518 solicitudes", [
    "QUÉ DECIR",
    "Así quedó output.csv para las 518 solicitudes de evaluación.",
    "",
    "ESTADOS",
    "355 INCOMPLETE (68,5 %), 153 COMPLETE (29,5 %) y 10 NOT_APPLICABLE (1,9 %, case_533 a case_542).",
    "",
    "PASOS",
    "3.257 pasos en total, 6,3 por caso de media y 14 como máximo. Hallazgos: 368 registros que quedan (REPORT_REMAINING_RECORD), 214 con PII expuesta, 113 flujos de datos activos y 26 riesgos de restauración. Cada hallazgo tiene su remediación: 368 DELETE_RECORD, 141 REDACT_RECORD, 73 ANONYMIZE_RECORD, 113 DISABLE_DATA_FLOW y 26 BLOCK_RESTORE.",
    "",
    "CALIDAD",
    "0 violaciones del contrato. 39 asignaciones de perfil quedaron ambiguas tras el anillo y están marcadas batch-guess en trace.jsonl. 39 pruebas unitarias y de regresión pasan en unos 3 segundos.",
    "",
    "SISTEMAS MÁS TOCADOS",
    "search_service (810 pasos), account_service (605), support_platform (477), security_service (421), integration_service (372), analytics_platform (337), backup_service (111), export_service (93).",
  ].join("\n"));
  s.addChart(pres.charts.DOUGHNUT, [{ name: "Estados", labels: ["INCOMPLETE", "COMPLETE", "NOT_APPLICABLE"], values: [355, 153, 10] }],
    Object.assign(chartBase(), { x: M, y: 1.4, w: 4.6, h: 4.3, chartColors: [HX.accent2, HX.accent1, HX.accent4], holeSize: 58, showValue: true, showPercent: false, showLegend: true, legendPos: "b", legendFontSize: 12, legendColor: HX.dk1,
      dataLabelColor: "FFFFFF", dataLabelFontSize: 13, dataLabelFontBold: true, showTitle: true, title: "Estados de las 518 solicitudes" }));
  s.addChart(pres.charts.BAR, [{ name: "Hallazgos", labels: ["REPORT_REMAINING_RECORD", "REPORT_EXPOSED_PII", "REPORT_ACTIVE_DATA_FLOW", "REPORT_RESTORE_RISK"], values: [368, 214, 113, 26] }],
    Object.assign(chartBase(), { x: 5.45, y: 1.4, w: 7.28, h: 4.3, barDir: "bar", chartColors: [HX.accent2], showValue: true, dataLabelPosition: "outEnd", catAxisLabelFontFace: CODE, catAxisLabelFontSize: 11,
      showTitle: true, title: "Hallazgos encontrados", valAxisHidden: true, valGridLine: { style: "none" }, showLegend: false, catAxisOrientation: "maxMin", barGapWidthPct: 45 }));
  const rs = [["3.257", "pasos (6,3 por caso, máx. 14)"], ["0", "violaciones del contrato"], ["39", "asignaciones batch-guess"], ["39", "pruebas en ~3 s"]];
  rs.forEach((r, i) => {
    const x = M + i * (lw + 0.25);
    box(s, x, 5.9, lw, 0.95, C.background2);
    const nw = 0.3 + 0.2 * r[0].length;
    txt(s, r[0], x + 0.2, 5.9, nw, 0.95, { fontSize: 24, bold: true, color: C.text2, fontFace: THEME.headFontFace, valign: "middle" });
    txt(s, r[1], x + 0.25 + nw, 5.9, lw - nw - 0.4, 0.95, { fontSize: 13, color: C.text2, valign: "middle" });
  });

  // ================================================================ 07
  sectionSlide("07", "Haiku 5.5 vs Opus 5.5", "Se repitió la corrida completa con el modelo grande para ver si cambiaba algo. No cambió nada, salvo el costo.", "LuGitCompare",
    "Sección 7. Un experimento de control: si el modelo pequeño se equivocara en la intención o en las capturas, el grande lo revelaría. Resultado: coinciden en todo.");

  s = content("Haiku vs Opus: misma salida, 40 veces el costo", [
    "QUÉ DECIR",
    "Toda la evaluación se corrió una segunda vez con claude-opus-5-5 en lugar de claude-haiku-5-5, con los mismos prompts y esquemas (python code/main.py --llm live --model claude-opus-5-5).",
    "",
    "LO QUE COINCIDE",
    "• Intención: los 398 textos con la misma decisión (388 autorizan borrar en ambos). Solo 2 etiquetas de request_type difieren, sin cambiar la decisión.",
    "• Capturas: las 11 con las mismas observaciones (recurso, presente, expuesto, activo, identificadores).",
    "• output.csv: 518 de 518 filas idénticas.",
    "• Muestras: 32/32, F1 98,7 %, 28/32 exactas en ambos. Casos propios: 4/4 en ambos.",
    "",
    "LO QUE CAMBIA",
    "• Costo: 0,0507 USD con Haiku contra 2,0085 USD con Opus, unas 40 veces más. Precios de lista por millón de tokens: Haiku 0,10 / 0,50 USD; Opus 4,00 / 20,00 USD (entrada / salida).",
    "• Tiempo: 582 s contra 1.193 s.",
    "• Tokens: prácticamente iguales (311.344 / 39.099 contra 311.753 / 38.075). En Opus los tokens de thinking van incluidos en la salida.",
    "",
    "POR QUÉ EL MODELO PEQUEÑO BASTA",
    "Las dos tareas del modelo son de percepción con una sola respuesta clara, y el núcleo determinista decide todo lo demás. Un modelo más grande no tiene nada que razonar mejor aquí. Haiku queda como predeterminado; las respuestas de Opus también están en caché, así que --model claude-opus-5-5 reproduce la comparación gratis.",
    "",
    "DETALLE TÉCNICO (mejora n.º 13)",
    "Opus 5.5 no acepta thinking desactivado (devuelve 400). llm.py omite el campo thinking en esos modelos (thinking adaptativo con esfuerzo bajo) y da 4.096 tokens extra de max_tokens. El resto sigue con thinking desactivado, así que las respuestas cacheadas de Haiku siguen valiendo.",
  ].join("\n"));
  s.addChart(pres.charts.BAR, [{ name: "Costo (USD)", labels: ["Haiku 5.5", "Opus 5.5"], values: [0.0507, 2.0085] }],
    Object.assign(chartBase(), { x: M, y: 1.4, w: 4.4, h: 5.45, barDir: "col", chartColors: [HX.accent1, HX.accent2], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "\"$\"0.00",
      showTitle: true, title: "Costo de las 409 llamadas (USD)", valAxisHidden: true, valGridLine: { style: "none" }, showLegend: false, barGapWidthPct: 60, catAxisLabelFontSize: 13 }));
  const okc = { text: "igual", options: { color: C.accent1, bold: true } };
  table(s, [
    ["", "Haiku 5.5", "Opus 5.5", "Coincidencia"],
    ["Llamadas", "409", "409", "iguales"],
    ["Tokens de entrada", "311.344", "311.753", "casi iguales"],
    ["Tokens de salida", "39.099", "38.075", "casi iguales"],
    ["Costo", { text: "$0,0507", options: { bold: true, color: C.accent1 } }, { text: "$2,0085", options: { bold: true, color: C.accent2 } }, "40 veces más"],
    ["Tiempo de la corrida", "582 s", "1.193 s", "2 veces más"],
    ["Decisión de intención", "388 / 398", "388 / 398", { text: "398 / 398", options: { color: C.accent1, bold: true } }],
    ["Lectura de capturas", "11", "11", { text: "11 / 11", options: { color: C.accent1, bold: true } }],
    ["Filas de output.csv", "518", "518", { text: "518 / 518", options: { color: C.accent1, bold: true } }],
    ["Muestras: estado · F1 · exactas", "32 · 98,7 % · 28", "32 · 98,7 % · 28", okc],
  ], 5.3, 1.5, [2.75, 1.55, 1.55, 1.58], { fontSize: 12.5, rowH: 0.46 });
  box(s, 5.3, 6.2, 7.43, 0.65, C.background2);
  txt(s, "Las dos tareas del modelo tienen una sola respuesta clara: el modelo pequeño basta.", 5.5, 6.2, 7.1, 0.65, { fontSize: 13.5, bold: true, color: C.text2, valign: "middle" });

  // ================================================================ 08
  sectionSlide("08", "Preparación para la entrevista", "Las decisiones de diseño y sus costos, los límites conocidos y las preguntas que probablemente hará el AI Judge.", "LuMic",
    "Sección 8. Repasa esta sección justo antes de la entrevista. El juez valora que sepas explicar por qué elegiste cada cosa y que reconozcas los límites con honestidad.");

  s = content("Decisiones de diseño y sus compromisos", [
    "QUÉ DECIR",
    "Seis decisiones que definen la solución, cada una con lo que gana y lo que cuesta.",
    "",
    "1. Núcleo determinista en vez de un agente LLM libre. Gana: reproducible, auditable, barato, sin alucinaciones en los pasos. Cuesta: los parsers están ajustados a los formatos vistos; un formato nuevo necesita un parser nuevo.",
    "2. Una sola estructura, Observation, para todos los formatos. Gana: el investigador y la política no dependen del formato; añadir un formato no toca el resto. Cuesta: hay que decidir en cada parser qué significa presente, expuesto y activo.",
    "3. Afirmación ≠ prueba. Gana: es el corazón del reto; ningún SUCCESS ni COMPLETE decide un estado. Cuesta: hay que encontrar una observación para todo, incluida la ausencia.",
    "4. Fusión conservadora en empates. Gana: ante la duda se reporta el dato (falso positivo) en vez de dejar un fantasma (falso negativo), lo correcto en privacidad. Cuesta: algún hallazgo de más (hubo 1 paso sobrante en las muestras).",
    "5. Caché por hash de cada llamada. Gana: misma salida sin clave, costo cero al repetir, el juez puede reproducirlo. Cuesta: cambiar un prompt invalida su caché.",
    "6. Validador antes de escribir. Gana: es imposible entregar en silencio una fila inválida o una evidencia posterior a audit_at. Cuesta: nada relevante.",
    "",
    "SI TE PREGUNTAN «¿POR QUÉ NO RAG O UN AGENTE CON HERRAMIENTAS?»",
    "Porque los datos son estructurados y muy regulares: las reglas explícitas puntuaron mejor y cuestan casi cero. El LLM aporta donde las reglas no llegan: lenguaje libre e imágenes.",
  ].join("\n"));
  const dd = [
    ["LuSigma", "Núcleo determinista", "Reproducible, auditable y barato. Costo: los parsers dependen de los formatos vistos.", C.accent1],
    ["LuLayers", "Una sola Observation", "Todos los formatos hablan el mismo idioma; añadir uno no toca el resto.", C.text2],
    ["LuScale", "Afirmación ≠ prueba", "Ningún SUCCESS ni COMPLETE decide un estado; solo lo observado.", C.text2],
    ["LuShieldCheck", "Empate conservador", "Ante la duda se reporta el dato: mejor un falso hallazgo que un fantasma.", C.accent2],
    ["LuArchive", "Caché por hash", "Misma salida sin clave y costo cero al repetir. Cambiar un prompt invalida su caché.", C.accent3],
    ["LuListChecks", "Validar antes de escribir", "Imposible entregar en silencio una fila inválida o una evidencia posterior.", C.accent6],
  ];
  dd.forEach((d, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = M + col * (cw3 + 0.25), y = 1.45 + row * 2.7;
    box(s, x, y, cw3, 2.5, C.background2);
    iconCircle(s, d[0], x + 0.25, y + 0.25, 0.65, d[3], d[3] === C.accent3 ? HX.dk1 : "FFFFFF");
    txt(s, d[1], x + 1.05, y + 0.25, cw3 - 1.2, 0.65, { fontSize: 16, bold: true, valign: "middle" });
    txt(s, d[2], x + 0.25, y + 1.1, cw3 - 0.5, 1.3, { fontSize: 15, color: C.text2 });
  });

  s = content("Límites conocidos y próximos pasos", [
    "QUÉ DECIR",
    "Reconocer los límites con datos concretos da más confianza que decir que todo es perfecto.",
    "",
    "LÍMITES",
    "• Empates de dos filas de analítica sin identificadores en una misma corrida: no se pueden resolver con la evidencia; se emparejan en orden estable (case_03).",
    "• 39 asignaciones de perfil en la evaluación siguen ambiguas después del anillo; son conjeturas marcadas batch-guess en la traza.",
    "• La lectura de capturas depende de la transcripción. Se validan identificadores y resource_id, pero un estado mal leído cambiaría el hallazgo. Las 11 transcripciones están en code/cache/llm/ para inspección, y Opus 5.5 dio las mismas.",
    "• Los parsers están hechos para los formatos de este dataset. Un formato de log nuevo no se reconocería sin un parser.",
    "• Algunos pasos oficiales mencionan recursos que no aparecen en ningún archivo visible (case_04, case_18, case_20); el agente no los inventa.",
    "",
    "PRÓXIMOS PASOS (si tuviera más tiempo)",
    "• Un parser de respaldo con LLM para formatos desconocidos, cuya salida pase por la misma validación de identificadores.",
    "• Una puntuación de confianza por recurso en la salida de la traza y una cola de revisión humana para las asignaciones batch-guess.",
    "• Más casos propios de borde: tombstones, retenciones legales, varias réplicas en conflicto.",
    "• Ejecución incremental: reprocesar solo los casos cuyos archivos cambiaron.",
  ].join("\n"));
  txt(s, "Límites", M, 1.45, 5.9, 0.45, { fontSize: 20, bold: true, color: C.accent2 });
  const lim = [
    "Dos filas de analítica sin identificadores en una corrida: 50/50 resuelto en orden estable.",
    "39 asignaciones de perfil ambiguas, marcadas batch-guess en la traza.",
    "La lectura de capturas depende de la transcripción; se validan ids e identificadores.",
    "Parsers ajustados a los formatos de este dataset.",
    "No se inventan recursos ausentes de la evidencia visible (case_04, 18, 20).",
  ];
  lim.forEach((l, i) => {
    const y = 2.05 + i * 0.95;
    iconCircle(s, "LuTriangleAlert", M, y + 0.05, 0.5, C.accent2);
    txt(s, l, M + 0.7, y, 5.2, 0.85, { fontSize: 14, color: C.text1, valign: "middle" });
  });
  box(s, 6.85, 1.45, 5.88, 5.4, C.background2);
  txt(s, "Próximos pasos", 7.1, 1.6, 5.4, 0.45, { fontSize: 20, bold: true, color: C.accent1 });
  const nxt = [
    "Parser de respaldo con LLM para formatos desconocidos, con la misma validación.",
    "Confianza por recurso y cola de revisión humana para los batch-guess.",
    "Más casos propios de borde: tombstones, retenciones legales, réplicas en conflicto.",
    "Ejecución incremental: solo los casos cuyos archivos cambiaron.",
  ];
  nxt.forEach((l, i) => {
    const y = 2.2 + i * 1.1;
    iconCircle(s, "LuLightbulb", 7.1, y + 0.05, 0.5, C.accent1);
    txt(s, l, 7.8, y, 4.75, 0.95, { fontSize: 14, color: C.text1, valign: "middle" });
  });

  s = content("Preguntas probables del AI Judge", [
    "RESPUESTAS AMPLIADAS",
    "",
    "¿Dónde está la IA y por qué tan poca? → En la intención (398 textos) y en la lectura de 11 capturas. Es lo único que requiere percepción. El resto son reglas verificables, y eso hace que cada paso tenga una evidencia concreta y que la salida sea reproducible. Opus dio la misma salida, lo que confirma que el modelo no es el cuello de botella.",
    "",
    "¿Cómo evitas usar evidencia del futuro? → in_window exige requested_at ≤ captured_at ≤ audit_at y ts ≤ audit_at. Además el validador rechaza cualquier cita capturada después de audit_at. Lo posterior solo añade verificaciones futuras de registros retenidos, sin citarse. custom_04 lo prueba.",
    "",
    "¿Cómo encuentras datos de un email antiguo? → user_audit_log reconstruye emails, teléfonos y hashes anteriores; además se calcula el sha256 de cada email. En case_12 la copia de contacto solo aparece con el hash del email viejo. custom_03 lo prueba enviando la solicitud desde el email antiguo.",
    "",
    "¿Qué pasa si no hay API key o la API falla? → Modo auto o cache: se reproducen las respuestas guardadas y la salida es idéntica. Modo off: palabras clave y solo PDFs; la salida sigue siendo válida. Si una llamada falla tres veces, se cae al respaldo y se cuenta como fallo en usage.json (fueron 0).",
    "",
    "¿Cómo sabes que funciona? → 32 muestras (100 % de estados, 98,7 % F1), 4 casos propios al 100 %, 39 pruebas que incluyen regresión byte a byte, 0 violaciones del contrato y la comparación con Opus.",
    "",
    "¿Cuánto cuesta? → 0,0507 USD para 518 solicitudes, unos 0,0001 USD por solicitud (676 tokens de media). Repetir cuesta 0.",
    "",
    "¿Usaste las respuestas de las muestras para predecir? → No. Se usaron para medir e iterar. No hay etiquetas fijadas ni reglas por caso; las mejoras son reglas generales y el código no lee sample_output.csv al predecir.",
  ].join("\n"));
  const qa = [
    ["¿Dónde está la IA?", "Solo en intención y capturas: lo que requiere percepción. El resto es verificable."],
    ["¿Cómo evitas la evidencia futura?", "La ventana in_window y un validador que rechaza citas posteriores a audit_at."],
    ["¿Y los emails antiguos?", "user_audit_log + sha256 de cada email. Lo prueban case_12 y custom_03."],
    ["¿Sin API key?", "Caché: salida idéntica. Modo off: palabras clave y PDFs, salida válida."],
    ["¿Cómo sabes que funciona?", "32/32 estados, 98,7 % F1, 4/4 propios, 39 pruebas, 0 violaciones."],
    ["¿Cuánto cuesta?", "$0,05 por las 518 solicitudes; repetir cuesta cero."],
  ];
  qa.forEach((q, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = M + col * (CW / 2 + 0.12), y = 1.45 + row * 1.8, w = CW / 2 - 0.12;
    box(s, x, y, w, 1.6, C.background2);
    iconCircle(s, "LuCircleHelp", x + 0.2, y + 0.2, 0.55, C.text2);
    txt(s, q[0], x + 0.95, y + 0.2, w - 1.1, 0.55, { fontSize: 16, bold: true, valign: "middle" });
    txt(s, q[1], x + 0.95, y + 0.78, w - 1.15, 0.78, { fontSize: 14.5, color: C.text2 });
  });

  // ---------------------------------------------------------------- cierre
  newSection("Cierre");
  s = pres.addSlide({ masterName: "PORTADA", sectionTitle: section });
  s.addText("En resumen", { placeholder: "title" });
  s.addText("No confía en lo que dicen los sistemas: reconstruye lo que existe, aplica la política y prueba cada paso con evidencia.", { placeholder: "body" });
  s.addText("Entrega: https://www.hackerrank.com/contests/hackerrank-orchestrate-october26/challenges/ghost-data-still-exists", { placeholder: "kicker" });
  const sum = [["LuFingerprint", "Identidad completa", "actual e histórica"], ["LuClock", "Estado en audit_at", "la última observación válida"], ["LuScale", "Política y orden", "15 reglas, pasos verificados"]];
  sum.forEach((m, i) => {
    const y = 1.6 + i * 1.45;
    iconCircle(s, m[0], 9.45, y, 0.8, i === 1 ? C.accent2 : C.accent1);
    txt(s, [{ text: m[1], options: { bold: true, fontSize: 17, color: C.background1, breakLine: true } }, { text: m[2], options: { fontSize: 13.5, color: C.accent5 } }], 10.4, y - 0.02, 2.33, 0.9, { valign: "middle" });
  });
  s.addNotes([
    "CIERRE EN TRES FRASES",
    "1. El agente reconstruye la identidad completa de la persona, actual e histórica.",
    "2. Determina el estado real de cada copia a la hora audit_at con la última observación válida, sin creer en estados reportados.",
    "3. Aplica las 15 reglas y produce un plan ordenado y validado, donde cada hallazgo cita su evidencia.",
    "",
    "CIFRAS PARA RECORDAR",
    "32/32 estados, F1 de pasos 98,7 %, 28/32 secuencias exactas, 4/4 casos propios, 0 violaciones del contrato, 0,05 USD por las 518 solicitudes, Opus idéntico a 40 veces el costo.",
    "",
    "ENLACES",
    "Entrega en HackerRank: https://www.hackerrank.com/contests/hackerrank-orchestrate-october26/challenges/ghost-data-still-exists",
    "Guía de la entrevista (documento de Claude): https://claude.ai/artifact/6g5UpBjJ6V7mDb7W2Ck38x",
    "Código: OBaruch/hackerrank-orchestrate-october26, rama main.",
  ].join("\n"));
}

(async () => {
  await renderIcons();
  defineLayouts();
  build();
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
