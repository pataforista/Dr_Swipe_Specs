# Mapa de Implementación V2 (PWA Educativa - Dr. Swipe)

## Visión General
Este documento detalla la arquitectura definitiva para migrar el prototipo funcional actual (Vanilla JS/HTML/CSS) hacia una **Progressive Web App (PWA) construida en React + TypeScript**. Esta pila tecnológica fue elegida para asegurar la escalabilidad, la fluidez de interacción (UX) y la resiliencia offline necesaria para médicos en estudio constante.

---

## 1. El Stack Tecnológico Base

*   **Framework:** Vite + React + TypeScript
*   **Gestión Global de Estado:** XState
*   **Estilos:** Tailwind CSS (o styled-components para mantener encapsulación)
*   **Persistencia Local:** Dexie.js (Wrapper de IndexedDB)
*   **Métricas y Análisis:** Plausible o PostHog (opcional, para medir la dificultad real de los casos)

---

## 2. Los Cuatro Pilares Arquitectónicos

### Pilar A: El Motor de Swipe (Capa de Interacción)
Requerimos una capa física fluida para las tarjetas que emule la experiencia nativa ("Tinder Clínico").
*   **Librería Principal:** `react-tinder-card` ([Repositorio](https://github.com/3DJakob/react-tinder-card))
*   **Justificación:** Componente React maduro, ligero y con soporte para *swipe physics* y detección de dirección (`onSwipe`). Maneja perfectamente el *stream* de evidencia.
*   **Alternativa Vanilla:** `swing` ([Repositorio](https://github.com/gajus/swing)) - Útil como referencia matemática si `react-tinder-card` presentara problemas de rendimiento.

### Pilar B: La Máquina de Estados (Flujo Clínico)
El problema de los juegos educativos es el control del flujo (Intro -> Stream -> Quiz -> Resultado). Un sistema rudimentario de booleanos fallará al escalar.
*   **Librería Principal:** `xstate` ([Sitio Oficial](https://stately.ai/docs/xstate))
*   **Justificación:** Modelado estricto de State Machines finitas. Evita "bugs lógicos" (ej. hacer un swipe cuando el juego está esperando una respuesta de Quiz). Facilita la implementación de la mecánica de "Red Flag / Game Over Instantáneo" forzando transiciones abruptas de estado.

### Pilar C: Memoria y Persistencia (El Dossier Offline)
Si el jugador cierra la PWA en el metro, su avance en el "Caso de Urosepsis Estándar" debe permanecer intacto.
*   **Librería Principal:** `Dexie.js` ([Sitio Oficial](https://dexie.org/))
*   **Justificación:** Envuelve la API de IndexedDB haciéndola limpia, con soporte para TypeScript y React Hooks (`useLiveQuery`).
*   **Casos de uso:** Guardar tarjetas del "Dossier", historiales de aciertos/errores (para ver tendencias a largo plazo), notas del usuario y "Pines" (priorización clínica).

### Pilar D: El Subrayado Médico (Highlight Interactivo)
La iteración más vital para la UX médica: permitir marcar, subrayar y dejar notas directamente **sobre el texto** del síntoma antes de descartarlo/guardarlo.
*   **Librería Principal:** `recogito/text-annotator-js` ([Repositorio](https://github.com/recogito/text-annotator-js))
*   **Justificación:** Permite el anclaje persistente de highlights sobre texto específico y exportar dichas anotaciones nativamente como JSON.
*   **Alternativas de Respaldo:** `mark.js` (rápido pero sin estado intrínseco), `rough-notation` (si se busca una estética visual tipo "plumón de estudiante").

---

## 3. Otros Repositorios Útiles (Inspiración y Patrones)

Para resolver componentes secundarios o inspirarse en mecánicas probadas:

*   **Animación de Tríadas y Checkpoints:** `framer-motion` - Indispensable para orquestar la aparición dramática de las cartas de diagnóstico final.
*   **Feedback de Victoria / Racha:** `canvas-confetti` ([Repositorio](https://github.com/catdad/canvas-confetti)) - Recompensa neuro-visual rápida por sacar un "Expediente de Excelencia".
*   **Patrones de Quiz React:** `react-quiz-engine` ([Repositorio](https://github.com/D-vokic/react-quiz-engine)) - Como referencia para montar el UI del timer, progresos y layouts del quiz ENARM.
*   **Simulación Médica y Ruido Clínico:** `simhospital` (Google) e `infirmary-integrated` - Para analizar cómo generan variables clínicas complejas, útiles cuando el *Procedural Case Generator* deba generar casos con niveles "Ultra-Hard" (múltiples laboratorios en caos).

---

## 4. Estructura de Proyecto Sugerida (React)

```text
/dr-swipe-v2
  /public
    /data            <-- CORE_UNIFIED.jsonl
  /src
    /assets
    /components
      /SwipeDeck     <-- Integración con react-tinder-card
      /Dossier       <-- Lista de evidencias retenidas (Dexie.js)
      /QuizEngine    <-- Módulo aislado para la Tríada ENARM
      /CardHighlighter <-- Envoltura de text-annotator-js
    /machines
      gameMachine.ts <-- Lógica central usando XState
    /hooks
      useDexie.ts    <-- Gestor de estado local offline
    /utils
      generator.ts   <-- Tu motor procedimental migrado
    App.tsx
```

## 5. Implementación de "Ojo Clínico de Alerta" (Game Over Rápido)

Con esta arquitectura, detectar un error fatal (descartar una "Red Flag" de categoría "Contraindication" o "Lethal_Risk") es trivial con XState:

1. El `SwipeDeck` dispara un evento `DISCARD_CARD({ card_id })`.
2. La `gameMachine` evalúa si la tarjeta tenía la bandera `safety_flags: { lethal_risk: true }`.
3. Si es verdadero, fuerza una transición de estado a `FATAL_ERROR_SCREEN`.
4. El UI bloquea la partida de inmediato mostrando el "Game Over Clínico" del supervisor, en lugar de esperar hasta el final de las 14 tarjetas.
