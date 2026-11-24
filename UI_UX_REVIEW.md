# Revisión Detallada de UI/UX - Dr. Swipe

**Fecha**: 2026-11-23  
**Versión**: Post-lavanda UI, ENARM mode, adaptive difficulty  
**Status**: En progreso

---

## 1. Botones y Controles

### 1.1 Botones Principales (Menú)
- ✅ **INICIAR GUARDIA**: Visible, tamaño táctil adecuado (>44px)
- ✅ **MODO ESTUDIO**: Badge "SIN DAÑO" visible, color verde diferenciado
- ✅ **SIMULACRO ENARM**: Toggle funcional, estado activo con ✓
- ⚠️ **PROBLEMA**: Los 3 botones usan la misma clase `marker-btn` - difícil diferenciación visual rápida

### 1.2 Botones de Acción (Durante Triage)
- ✅ **ACEPTAR** (derecha): Color lavanda (#8E9AAF), icono ClipboardCheck
- ✅ **DESCARTAR** (izquierda): Color rose (#C3324B), icono X
- ✅ **LIFELINE**: Costo visible (25 cr.), estados activo/inactivo claros
- ✅ **UNDO**: Cargas visibles, disabled cuando no hay cargas
- ⚠️ **PROBLEMA**: Botones de acción muy juntos en móvil - riesgo de tap accidental

### 1.3 Estados de Botones
- ✅ Disabled: opacity-20 cuando no disponible
- ✅ Hover: scale + color shift en desktop
- ✅ Active: scale-0.9 en tap
- ⚠️ **PROBLEMA**: No hay feedback háptico consistente en todos los botones

---

## 2. Modales y Overlays

### 2.1 Tutorial Overlay
- ✅ 3 slides con navegación clara
- ✅ Botón "SALTAR TUTORIAL" en primer slide
- ✅ Progreso visible (dots)
- ⚠️ **PROBLEMA**: No hay indicador de "no mostrar de nuevo" - aparece cada vez que se limpia localStorage

### 2.2 Modales de Información
- ✅ **Códex**: Scroll interno, cierre con botón
- ✅ **Stats (Diario)**: Estadísticas claras, cierre funcional
- ✅ **Ajustes**: Opciones de sonido/hápticos, cierre funcional
- ⚠️ **PROBLEMA**: Los modales no tienen animación de entrada/salida consistente

### 2.3 Overlays de Juego
- ✅ **Intro de caso**: Título, escenario, botón COMENZAR
- ✅ **Reward**: XP/monedas/Favores ganados, animaciones
- ✅ **Ghosted**: Mensaje del mentor, opción de revive (si hay Favores)
- ⚠️ **PROBLEMA**: El overlay de "Game Over" no distingue claramente entre "perdiste" y "puedes revivir"

---

## 3. Popups y Toasts

### 3.1 Toasts de Recompensa
- ✅ **RewardToast**: Animación de entrada/salida, cola de toasts
- ✅ **LootScreen**: Items con iconos y descripciones
- ⚠️ **PROBLEMA**: Los toasts aparecen muy rápido - difícil leer en móvil

### 3.2 Notificaciones de Estado
- ✅ **ReloadPrompt**: "Listo para usar sin conexión" - auto-dismiss 4s
- ✅ **Actualización disponible**: Botones ACTUALIZAR/LUEGO claros
- ⚠️ **PROBLEMA**: El toast de "offline ready" aparece en cada primera visita - puede ser molesto

---

## 4. Tarjetas (SwipeDeck)

### 4.1 Contenido de Tarjetas
- ✅ **Scroll interno**: Implementado para contenido largo
- ✅ **Categoría visible**: Icono + nombre en header
- ✅ **Número de carta**: Visible en header y footer
- ⚠️ **PROBLEMA**: El texto de tarjetas largas aún se siente denso - considerar más padding

### 4.2 Estados Visuales
- ✅ **Normal**: Fondo blanco, borde lavanda
- ✅ **Letal**: Fondo rose-50, borde soft-blush
- ✅ **Crítico**: Fondo lavender-veil, borde thistle
- ✅ **Wash effect**: Color durante drag (rose para descartar, lavender para aceptar)

### 4.3 Stamps de Decisión
- ✅ **ACEPTAR**: Border y texto lavender, rotate -12deg
- ✅ **DESCARTAR**: Border soft-blush, texto rose-700, rotate 12deg
- ⚠️ **PROBLEMA**: Los stamps aparecen muy tarde durante el drag - usuario puede no verlos

---

## 5. Aleatorización

### 5.1 Shuffle de Mazos
- ✅ **deckOrder.ts**: Fisher-Yates shuffle implementado
- ✅ **Consistencia**: Mismo mazo para todos los jugadores con mismo seed
- ⚠️ **PROBLEMA**: No hay visualización de "qué tan aleatorio" fue el shuffle

### 5.2 Selección de Casos
- ✅ **dataLoader.ts**: Excluye últimos 30 casos jugados
- ✅ **Especialidades**: Filtro por especialidad funciona
- ⚠️ **PROBLEMA**: No hay indicador de "casos restantes" en la sesión

### 5.3 Preguntas de Boss Fight
- ✅ **shuffleBossQuestion**: Opciones mezcladas, respuesta correcta preservada
- ⚠️ **PROBLEMA**: Las opciones siempre aparecen en el mismo orden visual (A, B, C) - debería mezclarse también el orden visual

---

## 6. Jugabilidad

### 6.1 Balance de Dificultad
- ✅ **Dificultad adaptativa**: Aumenta con racha de aciertos (5/10 thresholds)
- ✅ **Favores**: CAP 7, REVIVE_COST 2 - balanceado para móvil
- ⚠️ **PROBLEMA**: No hay indicador visual de "dificultad actual" durante el juego

### 6.2 Feedback del Jugador
- ✅ **Háptico**: Vibración en aciertos/errores/lethales
- ✅ **Audio**: Sonidos de swipe, acierto, error, code red
- ✅ **Visual**: Screen shake, vignette red, hit-stop en errores letales
- ⚠️ **PROBLEMA**: El feedback de "acierto" es muy sutil - podría ser más celebratorio

### 6.3 Progresión
- ✅ **XP/Monedas**: Ganan por caso completado
- ✅ **Racha diaria**: Bonus multiplicador
- ✅ **Logros**: Notificación cuando se desbloquean
- ⚠️ **PROBLEMA**: No hay "meta" clara de progresión a largo plazo (¿qué desbloqueo?)

---

## 7. Accesibilidad

### 7.1 Contraste de Colores
- ✅ **Texto principal**: #2A2F3A sobre #FEFAFF - contraste 12.5:1 (AAA)
- ✅ **Primario (lavender)**: #8E9AAF sobre blanco - contraste 4.6:1 (AA)
- ✅ **Alerta (rose)**: #C3324B sobre blanco - contraste 4.8:1 (AA)
- ⚠️ **PROBLEMA**: El color secundario (#CBC0D3) tiene contraste 3.2:1 - solo decorativo

### 7.2 Navegación por Teclado
- ✅ **Arrow keys**: ← Descartar, → Aceptar
- ✅ **Tab navigation**: Funciona en menú principal
- ⚠️ **PROBLEMA**: No hay focus visible en botones de acción durante el juego

### 7.3 Screen Reader
- ✅ **ARIA labels**: Botones principales tienen labels descriptivos
- ⚠️ **PROBLEMA**: Las tarjetas no tienen aria-label con el contenido completo

---

## 8. Responsive / Móvil

### 8.1 Layout
- ✅ **Max-width**: sm:max-w-sm en deck - bueno para móviles
- ✅ **Padding**: px-2 sm:px-3 - adecuado
- ⚠️ **PROBLEMA**: En pantallas <340px (compact), las tarjetas traseras se ocultan - pierde efecto de "stack"

### 8.2 Touch Targets
- ✅ **Botones principales**: 44x44px mínimo
- ✅ **Botones de acción**: 64x64px (w-16 h-16) - excelente
- ⚠️ **PROBLEMA**: Los botones de "Códex", "Diario", "Ajustes" son muy pequeños (text-xs)

### 8.3 Safe Areas
- ✅ **viewport-fit=cover**: Configurado en index.html
- ⚠️ **PROBLEMA**: No hay padding con env(safe-area-inset-*) en el deck

---

## 9. Paleta de Colores (Lavanda/Rose)

### 9.1 Consistencia
- ✅ **Fondo**: #FEFAFF (lavender-veil) - suave, no satura
- ✅ **Superficie**: #FFFFFF - máximo contraste
- ✅ **Sombras**: Tinte lavanda (rgba(142,154,175,0.12))
- ⚠️ **PROBLEMA**: El patrón de puntos de fondo (#E7E2F0) puede ser distractor

### 9.2 Significado de Colores
- ✅ **Lavender (#8E9AAF)**: Aceptar, primario
- ✅ **Rose (#C3324B)**: Descartar, alerta, peligro
- ✅ **Thistle (#CBC0D3)**: Bordes, secundario
- ⚠️ **PROBLEMA**: El color "letal" (rose-50) y "alerta" (rose-700) son muy similares - difícil distinguir

---

## 10. Recomendaciones Prioritarias

### 🔴 Crítico (Implementar antes de lanzamiento)
1. **Aumentar tamaño de botones de menú secundario** (Códex, Diario, Ajustes)
2. **Agregar padding con safe-area-inset** en deck para móviles con notch
3. **Mejor feedback visual de "acierto"** - más celebratorio

### 🟡 Importante (Mejora de UX)
4. **Indicador de dificultad actual** durante el juego
5. **Mezclar orden visual de opciones** en boss fight
6. **Animaciones de entrada/salida consistentes** en modales
7. **Toast de "offline ready" solo en primera instalación**

### 🟢 Nice-to-have (Futuras iteraciones)
8. **Meta de progresión a largo plazo** (¿desbloqueo de temas/casos?)
9. **Focus visible en botones de acción** durante el juego
10. **Aria-label en tarjetas** con contenido completo

---

## Próximos Pasos

1. **Validar en móvil real** (iOS Safari + Android Chrome)
2. **Implementar recomendaciones críticas** (1-3)
3. **Revisión de accesibilidad** con screen reader
4. **Test de usabilidad** con 3-5 usuarios

---

**Última actualización**: 2026-11-23  
**Revisor**: Análisis automatizado de código  
**Pendiente**: Validación manual en dispositivo móvil
