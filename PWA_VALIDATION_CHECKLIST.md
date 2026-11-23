# PWA Validation Checklist - Dr. Swipe

## ✅ Validaciones Automáticas Completadas

### Build & Assets
- [x] Build exitoso sin errores
- [x] `manifest.webmanifest` generado correctamente
- [x] Service Worker (`sw.js`) generado con Workbox
- [x] Íconos PWA presentes: `pwa-192x192.png`, `pwa-512x512.png`
- [x] `_headers` copiado a `dist/`
- [x] `_redirects` copiado a `dist/`

### Configuración PWA
- [x] `vite-plugin-pwa` configurado con `registerType: 'prompt'`
- [x] Manifest con todos los campos requeridos:
  - `name`: "Dr. Swipe: Triage Fatal"
  - `short_name`: "Dr. Swipe"
  - `start_url`: "/"
  - `scope`: "/"
  - `display`: "standalone"
  - `orientation`: "portrait"
  - `theme_color`: "#0D9488"
  - `background_color`: "#FDFBF7"
  - `lang`: "es"
  - `icons`: 192x192 + 512x512 (any + maskable)

### Service Worker Strategy
- [x] **Precache**: 22 entradas (686.84 KiB)
- [x] **StaleWhileRevalidate** para `/cases/*` (casos clínicos)
- [x] **CacheFirst** para Google Fonts (1 año de caché)
- [x] **NavigationRoute** para SPA fallback

### Componentes Integrados
- [x] `ReloadPrompt` importado y renderizado en `App.tsx`
- [x] `useRegisterSW` configurado con `onRegisterError`
- [x] Meta tags iOS: `apple-mobile-web-app-capable`, `apple-touch-icon`
- [x] Meta tag Android: `mobile-web-app-capable`

### CSP (_headers)
- [x] `default-src 'self'`
- [x] `script-src 'self'` (sin scripts externos)
- [x] `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
- [x] `font-src 'self' https://fonts.gstatic.com`
- [x] `img-src 'self' data:`
- [x] `connect-src` incluye Sentry para monitoreo

---

## 📱 Validación Manual en Dispositivo Móvil

### Preparación
1. **Servidor preview corriendo**: `http://localhost:4173/`
2. **Exponer en red local**: Ejecutar `npm run preview -- --host` para acceder desde móvil
3. **Alternativa**: Desplegar en Cloudflare Pages para prueba en producción

### iOS (Safari)

#### Instalación
- [ ] Abrir Safari y navegar a la URL
- [ ] Tocar el botón "Compartir" (cuadrado con flecha hacia arriba)
- [ ] Desplazarse y tocar "Agregar a pantalla de inicio"
- [ ] Confirmar nombre: "Dr. Swipe"
- [ ] Verificar ícono en pantalla de inicio

#### Modo Standalone
- [ ] Abrir app desde ícono
- [ ] Verificar que abre en modo standalone (sin barra de Safari)
- [ ] Confirmar `theme-color` (#0D9488) en status bar
- [ ] Verificar `apple-mobile-web-app-status-bar-style: black-translucent`

#### Offline
- [ ] Jugar una sesión completa con WiFi
- [ ] Desactivar WiFi
- [ ] Cerrar app completamente
- [ ] Abrir app sin conexión
- [ ] Verificar mensaje "Listo para usar sin conexión"
- [ ] Jugar una sesión offline
- [ ] Verificar que los casos cargan desde caché

#### Persistencia
- [ ] Jugar 3+ casos para activar auto-save
- [ ] Cerrar app completamente
- [ ] Abrir app
- [ ] Verificar que aparece opción "Reanudar guardia"
- [ ] Confirmar que el progreso se mantiene

### Android (Chrome)

#### Instalación
- [ ] Abrir Chrome y navegar a la URL
- [ ] Esperar banner "Agregar a pantalla principal" O
- [ ] Menú (3 puntos) → "Instalar aplicación"
- [ ] Confirmar instalación
- [ ] Verificar ícono en pantalla de inicio

#### Modo Standalone
- [ ] Abrir app desde ícono
- [ ] Verificar que abre en modo standalone
- [ ] Confirmar splash screen con `background_color` (#FDFBF7)
- [ ] Verificar `orientation: portrait` (bloqueado en vertical)

#### Offline
- [ ] Jugar una sesión completa con WiFi
- [ ] Desactivar WiFi
- [ ] Cerrar app completamente
- [ ] Abrir app sin conexión
- [ ] Verificar toast "Listo para usar sin conexión"
- [ ] Jugar una sesión offline
- [ ] Confirmar que los casos cargan desde caché

#### Persistencia
- [ ] Jugar 3+ casos para activar auto-save
- [ ] Cerrar app completamente
- [ ] Abrir app
- [ ] Verificar que aparece opción "Reanudar guardia"
- [ ] Confirmar que el progreso se mantiene (localStorage)

### Service Worker

#### Registro
- [ ] Abrir DevTools → Application → Service Workers
- [ ] Verificar SW registrado con estado "activated"
- [ ] Confirmar scope: "/"

#### Caché
- [ ] Application → Cache Storage
- [ ] Verificar cachés presentes:
  - `workbox-precache-v2-*` (22 entradas)
  - `clinical-cases-index`
  - `clinical-cases-cache`
  - `google-fonts-cache`
  - `google-fonts-webfonts`

#### Actualización
- [ ] Modificar un archivo estático
- [ ] Hacer rebuild
- [ ] Recargar app
- [ ] Verificar toast "ACTUALIZACIÓN DISPONIBLE"
- [ ] Tocar "ACTUALIZAR YA"
- [ ] Confirmar que el SW se actualiza

### Casos Especiales

#### CSP Validation
- [ ] Verificar en consola que no hay errores de CSP
- [ ] Confirmar que las fuentes de Google cargan
- [ ] Confirmar que Sentry funciona (si SENTRY_DSN está configurado)

#### Favores del Adjunto
- [ ] Jugar 5+ casos
- [ ] Verificar que los Favores se calculan correctamente
- [ ] Usar un Favor (revivir paciente)
- [ ] Confirmar que el balance se actualiza

#### Performance
- [ ] Medir tiempo de carga inicial
- [ ] Verificar que el primer paint es < 2s en 4G
- [ ] Confirmar que las interacciones son fluidas (< 100ms)

---

## 🐛 Problemas Conocidos y Soluciones

### iOS
- **Problema**: Safari no muestra banner de instalación automáticamente
  - **Solución**: Instrucciones manuales para "Agregar a pantalla de inicio"
  
- **Problema**: `localStorage` puede limpiarse si Safari está en modo privado
  - **Solución**: Advertir al usuario que use modo normal

### Android
- **Problema**: Chrome puede mostrar banner de instalación duplicado
  - **Solución**: `registerType: 'prompt'` evita instalación automática

- **Problema**: Service Worker no se actualiza inmediatamente
  - **Solución**: Componente `ReloadPrompt` notifica al usuario

---

## ✅ Criterios de Aceptación

Para cerrar esta issue, se debe confirmar:

1. **Instalación**: La app se puede instalar en iOS y Android
2. **Offline**: La app funciona sin conexión después de la primera visita
3. **Persistencia**: El progreso se mantiene entre sesiones
4. **CSP**: No hay errores de Content Security Policy
5. **Service Worker**: Se registra, cachea y actualiza correctamente
6. **Favores**: El balance de Favores del Adjunto es correcto en móvil

---

## 📊 Resultados de Pruebas

| Plataforma | Instalación | Offline | Persistencia | CSP | SW | Favores | Estado |
|------------|-------------|---------|--------------|-----|----|---------|--------|
| iOS Safari | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Pendiente |
| Android Chrome | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Pendiente |

---

**Última actualización**: 2026-11-23
**Status**: Build completado, listo para pruebas manuales
