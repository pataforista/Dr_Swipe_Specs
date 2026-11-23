# Análisis de Balance: Favores del Adjunto

## 📊 Configuración Actual

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| **FAVOR_CAP** | 5 | Máximo de favores que se pueden acumular |
| **REVIVE_FAVOR_COST** | 3 | Costo de "Llamar al Adjunto" (revive) |
| **DAILY_FAVOR** | 1 | Favor diario por racha (no implementado aún) |

### Ganancia por Caso

| Outcome | Favores | Condición |
|---------|---------|-----------|
| **Perfect** | 2 | Sin errores, sin rescate, sin undo |
| **Correct with errors (≤1)** | 1 | Caso completado con 1 error |
| **Correct with errors (>1)** | 0 | Caso completado con 2+ errores |
| **Rescued** | 0 | Paciente rescatado por Adjunto |
| **Failed** | 0 | Paciente perdido |

---

## 🎯 Escenarios de Gameplay

### Escenario 1: Jugador Casual (1 sesión/día)
- **Patrones**: 3-5 casos por sesión, mezcla de perfectos y con errores
- **Ganancia esperada**: ~4-6 favores por sesión
- **Frecuencia de revive**: 1-2 veces por sesión
- **Balance**: ✅ **Saludable** - Gana lo suficiente para usar el revive sin acumular

### Escenario 2: Jugador Competitivo (2-3 sesiones/día)
- **Patrones**: 5-8 casos por sesión, mayoría perfectos
- **Ganancia esperada**: ~10-16 favores por día
- **Frecuencia de revive**: 3-5 veces por día
- **Balance**: ⚠️ **Cap alcanzado rápido** - El tope de 5 obliga a gastar o perder favores

### Escenario 3: Jugador en Racha (daily streak)
- **Patrones**: Juega todos los días, mantiene racha
- **Ganancia esperada**: Favores + bonus de racha (no implementado)
- **Frecuencia de revive**: Usa revive estratégicamente
- **Balance**: ⚠️ **Falta incentivo de racha** - DAILY_FAVOR=1 no está integrado

---

## 📱 Análisis para Móvil

### Problemas Identificados

1. **Cap bajo para sesiones largas**
   - En móvil, las sesiones tienden a ser más largas (10-15 casos)
   - Un jugador perfecto gana 20 favores en una sesión larga
   - El cap de 5 hace que se pierdan 15 favores
   - **Impacto**: Frustración, sensación de progreso perdido

2. **Costo de revive puede ser muy alto**
   - 3 favores = 1.5 casos perfectos
   - En un caso difícil con lethal risk, el jugador puede preferir perder el caso que gastar 3 favores
   - **Impacto**: Jugadores casuales evitan usar revive, se sienten atrapados

3. **Falta de ganancia pasiva**
   - DAILY_FAVOR=1 existe pero no está integrado en el flujo
   - No hay bonus por racha diaria en favores
   - **Impacto**: Menos incentivo para mantener racha

### Oportunidades

1. **Revive como mecánica de engagement**
   - Si el costo es muy alto, los jugadores no lo usan
   - Si es muy bajo, pierde valor
   - **Sweet spot**: 2 favores (40% del cap)

2. **Cap dinámico basado en racha**
   - Jugadores con racha alta merecen más cap
   - Incentiva mantener la racha
   - **Ejemplo**: Cap = 5 + (streak / 7)

3. **Favores como moneda de progresión**
   - Actualmente solo sirve para revive
   - Podría desbloquear cosméticos, temas, avatares
   - **Impacto**: Mayor motivación para acumular

---

## 🔧 Recomendaciones

### Recomendación 1: Ajustar Balance para Móvil (Conservador)

```typescript
export const FAVOR_CAP = 7; // Aumentar de 5 a 7
export const REVIVE_FAVOR_COST = 2; // Reducir de 3 a 2
export const DAILY_FAVOR = 1; // Mantener, pero integrar
```

**Justificación**:
- Cap de 7 permite acumular para 3 revives (en vez de 1.6)
- Costo de 2 hace el revive más accesible (28% del cap en vez de 60%)
- Mantiene la escasez sin frustrar

**Impacto esperado**:
- ✅ Jugadores casuales: 1 sesión = 4-6 favores = 2-3 revives
- ✅ Jugadores competitivos: Cap alcanzado en 2 sesiones (en vez de 1)
- ✅ Menos frustración, más uso del revive

### Recomendación 2: Sistema de Racha (Moderado)

```typescript
// Cap dinámico basado en racha
export function getFavorCap(streak: number): number {
  return 5 + Math.floor(streak / 7); // +1 por cada semana de racha
}

// Bonus diario por racha
export function getDailyFavorBonus(streak: number): number {
  if (streak >= 30) return 3; // Racha legendaria
  if (streak >= 7) return 2;  // Racha semanal
  if (streak >= 3) return 1;  // Racha corta
  return 0;
}
```

**Justificación**:
- Incentiva mantener racha
- Jugadores comprometidos tienen más margen
- Progresión natural

### Recomendación 3: Favores como Moneda (Avanzado)

Agregar más usos para favores:
- **Desbloquear temas**: 10 favores = tema especial
- **Desbloquear avatares**: 15 favores = avatar exclusivo
- **Desbloquear casos bonus**: 5 favores = caso especial

**Justificación**:
- Da valor a acumular favores
- Progresión a largo plazo
- Más engagement

---

## 📋 Plan de Implementación (Recomendación 1)

### Fase 1: Ajuste de Balance (1-2 horas)
1. Cambiar `FAVOR_CAP` de 5 a 7
2. Cambiar `REVIVE_FAVOR_COST` de 3 a 2
3. Actualizar tests para reflejar nuevos valores
4. Validar en móvil

### Fase 2: Integrar Daily Favor (2-3 horas)
1. Agregar lógica para otorgar DAILY_FAVOR al mantener racha
2. Mostrar notificación de "Favor diario" en pantalla
3. Actualizar UI para mostrar bonus de racha

### Fase 3: Validación (1 hora)
1. Probar en móvil con diferentes patrones de juego
2. Medir frecuencia de uso de revive
3. Ajustar si es necesario

---

## 🎯 Métricas de Éxito

Para validar que el balance es correcto:

1. **Tasa de uso de revive**: 30-50% de las muertes deberían usar revive
   - < 20%: Costo muy alto, jugadores no lo usan
   - > 70%: Costo muy bajo, pierde valor

2. **Favores acumulados al final de sesión**: 2-4 favores
   - 0: Cap muy bajo o costo muy alto
   - > 5: Cap muy alto, no hay escasez

3. **Retención de jugadores casuales**: Medir si usan revive al menos 1 vez por sesión
   - Si no lo usan: Costo muy alto o no entienden la mecánica
   - Si lo usan múltiples veces: Costo adecuado

---

## 📊 Comparación con Otros Juegos

| Juego | Moneda Soft | Costo Revive | Cap | Balance |
|-------|-------------|--------------|-----|---------|
| **Dr. Swipe (actual)** | Favores | 3 | 5 | 60% del cap |
| **Dr. Swipe (propuesta)** | Favores | 2 | 7 | 28% del cap |
| **Candy Crush** | Vidas | N/A | 5 | Regeneración temporal |
| **Clash Royale** | Oro | Variable | Ilimitado | Inflación controlada |
| **Slay the Spire** | Oro | Variable | Ilimitado | Tienda estratégica |

**Conclusión**: El modelo de cap bajo + moneda limitada es bueno para juegos casuales, pero necesita ajustes para sesiones largas en móvil.

---

## ✅ Conclusión

El sistema actual de Favores está bien diseñado conceptualmente, pero necesita ajustes para móvil:

1. **Aumentar cap de 5 a 7** para sesiones largas
2. **Reducir costo de revive de 3 a 2** para hacerlo más accesible
3. **Integrar DAILY_FAVOR** para incentivar rachas

Estos cambios mantendrán la escasez sin frustrar al jugador, y mejorarán la experiencia en sesiones móviles largas.

**Próximo paso**: Validar en móvil con los valores actuales y luego implementar los ajustes.
