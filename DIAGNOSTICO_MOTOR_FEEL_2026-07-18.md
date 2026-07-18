# Dr. Swipe — Diagnóstico integral: motor, estética y game feel

**Fecha:** 2026-07-18
**Rama:** `claude/engine-diagnostic-review-4wwc2o`
**Alcance:** todo el motor (`dr-swipe/src/`), la capa estética (paleta, tipografía, iconografía, componentes UI) y el *game feel* real (juice, física, feedback sensorial, ritmo). Excluido: contenido clínico.
**Método:** lectura completa del código actual, verificación por grep de cada clase/constante referenciada, y **ejecución real** de `npm ci`, `vitest` y `npm run build` en local. Se contrastó contra `PLAN_MEJORAS_JUEGO_2026-07-01.md` y `PLAN_MEJORAS_TECNICAS_2026-07-11.md` para reportar solo lo nuevo o lo aún vigente.

> Este documento es solo el diagnóstico. No se implementó ningún cambio de código en esta sesión (el `package-lock.json` tocado por la verificación local fue revertido).

---

## 1. Veredicto general

La base es seria: XState 5 con guardas correctas, scoring centralizado, Zod validando cada caso, persistencia defensiva, audio 100% sintetizado, física de swipe con momentum, y la gran mayoría de lo planificado en julio **ya está implementado** (pausa, ajustes, códex de perlas, modo estudio, selector de especialidad, repaso de errores, eventos con efecto mecánico, sumideros de monedas, bonus crítico en vez de speed bonus, badges letales direccionales, 23 tests que pasan).

Lo que separa hoy a Dr. Swipe de un juego "de verdad" no es la arquitectura — son tres cosas:

1. **El juice está escrito pero desconectado.** Las tres clases CSS que producen los efectos más importantes del juego (`shake-lite`, `destabilized-content`, `medical-grid`) **no existen en ningún archivo CSS**. El screen-shake al fallar, el modo de urgencia de los últimos 10 segundos y todas las texturas de papel son divs que no renderizan nada.
2. **La estética no tiene una identidad decidida.** El CSS declara "primary = teal médico", pero el CTA principal es magenta `#FF007F`, el botón de la pantalla inicial es cian neón sobre slate oscuro, y toda la iconografía son emojis del sistema. Conviven tres lenguajes visuales (papel/washi rosa, clínico teal, arcade neón) sin que ninguno mande.
3. **La tubería de calidad está rota.** `npm ci` falla (lockfile desincronizado → el deploy de CI está roto tal como está el repo), y los tests existen pero **nadie los ejecuta**: no hay script `test` en `package.json` ni paso de test en el workflow.

---

## 2. Roto ahora mismo (P0)

### R1 — `npm ci` falla: el pipeline de CI/deploy está roto
Verificado en local: `npm ci` aborta con `EUSAGE — lock file out of sync` (faltan `@emnapi/core`, `@emnapi/runtime`; versión inválida de `@emnapi/wasi-threads`). El workflow `cloudflare-deploy.yml` usa exactamente `npm ci`, así que **el próximo push a main no despliega**. Causa probable: un `package.json` editado a mano (ver R3) sin regenerar el lock.
**Fix:** `npm install` + commit del lockfile regenerado (1 min).

### R2 — Los tests existen, pasan… y nunca corren
`src/tests/` tiene 23 tests (máquina, scoring, helpers) y **los 23 pasan** (`npx vitest run`, verificado). Pero `package.json` no tiene script `test` y el workflow de CI no ejecuta vitest — solo `tsc + build`. Es la ilusión de una red de seguridad: cualquier regresión de gameplay entra a main sin resistencia. Los bugs B1–B3 de la revisión de julio habrían pasado igual.
**Fix:** `"test": "vitest run"` + paso en CI antes del build (5 min).

### R3 — Tailwind v3 y v4 instalados a la vez
`dependencies` trae `@tailwindcss/vite@^4.2.2` (el plugin de Tailwind 4, **no usado** en `vite.config.ts`) mientras `devDependencies` trae `tailwindcss@^3.4.19` (el que realmente compila vía PostCSS). Una dependencia muerta de otra major version que confunde la resolución de npm y es la sospechosa directa del lockfile roto de R1.
**Fix:** eliminar `@tailwindcss/vite` (o migrar de verdad a v4, pero no a medias).

### R4 — Clases CSS fantasma: el juice principal no existe
Verificado por grep en todo el repo — **ninguna definición** de:

| Clase | Dónde se usa | Qué debería hacer | Qué hace |
|---|---|---|---|
| `shake-lite` | `App.tsx:595` (raíz, al fallar un swipe) | Screen-shake de error | **Nada** |
| `destabilized-content` | `App.tsx:595` (últimos 10s de triage) | Modo pánico visual | **Nada** |
| `medical-grid` | App, ShockRoom, StatsDashboard, LootScreen, TutorialOverlay, RetrospectiveView | Textura de fondo | **Nada** (divs vacíos) |

El momento de mayor carga emocional del juego (fallar, y el countdown final) no tiene **ninguna** respuesta visual de pantalla completa. Esto por sí solo explica gran parte de la sensación de "proyecto escolar": el jugador falla y el mundo no reacciona.
**Fix:** definir las tres clases en `index.css` (keyframes de shake ~300ms, un tinte/pulso rojo sutil para destabilized, un dot-grid o cruz médica en SVG data-URI para la textura) — o retirar las referencias. Recomendado: definirlas; ya hay `@media (prefers-reduced-motion)` global que las neutraliza para quien lo necesita.

---

## 3. Game feel — lo que falta para que se sienta "real" (P1)

### F1 — El "blink" de la siguiente carta rompe la continuidad del mazo
`SwipeDeck` fuerza remount de la carta al promoverla (`key={card.card_id}-{isTop}`) y la monta con `initial={{opacity: 0, scale: 0.9, y: 30}}`. Resultado: la carta que el jugador **ya veía** detrás (al 90% de opacidad) desaparece un frame y reaparece con fade desde abajo. En un juego de swipe, la promoción del mazo es EL movimiento central — Tinder/Reigns la resuelven con la carta trasera deslizándose continuamente a su lugar. Además, `SWIPE_CONFIG.REVEAL_DELAY` (50 ms, "next card reveal") está **definido y jamás usado** — el spec de feel existe, la implementación no.
**Fix:** en vez de remount+fade, animar la promoción: la carta del stack transiciona `scale 0.96→1, y 12→0` con spring mientras la superior sale. El remount por `key` puede conservarse para resetear los drag handlers, pero el `initial` del nuevo top debe partir del estado visual que tenía en el stack (scale 0.96, y 12, opacity 0.9), no de opacity 0.

### F2 — El error no pesa
Al fallar hoy: suena el buzz, vibra, el toast muestra "−N PTS"… y ya. El shake no funciona (R4), no hay flash/vignette rojo, la barra de vitalidad baja sin animación de daño (el `-15` no se ve como golpe), no hay micro-pausa. El acierto y el error se *sienten* casi iguales — y en un juego que enseña a no matar pacientes, el error letal (−1000 pts) se ve idéntico a un error de −25.
**Fix (jerarquía de impacto):** error normal = shake corto + flash rojo 150 ms + tramo rojo parpadeante en la barra de vitalidad; error **letal** = todo lo anterior más fuerte + hit-stop de ~120 ms (congelar la UI un instante) + patrón háptico `lethalError` (ya existe en `hapticFeedback.ts` ¡y nadie lo llama! — verificado por grep) + sonido grave dedicado. Hoy `lethalError`, `dragHeavy` y `qteInteract` son patrones hápticos definidos y huérfanos.

### F3 — El combo no escala sensorialmente
El combo es la mecánica de tensión positiva y su única manifestación es un pill estático `x{combo} ✨` de 10px. Los milestones (5/8/12/16/20) pagan monedas pero suenan y se ven exactamente igual que cualquier acierto.
**Fix barato y de alto impacto:** (a) subir el pitch de `correct()` un semitono por cada punto de combo (el motor de audio ya es paramétrico — es cambiar `from: 660` por `from: 660 * 2^(combo/12)`); (b) el pill crece/cambia de color por tramos (slate→amber→rose); (c) en milestone, un burst de partículas/estrellas sobre el mazo y el arpegio `gacha()` corto. Nada de esto toca contenido.

### F4 — Dos sistemas de toast en dos esquinas distintas
`FeedbackToast` (puntos por swipe) vive **fijo en bottom-right** — posición de escritorio; en un móvil en portrait cae sobre/junto a los botones de acción y lejos de donde mira el jugador (la carta). `RewardToast` (monedas/hitos) vive en bottom-center. Dos componentes, dos anclas, dos estilos para el mismo rol de "notificación efímera".
**Fix:** un solo sistema de toast anclado **sobre el mazo** (donde ya está la mirada), con variantes (puntos/monedas/hito). Los puntos del swipe pueden incluso volar desde la carta hacia el marcador del HUD (feedback espacial: "esto que hice produjo esto que gané").

### F5 — Doble-swipe posible combinando drag + botón
`isAnimatingRef` solo protege el camino de los botones/teclado. `handleDragEnd` no lo setea: durante los 250 ms del exit animation tras soltar el drag, `topCardRef` sigue apuntando a la carta saliente y un tap en ✕/♥ dispara `swipeOut` de nuevo → **dos** `onSwipe` para decisiones distintas del mismo jugador (la segunda se aplica a la carta siguiente sin verla). Ventana corta pero alcanzable con spam en móvil.
**Fix:** setear `isAnimatingRef.current = true` también al inicio del branch de éxito de `handleDragEnd` (y liberarlo en el `finally` implícito tras `onSwipe`).

### F6 — El timer re-renderiza el juego entero cada segundo
`timeLeft` vive como estado de `App`, así que cada tick re-renderiza todo el árbol; `SwipeDeck` **no está memoizado** y recalcula sus 3 tarjetas framer-motion por segundo. Además el `useEffect` del timer se destruye/recrea en cada tick (deps incluyen `timeLeft`) acumulando drift. Ya estaba en el plan de julio (Fase 4.2) y sigue vigente; en gama baja se nota como micro-jank durante el drag — exactamente donde el feel más importa.
**Fix:** countdown en la máquina (actor con `after`) o en un componente hoja con su propio estado + `React.memo(SwipeDeck)`.

### F7 — El Shock Room es mudo y su reloj es inconsistente
La fase de máxima tensión no tiene **ningún** sonido propio: no suena al acertar un paso, no suena el intento fallido intermedio (solo el game-over), no hay tick de urgencia (el de triage se apaga al salir de `triage`). Además el primer paso da 15 s y los siguientes 12 s sin razón visible, y el interval se recrea cada segundo (mismo patrón que F6).
**Fix:** reutilizar `tick()` bajo 5 s, `correct()`/`wrong()` por respuesta, y unificar el tiempo por paso en una constante.

### F8 — La pantalla idle no invita a jugar
Es un menú estático: título, chips, 4–5 botones apilados (cada uno de un color y estilo distinto — ver E2). No hay mazo asomándose, ni mentor saludando, ni preview del caso. Para un juego cuyo core loop es táctil, la primera pantalla no comunica "esto se desliza".
**Fix (idea, no requisito):** una mini-carta decorativa flotando con `animate={{y: [0,-6,0]}}` detrás del CTA, o el avatar del mentor con un globo de bienvenida (componentes ya existentes).

---

## 4. Estética (P1–P2)

### E1 — Identidad cromática indecisa: el juego dice teal pero viste magenta
- `--primary: #0D9488` (teal) es la paleta declarada y el commit de julio dice "unificar paleta a teal"…
- …pero `.marker-btn` — **todos** los CTAs del juego — es `#FF007F` magenta neón, la washi-tape es rosa `#FF007F22`, el scrollbar es rosa, y el `theme_color` del manifest PWA sigue en `#FF007F` (tercera revisión consecutiva que lo señala: tiñe la barra de estado del móvil de rosa neón sobre una UI crema).
- `DoodleButton` (el PRIMER botón que ve el jugador) añade un tercer lenguaje: slate oscuro `#1e293b` + borde cian `#00d4ff` + sombras magenta + texto amarillo `#ffea00` al hover — estética arcade que no comparte un solo color con el resto (señalado como A1 en el plan del 07-11, sin cambios).

**Decisión a tomar (una vez, y aplicarla en todo):** o el rosa `#FF007F` es el acento de marca oficial (y entonces teal pasa a color de "acierto/keep" y el manifest queda rosa a propósito), o se ejecuta de verdad la unificación teal y `.marker-btn`/washi/scrollbar/manifest migran. Cualquiera de las dos es defendible; la mezcla actual no.

### E2 — Cinco estilos de botón en una sola pantalla
En idle conviven: DoodleButton (neón, 280px fijo, wobble), `.marker-btn` magenta, `.marker-btn !bg-emerald-600`, `.marker-btn !bg-rose-600`, `.marker-btn !bg-slate-700`, más links de texto. Cinco jerarquías visuales para cinco acciones del mismo rango. (D6/A3 del plan anterior, sin cambios.)
**Fix:** un `PrimaryButton` con prop `variant` (primary/study/review/resume) que comparta forma, sombra y tipografía, variando solo el acento.

### E3 — Tipografía: todo grita, nada destaca
- `Fraunces 900` + `uppercase` + `tracking-[0.3em]` se aplica igual a un título de pantalla que a un label de 9px. Cuando todo es black/uppercase/wide-tracking, la jerarquía se aplana — el ojo no sabe qué leer primero.
- **31 usos** de `text-[8px]`/`text-[9px]` (verificado por grep): por debajo del mínimo legible en móvil (~11px) y del mínimo WCAG táctil cuando son labels de botones.
- Incoherencias de config: `font-sans` de Tailwind es `Inter` (se descarga de Google Fonts) pero el `body` fuerza `Outfit` — Inter se paga en red y casi no se usa; `font-playful` (Comic Sans) declarado y sin un solo uso.
**Fix:** escala tipográfica de 4 niveles (display Fraunces / heading Fraunces / body Outfit / label Outfit 11px+), reservar el tracking ancho solo para labels, y quitar Inter del `<link>` o del config.

### E4 — Iconografía = emojis del sistema
Toda la iconografía del juego (🎁 💀 💰 👴 🧬 ⏪ 🚑 ✨…) son emojis: renderizan distinto en iOS/Android/desktop, no se pueden colorear con la paleta, y son el segundo gran responsable del look "proyecto de primaria". Irónicamente `public/icons.svg` existe **y no se referencia en ningún lado** (verificado).
**Fix:** un set SVG único (el sprite existente, o lucide con stroke redondeado que casa con el estilo doodle) para los iconos funcionales (acciones, HUD, stats). Los emojis pueden quedarse donde son "sticker" decorativo intencional (loot, mentor), pero no como iconos de UI.

### E5 — Residuos y muertos visuales
- `GlitchText.tsx` sin un solo consumidor + sus keyframes `glitch-before/after` en `tailwind.config.js` — estética de otro juego (cyberpunk) que ya no existe aquí.
- Familias de color muertas en tailwind: `moomin.*`, `specialty.*`, `medical.*` (grep: solo definiciones).
- `bg-cyan-100` en StatsDashboard y tema cian del evento "lab" (A2 anterior: falta la decisión "cian = laboratorio, sí o no").
- Assets huérfanos: `hero.png`, `react.svg`, `vite.svg`.
- `.marker-btn` con `padding` declarado dos veces y `!important`s — funciona, pero es el tipo de CSS que se degrada rápido.

---

## 5. Motor y arquitectura (P2–P3)

### M1 — Zombies confirmados aún vivos (de M5 del plan de julio)
- `warningCount`: se persiste, se restaura en RESUME… y **nada lo incrementa jamás**. Ciclo de vida completo de un dato que siempre vale 0.
- `totalCasesInShift` / `casesCompleted`: se setean y suman, no gobiernan nada (el fin de guardia lo decide `caseQueue` en App).
- `time_limit_sec` (schema): ignorado — App sigue con `clamp(90,180, cards·18)` calculado en 4 sitios (D1 del plan del 07-11, sin cambios).
- `dynamic_value` y `qte_fallback` en tipos/schema sin consumidores.
- `swipePhysics.ts`: `REVEAL_DELAY`, `FEEDBACK_TOAST_DELAY`, `MAX_ROTATION` y todo el objeto `HAPTIC_PATTERNS` (duplicado conceptual de `hapticFeedback.ts`) — spec muerta. `stopHaptic` tampoco tiene llamadores.

### M2 — Bundle único de >500 kB minificado
El build advierte chunk >500 kB: React + framer-motion + XState + Zod en un solo JS inicial. El público objetivo (estudiantes ENARM en móvil, a veces con datos limitados) paga todo el juego antes del primer frame.
**Fix:** `React.lazy` para ShockRoom, StatsDashboard, RetrospectiveView y TutorialOverlay (ninguno se necesita para el primer paint) + `manualChunks` para vendor.

### M3 — Los 599 casos siguen duplicados en git
`cases/` (fuente) y `dr-swipe/public/cases/` (copia servida) — 2× peso del repo y riesgo de divergencia. Pendiente desde julio (Fase 4.5): script `sync_cases` en `prebuild` (ya existe el precedente `regen_index.js`) y gitignore de la copia.

### M4 — Accesibilidad pendiente (Fase 3.6 de julio, sin cambios)
- `FeedbackToast` y el globo del mentor sin `aria-live` — un lector de pantalla no se entera del resultado del swipe.
- Overlays (loot, penalty, fail, settings, pausa) sin focus-trap ni cierre con `Escape`.
- El juego por teclado (flechas) funciona pero sigue sin anunciarse en ninguna parte de la UI (solo en `aria-label` de los botones).

---

## 6. Lo que SÍ está bien (para no romperlo)

- Máquina XState con guardas correctas: doble-pago de reward bloqueado (`rewardedCaseRef`), `canUndo` espejo del guard de la máquina, boss triad barajado conservando el índice correcto, skip limpio de casos sin boss.
- `RESCUE`/`REVIVE_INTERN` resetean el estado por-caso completo y el timer (los B1/B2/B3 de julio están cerrados de verdad — verificado en código y tests).
- `safeStorage` + Zod + fallback SPA-aware en `dataLoader` (detección del index.html devuelto como 200): carga de datos genuinamente defensiva.
- Audio procedural sin binarios, con guard de settings; hápticos centralizados con patrones semánticos.
- PWA con estrategia de caché correcta por tipo de recurso (índice SWR, casos CacheFirst con expiración).
- `MotionConfig reducedMotion="user"` + media query CSS: reduce-motion cubierto en ambas capas.
- 23 tests reales y verdes sobre máquina y scoring (solo falta ejecutarlos, R2).

---

## 7. Plan de ejecución priorizado

| Fase | Ítems | Impacto | Esfuerzo |
|---|---|---|---|
| **0 — Reparar la tubería** (hoy) | R1 lockfile, R2 script test + CI, R3 quitar tailwind v4 | CI/deploy vuelve a funcionar; tests protegen main | XS |
| **1 — Encender el juice apagado** | R4 (3 clases CSS), F2 (impacto de error + jerarquía letal + hápticos huérfanos), F5 (guard de doble-swipe) | El mayor salto de feel por línea de código de todo el plan | S |
| **2 — Continuidad y escalada** | F1 (promoción de carta sin blink), F3 (combo con pitch/color), F4 (toast unificado sobre el mazo), F7 (audio ShockRoom) | El core loop se siente continuo y con tensión creciente | M |
| **3 — Una sola identidad visual** | E1 (decisión rosa-vs-teal + manifest), E2 (sistema único de botones), E3 (escala tipográfica, min 11px), E4 (sprite SVG para iconos de UI), E5 (limpieza) | Deja de verse "de primaria"; consistencia en cada pantalla | M |
| **4 — Base técnica** | F6 (timer fuera de App + memo), M1 (zombies), M2 (code-splitting), M3 (sync de casos), M4 (a11y) | Rendimiento en gama baja, repo sano, accesible | M |

Regla sugerida para las Fases 1–3: **cada efecto nuevo respeta `prefers-reduced-motion`** (la infraestructura ya está) y ningún texto nuevo baja de 11px.

---

## 8. Resumen ejecutivo

| # | Hallazgo | Sev. |
|---|---|---|
| R1 | `npm ci` roto → CI/deploy no funciona | 🔴 P0 |
| R2 | Tests verdes que nunca corren (sin script ni paso CI) | 🔴 P0 |
| R4 | Juice principal escrito contra clases CSS inexistentes | 🔴 P0 |
| R3 | Tailwind v3+v4 simultáneos (dep muerta, causa probable de R1) | 🟠 P0 |
| F1 | Blink al promover carta: el gesto central del juego se corta | 🟠 P1 |
| F2 | El error (incluso letal) no tiene peso sensorial | 🟠 P1 |
| F5 | Doble-swipe drag+botón en ventana de 250 ms | 🟠 P1 |
| E1 | Tres paletas conviviendo; manifest rosa neón (3ª vez señalado) | 🟠 P1 |
| E4 | Iconografía = emojis de sistema; sprite SVG existente sin usar | 🟡 P1 |
| F3/F4/F7 | Combo plano, toasts duplicados en esquinas, Shock Room mudo | 🟡 P1 |
| E2/E3/E5 | 5 estilos de botón, 31 textos de 8–9px, componentes/keyframes muertos | 🟡 P2 |
| F6 | Re-render global por tick + interval con drift | 🟡 P2 |
| M1–M4 | Zombies del motor, bundle >500 kB, casos duplicados, a11y | 🟢 P2–P3 |
