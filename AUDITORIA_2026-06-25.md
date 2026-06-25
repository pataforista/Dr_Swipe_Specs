# Dr. Swipe — Auditoría y estado actual

**Fecha:** 2026-06-25
**Rama:** `claude/game-engine-ui-review-gm78ps`
**App:** `dr-swipe/` (React 19 + XState 5 + Zustand + Framer Motion + Tailwind, PWA · Cloudflare Pages)
**Método:** lectura directa del motor, componentes y los 598 casos; verificación con `diff`, validador de casos y barrido clínico.

> Este documento **consolida y reemplaza** los reportes previos (auditorías de marzo y junio, recomendaciones estéticas, revisión de estabilidad). Esos `.md` se eliminaron por estar superpuestos y desactualizados.

---

## 1. Veredicto

La app está **sólida y jugable**. Las crisis de las auditorías anteriores (datos corruptos, juego mudo, XP inflado) **ya están cerradas y verificadas**. Lo que queda son pulidos de estética y un puñado de mecánicas inertes — ninguno bloquea producción.

| Eje | Estado |
|---|---|
| Motor / arquitectura (XState) | 🟢 Sólido |
| Integridad de datos (598 casos, ambas copias) | 🟢 Limpio y sincronizado |
| Contenido clínico | 🟢 Nivel ENARM; profundidad **corregida** (ver §3) |
| Mecánica | 🟢 Funcional · 🟡 algunas features inertes |
| Audio | 🟢 SFX sintetizados (Web Audio API) |
| Estética / UX | 🟢 Identidad "scrapbook" fuerte · 🟡 leftovers neón |
| Accesibilidad | 🟡 Básica |
| Higiene de repo | 🟢 **Limpiada en esta sesión** (ver §2) |

Verificaciones clave (estado actual):
- `diff -rq cases dr-swipe/public/cases` → solo difiere un `.md` de checklist; **los 598 JSON están idénticos**.
- **0** `case_id` con acentos, **0** archivos con U+FFFD, **0** scripts en `public/`.
- Audio sintetizado en `useGameAudio.ts` (sin binarios faltantes).
- XP no se infla (`score` resetea en `CONTINUE_SHIFT`); `lethal_if_discarded` pesa −1000 igual que `lethal_risk`; las cartas se juegan en orden de autor.

---

## 2. Limpieza realizada en esta sesión

- 🗑️ Eliminado `tools/legacy_pipeline/` (40 scripts de reparación de un solo uso + dumps JSON, incluido `propagate_themes.py`, que fue el origen de la contaminación cruzada ya remediada). Se conserva `tools/validate_cases.py` (validador vivo).
- 🗑️ Eliminados 6 documentos de auditoría/revisión superpuestos, reemplazados por **este** archivo.
- ℹ️ **Pendiente de decisión:** `_LEGACY_ARCHIVE/` (~2.6 MB: scaffold `v2/`, specs v1, `DrSwipe_itchio.zip`). Es historia intencional; no se borró. Decidir si `v2/` es el futuro o se archiva del todo.

---

## 3. Profundización de casos (cambio principal de esta sesión)

**Problema:** ~43% de la biblioteca (256/598) tenía <5 cartas (216 de 3, 40 de 4). Una guardia de 3 casos al azar caía con frecuencia en mazos triviales de ~9 swipes.

**Solución aplicada:** cada caso delgado se profundizó a **6–13 cartas** adoptando el mazo clínico rico **del mismo tema**, preservando su `patient_intro`, `enarm_pearl`, `boss_fight_triad`, dificultad y `case_id`; solo cambió `card_stream`. Se mantiene el `init_vitals` propio de cada paciente.

- **20 familias** tomaron como plantilla el hermano más rico de su propia familia (mismo diagnóstico).
- **3 familias** tomaron plantilla de un tema clínicamente idéntico en otra familia: `INT_SCA_IAM ← INT_AMI`, `SURG_BILIARY_COLANGITIS ← …CHOLANGITIS`, `SURG_ATLS_TENSION_PNEUMO ← SURG_TRAUMA_PNEUMO`.
- **2 familias** sin exemplar (`ENDO_DM2_MANAGEMENT`, `PED_VAC_SRP`) recibieron mazos **autorados a mano** con contenido ENARM (algoritmo ADA cardio-nefroprotección; esquema de vacunación a los 18 meses con SRP).

**Resultado:** 256 casos reescritos. Distribución actual de cartas: mínimo **5**, sin casos de 3–4. Invariantes verificadas en ambas copias (ids únicos, ≤1 `init_vitals`, 3–15 cartas, todas con `scoring.points` y `expected_action` válido). `validate_cases.py` → **598 válidos**. `case_index.json` regenerado.

---

## 4. Hallazgos vigentes (no bloqueantes)

### Mecánica 🟡
- **`patient_intro.time_limit_sec` está muerto.** `App.tsx` calcula el tiempo como `clamp(90,180, nCards·18)` e ignora el campo autorado por caso. Usarlo o quitarlo del schema.
- **Badge "¡Letal!" ambiguo.** `SwipeDeck` pinta el mismo `⚠️ ¡Letal!` para `lethal_risk` (letal si lo **mantienes**) y `lethal_if_discarded` (letal si lo **descartas**) — acciones opuestas, misma etiqueta. Conviene un badge direccional.
- **Features inertes:** `dynamic_value` (en schema/tipos, nunca se muestra en UI) y `qte_fallback` (schema describe un QTE ya retirado del motor). Implementar o eliminar.
- **Bonus de velocidad (<1200 ms)** premia responder antes de poder leer la carta; ligeramente anti-educativo.

### Estética 🟡
- **Leftovers cian neón del tema dark anterior** que chocan con la paleta teal `#0D9488`: dots de progreso `#22D3EE`, glow del corazón `rgba(34,211,238)`, sello "¡QUÉ NIVEL!" `bg-cyan-500`, y `#22D3EE` en `TutorialOverlay`/`GlitchText`.
- **`hover:bg-slate-800`** en los botones blancos de descartar/mantener (`SwipeDeck.tsx`): en hover se vuelven gris oscuro sobre fondo de papel. `border-white/10` y `bg-white/5` son invisibles sobre claro.
- **Naming de mentor mezclado:** el código usa "vázquez" (`cleanVazquezComment`, `vazquez_comment`) pero la UI renderiza "Mendoza".

### Contenido 🟡
- **`patient_intro.name` vs `arrival_scenario` discrepan** en varias variantes (p. ej. nombre "Rosa, 45 años" con escenario "Hombre de 62 años"). Es preexistente a la profundización (los dos campos se generaron por separado). Conviene normalizar nombre↔escenario por caso.
- **Nombres mal escritos / familias casi-duplicadas:** `PED_PYLORIC_SENOSIS` (→ *STENOSIS*), `SURG_BILIARY_CHOLANGITIS` vs `…COLANGITIS`, `PED_GAST_DEHYDRATION` vs `PED_GIT_DEHYDRATION`.
- Queda 1 `init_vitals` con `expected_action: keep`; campo `red_flag` en algún `safety_flags` que el schema descarta en silencio.

### Build / a11y 🟡
- Conflicto de peer-deps `vite-plugin-pwa` vs `vite@8` (CI lo enmascara con `--legacy-peer-deps`).
- Textos pequeños (`text-[9px]/[10px]`) límite en móvil; keep/discard se distingue solo por color+emoji+posición.

---

## 5. Próximos pasos sugeridos
1. **Estética (rápido, visible):** unificar los cian `#22D3EE`/`cyan-500` a teal y quitar `hover:bg-slate-800` del `SwipeDeck`.
2. **Mecánica:** badge "¡Letal!" direccional; decidir `time_limit_sec` (usar o quitar); retirar `dynamic_value`/`qte_fallback`.
3. **Contenido:** normalizar `name`↔`arrival_scenario`; corregir nombres mal escritos.
4. **Higiene:** decidir destino de `_LEGACY_ARCHIVE/` y resolver peer-deps de PWA.

---
*Auditoría de la rama `claude/game-engine-ui-review-gm78ps`. Cambios de esta sesión: limpieza de basura del repo, consolidación de docs y profundización de los 256 casos delgados.*
