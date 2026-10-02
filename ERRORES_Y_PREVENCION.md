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
| 17 | El CI no corre en ramas de trabajo: solo en `push` a `main`/`master` y en PR hacia ellas | `.github/workflows/cloudflare-deploy.yml` | Lectura del workflow | Ver "Controles recomendados". |
| 18 | La Fase 4 pedía `public/cases/{specialty}.json`, lo que obligaría a descargar cientos de casos para jugar 3 | `ROADMAP.md` | Análisis de `dataLoader.ts`, que ya carga un archivo por caso | Antes de implementar una tarea del roadmap, comprobar que sigue siendo la mejor solución. Se resolvió con un manifest y se registró como ADR 010. |

## Pendiente conocido

- Resuelto: `ghosted` suma un error letal al entrar y es intencional (perder al paciente es el desenlace letal; SM-2 calidad 0). Ver ADR 013 y su test en `sessionFlow.test.ts`.
- Lección del propio test: la primera versión envolvía las aserciones en un `if` y pasaba sin comprobar nada. Una prueba que puede pasar sin ejecutar su aserción no es una prueba; se cambió por aserciones incondicionales.

## Controles recomendados

1. **Antes de cada commit**, desde `dr-swipe/`: `npm run lint && npm test && npm run build`. El `build` ejecuta `tsc -b`, así que detecta los errores 1, 2, 4, 5, 10 y 11.
2. **Hacer que el CI valide cualquier rama.** Hoy el workflow solo se activa en `main`/`master` y en PR hacia ellas. Añadir `branches: ['**']` al disparador `push` y restringir el paso de despliegue con `if: github.event_name == 'push' && github.ref == 'refs/heads/main'` (hoy solo comprueba `push`, y desplegaría desde cualquier rama). Con eso los commits `1` y `2` habrían fallado el mismo día.
3. **Hook de pre-commit** (por ejemplo `husky` o un `.git/hooks/pre-commit`) que ejecute `npm run lint` y `npx tsc -b`. Es lo más barato para evitar el patrón de la fila 1.
4. **Tests para cada regla de la máquina de estados.** El error 3 solo se vio leyendo el diff; el test de flujo (`sessionFlow.test.ts`) ahora lo protege.
5. **Cambiar el roadmap en el mismo commit** que cierra la tarea.
