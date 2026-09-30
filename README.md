# Dr. Swipe - Especificaciones y Motor Clínico 🩺✨

Bienvenido al repositorio central de **Dr. Swipe**. Este proyecto aloja tanto el motor de juego en React (dentro de `dr-swipe/`) como la base de datos de casos clínicos (`cases/`).

## 🚀 Estado Actual (Septiembre 2026)
- **Motor:** React + Vite + Tailwind CSS + XState (Máquina de estados para el flujo del juego).
- **Estética:** *Medical Notebook / Scrapbook*, implementando un sistema altamente cohesivo con doodles, z-index overlays y animaciones hápticas.
- **Contenido:** **599 Casos Clínicos** integrados, balanceados y probados sin errores.

## 📁 Estructura del Proyecto

\`\`\`text
Dr_Swipe_Specs/
├── cases/                 # Base de datos central de casos clínicos en JSON
├── dr-swipe/              # Código fuente de la aplicación (Frontend)
│   ├── src/               # Componentes React, hooks, store y estilos (Tailwind)
│   └── public/cases/      # Casos sincronizados para el build final
├── generate_csv.ts        # Herramienta para generar catálogo de casos
├── export_qa.ts           # Herramienta para exportar preguntas del Boss Fight
├── README.md              # Este archivo
└── GUIA_CASOS.md          # Manual para crear y editar casos
\`\`\`

## 🛠️ Comandos de Desarrollo

Todo el desarrollo del frontend se ejecuta dentro del directorio `dr-swipe/`:

\`\`\`bash
cd dr-swipe
npm install       # Instalar dependencias
npm run dev       # Levantar servidor de desarrollo en localhost:5173
npm run build     # Sincronizar casos y compilar para producción
npm run lint      # Correr linter de código
\`\`\`

### Scripts de Auditoría (Raíz)
Si deseas revisar o exportar el contenido médico sin abrir el código:
\`\`\`bash
npx tsx generate_csv.ts    # Genera CATALOGO_CASOS_COMPLETO.csv
npx tsx export_qa.ts       # Genera REVISION_PREGUNTAS_RESPUESTAS.csv
\`\`\`

## 🎨 Aspectos Técnicos Destacados
- **XState (`gameMachine.ts`):** Maneja transiciones complejas (Idle -> Triage -> Boss Fight -> Reward/Ghosted).
- **Diseño Inmersivo:** Uso intensivo de CSS Modules y variables CSS (`.medical-grid`, `.paper-sheet`, `.washi-tape-pink`) para una UI lúdica pero profesional.
- **Validación Estricta:** Uso de **Zod** (`caseSchema.ts`) para garantizar que ningún caso clínico rompa el motor del juego.
