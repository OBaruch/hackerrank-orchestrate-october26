"""Builds discurso_ghost_data.pdf: the public speech presenting the tool."""
import os

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, Frame, KeepTogether, NextPageTemplate,
                                PageBreak, PageTemplate, Paragraph, Spacer, Table,
                                TableStyle)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "discurso_ghost_data.pdf")
FONTS = "/usr/share/fonts/truetype/crosextra"

for fam, base in (("Head", "Caladea"), ("Body", "Carlito")):
    pdfmetrics.registerFont(TTFont(fam, f"{FONTS}/{base}-Regular.ttf"))
    pdfmetrics.registerFont(TTFont(fam + "-B", f"{FONTS}/{base}-Bold.ttf"))
    pdfmetrics.registerFont(TTFont(fam + "-I", f"{FONTS}/{base}-Italic.ttf"))
    pdfmetrics.registerFont(TTFont(fam + "-BI", f"{FONTS}/{base}-BoldItalic.ttf"))
    pdfmetrics.registerFontFamily(fam, normal=fam, bold=fam + "-B",
                                  italic=fam + "-I", boldItalic=fam + "-BI")

DK = HexColor("#16212C")
DK2 = HexColor("#24425A")
TEAL = HexColor("#0F8A80")
CORAL = HexColor("#D9512C")
AMBER = HexColor("#F0A92B")
LIGHT = HexColor("#EEF3F5")
MINT = HexColor("#8ED6CC")
SLATE = HexColor("#5E7385")
WHITE = HexColor("#FFFFFF")

PW, PH = letter
M = 0.95 * inch

body = ParagraphStyle("body", fontName="Body", fontSize=13.5, leading=21,
                      textColor=DK, spaceAfter=11)
cue = ParagraphStyle("cue", parent=body, fontSize=10.5, leading=14, textColor=SLATE,
                     alignment=TA_RIGHT, spaceAfter=0)
sec_num = ParagraphStyle("secnum", fontName="Body-B", fontSize=10, leading=12,
                         textColor=TEAL, spaceAfter=0)
sec_title = ParagraphStyle("sectitle", fontName="Head-B", fontSize=21, leading=25,
                           textColor=DK, spaceAfter=0)
h1 = ParagraphStyle("h1", fontName="Head-B", fontSize=24, leading=29, textColor=DK,
                    spaceAfter=14)
small = ParagraphStyle("small", fontName="Body", fontSize=11, leading=15, textColor=DK)
small_b = ParagraphStyle("smallb", parent=small, fontName="Body-B")
q_style = ParagraphStyle("q", fontName="Body-B", fontSize=12, leading=16, textColor=DK2,
                         spaceAfter=2)
a_style = ParagraphStyle("a", fontName="Body", fontSize=11.5, leading=16, textColor=DK,
                         spaceAfter=10)

PAUSA = '<font name="Body-I" color="#D9512C">[pausa]</font>'


def p(text):
    return Paragraph(text.replace("[pausa]", PAUSA), body)


def quote(text):
    st = ParagraphStyle("quote", parent=body, fontName="Body-I", textColor=DK2,
                        leftIndent=18, borderPadding=(2, 0, 2, 12))
    return Paragraph(text, st)


def section(num, title, time, slides, paragraphs):
    head = Table(
        [[[Paragraph(f"PARTE {num}", sec_num), Paragraph(title, sec_title)],
          Paragraph(f'<font name="Body-B" color="#0F8A80">{time}</font><br/>{slides}', cue)]],
        colWidths=[PW - 2 * M - 1.9 * inch, 1.9 * inch])
    head.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("LINEBELOW", (0, 0), (-1, 0), 1.2, MINT),
    ]))
    flow = [head, Spacer(1, 12)]
    first = [flow[0], flow[1], paragraphs[0]]
    return [KeepTogether(first)] + list(paragraphs[1:]) + [Spacer(1, 14)]


SECTIONS = [
    ("1", "Apertura", "0:00", "Diapositiva 1", [
        p("Buenas tardes. Quiero empezar con una pregunta."),
        p("Imaginen que le piden a una tienda en línea que borre todos sus datos. Dos semanas "
          "después les llega un correo: <b>«Su solicitud de borrado se completó»</b>. [pausa]"),
        p("¿Cuántos de ustedes lo creerían? [pausa]"),
        p("Yo también lo creería. Y ese es justo el problema."),
    ]),
    ("2", "El problema: los datos fantasma", "0:30", "Diapositiva 5", [
        p("Un dato personal casi nunca vive en un solo lugar. Su correo está en la base de datos "
          "de cuentas, pero también en una réplica, en un índice de búsqueda, en un ticket de "
          "soporte, en un archivo exportado, en un reporte de analítica y en un respaldo de hace "
          "tres meses."),
        p("Cuando el sistema dice «completo», normalmente quiere decir que <b>un</b> proceso "
          "terminó. No que <b>todas</b> las copias desaparecieron. Y hay procesos vivos, como una "
          "sincronización o la restauración de un respaldo, que pueden volver a crear el dato que "
          "ya se había borrado."),
        p("A eso le llamamos <b>datos fantasma</b>: datos que, según el sistema, ya no existen… "
          "pero siguen ahí. [pausa]"),
    ]),
    ("3", "Qué hace la herramienta", "1:15", "Diapositiva 2", [
        p("<b>Ghost Data Still Exists</b> es un auditor de borrados. No borra nada: "
          "<b>verifica</b>. Para cada solicitud responde cinco preguntas."),
        p("<b>Primero</b>, ¿la persona de verdad pidió borrar? Porque «quiero una copia de mis "
          "datos» no es lo mismo que «borren mi cuenta»."),
        p("<b>Segundo</b>, ¿quién es esta persona, incluidos sus correos y teléfonos "
          "anteriores?"),
        p("<b>Tercero</b>, ¿dónde quedan sus datos en el momento exacto de la auditoría?"),
        p("<b>Cuarto</b>, ¿qué exige la política para cada copia: borrarla, ocultar los "
          "identificadores, anonimizarla o conservarla?"),
        p("Y <b>quinto</b>, el veredicto: completo o incompleto, con un plan de pasos ordenado "
          "y las pruebas que deben pasar después."),
    ]),
    ("4", "Cómo lo hace", "2:15", "Diapositivas 13, 21 y 23", [
        p("El principio es uno solo: <b>no confiamos en lo que dicen los sistemas; "
          "reconstruimos lo que existe.</b>"),
        p("La herramienta lee 94 archivos de evidencia en seis formatos: registros de "
          "actividad, copias de bases de datos, archivos JSON, textos, PDFs y capturas de "
          "pantalla. Todo lo convierte en el mismo tipo de observación: en tal sistema, a tal "
          "hora, este registro estaba presente o ausente. Y solo cuenta lo que pasó antes de la "
          "hora de la auditoría. Nada del futuro."),
        p("Les doy dos ejemplos del reto."),
        p("En el primero, la persona escribió desde un correo que ya no usaba. La copia que "
          "quedaba en analítica no tenía su correo actual: tenía la huella del correo "
          "<b>anterior</b>, lo que en técnico llamamos un <i>hash</i>. Si solo buscas el correo "
          "de hoy, nunca la encuentras."),
        p("En el segundo, la base de datos principal ya no tenía la fila del cliente, pero la "
          "réplica de contingencia sí. El sistema decía «borrado». La réplica decía otra cosa. "
          "[pausa]"),
    ]),
    ("5", "Dónde está la inteligencia artificial", "3:30", "Diapositivas 30 y 31", [
        p("¿Y dónde está la inteligencia artificial? Justo donde hace falta percibir, y en "
          "ningún otro lugar."),
        p("Claude hace dos tareas. La primera es leer la intención del mensaje, en varios "
          "idiomas. Por ejemplo:"),
        quote("«¿Pueden enviarme una copia de los datos personales que tienen sobre mí? "
              "No quiero borrar la cuenta.»"),
        p("Tiene la palabra «borrar», pero no es una solicitud de borrado. La segunda tarea es "
          "leer capturas de pantalla de consolas internas, igual que lo haría una persona."),
        p("Todo lo demás, qué copia existe, qué regla aplica y en qué orden se corrige, lo "
          "deciden <b>reglas explícitas que cualquiera puede revisar</b>. El modelo nunca escribe "
          "un paso ni elige una evidencia. En privacidad, cada decisión tiene que poder "
          "explicarse ante un auditor."),
    ]),
    ("6", "Resultados", "4:30", "Diapositivas 35, 39 y 41", [
        p("¿Funcionó? En las 32 muestras públicas del reto acertamos el veredicto en "
          "<b>las 32</b>, y encontramos 189 de los 193 pasos esperados."),
        p("Después corrimos las 518 solicitudes. Según nuestra auditoría, de las 254 que el "
          "sistema daba por completas, <b>163 todavía tenían datos</b>. Casi dos de cada tres. "
          "[pausa] Y donde más se escondían era en el servicio de búsqueda."),
        p("También pasó lo contrario: 26 solicitudes marcadas «sin iniciar» en realidad ya "
          "estaban limpias. El estado reportado falla en las dos direcciones."),
        p("¿Cuánto costó? <b>Cinco centavos de dólar</b> por las 518 solicitudes, con el modelo "
          "más pequeño. Lo repetimos con el modelo más grande: la salida fue idéntica, fila por "
          "fila, y costó cuarenta veces más. La lección: usen el modelo más pequeño que haga "
          "bien el trabajo."),
    ]),
    ("7", "Cierre", "5:30", "Diapositiva 46", [
        p("Borrar un dato no es apretar un botón. [pausa] Es poder <b>demostrar</b> que ya no "
          "existe en ningún lugar, y que nada lo va a traer de vuelta."),
        p("Eso hace esta herramienta: no confía en lo que dicen los sistemas, reconstruye lo que "
          "existe y prueba cada paso con evidencia."),
        p("Muchas gracias."),
    ]),
]

STATS = [
    ("32 / 32", "veredictos correctos en las muestras públicas"),
    ("189 / 193", "pasos esperados encontrados (F1 de 98,7 %)"),
    ("163 / 254", "«completos» que aún tenían datos"),
    ("518", "solicitudes auditadas, 0 errores de formato"),
    ("$0,05", "costo de Claude Haiku 5.5 por las 518"),
    ("40×", "costo con Opus 5.5, misma salida"),
]

QA = [
    ("¿Por qué no dejar que el modelo decida todo?",
     "Porque cada paso tiene que poder explicarse con una evidencia. Las reglas son "
     "reproducibles y auditables; el modelo solo lee lo que hace falta percibir."),
    ("¿Cómo saben qué pasó a la hora de la auditoría?",
     "Cada caso tiene una hora de corte. Solo se usa evidencia capturada entre la solicitud y "
     "esa hora, y un validador rechaza cualquier cita posterior."),
    ("¿Y si la persona cambió de correo?",
     "Se reconstruye su identidad con el historial de cambios y la huella (hash) de cada "
     "correo. Así aparecen copias que solo tienen el correo viejo."),
    ("¿Funciona sin conexión al modelo?",
     "Sí. Las respuestas del modelo quedan en caché y la salida se repite idéntica. Sin caché, "
     "un respaldo por palabras clave mantiene la salida válida."),
]


def cover(c, doc):
    c.saveState()
    c.setFillColor(DK)
    c.rect(0, 0, PW, PH, stroke=0, fill=1)
    c.setFillColor(DK2)
    c.circle(PW - 2.1 * inch, PH - 3.1 * inch, 1.45 * inch, stroke=0, fill=1)
    c.drawImage(os.path.join(HERE, "ghost.png"), PW - 2.95 * inch, PH - 3.95 * inch,
                1.7 * inch, 1.7 * inch, mask="auto")
    c.setFillColor(MINT)
    c.setFont("Body-B", 11)
    c.drawString(M, PH - 5.35 * inch, "DISCURSO DE PRESENTACIÓN")
    c.setFillColor(WHITE)
    c.setFont("Head-B", 40)
    c.drawString(M, PH - 6.0 * inch, "Ghost Data")
    c.drawString(M, PH - 6.6 * inch, "Still Exists")
    c.setFillColor(MINT)
    c.setFont("Body", 16)
    c.drawString(M, PH - 7.1 * inch, "El auditor que comprueba si un borrado de datos de verdad")
    c.drawString(M, PH - 7.38 * inch, "se completó.")
    c.setFillColor(WHITE)
    c.setFont("Body", 11)
    c.drawString(M, M + 0.5 * inch, "Duración: unos 6 minutos · 7 partes · unas 850 palabras")
    c.drawString(M, M + 0.25 * inch, "HackerRank Orchestrate · Octubre 2026")
    c.restoreState()


def page(c, doc):
    c.saveState()
    c.setFont("Body", 9)
    c.setFillColor(SLATE)
    c.drawString(M, 0.55 * inch, "Ghost Data Still Exists · Discurso de presentación")
    c.drawRightString(PW - M, 0.55 * inch, str(doc.page))
    c.restoreState()


def how_to_box():
    rows = [
        [Paragraph("Cómo leer este guion", small_b)],
        [Paragraph("<b>Negritas</b>: palabras para enfatizar con la voz.", small)],
        [Paragraph(f"{PAUSA}: silencio de unos dos segundos. Mira al público.", small)],
        [Paragraph("A la derecha de cada título: el minuto en que debería empezar esa parte y la "
                   "diapositiva de <i>ghost_data_solucion.pptx</i> que puedes mostrar.", small)],
    ]
    t = Table(rows, colWidths=[PW - 2 * M])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
        ("LEFTPADDING", (0, 0), (-1, -1), 14), ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, 0), 12), ("BOTTOMPADDING", (0, -1), (-1, -1), 12),
        ("TOPPADDING", (0, 1), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -2), 3),
        ("LINEBEFORE", (0, 0), (0, -1), 3, TEAL),
    ]))
    return t


def stats_table():
    big = ParagraphStyle("big", fontName="Head-B", fontSize=22, leading=26, textColor=TEAL)
    lab = ParagraphStyle("lab", fontName="Body", fontSize=10.5, leading=13.5, textColor=DK)
    cells = [[Paragraph(n, big), Spacer(1, 4), Paragraph(t, lab)] for n, t in STATS]
    w = (PW - 2 * M - 2 * 10) / 3
    data = [cells[0:3], cells[3:6]]
    t = Table(data, colWidths=[w] * 3, rowHeights=[1.05 * inch] * 2)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("LINEAFTER", (0, 0), (1, -1), 5, WHITE),
        ("LINEBELOW", (0, 0), (-1, 0), 5, WHITE),
    ]))
    return t


def build():
    doc = BaseDocTemplate(OUT, pagesize=letter, leftMargin=M, rightMargin=M,
                          topMargin=0.9 * inch, bottomMargin=0.95 * inch,
                          title="Ghost Data Still Exists · Discurso de presentación",
                          author="Baruch", subject="Discurso para presentar la herramienta")
    frame = Frame(M, 0.95 * inch, PW - 2 * M, PH - 1.85 * inch, id="f",
                  leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[frame], onPage=cover),
        PageTemplate(id="body", frames=[frame], onPage=page),
    ])

    story = [NextPageTemplate("body"), PageBreak()]
    story += [Paragraph("El discurso", h1), how_to_box(), Spacer(1, 22)]
    for sec in SECTIONS:
        story += section(*sec)

    story += [PageBreak(), Paragraph("Para tener a mano", h1),
              Paragraph("Las cifras que vale la pena recordar, por si te piden repetirlas.",
                        ParagraphStyle("lead", parent=body, textColor=SLATE)),
              Spacer(1, 4), stats_table(), Spacer(1, 26),
              Paragraph("Si el público pregunta", ParagraphStyle(
                  "h2", fontName="Head-B", fontSize=17, leading=21, textColor=DK,
                  spaceAfter=10))]
    for q, a in QA:
        story += [KeepTogether([Paragraph(q, q_style), Paragraph(a, a_style)])]
    doc.build(story)
    print("wrote", OUT)


if __name__ == "__main__":
    build()
