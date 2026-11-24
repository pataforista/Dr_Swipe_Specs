# Revisión Final de Lanzamiento — Dr. Swipe v1.0.1

**Commit:** `b63a513` (`main` / tag `v1.0.1`)  
**Fecha:** 2026-11-24  
**Estado técnico:** 130/130 tests unitarios en verde · 0 errores/warnings ESLint · 599 casos clínicos válidos · Build PWA limpio.

---

## 1. Despliegue en GitHub Actions y Cloudflare Pages

- **Workflow:** `.github/workflows/cloudflare-deploy.yml`
- **Proyecto Cloudflare Pages:** `dr-swipe-specs`

### Checklist
- [ ] En GitHub → pestaña **Actions**, confirmar que el workflow **Deploy to Cloudflare Pages** del commit `b63a513` terminó en verde.
- [ ] Confirmar que estén configurados los secretos `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`.
- [ ] *(Opcional)* Si deseas monitoreo de errores en producción, configurar la variable pública `SENTRY_DSN` en *Settings → Secrets and variables → Actions → Variables*.
- [ ] Abrir la URL pública de Cloudflare Pages y comprobar en DevTools → Console que **no haya errores de CSP** (especialmente con Google Fonts).

---

## 2. Validación en móvil real (iOS Safari / Android Chrome)

Referencia extendida: `PWA_VALIDATION_CHECKLIST.md`.

### Checklist rápida (5 minutos)
- [ ] **Instalación PWA:** Agregar a pantalla de inicio y abrir en modo standalone (sin barra de navegador; barra `#5C6784`, fondo `#FEFAFF`).
- [ ] **Contraste y legibilidad:** Verificar que los botones principales (`.marker-btn`), "Créditos" en el HUD y los badges de dificultad/modo se lean con claridad.
- [ ] **Modo Simulacro ENARM:** Confirmar que el botón `SIMULACRO ENARM` inicia la consulta directamente, sin ayudas (sin escáner, sin deshacer, sin relevo médico, sin cofres).
- [ ] **Modo offline:** Jugar 1 guardia con internet → activar Modo Avión → cerrar y reabrir la app → confirmar que abre y carga casos desde caché.
- [ ] **Autoguardado:** Jugar ≥3 cartas → cerrar la app → reabrir y confirmar que aparece **REANUDAR GUARDIA** conservando el modo activo (Estudio, Guardia o Simulacro ENARM).

---

## 3. Revisión médica humana (2 cartas con matiz)

Referencia completa: `REVISION_CLINICA/VEREDICTOS_RIESGO_LETAL.md` (líneas 95–100).  
En ambas cartas la conducta esperada (`discard`) ya coincide con el estándar ENARM; lo que requiere visto bueno es el **matiz en el comentario del mentor**.

### Carta A — DIU tras evacuación de mola hidatiforme
- **Archivos:** `cases/CASE_PROC_OBS_HEM_MOLA_001_001.json` … `_015.json` (15 casos)
- **ID de carta:** `dx_1`
- **Acción esperada:** `discard` (Descartar)
- **Texto actual de la carta:**
  > *"DIU Inmediato: Colocarlo tras la evacuación como método anticonceptivo durante el seguimiento."*
- **Comentario actual del mentor:**
  > *"Castillo: El DIU suele diferirse hasta que la hCG sea normal por el riesgo de perforación y sangrado; las guías no coinciden y la evidencia no muestra más neoplasia con él. En el seguimiento se prefieren métodos hormonales o de barrera."*
- **Fuentes citadas en auditoría:** Gaffield 2009 (`doi:10.1016/j.contraception.2009.03.022`) y Hagey 2024 (`doi:10.1016/j.contraception.2024.110488`) vs criterios MEC/OMS y GPC mexicana.
- **Decisión:**
  - [x] Aprobar tal como está (con matiz basado en evidencia; alineado con GPC mexicana y ENARM).
  - [ ] Redactar más tajante según GPC mexicana para ENARM (escribir preferencia).

---

### Carta B — Suspender sulfato de magnesio al terminar el nacimiento
- **Archivos:** `cases/CASE_PROC_OBS_PREECLAMPSIA_001_001.json` … `_015.json` (15 casos)
- **ID de carta:** `l5_pe2`
- **Acción esperada:** `discard` (Descartar)
- **Texto actual de la carta:**
  > *"Suspender el sulfato de magnesio al terminar el nacimiento: El riesgo de convulsión desaparece al expulsar la placenta."*
- **Comentario actual del mentor:**
  > *"Castillo: El riesgo de eclampsia persiste en el posparto, por eso el esquema estándar mantiene el sulfato de magnesio 24 horas después del nacimiento. Algunos ensayos sugieren que periodos más cortos podrían bastar, pero no es la conducta estándar."*
- **Fuentes citadas en auditoría:** Vigil-De Gracia 2018 (`doi:10.1111/1471-0528.15320`) y Okonkwo 2022 (`doi:10.1097/aog.0000000000004720`).
- **Decisión:**
  - [ ] Aprobar tal como está (mencionando los ensayos de esquemas cortos).
  - [x] Dejar únicamente la regla estándar de 24 h posparto para estudio ENARM *(aplicado a los 15 casos y lotes)*.
