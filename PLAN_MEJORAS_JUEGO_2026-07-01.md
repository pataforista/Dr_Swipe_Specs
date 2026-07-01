# Dr. Swipe — Revisión del juego y plan de mejoras

**Fecha:** 2026-07-01
**Rama:** `claude/game-review-plan-cbi6c3`
**Alcance:** solo el juego (motor XState, componentes React, física de swipe, scoring, progresión/economía, audio, hápticos, PWA, accesibilidad, rendimiento y tooling). **Excluido:** todo el contenido clínico (casos, cartas, perlas, redacción médica, CORE_CANON).
**Método:** lectura directa de `dr-swipe/src/` completo (máquina, store, componentes, overlays, utils, hooks), config de build/PWA y contraste con la auditoría previa (`AUDITORIA_2026-06-25.md`) para no repetir lo ya cerrado.

> Este documento es **solo el plan**. No se implementó ningún cambio de código en esta sesión.

---

## 1. Veredicto general

El motor está bien construido: XState 5 con estados claros, scoring centralizado, persistencia defensiva (`safeStorage`), audio sintetizado sin binarios, física de swipe cuidada y protecciones contra doble-swipe y doble pago de recompensas. Lo encontrado se agrupa en:

- **3 bugs reales de gameplay** (uno hace inútil el sistema de vidas tras un timeout).
- **Un bloque grande de mecánicas muertas o invisibles** — la más grave: las perlas ENARM se coleccionan pero **nunca se muestran en ninguna pantalla**.
- Deuda de UX/economía/a11y y ausencia total de tests del motor.

---

## 2. Hallazgos

### 2.1 Bugs de gameplay (P0)

**B1 — Rescate tras TIME_OUT entra en bucle y quema las vidas.**
`RESCUE` (gameMachine.ts:514-522) resetea vitalidad e índice de carta, pero `timeLeft` vive en React (`App.tsx`) y **nadie lo resetea al rescatar**. Si la muerte fue por tiempo (`timeLeft === 0`), al volver a `triage` el efecto de App.tsx:76 re-dispara `TIME_OUT` inmediatamente: el overlay reaparece, y cada pulsación de "CAMBIAR DE INTERNO" quema una vida sin que el jugador pueda jugar ni un segundo. Las 5 vidas se pierden en 5 taps.

**B2 — RESCUE no limpia el estado por-caso: puntos duplicados y diario corrupto.**
Al rescatar, `currentCardIndex` vuelve a 0 pero `score`, `coinsEarnedThisCase`, `dossier`, `discarded`, `feedbackHistory` y `mistakesThisCase` **conservan sus valores**. Rejugar el mazo:
- vuelve a sumar puntos y monedas por las mismas cartas (exploit: fallar a propósito para re-farmear el caso);
- duplica cada carta en `dossier` y en `feedbackHistory` (la retrospectiva muestra entradas repetidas);
- `mistakesThisCase` arrastrado hace imposible el bono de guardia perfecta aunque la repetición sea impecable.

**B3 — UNDO_SWIPE restaura el estado a medias.**
`lastAction` guarda `lastVitals` pero el handler de `UNDO_SWIPE` (gameMachine.ts:407-421) **no lo restaura**, y tampoco revierte `discarded` ni `consecutiveErrors`. Consecuencias: el monitor de telemetría muestra vitales de una carta que ya no ocurrió, y una racha de errores puede disparar la penalización aunque el jugador deshiciera el error.

### 2.2 Mecánicas muertas o invisibles (P1)

**M1 — Las perlas ENARM nunca se ven.** `unlockPearl()` las guarda en el store al ganar, pero **ningún componente lee `unlockedPearls`** (verificado por grep). Además, `debriefData.title/text` (el contenido de la perla) jamás se renderiza: la pantalla de debrief solo pinta `comment` (que siempre es `""`) y la referencia GPC. El jugador colecciona algo que no puede ver, y la recompensa educativa central del juego es invisible tanto al ganar como al perder.

**M2 — La pausa es inalcanzable.** El overlay de pausa existe (App.tsx:443-451) y el timer la respeta, pero **no hay ningún botón que llame a `setIsPaused(true)`**. Código muerto de cara al jugador.

**M3 — Modo Sandía nunca activable.** `isSandiaMode` (sin daño, sin timer, recompensas ×0.5) está implementado en toda la máquina, pero `START_GUARD` desde App nunca lo pasa. No existe UI para elegirlo. O se expone como "modo estudio/zen" o se retira.

**M4 — La retrospectiva solo la ven los que pierden.** `RetrospectiveView` (el log de aprendizaje carta por carta) solo es accesible desde `debrief`, que solo se alcanza vía `ghosted`. Al ganar, `feedbackHistory` se resetea en `CONTINUE_SHIFT` y el `LootScreen` no ofrece repaso. Se castiga con menos aprendizaje precisamente a quien acierta.

**M5 — Contexto y campos muertos en el motor.**
- `warningCount`: se persiste y restaura, jamás se incrementa.
- `totalCasesInShift` / `casesCompleted`: no gobiernan nada (el fin de guardia lo decide `caseQueue` en App).
- `discarded`: se llena y nunca se lee.
- `stats.rank` en el store: congelado en `'R0 Aspirante'`; `StatsDashboard` calcula el rango por su cuenta con umbrales propios (lógica duplicada).
- Ya señalados en la auditoría anterior y aún vigentes: `patient_intro.time_limit_sec` ignorado (App calcula `clamp(90,180, n·18)`), `dynamic_value` y `qte_fallback` en schema/tipos sin uso.

**M6 — Eventos y penalizaciones sin dientes.** Los eventos aleatorios (lab/archivo/sistémico, 5% por acierto) y la penalización por 5 errores seguidos son puramente narrativos — `EventAlert` incluso lo admite ("Anotado en la bitácora"). Interrumpen el flujo con un modal a cambio de nada mecánico. Decidir: darles efecto real (p. ej. lab = pista gratis, sistémico = −10s, penalización = −1 undo) o rebajarlos a toasts no bloqueantes.

### 2.3 Progresión y economía (P1–P2)

**E1 — Selección de casos 100% aleatoria.** `loadRandomCases` no consulta `history` (casos ya resueltos) ni los errores del jugador; `dataLoader` soporta filtro por especialidad pero la UI nunca lo expone. Con 598 casos no urge el anti-repetición, pero el filtro por materia y el sesgo hacia casos fallados (repaso) son las palancas de retención más baratas que existen ya a medio construir.

**E2 — Economía de monedas con un solo sumidero.** Ingresos por carta, rachas, hitos y guardias perfectas contra un único gasto (`LIFELINE_COST = 25`). En pocas sesiones el jugador nada en monedas y el escáner pierde valor de decisión. Faltan sumideros (comprar undo extra, revivir interno, cosméticos de libreta) o precios escalonados.

**E3 — Bonus de velocidad anti-educativo (ya señalado, sigue vigente).** `timeTaken < 1200ms` da ×1.2 y monedas extra: premia contestar antes de poder leer. Sustituir por un bonus que premie lo que el juego quiere enseñar (p. ej. acierto en cartas letales/critical) o eliminarlo.

**E4 — Inconsistencias menores de progresión.** `resumeSession()` no llama a `incrementSessions()` ni `updateDailyStreak()` (reanudar no cuenta para la racha diaria); `history` crece sin límite y admite duplicados; `best_score` compara scores por-caso contra un histórico que antes era por-guardia.

### 2.4 UX / UI (P2)

**U1 — Sin panel de ajustes.** No hay mute ni volumen (ganancia fija 0.35), ni toggle de hápticos, ni forma de rever el tutorial. Mínimo viable: un modal con 3 switches persistidos en el store.

**U2 — Leftovers de paleta fuera del teal.** Pese al commit de unificación quedan: `bg-cyan-100/400` y `text-cyan-600` en `StatsDashboard`, `bg-cyan-100` y `shadow-cyan-100` en `LootScreen`, `shadow-cyan-100` en `RetrospectiveView`, tema cian del evento "lab" en `EventAlert`, `GlitchText` y — el más visible — **`theme_color: '#FF007F'` (rosa neón) en el manifest PWA**, que tiñe la barra del sistema en móvil.

**U3 — Badge "¡Letal!" ambiguo (vigente de la auditoría).** Mismo sello para `lethal_risk` (letal si lo mantienes) y `lethal_if_discarded` (letal si lo descartas). Necesita direccionalidad visual.

**U4 — ShockRoom mejorable.** Los chips del dossier muestran `card_id` técnico (`#001_014`) en vez de un extracto legible; al fallar un intento no hay explicación (solo shake), perdiendo el momento de mayor atención del jugador; la barra de progreso marca `currentStep + 1` antes de responder.

**U5 — Densidad visual en triage.** Con mazos de 13 cartas los dots de progreso hacen wrap en pantallas angostas (mejor una barra continua); el bocadillo del mentor (top-28) puede solaparse con el monitor de vitales (top-24/28 derecha) en móviles angostos; el texto de carta >150 caracteres cae a `text-sm`.

**U6 — Naming del mentor mezclado (vigente).** Código dice "vazquez" (`cleanVazquezComment`, `vazquez_comment`), la UI muestra a "Mendoza"; `AvatarFeedback` soporta 3 doctores pero siempre se usa uno.

### 2.5 Accesibilidad (P2–P3)

- El feedback de swipe (toast, bocadillo del mentor) no usa `aria-live`; un lector de pantalla no se entera de si acertó.
- Los overlays (loot, penalización, fail) no atrapan el foco ni se cierran con `Escape`; tras cerrar, el foco no vuelve al mazo.
- La carta activa no es un elemento enfocable con descripción; el juego con teclado funciona (flechas) pero es indescubrible — no se anuncia en ningún lugar de la UI.
- Persisten textos de 9–10px en chips y labels (los accionables ya se subieron en E3/A1/A3 previos).

### 2.6 Técnico / rendimiento / build (P3)

- **Cero tests.** `scoringEngine`, `gameMachine` (rescate, undo, reward), `formatters` y `vitalsParser` son puros y perfectamente testeables; no hay Vitest ni paso de test en CI. Los bugs B1–B3 habrían sido atrapados por tests de máquina.
- **Re-render por segundo:** `timeLeft` vive en App, así que cada tick re-renderiza el árbol completo; `SwipeDeck` no está memoizado y recalcula 3 tarjetas framer-motion por segundo. Aislar el countdown o memoizar.
- El comparator de `TelemetryHUD` usa `JSON.stringify` sobre `lastVitals` en cada render (funciona, pero es el patrón caro para un memo).
- El interval del timer se destruye/recrea en cada tick (deps incluyen `timeLeft`); funcional pero con drift acumulado.
- Conflicto peer-deps `vite-plugin-pwa` vs `vite@8` enmascarado con `--legacy-peer-deps` en CI (vigente).
- Higiene: los 598 casos están duplicados en git (`cases/` y `dr-swipe/public/cases/`); convertir la copia de `public/` en artefacto de build (script de sync en `prebuild`, como ya existe `regen_index.js`) eliminaría ~2× peso y el riesgo de divergencia. Destino de `_LEGACY_ARCHIVE/` (~2.6 MB) sigue sin decidirse.

---

## 3. Plan de ejecución

Cinco fases ordenadas por impacto/esfuerzo. Cada una es un PR independiente y verificable.

### Fase 0 — Corrección de bugs de gameplay (P0, ~½ día)
**Archivos:** `machines/gameMachine.ts`, `App.tsx`.
1. **B1:** resetear el timer al rescatar — exponer el rescate como callback en App que haga `setTimeLeft(timeLimitRef.current)` antes/junto al `send({type:'RESCUE'})`, o mover `timeLeft` al contexto de la máquina (preferible a largo plazo, ver Fase 4).
2. **B2:** en la acción de `RESCUE`, resetear `score` (o congelar el re-scoring), `coinsEarnedThisCase`, `dossier`, `discarded`, `feedbackHistory`, `mistakesThisCase`, `consecutiveErrors` y `lastVitals`. Decisión de diseño a tomar: ¿el rescate rejuega el caso "limpio" (recomendado: sí, pero marcando el caso como no-elegible para bono perfecto)?
3. **B3:** incluir `discarded`, `lastVitals` y `consecutiveErrors` en `lastAction` y restaurarlos en `UNDO_SWIPE`.
**Aceptación:** morir por timeout → rescatar → el timer arranca completo y el caso rejugado no duplica puntos, monedas ni entradas del diario; undo tras descartar una carta de vitales revierte el monitor.

### Fase 1 — Activar o retirar lo muerto (P1, ~1–1.5 días)
**Archivos:** `App.tsx`, `gameMachine.ts`, `useCodexStore.ts`, `StatsDashboard.tsx`, `LootScreen.tsx`, componente nuevo `PearlCodex`, `types/game.ts`, `caseSchema.ts`.
1. **Perlas visibles (M1):** (a) mostrar la perla del caso (título + texto + GPC) en el `LootScreen` al ganar y en el debrief al perder (renderizar `debriefData.title/text`, hoy ignorados); (b) vista "Códex de Perlas" accesible desde el dashboard que liste `unlockedPearls` (ya persistidas). Es la mejora de mayor valor percibido de todo el plan.
2. **Pausa (M2):** botón de pausa en el HUD durante triage (el overlay y la lógica de timer ya existen).
3. **Retrospectiva para ganadores (M4):** botón "VER REPASO 📋" en `LootScreen` antes de `CONTINUE_SHIFT` (el historial aún está vivo en ese estado).
4. **Modo Sandía (M3):** decisión binaria — exponerlo como "Modo Estudio" (segundo botón en idle: sin vidas, sin timer, ideal para repaso) **o** eliminar `isSandiaMode` de la máquina. Recomendación: exponerlo; el costo es un botón y ya está todo implementado.
5. **Limpieza de motor (M5):** eliminar `warningCount`, `totalCasesInShift`/`casesCompleted` (o usarlos de verdad para el fin de guardia), `discarded` (si no se usa en 1.3), `stats.rank` del store (dejar el cálculo en un solo lugar, `getRank`, exportado); retirar `dynamic_value` y `qte_fallback` de tipos y schema; decidir `time_limit_sec` (recomendado: usarlo si existe, con el clamp actual como fallback).
6. **Eventos con dientes (M6):** elegir por tipo — propuesta mínima sin tocar contenido clínico: lab = revela la pista de la carta actual gratis; archivo = +10 monedas; sistémico = −10s de timer; penalización = −1 undo. Alternativa barata: degradarlos a toast no bloqueante.
**Aceptación:** una partida ganada muestra perla y permite repaso; existe botón de pausa; el contexto de la máquina no tiene campos que ningún código lea.

### Fase 2 — Progresión y economía (P1–P2, ~1–2 días)
**Archivos:** `dataLoader.ts`, `App.tsx`, `useCodexStore.ts`, `scoringEngine.ts`, pantalla idle.
1. **Selector de especialidad (E1):** chips en la pantalla idle (Pediatría, GO, Medicina Interna, Cirugía, "Mixta") mapeados al filtro que `dataLoader` ya soporta por substring del `case_id`.
2. **Anti-repetición y repaso (E1):** excluir de la selección los últimos N `history` (p. ej. 30) mientras queden suficientes; opción "Repasar mis errores" que siembre la guardia con casos donde el jugador falló (requiere guardar `caseId → mistakes` en el store, hoy solo hay agregado global).
3. **Sumideros de monedas (E2):** revivir interno extra (75 🪙) desde el `FailProtectionOverlay` cuando `lives === 0`, undo extra (40 🪙) al agotar cargas. Revisar precio del escáner tras medir (25 puede quedarse).
4. **Speed bonus (E3):** eliminar el umbral <1200ms; mover el ×1.2/monedas a "acierto en carta letal o decision_critical". Ajustar `ScoreBreakdown.bonusType` y el toast.
5. **Consistencias (E4):** `resumeSession` debe contar sesión y racha; deduplicar `history` o convertirlo en `Record<caseId, {times, lastScore}>` (habilita 2.2); definir `best_score` como "mejor caso" y etiquetarlo así en el dashboard.
**Aceptación:** dos guardias seguidas no repiten caso; se puede jugar "solo Pediatría"; existe al menos un sumidero nuevo de monedas; el bonus rápido ya no es alcanzable adivinando.

### Fase 3 — UX, estética y accesibilidad (P2, ~1–1.5 días)
**Archivos:** `StatsDashboard.tsx`, `LootScreen.tsx`, `RetrospectiveView.tsx`, `EventAlert.tsx`, `GlitchText.tsx`, `vite.config.ts`, `SwipeDeck.tsx`, `ShockRoom.tsx`, overlays, `AvatarFeedback.tsx`, `formatters.ts`.
1. **Paleta (U2):** barrido final de `cyan-*` → teal/ámbar según rol; `theme_color` del manifest a `#0D9488`.
2. **Badge letal direccional (U3):** dos variantes — `lethal_risk` → "☠️ LETAL SI LO ACEPTAS" (rosa) y `lethal_if_discarded` → "⚠️ LETAL SI LO TIRAS" (ámbar/rosa invertido) — y reflejarlo también en el prefijo de `cleanVazquezComment`.
3. **ShockRoom (U4):** chips del dossier con extracto del `card_text` (primeros ~40 chars) en vez de id; al fallar el primer intento, mostrar 1 línea de orientación (sin revelar la respuesta); barra de progreso basada en respuestas completadas.
4. **Triage (U5):** barra de progreso continua en mazos >10 cartas; auditar solape mentor/monitor a 360px.
5. **Ajustes (U1):** modal con sonido on/off (+ slider simple), hápticos on/off, "ver tutorial de nuevo"; persistido en el store; `AudioEngine` lee el flag.
6. **A11y:** `aria-live="polite"` en `FeedbackToast`/bocadillo del mentor; focus-trap + `Escape` en overlays modales; hint visible de controles de teclado en el tutorial; `role`/`aria-label` descriptivo en la carta activa.
7. **Naming (U6):** unificar a un solo mentor (renombrar `cleanVazquezComment` → `cleanMentorComment`; el campo JSON `vazquez_comment` se queda — tocarlo sería contenido).
**Aceptación:** cero clases `cyan-*` fuera del tema de eventos que se decida conservar; VoiceOver/NVDA anuncia el resultado de cada swipe; los dos flags letales se distinguen a simple vista.

### Fase 4 — Base técnica (P3, ~1–2 días, paralelizable)
**Archivos:** `package.json`, `vite.config.ts`, CI, `App.tsx`, nuevos `*.test.ts`.
1. **Tests (primero):** añadir Vitest + paso en CI. Cobertura mínima: `scoringEngine` (letales, combos, hitos, dificultad), `gameMachine` (flujo completo, RESCUE post-B1/B2, UNDO post-B3, doble-pago de reward), `formatters` (`shuffleBossQuestion` conserva la correcta), `vitalsParser`. Escribirlos **antes** de refactorizar lo demás de esta fase.
2. **Timer:** mover el countdown a la máquina (actor/`after`) o a un componente hoja con su propio estado, para que App no se re-renderice cada segundo; memoizar `SwipeDeck`.
3. **TelemetryHUD:** comparación por campos de `lastVitals` en vez de `JSON.stringify`.
4. **Build:** resolver peer-deps de `vite-plugin-pwa`/Vite 8 (subir plugin o fijar Vite) y quitar `--legacy-peer-deps` del workflow.
5. **Higiene de repo:** script `sync_cases` en `prebuild` que copie `cases/` → `public/cases/` (fuente única en git, copia ignorada); ejecutar la decisión pendiente sobre `_LEGACY_ARCHIVE/`.
**Aceptación:** `npm test` verde en CI sin flags legacy; perfil de React DevTools sin re-render de `SwipeDeck` en cada tick; un solo directorio de casos versionado.

---

## 4. Resumen priorizado

| # | Ítem | Sev. | Fase | Esfuerzo |
|---|---|---|---|---|
| B1 | Bucle de rescate tras timeout quema las 5 vidas | 🔴 P0 | 0 | XS |
| B2 | RESCUE duplica puntos/monedas/diario | 🔴 P0 | 0 | S |
| B3 | UNDO no restaura vitales/descartes/errores | 🟠 P0 | 0 | XS |
| M1 | Perlas ENARM invisibles (sin códex ni render) | 🟠 P1 | 1 | M |
| M2 | Pausa inalcanzable | 🟠 P1 | 1 | XS |
| M4 | Retrospectiva solo para perdedores | 🟠 P1 | 1 | XS |
| M3 | Modo Sandía nunca activable | 🟡 P1 | 1 | XS |
| M5 | Contexto/campos muertos del motor | 🟡 P1 | 1 | S |
| M6 | Eventos/penalizaciones sin efecto | 🟡 P1 | 1 | S |
| E1 | Selección de casos ciega (sin especialidad/historial) | 🟡 P1 | 2 | M |
| E2 | Economía con un solo sumidero | 🟡 P2 | 2 | S |
| E3 | Speed bonus premia no leer | 🟡 P2 | 2 | XS |
| E4 | Racha/sesiones inconsistentes al reanudar | 🟢 P2 | 2 | XS |
| U1–U6 | Ajustes, paleta, badge letal, ShockRoom, densidad, naming | 🟡 P2 | 3 | M |
| A11y | aria-live, focus trap, teclado descubrible | 🟡 P2 | 3 | S |
| T1 | Cero tests del motor | 🟠 P3 | 4 | M |
| T2–T5 | Re-render por tick, peer-deps, casos duplicados en git | 🟢 P3 | 4 | M |

**Orden recomendado de PRs:** Fase 0 → Fase 1 → (Fase 4.1 tests puede adelantarse en paralelo) → Fase 2 → Fase 3 → resto de Fase 4.
