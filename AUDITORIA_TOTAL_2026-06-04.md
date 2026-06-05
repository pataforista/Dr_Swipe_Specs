# Dr. Swipe — Auditoría Total (2026-06-04)

**Rama:** `claude/total-audit-gzIdy`
**Alcance:** repositorio completo — datos (casos), motor/app desplegada (`dr-swipe/`), build/CI, copias legacy (`cases/` raíz, `v2/`), e higiene del repo.
**Método:** verificación directa con evidencia reproducible (no se confía en informes previos). Se reprodujeron las afirmaciones de la auditoría anterior (`AUDITORIA_COMPLETA_2026-06.md`, PR #48) contra el estado **actual** del árbol (`HEAD = b7275e6`).
**Naturaleza:** auditoría de **solo lectura**. El único archivo creado es este documento.

---

## 0. Veredicto ejecutivo

La **app desplegada está hoy en buen estado de datos** y compila a producción, pero la auditoría detecta **tres clases de problema nuevas o no resueltas** que ningún informe previo registró con precisión:

1. **La premisa de la auditoría anterior está invertida.** Aquella decía que `/cases` (raíz) era la *fuente limpia* y `dr-swipe/public/cases` la *copia corrupta*. **Hoy es al revés:** la copia que juega el usuario (`public/`) está limpia, y la raíz `cases/` es un artefacto legacy **corrupto y de otro esquema**. Seguir el "plan de remediación" anterior (regenerar `public` desde `/cases`) **re-corrompería** el juego.
2. **El typecheck y el lint están rotos** (`tsc` → 8 errores, `eslint` → 25 errores), pero **el CI no los ejecuta** (solo corre `vite build`), así que pasan inadvertidos. La auditoría anterior afirmaba "0 errores de tipos"; ya no es cierto.
3. **Bugs de autoría de contenido a escala**: 85 casos con edad del paciente incoherente, 445 casos donde el mentor citado no coincide con el avatar mostrado, y un bug clínico (furosemida) que sigue vivo.

| Eje | Calificación | Estado vs. informe previo |
|---|---|---|
| Datos desplegados (`public/cases`, 598) | 🟢 Sólido | Mejor de lo declarado: 598/598 validan, 0 U+FFFD, 0 `case_id` no-ASCII |
| Datos legacy raíz (`cases/`, 598) | 🔴 Corrupto | **Peor de lo declarado**: 35 U+FFFD + mojibake masivo persisten |
| Coherencia de las dos copias | 🔴 Crítico | 447 casos divergen; **esquemas distintos** |
| Motor / build de producción | 🟢 OK | `vite build` exitoso |
| Typecheck / lint | 🔴 Roto | **Regresión**: 8 errores `tsc`, 25 `eslint`; CI no los corre |
| Contenido clínico (autoría) | 🟠 Moderado | Edad incoherente (85), furosemida, prefijos mal puestos |
| Naming de personajes | 🟠 Moderado | 445 casos avatar↔comentario descuadrados |
| Higiene de repo | 🟡 Mejorable | 41 scripts sueltos en raíz, `v2/` muerto, dumps JSON |

---

## 0.1 Remediación aplicada en esta rama (`claude/total-audit-gzIdy`)

Commits `1e4a0dd` (build) y `28a5be1` (datos). Toolchain completa en verde
(`typecheck`, `lint`, `validate cases`, `build` → exit 0).

**Calidad de build (🔴 → 🟢)**
- ✅ Los **8 errores de `tsc`** corregidos; `tsc --noEmit` ahora pasa y **gatea el `build`**.
- ✅ Los **errores de `eslint`** resueltos (quedan 4 *warnings* `exhaustive-deps`, no bloqueantes); `any` sustituidos por tipos reales (`LoreItem`, `FeedbackEntry`, `PuzzleDebrief`, `MotionValue`, `PanInfo`, `BossQuestion`).
- ✅ CI ahora ejecuta **typecheck + lint + validación de casos** antes de construir.
- ✅ `LootScreen` muestra el XP real (`xpTotal`) en vez del `score` crudo; variable muerta `lastFeedback` eliminada.

**Integridad de datos desplegados (🟢 → 🟢, endurecido)**
- ✅ Nuevo `tools/validate_public_cases.mjs` (sin dependencias) rechaza en CI: mojibake (incluidas las familias `A+latin1`, `Aƒ`, controles C1 y emoji roto `ðY`), `case_id` no-ASCII, `card_id` duplicado y violaciones de esquema.
- ✅ El validador **destapó corrupción que ni la auditoría previa ni el primer pase de ésta detectaron**: **15 casos** con mojibake residual (1 flecha en CHOLANGITIS; familia `A+latin1` en CRUP/PNEUMONIA/VAC_SRP; `Aƒ`=mayúsculas acentuadas en pyloric/neuro; controles C1 en suicide/stats/atls10/appendicitis/mania). Todos reparados con desambiguación por contexto.
- ✅ Prefijo espurio `🎯 DATO CLAVE OMITIDO:` retirado de **557 `vazquez_comment` (300 archivos)**: estaba baked-in delante del nombre del mentor, que se filtraba al texto mostrado.

**Contenido clínico (🟠 → parcial)**
- ✅ **Furosemida** (`IM_HEART_FAILURE_001_001`): de `discard`/"puro ruido" a `keep` con matiz de mortalidad (paciente congestivo).
- ✅ Perlas: consolidado `enarm_pearl` (quitado `perla_enarm` legacy) en 3 SWIPE; añadida perla ATLS faltante en 2 casos de neumotórax.

**Decisiones del autor — ya aplicadas**
- ✅ **Edades nombre↔escenario**: corregidas **59 inconsistencias reales** (nombre←escenario). Se descubrió que la mayoría de los "85" eran **falsos positivos** (duración de enfermedad o edad gestacional en semanas ≠ edad del paciente). En 5 casos IAM con escenario masculino se ajustó también el nombre (género).
- ✅ **Avatar = mentor citado**: el avatar ahora refleja a Castillo/Navarro/Mendoza según el comentario de cada carta (antes siempre `mendoza`).
- ✅ **Higiene de repo**: `cases/` raíz, 41 scripts y `v2/` archivados en `_LEGACY_ARCHIVE/`. `public/cases` es la fuente única.

**Pendiente menor (opcional)**
- ⚠️ Peer-deps PWA (`vite-plugin-pwa@1.2.0` vs `vite@8`, sigue con `--legacy-peer-deps`); doble ruta de deploy; code-splitting del bundle (518 KB).

> El resto de este documento describe el estado **original** detectado (pre-remediación); úsalo como referencia de hallazgos.

---

## 1. Datos: las dos copias divergen y la "fuente" está podrida 🔴

Existen **dos directorios de casos** y ya **no coinciden**:

| | `cases/` (raíz) | `dr-swipe/public/cases/` (desplegada) |
|---|---|---|
| Nº de casos | 598 | 598 |
| Esquema | **antiguo** (`card_stream[].text`, sin `version`/`patient_intro`) | **v3** (`card_text`, `patient_intro`, `boss_fight_triad`, `enarm_pearl`) |
| Lo consume la app | ❌ no | ✅ sí (`dataLoader` hace `fetch('…/public/cases/…')`; `regen_index.js` lee de `public`) |
| U+FFFD (texto ilegible) | **35 archivos** | 0 |
| Mojibake `Ã` / `â` / flechas `â†'` | 198 / 142 / 78 archivos | 0 / 1 / 1 |
| `case_id` no-ASCII (rompe resume) | varios | **0** |

**Evidencia:**
```bash
# divergencia de contenido parseado
python3 - <<'PY'
import json,glob,os
d=sum(1 for f in glob.glob('cases/CASE_*.json')
      if json.load(open(f))!=json.load(open('dr-swipe/public/cases/'+os.path.basename(f))))
print(d)   # 447
PY
grep -lP '\xef\xbf\xbd' cases/CASE_*.json | wc -l                  # 35  (raíz)
grep -lP '\xef\xbf\xbd' dr-swipe/public/cases/CASE_*.json | wc -l  # 0   (desplegada)
```

**El texto de la raíz es inservible.** Las 3 familias `PED_EXANT_VARICELLA`, `PED_GIT_DEHYDRATION`, `PED_GAST_DEHYDRATION` (35 archivos) contienen secuencias `U+FFFD + NUL + <byte>`:

```
"Paciente de 4 a�␀±os con lesiones…"      → "años"
"…cuadros de evoluci�␀³n. Fiebre…"        → "evolución"
"…Temp 38.2�␀°C"                          → "°C"
```

**El commit que decía haberlo arreglado no lo hizo.** `e887cd0` ("reconstruir 35 casos con corrupción U+FFFD… 0 U+FFFD restantes") **dejó la corrupción intacta** en su propio árbol:

```bash
git show e887cd0:cases/CASE_PROC_PED_EXANT_VARICELLA_001_001.json | grep -c $'\xef\xbf\xbd'  # 35
```

> **Implicación práctica:** la raíz `cases/` no aporta nada vivo y desinforma sobre cuál es la fuente de verdad. **No debe usarse como oráculo de limpieza.** Recomendación: archivarla en `_LEGACY_ARCHIVE/` (o borrarla) y declarar `dr-swipe/public/cases/` como única fuente, regenerando el índice desde ahí (que ya es lo que hace `regen_index.js`).

---

## 2. La copia desplegada SÍ está sana (lo bueno) 🟢

Verificación estructural y de schema sobre los **598 casos de `public/cases/`**:

- **598/598 pasan la validación equivalente a `ClinicalCaseSchema` (Zod): 0 violaciones.** Ningún caso falla al cargar.
- `card_id` duplicados: **0**. `boss_fight_triad` presente: **598/598**.
- `correct_index` de boss-fights: todos dentro de rango.
- `case_id` con tilde (causa de "REANUDAR GUARDIA" roto, C2 del informe previo): **0** → **el resume ya no se rompe por este motivo**.
- Sin U+FFFD ni mojibake. Las palabras en mayúscula con tilde (`CRÍTICO`, `ELECCIÓN`, `PUNCIÓN`) son **acentuación correcta**, no los acrónimos corruptos (`IÁMCEST`, `MEÁSLES`) que existían antes — **ya no hay acrónimos sobre-acentuados**.

**Sobre la "contaminación cruzada" (C1 previo):** ya **no aplica** a la copia desplegada. Los casos con 10-13 cartas no mezclan enfermedades: son **MCQ coherentes** (opciones `A) … B) … C) …`, keep las correctas / discard los distractores), todos del mismo cuadro. Ejemplos verificados: `VARICELLA_001_001` (11 cartas, todas de varicela: dx diferencial viruela, gota de rocío, Tzanck, paracetamol, cerebelitis, vacuna, aciclovir, contraindicación de AAS) y `INT_AMI_001_005` (10 cartas, todas cardíacas). Las "28 cartas multi-vitals" y la distribución bimodal (216 casos de 3 cartas, 337 de 10-13) son el **formato migrado intencional**, no corrupción.

---

## 3. Build, typecheck y CI 🔴 (regresión)

| Comando | Resultado | Antes (informe previo) |
|---|---|---|
| `vite build` | ✅ exit 0 (`dist/` 518 KB JS) | ✅ |
| `tsc -p tsconfig.app.json --noEmit` | ❌ **exit 2 — 8 errores** | declaraba "0 errores" |
| `eslint .` | ❌ **exit 1 — 25 errores, 4 warnings** | no medido |
| CI (`cloudflare-deploy.yml`) | corre `npm install --legacy-peer-deps && npm run build` | — |

**El CI nunca ejecuta `tsc` ni `eslint`** (el script `build` es solo `vite build`), por eso una base con 8 errores de tipos despliega sin queja. Errores de `tsc`:

```
src/App.tsx(37,25)   'startTriageAlarm' declarado y nunca usado
src/App.tsx(208,11)  'lastFeedback' declarado y nunca usado   ← variable muerta (F5 previo, sigue ahí)
src/components/ErrorBoundary.tsx(50,14)        Cannot find name 'process'
src/components/overlays/EventAlert.tsx(2,18)   'AnimatePresence' sin usar
src/components/overlays/LootScreen.tsx(13,10)  'xpTotal' sin usar
src/components/overlays/ReloadPrompt.tsx(2,31) Cannot find module 'virtual:pwa-register/react'
src/components/overlays/ReloadPrompt.tsx(11,18)/(14,21)  parámetros 'any' implícito
```

`eslint` añade 23 `no-explicit-any` / `no-unused-vars` / `prefer-const` repartidos por `gameMachine.ts`, `useGameAudio.ts`, overlays, etc.

**Recomendación:** cambiar `"build": "tsc -p tsconfig.app.json --noEmit && vite build"` (o un step de CI separado) y limpiar los 8+25 errores. Hoy `tsconfig.app.json` no incorpora los tipos de `node` ni de `vite-plugin-pwa/client`, de ahí `process` y `virtual:pwa-register/react`.

**Bundle:** un solo chunk de 518 KB (>500 KB). Sin code-splitting (`React.lazy`/dynamic import). Aceptable para una PWA pequeña, pero mejorable.

---

## 4. Estado de las remediaciones del informe anterior

Verificación una a una contra el código actual:

| Item previo | Afirmado | Estado real verificado |
|---|---|---|
| C2 resume (case_id ASCII) | ✅ | ✅ **real** — 0 `case_id` no-ASCII en `public`; `dataLoader` además quita diacríticos como fallback |
| C3 audio mudo | ✅ | ✅ **real** — `useGameAudio.ts` sintetiza con `AudioContext`/`createOscillator` (sin mp3) |
| C4 scripts en `public/` | ✅ | ✅ **real** — no quedan `.py`/`.ps1` en `dr-swipe/public/` |
| C1 contaminación (datos jugados) | ✅ | ✅ **en `public`** — pero introdujo divergencia de esquemas (§1) y dejó la raíz podrida |
| 35 U+FFFD | ✅ | ❌ **FALSO** — siguen en `cases/` raíz (§1) |
| F1 inflación XP | ✅ | ✅ **real** — `CONTINUE_SHIFT` hace `score: 0` (`gameMachine.ts:553`) |
| F3 peso letal | ✅ | ✅ **real** — `lethal_if_discarded` ya entra en la rama `-1000` (`scoringEngine.ts:61-62`) |
| F2 QTE fantasma | ✅ | ✅ **real** — solo queda un comentario; sin máquina QTE |
| A2 reduce-motion | ✅ | ✅ **real** — `@media (prefers-reduced-motion)` en `index.css:151` |
| F5 variable muerta `lastFeedback` | (mencionada) | ❌ **sigue viva** (`App.tsx:208`, ahora también error de `tsc`) |

---

## 5. Bugs de contenido clínico / autoría 🟠 (en la copia desplegada)

1. **Edad del paciente incoherente — 85/598 casos (14%).** El `patient_intro.name` y el `arrival_scenario` declaran edades distintas:
   - `PED_EXANT_VARICELLA_001_001`: name "Iker, **9 meses**" vs escenario "Paciente de **4 años**".
   - `GYN_CANCER_BREAST_001_010`: "Laura, **49 años**" vs "**60 años**".
   - `INF_STI_SYPHILIS_001_002`: "Sofía, **24 años**" vs "**3 meses**".
   - Rompe la verosimilitud clínica y, en pediatría, puede invalidar dosis/criterios por edad.

2. **Furosemida penalizada como descarte (bug clínico real).** `IM_HEART_FAILURE_001_001` carta D) Furosemida = `discard`, con texto "**Tratamiento de elección** para el control de la congestión…" en un paciente congestivo. Castigar mantenerla es incorrecto. → `keep` (o reformular a "alivio sintomático, no modifica mortalidad").

3. **Prefijo "🎯 DATO CLAVE OMITIDO:" en 565 `vazquez_comment` (303 archivos).** El prefijo significa "omitiste un dato clave" y solo tiene sentido cuando se pierde un `keep`; está hardcodeado en el dato en lugar de derivarse del `error_type` en runtime, por lo que aparece en contextos donde no corresponde.

4. **Casos sin perla / con perla duplicada.** `SURG_ATLS_TENSION_PNEUMO_001_001` y `SURG_TRAUMA_PNEUMO_001_003` no tienen `enarm_pearl` (el debrief saldrá vacío). `SWIPE_EASY_001`, `SWIPE_HARD_001`, `SWIPE_STANDARD_001` tienen **ambos** campos `enarm_pearl` y `perla_enarm` (duplicado legacy; el schema acepta los dos con `as any`).

---

## 6. Naming de personajes 🟠

El avatar se renderiza **siempre** como `doctor="mendoza"` (`App.tsx:389`), pero el mentor citado en los `vazquez_comment` varía por caso:

| Mentor en el comentario | Nº de casos |
|---|---|
| **Castillo** | 287 |
| **Navarro** | 184 |
| Mendoza | 28 |
| Vázquez | 4 |

→ En **445/598 casos** el texto dice "Castillo: …" / "Navarro: …" mientras la cara mostrada es **Mendoza**. Además el código usa el identificador legacy `vazquez_*` (`vazquezDialogue`, `vazquezExpression`, `vazquez_comment`) para todo ello. Es la inconsistencia E2 del informe previo, pero mucho mayor de lo que se reportó. Hay que **elegir un mapeo** (avatar por especialidad/mentor) y unificar nombres de campos.

---

## 7. Higiene de repositorio 🟡

- **41 scripts/dumps sueltos en la raíz** (`*.py`, `*.ps1`, `*.js`, `*.json`): pipelines de reparación/auditoría de un solo uso + dumps grandes (`audit_results.json` 260 KB, `cross_case_audit.json` 99 KB). Dificultan saber qué está vivo. → mover a `tools/` o `_LEGACY_ARCHIVE/`.
- **`cases/` raíz**: legacy corrupto de otro esquema (§1). → archivar/eliminar.
- **`v2/`**: scaffold React 18 + Dexie + gacha **no referenciado** por `wrangler.toml` ni por el workflow. Código muerto. → decidir si es el futuro o se archiva.
- **`propagate_themes.py` + `structural_audit*.py`** siguen presentes en `cases/` (raíz) — el script que la auditoría previa señaló como **causa raíz** de la contaminación. Inofensivo ahí porque la app no usa esa carpeta, pero conviene retirarlo para que nadie lo re-ejecute.
- **Peer-deps PWA (B1 previo):** `vite-plugin-pwa@1.2.0` vs `vite@8` sigue requiriendo `--legacy-peer-deps`. Latente.
- **Doble ruta de deploy:** `wrangler.toml` (`pages_build_output_dir`) **y** GitHub Action — aclarar la fuente de verdad.

---

## 8. Plan de remediación priorizado

**Bloque 1 — fuente de verdad de datos (alto impacto, bajo riesgo)**
1. Declarar `dr-swipe/public/cases/` como única fuente. **Archivar/eliminar `cases/` raíz** (corrupta y de otro esquema) y los `propagate_themes.py`/`structural_audit*.py`.
2. Añadir check de CI que rechace en `public/cases`: U+FFFD, mojibake (`Ã`/`â`/`â†'`), `case_id` no-ASCII, `card_id` duplicado, caso que no valide contra `ClinicalCaseSchema`, y caso sin `enarm_pearl`.

**Bloque 2 — calidad de build (bajo riesgo)**
3. Gating de `tsc --noEmit` y `eslint` en el script `build`/CI; limpiar los 8 errores de tipos y 25 de lint. Añadir tipos `node` y `vite-plugin-pwa/client` a `tsconfig.app.json`. Borrar `lastFeedback` y demás variables muertas.

**Bloque 3 — contenido (riesgo medio, requiere criterio clínico)**
4. Corregir las 85 incoherencias de edad name↔escenario.
5. `IM_HEART_FAILURE_001_001` furosemida → `keep`/reformular.
6. Derivar el prefijo "🎯 DATO CLAVE OMITIDO" del `error_type` en runtime en vez de hardcodearlo en 565 comentarios.
7. Poblar `enarm_pearl` en los 2 casos PNEUMO; consolidar `perla_enarm`→`enarm_pearl` en los 3 tutoriales.

**Bloque 4 — coherencia y limpieza (bajo riesgo)**
8. Unificar mapeo avatar↔mentor (445 casos descuadrados) y renombrar campos `vazquez_*`.
9. Mover los 41 scripts a `tools/`; decidir destino de `v2/`; resolver peer-deps PWA; aclarar doble deploy.

---

## 9. Apéndice — comandos de verificación

```bash
# 1. divergencia parseada de las dos copias
python3 -c "import json,glob,os;print(sum(1 for f in glob.glob('cases/CASE_*.json') if json.load(open(f))!=json.load(open('dr-swipe/public/cases/'+os.path.basename(f)))))"  # 447

# 2. corrupción en la raíz vs limpieza en lo desplegado
grep -lP '\xef\xbf\xbd' cases/CASE_*.json | wc -l                  # 35
grep -lP '\xef\xbf\xbd' dr-swipe/public/cases/CASE_*.json | wc -l  # 0

# 3. el "fix" e887cd0 no quitó los U+FFFD
git show e887cd0:cases/CASE_PROC_PED_EXANT_VARICELLA_001_001.json | grep -c $'\xef\xbf\xbd'  # 35

# 4. build OK pero typecheck/lint rotos
cd dr-swipe && npm run build                       # exit 0
npx tsc -p tsconfig.app.json --noEmit              # exit 2 (8 errores)
npx eslint .                                        # exit 1 (25 errores)

# 5. los 598 desplegados validan (réplica de Zod en python) → 0 violaciones
# 6. naming: avatar mendoza vs mentor citado
#    Castillo 287 · Navarro 184 · Mendoza 28 · Vázquez 4  (445 casos descuadrados)
```

---

## 10. Decisiones pendientes (requieren criterio del autor)

Estos puntos **no se tocaron** porque dependen de criterio editorial/diseño, no de una respuesta determinista:

1. **85 incoherencias de edad** entre `patient_intro.name` y `arrival_scenario`
   (p.ej. "Iker, 9 meses" vs "Paciente de 4 años"). Hay que decidir, por caso,
   cuál edad es la canónica antes de tocar contenido clínico que depende de ella.
2. **445 casos con avatar (`mendoza`) ≠ mentor citado** en los comentarios
   (Castillo 287 · Navarro 184 · Mendoza 28 · Vázquez 4). Dos caminos posibles:
   (a) que el avatar refleje al mentor que habla, o (b) normalizar todos los
   comentarios a un único mentor. Es una decisión de diseño de personajes.
3. **Higiene de repo**: archivar `cases/` raíz (corrupta, esquema antiguo, no la
   usa la app) + los 41 scripts sueltos; decidir destino de `v2/` (scaffold
   muerto); resolver peer-deps de `vite-plugin-pwa`; aclarar doble ruta de deploy.
4. **Bundle** de 518 KB en un solo chunk: opcional, code-splitting con `React.lazy`.

---
*Documento vivo. La auditoría original fue de solo lectura; la §0.1 registra la
remediación aplicada en esta rama (commits `1e4a0dd` y `28a5be1`).*
