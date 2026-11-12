# Plan para completar Dr. Swipe

Revisión del 2026-11-11 sobre `main` (`626dce9`). Solo diagnóstico y plan: no se cambió código.
Este documento ordena **todo** lo pendiente; `PLAN_CIERRE_PRODUCCION.md` y `PLAN_SIGUIENTES_PASOS.md` siguen valiendo para el detalle de sus temas.

## 1. Cómo se revisó

| Control | Resultado |
|---|---|
| `tools/validate_cases.py` | 599 casos válidos |
| `npm run lint`, `npm test`, `npm run build` | Limpios; 17 archivos, 126 tests; precache PWA 735 KiB |
| Partida real en Chromium, 390×780 | Guardia ganada (3 casos), guardia perdida (hasta "Error Crítico" y repaso) y recorrido de Ajustes, Códex y Diario. 0 errores de consola |
| Misma partida a 1280×800 | Jugable, con defectos de maquetación (§3, D9) |

Sin datos suficientes (no se pudo comprobar desde este entorno): comportamiento en teléfono real, sonido y vibración, instalación de la PWA, estado del despliegue en Cloudflare y la CSP en producción. `bd` (Beads) no está instalado en el contenedor, así que no se consultaron ni crearon tareas ahí.

## 2. Diagnóstico en una tabla

| Área | Hoy | Para considerarlo completo |
|---|---|---|
| Motor y reglas | Sólido y probado | Corregir el doble cobro (D1) y rehacer la economía (D2, D3) |
| Estética | Correcta y legible, pero tres estilos conviven y falta identidad | Un solo sistema visual, mentores con rostro, carta con anatomía propia (§4) |
| Contenido | 599 casos, pero solo 72 familias clínicas | Cobertura ENARM equilibrada y revisión por un médico (§5) |
| Retención | Racha, logros, repaso SM-2 | Motivos para volver: metas, simulacro, uso real de las monedas (§6) |
| Producción | Pipeline verde, versión 1.0.0 sin etiquetar | Despliegue verificado, prueba en teléfonos, pruebas E2E, respaldo del progreso (§7) |

El motor ya no es el cuello de botella. Lo que separa al juego de estar completo es, por este orden: dos defectos de economía, la identidad visual y la amplitud del contenido.

## 3. Fase 0 — Defectos encontrados al jugar (1 a 2 días)

Se arreglan antes que cualquier otra cosa; varios son visibles en la primera partida.

| # | Defecto | Evidencia | Corrección propuesta |
|---|---|---|---|
| D1 | **Probable doble cobro al pasar de caso.** Tras una guardia de 3 casos el Diario marca "RESUELTOS 5" | Reproducido dos veces. La guarda `rewardedCaseRef` (`App.tsx:236`) compara contra `currentCase.case_id`, que cambia al cargar el siguiente caso mientras el estado sigue en `reward`: el efecto vuelve a pagar XP y monedas y registra como resuelto el caso que aún no se juega. Mecanismo deducido del código, no aislado con un test | Guardar por índice de caso de la sesión (o pagar en la transición, no en un efecto). Test que juegue 3 casos y exija `cases_solved === 3` |
| D2 | **La escalera de rangos se agota en dos guardias.** Una guardia perfecta da 12 000 a 16 000 XP; el rango máximo ("Director Médico") pide 25 000 | Primera guardia: de "Estudiante" a "Jefe de Enseñanza" (penúltimo rango) | Rehacer la curva tras corregir D1: decidir cuántas guardias debe costar cada rango (propuesta: rango máximo ≈ 150 guardias) y derivar los umbrales de ahí |
| D3 | **Las monedas no tienen en qué gastarse.** Una guardia deja ~900 a 1 200; la pista cuesta 25 y deshacer cuesta poco | `PerformanceReview` y HUD | Bajar el ingreso o crear sumideros (§6). Sin esto la moneda no significa nada |
| D4 | Los avisos tapan títulos y se cortan con "…" | Inicio (tapa "Dr. Swipe"), botín (tapa el título), "Error Crítico" y debrief | Zona fija para avisos fuera del contenido, texto en dos líneas completas, y no encolar avisos al cambiar de pantalla |
| D5 | La nota de error del mentor se encima con el encabezado de la carta; ambos textos quedan ilegibles | Triaje, tras cualquier error | Fondo opaco y altura reservada, o mostrarla como hoja inferior |
| D6 | En el Shock Room la cinta decorativa tapa la etiqueta "FASE CRÍTICA"; las píldoras de combo y escudo montan el borde de la tarjeta | Móvil y escritorio | Mover la cinta al centro o quitarla en esta pantalla; dar sitio propio a las píldoras en el HUD |
| D7 | "Notas de la Guardia" (repaso de cartas) muestra la carta cortada a media altura | Guardia perdida → VER REPASO DE CARTAS | Revisar altura y desplazamiento del contenedor |
| D8 | Textos de relleno o incoherentes: "Guardia nocturna..." fijo al pie de cada carta; fila "TELEMETRÍA" vacía durante el triaje; "RACHA: 1 DÍAS"; "0 casos para repasar" seguido de "te lo volveremos a preguntar pronto"; puntaje negativo (−1000) en el HUD sin explicación | Triaje, inicio, cierre de guardia | Quitar o dar contenido real; singular/plural; mensaje distinto cuando no hay repaso |
| D9 | En escritorio la carta se encoge a ~200 px de ancho y el texto parte cada tres palabras | 1280×800 | Ancho mínimo de carta y tope de altura coherentes en pantallas anchas |
| D10 | Faltan tildes en perlas y cartas | 26 "Diagnostico", 15 "Sindrome", además de "pronostico", "Guia de Practica Clinica" | Corrección por lista de palabras sobre valores de texto (no claves JSON; ver error 46 en `ERRORES_Y_PREVENCION.md`) |
| D11 | El mentor de las notas de error se llama `mendoza` en código y aparece como "MD"; los diálogos son de Navarro y Vázquez | `App.tsx` → `AvatarFeedback` | Un solo elenco |

## 4. Fase 1 — Estética e identidad (la parte más visible; 1 a 2 semanas)

### 4.1 Qué se ve hoy

La base es buena: papel crema, verde quirúrgico, contraste AA, objetivos táctiles amplios. El problema no es de calidad sino de coherencia y de carácter.

- **Tres lenguajes visuales a la vez.** La libreta de papel con cinta washi (inicio, expediente, ajustes); el estilo "doodle" de contorno grueso y colores saturados (interruptores de Ajustes, tarjeta de jugador con un personaje de pelo azul); y un panel oscuro con botón azul marino en el cierre de guardia. Cada uno funciona solo. Juntos parecen tres aplicaciones.
- **Tipografía sin roles.** Fraunces (serif) se usa para títulos, pero también en cursiva para etiquetas de 11 px en versalitas, donde pierde legibilidad. Las opciones del Shock Room van en serif negrita y las cartas en sans: la misma jerarquía, dos voces.
- **La carta, que es el juego, está vacía.** Un rectángulo blanco con el texto centrado y mucho aire muerto. La categoría ("Manejo", "Exploración") es un chip pequeño; no hay color, ícono grande ni ilustración que distinga un laboratorio de un tratamiento de un vistazo. Las cartas de riesgo se tiñen de rosa completo, lo que además adelanta parte de la respuesta.
- **Sin rostro.** No hay logotipo ni ilustración en el inicio. Los mentores, que cargan todo el humor del juego, son un par de iniciales ("VZ", "MD").
- **Inicio plano.** Hasta cinco botones del mismo tamaño y peso, todos inclinados; la mirada no sabe dónde caer.
- **Momentos clave sin ceremonia.** "Código Rojo" es un fondo rojo con texto; el botín y la calificación S son correctos pero no se sienten ganados.
- **Sonido.** Todo es síntesis por osciladores, sin ambiente ni música. Insufficient data sobre cómo suena en un teléfono real.

### 4.2 Trabajo propuesto

| # | Tarea | Entregable |
|---|---|---|
| E1 | **Elegir una dirección de arte y escribirla.** Recomiendo quedarse con la "libreta de guardia" (papel, tinta, sellos, cinta, clips) y subordinar lo demás | Hoja de estilo de una página: paleta, tipografías, radios, sombras, trazo de íconos, qué adornos se permiten y cuáles no |
| E2 | **Tokens únicos.** Los colores ya viven en `index.css`, pero hay cientos de clases `slate-*`, `rose-*`, `emerald-*` sueltas en los componentes | Colores semánticos (acierto, error, letal, moneda, XP, favor) en Tailwind y sustitución en componentes |
| E3 | **Roles tipográficos.** Fraunces solo para títulos y números grandes; Outfit para todo texto de lectura, etiquetas y opciones | Escala de 5 o 6 tamaños; fuera la cursiva serif en etiquetas pequeñas |
| E4 | **Rediseñar la carta.** Franja de color e ícono grande por categoría (historia, exploración, laboratorio, imagen, manejo, diagnóstico), texto alineado arriba con tamaño según longitud, pie útil (paciente y número de carta) | Anatomía de carta en 3 longitudes de texto; decidir si el riesgo letal se señala antes o solo después de decidir |
| E5 | **Ilustraciones y sprites generados con IA.** El estilo lo decide el dueño; el juego fija contenido, tamaños y formato | Hojas de sprites según `ESTETICA/ACTIVOS_ILUSTRACION.md` (resumen en §4.3) |
| E6 | **Pantalla de inicio.** Logotipo o emblema, un botón principal, los modos secundarios más pequeños, racha y repaso pendiente como tarjetas de estado | Maqueta y componente |
| E7 | **HUD.** Menos etiquetas y más lectura: salud y tiempo como protagonistas, puntaje y créditos secundarios, sitio fijo para combo y escudo; la fila de signos vitales solo cuando tenga datos | Maqueta a 390 px con el peor caso (combo ≥ 12, escudo, 4 dígitos) |
| E8 | **Unificar o retirar el estilo doodle.** Redibujar interruptores y tarjeta de jugador en el estilo de E1, o eliminarlos | `DoodleToggle`, `DoodlePlayerCard` |
| E9 | **Cierre de guardia en el mismo estilo.** Hoja de papel con sello de calificación en lugar del panel oscuro | `PerformanceReview` |
| E10 | **Ceremonia en los momentos clave.** Entrada del Código Rojo (monitor, línea de ECG), sello que cae al calificar, perla que se "pega" en la libreta, paciente estabilizado | Animaciones cortas que respeten movimiento reducido |
| E11 | **Sonido y música.** Revisar los efectos en teléfono y añadir música ambiente tenue, apagable. La música es el único factor de diseño con efecto significativo sobre el disfrute en el metaanálisis disponible | Pista ambiente y prueba en dispositivo |
| E12 | **Identidad fuera de la app.** Ícono, pantalla de arranque, capturas en el manifiesto (mejoran el diálogo de instalación), imagen para compartir (Open Graph) | Recursos en `public/` |
| E13 | **Tema nocturno** (opcional). Una guardia nocturna con pantalla blanca cansa; el papel admite una versión oscura | Segunda paleta con los mismos tokens de E2 |

Orden dentro de la fase: E1 → E2 y E3 → E4 y E5 (lo que más cambia la percepción) → E6 a E10 → E11 a E13.

### 4.3 Ilustraciones y sprites: qué hay que generar

El estilo es decisión tuya. Lo que sigue es lo que el juego necesita, sea cual sea el estilo; el detalle (encuadres, expresiones, alineación, plantilla de instrucción y lista de revisión) está en `ESTETICA/ACTIVOS_ILUSTRACION.md`.

Condiciones que cualquier estilo debe cumplir: reconocerse a 40 px, fondo transparente, contraste sobre fondo crema y blanco, sin texto dentro de la imagen, paleta limitada y repetida, sin rostros de personas reales.

| Prioridad | Grupo | Cantidad | Entrega | Tamaño de uso |
|---|---|---|---|---|
| 1 | Mentores (Navarro y Vázquez) | 2 × 6 expresiones: neutral, contenta, molesta, alarmada, orgullosa, apenada | Hoja 3×2 por mentor, celda de 512 px | 40 a 160 px |
| 1 | Categorías de carta | 8 íconos (los 238 rótulos actuales se agrupan en 8) | SVG o PNG de 256 px, una tinta | 26 a 46 px |
| 1 | Sellos de calificación | 4 marcos (la letra la pone el juego) | 512 px | 104 px |
| 1 | Emblema | 1, con lo importante en el 80 % central | 1024 px, con y sin fondo | 120 px e ícono |
| 1 | Código Rojo | 1, trazo claro sobre rojo | 768 px | 240 px |
| 2 | Pacientes genéricos | 8 por grupo de edad | Hoja 4×2, celda de 256 px | 64 a 96 px |
| 2 | Insignias de rango | 6 | Hoja 3×2, celda de 256 px | 48 px |
| 2 | Recursos (moneda, favor, escudo, experiencia, vida) | 5 | Hoja 5×1, celda de 128 px | 16 a 24 px |
| 2 | Objetos de botín | 7 | Hoja 4×2, celda de 256 px | 48 a 64 px |
| 3 | Logros, eventos, cosméticos | Según se necesite | — | — |

- **Formato:** WebP con transparencia; menos de 80 kB por hoja. Presupuesto de la prioridad 1: unos 400 kB.
- **Animación:** imágenes fijas y movimiento por código. Sprites animados solo si se quiere (4 a 8 cuadros, 12 por segundo, tira horizontal), empezando por un parpadeo de prueba.
- **Método:** una imagen de referencia aprobada por mentor antes de generar sus expresiones; misma instrucción de estilo en todo; guardar instrucciones y semillas.

## 5. Fase 2 — Contenido (en paralelo; es lo más largo)

| # | Pendiente | Dato |
|---|---|---|
| C1 | **Poca variedad real.** 599 casos son 72 familias; 34 familias tienen 15 variantes que comparten ~91 % de sus cartas | Reducir a 6 u 8 variantes por familia con pacientes distintos, o aceptar la repetición y bajar su frecuencia en la selección |
| C2 | **Cobertura desigual frente al ENARM.** Obstetricia 135 y Pediatría 132; Cardiología 4, Psiquiatría 4, Gastro 3, Cirugía 23, Dermatología 5 | Meta por especialidad y lista de familias nuevas priorizadas por peso en el examen |
| C3 | El selector ofrece 4 especialidades; hay casos de 20 prefijos (incluidos Estadística e Inglés, 15 cada uno) que solo salen en "Mixta" | Decidir agrupación y mostrar cuántos casos hay por grupo |
| C4 | Revisión por un médico humano: las dos cartas con matiz (DIU en mola, sulfato de magnesio posparto) y las filas "Parcial"; roséola y umbral de SatO₂ siguen abiertos | `REVISION_CLINICA/` |
| C5 | Las 1 797 preguntas del Shock Room nunca se auditaron con fuentes | Mismo método que las cartas |
| C6 | Comentarios del mentor repetidos (≈ 813 únicos para ≈ 7 900 cartas) | Variantes por especialidad |
| C7 | 12 familias siguen bajo 40 % de cartas de descarte | Lote 7 de distractores |
| C8 | Cartas "aceptar" que repiten el escenario y se aciertan sin pensar | Criterio de detección y reescritura |

## 6. Fase 3 — Jugabilidad y motivos para volver

| # | Pendiente | Nota |
|---|---|---|
| J1 | Economía completa: XP, rangos, monedas y Favores con una tabla de ingresos y gastos por guardia | Depende de D1 a D3 |
| J2 | Dar uso a las monedas: cosméticos (reversos de carta, sellos, fundas de libreta), que no afecten la dificultad | Mantiene ADR 004 (sin pagar para ganar) |
| J3 | Rangos visibles: aviso al subir de rango y progreso en el inicio | Hoy solo se ve dentro del Diario |
| J4 | Meta diaria y resumen semanal | La racha sola es poco |
| J5 | Simulacro ENARM (sin ayudas, bloque cronometrado, calificación por especialidad) | Decidido en el roadmap, sin diseñar |
| J6 | Dificultad adaptativa dentro del caso | Pendiente desde octubre |
| J7 | Balance de Favores (tope 5, revivir cuesta 3) | Requiere jugar en teléfono |
| J8 | Tutorial jugable: una carta de práctica en lugar de tres láminas de texto | Las láminas actuales se saltan sin leer |

### 6.1 Lo que añade la evidencia

Resumen de `DISENO_BASADO_EN_EVIDENCIA.md` (17 fuentes, la mayoría revisiones sistemáticas y metaanálisis; leídas por resumen, no completas).

- **Divertido:** en juegos móviles el disfrute se asocia con facilidad de uso, novedad y estética; el reto pesa poco. En el único metaanálisis de decisiones de diseño, solo la música mostró efecto significativo.
- **Educativo:** los juegos enseñan algo mejor que la instrucción convencional (d ≈ 0.3), y los elementos pensados para aprender el contenido rinden más que los pensados para la experiencia de juego. Retroalimentación inmediata, evocación y repetición espaciada son lo mejor respaldado.
- **Sin datos suficientes:** presión de tiempo, mecánica de deslizar, efecto de monedas y cosméticos sobre el aprendizaje.

Tareas nuevas y cambios de prioridad:

| # | Tarea | Prioridad |
|---|---|---|
| V1 | Explicación legible en cada error y una línea de porqué al acertar una carta crítica | Máxima (junto con la Fase 0) |
| V2 | Repaso espaciado en primer plano: botón principal cuando hay casos vencidos; el cierre dice cuándo vuelve cada caso | Alta, antes que J2 y J5 |
| V3 | "Temas para leer hoy" al cerrar la guardia, con la guía citada | Media, bajo costo |
| V4 | Medir en el dispositivo el acierto por especialidad a lo largo del tiempo y mostrarlo | Media |
| V5 | Música ambiente opcional (E11) | Media |
| — | J2 (cosméticos) y J6 (dificultad adaptativa) bajan al final | Baja |

## 7. Fase 4 — Producción y mantenimiento

| # | Pendiente |
|---|---|
| P1 | Confirmar el despliegue de `main` en Cloudflare Pages y probar en el dominio real: instalación en Android e iOS, juego sin conexión, CSP |
| P2 | Pruebas E2E con Playwright en CI. El guion usado en esta revisión (guardia ganada y perdida a 390 px) sirve de base; habría detectado D1 |
| P3 | Respaldo del progreso: exportar e importar un archivo. Hoy todo vive en el `localStorage` de un solo teléfono |
| P4 | Alojar las tipografías en la propia app (privacidad, y arranque sin conexión sin depender de Google Fonts) |
| P5 | Activar Sentry (`SENTRY_DSN`) si se quiere, y etiquetar `v1.0.0` después de la Fase 0 |
| P6 | Documentos al día: `ROADMAP.md` aún dice React 18 y describe tipos que no existen; `PLAN_SIGUIENTES_PASOS.md` mezcla hecho y pendiente |
| P7 | Dependencias de desarrollo (ESLint 9 sin soporte, migración a Tailwind 4) |
| P8 | Instalar `bd` en el entorno de los agentes o retirar la instrucción de `CLAUDE.md`; pasar estas tareas a Beads |

## 8. Orden recomendado

1. **Fase 0** completa (D1 a D11) y V1. Sin D1 y D2 no conviene publicar.
2. **Fase 1**, E1 a E5: dirección de arte, tokens, tipografía, carta y mentores.
3. P1, P2 y etiqueta `v1.0.0`: primera versión pública.
4. Resto de la Fase 1, V2 a V5 y J1, J3, J4.
5. Contenido (Fase 2) de forma continua desde el paso 2; C4 antes de cualquier difusión amplia.
6. J5, J7, J8, P3 a P8; al final J2 y J6.

## 9. Decisiones

Tomadas el 2026-11-11:

- **Ilustraciones:** se generan con IA y se integran como hojas de sprites. **El estilo lo decide el dueño.** Ficha técnica en `ESTETICA/ACTIVOS_ILUSTRACION.md` (§4.3).
- **Ritmo de progresión:** el rango máximo cuesta unas 150 guardias (`DEFICIENCIAS.md`, A2).

Pendientes:

1. **Estilo:** lo define el dueño; `ESTETICA/GUIA_ESTETICA.md` y su maqueta quedan como una opción de referencia, no como decisión. Mientras no esté escrito, no conviene generar sprites.
2. **Riesgo letal en la carta:** ¿se avisa antes de decidir (como hoy) o solo después? Cambia la dificultad.
3. **Contenido:** ¿recortar variantes repetidas o conservarlas? ¿Qué especialidades se amplían primero?
4. **Revisión médica:** ¿quién revisa? El material está en `REVISION_CONTENIDO/`.

## 10. Documentos relacionados

- `ESTETICA/ACTIVOS_ILUSTRACION.md`: qué ilustraciones y sprites generar, con tamaños, formato y método (sin fijar estilo).
- `ESTETICA/GUIA_ESTETICA.md`: una opción de estilo, con maqueta (`ESTETICA/maqueta.png`). Referencia, no decisión.
- `DISENO_BASADO_EN_EVIDENCIA.md`: qué hace divertido y qué hace educativo a un juego casual, con fuentes.
- `DEFICIENCIAS.md`: detalle de cada deficiencia, con evidencia y criterio de cierre.
- `REVISION_CONTENIDO/`: libro para revisar todo el contenido sin repeticiones.
