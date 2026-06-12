# Aura Banorte — Frontend

Frontend del asistente financiero **Aura** para Banorte. Aplicación SPA construida con React 19 y Vite 7.

## Tecnologías

React + Vite 
Recharts
Lucide React
Cypress

## Requisitos previos

- Node.js 18+
- Backend corriendo en `http://localhost:3000` (ver [Reto-Backend-Vibantik](../Reto-Backend-Vibantik/README.md))

## Configuración

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:3000
```

## Instalación y ejecución

```bash
npm install
npm run dev
npm run build     
npm run preview   
```

## Módulos de la aplicación

| Módulo | Descripción |
|---|---|
| **Inicio** | Dashboard con gráfica de gastos, sugerencias financieras, resumen de inversiones y generación de reporte mensual con IA |
| **Presupuestos** | Creación y gestión de presupuestos mensuales con categorías personalizadas y seguimiento de ejecución |
| **Inversiones** | Visualización de inversiones activas (fondos y plazos fijos), estado y vencimientos |
| **Metas** | Creación y seguimiento de objetivos de ahorro con progreso y fechas |
| **Movimientos** | Listado, búsqueda y filtrado de transacciones con detalle expandible |
| **Reportes** | Generación de reportes mensuales con análisis de IA (Aura) |
| **Chatbot (Aura)** | Chat con asesor financiero IA, con streaming de respuestas y preguntas sugeridas |

## Estructura del proyecto

```
src/
├── components/          # Componentes React por módulo
│   ├── Presupuestos/    # Vistas y utils de presupuestos
│   ├── chatbotElements/ # Componentes del chatbot
│   └── css/             # Estilos por componente
├── services/            # Llamadas a la API REST
├── utils/               # Utilidades compartidas (sesión, contextos, etc.)
└── App.jsx              # Raíz de la app y navegación por pestañas

cypress/
├── e2e/                 # Tests end-to-end por módulo
├── unitTests/           # Tests de componentes y utilidades
├── fixtures/            # Datos de prueba
└── support/             # Configuración global de Cypress
```

## Testing con Cypress

### Prerequisito

El servidor de desarrollo debe estar activo antes de correr los tests E2E:

```bash
npm run dev
```

### Comandos de prueba

```bash
# Abrir Cypress con UI interactiva
npm run cy:open

# Correr todos los tests
npm run cy:run

# Tests unitarios (componentes)
npm run cy:unit

# Tests E2E específicos
npm run cy:hu01          # HU-01: Consultar presupuesto
npm run cy:hu02          # HU-02: Crear y modificar presupuesto
npm run cy:transactions  # Movimientos
```

### Suites disponibles

| Archivo | Módulo | Tests |
|---|---|---|
| `spec.cy.js` | General / navegación | 5 |
| `hu01.presupuestos.cy.js` | HU-01 Presupuestos | 19 |
| `hu02.presupuestos.cy.js` | HU-02 Presupuestos | 13 |
| `presupuestos.cy.js` | HU-02 Presupuestos (extendido) | 16 |
| `inversiones.cy.js` | Inversiones | 38 |
| `metas.cy.js` | Metas | 27 |
| `movimientos.cy.js` | Movimientos | 10 |
| `transactions.cy.js` | Transacciones | 22 |
| `chatbot.cy.js` | Chatbot Aura | 34 |
| `reportes.cy.js` | Reportes | 14 |

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_URL` | URL base del backend | `http://localhost:3000` |
