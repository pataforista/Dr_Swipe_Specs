# CORE — Gobernanza y Control de Cambios

Este documento define **cómo se mantiene estable el CORE** sin volverse obsoleto.

---

## 1. Tipos de Archivos

### a) Decisiones
- `CORE_*_DECISIONS.jsonl`
- Contienen nodos clínicos accionables.
- Son la unidad mínima del sistema.

### b) Metadatos
- `*_METADATA.jsonl`
- Controlan impacto, letalidad, dificultad.
- Nunca modifican clínica, solo ponderación.

### c) Documentos MD
- Definen reglas del sistema.
- No contienen clínica.

---

## 2. Versionado

- Versionado semántico (`v1.0`, `v1.1`, `v2.0`)
- Cambios mayores → nueva versión.
- Cambios menores → nuevos nodos.

❌ Prohibido:
- Editar nodos antiguos para “corregirlos”.
- Reinterpretar decisiones ya validadas.

---

## 3. Criterios para agregar un nuevo nodo CORE

Un nodo nuevo debe cumplir al menos **2 de 3**:

1. Error frecuente en práctica real.
2. Impacto vital alto o inmediato.
3. Evidencia estable y ampliamente aceptada.

---

## 4. Control de Colisiones

Se debe evitar:
- Juicio moral.
- Castigo educativo.
- Convertir valores en métricas.

El CORE **no educa con culpa**, educa con consecuencias clínicas.

---

## 5. Separación de Capas

- CORE → decisiones puras.
- CONTEXTO → narrativa, casos, juegos.
- UI / UX → completamente desacoplado.

El CORE **no conoce**:
- Interfaz
- Usuario
- Examen
- Plataforma

---

## 6. Autoridad Canónica

La autoridad del CORE proviene de:
- Coherencia interna.
- Seguridad clínica.
- Revisión experta iterativa (como la que has hecho).

No de:
- Frecuencia en exámenes.
- Tendencias educativas.
- Opinión popular.

---

## Regla final de gobernanza

> **Si un cambio mejora el “aprendizaje”
> pero empeora la seguridad,
> el cambio está prohibido.**

Estado: CORE_CANON v1.0  
Congelación: Parcial (expansión permitida, reescritura no)
