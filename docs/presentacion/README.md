# Material de presentación

Material en español para explicar la solución Ghost Data Still Exists. Nada de esta carpeta participa en la ejecución del agente ni en `code.zip`.

| Archivo | Qué es |
| --- | --- |
| `ghost_data_solucion.pptx` | Presentación de 46 diapositivas con notas del orador: flujo de datos, flujo del usuario, tecnologías, recorrido del código y pseudocódigo |
| `discurso_ghost_data.pdf` | Discurso para presentar la herramienta ante el público |
| `ensayo_tecnico.md` | Ensayo técnico para preparar la entrevista (exportado del documento original) |
| `build_deck.js`, `package.json` | Generador de la presentación (pptxgenjs) |
| `build_speech.py`, `ghost.png`, `build_icon.js` | Generador del discurso (reportlab) y del ícono que usa |

## Regenerar

Presentación (Node 18 o superior):

```bash
cd docs/presentacion
npm install
PPTX_SKILL_DIR=/ruta/al/skill/pptx node build_deck.js
```

`PPTX_SKILL_DIR` apunta al skill `pptx` que trae `scripts/apply_theme.js`, que escribe la paleta del tema. Sin esa variable el archivo se genera igual, con los colores de tema por defecto de Office.

Discurso (Python 3 con `reportlab`, y las fuentes Carlito y Caladea en `/usr/share/fonts/truetype/crosextra`):

```bash
cd docs/presentacion
pip install reportlab
python build_speech.py
```

Para volver a dibujar el ícono: `node build_icon.js ghost.png` (usa `react`, `react-dom`, `react-icons` y `sharp`, que instala `npm install`).
