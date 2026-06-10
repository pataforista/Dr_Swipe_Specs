# Dr. Swipe — Auditoría clínica y de código (preparación para producción)

**Fecha:** 2026-06-10
**Rama:** `claude/clinical-code-audit-dtft0e` (sobre `main` @ `b7275e6`)
**Alcance:** app `dr-swipe/` (React 19 + XState 5 + Zustand + PWA), 598 casos clínicos desplegados (`dr-swipe/public/cases/`), fuente (`/cases/`), pipeline de datos, build y deploy.
**Método:** verificación independiente de cada fix declarado en `AUDITORIA_COMPLETA_2026-06.md`, barrido estructural de los 598×2 casos, muestreo clínico de ~25 casos en todas las especialidades con verificación de boss-fights/perlas/dosis, lectura del motor completo, `npm ci`, `tsc --noEmit`, `vite build`.
**Tipo:** solo lectura — este documento es el único artefacto generado.

---

## 1. Veredicto ejecutivo

> **NO-GO para producción plena. GO condicional para beta/soft-launch.**

| Eje | Estado | Resumen |
|---|---|---|
| Seguridad clínica del contenido | 🟢 **Listo** | 0 errores médicos peligrosos; boss-fights y dosis verificados correctos |
| Pulido pedagógico del contenido | 🟠 Pendiente | Feedback invertido en 491 cartas; 77 `init_vitals` contradictorios |
| Integridad de datos desplegados | 🟢 Listo (🟡 con asterisco) | Contaminación resuelta; ~10 archivos con mojibake visible |
| Pipeline de datos | 🔴 Riesgo latente | La "fuente de verdad" `/cases/` quedó más corrupta que lo desplegado |
| Motor / mecánica | 🔴 2 críticos | Doble pago de recompensas; "reanudar" no reanuda |
| Build / CI | 🟠 Regresión | `tsc` con 8 errores que CI no detecta; conflicto vite/PWA latente |
| Estética / UX | 🟢 Muy buena | Sin cambios desde la auditoría previa |

**Lo bueno:** la remediación de junio fue real. Los fixes de datos (contaminación cruzada, U+FFFD, `case_id` acentuados) y de motor (F1, F2, F3, C2, C3, E1) están verificados en código y datos. La medicina es correcta y segura — ese era el riesgo #1 y está cubierto.

**Lo que bloquea:** dos bugs críticos nuevos en la capa React (§4.1) que corrompen la economía del juego y el guardado, el feedback pedagógico invertido a gran escala (§3.1), y un pipeline de datos invertido (§2) que re-corrompería todo en la próxima regeneración.

---

## 2. 🔴 Pipeline de datos: la fuente de verdad quedó atrás

La auditoría previa pedía hacer de `/cases/` la única fuente de verdad y regenerar `public/cases/` desde ella. Ocurrió lo contrario: **los fixes se aplicaron a la copia desplegada y la fuente quedó corrupta.**

| Métrica | `/cases/` (fuente) | `dr-swipe/public/cases/` (desplegada) |
|---|---|---|
| Archivos con U+FFFD | **35** | 0 |
| Mojibake `A³` | 12 | 3 |
| Bytes de control C1 | 99 | 8 |
| `case_id` acentuados / `card_id` duplicados / multi-`init_vitals` | 0 / 0 / 0 | 0 / 0 / 0 |

- Las dos copias divergen en 599 archivos. La desplegada es hoy la versión canónica de facto.
- **Riesgo:** cualquier script que regenere `public/cases/` desde `/cases/` (hay ~41 scripts de pipeline en la raíz) re-introduce los 35 U+FFFD al juego.
- Los 17 archivos desplegados con `Á` son **acentos legítimos** ("Ácido acetilsalicílico", "Ácido valproico") — no corrupción.
- `case_index.json` desplegado: consistente al 100% (598 entradas ↔ 598 archivos, 0 mismatches).
- La fuente `/cases/` aún contiene `propagate_themes.py` y `structural_audit*.py` (en `public/` ya fueron eliminados).

**Remediación:** copiar la versión desplegada saneada de vuelta a `/cases/` (tras el pase final de limpieza de §3.3), declarar una sola dirección de sincronización, y añadir el check de CI que la auditoría previa propuso (rechazar U+FFFD, `card_id` duplicado, multi-`init_vitals`).

---

## 3. Auditoría clínica (copia desplegada)

### 3.1 🟠 ALTO — Los 5 errores de autoría de la auditoría previa siguen presentes, y son más extensos

Ninguno se corrigió en lo desplegado; el barrido completo muestra que el alcance real es mayor que el reportado:

1. **Prefijo "🎯 DATO CLAVE OMITIDO:" invertido — 491 cartas en 302 archivos** (reportado: ~144). El prefijo significa "omitiste un dato clave" (un `keep` perdido) pero se aplica en `vazquez_comment` de cartas `discard`/`hoarding`: feedback semánticamente al revés. *Fix: derivar el prefijo del `error_type`, no hardcodearlo.*
2. **`init_vitals` con `expected_action: keep` pero texto "información redundante/ruido" — 77 archivos** (reportado: ~25). Se pide conservar una carta etiquetada como ruido.
3. **`IM_HEART_FAILURE_001_001` c_4 (Furosemida) = `discard`** con comentario "Esto es puro ruido", cuando el propio texto la llama tratamiento de elección de la congestión y el paciente está congestivo. El único de los 5 que roza error clínico (enseña a descartar un tratamiento indicado).
4. **`ENGL_TECH_VOCABULARY_001_001` c_8 (Dizziness vs Vertigo) = `discard`** — distinción correcta marcada para descarte, con elogio "¡Bien!" contradictorio.
5. **`GYN_CANCER_BREAST_001_001`:** intro dice tamizaje "anual" vs carta/perla "cada 2 años, 40–69" (lo correcto). **Hallazgo nuevo:** la paciente es "Laura, 65 años" pero el escenario describe "Mujer de 52 años".

### 3.2 🟢 Contaminación cruzada: RESUELTA

337 casos tienen 10–13 cartas. Muestreo de >20 en todas las especialidades, incluidos los señalados como contaminados en junio:
- `SURG_TRAUMA_ATLS10_001_001` ya no contiene cartas de estado hiperosmolar / atresia duodenal / vacuna parvovirus — todo es neumotórax/ATLS.
- `ENDO_DM2_MANAGEMENT_001_001` ya no tiene choque hemorrágico — todo DM2.
- Las cartas `discard` que "parecen de otra patología" son **distractores de diagnóstico diferencial legítimos** (LES en eritema infeccioso, chancroide en sífilis, migraña en cefalea en trueno): diseño educativo correcto.
- Estructural: 0 `card_id` duplicados, 0 multi-`init_vitals`, conteos desplegado=fuente 1:1.

### 3.3 🟢 Corrección médica: verificada, sin errores peligrosos

Muestreo de ~25 casos (cardio, endocrino, infecto, GO, pediatría, neuro, cirugía, estadística):
- **15 boss-fights con `correct_index` correcto al 100%**: IAMCEST (fibrinólisis si ICP>120 min, ASA 300 mg), CAD (bicarbonato solo pH<6.9, insulina si K≥3.3, cierre de brecha aniónica), sepsis (PAM≥65, norepinefrina, lactato>2), meningitis (dexametasona con/antes del antibiótico, rifampicina, hipoglucorraquia), VIH (DTG, CD4<200 → TMP/SMX), sífilis (PCN benzatínica 2.4 M), preeclampsia (gluconato de calcio, HELLP, reflejo rotuliano), EVC (rTPA 4.5 h, NIHSS), HSA (nimodipino, xantocromía), colangitis (Reynolds, CPRE), ATLS, estenosis pilórica (alcalosis hipoclorémica, Fredet-Ramstedt), Sn/Sp/VPP.
- **Dosis/umbrales escaneados masivamente — 0 errores**: dexametasona croup 0.6 mg/kg, amoxicilina otitis 80–90 mg/kg, hierro 3–6 mg/kg, Plan B 100 ml/kg/4 h, Plan C bolos 20 ml/kg, sepsis 30 ml/kg, MgSO4 Zuspan 4 g + 1 g/h.
- Perlas ENARM correctas y consistentes con sus cartas.

### 3.4 🟡 MEDIO — Mojibake residual en ~10 archivos desplegados

Visible al usuario en cartas y perlas: `STATS_DX_METRICS_001_001` ("**írea** bajo la curva" → Área), `SURG_TRAUMA_ATLS10_001_001` ("CLí\x8dNICA"), `SURG_APPENDICITIS_001_001`, `PED_NEURO_MILESTONES_001_001`, `PSYCH_MANIA_001_001`, `PSYC_DEP_SUICIDE_001_001`, `PED_RESPIRATORY_PNEUMONIA_001_003`, `PED_VAC_SRP_001_001/002` ("Diagn**A³**stico", "S­arampiA³n"). *Fix: pase final de `ftfy` sobre bytes C1 y patrón `A³` en estos archivos.*

---

## 4. Auditoría de código

### 4.1 🔴 CRÍTICOS (bloquean producción)

**K1. Doble otorgamiento de XP/monedas y registro fantasma al cambiar de paciente** — `dr-swipe/src/App.tsx:92-109` + `236-248`
El efecto de recompensa corre cuando `state.matches('reward') && currentCase` y depende de `currentCase`. Al pulsar "COBRAR Y CONTINUAR", `handleCaseTransition()` hace `setCurrentCase(nextCase)` **sin salir de `reward`** (el `CONTINUE_SHIFT` se envía después, en "INICIAR CONSULTA", `App.tsx:280`). El cambio de `currentCase` re-dispara el efecto con el mismo `score`: XP y monedas se pagan **dos veces** (incluido el bono "GUARDIA PERFECTA"), `registerCaseSolved(nextCase.case_id, …)` marca como resuelto un caso aún no jugado, y la perla del siguiente caso se desbloquea antes de tiempo. En una guardia de 3 casos, los casos 1 y 2 se pagan doble — reintroduce por otra vía la inflación de XP que F1 había corregido. *Verificado leyendo el código directamente.*
*Fix: ref con el `case_id` ya premiado (early-return si coincide), o mover la recompensa a una acción de la máquina.*

**K2. "REANUDAR GUARDIA" no reanuda: reinicia el caso y descarta el progreso** — `dr-swipe/src/App.tsx:141-176`
`resumeSession()` envía `START_GUARD`, que resetea `currentCardIndex: 0, score: 0, combo: 0…`. Los campos persistidos (`currentCardIndex`, `score`, `combo`, `multiplier`, `coinsEarnedThisCase`…) **nunca se usan** — solo `caseId` y `difficulty`. El jugador "reanuda" desde la carta 0 con puntaje 0. Además, tras reanudar, "INICIAR CONSULTA" envía `CONTINUE_SHIFT` con la máquina en `triage` (que lo ignora): funciona de casualidad. *Verificado.*
*Fix: evento `RESUME_GUARD` que acepte el snapshot guardado y rebane el deck desde el índice salvado.*

### 4.2 🟠 ALTOS

**K3. El tutorial reaparece en cada arranque** — `App.tsx:42`. Se lee `dr_swipe_tutorial_seen` pero **nada lo escribe** jamás. *Fix: `localStorage.setItem` en `onComplete` con try/catch.*

**K4. `tsc --noEmit` roto: 8 errores (regresión vs B2) y CI no lo ve** — `startTriageAlarm`/`lastFeedback` sin usar (`App.tsx:37,208`), `process` sin tipos (`ErrorBoundary.tsx:50`), `AnimatePresence`/`xpTotal` sin usar, y 3 errores en `ReloadPrompt.tsx` por falta de `vite-plugin-pwa/react` en `types`. El build es solo `vite build` sin tsc, así que CI no detecta regresiones de tipos. *Fix: corregir los 8 + `tsc -b &&` en el script `build`.*

**K5. Crash latente en `boss_fight` sin tríada** — `App.tsx:330` + `caseSchema.ts:60-64`. `currentCase!.boss_fight_triad!.questions` con el campo opcional en el schema y `questions: []` permitido; `correct_index` no se valida contra `options.length`. Hoy los 598 casos lo traen poblado, pero un caso futuro malformado crashea la app. *Fix: `.min(1)` + `superRefine` de `correct_index`, y saltar a `reward` si no hay tríada.*

**K6. B1 sigue: `vite-plugin-pwa@1.2.0` incompatible con `vite@8`** — peer declarado `^3–^7` vs `vite 8.0.1` instalado. `npm install` limpio falla con ERESOLVE; CI lo enmascara con `--legacy-peer-deps`. *Fix: fijar `vite@^7` o subir el plugin cuando soporte vite 8.*

### 4.3 🟡 MEDIOS

- **K7. El "modo offline" no incluye los casos** — `vite.config.ts:29`: `urlPattern: /^\/cases\/.*/i` se evalúa contra la URL completa (`https://…`) y **nunca matchea**; la regla `clinical-cases-cache` es inerte y los `.json` no se precachean. Sin red no carga ningún caso aunque el prompt anuncie "MODO OFFLINE LISTO". *Fix: `urlPattern: ({url}) => url.pathname.startsWith('/cases/')`.*
- **K8. El fallback SPA enmascara los 404 del dataLoader** — `public/_redirects` devuelve `index.html` con 200 para casos inexistentes; el check `status === 404` de `dataLoader.ts:15` nunca dispara. *Fix: validar `content-type` antes de parsear.*
- **K9. Doble input procesa 2 cartas en ~250 ms** — `SwipeDeck.tsx:32-51`: durante la animación de salida no se bloquean entradas; teclado en auto-repeat decide la siguiente carta sin verla. *Fix: flag `isAnimating` en ref.*
- **K10. Mecánicas muertas (residuo de F2):** las Cajas de Suministros **no curan** (`APPLY_REWARD_HEAL` nunca se envía; `onClaim` → `CLEAR_OVERLAYS`, `App.tsx:400`); los eventos lab/archive/systemic muestran "Efecto: …" sin aplicar nada; estados `urgent_triage`/`critical_warning` inalcanzables; `RetrospectiveView` inalcanzable; `startTriageAlarm` y `playFeedback('correct')` nunca suenan; `vazquezDialogs.json` no se importa. *Fix: conectar o eliminar.*
- **K11. `caseStreak` no se resetea entre guardias** — `gameMachine.ts:109-140`: el bono del boss (`caseStreak*500`) crece entre guardias distintas de la misma sesión. `CONTINUE_SHIFT` tampoco limpia `discarded`. *Fix: resetear en `resetGame`/`START_GUARD`.*
- **K12. `localStorage` sin blindaje** — `App.tsx:42`, `useCodexStore.ts:122`: acceso directo en inicializadores lanza `SecurityError` con storage bloqueado (Safari privado embebido) y tumba la app al montar; sin manejo de cuota llena en el persist de zustand. *Fix: wrapper try/catch.*
- **K13. Error de carga de guardia tragado en silencio** — `App.tsx:134-138`: si falla la red, "EMPEZAR GUARDIA" no hace nada, sin mensaje ni log. Los 3 casos se cargan en serie y `loadRandomCase` puede repetir caso en la misma guardia. *Fix: toast de error; `Promise.all` + muestreo sin reemplazo.*

### 4.4 🔵 BAJOS

- **K14.** F5 sigue: `handleSwipe` recalcula el score con contexto pre-`send` solo para el toast; `lastFeedback` muerta (`App.tsx:190-211`).
- **K15.** CSP con `script-src 'unsafe-inline'` innecesario (`public/_headers:6`); no hay sinks XSS en src (0 `dangerouslySetInnerHTML`).
- **K16.** Triple ruta de deploy: `wrangler.toml` + GitHub Action (que además despliega en `pull_request`) + script `gh-pages`. Quedarse con una.
- **K17.** Dependencias muertas: `howler` y `@types/howler` (el audio ya es Web Audio API).
- **K18.** Tutorial desincronizado: dice "-25/+5, racha x10" pero el motor aplica -15/+8 y loot cada 8 (`TutorialOverlay.tsx:19,25` vs `gameMachine.ts:206,223`).
- **K19.** `ENGINE_SWIPE_CASE_QA_CHECKLIST_v1.md` se publica con el sitio; `check_cases*.js` en la raíz del paquete.
- **K20.** `index.html` declara `lang="en"` para una app en español.
- **F4 sigue:** barajado con `sort(() => Math.random()-0.5)` (sesgado, no uniforme) que destruye el orden clínico de las cartas (`App.tsx:130,243`).
- **F6 sigue:** schema permisivo — `category` libre, sin unicidad de `card_id`, sin tope de cartas. Hoy los datos están limpios, pero el schema no impediría que la corrupción regrese.
- **E2 sigue:** `vazquezDialogue`/`cleanVazquezComment` vs `doctor="mendoza"` (declarado "pendiente por diseño").

---

## 5. Verificación de los fixes de la auditoría previa

| Fix declarado | Estado | Evidencia |
|---|---|---|
| C1 — Contaminación de casos desplegados | ✅ | 0 dup `card_id`, 0 multi-`init_vitals`, distractores legítimos; spot-checks de los casos señalados limpios |
| C2 — `loadCase` endurecido / `case_id` ASCII | ✅ | `dataLoader.ts:13-14` normaliza NFD + strip; 0 ids no-ASCII en 598 |
| C3 — Audio Web Audio API | ✅* | Sin mp3, try/catch, `ctx.resume()`; pero `startTriageAlarm`/`playFeedback('correct')` nunca se invocan (K10) |
| C4 — Scripts fuera de `public/` | ✅ | Eliminados (queda un .md, K19); en `/cases/` fuente siguen |
| F1 — Reset de `score` en `CONTINUE_SHIFT` | ✅* | `gameMachine.ts:550-553` correcto; pero K1 (doble reward) y K11 (`caseStreak`) reintroducen inflación por otras vías |
| F2 — QTE eliminado | ✅ | Sin `qteTimeLeft`/`QTE_*`/`after:5000`; restos inocuos en schema |
| F3 — `lethal_if_discarded` = −1000 | ✅ | `scoringEngine.ts:61-62` |
| E1 — VitalsMonitor paleta clara | ✅ | `TelemetryHUD.tsx:112-177` |
| A2 — prefers-reduced-motion | ⚠️ Parcial | Cubre CSS; Framer Motion (JS) no lo respeta — falta `<MotionConfig reducedMotion="user">` |
| B1 — peer-deps PWA | ❌ | Sigue (K6) |
| B2 — `tsc` limpio | ❌ Regresión | 8 errores nuevos (K4) |
| Errores de autoría §3 | ❌ | Los 5 siguen, con alcance mayor (§3.1) |

Build de producción: ✅ `vite build` OK (518 KB JS, 159 KB gzip; PWA generada). `npm ci --legacy-peer-deps` OK.

---

## 6. Plan de remediación priorizado

**Bloqueantes (antes de producción plena) — ~1-2 días**
1. K1 — doble pago de recompensas (guard con ref del `case_id` premiado).
2. K2 — resume real (evento `RESUME_GUard` con snapshot) **o** degradarlo honestamente a "reintentar caso" quitando la promesa de reanudar.
3. §3.1.1 — prefijo "DATO CLAVE OMITIDO" derivado de `error_type` (script de 1 pasada sobre 491 cartas).
4. §3.1.2/3 — los 77 `init_vitals` contradictorios y la Furosemida de `IM_HEART_FAILURE_001_001`.
5. §2 — sincronizar `/cases/` ← desplegada y fijar dirección única del pipeline + check de CI.

**Antes del siguiente release**
6. K3 (tutorial), K4 (tsc + gate en CI), K5 (schema boss), K6 (peer-deps).
7. §3.4 — pase `ftfy` sobre los ~10 archivos con mojibake.
8. K7 (offline real u honesto), K9 (doble input), K11, K12.

**Deuda / pulido**
9. K10 (mecánicas muertas: conectar o borrar), K13-K20, F4/F6/E2, `MotionConfig` para A2 completo, decidir destino de `v2/` y mover los ~41 scripts de la raíz a `tools/`.

---

*Auditoría de solo lectura realizada el 2026-06-10. Hallazgos críticos K1 y K2 verificados con doble lectura independiente del código.*
