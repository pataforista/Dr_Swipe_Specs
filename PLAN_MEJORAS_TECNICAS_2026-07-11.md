# Dr. Swipe — Deuda técnica pendiente e ideas estéticas

**Fecha:** 2026-07-11
**Rama de origen:** `claude/code-review-corrections-9sa8vs`
**Alcance:** observaciones de limpieza/duplicación (reuse, simplificación, altitud) detectadas durante la revisión de código del commit `eaca66d` ("1") que **no se corrigieron** por ser refactors de mayor alcance que un fix puntual, más ideas de mejora estética encontradas en el camino. Los bugs reales de esa revisión (bono de "guardia perfecta", barra del Shock Room, historial/errores por caso, undo de pago, XP invisible en rango máximo) **ya se corrigieron** en esa misma rama — no están aquí.

> Este documento es solo el plan. No se implementó ningún cambio de código en esta sesión.

---

## 1. Deuda técnica pendiente

### D1 — Pipeline de carga de caso triplicado en `App.tsx`
`startNewCase`, `resumeSession` y `startMistakesRepass` (líneas ~151–259) repiten casi verbatim: shuffle del boss triad (`c.boss_fight_triad?.questions.map(q => shuffleBossQuestion(q))`), cálculo de `timeLimit = clamp(90,180, cards·18)`, set de `timeLimitRef`/`pendingDeckRef`, `setShowIntro(true)`, y el mismo try/isLoadingCase/catch/finally con solo el texto del toast como diferencia. `handleCaseTransition` (línea ~305) recalcula el mismo `timeLimit` una cuarta vez.
**Propuesta:** extraer un `prepareCase(caseData)` que haga el shuffle + cálculo de tiempo + refs + `setShowIntro`, y un wrapper `withCaseLoading(fn)` para el andamiaje de loading/try/catch. Cada entry point pasa a: obtener su lista de casos → `prepareCase(caseData)`.
**Riesgo si no se hace:** un ajuste al time-limit o al shuffle (p. ej. cambiar la fórmula, o dejar de barajar el boss triad) requiere tocar 4 sitios; ya se ha desincronizado antes (solo `resumeSession` llama `setTimeLeft` explícitamente).

### D2 — Reset de contexto duplicado en `gameMachine.ts` (RESCUE / REVIVE_INTERN)
`fail_protection.RESCUE` (líneas 537–557) y `ghosted.REVIVE_INTERN` (líneas 565–585) resetean los mismos 13 campos (`vitality, currentCardIndex, caseStreak, score, coinsEarnedThisCase, dossier, discarded, feedbackHistory, mistakesThisCase, consecutiveErrors, lastVitals, lifelineActive, undoCharges, hasRescuedThisCase, lastAction`); solo difiere `lives` (`lives - 1` vs `1`).
**Propuesta:** un objeto/acción compartida `resetCaseProgress` reutilizado en ambas transiciones: `actions: [assign(resetCaseProgress), assign({ lives: ... })]`.
**Riesgo si no se hace:** ya pasó una vez en este mismo diff (se añadieron `discarded`/`consecutiveErrors`/`lastVitals` al reset de `RESCUE` y hubo que duplicarlo a mano en `REVIVE_INTERN`); un futuro campo nuevo puede quedar sin resetear en una de las dos rutas sin que ningún test lo note.

### D3 — Filtro de especialidad duplicado en `dataLoader.ts`
El bloque `go/ped/surg/im` → substrings `_GYN_/_OBS_/_PED_/_SURG_/SWIPE_` está copiado íntegro entre `loadRandomCase` (líneas 49–68) y `loadRandomCases` (líneas 89–108).
**Propuesta:** extraer `filterCaseIdsBySpecialty(index, specialty): string[]` y llamarla desde ambas.
**Nota:** ya hay una pequeña divergencia entre las dos copias (manejo de errores del fetch del índice), señal de que el duplicado se está empezando a desincronizar.

### D4 — Guard de `settings` repetido de forma independiente en `hapticFeedback.ts` y `useGameAudio.ts`
Cada archivo re-implementa por su cuenta "leer el flag de ajustes desde el store para decidir si emitir feedback", con manejo de `null`/default distinto (`store.settings && !store.settings.hapticsEnabled` vs `settings?.soundEnabled ?? true`).
**Propuesta:** un helper único (`isFeatureEnabled('hapticsEnabled' | 'soundEnabled')`) o, mejor, tipar `settings` en el store como siempre presente (ya se inicializa en el estado por defecto) para no necesitar el guard en cada consumidor.

### D5 — Default de `settings`/`caseStats` repetido en 4+ lugares
`App.tsx` (destructuring `settings = {...}`), `hapticFeedback.ts`, `useGameAudio.ts` y `useCodexStore.ts` (init) resuelven cada uno por separado la pregunta "¿existe `settings`/`caseStats`?".
**Propuesta:** tipar `settings`/`caseStats` como no-opcionales en `CodexState` (el estado inicial ya los define) y, si la preocupación real es compatibilidad con blobs persistidos antiguos sin esas claves, resolverlo una sola vez con `migrate`/`merge` de `zustand/persist` en vez de esparcir `?? true` / `|| {}` por el código.

### D6 — Dos sistemas de botón para el mismo rol semántico
`DoodleButton` (nuevo, con su propio CSS module de 377 líneas) se usa **solo** para "INICIAR GUARDIA"; el resto de acciones primarias de la misma pantalla (MODO ESTUDIO, REPASAR MIS ERRORES, REANUDAR GUARDIA, VER NOTAS, CONTRATAR INTERNO) siguen usando la clase compartida `.marker-btn`.
**Propuesta:** decidir uno de los dos sistemas para "botón primario de pantalla idle/ghosted" y migrar el resto, en vez de mantener dos implementaciones (estilo + estado disabled) que hay que igualar a mano cada vez que cambie el diseño.
**Ver también §2 (A1)** — el problema no es solo de mantenimiento, también es de consistencia visual.

### D7 — `startMistakesRepass` reimplementa el sampling de `dataLoader`
El "shuffle parcial de Fisher-Yates para elegir N ids al azar de un pool" (`App.tsx` líneas ~233–238) es casi idéntico al que ya vive en `dataLoader.loadRandomCases` (líneas 118–123).
**Propuesta:** exportar ese bloque como `pickRandom<T>(pool: T[], n: number): T[]` en `dataLoader.ts` (o un util aparte) y usarlo en ambos sitios.

---

## 2. Ideas de mejora estética

### A1 — `DoodleButton` rompe la paleta ya unificada (prioridad alta)
El resto de la UI sigue una estética "papel/washi tape" con acentos **teal** (`#0D9488`) y **coral/ámbar**, incluyendo los otros dos componentes "Doodle" nuevos (`DoodlePlayerCard`, `DoodleToggle`), que usan `--ink-color: #1e293b` + acentos teal/coral/amarillo consistentes. `DoodleButton.module.css`, en cambio, usa:
```css
background: #1e293b;          /* slate oscuro */
border: 3px solid #00d4ff;    /* cian neón */
box-shadow: 4px 4px 0 #ff007f, 8px 8px 0 rgba(0,212,255,.5), ...  /* magenta neón */
```
Es una estética "arcade retro neón" que no combina con el resto (y reintroduce justo el tipo de color — cian/magenta saturados — que un commit anterior (`style(ui): unificar paleta a teal`) se dedicó a eliminar). Es además el primer botón que ve el jugador, en la pantalla idle.
**Propuesta:** re-skinear `DoodleButton` con la misma paleta que `DoodlePlayerCard`/`DoodleToggle` (borde/sombra en `--ink-color`, acento teal o coral, sin cian/magenta neón), o retirarlo en favor de `.marker-btn` (ver D6).

### A2 — Residuos de `cyan-*` de Tailwind fuera del tema
Quedan dos usos de `cyan-*`: el tema del evento "lab" en `EventAlert.tsx` (`bg-cyan-50 border-cyan-200 text-cyan-800`) y la cinta decorativa `bg-cyan-100` en el header de `StatsDashboard.tsx`. Ninguno es necesariamente un error — pero conviene decidir explícitamente si el cian queda reservado como acento de "eventos de laboratorio" (y aplicarlo consistentemente donde haga falta) o si se termina de migrar a teal/ámbar como el resto de la paleta, en vez de que sean los dos únicos residuos sueltos.

### A3 — Jerarquía visual inconsistente entre CTAs de la misma pantalla
Aparte de la paleta (A1), `DoodleButton` tiene además otro peso/forma que `.marker-btn`: 68px de alto y 280px de ancho fijo con "wobble" al hover, contra el estilo `.marker-btn` (padding-based, ancho completo, sin animación de hover). El resultado es que "INICIAR GUARDIA" se lee como una jerarquía distinta al resto de botones que son igual de primarios en esa pantalla (MODO ESTUDIO, REANUDAR GUARDIA). Se resuelve junto con D6/A1.

### A4 — Badges de costo sin un patrón visual único
El costo de "comprar deshacer" se muestra como texto plano bajo el botón circular (`{UNDO_COST} 🪙`), mientras "CONTRATAR INTERNO" lo muestra inline en el label del botón (`({REVIVE_COST} 🪙)`) y "INICIAR GUARDIA" tiene un badge flotante tipo pill para "NUEVA" (`absolute -top-3 ... bg-rose-500 ... rounded-full ... animate-pulse`). Con `UNDO_COST`/`REVIVE_COST` ya centralizados como constantes (ver commit de esta rama), es un buen momento para centralizar también su presentación en un `CostBadge`/`PricePill` reutilizable en vez de tres tratamientos visuales distintos para "esto cuesta N monedas".

---

## 3. Resumen priorizado

| # | Ítem | Tipo | Esfuerzo | Nota |
|---|---|---|---|---|
| A1 | DoodleButton con paleta neón fuera de tema | Estética | S | Visible desde el primer segundo de juego |
| D6 | Dos sistemas de botón (DoodleButton vs marker-btn) | Duplicación + estética | S–M | Resolver junto a A1/A3 |
| D2 | Reset RESCUE/REVIVE_INTERN duplicado en la máquina | Duplicación | S | Ya se desincronizó una vez en este mismo diff |
| D1 | Pipeline de carga de caso triplicado en App.tsx | Duplicación | M | El de mayor tamaño de los cinco |
| D5 | Defaults de settings/caseStats esparcidos | Duplicación | S | Se resuelve tipando el store, no en cada consumidor |
| D4 | Guard de settings repetido (haptics/audio) | Duplicación | XS | Depende de D5 |
| D3 | Filtro de especialidad duplicado en dataLoader | Duplicación | XS | Ya divergió levemente |
| D7 | Sampling aleatorio reimplementado en App.tsx | Duplicación | XS | |
| A2 | Residuos de cyan-* fuera de tema | Estética | XS | Decisión de diseño, no bug |
| A4 | Badges de costo sin patrón visual único | Estética | S | Oportunista tras centralizar las constantes de costo |
