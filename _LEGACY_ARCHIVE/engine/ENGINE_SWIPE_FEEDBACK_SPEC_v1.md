# ENGINE_SWIPE_FEEDBACK_SPEC_v1

## Rol del documento
Definir la retroalimentación mínima necesaria para que el jugador
entienda:
- qué tipo de manejo de información realizó
- qué patrón emergió
- qué consecuencia sistémica tuvo

Sin explicar clínica, sin decir “qué debió hacer”.

---

## Principio rector
El feedback **nombra patrones**, no decisiones.
En modo ENARM se habilita feedback educativo **solo al cierre**.

Nunca:
- “Debiste conservar X”
- “La decisión correcta era Y”

Siempre:
- “El sistema detectó este patrón de manejo de información”.

---

## Momentos válidos de feedback

El feedback solo puede aparecer en:
1. Post-checkpoint
2. Cierre de caso (dossier)

Nunca durante el swipe individual.

---

## Tipos de feedback permitidos

### 1. Feedback de patrón (principal)

Se activa según scoring rules.

#### Patrones posibles
- hoarding
- clean_dossier
- tunnel_vision
- safe_prioritization
- delay

#### Formato permitido
- Etiqueta breve + descripción sistémica.

Ejemplos:
> “Patrón detectado: acumulación excesiva de información.”  
> “Patrón detectado: priorización segura con expediente compacto.”  
> “Patrón detectado: enfoque limitado en una sola categoría.”

Nunca mencionar evidencia específica.

---

### 2. Feedback de consecuencia (checkpoint)

Describe **qué ocurrió**, no por qué clínicamente.

Ejemplos:
> “La información conservada fue suficiente para esta decisión.”  
> “La información conservada fue insuficiente para esta decisión.”  

Si `letal_si_falla = true`:
> “El sistema no pudo amortiguar un evento crítico.”

---

### 3. Feedback comparativo interno (opcional, potente)

Comparación **consigo mismo**, no con otros.

Ejemplos:
> “En este caso conservaste 6 de 10 elementos.”  
> “En casos previos conservaste en promedio 4.”

No decir:
- “Muchos”
- “Pocos”
sin referencia.

### 4. Feedback ENARM (cierre)
Permitido únicamente en modo ENARM y solo al final:
- “Perla ENARM” con referencia GPC.
- Comparativa visual: señal en verde, ruido en rojo.
- Mención explícita de segmento omitido o subrayado erróneo.

---

## Qué NO se permite como feedback

❌ Explicar clínica  
❌ Señalar evidencia concreta  
❌ Usar lenguaje evaluativo (“bien”, “mal”)  
❌ Ofrecer recomendaciones  
❌ Frases tipo “aprendiste que…”
En modo ENARM se permite mencionar la recomendación **si** proviene de GPC
con formato de “Perla ENARM”.

---

## Relación con scoring

- El feedback **lee** scoring.
- El feedback **no explica** cómo optimizarlo.
- El jugador infiere patrones por repetición.

---

## Cierre de caso (feedback consolidado)

Al final del caso, el sistema puede mostrar:

- kept_items / discarded_items
- patrones detectados
- una frase de cierre neutra

Ejemplo:
> “El expediente final fue compacto.  
> El sistema detectó priorización segura bajo ruido.”

---

## Criterio de cierre
ENGINE_SWIPE_FEEDBACK_SPEC_v1 queda aprobado cuando:
- el jugador puede verbalizar qué tipo de manejo hizo
- sin que el sistema explique clínica
- sin convertir el juego en examen
