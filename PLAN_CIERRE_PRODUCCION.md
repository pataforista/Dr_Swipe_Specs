# Plan de cierre para producción — Dr. Swipe 1.0.0

Revisión del 2026-10-13 sobre `main` (`e7aecbd`). Alcance: **cerrar lo que existe**, no ampliar. Todo lo que suena a función nueva (dificultad adaptativa, telemetría, simulacro ENARM, más distractores) queda fuera de 1.0 y vuelve después del lanzamiento.

## 1. Estado medido

| Control | Resultado |
|---|---|
| `validate_cases.py` + los tres `--check` de contenido | 599 casos válidos, 0 cambios pendientes |
| `npm test` | 17 archivos, 123 tests en verde |
| `npm run lint` / `npm run build` (`tsc -b`) | Limpios. Bundle inicial ≈ 190 kB gzip; precache PWA 682 KiB |
| `npm audit --omit=dev` | 0 vulnerabilidades |
| Partida real en Chromium 390×780 (inicio → triaje → Shock Room → abandonar) | Sin errores de consola |

El motor está sano. El riesgo de lanzar no está en el código: está en el contenido clínico sin verificar (§4).

## 2. Corregido en esta tanda

Defectos de juego y de producción. Cada uno tiene su fila en `ERRORES_Y_PREVENCION.md` (27 a 36).

- **Abandonar ya no deja el caso reanudable.** ABANDONAR (pausa) y "Nueva guardia" desde la protección contra fallo borraban la partida activa, pero no el autoguardado: REANUDAR GUARDIA devolvía el caso perdido con su puntaje.
- **Sesión y racha diaria se cuentan solo si la guardia cargó.** Antes un intento sin conexión salvaba la racha.
- **Los avisos de triaje no invaden el Shock Room.** La cola de avisos se vacía al entrar al Código Rojo.
- **Las correcciones clínicas llegan en la siguiente visita.** Los casos pasaron de `CacheFirst` a 30 días a `StaleWhileRevalidate`; el juego sin conexión no cambia.
- **Interfaz:** "SIN DAÑO" visible en móvil (antes solo con `hover`); fuera la etiqueta "NUEVA" permanente; "REPASAR MIS ERRORES" pasa a "REPASO PENDIENTE" (SM-2 también agenda casos resueltos sin error); el tutorial muestra el costo del error letal (−40), no solo el normal (−15).
- **Producción:** versión `1.0.0` visible en Ajustes; aviso educativo en inicio y Ajustes; la pantalla de error ya no muestra el mensaje técnico al jugador; sin `console.log` del service worker; manifiesto con `id`, `lang`, `start_url`, `scope` e íconos `any` y `maskable` separados; `meta description` en `index.html`.

## 3. Cierre técnico pendiente (puntual, sin código nuevo)

| # | Tarea | Quién | Esfuerzo |
|---|---|---|---|
| T1 | Fusionar este PR y confirmar que el despliegue de `main` a Cloudflare Pages termina en verde (requiere los secretos `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`) | Tú | 10 min |
| T2 | Probar en el dominio real: instalar la PWA en Android e iOS, jugar sin conexión, revisar que la CSP de `_headers` no bloquee fuentes (la CSP solo existe en Cloudflare, no en `vite preview`) | Tú, con teléfono | 30 min |
| T3 | Revisar en móvil el balance de Favores (tope 5, revivir cuesta 3), pendiente desde la fase 6 | Tú | 1 partida larga |
| T4 | Etiquetar `v1.0.0` en git tras el despliegue | Tú o yo | 1 min |
| T5 | Aviso de privacidad de una línea en la página o la ficha: el progreso vive solo en el dispositivo; las fuentes se piden a Google Fonts (eso expone la IP del jugador a Google). Si te importa, autoalojar las fuentes es el cambio mínimo | Tú decides | 15 min |

## 4. Contenido clínico: estado tras la revisión del 2026-10-13

`REVISION_CLINICA/` reúne 237 cartas cuyas fuentes se redactaron de memoria; 63 tienen riesgo letal. Esas 63, más las 3 correcciones de diagnóstico, ya se contrastaron con PubMed y Consensus (detalle en `REVISION_CLINICA/VEREDICTOS_RIESGO_LETAL.md`):

- **Ninguna carta enseña una conducta peligrosa:** 53 se aprueban, 10 se corrigieron (comentario o fuente) y 0 se rechazan. Las correcciones ya están en el juego; el CI comprueba que sigan aplicadas.
- **Fuentes:** 22 verificadas en el texto, 33 localizadas sin texto disponible para esa afirmación y 8 sin localizar (*Insufficient data*).
- **La revisión la hizo una IA, no un médico.** Para un lanzamiento público sigue siendo recomendable que un médico mire las 8 filas sin fuente y la pregunta abierta sobre la prueba de embarazo en la apendicitis; es media hora de trabajo, no una revisión completa.
- Quedan sin revisar las 174 cartas sin riesgo letal, la roséola (15 cartas) y el umbral de SatO₂ de la GPC mexicana. Ninguna bloquea el lanzamiento.

## 5. Decisiones que necesito de ti

1. ~~**¿Se lanza antes o después de revisar las 63 cartas letales?**~~ Revisadas el 2026-10-13 (§4). Queda opcional la mirada de un médico a 8 filas.
2. ~~**Abandonar un caso perdido, ¿cuenta para el repaso?**~~ Decidido: sí. Hecho; "Nueva guardia" tras perder registra el fallo en SM-2.
3. ~~**Monitoreo de errores (Sentry)**~~ Decidido: sí, solo errores. Integrado (`utils/monitoring.ts`): sin rastreo de rendimiento, sin grabación de sesión, sin datos de usuario ni migas de consola. Se descarga después del primer render (29 kB gzip, trozo `vendor-sentry`) y **solo si existe la clave**. Para activarlo:
   - Crear el proyecto React en sentry.io y, en *Settings → Security & Privacy*, activar **Prevent Storing of IP Addresses**.
   - En GitHub: *Settings → Secrets and variables → Actions → Variables*, crear `SENTRY_DSN` con el DSN (es público, no secreto). El CI lo pasa al build.
   - La CSP de `_headers` ya admite `*.ingest.sentry.io` (y sus regiones US y DE). Ajustes muestra la línea de privacidad solo cuando la clave existe.

## 5b. Dependencias de desarrollo

`npm audit` marca vulnerabilidades moderadas y altas **solo en herramientas de build y test** (vitest, postcss, browserslist, brace-expansion…); `npm audit --omit=dev` da 0, así que nada llega al jugador. `npm audit fix` falla con un error interno de npm (`edgesOut`) y la corrección de `braces` exige Tailwind 4 (cambio mayor). Queda para después de 1.0.

## 6. Fuera de 1.0 (no tocar antes del lanzamiento)

Dificultad adaptativa, telemetría por carta, simulacro ENARM, lotes nuevos de distractores, variedad de comentarios del mentor, auditoría de las 1,797 preguntas del jefe, rangos pediátricos en `report_content_review.py`, pruebas E2E. Todo sigue anotado en `PLAN_SIGUIENTES_PASOS.md` y `ROADMAP.md`.
