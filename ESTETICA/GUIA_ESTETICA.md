# Guía estética de Dr. Swipe

Propuesta del 2026-11-12. Convierte el bloque C de `DEFICIENCIAS.md` en decisiones concretas: qué estilo, con qué colores y letras, cómo se ve cada pantalla y qué ilustraciones hacen falta. **Es una propuesta: nada de esto está en el juego todavía.**

| Archivo | Qué es |
|---|---|
| `antes.png` | Cuatro pantallas del juego actual (inicio, carta, nota de error, cierre) |
| `maqueta.png` | Las mismas cuatro pantallas con la propuesta |
| `maqueta.html` | La maqueta, editable; se abre en cualquier navegador |

La maqueta es estática y sus retratos son marcadores de posición. Las cifras del cierre de guardia son de ejemplo, con la economía ya corregida.

## 1. Dirección de arte: «Libreta de guardia»

El juego es el cuaderno de bolsillo de un interno: papel rayado con margen rojo, tinta azul oscuro, fichas de cartón, sellos de goma, notas adhesivas y cinta. Todo lo que aparece en pantalla debe poder existir en ese cuaderno.

**Por qué esta y no otra.** Ya domina la mayoría de las pantallas, casa con el tono de los mentores y distingue al juego de las apps de estudio, que casi todas parecen tableros.

| Se permite | No se permite |
|---|---|
| Contorno de tinta de 1.5 px en todo lo interactivo | Vidrio esmerilado, degradados, brillos |
| Sombra dura y corta (el elemento "apoyado" en el papel) | Sombras difusas grandes |
| Un adorno por pantalla (cinta, sello o nota adhesiva) | Cinta en cada tarjeta |
| Inclinación solo en adornos (sello, nota, píldora de racha) | Botones inclinados |
| Color pleno solo en la franja de la carta y el botón principal | Teñir la carta entera |

Se retiran el estilo "doodle" (interruptores de Ajustes, tarjeta de jugador con personaje de pelo azul) y el panel oscuro del cierre de guardia.

## 2. Color

Cada color tiene un solo significado. Los componentes usan el nombre, nunca el valor.

| Nombre | Valor | Uso |
|---|---|---|
| `papel` | `#FBF7EE` | Fondo |
| `hoja` | `#FFFEFA` | Tarjetas, fichas, hojas |
| `tinta` | `#1F2A37` | Texto, contornos |
| `tinta-suave` | `#5B6675` | Etiquetas, texto secundario (6.0:1 sobre papel) |
| `linea` | `#E6DFD0` | Renglones, separadores |
| `verde` | `#0F766E` | Acción principal, marca |
| `acierto` | `#15803D` | Aceptar, salud alta |
| `error` | `#BE123C` | Descartar, salud baja |
| `letal` | `#9F1239` | Solo error letal |
| `moneda` | `#B45309` | Monedas |
| `xp` | `#7C3AED` | Experiencia y rango |
| `sello` | `#B91C1C` | Sello de calificación |

Categorías de carta (franja superior, texto blanco, todas ≥ 4.5:1):

| Categoría | Valor | Ícono |
|---|---|---|
| Historia clínica | `#B45309` | Portapapeles |
| Exploración | `#0F766E` | Estetoscopio |
| Laboratorio | `#6D28D9` | Matraz |
| Imagen | `#1D4ED8` | Radiografía |
| Manejo | `#15803D` | Cápsula |
| Diagnóstico | `#BE123C` | Lupa |

Las ~25 categorías que hoy traen los casos ("meds", "Tratamiento", "Signos Vitales"…) se agrupan en estas seis con una tabla de equivalencias; el contenido no se toca.

## 3. Tipografía

| Rol | Fuente | Tamaño / peso | Dónde |
|---|---|---|---|
| Emblema | Fraunces 900 | 54 px | Solo "Dr. Swipe" |
| Título | Fraunces 900 | 34 / 22 px | Títulos de pantalla y de hoja |
| Cifra | Fraunces 900 | 22 px | Reloj, puntajes, totales |
| Carta | Outfit 600 | 22 px (20 y 18 según longitud) | Texto de la carta |
| Lectura | Outfit 400 | 15 px | Explicaciones, diálogos, opciones |
| Etiqueta | Outfit 600, versalitas, espaciado 0.14em | 11 px | Rótulos |
| Botón | Outfit 800, mayúsculas | 16 / 13 px | Botones |

Fraunces deja de usarse en cursiva y en tamaños menores de 20 px. Las opciones del Shock Room pasan a Outfit. Ambas fuentes se alojan en la app (hoy vienen de Google Fonts).

## 4. Piezas

- **Botón principal:** verde pleno, radio 14 px, sombra dura inferior de 4 px, sin inclinación. Uno por pantalla.
- **Botón secundario:** hoja con contorno de tinta y sombra dura de 3 px.
- **Ficha de estado:** hoja con contorno, etiqueta arriba y cifra en Fraunces.
- **Carta:** franja de categoría con ícono de 46 px y contador; cuerpo rayado con texto anclado arriba; pie con paciente y motivo. Las dos cartas siguientes asoman giradas en tono cartón.
- **Hoja inferior:** para la nota de error y la pausa; opaca, sube desde abajo sobre un velo.
- **Sello:** círculo de doble línea, girado −12°, con la calificación.
- **Nota adhesiva:** amarillo pálido, girada −1°, para la perla.
- **Aviso:** franja fija bajo el HUD, dos líneas completas; nunca sobre un título.

## 5. Pantalla por pantalla

| Pantalla | Hoy | Propuesta |
|---|---|---|
| Inicio | Texto centrado, hasta 5 botones iguales e inclinados | Emblema, mentor con retrato, fichas de racha y repaso, un botón principal y dos secundarios, navegación inferior |
| Expediente | Hoja con cinta y texto en cursiva | Ficha de ingreso: nombre, edad, motivo, signos; retrato del mentor que comenta |
| Carta | Rectángulo blanco, texto centrado, tinte rosa en riesgo | Franja e ícono por categoría, texto arriba, pie útil; sin tinte |
| HUD | 5 rótulos y una fila "TELEMETRÍA" vacía | Salud y reloj protagonistas; puntaje secundario; racha en píldora propia |
| Nota de error | Globo translúcido encimado con la carta | Hoja inferior: quién habla, costo, carta, acción correcta, porqué |
| Código Rojo | Fondo rojo con texto | Línea de ECG que se acelera, sello "CÓDIGO ROJO" que cae |
| Shock Room | Opciones en serif, cinta que tapa el rótulo | Opciones en Outfit, reloj grande, rótulo despejado |
| Botín | Hoja con aviso que tapa el título | Renglones de recompensa y perla como nota adhesiva |
| Cierre | Panel oscuro, botón azul marino | Hoja de libreta con sello, renglones y barra de rango |
| Derrota | Hoja con ícono | Misma hoja inferior de la nota de error, con retrato alarmado |
| Diario / Códex | Tarjeta "doodle" con personaje | Páginas de libreta: rango, estadísticas, perlas como notas, logros como sellos |
| Ajustes | Interruptores "doodle" | Interruptores planos con contorno de tinta |

## 6. Ilustraciones: sprites generados con IA

### Qué generar

| Hoja | Contenido | Celdas | Tamaño |
|---|---|---|---|
| `mentor_navarro.webp` | Neutral, contenta, molesta, alarmada | 2×2 | 512×512 (y 1024×1024) |
| `mentor_vazquez.webp` | Neutral, contento, molesto, alarmado | 2×2 | 512×512 (y 1024×1024) |
| `categorias.svg` | Seis íconos de categoría | — | Vectorial; mejor dibujados que generados |
| `sellos.webp` | S, A, B, C y "CÓDIGO ROJO" | 3×2 | 768×512 |
| `emblema.webp` | Emblema del inicio e ícono de la app | 1 | 512×512 |

Peso objetivo: menos de 60 kB por hoja de 512 px. Fondo transparente.

### Cómo mantener la coherencia

1. Generar primero **una** imagen de referencia por mentor, de frente, expresión neutral. Aprobarla antes de seguir.
2. Generar las otras tres expresiones con esa imagen como referencia, cambiando solo cejas, ojos y boca.
3. Misma instrucción de estilo en todas, palabra por palabra.
4. Revisar a 64 px, que es el tamaño real en la nota de error: si la expresión no se distingue ahí, no sirve.
5. Guardar instrucciones y semillas en `ESTETICA/prompts.md` para poder regenerar.

### Instrucción de estilo (común a todas)

> Ilustración plana de busto, contorno de tinta azul oscuro (#1F2A37) de grosor uniforme, colores planos sin degradados ni sombreado, paleta limitada a crema, verde azulado (#0F766E), ocre y rosa apagado; estilo de dibujo a pluma en libreta de médico; fondo transparente; encuadre centrado, cabeza y hombros; sin texto.

### Personajes

- **Dra. Navarro:** adscrita de unos 45 años, cabello oscuro recogido, bata blanca, estetoscopio al cuello, mirada serena. Tono: paciente y exigente.
- **Dr. Vázquez:** adscrito de unos 60 años, canoso, lentes, bata con pluma en el bolsillo. Tono: sarcástico y cálido.

Los rasgos son propuesta mía a partir de sus diálogos; ajústalos si los imaginas distintos.

### Antes de usar las imágenes

- Confirmar que la herramienta permite uso comercial de lo generado.
- Revisar manos, estetoscopio y gafete, donde estos modelos suelen fallar.
- No generar ningún personaje con el rostro de una persona real.

## 7. Movimiento y sonido

| Momento | Movimiento | Duración |
|---|---|---|
| Acierto | La carta sale con impulso; el número de racha da un pequeño salto | 250 ms |
| Error | Sacudida corta de la pila; sube la hoja inferior | 300 ms |
| Código Rojo | Línea de ECG que se acelera; cae el sello | 900 ms |
| Calificación | El sello cae y deja la marca con un leve rebote | 500 ms |
| Perla nueva | La nota adhesiva se pega con un giro | 400 ms |
| Subir de rango | La barra se llena y cambia el rótulo | 700 ms |

Todo respeta "reducir movimiento" (ya implementado). Sobre el sonido: sin datos suficientes; hay que oírlo en un teléfono antes de decidir.

## 8. Orden de trabajo

1. Aprobar esta dirección (o pedir cambios sobre la maqueta).
2. Colores y tipografía como nombres en Tailwind; sustituir las clases sueltas.
3. Carta y HUD.
4. Hoja inferior de error y avisos.
5. Generar y aprobar los sprites de mentores; integrarlos.
6. Inicio y cierre de guardia.
7. Diario, Códex y Ajustes.
8. Animaciones de los momentos clave.
9. Emblema, ícono e imágenes para la instalación.

Cada paso se comprueba con capturas a 390×780 y a 1280×800, y con la revisión automática de contraste.

## 9. Lo que necesito que decidas

1. ¿Apruebas «Libreta de guardia» tal como se ve en `maqueta.png`?
2. ¿La carta deja de avisar el riesgo letal antes de decidir? La maqueta lo quita.
3. ¿Los rasgos propuestos para Navarro y Vázquez te parecen bien?
4. ¿Qué herramienta de IA usarás para las imágenes? De eso depende el formato exacto de las instrucciones.
