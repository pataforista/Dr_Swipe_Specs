# Deficiencias de Dr. Swipe

Revisión del 2026-11-11 sobre `main` (`626dce9`). Cada fila dice qué falla, dónde, cómo se comprobó y qué debe cumplirse para darla por cerrada. El orden de trabajo está en `PLAN_JUEGO_COMPLETO.md`; aquí está el detalle.

**Cómo se comprobó.** Partidas reales en Chromium a 390×780 (guardia ganada, guardia perdida) y a 1280×800, más lectura del código y conteos sobre `cases/`. Las capturas citadas están en `DEFICIENCIAS_CAPTURAS/`.

**Sin datos suficientes** para: teléfono real, sonido y vibración, instalación de la PWA, despliegue en Cloudflare. Nada de eso se evalúa aquí.

**Gravedad.** Alta: altera el progreso del jugador o impide leer algo necesario. Media: se nota en la primera partida y resta credibilidad. Baja: pulido.

| Bloque | Alta | Media | Baja |
|---|---|---|---|
| A. Reglas y economía | 3 | 1 | 0 |
| B. Interfaz (defectos) | 2 | 5 | 3 |
| C. Estética e identidad | 0 | 7 | 3 |
| D. Contenido | 3 | 5 | 1 |
| E. Jugabilidad y retención | 0 | 4 | 2 |
| F. Producción | 1 | 4 | 3 |

---

## A. Reglas y economía

### A1 · Doble registro al pasar de caso — Alta
- **Qué pasa:** tras una guardia de 3 casos el Diario muestra "RESUELTOS 5". Reproducido en dos guardias (captura `08`).
- **Dónde:** `dr-swipe/src/App.tsx:236`, efecto de pago del estado `reward`.
- **Causa probable:** la guarda `rewardedCaseRef` compara contra `currentCase.case_id`. Al pulsar "continuar", `setCurrentCase(siguiente)` ocurre mientras la máquina sigue en `reward`; el identificador ya no coincide y el efecto paga otra vez: suma XP y monedas con el puntaje del caso anterior, registra como resuelto el caso que aún no se juega y desbloquea su perla. 3 casos + 2 transiciones = 5. Deducido del código; falta el test que lo aísle.
- **Impacto:** XP, monedas, casos resueltos, perlas y logros inflados. Además, el caso siguiente queda en el historial antes de jugarse.
- **Cerrado cuando:** un test juega 3 casos y exige `cases_solved === 3`, XP igual a la suma de los tres puntajes y 3 perlas.

### A2 · La escalera de rangos se agota en dos guardias — Alta
- **Qué pasa:** una guardia perfecta dio 12 516, 12 671 y 16 245 XP en tres ensayos. El rango máximo ("Director Médico") pide 25 000. La primera guardia lleva de "Estudiante" a "Jefe de Enseñanza".
- **Dónde:** `RANK_THRESHOLDS` en `StatsDashboard.tsx`; XP = puntaje × multiplicador de racha (`App.tsx`).
- **Nota:** parte de la cifra viene de A1. Hay que medir de nuevo tras corregirlo.
- **Decisión tomada:** el rango máximo debe costar unas **150 guardias**.
- **Cerrado cuando:** con el XP medio real por guardia (medido tras A1), los umbrales reparten 150 guardias entre los rangos con costo creciente (propuesta: 1, 5, 15, 40, 80 y 150 guardias acumuladas) y un test lo fija.

### A3 · Las monedas no tienen en qué gastarse — Alta
- **Qué pasa:** una guardia deja 900 a 1 200 monedas. Los únicos gastos son la pista (25) y deshacer (40).
- **Dónde:** `LIFELINE_COST`, `UNDO_COST` en `useCodexStore.ts`; bono de guardia perfecta en `scoringEngine.ts`.
- **Impacto:** tras la primera guardia la pista y el deshacer son gratis para siempre; la moneda deja de ser una decisión.
- **Cerrado cuando:** existe una tabla de ingresos y gastos por guardia y el saldo medio no crece sin límite (bajar ingreso, subir costos o crear sumideros cosméticos; ver E3).

### A4 · Puntaje negativo sin explicación — Media
- **Qué pasa:** un error letal resta 1 000 puntos; el HUD muestra "−1000" o "−75" desde la segunda carta (captura `04`). El tutorial solo habla de vitalidad (−15, −40).
- **Cerrado cuando:** el tutorial o la nota de error explica el costo en puntos, o el puntaje tiene piso en 0.

---

## B. Interfaz: defectos concretos

| # | Gravedad | Qué pasa | Dónde | Captura | Cerrado cuando |
|---|---|---|---|---|---|
| B1 | Alta | La nota de error del mentor se encima con el encabezado de la carta; ambos textos quedan ilegibles, justo cuando el jugador debe aprender del error | `AvatarFeedback.tsx`, contenedor en `App.tsx` (triaje) | `04` | La nota tiene fondo opaco y espacio propio; nada se lee a través de ella |
| B2 | Alta | Los avisos tapan títulos y se cortan con "…": tapan "Dr. Swipe" en el inicio, el título del botín, "Error Crítico" y la perla de repaso | `RewardToast.tsx`, cola en `App.tsx` | `02`, `06`, `12` | Los avisos ocupan una zona que nunca contiene texto, muestran el mensaje completo y no sobreviven al cambio de pantalla |
| B3 | Media | En el Shock Room la cinta decorativa tapa la etiqueta "FASE CRÍTICA"; las píldoras de combo y escudo montan el borde de la tarjeta | `ShockRoom.tsx`, `TelemetryHUD.tsx` | `05` | Etiqueta legible y píldoras dentro del HUD a 390 px |
| B4 | Media | En "Notas de la Guardia" la carta aparece cortada a media altura | `RetrospectiveView.tsx` | `10` | La lista se desplaza y cada carta se ve completa |
| B5 | Media | En escritorio la carta mide ~200 px de ancho y el texto parte cada tres palabras | `SwipeDeck.tsx` (alto máximo y proporción) | `11` | Carta de ancho legible (≥ 320 px) a 1280×800 |
| B6 | Media | Texto de relleno "Guardia nocturna..." al pie de todas las cartas, en gris casi invisible | `SwipeDeck.tsx:559` | `03` | Se quita o muestra un dato real (paciente) |
| B7 | Media | La fila "TELEMETRÍA" del HUD está vacía durante todo el triaje | `TelemetryHUD.tsx` | `03` | Muestra signos vitales o no se dibuja |
| B8 | Media | El mentor de las notas de error se llama `mendoza` y aparece como "MD"; los diálogos son de Navarro y Vázquez | `AvatarFeedback.tsx`, `App.tsx` | `04` | Un solo elenco en todo el juego |
| B9 | Baja | "RACHA: 1 DÍAS" | `App.tsx` (inicio) | `02` | Singular con 1 |
| B10 | Baja | "0 casos para repasar" seguido de "te lo volveremos a preguntar pronto" | `PerformanceReview.tsx` | `07` | Mensaje propio cuando no hay nada agendado |
| B11 | Baja | El aviso "Listo para usar sin conexión" queda sobre el pie del tutorial y del inicio | `ReloadPrompt.tsx` | `01` | No coincide con el tutorial ni tapa el aviso educativo |

---

## C. Estética e identidad

La base es sólida: papel crema, verde quirúrgico, contraste AA, objetivos táctiles amplios. Las deficiencias son de coherencia y de carácter.

| # | Gravedad | Deficiencia | Evidencia | Cerrado cuando |
|---|---|---|---|---|
| C1 | Media | **Tres lenguajes visuales.** Libreta de papel con cinta (inicio, expediente); "doodle" de contorno grueso y colores saturados (interruptores de Ajustes, tarjeta de jugador); panel oscuro con botón azul marino (cierre de guardia) | `01`, `09`, `08`, `07` | Existe una hoja de estilo de una página y todas las pantallas la cumplen |
| C2 | Media | **Colores sin sistema.** Hay tokens en `index.css`, pero 275 líneas de componentes usan clases de color sueltas (`slate-*`, `rose-*`, `emerald-*`, `amber-*`) | Conteo sobre `src/**/*.tsx` | Colores semánticos (acierto, error, letal, moneda, XP, favor) y ninguna clase de color cruda en componentes |
| C3 | Media | **Tipografía sin roles.** Fraunces (serif) se usa en títulos, pero también en cursiva para etiquetas de 11 px; las opciones del Shock Room van en serif negrita y las cartas en sans | `03`, `05` | Serif solo en títulos y cifras grandes; sans en lectura, etiquetas y opciones; escala de 5 o 6 tamaños |
| C4 | Media | **La carta está vacía.** Rectángulo blanco, texto centrado, mucho aire muerto. La categoría es un chip pequeño; no hay color ni ícono que distinga laboratorio de tratamiento de un vistazo | `03` | Carta con franja e ícono por categoría, texto anclado arriba y pie útil, probada con texto corto, medio y largo |
| C5 | Media | **Tinte rosa en cartas de riesgo.** Toda la carta se tiñe y lleva la etiqueta "ALTO RIESGO" antes de decidir: adelanta parte de la respuesta | `03` | Decisión tomada y aplicada: aviso antes (como hoy) o solo después |
| C6 | Media | **Mentores sin rostro.** Cargan el humor del juego y son iniciales en un círculo ("VZ", "MD") | `04`, Códex | Retratos de Navarro y Vázquez con 4 expresiones, usados en inicio, expediente, nota de error, botín y Códex |
| C7 | Media | **Inicio sin jerarquía ni emblema.** Solo texto; hasta cinco botones del mismo tamaño, todos inclinados | `01` | Emblema, un botón principal y modos secundarios subordinados |
| C8 | Baja | **Momentos clave sin ceremonia.** "Código Rojo" es un fondo rojo con texto; la calificación S aparece sin más | Partida | Animación breve en Código Rojo, calificación y perla, respetando movimiento reducido |
| C9 | Baja | **Sin identidad fuera de la app.** El manifiesto no trae capturas ni hay imagen para compartir | `vite.config.ts`, `index.html` | Ícono revisado, capturas en el manifiesto e imagen Open Graph |
| C10 | Baja | **Sin tema oscuro.** Fondo casi blanco en un juego que se usará de noche | — | Segunda paleta sobre los mismos tokens (opcional) |

### Decisión tomada: ilustraciones con IA, entregadas como sprites

Para C6 (y C7, C8) se generarán con IA y se integrarán como hojas de sprites. Para que salgan coherentes y ligeras:

- **Antes de generar:** cerrar C1 (dirección de arte). El estilo de las ilustraciones sale de ahí; generarlas antes obliga a repetirlas.
- **Personajes:** Dra. Navarro y Dr. Vázquez. Cuatro expresiones cada uno: neutral, contenta/o, molesta/o, alarmada/o. Mismo encuadre (busto), misma luz, fondo transparente.
- **Consistencia:** generar primero una hoja de personaje por mentor y usarla como referencia para cada expresión; fijar paleta (la de E2) y grosor de trazo en la instrucción. Revisar manos, estetoscopio y gafete, que es donde suelen fallar.
- **Formato:** una hoja por mentor en WebP con transparencia, cuadrícula 2×2 de 256 px por celda (512×512), más versión a 2× para pantallas densas. Peso objetivo: menos de 60 kB por hoja, para no inflar la caché sin conexión (hoy 735 KiB en total).
- **Integración:** componente único `MentorPortrait` (mentor, expresión, tamaño) que recorta la hoja con `background-position`; reemplaza las iniciales de `AvatarFeedback` y del Códex.
- **Otros sprites útiles:** íconos de categoría de carta (6), sello de calificación (S, A, B, C), emblema del inicio.
- **Licencia:** confirmar que la herramienta elegida permite uso comercial de lo generado y guardar las instrucciones usadas en el repositorio para poder regenerar.

---

## D. Contenido

Para revisar el contenido está `REVISION_CONTENIDO/revision_contenido.xlsx` (ver su `LEEME.md`).

| # | Gravedad | Deficiencia | Dato medido | Cerrado cuando |
|---|---|---|---|---|
| D1 | Alta | **Ningún médico ha revisado el contenido.** La única revisión (octubre) la hizo una IA sobre 237 cartas | `REVISION_CLINICA/` | Un médico firma al menos las cartas de riesgo letal y las preguntas del Shock Room |
| D2 | Alta | **Poca variedad real.** 599 casos son 72 familias; 34 familias tienen 15 variantes | 1 077 cartas distintas para 7 907 apariciones | Decisión sobre variantes (recortar a 6–8 o bajar su frecuencia) aplicada |
| D3 | Alta | **Cobertura desigual frente al ENARM.** Obstetricia 135 casos y Pediatría 132; Cardiología 4, Psiquiatría 4, Gastroenterología 3, Dermatología 5, Cirugía 23 | Conteo por prefijo de `case_id` | Meta de casos por especialidad definida y cumplida |
| D4 | Media | **Las preguntas del Shock Room nunca se auditaron.** 942 preguntas distintas (1 797 apariciones) | Hoja `Preguntas` | Todas con veredicto |
| D5 | Media | **La respuesta correcta delata por longitud.** En 163 de 942 preguntas la opción correcta es al menos 1.5 veces más larga que la incorrecta más larga | Alerta automática, hoja `Preguntas` | Opciones de longitud pareja en esas preguntas |
| D6 | Media | **Escenarios que nombran el diagnóstico.** 28 escenarios de llegada incluyen la palabra "diagnóstico" (p. ej. "Diagnóstico clínico de Corioamnionitis") | Alerta automática, hoja `Escenarios` | Revisados uno a uno; se reescriben los que regalan la respuesta |
| D7 | Media | **Tildes faltantes.** 100 filas con al menos una palabra sospechosa ("Diagnostico", "Sindrome", "Sintomas", "clinica", "cronico"…) | Alerta automática; 80 palabras | Corregidas sobre los valores de texto, sin tocar claves JSON |
| D8 | Media | **12 familias bajo 40 % de cartas de descarte** | Hoja `Familias`, columna Observaciones | Lote 7 de distractores |
| D9 | Media | **El selector ofrece 4 especialidades; hay 20 prefijos.** Infectología (50), Neurología (30), Bioestadística (15), Inglés (15) y otras solo salen en "Mixta" | `App.tsx` (chips), `manifest.js` | Agrupación decidida y visible, con número de casos por grupo |
| D10 | Baja | **Comentarios del mentor repetidos.** El de signos vitales estables aparece en cientos de casos | `PLAN_SIGUIENTES_PASOS.md` §3 | Variantes por especialidad |

---

## E. Jugabilidad y retención

| # | Gravedad | Deficiencia | Cerrado cuando |
|---|---|---|---|
| E1 | Media | Subir de rango no se anuncia; el rango solo se ve dentro del Diario | Aviso al subir y progreso visible en el inicio |
| E2 | Media | El único motivo diario para volver es la racha | Meta diaria y resumen semanal |
| E3 | Media | Las monedas no compran nada que el jugador desee (liga con A3) | Cosméticos (reversos de carta, sellos, fundas) que no alteran la dificultad |
| E4 | Media | El tutorial son tres láminas de texto que se saltan sin practicar el gesto | Tutorial con una carta de práctica |
| E5 | Baja | Sin simulacro ENARM (decidido en el roadmap, sin diseñar) | Modo cronometrado sin ayudas, con calificación por especialidad |
| E6 | Baja | Dificultad plana dentro del caso; balance de Favores (tope 5, revivir 3) sin probar en teléfono | Ajuste tras prueba en dispositivo |

---

## F. Producción y mantenimiento

| # | Gravedad | Deficiencia | Cerrado cuando |
|---|---|---|---|
| F1 | Alta | El progreso vive solo en el `localStorage` de un teléfono: cambiar de equipo o borrar datos lo pierde todo | Exportar e importar un archivo de progreso |
| F2 | Media | Sin pruebas de extremo a extremo; A1 pasó 126 tests unitarios sin detectarse | Guion Playwright (guardia ganada y perdida) en CI |
| F3 | Media | Despliegue sin verificar en dominio real ni en teléfonos | Prueba de instalación, juego sin conexión y CSP en Android e iOS |
| F4 | Media | Tipografías servidas por Google Fonts (dependencia externa y dato de privacidad) | Fuentes alojadas en la app |
| F5 | Media | Documentos desfasados: `ROADMAP.md` dice React 18 y describe tipos inexistentes; "Estado global: listo para producción" no se sostiene con A1–A3 | Roadmap corregido |
| F6 | Baja | `bd` (Beads) no está instalado en el entorno de los agentes pese a exigirlo `CLAUDE.md` | Instalado en el entorno o instrucción retirada |
| F7 | Baja | ESLint 9 sin soporte; migración pendiente a Tailwind 4 | Dependencias de desarrollo al día |
| F8 | Baja | `v1.0.0` sin etiqueta git; Sentry sin activar | Etiqueta tras cerrar el bloque A |
