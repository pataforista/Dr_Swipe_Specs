# ENGINE_SWIPE_CASE_FRAMING_SPEC_v1

## Rol del documento
Definir la capa de framing (encuadre) que permite al jugador entender
qué se espera de él en Dr. Swipe, sin introducir:
- diagnóstico
- instrucción clínica
- juicio moral
- pistas sobre la “respuesta correcta”

Esta capa es:
- narrativa ligera
- mecánica
- separada de CORE y del CASE_INSTANCE

---

## Principio rector
El framing explica **la tarea**, no **la clínica**.

El jugador debe entender:
- qué está haciendo
- por qué hay ruido
- cuándo se aproxima una decisión

Pero nunca:
- qué decisión es correcta
- qué significa clínicamente la evidencia

---

## Componentes del Framing

### 1. Intro de Caso (obligatoria)
Se presenta una sola vez, al iniciar el intake.

#### Contenido permitido
- Rol del jugador (revisor, investigador, guardia).
- Naturaleza incompleta del expediente.
- Expectativa explícita de descarte.

#### Contenido prohibido
- Diagnósticos
- Objetivos clínicos
- Menciones a tratamiento, estabilización, estudio, etc.

#### Ejemplo permitido
> “Estás revisando un expediente clínico incompleto.  
> No toda la información será útil.  
> Guarda solo lo necesario para tomar decisiones seguras.”

---

### 2. Señalización de Flujo (durante evidence_stream)

#### Objetivo
Reducir confusión sin guiar decisiones.

#### Elementos permitidos
- Indicadores de progreso (ej. ‘Información recibida: 4/10’).
- Aviso genérico de decisión próxima.

#### Ejemplo permitido
> “Se aproxima un punto de decisión.”

#### Prohibido
- “Ya tienes suficiente información”
- “Falta X dato”
- “Revisa laboratorios”

---

### 3. Framing del Checkpoint

Cuando se entra al estado `checkpoint`.

#### Contenido permitido
- Aviso sistémico de que una decisión será evaluada.
- Recordatorio de que el sistema solo lee el dossier.

#### Ejemplo permitido
> “El sistema evaluará la información que decidiste conservar.”

#### Prohibido
- Preguntas clínicas
- Lenguaje de examen
- Feedback anticipatorio

---

### 4. Feedback Post-Checkpoint

#### Si el resultado es neutro o éxito
- Lenguaje sistémico.
- Sin reforzamiento clínico.

Ejemplo:
> “La decisión se ejecutó con la información disponible.”

#### Si el resultado es fallo
- Descripción de consecuencia.
- Nunca atribuir culpa al jugador.

Ejemplo:
> “La información conservada fue insuficiente para esta decisión.”

#### Si `letal_si_falla = true`
- El mensaje describe el evento, no la acción del jugador.

Ejemplo:
> “El sistema no pudo evitar un desenlace crítico.”

Nunca:
> “Tomaste una mala decisión.”

---

### 5. Cierre del Caso

#### Objetivo
Reflexión mecánica, no clínica.

#### Contenido permitido
- Estadísticas del dossier.
- Tipo de manejo de información.

Ejemplo:
> “Guardaste 4 de 10 elementos.  
> El expediente final fue compacto.”

#### Prohibido
- “Lo correcto habría sido…”
- “Aprendiste que…”

---

## Relación con otros sistemas

### Con ENGINE_SWIPE_SCORING_RULES
- El framing puede mostrar resultados (scores, etiquetas).
- Nunca explica cómo optimizarlos.

### Con CORE
- No referencia decision_nodes.
- No expone outcomes clínicos.

---

## Regla de Oro
Si un texto permite inferir una decisión clínica,
ese texto pertenece a otro juego, no a Dr. Swipe.

---

## Criterio de cierre
ENGINE_SWIPE_CASE_FRAMING_SPEC_v1 queda aprobado cuando:
- permite entender la tarea sin explicar la clínica
- no introduce pistas diagnósticas
- es reusable para cualquier dominio del CORE
