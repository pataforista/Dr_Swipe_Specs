# ENGINE_SWIPE_META_LAYER_SPEC_v1

## Propósito
Definir la meta-capa (cuentas, progreso y recompensas) para Dr. Swipe
en modo ENARM, transformando sesiones aisladas en entrenamiento continuo.

## Principios no negociables
- Ninguna recompensa otorga respuestas clínicas correctas.
- La economía debe ser **cosmética + motivacional**, no pay-to-win clínico.
- Transparencia de probabilidades (lootboxes) y límites de gasto.
- Privacidad por defecto; ranking opcional y anonimizado.

## Componentes de la Meta-Capa

### 1) Kardex Digital (perfil + stats)
**Objetivo:** reflejar progreso longitudinal y áreas de oportunidad.
- Radar de 6 ejes: Cirugía, Interna, Pediatría, Gineco, Urgencias, Salud Pública.
- Percentil ENARM simulado (comparación con cohortes, opt-in).
- Predicción de puntuación (estimada, no clínica).

**Inputs**
- performance_summary por caso
- tags dominantes del caso
- historial de precisión de subrayado

**Outputs**
- mastery_by_area (0..1)
- percentile_rank (opcional, opt-in)
- predicted_score (estimado)

### 2) Almacén de Suministros (lootboxes)
**Objetivo:** reforzar engagement sin afectar clínica.
- Cajas diarias gratuitas y cajas premium.
- Contenido: cosméticos de avatar, skins de resaltador, emblemas.
- Consumibles no clínicos: aceleradores de XP, temas visuales.

**Reglas**
- Mostrar probabilidad de drop por rareza.
- Garantías: pity timer para evitar frustración.

### 3) Pase de Residencia (battle pass)
**Objetivo:** retención mensual con misiones.
- Track gratuito y premium.
- Misiones diarias/semanales (precision, rachas, casos completados).
- Recompensas: cosméticos + moneda soft.

### 4) Sesión Anatomo-Clínica (social)
**Objetivo:** competencia asíncrona sin presión clínica indebida.
- Duelos con mismo caso, compara precisión + velocidad.
- Leaderboards segmentados (nacional, universidad, especialidad).
- Opt-in y alias anonimizados.

### 5) Economía del juego
**Moneda soft:** Neuronas (juego).
**Moneda hard:** Créditos ENARM (pago o logros difíciles).

**Reglas de balance**
- Ninguna moneda compra respuestas.
- Límites de gasto diarios/semana.

## Rarezas y tiers (loot)
| Color | Rareza | Descripción | Multiplicador | Drop Rate |
|------|--------|-------------|---------------|-----------|
| Gris | Común (MIP) | Equipo genérico | x1 | 50% |
| Verde | Poco Común (Residente) | Estándar | x5 | 30% |
| Azul | Raro (Adscrito) | Alta gama | x20 | 15% |
| Morado | Épico (Jefe) | Prototipo | x100 | 4% |
| Naranja | Legendario (Histórico) | Reliquia | x500 | 1% |

## Ejemplos de inventario
**Cosméticos**
- Batas, pijamas, pines, marcos de perfil.
**Skins de resaltador**
- Neón, pluma fuente, láser (solo VFX).

## Misiones típicas
- “Logra 100% precisión de subrayado en 1 caso.”
- “Completa 3 casos de Pediatría sin fallar.”
- “Racha de 5 días seguidos.”

## Estructura de datos (alto nivel)
```json
{
  "user_id": "string",
  "stats": {
    "level": 1,
    "title": "string",
    "percentile_rank": 0.0,
    "specialty_mastery": {
      "cirugia": 0.0,
      "interna": 0.0,
      "pediatria": 0.0,
      "gineco": 0.0,
      "urgencias": 0.0,
      "salud_publica": 0.0
    }
  },
  "inventory": {
    "equipped_avatar": "string",
    "equipped_highlighter": "string",
    "consumables": {
      "xp_boost": 0
    }
  },
  "progression": {
    "battle_pass_tier": 0,
    "daily_streak": 0,
    "achievements": ["string"]
  }
}
```

## Métricas mínimas
- Retención D1/D7/D30
- Precisión de subrayado promedio
- Distribución de mastery por área
- Tasa de uso de lootboxes

## Criterio de cierre
ENGINE_SWIPE_META_LAYER_SPEC_v1 queda aprobado cuando:
- define progresión sin alterar lógica clínica,
- garantiza transparencia en gacha,
- respeta privacidad y opt-in en rankings.
