# PROJECT_MAP — Dr. Swipe

Mapa para modelos y colaboradores que necesitan trabajar en el repositorio sin leerlo entero. Verificado el 2026-10-10 sobre `main` (599 casos, 119 tests, lint limpio). Si algo de aquí contradice al código, manda el código; corrige este archivo en el mismo commit.

## 1. Qué es

Juego móvil/PWA de triaje clínico para preparar el ENARM. El jugador recibe un paciente, desliza cartas (derecha = aceptar `keep`, izquierda = descartar `discard`), enfrenta un jefe de 3 preguntas (Shock Room) y cobra una perla clínica. Repaso espaciado SM-2. Todo en español.

Dos mitades independientes unidas por JSON:

| Mitad | Carpeta | Qué contiene |
|---|---|---|
| Contenido | `cases/`, `content_drafts/`, `tools/` | 599 casos clínicos y la tubería Python que los corrige y valida |
| Motor | `dr-swipe/` | App React 19 + Vite 8 + Tailwind 3 + XState 5 + Zustand 5 + Zod 4 |

## 2. Dónde está cada cosa

```
Dr_Swipe_Specs/
├── cases/                  FUENTE DE VERDAD del contenido. CASE_PROC_*.json (599) + case_index.json
├── content_drafts/         Lotes de distractores (distractores_lote1..6.json), con fuente por carta
├── tools/                  Scripts Python del contenido (ver §5)
├── dr-swipe/               App. Todo comando npm se corre aquí
│   ├── src/machines/gameMachine.ts   Reglas del juego (XState, puro)
│   ├── src/store/useCodexStore.ts    Persistencia (Zustand persist v2)
│   ├── src/utils/                    Lógica pura (ver §4)
│   ├── src/components/               UI; overlays/ y ui/ son subcarpetas
│   ├── src/hooks/                    Efectos: audio, háptica, commit de sesión, foco
│   ├── src/data/lore/*.json          Diálogos de mentores, logros, objetos, eventos
│   ├── src/tests/                    16 archivos vitest
│   ├── sync_cases.js, regen_index.js Copian cases/ → public/cases/ y generan manifest.json (prebuild/predev)
│   └── public/cases/                 GENERADO, ignorado por git. No editar
├── CORE_CANON/             Base de decisiones críticas (JSON/JSONL por especialidad). Referencia clínica, el juego NO la lee
├── REVISION_CLINICA/       Paquete .xlsx/.csv para el revisor médico (LEEME.md)
├── _LEGACY_ARCHIVE/        Motor v1/v2 y specs antiguas. Solo historia; no tocar ni citar como vigente
├── *.csv (raíz)            Exportaciones generadas (§6)
├── analyze_cases.ts, apply_audit_fixes.ts, export_qa.ts, generate_csv.ts   Scripts TS sueltos de auditoría (sin package propio; correr con npx tsx)
└── .github/workflows/cloudflare-deploy.yml   CI (§7)
```

Documentos de gestión, en orden de autoridad:
1. `ROADMAP.md` — estado por fase, principios, ADR 001–016, preguntas abiertas. Sus secciones 4–6 describen la estructura **planeada**; hay tipos (`types/case.ts`, `types/state.ts`) que no existen. Los tipos reales viven en `dr-swipe/src/types/game.ts` y `srs.ts`.
2. `PLAN_SIGUIENTES_PASOS.md` — pendientes de contenido y jugabilidad.
3. `GUIA_CASOS.md` — cómo se escribe una carta sin delatar la respuesta.
4. `ERRORES_Y_PREVENCION.md` — 26 errores pasados y el control que evita cada uno. Léelo antes de refactorizar `gameMachine.ts`.

## 3. Modelo de datos del caso (`cases/CASE_*.json`)

```
case_id            "PROC_<ESP>_<TEMA>_<familia nnn>_<variante nnn>"   (el 2.º token es la especialidad)
version            literal "v3_swipe_action"
theme_config       string libre ("ped", "derm"…)
difficulty         standard | hard | extreme          (373 / 223 / 3)
patient_intro      { name, arrival_scenario, time_limit_sec }
card_stream[3..18] { card_id, ui_icon, category, card_text,
                     expected_action: keep|discard,
                     scoring: { points, error_type?, vazquez_comment? },
                     safety_flags?: { lethal_risk, decision_critical, lethal_if_discarded, is_critical_dxd },
                     dynamic_value?: { min, max, unit, isBorderline } }
enarm_pearl        { title, text, gpc_ref?, id?, category?, rarity? }   (perla_enarm = alias legado)
boss_fight_triad   { trigger:"after_cards", questions:[{ q|question, options[≥2], correct_index }] }
```

Cifras del corpus: 7,906 cartas, 41.1 % de descarte (meta del plan: ~40 %), 1,797 preguntas de jefe.
Especialidades por token: OBS 135, PED 132, INT 90, INF 50, GYN 45, NEUR 30, SURG 23, ENDO 16, ENGL 15, STATS 15, IM 10, ORL 10, resto ≤ 5. `PSYC` y `PSYCH` coexisten.

Invariantes que el validador y Zod hacen cumplir: `card_id` únicos por caso; máximo un `init_vitals`; sin letras de opción (`A) `); sin etiquetas de veredicto (`Dato anecdótico:`…); sin mojibake. El **esquema Zod** (`utils/caseSchema.ts`) y `tools/validate_cases.py` deben moverse juntos: si cambias el límite de cartas o un campo, cambia ambos y `insert_distractors.py`.

**Familia** = `case_id` sin la variante final (`caseFamily()` en `utils/deckOrder.ts`). Una guardia toma casos de familias distintas.

## 4. Motor: qué hace cada módulo

**Principios (ROADMAP §3):** XState no hace efectos (sin DOM, audio, fetch, storage); Zustand guarda lo de largo plazo, nunca la partida activa; los componentes solo pintan; las utilidades son funciones puras; un efecto, una fuente.

**Flujo de estados** (`machines/gameMachine.ts`, ~750 líneas):
`idle → triage → critical_alert (1.5 s) → boss_fight → reward → (siguiente caso | victoria_guardia)`. Fallo: vitalidad ≤ 0 en `triage`, o fallo definitivo en `boss_fight`, lleva a `fail_protection`; ahí `RESCUE` gasta un interno y reanuda (en el jefe, con las cartas ya decididas) y, sin vidas, pasa a `ghosted` → `REVIVE_INTERN` (cuesta Favores) o `VIEW_DEBRIEF` → `debrief`. Eventos: `START_GUARD`, `RESUME_GUARD`, `SWIPE`, `TIME_OUT`, `UNDO_SWIPE`, `BUY_UNDO`, `USE_LIFELINE`, `ANSWER_CORRECT/WRONG`, `APPLY_REWARD(_HEAL)`, `CONTINUE_SHIFT`, `FINISH_SHIFT`, `RESCUE`, `REVIVE_INTERN`, `VIEW_DEBRIEF`, `CLEAR_OVERLAYS`, `RESTART`. Las acciones con acceso al contexto se declaran en `setup({ actions })` (XState v5).

| Necesitas… | Archivo |
|---|---|
| Orquestar pantallas y efectos | `App.tsx` (980 líneas; es el pegamento, evita meterle lógica) |
| Puntos, combo, XP, bonos | `utils/scoringEngine.ts` |
| Repaso espaciado SM-2 | `utils/srsEngine.ts` (`applySM2`, `outcomeToQuality`) |
| Resultado de caso, notas, métricas de guardia | `utils/sessionEngine.ts` |
| Recompensas del botín y efectos | `utils/rewardsEngine.ts`, `rewardEffects.ts`, `data/lore/rewardItems.json`, `penaltyItems.json` |
| Moneda blanda "Favores del Adjunto" (tope 5, revive cuesta 3) | `utils/favorsEngine.ts` |
| Logros (17) y Códex | `utils/achievementsEngine.ts`, `codexStats.ts`, `data/lore/achievements.json`, `components/CodexScreen.tsx` |
| Diálogos de Navarro/Vázquez | `utils/dialogEngine.ts`, `data/lore/mentorDialogs.json` |
| Física del swipe (umbral 32 %, flick) | `utils/swipePhysics.ts`, `components/SwipeDeck.tsx` |
| Carga lazy de casos y validación Zod por caso | `utils/dataLoader.ts` (lee `public/cases/manifest.json`) |
| Barajar mazo / elegir familias distintas | `utils/deckOrder.ts` |
| Limpiar comentario del mentor según acierto/fallo | `utils/formatters.ts` (`cleanMentorComment`, `shuffleBossQuestion`) |
| Vitales → monitor del HUD | `utils/vitalsParser.ts`, `components/TelemetryHUD.tsx` |
| Cola de avisos de recompensa | `utils/toastQueue.ts`, `components/overlays/RewardToast.tsx` |
| Jefe (Shock Room): 12 s por pregunta, 2 fallos permitidos, checkpoint | `components/ShockRoom.tsx`; el reintento lo maneja `gameMachine.ts` |
| Audio / háptica | `hooks/useGameAudio.ts`, `useImpactFeedback.ts`, `utils/hapticFeedback.ts` |
| Guardado local seguro | `utils/safeStorage.ts`, `store/useCodexStore.ts` (migración v0/v1→v2) |
| Cierre de guardia sin duplicar XP | `hooks/useSessionCommit.ts` |
| PWA y caché | `vite.config.ts`, `public/_headers` (CSP) |

Reglas de juego que sorprenden: `ghosted` cuenta como un error letal (ADR 013); Modo Estudio ("Sandía") no hace daño y viaja en el guardado (`isSandiaMode`); la guardia estándar son 3 casos (ADR 014); la dificultad fija el tiempo por carta.

## 5. Tubería de contenido (`tools/`, Python 3, sin dependencias)

Todas operan sobre `cases/` y son idempotentes. Con `--check` no escriben y salen con código 1 si habría cambios (así las corre el CI).

| Script | Función |
|---|---|
| `validate_cases.py <dir>` | Guardia de CI: mojibake, contaminación entre casos, letras de opción, etiquetas de veredicto |
| `clean_card_leaks.py <dir> [--check]` | Quita letras, etiquetas y prefijos horneados |
| `apply_guideline_review.py <dir> [--check]` | Correcciones de signos vitales según guías; cada fuente está en el docstring |
| `insert_distractors.py <dir> <lote.json> [--check]` | Inserta cartas `discard` desde `content_drafts/`; posición aleatoria sembrada por `case_id`; respeta el tope de 18; omite las marcadas `"reserva": true` |
| `report_content_review.py` | Informe → `REVISION_CONTENIDO_JUGABILIDAD.csv` (usa umbrales de adulto: falsos positivos pediátricos) |
| `export_full_review.py`, `export_review_pack.py` | `REVISION_COMPLETA_CASOS.csv` y el paquete de `REVISION_CLINICA/` |

**Regla de contenido que no se negocia:** sin guía confirmada no se escribe la carta; se responde "Insufficient data". Las fuentes de varios lotes (5 y 6) se redactaron de memoria y esperan confirmación del revisor clínico.

Receta para añadir distractores: leer el mazo de la familia → redactar 3–4 cartas en un lote nuevo con comentario válido tras acierto **y** tras error, más la fuente → `insert_distractors.py cases lote.json --check` → aplicar → validador + `npm test` + `npm run build`.

## 6. Archivos generados (no editar a mano)

`CATALOGO_CASOS_COMPLETO.csv` (`npx tsx generate_csv.ts`), `REVISION_PREGUNTAS_RESPUESTAS.csv` (`npx tsx export_qa.ts`), `REVISION_COMPLETA_CASOS.csv`, `REVISION_CONTENIDO_JUGABILIDAD.csv`, `REVISION_CLINICA/*`, `dr-swipe/public/cases/*`, `dr-swipe/dist/`. Los CSV se fijan a LF en `.gitattributes`.

## 7. Comandos y CI

```bash
python3 tools/validate_cases.py cases          # desde la raíz
cd dr-swipe && npm ci
npm test                                       # vitest, 16 archivos / 119 tests
npm run lint
npm run build                                  # prebuild sincroniza casos; luego tsc -b && vite build
npm run dev                                    # localhost:5173
```

Antes de cada commit de código: `npm run lint && npm test && npm run build` (el build corre `tsc -b`). El CI valida **toda** rama (validador, los tres `--check`, tests, build) y despliega a Cloudflare Pages solo desde `main`/`master`.

## 8. Trampas conocidas

- Para ver la app en un navegador: `npm run dev` (corre `sync_cases.js` y `regen_index.js`). Si arrancas `npx vite` directo, `public/cases/` queda vacío y "INICIAR GUARDIA" no hace nada. Hay un tutorial inicial con "SALTAR TUTORIAL"; tras "INICIAR GUARDIA" aparece la hoja del paciente con "INICIAR CONSULTA". Playwright y Chromium ya están instalados en el entorno de nube.

- Editar con regex y no compilar rompió el proyecto dos veces; lee `git diff` completo tras cualquier reemplazo masivo.
- Un renombre a medias en `gameMachine.ts` se detecta solo con `tsc`; busca el nombre antiguo con grep.
- Una acción de entrada a un estado no debe borrar datos que la pantalla de ese estado aún lee.
- `cases/case_index.json` es una lista, no un caso: cualquier script que recorra `cases/*.json` debe saltarlo (`sync_cases.js` filtra por prefijo `CASE_`).
- Los comentarios `vazquez_comment` se muestran tras acierto y tras error: redáctalos válidos en ambos casos; los regaños empiezan con `¿`.
- Vitales y comentarios repetidos: ~91 % de las cartas se repite idéntico entre variantes de una familia; solo cambia el escenario.
- Pendiente de decisión clínica: roséola (15 cartas) y umbral de SatO₂ en la GPC mexicana.

## 9. Pendientes vivos (resumen; detalle en `PLAN_SIGUIENTES_PASOS.md`)

Contenido: familias aún bajo 40 % de descarte (roséola, DPPNI, escarlatina, HPP, EVC isquémico, varicela, corioamnionitis, RPM, DM2, rubéola, eritema infeccioso, neumonía pediátrica); revisión clínica de las fuentes; variedad de comentarios del mentor; auditoría de las 1,797 preguntas de jefe.
Jugabilidad: conteo ascendente en el botín, dificultad adaptativa, telemetría opcional, simulacro ENARM.
Producción (ROADMAP Fase 7): Sentry/Analytics, E2E, v1.0.0. Balance de Favores por probar en móvil.
