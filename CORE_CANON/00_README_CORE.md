# CORE_CANON — Núcleo Clínico Crítico

Este repositorio contiene el **CORE CANÓNICO** de decisiones clínicas críticas para urgencias y hospitalización.
No es un banco de preguntas, ni un simulador ENARM tradicional.

Es un **motor de decisiones clínicas de alto riesgo**, diseñado para:
- Enseñar **qué NO hacer** cuando un error mata.
- Priorizar **orden, tiempo y secuencia**, no memorización.
- Ser reutilizable por múltiples motores (juegos, apps, evaluadores).

---

## ¿Qué es el CORE?

El CORE es el **mínimo irreductible** de decisiones clínicas donde:
- La evidencia es estable.
- El error tiene consecuencias inmediatas.
- La omisión es tan peligrosa como la acción incorrecta.

Ejemplos:
- No dar epinefrina en anafilaxia.
- Mandar a TAC a un paciente inestable.
- Dar betabloqueador IV en edema agudo pulmonar.
- Retrasar antibióticos en sepsis.

---

## Qué SÍ es este repositorio

- Canon clínico congelable.
- Dataset agnóstico a UI, juego o plataforma.
- Fuente única de verdad para decisiones críticas.
- Diseñado para versionado sin reescritura.

## Qué NO es

- ❌ Guía clínica completa.
- ❌ Manual de tratamiento detallado.
- ❌ Recomendación médica individual.
- ❌ Simulador de examen ENARM.

---

## Estructura General

- Archivos `CORE_*_DECISIONS.jsonl` → **Decisiones clínicas**
- Archivos `*_METADATA.jsonl` → **Gobernanza, impacto, letalidad**
- Carpetas por sistema → **Organización semántica**
- Archivos `.md` → **Reglas del sistema (este nivel)**

---

## Principio rector

> **En el CORE no se evalúa conocimiento,
> se evalúa supervivencia.**

Última actualización: v1.0  
Estado: Activo — Expansión controlada
