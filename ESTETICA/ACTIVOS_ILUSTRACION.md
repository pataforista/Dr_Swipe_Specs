# Ilustraciones y sprites: qué generar y con qué datos

Ficha técnica para generar con IA todas las imágenes del juego. **No fija el estilo: eso lo decides tú.** Aquí está lo que cada imagen debe contener, a qué tamaño, en qué formato y dónde se usa, para que cualquier estilo que elijas encaje sin rehacer nada.

Donde veas `[ESTILO]`, va tu descripción de estilo, siempre la misma, palabra por palabra.

## 1. Lo que el estilo debe respetar

Son restricciones del juego, no de gusto. Cualquier estilo sirve si las cumple.

| Restricción | Motivo |
|---|---|
| Se reconoce a **40 px** de lado | El retrato del mentor junto a la nota de error mide 40 a 48 px |
| Fondo transparente | Las imágenes se colocan sobre papel claro y sobre hojas blancas |
| Contraste suficiente sobre fondo crema (`#FBF7EE`) y blanco | Un trazo muy claro desaparece |
| Sin texto dentro de la imagen | El texto lo pone el juego (tildes, traducciones, cambios) |
| Sin marcas, logotipos ni rostros de personas reales | Derechos y privacidad |
| Paleta limitada y repetida en todas las imágenes | Es lo que hace que parezcan del mismo juego |
| Nada de sangre explícita ni cuerpos de pacientes reales | Tono del juego: humor de guardia, respetuoso |
| La expresión se lee por cejas, ojos y boca, no por detalles finos | Lo fino se pierde al reducir |

## 2. Inventario

Prioridad 1 es lo mínimo para que el juego tenga rostro. La 2 completa la identidad. La 3 son extras que dan uso a las monedas.

### Prioridad 1 — 26 imágenes

| Grupo | Imágenes | Para qué |
|---|---|---|
| A. Mentores | 2 personajes × 6 expresiones = 12 | Inicio, expediente, nota de error, botín, derrota, Códex |
| B. Categorías de carta | 8 íconos | Franja superior de cada carta |
| C. Sellos de calificación | 4 (S, A, B, C) | Cierre de guardia |
| D. Emblema | 1 | Inicio e ícono de la app |
| E. Código Rojo | 1 | Entrada al Shock Room |

### Prioridad 2 — 26 imágenes

| Grupo | Imágenes | Para qué |
|---|---|---|
| F. Pacientes | 8 retratos genéricos | Expediente de cada caso |
| G. Rangos | 6 insignias | Diario, inicio, aviso al subir de rango |
| H. Recursos | 5 (moneda, favor, escudo, experiencia, vida) | HUD, botín, cierre |
| I. Objetos de botín | 7 | Premios de racha |
| J. Imágenes fuera de la app | Derivadas del emblema (no se generan aparte) | Instalación y compartir |

### Prioridad 3 — según se necesite

| Grupo | Imágenes | Para qué |
|---|---|---|
| K. Logros | 17 glifos, o 1 marco con dos estados | Códex |
| L. Penalizaciones y eventos | 4 + 21 | Avisos durante el triaje |
| M. Cosméticos | 6 reversos de carta, 4 fundas de libreta | Gasto de monedas |

## 3. Detalle por grupo

### A. Mentores

Dos personajes. Sus rasgos son tuyos; el juego solo exige que se distingan entre sí de un vistazo (silueta, cabello, lentes o no).

| Dato | Dra. Navarro | Dr. Vázquez |
|---|---|---|
| Papel | Adscrita; paciente y exigente | Adscrito; sarcástico y cálido |
| Voz en el juego | "Lea con calma y decida con criterio" | "Ahí viene mi interno favorito… hay mucho trabajo y poco café" |
| Elementos fijos | Bata, estetoscopio | Bata, algo que lo distinga (lentes, pluma, taza) |

Seis expresiones por personaje, cada una ligada a un momento del juego:

| # | Expresión | Cuándo aparece | Clave para que se lea |
|---|---|---|---|
| 1 | Neutral | Saludo del inicio, expediente | Mirada al frente, boca relajada |
| 2 | Contenta | Acierto, caso perfecto | Sonrisa, cejas arriba |
| 3 | Molesta | Error normal | Ceño fruncido, boca recta |
| 4 | Alarmada | Error letal, Código Rojo | Ojos muy abiertos, boca abierta |
| 5 | Orgullosa | Calificación S, logro, subir de rango | Sonrisa amplia, ojos cerrados o pulgar arriba |
| 6 | Apenada | Paciente perdido | Cejas caídas, mirada baja |

El código actual maneja las cuatro primeras (`neutral`, `happy`, `angry`, `shocked`); las dos últimas se añaden.

- **Encuadre:** busto (cabeza y hombros), de frente o tres cuartos, el mismo en las seis.
- **Alineación:** ojos a la misma altura y cabeza del mismo tamaño en todas las celdas; si no, el retrato "salta" al cambiar de expresión.
- **Margen:** 8 % libre en cada borde de la celda.
- **Entrega:** una hoja por mentor, cuadrícula 3×2, celda de 512 px (hoja de 1536×1024). Orden de celdas: fila 1 = neutral, contenta, molesta; fila 2 = alarmada, orgullosa, apenada.
- **Se exporta a:** 256 px por celda (uso normal) y 512 px (pantallas densas y expediente).

### B. Categorías de carta

Los casos traen hoy **238 rótulos de categoría distintos** ("meds", "Tratamiento", "Manejo Inicial", "labs", "Criterios Gibbs"…). Se agrupan en ocho, sin tocar el contenido:

| # | Grupo | Absorbe rótulos como | Objeto sugerido |
|---|---|---|---|
| 1 | Signos vitales | vitals, Signos Vitales | Monitor o pulso |
| 2 | Historia clínica | Anamnesis, Factor de Riesgo, Chief Complaint | Portapapeles |
| 3 | Exploración | Signo Clínico, Pruebas de Consultorio | Estetoscopio |
| 4 | Laboratorio | labs, Paraclínicos, Histología | Tubo o matraz |
| 5 | Imagen | imaging, Gabinete | Placa de rayos X |
| 6 | Diagnóstico | Diagnóstico, Diagnóstico Diferencial, Etiología, Fisiopatología | Lupa |
| 7 | Tratamiento | meds, Tratamiento, Manejo, Manejo Quirúrgico | Cápsula o jeringa |
| 8 | Prevención y seguimiento | Prevención, Tamizaje, Seguimiento, Salud Pública | Escudo o calendario |

- **Forma:** un objeto por ícono, silueta simple, sin fondo.
- **Color:** una sola tinta (blanco) si van sobre franja de color; así el color lo pone el juego.
- **Tamaño de uso:** 26 a 46 px. Deben distinguirse entre sí a 24 px.
- **Entrega:** SVG si tu herramienta lo permite; si no, PNG de 256 px cada uno. Si la IA no da resultados limpios a este tamaño, es el grupo que conviene dibujar a mano o tomar de una biblioteca de íconos.

### C. Sellos de calificación

- Cuatro sellos con el mismo marco: S, A, B, C. **La letra la pone el juego**; se genera el sello vacío (o cuatro variantes de marco, de más a menos ornamentado).
- Aspecto de sello de goma sobre papel. Un solo color.
- Tamaño de uso: 104 px. Entrega: 512 px, fondo transparente.

### D. Emblema

- Imagen única que identifica al juego: se usa en el inicio (a unos 120 px) y como ícono de la app.
- Debe funcionar dentro de un círculo: lo importante en el **80 % central** (Android recorta los bordes).
- Sin el texto "Dr. Swipe" dentro; el nombre lo pone la tipografía.
- Entrega: 1024×1024 con fondo transparente y otra versión con fondo de color pleno.

### E. Código Rojo

- Una ilustración de alarma (monitor, sirena, línea de ECG) para la pantalla de transición.
- Va sobre fondo rojo intenso: trazo claro o blanco.
- Tamaño de uso: hasta 240 px. Entrega: 768 px.
- La línea de ECG animada se hace por código; no hace falta generarla.

### F. Pacientes

Retratos genéricos por grupo de edad. El juego elige uno según el nombre y la edad del caso ("Carmen, 22 años"; "Lactante, 5 semanas").

| # | Grupo | # | Grupo |
|---|---|---|---|
| 1 | Recién nacido o lactante | 5 | Mujer adulta |
| 2 | Niña o niño | 6 | Hombre adulto |
| 3 | Adolescente | 7 | Mujer embarazada |
| 4 | Persona adulta joven | 8 | Persona adulta mayor |

- Expresión neutra o levemente enferma; sin signos explícitos de ninguna enfermedad (el mismo retrato sirve a muchos casos).
- Variedad de tonos de piel entre los ocho.
- Entrega: hoja 4×2, celda de 256 px.

### G. Rangos

Seis insignias que crecen en jerarquía, legibles a 48 px:

1. Estudiante de medicina · 2. Interno de guardia · 3. Médico residente · 4. Especialista · 5. Jefe de enseñanza · 6. Director médico

- Misma forma base, con más elementos en cada nivel (así la progresión se ve sin leer).
- Entrega: hoja 3×2, celda de 256 px.

### H. Recursos

Moneda, favor del adjunto, escudo, experiencia, vida. Íconos pequeños, de 16 a 24 px de uso: muy simples. Entrega: hoja 5×1, celda de 128 px.

### I. Objetos de botín

Siete objetos de guardia (los nombres exactos están en `dr-swipe/src/data/lore/rewardItems.json`). Uso a 48–64 px. Entrega: hoja 4×2, celda de 256 px.

### J. Imágenes fuera de la app (se derivan, no se generan)

| Archivo | Tamaño | Notas |
|---|---|---|
| Ícono | 192×192 y 512×512 | Del emblema con fondo |
| Ícono adaptable | 512×512 | Emblema dentro del 80 % central |
| Ícono de Apple | 180×180 | Sin transparencia |
| Favicon | SVG o 32×32 | Versión simplificada |
| Imagen para compartir | 1200×630 | Emblema, nombre y un mentor |
| Capturas para instalar | 1080×1920, de 3 a 5 | Se toman del juego terminado |

### K–M. Extras

- **Logros:** lo económico es un solo marco con dos estados (bloqueado, conseguido). Si quieres 17 glifos, los títulos están en `data/lore/achievements.json`.
- **Cosméticos:** reversos de carta a 640×900 (proporción de la carta); fundas de libreta a 780×1560.

## 4. Formato y peso

| Dato | Valor |
|---|---|
| Formato | WebP con transparencia; SVG para íconos |
| Tamaño maestro | El de cada grupo; guardar siempre el original sin comprimir |
| Peso por hoja | Menos de 80 kB a tamaño normal, menos de 200 kB la versión densa |
| Presupuesto total de prioridad 1 | Unos 400 kB (hoy todo el juego sin conexión pesa 735 kB) |
| Nombres | Minúsculas, sin tildes ni espacios: `mentor_navarro.webp`, `categorias.svg`, `sellos.webp` |
| Carpeta | `dr-swipe/src/assets/ilustracion/`, y los originales en `ESTETICA/originales/` |

Si el modelo no genera transparencia real, pide fondo de un color plano que no aparezca en el dibujo y se recorta después.

## 5. Animación

Lo recomendable es que las imágenes sean fijas y el movimiento lo ponga el código (caída del sello, giro de la nota, salto del retrato). Es más ligero y respeta el ajuste de "reducir movimiento".

Si quieres sprites animados de verdad:

| Dato | Valor |
|---|---|
| Qué animar | Parpadeo del mentor (2 cuadros), reacción al error letal (4 a 6 cuadros) |
| Cuadros | De 4 a 8 por animación |
| Velocidad | 12 cuadros por segundo |
| Disposición | Tira horizontal, celdas iguales, el personaje en la misma posición en todas |
| Riesgo | Mantener al personaje idéntico entre cuadros es lo que peor hacen los modelos de imagen; conviene probar primero con el parpadeo |

## 6. Cómo pedirlo a la IA

Plantilla (rellena lo que va entre corchetes):

> `[ESTILO]`. `[Qué es: p. ej. "Retrato de busto de una médica adscrita de unos 45 años, bata blanca y estetoscopio"]`. `[Expresión o variante]`. Encuadre centrado, cabeza y hombros, mirando al frente. Fondo transparente. Sin texto, sin logotipos. Contorno legible a tamaño pequeño.

Orden de trabajo:

1. Escribe tu `[ESTILO]` en dos o tres frases y no lo cambies más.
2. Genera **una** imagen de referencia de cada mentor (expresión neutral). No sigas hasta aprobarla.
3. Genera las otras cinco expresiones usando esa imagen como referencia, cambiando solo el rostro.
4. Reduce cada una a 40 px y mírala sobre fondo crema. Si no se entiende, repite.
5. Sigue con el resto en el orden del inventario.
6. Guarda cada instrucción, la herramienta y la semilla en `ESTETICA/prompts.md`.

## 7. Revisión antes de aceptar una imagen

- [ ] Se entiende a 40 px (o al tamaño mínimo de su grupo)
- [ ] Fondo transparente, sin halo blanco en los bordes
- [ ] Manos, estetoscopio y bata sin deformaciones
- [ ] Mismo personaje en todas sus expresiones (cabello, ropa, proporciones)
- [ ] Ojos a la misma altura en todas las celdas de la hoja
- [ ] Sin texto ni letras inventadas
- [ ] Paleta igual a la del resto
- [ ] La herramienta permite uso comercial y la instrucción quedó guardada
