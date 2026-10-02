ROADMAP.md — Documento Maestro de Dr. Swipe

Este es el primer archivo que se abre cada sesión de trabajo.
Toda decisión de código, contenido o diseño debe poder rastrearse hasta aquí.
Si algo no está en este documento, no existe todavía. Si algo cambia, se actualiza aquí antes de tocar código.

Última actualización: 2026-10-02
Versión del proyecto: 0.5.0-alpha
Estado global: 🟡 En construcción activa

🧭 Índice
1. Propósito del documento
2. Snapshot del estado actual
3. Principios arquitectónicos no negociables
4. Modelos de datos (fuente de verdad)
5. Mapa del proyecto (estructura de archivos)
6. Inventario de funciones por módulo
7. Roadmap por fases
8. Registro de decisiones (ADR ligero)
9. Preguntas abiertas
10. Cómo usar este documento

1. Propósito del documento
Este archivo es la única fuente de verdad del proyecto Dr. Swipe. Resuelve tres problemas:
- Onboarding: alguien nuevo (o tú en 3 semanas) entiende el proyecto en 10 min.
- Trazabilidad: cada fase tiene criterios de aceptación. Si algo no cumple, no se avanza.
- Foco: se evita la tentación de saltar entre features sin cerrar la anterior.
Regla de oro: nunca se empieza una fase nueva sin marcar la anterior como ✅ Cerrada.

2. Snapshot del estado actual
| Área | Estado | Notas |
|---|---|---|
| Stack base (React 18 + Vite + Tailwind) | ✅ | Estable |
| Motor lógico (XState) | ✅ | gameMachine.ts puro |
| Persistencia (Zustand + LocalStorage) | ✅ | useCodexStore.ts con persist |
| Validación (Zod) | ✅ | caseSchema.ts activo |
| UI Triage (SwipeDeck) | ✅ | Botones + teclado + swipe |
| Motor háptico / audio | ✅ | useGameAudio, hapticFeedback.ts con bandera lastAction |
| Boss Fight (ShockRoom) | 🟡 | Funcional, pendiente de balance |
| Estados XState completos | ✅ | `victoria_guardia` conectado (evento `FINISH_SHIFT`) |
| PerformanceReview | ✅ | Conectado a `victoria_guardia` con `computeSessionMetrics` |
| commitSession + SRS | ✅ | Store v2 con `caseProgress`; migración v0/v1 → v2 |
| Contenido | ✅ | 599 casos, descarte global 41 % (ver PLAN_SIGUIENTES_PASOS.md) |
| CI (validación de casos, tests, build, deploy) | ✅ | `.github/workflows/cloudflare-deploy.yml` |
| Lazy Loading de casos | ❌ | Planificado para Fase 4 |
| "Favores del Adjunto" (moneda blanda) | ❌ | Planificado para Fase 5 |

Leyenda: ✅ Cerrado · 🟡 En progreso · ❌ No iniciado · ⏸️ Pausado · 🔴 Bloqueado

3. Principios arquitectónicos no negociables
Estos son los contratos del proyecto. Romperlos requiere una entrada en el Registro de decisiones.

3.1 Separación estricta de responsabilidades
| Capa | Responsabilidad | Nunca hace |
|---|---|---|
| XState (gameMachine.ts) | Reglas del juego, transiciones, estado de sesión | DOM, audio, hápticos, fetch, LocalStorage |
| Zustand (useCodexStore.ts) | Persistencia de largo plazo (XP, monedas, SRS, perlas) | Estado de partida activa |
| React components | Render, animación, input | Lógica de juego |
| Hooks (useGameAudio, etc.) | Efectos secundarios reaccionando a XState | Estado propio de juego |
| Utils (scoringEngine, srsEngine, etc.) | Funciones puras, testables | Cualquier side effect |

3.2 XState es puro
- No usa fetch, localStorage, Audio(), navigator.vibrate.
- Los efectos viven en useEffect de App.tsx que escuchan state.value y state.context.lastAction.
- lastAction se resetea a null tras consumirse (ya implementado).

3.3 Los tipos son el contrato
- Todo modelo de datos vive en src/types/. Cambiar un tipo requiere actualizar a todos sus consumidores y el esquema Zod.
- Zod es la última línea de defensa: si un JSON no pasa, el juego no crashea, se salta el caso.

3.4 Un efecto, una fuente
- Nunca dos componentes disparan el mismo sonido/háptico.
- Nunca dos stores guardan el mismo dato.
- Nunca dos useEffect reaccionan al mismo evento sin coordinación (useRef guard).

4. Modelos de datos (fuente de verdad)
Estos tipos viven en src/types/. Son inmutables sin ADR.

4.1 types/case.ts — Contenido clínico
export type CaseCard = {
  id: string;
  prompt: string;
  correctAction: 'keep' | 'discard';
  explanation: string;
  safetyFlag?: 'lethal_risk' | 'caution' | null;
};
export type ClinicalCase = {
  id: string;
  specialty: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  patientName: string;
  patientAge: number;
  chiefComplaint: string;
  cards: CaseCard[];
  pearl: string;
  bossQuestions?: BossQuestion[];
};

4.2 types/game.ts — Estado de sesión
export type CaseOutcome = 'perfect' | 'correct_with_errors' | 'rescued' | 'failed';
export type CaseResult = {
  caseId: string;
  specialty: Specialty;
  outcome: CaseOutcome;
  mistakes: number;
  lethalErrors: number;
  timeSpentMs: number;
  cardsSeen: number;
  xpEarned: number;
  coinsEarned: number;
  pearlId: string | null;
};
// XP, monedas y perlas se derivan de caseResults (ADR 007).
export type SessionState = {
  startedAt: number;
  caseResults: CaseResult[];
  maxCombo: number;
};
export type SessionMetrics = {
  precision: number;
  survivalRate: number;
  grade: 'S' | 'A' | 'B' | 'C';
  xpEarned: number;
  coinsEarned: number;
  maxCombo: number;
  casesCompleted: number;
  casesFailed: number;
  casesScheduledAhead: number;
};

4.3 types/srs.ts — Spaced Repetition
export type CaseProgress = {
  caseId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: number;
  lastReviewDate: number;
  lapses: number;
  totalReviews: number;
  lastQuality: number;
  mastered: boolean;
};

4.4 types/state.ts — Estados XState válidos
export type GameState =
  | 'idle'
  | 'triage'
  | 'triage.evaluandoCartas'
  | 'triage.eventosAleatorios'
  | 'ghosted'
  | 'fail_protection'
  | 'debrief'
  | 'critical_alert'
  | 'boss_fight'
  | 'reward'
  | 'victoria_guardia';

5. Mapa del proyecto (estructura de archivos)
Dr_Swipe_Specs/
├── ROADMAP.md                   ← Este documento
├── cases/                       ← 599 casos en JSON crudo
│
├── dr-swipe/
│   ├── public/cases/
│   │   ├── manifest.json        ← [Fase 4] índice de especialidades
│   │   └── cardiologia.json     ← [Fase 4] segmentado
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── overlays/
│   │   │   │   ├── LootBoxOverlay.tsx
│   │   │   │   ├── PerformanceReview.tsx    ← 🟡 En progreso
│   │   │   │   └── Toast.tsx
│   │   │   ├── ui/
│   │   │   ├── SwipeDeck.tsx
│   │   │   └── ShockRoom.tsx
│   │   │
│   │   ├── data/lore/
│   │   │   ├── dialogues.ts
│   │   │   └── items.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── useGameAudio.ts
│   │   │   ├── useFocusTrap.ts
│   │   │   └── useSessionCommit.ts   ← [Fase 2] nuevo
│   │   │
│   │   ├── machines/
│   │   │   └── gameMachine.ts
│   │   │
│   │   ├── store/
│   │   │   └── useCodexStore.ts
│   │   │
│   │   ├── types/
│   │   │   ├── case.ts
│   │   │   ├── game.ts
│   │   │   ├── srs.ts          ← [Fase 3] nuevo
│   │   │   └── state.ts
│   │   │
│   │   └── utils/
│   │       ├── caseSchema.ts
│   │       ├── dataLoader.ts
│   │       ├── scoringEngine.ts
│   │       ├── srsEngine.ts    ← [Fase 3] nuevo
│   │       └── hapticFeedback.ts

6. Inventario de funciones por módulo
6.1 utils/scoringEngine.ts
| Función | Firma | Estado |
|---|---|---|
| evaluateSwipe | (card, action, combo) => SwipeResult | ✅ |
| computeCombo | (currentCombo, result) => number | ✅ |
| computeXP | (result, combo, difficulty) => number | ✅ |

6.2 utils/dataLoader.ts
| Función | Firma | Estado |
|---|---|---|
| loadCases | (specialty, count, excludeIds) => Promise<ClinicalCase[]> | ✅ |
| loadCasesBySpecialty | (specialty) => Promise<ClinicalCase[]> | ❌ Fase 4 |
| loadCaseById | (caseId) => Promise<ClinicalCase> | ✅ (usado por el repaso SRS) |

6.3 utils/srsEngine.ts (Fase 3)
| Función | Firma | Estado |
|---|---|---|
| applySM2 | (prev, caseId, quality, now) => CaseProgress | ✅ |
| outcomeToQuality | (CaseResult) => number | ✅ |

6.4 store/useCodexStore.ts
| Función / campo | Estado |
|---|---|
| coins, totalXP, streak, lastPlayedAt | ✅ |
| pearlsUnlocked, sessionsPlayed | ✅ |
| caseProgress: Record<string, CaseProgress> | ✅ |
| commitSession(results, now?) | ✅ Solo alimenta el SRS; XP/monedas se pagan por caso en la pantalla de recompensa |
| getCasesDueForReview(now?) | ✅ |
| migrateCodexState (persist v2) | ✅ |
| getSpecialtyStats() | ❌ Fase 5 |
| spendFavors(cost) / earnFavors(amount) | ❌ Fase 5 |

6.5 machines/gameMachine.ts
| Estado / Acción | Estado |
|---|---|
| idle, triage, ghosted, boss_fight, reward | ✅ |
| victoria_guardia (reward → FINISH_SHIFT) | ✅ |
| debrief con RetrospectiveView | ✅ |
| session.startedAt inicializado en START_GUARD / RESUME_GUARD | ✅ |
| session.caseResults en reward (éxito) y debrief (fracaso) | ✅ |
| session.maxCombo | ✅ |
| session.pearlsEarned | ➖ Descartado: se deriva de caseResults (ADR 007) |

6.6 hooks/ (Fase 2+)
| Hook | Firma | Estado |
|---|---|---|
| useSessionCommit | (startedAt, caseResults, commit) => void (confirma cada caso una sola vez por guardia) | ✅ |

6.7 components/overlays/PerformanceReview.tsx
| Elemento | Estado |
|---|---|
| Grade stamp con spring | ✅ |
| XP + Coins animados | ✅ |
| 3 columnas (precisión, combo, supervivencia) | ✅ |
| SRS placeholder | ✅ |
| Vignette médica | ✅ |
| Conectado a computeSessionMetrics | ✅ |

7. Roadmap por fases

🟩 Fase 0 — Fundación ✅ CERRADA
Objetivo: Stack, tipos, esquema Zod, estructura de carpetas.
DoD: npm run dev levanta, npm run build pasa sin errores, caseSchema valida 599 casos.

🟩 Fase 1 — Núcleo jugable ✅ CERRADA
Objetivo: Triage funcional con swipe, audio, hápticos, scoring.
DoD:
☑ SwipeDeck con swipe + botones + teclado.
☑ gameMachine transiciona idle → triage → ghosted/reward.
☑ useGameAudio y hapticFeedback reaccionan a lastAction.
☑ Sin solapamiento de sonidos en render.

🟩 Fase 2 — Cierre de sesión ✅ CERRADA (pendiente de prueba manual en dispositivo)
Objetivo: La guardia tiene final. El jugador ve su recompensa antes de volver al menú.
Tareas:
- [x] Añadir session: SessionState al contexto de gameMachine.
- [x] Inicializar session.startedAt al iniciar/reanudar la guardia.
- [x] Acumular CaseResult en reward (éxito) y debrief (fracaso; ADR 008).
- [x] Estado victoria_guardia con transición reward → victoria_guardia (evento FINISH_SHIFT cuando la cola de casos está vacía).
- [x] Distinguir victoria_guardia de debrief (cierre por fracaso).
- [x] Implementar computeSessionMetrics(session, payout?).
- [x] Implementar commitSession en Zustand.
- [x] Crear useSessionCommit con useRef guard para StrictMode.
- [x] Conectar PerformanceReview a state.matches('victoria_guardia').
- [x] Botón "Regresar al Menú" → send('RESTART').
DoD:
- [x] El jugador puede jugar 3 casos y ver PerformanceReview (flujo cubierto por test de máquina; falta prueba manual).
- [x] Recargar no duplica XP (el estado de la máquina no se persiste; el hook confirma cada caso una vez).
- [x] Fracaso va a debrief.
- [x] commitSession testeado.

🟩 Fase 3 — Aprendizaje (SRS SM-2) ✅ CERRADA
Objetivo: El juego recuerda lo que fallaste y te lo reprograma.
Tareas:
- [x] Crear types/srs.ts con CaseProgress.
- [x] Crear utils/srsEngine.ts con applySM2 y outcomeToQuality.
- [x] Migrar useCodexStore de mistakes a caseProgress (caseStats se conserva para estadísticas).
- [x] Añadir migrate en persist (v0/v1 → v2).
- [x] Implementar getCasesDueForReview(now).
- [x] Conectar botón "REPASAR MIS ERRORES 🖍️" (casos con nextReviewDate vencido).
- [x] PerformanceReview lee casesScheduledAhead (casos con calidad SM-2 < 4).
- [x] Tests de progresión SM-2.
DoD:
- [x] Caso dominado (interval >= 21).
- [x] Fallo reprograma a now + 1d.
- [x] Migración v1 a v2 sin pérdida.

🟦 Fase 4 — Escalado de contenido
Objetivo: Soportar 3,000+ casos sin degradar rendimiento móvil.
Tareas:
- [ ] Segmentar cases/ por especialidad → public/cases/{specialty}.json.
- [ ] Crear manifest.json.
- [ ] dataLoader carga especialidad activa.
- [ ] Validación Zod diferida.

🟪 Fase 5 — Meta-progresión
Objetivo: Razones para volver mañana.
Tareas:
- [ ] Moneda blanda "Favores del Adjunto".
- [ ] Diálogos del Dr. Navarro/Vázquez.
- [ ] Pantalla "Codex".
- [ ] Logros / achievements.

🟪 Fase 6 — Accesibilidad y pulido
Tareas:
- [x] prefers-reduced-motion (CSS + MotionConfig reducedMotion="user").
- [x] aria-label en botones icónicos.
- [x] Foco visible / teclado completo.

🟥 Fase 7 — Producción
Tareas:
- [ ] Sentry / Analytics.
- [x] CI/CD (GitHub Actions → Cloudflare Pages).
- [ ] Tests E2E.
- [ ] Versión 1.0.0.

8. Registro de decisiones (ADR ligero)
| # | Decisión | Motivo | Alternativas |
|---|---|---|---|
| 001 | XState para lógica | Evita bugs de flujo, testeable | Redux, useState disperso |
| 002 | Zustand para persistencia | Separación sesión vs. largo plazo | Context API, Redux |
| 003 | Zod para validar JSON | Evita crasheos | Validación manual |
| 004 | "Llamar Adjunto" | Ludonarrativa médica | Pay-to-win |
| 005 | SM-2 en lugar de errores | SRS real, educativo | Leitner simple |
| 006 | caseQueue empty = victoria | Un turno fallido no es victoria | Unificar debrief con victoria |
| 007 | session solo guarda caseResults; XP/coins se derivan | Evita doble fuente de verdad (Principio 3.4) | Acumular totalXP/totalCoins |
| 008 | CaseResult se graba en reward/debrief, no en ghosted | ghosted es transitorio (rescate lo revierte) | Grabar en ghosted y actualizar si rescata |
| 009 | commitSession solo alimenta el SRS | El XP/monedas ya se pagan por caso; pagarlos al cerrar duplicaría | Mover el pago al cierre de guardia |

9. Preguntas abiertas
- [ ] ¿Cuántos casos dura una guardia estándar? (3, 5, 10)
- [ ] ¿Los "Favores del Adjunto" se ganan por racha o compra?
- [ ] ¿La racha diaria se rompe con 1 día o 2?
- [ ] ¿El quality de SM-2 penaliza tiempo de respuesta?
- [ ] ¿Modo "simulacro ENARM" (sin Adjunto)?

10. Cómo usar este documento
Cada sesión de trabajo: Abrir este archivo. Ir a la fase en progreso. Elegir tarea no marcada. Marcar ✅.
Al cerrar una fase: Verificar DoD. Marcar Fase Cerrada. Actualizar Versión.
Nunca empezar Fase N+1 con Fase N en 🟡.

📜 Historial de versiones
| Versión | Fecha | Cambio |
|---|---|---|
| 0.1.0 | — | Fundación (stack, tipos, Zod) |
| 0.2.0 | — | Triage jugable |
| 0.3.0 | — | PerformanceReview creado, SRS diseñado |
| 0.4.0 | 2026-10-01 | Documento maestro instaurado, Fase 2 en progreso |
| 0.5.0 | 2026-10-02 | Build reparado; Fases 2 y 3 cerradas (cierre de guardia, SRS, store v2) |

Siguiente acción concreta: Fase 4 → segmentar cases/ por especialidad (manifest.json + public/cases/{specialty}.json). Antes, prueba manual de una guardia de 3 casos en móvil.
