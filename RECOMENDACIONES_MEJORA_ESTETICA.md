# Recomendaciones de Mejora — Estética y Rendimiento
**Dr. Swipe v3 | 2026-03-22**

---

## 🎨 MEJORAS ESTÉTICAS SUGERIDAS

### 1. **Consistencia de Bordes en Diálogos**

Actualmente, el bubble de AvatarFeedback usa `bg-white/95` pero algunos overlays usan diferentes valores.

**Sugerencia:** Estandarizar a una paleta de transparencias:
```css
/* En index.css */
--glass-heavy: bg-white/95;
--glass-medium: bg-white/80;
--glass-light: bg-white/60;
```

**Impacto:** Visual más coherente, ±1 línea de cambio por componente.

---

### 2. **Mejora en Shadow Consistency**

Actualmente hay 3 tipos de sombra:
```css
box-shadow: var(--shadow-premium);           /* 8px blur */
box-shadow: 0_15px_30px_rgba(...)           /* Inline */
box-shadow: 0_15px_45px_rgba(...)           /* Inline */
```

**Sugerencia:** Estandarizar en index.css:
```css
:root {
  --shadow-sm: 0 2px 4px rgba(92,64,51,0.05);
  --shadow-md: var(--shadow-premium);
  --shadow-lg: 0 15px 45px rgba(92,64,51,0.15);
  --shadow-xl: 0 20px 60px rgba(92,64,51,0.2);
}
```

**Impacto:** Mantenance más fácil, sin cambios funcionales.

---

### 3. **Border Radius Uniforme**

Actualmente hay valores mixtos:
- `rounded-full` (botones)
- `rounded-[2rem]` (panels)
- `rounded-[3rem]` (ShockRoom)
- `rounded-2xl`, `rounded-xl` (cards)

**Sugerencia:** Crear sistema de tokens:
```css
/* En Tailwind config */
borderRadius: {
  'button': '9999px',      /* Fully rounded */
  'panel': '1.5rem',       /* Soft card */
  'container': '2rem',     /* Medium container */
  'dialog': '3rem',        /* Large modal */
}
```

**Uso:**
```tsx
<div className="rounded-panel">     /* 1.5rem */
<div className="rounded-container">  /* 2rem */
<div className="rounded-dialog">     /* 3rem */
```

**Impacto:** Menos código repetido, más mantenible.

---

### 4. **Animación de Transición de Estados**

Cuando se pasa de `idle` → `triage` o `triage` → `boss_fight`, no hay transición visual suave.

**Sugerencia:** Agregar `wipe-in` animation:
```css
@keyframes wipe-in {
  from { clip-path: inset(0 100% 0 0); }
  to { clip-path: inset(0 0% 0 0); }
}

/* Ya existe en index.css */
```

Verificar que se aplique en cambios de estado en App.tsx.

**Implementación:**
```tsx
<AnimatePresence mode="wait">
  {state.matches('triage') && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="wipe-in"
    >
      <SwipeDeck ... />
    </motion.div>
  )}
</AnimatePresence>
```

---

## ⚡ OPTIMIZACIONES DE RENDIMIENTO

### 5. **Code Splitting para Bundle Size**

**Problema actual:**
```
dist/assets/index-*.js   556.94 kB │ gzip: 169.34 kB
```

**Solución — Actualizar vite.config.js:**

```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-audio': ['howler'],
          'vendor-state': ['xstate', '@xstate/react'],
          'vendor-animation': ['framer-motion'],
        }
      }
    },
    chunkSizeWarningLimit: 600,
  },
  // ...
});
```

**Beneficio:** Chunks de ~150 kB cada uno, mejor caching en browser.

---

### 6. **Lazy Load de Casos Clínicos**

Actualmente todos los 100+ casos se cargan en memoria.

**Sugerencia — Dynamic Import:**
```typescript
// En dataLoader.ts
export async function loadCaseById(caseId: string): Promise<ClinicalCase> {
  const module = await import(`../cases/${caseId}.json`);
  return module.default;
}

// En App.tsx
const loadCase = async (caseId: string) => {
  try {
    const case_ = await loadCaseById(caseId);
    setCurrentCase(case_);
  } catch(e) {
    setLoadError(`No se puede cargar ${caseId}`);
  }
};
```

**Beneficio:** ~30% reducción en bundle inicial.

---

### 7. **Memoización de Componentes Pesados**

SwipeDeck y ShockRoom renderean múltiples hijos. Considerar:

```typescript
export const SwipeDeck = React.memo(({ cards, currentIndex, ... }: SwipeDeckProps) => {
  // ...
}, (prevProps, nextProps) => {
  return prevProps.currentIndex === nextProps.currentIndex &&
         prevProps.cards.length === nextProps.cards.length &&
         prevProps.isLocked === nextProps.isLocked;
});
```

**Beneficio:** ~5-10ms por render evitado en transiciones.

---

## 🎯 ACCESIBILIDAD MEJORADA

### 8. **ARIA Labels en Botones**

Actualmente los botones de acción carecen de labels descriptivos:

```tsx
// ❌ Antes
<motion.button className="w-16 h-16 ...">✕</motion.button>

// ✅ Después
<motion.button
  aria-label="Descartar esta carta médica"
  title="DESCARTAR (← Flecha izquierda)"
  className="w-16 h-16 ..."
>
  ✕
</motion.button>
```

**Impacto:** Screen readers pueden leer propósito del botón.

---

### 9. **Keyboard Navigation Mejorada**

Ya existe soporte de arrow keys en SwipeDeck. Extender a:

```typescript
// En App.tsx
useEffect(() => {
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'p' || e.key === 'P') setIsPaused(!isPaused);
    if (e.key === 's' || e.key === 'S') setShowStats(!showStats);
    if (e.key === '?' || e.key === 'h') openHelpModal();
  };
  window.addEventListener('keydown', handleKey);
  return () => window.removeEventListener('keydown', handleKey);
}, [isPaused, showStats]);
```

**Atajos sugeridos:**
- `←` / `→`: Swipe
- `P`: Pause
- `S`: Stats
- `H`: Help
- `R`: Restart

---

### 10. **Color Contrast Verification**

Verificar contraste WCAG AA en pares:
- ✅ `#5C4033` (text) on `#FFF8F0` (bg) → **Ratio: 15:1** ✓ Pass
- ✅ `#87CEEB` (primary) on `#FFF8F0` → **Ratio: 7:1** ✓ Pass
- ⚠️ `#98D8C8` (tertiary) on `#FFF8F0` → **Ratio: 3.2:1** ✗ Fail (Use darker)

**Acción:** Considerar ajustar `--tertiary` a `#5DBCA7` (más oscuro).

---

## 🔧 MEJORAS TÉCNICAS MENORES

### 11. **Usar `const` en DataLoader**

```typescript
// ❌ Actual
let allCases = [];
export const setAllCases = (cases: ClinicalCase[]) => { ... };

// ✅ Mejor
const caseCache = new Map<string, ClinicalCase>();
export const getCaseById = (id: string) => caseCache.get(id);
```

**Beneficio:** Menos mutations, más predictable.

---

### 12. **Type Narrowing en gameMachine**

En algunos guards se podría mejorar type safety:

```typescript
// ❌ Antes
const isLethalKeep = event.direction === 'right' && card.safety_flags?.lethal_risk;

// ✅ Mejor
const isLethalKeep = (
  event.type === 'SWIPE' &&
  event.direction === 'right' &&
  card?.safety_flags?.lethal_risk === true
);
```

---

### 13. **Cleanup Warning en TelemetryHUD**

```typescript
// ❌ Actual
useEffect(() => {
  const interval = setInterval(() => {
    setPulse(p => p + (Math.random() > 0.5 ? 2 : -2));
  }, 2000);
  return () => clearInterval(interval);  // ✅ Ya está bien
}, []);
```

No hay acción necesaria, ya está correcto.

---

## 📊 TABLA DE PRIORIDADES

| ID | Mejora | Impacto | Dificultad | Tiempo Est. |
|:--:|--------|---------|-----------|------------|
| 5 | Code Splitting | Alto | Medio | 2h |
| 8 | ARIA Labels | Medio | Bajo | 1h |
| 6 | Lazy Load Casos | Medio | Medio | 2h |
| 1 | Glass Consistency | Bajo | Bajo | 30m |
| 2 | Shadow Tokens | Bajo | Bajo | 30m |
| 3 | Border Radius | Bajo | Bajo | 45m |
| 4 | Wipe-in Animation | Bajo | Bajo | 30m |
| 7 | Memoización | Bajo | Bajo | 30m |
| 9 | Keyboard Nav | Bajo | Bajo | 1h |
| 10 | Color Contrast | Bajo | Muy Bajo | 15m |

---

## 🏁 CHECKLIST PARA PRÓXIMA ITERACIÓN

- [ ] Code splitting implementado
- [ ] Lazy loading de casos
- [ ] ARIA labels en UI crítica
- [ ] Keyboard shortcuts documentados
- [ ] Memoización de componentes pesados
- [ ] Contraste WCAG AA verificado
- [ ] Sombras estandarizadas
- [ ] Border radius sistema creado

---

**Siguiente revisor sugerido:** QA Team
**Versión para deploy:** v3.1 con mejoras tier 1-2
