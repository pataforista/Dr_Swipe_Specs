# Errores encontrados y cómo evitarlos

Revisión del 2026-10-02 sobre la rama `ccr-de9b685c-og7oxt`. Cada fila indica qué falló, cómo se detectó y qué hábito o control lo evita. Los errores 1 a 10 ya venían en el repositorio; los 11 a 13 los cometí yo mismo durante la reparación y los dejo anotados porque la causa es la misma: no ejecutar la comprobación antes de dar el cambio por bueno.

## Resumen

La mayoría nace de un solo patrón: **editar código con scripts de reemplazo por regex y confirmar el commit sin correr `npm run build`**. Los dos commits que rompieron el proyecto (`1` y `2`) llegaron a la rama sin ninguna señal, porque el CI solo corre en `main`/`master` y en PR hacia ellas.

## Código

| # | Error | Dónde | Cómo se detectó | Cómo evitarlo |
|---|---|---|---|---|
| 1 | Comillas escapadas (`\'perfect\'`) pegadas en el código fuente | `dr-swipe/src/types/game.ts` | `eslint` y `tsc -b`: *Invalid character* | No generar código desde cadenas de JS que escapan comillas. Usar `Edit` sobre el archivo o un script que lea y escriba sin escapar. Correr `npm run lint` antes de cada commit. |
| 2 | `assign` creado fuera de `setup()`, sin tipos | `gameMachine.ts` (`recordCaseResult`) | ~35 errores en cascada en `App.tsx` (`'triage' not assignable to never`) | En XState v5 las acciones con acceso al contexto se declaran en `setup({ actions })` y se invocan por nombre. Un error de tipos en la máquina rompe todos los `state.matches(...)` aguas abajo: arreglar primero el primero de la lista. |
| 3 | La acción de registrar el caso ponía a cero errores, combo e índice al entrar a `reward` | `gameMachine.ts` | Lectura del diff: `App.tsx` lee `mistakesThisCase` justo en `reward` | Una acción de entrada no debe borrar datos que la pantalla del estado todavía necesita. Resetear en la transición de salida (`CONTINUE_SHIFT`, `RESTART`). Hay un test que lo cubre (`sessionFlow.test.ts`). Efecto que habría tenido: toda guardia contaba como perfecta y cobraba el bono. |
| 4 | Renombre a medias: `hasRescuedThisCase` → `wasRescued` en la máquina, no en `App.tsx` | `App.tsx` | `tsc`: *Property does not exist on type 'GameContext'* | Tras renombrar, buscar el nombre antiguo en todo el repositorio (`grep -rn`) y compilar. Preferir el renombrado del IDE o `tsc` como verificador. |
| 5 | `GameContext` no exportado, pero importado por `sessionEngine.ts` | `gameMachine.ts` | `tsc` TS2459 | Exportar los tipos que otro módulo necesita en el mismo cambio que crea la dependencia. |
| 6 | `App.tsx` no enviaba `case_id`; la máquina lo deducía del `card_id` y daba `PROC_PED` | `App.tsx`, `gameMachine.ts` | Revisión de datos reales: el `case_id` de los JSON es `PROC_PED_EXANT_MEASLES_001_014` | Probar con un ID real, no con uno inventado. Pasar el identificador desde su fuente en vez de reconstruirlo. |
| 7 | La especialidad se calculaba con `caseId.split('_')[0]`, que daba `PROC` para todos los casos | `sessionEngine.ts` | Lectura contra los datos (la especialidad es el 2.º token) | Función con nombre (`specialtyFromCaseId`) y test con IDs reales. |
| 8 | Tipos duplicados y distintos (`CaseResult` en `types/game.ts` y en `types/srs.ts`; `SessionState` con campos que el código no tiene) | `types/`, `ROADMAP.md` | Comparar el modelo del roadmap con el código | Un tipo, un archivo (principio 3.4 del roadmap). Si se necesita un subconjunto, derivarlo con `Pick`/`Omit` en vez de copiarlo. |
| 9 | Variable de estado leída desde un `ref` durante el render | `App.tsx` (mi cambio) | `eslint` `react-hooks/refs` | Lo que se pinta debe vivir en `useState`; el `ref` es para valores que no cambian lo que se ve. |
| 10 | Comentario en la misma línea que otras propiedades (`maxEntries: 4000, // …, maxAgeSeconds: …`) se tragó el resto de la línea | `vite.config.ts` (mi cambio) | `tsc` TS1136 | Comentarios en su propia línea cuando la línea contiene más de una propiedad. Compilar tras cada edición de configuración. |
| 11 | Constante sin uso (`DAY_MS`) | `useCodexStore.ts` (mi cambio) | `eslint` y `tsc` (`noUnusedLocals`) | Quitar lo que se deja de usar antes de commitear. |

## Proceso y documentación

| # | Error | Dónde | Cómo se detectó | Cómo evitarlo |
|---|---|---|---|---|
| 12 | Scripts de parche de un solo uso quedaron versionados, con rutas absolutas de Windows (`C:/Users/Admin/...`) | `patch.js`, `dr-swipe/fix_index.cjs`, `dr-swipe/update_machine.cjs` | Inspección de la raíz del repo | No commitear scripts de migración puntuales; si se conservan, ponerlos en `tools/` con ruta relativa y documentar para qué sirven. Ya se eliminaron. |
| 13 | Un reemplazo masivo dejó el comentario `// Restart current case cards for learning` repetido en lugares sin relación | `gameMachine.ts` | Lectura del diff | Revisar `git diff` completo antes de commitear cualquier cambio hecho por regex. Un reemplazo global rara vez toca solo lo que se quería. |
| 14 | `ROADMAP.md` corrupto: tres filas del registro de decisiones pegadas a la primera línea, con `\n` literales, y la fila 006 duplicada | `ROADMAP.md` | Lectura del archivo | Editar el roadmap con herramientas de texto, no concatenando cadenas con `\n`. Releer las primeras líneas tras cada edición. |
| 15 | El roadmap decía una cosa y el código otra (Fase 2 "sin hacer" con la mitad hecha; reduced-motion y CI "sin hacer" estando hechos; 602 casos frente a 599 reales) | `ROADMAP.md` | Contrastar cada casilla con el código | La regla del documento ("se actualiza antes de tocar código") se cumple si cada PR incluye el cambio de casilla. Revisar el roadmap en cada cierre de fase. |
| 16 | `PLAN_SIGUIENTES_PASOS.md` habla de un PR "sin abrir" que ya se fusionó | `PLAN_SIGUIENTES_PASOS.md` | Historial de git (PR #57 a #59) | Fechar los planes y archivarlos o actualizarlos al fusionar. |
| 17 | El CI no corre en ramas de trabajo: solo en `push` a `main`/`master` y en PR hacia ellas | `.github/workflows/cloudflare-deploy.yml` | Lectura del workflow | Resuelto el 2026-10-03: el CI valida cualquier rama y solo despliega desde `main`/`master`. |
| 18 | La Fase 4 pedía `public/cases/{specialty}.json`, lo que obligaría a descargar cientos de casos para jugar 3 | `ROADMAP.md` | Análisis de `dataLoader.ts`, que ya carga un archivo por caso | Antes de implementar una tarea del roadmap, comprobar que sigue siendo la mejor solución. Se resolvió con un manifest y se registró como ADR 010. |

## Revisión completa del 2026-10-03

El pipeline estaba en verde (599 casos, 109 tests, lint y build), y aun así la lectura del código encontró ocho fallos de comportamiento. Ninguno rompía la compilación; todos rompían una regla del juego. Cada uno tiene ahora un test en `dr-swipe/src/tests/reviewFixes.test.ts` que falla con el código anterior.

| # | Error | Dónde | Efecto | Corrección |
|---|---|---|---|---|
| 19 | `triage` no aceptaba `RESTART` | `gameMachine.ts` | El botón ABANDONAR del menú de pausa no hacía nada | `RESTART` en `triage`; el botón además cierra la pausa y apaga la alarma |
| 20 | Un swipe sobre carta letal no sumaba `lethalErrorsThisCase` | `gameMachine.ts` | El logro "primer error letal" solo llegaba al perder al paciente; SM-2 no distinguía un fallo con error letal | Se cuenta cada error letal explícito; `ghosted` sigue sumando uno (ADR 013) |
| 21 | Deshacer no devolvía la carga de escudo ni el contador letal | `gameMachine.ts` | El escudo se perdía en un error que ya no existía | `lastAction` guarda y restaura ambos |
| 22 | `RESCUE` y `REVIVE_INTERN` no reiniciaban combo ni multiplicador | `gameMachine.ts` | Tras un fallo por tiempo, el caso reiniciado heredaba el multiplicador | Combo 0 y multiplicador 1 al reiniciar |
| 23 | Una partida de Modo Estudio guardada se reanudaba como guardia real | `App.tsx`, `useCodexStore.ts`, `gameMachine.ts` | Daño y reloj activos en una sesión que el jugador eligió sin daño | `isSandiaMode` viaja en el guardado y en `RESUME_GUARD` |
| 24 | `PSYC` no estaba en el mapa de especialidades | `sessionEngine.ts` | Los casos de psiquiatría contaban como Medicina Interna en el Códex | `PSYC → psych` |
| 25 | Enter/Espacio/Retroceso sobre un botón con foco también decidían la carta | `SwipeDeck.tsx` | Activar la pista o Deshacer con teclado mandaba un swipe a la derecha | Esas teclas se ignoran sobre controles; las flechas siguen funcionando |
| 26 | `connect-src 'self'` en la CSP | `public/_headers` | El service worker (Workbox) no podía pedir la hoja de Google Fonts y la fuente fallaba con la PWA instalada | `connect-src` admite `fonts.googleapis.com` y `fonts.gstatic.com` |

Resuelto el 2026-10-13 (decisión del dueño del producto): abandonar un caso fallido con "Nueva Guardia" desde `fail_protection` o `ghosted` lo registra como fallo y vuelve al repaso SM-2. `resetGame` ya no vacía la sesión (la abre `START_GUARD`/`RESUME_GUARD`) para que `useSessionCommit` vea ese fallo. Test en `sessionFlow.test.ts`.

## Revisión de cierre para producción (2026-10-13)

Pipeline en verde antes y después (599 casos, 123 tests, lint, build, 0 vulnerabilidades). Partida completa probada en Chromium a 390×780 sin errores de consola. Detalle y pendientes en `PLAN_CIERRE_PRODUCCION.md`.

| # | Error | Dónde | Efecto | Corrección |
|---|---|---|---|---|
| 27 | ABANDONAR (pausa) y "Nueva guardia" desde `fail_protection` no borraban el autoguardado | `App.tsx` | REANUDAR GUARDIA devolvía un caso abandonado o perdido, con su puntaje | Ambos botones llaman a `clearSessionProgress()` |
| 28 | Sesión y racha diaria se contaban antes de cargar los casos | `App.tsx` | Un intento sin conexión sumaba sesión y salvaba la racha | Se cuentan tras la carga exitosa (guardia, repaso y reanudar) |
| 29 | Avisos de triaje (pista de laboratorio, botín) seguían en cola al entrar al Shock Room | `App.tsx` | Tapaban el encabezado del jefe con información que ya no aplicaba | La cola se vacía al entrar en `critical_alert` |
| 30 | Casos en caché `CacheFirst` por 30 días | `vite.config.ts` | Una corrección clínica tardaba hasta un mes en llegar a quien ya jugó ese caso | `StaleWhileRevalidate`: llega en la siguiente visita y el juego sin conexión sigue igual |
| 31 | Etiqueta "SIN DAÑO" solo visible con `hover` | `App.tsx` | Invisible en móvil | Siempre visible |
| 32 | Etiqueta "NUEVA" permanente y parpadeante en INICIAR GUARDIA | `App.tsx` | Afirmaba algo falso para todo jugador | Eliminada |
| 33 | "REPASAR MIS ERRORES" listaba también casos resueltos sin error | `App.tsx` | La etiqueta no correspondía a SM-2 | "REPASO PENDIENTE" |
| 34 | Tutorial: "Error: −15" omitía el error letal (−40) | `TutorialOverlay.tsx` | El jugador no sabía por qué una carta le quitaba casi media barra | Muestra ambos costos |
| 35 | La pantalla de error mostraba el mensaje técnico en producción | `ErrorBoundary.tsx` | Texto incomprensible para el jugador | Mensaje técnico solo en desarrollo |
| 36 | Ícono `any maskable` combinado; manifiesto sin `id`/`lang` | `vite.config.ts` | Ícono recortado donde se usa como `any`; aviso de Lighthouse | Entradas separadas; `id`, `lang`, `start_url`, `scope` |

## Pendiente conocido

- Resuelto: `ghosted` suma un error letal al entrar y es intencional (perder al paciente es el desenlace letal; SM-2 calidad 0). Ver ADR 013 y su test en `sessionFlow.test.ts`.
- Lección del propio test: la primera versión envolvía las aserciones en un `if` y pasaba sin comprobar nada. Una prueba que puede pasar sin ejecutar su aserción no es una prueba; se cambió por aserciones incondicionales.

## Controles recomendados

1. **Antes de cada commit**, desde `dr-swipe/`: `npm run lint && npm test && npm run build`. El `build` ejecuta `tsc -b`, así que detecta los errores 1, 2, 4, 5, 10 y 11.
2. **(Hecho el 2026-10-03)** **Hacer que el CI valide cualquier rama.** Hoy el workflow solo se activa en `main`/`master` y en PR hacia ellas. Añadir `branches: ['**']` al disparador `push` y restringir el paso de despliegue con `if: github.event_name == 'push' && github.ref == 'refs/heads/main'` (hoy solo comprueba `push`, y desplegaría desde cualquier rama). Con eso los commits `1` y `2` habrían fallado el mismo día.
3. **Hook de pre-commit** (por ejemplo `husky` o un `.git/hooks/pre-commit`) que ejecute `npm run lint` y `npx tsc -b`. Es lo más barato para evitar el patrón de la fila 1.
4. **Tests para cada regla de la máquina de estados.** El error 3 solo se vio leyendo el diff; el test de flujo (`sessionFlow.test.ts`) ahora lo protege.
5. **Cambiar el roadmap en el mismo commit** que cierra la tarea.
