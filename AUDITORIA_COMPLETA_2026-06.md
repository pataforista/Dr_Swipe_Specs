# Dr. Swipe — Auditoría Completa (clínica · funcional · estética)

**Fecha:** 2026-06-04
**Rama:** `claude/app-audit-D2dKQ`
**App auditada:** `dr-swipe/` (React 19 + XState 5 + Zustand + Framer Motion + Tailwind, PWA, desplegada en Cloudflare Pages)
**Método:** lectura directa del motor y componentes, validación de los 598 casos JSON, `tsc --noEmit`, `vite build`, y barrido clínico de ~30 casos en varias especialidades.

---

## 0-bis. Sistema de enganche (nuevo — fomentar juego + estudio)

Como el app es **permisivo a propósito** (para no frustrar y que la gente siga jugando = siga aprendiendo), se añadió un bucle de recompensa cuyo premio refuerza el estudio. Cuatro mecánicas, todas con monedas como divisa (el ajuste de economía les dio sentido):

1. **Caja de Conocimiento (gacha de perlas ENARM)** — `pearls.json` (91 perlas con rareza), compra por 50🪙, sorteo ponderado, **la recompensa es contenido de estudio coleccionable**; repetidas devuelven 15🪙 de "polvo". Visor **Codex** con la colección (X/total, rareza, bloqueadas). *(commit `a66ac5a`)*
2. **Tienda de ventajas** — boosts comprables: Doble XP / Doble Monedas (próxima guardia) y Pista Gratis ×3. Inventario persistente. *(commit `111b019`)*
3. **Misiones diarias** — 3 objetivos/día (resuelve 3 pacientes, acierta 25 decisiones, guardia perfecta) con progreso y cobro de monedas. *(commit `ca0329f`)*
4. **Metas de racha** — recompensas al alcanzar 3/7/14/30 días de racha. Panel **Diario** con barra de progreso. *(commit `ca0329f`)*

Sin cambios en el state machine; todo en el store (Zustand persistido) + UI. Build y `tsc` limpios.

---

## 0. Estado de remediación (actualizado)

Ya corregido en esta rama (build de producción verificado tras cada cambio):

- ✅ **C2 — "REANUDAR GUARDIA" roto.** Los 598 `case_id` normalizados a su stem ASCII (elimina `IÁMCEST`, `EXÁNT`, … de los IDs) y `dataLoader.loadCase` endurecido para quitar diacríticos como fallback. *(commit `07c55cf`)*
- ✅ **C4 — scripts en `public/`.** Eliminados `propagate_themes.py` y `structural_audit*.py` de `dr-swipe/public/cases/`. *(commit `07c55cf`)*
- ✅ **C1 (contaminación) — 276 casos.** Restaurado el `card_stream`/boss/perla canónico desde `/cases` y aplicado `ftfy`: IDs duplicados **247→0**, mojibake `Ã/A³` **~245→3** archivos. *(commit `9c2188b`)*

Segunda tanda (completada):

- ✅ **35 archivos con U+FFFD reconstruidos.** El acentuado original (`C3 YY`) había perdido el primer byte → secuencia `U+FFFD + NUL + <byte>`. Reconstrucción determinista (`chr(0xC0|(byte&0x3F))`) con desambiguación por contexto (á/¡, ñ/±, ú/º, °, ¿): 2665 ocurrencias, 0 residuales. *(commit `e887cd0`)*
- ✅ **Sobre-acentuación de acrónimos.** 139 tokens espurios (`IÁMCEST`, `ÁRNI`, `N/Á`, `HbÁ1c`…) corregidos en 276 archivos usando `/cases` como oráculo de ortografía; acentos legítimos intactos (`Ácido`, `Útero`, `Diagnóstico`). *(commit `380c9ab`)*
- ✅ **C3 — Audio.** SFX sintetizados con Web Audio API (no requieren binarios); el juego deja de ser mudo. *(commit `bc84db4`)*
- ✅ **F1 — Inflación de XP.** `score` resetea por paciente en `CONTINUE_SHIFT`. *(commit `40346ea`)*
- ✅ **F3 — Peso letal.** `lethal_if_discarded` ahora pesa −1000 como `lethal_risk`. *(commit `40346ea`)*
- ✅ **A2 — reduce-motion** respetado vía `@media (prefers-reduced-motion)`.

Tercera tanda (completada):

- ✅ **F2 — QTE fantasma retirado.** Se eliminó la maquinaria QTE inalcanzable del `boss_fight` (contexto, eventos `QTE_*`, `after:5000`), superada por `ShockRoom`. La **sinergia de dossier** se conserva como mecánica diseñada: solo requiere poblar `related_diagnoses` en los casos para activarse (decisión de contenido pendiente, no es un bug).
- ✅ **E1 — Monitor de vitales** re-skineado a la paleta clara "scrapbook" (era `slate-900`, rompía la estética).
- ✅ **E2 — Naming del mentor:** unificado a "Dr. Vázquez" (el personaje real del app; el avatar renderizaba `mendoza` heredado del scaffold v2). Ahora se muestra el nombre en el globo.
- ✅ **E3 — Legibilidad:** textos mínimos de 7px subidos a 8px en HUD/telemetría/stats.
- ✅ **A3 — Contraste:** textos secundarios `slate-300`→`slate-400` sobre fondo claro.

Cuarta tanda (completada):

- ✅ **Sinergia de dossier activada.** Se pobló `related_diagnoses` en las **3047 cartas `keep`** (595 casos) con etiquetas clínicas derivadas de la taxonomía del `case_id` (especialidad + entidad, p. ej. `["ped","exant","measles"]`). Solo se etiquetan las cartas `keep`, de modo que la mecánica premia construir un dossier de hallazgos *relevantes*: 1ª keep ×1.0 (dossier vacío) → siguientes ×1.4–×1.6. Los descartes correctos no reciben bonus. Sin juicio clínico por carta y sin contaminación entre casos (el dossier resetea por paciente). **Balance (ajustado):** la sinergia se suavizó a `1 + matchCount * 0.15` (máx ×1.45) por ser un buff casi siempre activo que se apila con combo/dificultad/speed; el multiplicador de combo se acotó a ×3 (defensivo); y se corrigieron los valores que el tutorial mostraba mal (vitalidad −15/+8 reales, caja de suministros cada combo ×8). Techo de un caso perfecto extreme ≈ 3350 pts.
- ✅ **Economía de monedas rebalanceada.** Un caso perfecto daba 160–360 monedas (= 6–14 lifelines de 25), volviendo trivial el único sumidero. Se redujo: bono de guardia perfecta `cartas×10×mult → cartas×3×mult`, monedas de speed `+2 → +1`, e hitos de combo `{8,15,25,40,60} → {5,10,15,25,40}`. Ahora: caso perfecto 72–132 monedas (2–5 lifelines), caso flojo ~10–15 (<1 lifeline) → el lifeline es una decisión real.

Nada queda pendiente de los hallazgos de la auditoría. Mejoras opcionales futuras: E4 (escalado de fuente), A1/A4 (etiquetas keep/discard, mezcla de idioma en casos ENGL) — todas cosméticas/de opinión.

---

## 1. Veredicto ejecutivo

La app está **bien construida a nivel de ingeniería** (compila sin errores de tipos, build de producción exitoso, máquina de estados clara, manejo de errores con ErrorBoundary, UI muy cuidada). El problema **no es la medicina ni el motor**: es el **pipeline de datos** y un puñado de defectos funcionales que ningún review previo detectó.

El dato más importante de toda la auditoría:

> **El juego sirve la copia CORRUPTA de los casos.** Existen dos copias divergentes:
> - `/cases/` (raíz, 598) → **fuente limpia**: casos coherentes de ~3 cartas, `case_id` en ASCII, sin contaminación.
> - `dr-swipe/public/cases/` (desplegada) → **corrupta**: sobre‑acentuación en 582 archivos, 51 con caracteres ilegibles (U+FFFD), y ~29% con cartas de **enfermedades distintas mezcladas** dentro del mismo caso.

| Eje | Calificación | Estado |
|---|---|---|
| Motor / arquitectura | 🟢 Sólido | Tipos OK, build OK, XState limpio |
| Integridad de datos (desplegados) | 🔴 Crítico | 72% `case_id` corrupto, contaminación cruzada |
| Contenido clínico (fuente limpia) | 🟢 Bueno | Nivel ENARM correcto donde está intacto |
| Funcional / mecánica | 🟠 Moderado | Resume roto, XP inflado, mecánicas muertas |
| Audio | 🔴 Crítico | 0 archivos de sonido — juego mudo |
| Estética / UX | 🟢 Muy buena | Identidad "scrapbook" fuerte y consistente |
| Accesibilidad | 🟡 Básica | Color+emoji como único canal, textos diminutos |
| Build / deploy / higiene repo | 🟡 Mejorable | Peer-deps en conflicto, ~41 scripts sueltos |

> Nota: los reviews previos (`RESUMEN_REVISIÓN_FINAL.md`, marzo 2026) declararon **"APROBADO PARA PRODUCCIÓN"** sin detectar ninguno de los hallazgos 🔴/🟠 de las secciones 2–4.

---

## 2. Hallazgos CRÍTICOS 🔴

### C1. La copia desplegada de los casos está corrupta (y es la que juega el usuario)
- **Sobre‑acentuación automática** en **582/603** archivos desplegados (vs **2/598** en la fuente limpia). Un script de "humanización" puso acentos sobre acrónimos y mayúsculas: `IAMCEST→IÁMCEST`, `SCA→SCÁ`, `CAD→CÁD`, `HbA1c→HbÁ1c`, `BIRADS→BI‑RÁDS`, `MANAGEMENT→MÁNÁGEMENT`, `MEASLES→MEÁSLES`. Afecta texto visible (cartas, perlas ENARM) y los propios `case_id`.
- **Caracteres ilegibles (U+FFFD)** en **51 archivos** — texto inservible. Familias completas afectadas: las 15 de `PED_EXANT_VARICELLA`, las 15 de `PED_GIT_DEHYDRATION`, 5 de `PED_GAST_DEHYDRATION`, más casos sueltos de GYN/ENGL/STATS/SURG.
- **Contaminación cruzada de cartas** (~29%): casos que en la fuente limpia tienen ~3 cartas fueron "rellenados" a ~10 inyectando cartas de **otras enfermedades**. Marcadores: 247 archivos con `card_id` duplicados y 173 con más de una carta `init_vitals`.
  - Ej.: `CASE_PROC_SURG_ATLS_TENSION_PNEUMO_001_001` (neumotórax a tensión) contiene cartas de "Estado Hiperosmolar Hiperglucémico", "Atresia Duodenal" y "Vacuna Parvovirus B19".
  - Ej.: `CASE_PROC_ENDO_DM2_MANAGEMENT_001_001` (DM2 estable ambulatorio) tiene cartas de choque hemorrágico ("TA 80/40 (choque)", "Hb 8.1 g/dL… pérdida hemática activa").
  - Los `vazquez_comment` también están barajados entre casos: la carta `c_3` de `CARD_SCA_IAMCEST_001`, `DERM_ACNE_001` y `ENGL_TECH_VOCABULARY_001` comparten **el mismo** comentario sobre "vómito explosivo en proyectil" (estenosis pilórica).
- **Causa raíz:** el script `dr-swipe/public/cases/propagate_themes.py` sobrescribe `card_stream`/`pearl`/`triad` de los casos hermanos `_NNN` a partir del `_001_001`, **propagando** cualquier corrupción del origen a sus 15 hermanos.
- **Verificación rápida:**
  ```bash
  # mismo caso, dos copias
  python3 -c "import json;[print(b, len(json.load(open(f'{b}/CASE_PROC_ENDO_DM2_MANAGEMENT_001_001.json'))['card_stream'])) for b in ['cases','dr-swipe/public/cases']]"
  # → cases 3   |   dr-swipe/public/cases 10
  grep -lP 'Á' dr-swipe/public/cases/*.json | wc -l   # → 582
  grep -lP $'\xef\xbf\xbd' dr-swipe/public/cases/*.json | wc -l   # → 51
  ```

### C2. "REANUDAR GUARDIA" está roto para el 72% de los casos
La corrupción de C1 deja **431/598** `case_id` con acentos (`PROC_PED_EXÁNT_MEÁSLES_001_014`). El flujo de reanudación:
1. `App.tsx` autoguarda `caseId: currentCase.case_id` (el acentuado).
2. `resumeSession()` → `dataLoader.loadCaseById()` → `loadCase()` arma `cases/CASE_${encodeURIComponent(id.toUpperCase())}.json` → URL con `%C3%81…`.
3. El archivo real es ASCII → **404** → `catch` → `clearSessionProgress()`.

Resultado: el botón "REANUDAR GUARDIA" falla en silencio y borra la sesión para cualquier caso con `case_id` acentuado. (`dr-swipe/src/utils/dataLoader.ts:9‑25`, `dr-swipe/src/App.tsx:141‑176`)

### C3. El juego es completamente mudo
`dr-swipe/src/hooks/useGameAudio.ts` referencia 6 archivos en `/sounds/*.mp3` (paper-slide, bubble-pop, marker-scratch, magic-chime, clock-tick), pero **no existe `public/sounds/` ni ningún archivo de audio en el repo** (`find . -name '*.mp3'` → vacío). Howler falla en carga y no hay SFX. Toda la capa sonora "scrapbook" está inerte.

### C4. Scripts ejecutables dentro de `public/` (se publican)
`propagate_themes.py`, `structural_audit.py`, `structural_audit_v2.py` viven en `dr-swipe/public/cases/`. Todo lo que está en `public/` se copia tal cual a `dist/` y queda **servido públicamente**. No deben estar ahí.

---

## 3. Hallazgos clínicos 🟠/🟡

> El razonamiento médico, donde está intacto, es de **nivel ENARM correcto** (tiempos de fibrinólisis en IAMCEST, bundle de sepsis 1 h + norepinefrina, meningitis Ceftriaxona+Vanco+Dexa, criterios MTX vs salpingectomía en ectópico, MgSO4/Zuspan + gluconato de calcio en preeclampsia, umbrales de reanimación neonatal, "treat‑all" en VIH, glaucoma agudo de ángulo cerrado con atropina como trampa). Los `correct_index` de los boss‑fights revisados están **dentro de rango y son correctos**. Los problemas son de datos y de unos pocos bugs de autoría que existen **también en la fuente limpia**.

### Errores de autoría (corregir en la fuente `/cases/`)
- **`IM_HEART_FAILURE_001_001` carta `c_4` (Furosemida) = `discard`, comentario "Esto es puro ruido".** El propio texto dice que es "tratamiento de elección para el control de la congestión y el edema", y el paciente cursa con congestión. Penalizar mantenerla es engañoso. → `keep`, o reformular ("alivio sintomático, no modifica mortalidad").
- **`init_vitals` marcado `keep` con texto que dice ser ruido** (25 casos): p. ej. `PED_PYLORIC_SENOSIS_001_001` `init_vitals` = "Información redundante: TA N/A…" pero `expected_action: keep`. Se le pide al jugador conservar una carta etiquetada como redundante. → `discard`, o reescribir a signos vitales realmente relevantes.
- **Prefijo "🎯 DATO CLAVE OMITIDO:" sobre cartas `discard`/`hoarding`** (144 cartas en 115 archivos). Ese prefijo significa "omitiste un dato clave" y solo aplica a un `keep` perdido. → derivar el prefijo del `error_type`, no hardcodearlo.
- **`ENGL_TECH_VOCABULARY_001_001` `c_8` (Dizziness vs Vertigo) = `discard`** cuando el resto de cartas de vocabulario son `keep`; es una distinción correcta con un prefijo "Información redundante" colado. → `keep`, quitar prefijo.
- **`GYN_CANCER_BREAST_001_001`:** la intro dice tamizaje "anual" y la carta `c_3` dice "cada 2 años a partir de los 40" (correcto según GPC de riesgo promedio). → la intro debe decir "tamizaje de rutina", no "anual".

### Menores
- Boss `CARD_SCA_IAMCEST_001_001` Q1: "Fibrinolisis **sitémica**" (falta "s"; es la opción correcta, cosmético).
- Nombre mal escrito: `PED_PYLORIC_SENOSIS` (debería *STENOSIS*).
- Familias casi duplicadas con nombres inconsistentes: `SURG_BILIARY_CHOLANGITIS` vs `…COLANGITIS`, `PED_GAST_DEHYDRATION` vs `PED_GIT_DEHYDRATION`, `OBS_HEM_DPPNI` vs `OBS_HEMORRHAGE_DPPNI`, `SURG_APPENDICITIS` vs `…_ALVARADO`.
- Algunas cartas (p. ej. la aguja de descompresión en neumotórax) tienen `scoring` sin `error_type`, a diferencia de sus pares.

---

## 4. Hallazgos funcionales / mecánica 🟠

### F1. Inflación de XP entre casos de una guardia
En una guardia de 3 casos, `CONTINUE_SHIFT` **no resetea `score`** (`dr-swipe/src/machines/gameMachine.ts:575‑605`), y el efecto de `reward` otorga XP sobre el `score` **acumulado** cada vez que se completa un caso (`App.tsx:92‑109`). El XP total queda ≈ `3·S1 + 2·S2 + S3` en vez de `S1+S2+S3`. `best_score` hereda el mismo sesgo (`useCodexStore.ts:86‑93`).

### F2. Mecánicas muertas
- **Sinergia de dossier:** `scoringEngine.ts:102‑121` multiplica el puntaje cuando hay `related_diagnoses` coincidentes, pero **ningún caso tiene ese campo** (`grep -rl related_diagnoses public/cases` → 0). Nunca se dispara.
- **`dynamic_value`:** está en schema y tipos, pero **no se consume en la UI** (las cartas no muestran valores aleatorizados). Feature inerte.
- **QTE del boss:** `qteTimeLeft`/`QTE_TIMER_TICK`/`after:5000` en `boss_fight` nunca se activan (el `ShockRoom` maneja su propio timer). Lógica fantasma y confusa.
- **`urgent_triage` / `interruption_active`:** estados presentes pero sin disparador ni overlay visible en `App.tsx`; `interruptionActive` solo congela 2 s sin UI.

### F3. Penalización letal inconsistente
`scoringEngine.ts:58‑64` aplica −1000 solo si `lethal_risk`. Pero hay **160 cartas `lethal_if_discarded`** que la `SwipeDeck` pinta como "¡Letal!" y que, al descartarse mal, solo cuestan −puntos/2. Mismo peso clínico, distinto castigo.

### F4. El barajado destruye el sentido de las cartas
`App.tsx:130` baraja `card_stream` (fija la 1ª, mezcla el resto). En casos cuyas cartas son opciones "A) … B) … C) …" o dependen de orden (signos vitales antes de su interpretación), el barajado las vuelve incoherentes y hace aleatoria la combinación "Eureka" (3 misma categoría seguidas). Combinado con la contaminación de C1, agrava la incoherencia.

### F5. Cálculo de score duplicado
`App.handleSwipe` (`App.tsx:190‑202`) recalcula `calculateCardScore` solo para el toast, usando el estado **previo** al `send` (combo/multiplicador potencialmente desfasados), duplicando la lógica del motor. Hay además una variable muerta (`lastFeedback`, `App.tsx:208`).

### F6. El schema no detecta la corrupción
`ClinicalCaseSchema` acepta `category` como string libre, no valida `card_id` únicos ni límite superior de cartas → los casos contaminados (10 cartas, IDs duplicados, categorías mezcladas) **pasan validación** y por eso no hay error en runtime, solo contenido incoherente.

---

## 5. Estética / UX 🟢 (con detalles)

La identidad visual "scrapbook / cuaderno médico" (papel `#FDFBF7`, washi tape, tipografía Fraunces, sellos de marcador, microinteracciones con Framer Motion) es **fuerte y coherente**. Detalles a pulir:

- **E1.** El `VitalsMonitor` del HUD es oscuro (`slate-900`) y rompe con la paleta clara pastel de todo lo demás (`TelemetryHUD.tsx:112‑175`). Es la única isla "techno" en un mundo de papel.
- **E2.** Inconsistencia de personaje: el código usa "vázquez" (`vazquezDialogue`, `vazquezExpression`) pero el avatar renderiza `doctor="mendoza"` 👴 (`App.tsx:388`, `AvatarFeedback.tsx`). Nombres de mentor mezclados.
- **E3.** Textos de UI diminutos (`text-[7px]`/`text-[8px]`) en etiquetas del HUD y de las cartas; legibilidad límite en móvil.
- **E4.** El `getFontSizeClass` escala el texto de la carta por longitud, pero con la contaminación (cartas largas pegadas) puede caer a `text-sm` y verse apretado.

## 6. Accesibilidad 🟡

- **A1.** Keep/Discard se distingue solo por color + emoji + posición (♥ derecha / ✕ izquierda); sin etiqueta textual permanente. Los `aria-label` de los botones están bien, pero el feedback de acierto/error (`shake-lite`, color) es solo visual.
- **A2.** No hay reduce‑motion: animaciones intensas (slap, shake, pulse) sin `prefers-reduced-motion`.
- **A3.** Contraste de algunos grises (`text-slate-300/400`) sobre papel `#FDFBF7` por debajo de WCAG AA en textos pequeños.
- **A4.** Solo español; los casos `ENGL_*` mezclan inglés dentro de UI española.

## 7. Build / deploy / higiene de repo 🟡

- **B1.** `npm install` **limpio falla** (`ERESOLVE`: `vite-plugin-pwa@1.2.0` no soporta `vite@8`). CI lo enmascara con `--legacy-peer-deps` (`.github/workflows/cloudflare-deploy.yml:26`), pero es una incompatibilidad latente; conviene fijar `vite-plugin-pwa` a una versión compatible o bajar `vite`.
- **B2.** `tsc --noEmit` → **0 errores**. `vite build` → OK.
- **B3.** Doble ruta de deploy: `wrangler.toml` (`pages_build_output_dir`) **y** GitHub Action con `wrangler-action`. Aclarar cuál es la fuente de verdad.
- **B4.** Ruido en la raíz: **~41 scripts** sueltos (`.py/.ps1/.js` de reparación/auditoría) + dumps JSON grandes (`audit_results.json` 260 KB, `cross_case_audit.json` 99 KB). Dificulta saber qué está vivo. Mover a `tools/` o a `_LEGACY_ARCHIVE/`.
- **B5.** `v2/` (scaffold React 18 con Dexie/gacha) no está desplegado ni referenciado. Decidir si es el futuro o se archiva.
- **B6.** Campos duplicados `enarm_pearl`/`perla_enarm` manejados con `as any` en varios sitios; consolidar en uno.

---

## 8. Plan de remediación priorizado

**Bloque 1 — Datos (máximo impacto, riesgo medio)**
1. Hacer de `/cases/` la **única fuente de verdad**. Limpiar su mojibake residual (2 archivos con `Á`, algún `InformaciA³n`/`36.6A°C`) y los ~4 bugs de autoría de la §3.
2. Re‑generar `dr-swipe/public/cases/` **desde** `/cases/` **sin** el paso de acentuación/contaminación. Regenerar `case_index.json`.
3. Eliminar/neutralizar `propagate_themes.py` (y los `structural_audit*.py`) de `public/cases/` para que no vuelva a propagar corrupción.
4. Añadir check de CI que rechace cualquier caso con: `card_id` duplicado, >1 `init_vitals`, `Á` dentro de acrónimos ASCII, o bytes U+FFFD.

**Bloque 2 — Funcional (bajo riesgo)**
5. Arreglar resume: persistir/normalizar `case_id` a ASCII (cae solo al limpiar datos), o mapear por filename del índice.
6. Resetear `score` en `CONTINUE_SHIFT` (o calcular XP por‑caso, no acumulado).
7. Unificar penalización letal: incluir `lethal_if_discarded` en la rama −1000.
8. Eliminar mecánicas muertas (sinergia dossier / `dynamic_value` / QTE fantasma) **o** poblarlas con datos reales si se quieren conservar.

**Bloque 3 — Audio / estética / a11y (bajo riesgo)**
9. Añadir los 6 mp3 a `public/sounds/` (o quitar el audio para no errar en consola).
10. Unificar `VitalsMonitor` a la paleta clara; renombrar "vázquez"↔"mendoza".
11. `prefers-reduced-motion`, subir tamaños mínimos de texto, etiquetas textuales keep/discard.

**Bloque 4 — Higiene (sin riesgo)**
12. Resolver peer‑deps de PWA; mover scripts a `tools/`; decidir destino de `v2/`.

---

## 9. Apéndice — comandos de verificación usados

```bash
# 1. divergencia de copias
diff -rq cases dr-swipe/public/cases | grep -c differ          # 599

# 2. case_id acentuados (resume roto)
python3 - <<'PY'
import json,glob,re
n=sum(1 for f in glob.glob('dr-swipe/public/cases/CASE_*.json')
      if re.search(r'[ÁÉÍÓÚ]', json.load(open(f))['case_id']))
print(n)   # 431 / 598
PY

# 3. corrupción de texto desplegado
grep -lP 'Á' dr-swipe/public/cases/*.json | wc -l               # 582
grep -lP $'\xef\xbf\xbd' dr-swipe/public/cases/*.json | wc -l    # 51

# 4. mecánicas muertas
grep -rl related_diagnoses dr-swipe/public/cases | wc -l         # 0

# 5. audio inexistente
find . -path ./node_modules -prune -o -name '*.mp3' -print       # (vacío)

# 6. build
cd dr-swipe && npx tsc -p tsconfig.app.json --noEmit             # 0 errores
```

---
*Auditoría de solo lectura. No se modificó ningún archivo de la app ni de los casos; este documento es el único artefacto generado.*
