# Laudus Balance Sheet Dashboard

Dashboard interactivo para visualizar datos de Balance Sheet del ERP Laudus, con automatización diaria mediante GitHub Actions.

##  Características

-  Dashboard interactivo con gráficas en tiempo real
-  Visualización de 3 tipos de balance: Totals, Standard y 8 Columns
-  Gráficas de barras, circular y tablas interactivas
-  Datos históricos y comparativas
-  Responsive design (mobile, tablet, desktop)
-  Colores neutros profesionales
-  Automatización diaria con GitHub Actions

##  Tecnologías

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Estilos**: Tailwind CSS
- **Gráficas**: Recharts
- **Base de Datos**: MongoDB Atlas
- **Deploy**: Vercel
- **Automatización**: GitHub Actions + Python

##  Instalación Local

1. **Clonar repositorio**
\\\ash
git clone <repo-url>
cd laudus-dashboard
\\\

2. **Instalar dependencias**
\\\ash
npm install
\\\

3. **Configurar variables de entorno**
\\\ash
cp .env.local.example .env.local
\\\

Editar \.env.local\:
\\\
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
MONGODB_DATABASE=laudus_data
NEXT_PUBLIC_APP_URL=http://localhost:3000
\\\

4. **Ejecutar en desarrollo**
\\\ash
npm run dev
\\\

Abrir [http://localhost:3000](http://localhost:3000)

##  Deploy en Vercel

1. **Push a GitHub**
\\\ash
git add .
git commit -m "Dashboard completo"
git push origin main
\\\

2. **Conectar con Vercel**
- Ir a [vercel.com](https://vercel.com)
- Import proyecto desde GitHub
- Configurar variables de entorno:
  - \MONGODB_URI\
  - \MONGODB_DATABASE\
  - \NEXT_PUBLIC_APP_URL\ (URL de Vercel)

3. **Deploy automático**
Vercel desplegará automáticamente cada push a \main\

##  Automatización GitHub Actions

El archivo \.github/workflows/laudus-daily.yml\ ejecuta diariamente a las 01:00 AM (Chile):

### Configurar Secrets en GitHub:

Ir a **Settings > Secrets and variables > Actions** y agregar:

\\\
LAUDUS_API_URL=https://api.laudus.cl
LAUDUS_USERNAME=API
LAUDUS_PASSWORD=<tu-password>
LAUDUS_COMPANY_VAT=<tu-rut>
MONGODB_URI=<tu-connection-string>
MONGODB_DATABASE=laudus_data
\\\

### Ejecutar manualmente:

- Ir a **Actions > Laudus Balance Sheet Daily Automation**
- Click en **Run workflow**

##  Estructura de Datos

### MongoDB Collections:

**balance_totals**
\\\json
{
  "_id": "2025-10-20-totals",
  "date": "2025-10-20",
  "endpointType": "totals",
  "recordCount": 128,
  "insertedAt": "2025-10-21T05:00:00.000Z",
  "data": [...]
}
\\\

**balance_standard** y **balance_8columns** siguen la misma estructura.

##  Estructura del Proyecto

\\\
laudus-dashboard/
 app/
    page.tsx                    # Dashboard principal
    dashboard/
       totals/page.tsx        # Balance Totals
       standard/page.tsx      # Balance Standard
       8columns/page.tsx      # Balance 8 Columns
    api/
        data/                   # API Routes
        health/route.ts         # Health check
 components/
    charts/                     # Componentes de gráficas
    layout/                     # Layout components
    ui/                         # UI components
 lib/
    mongodb.ts                  # MongoDB client
    types.ts                    # TypeScript types
    utils.ts                    # Utilidades
 .github/workflows/
     laudus-daily.yml            # GitHub Actions
\\\

##  Diseño

- **Colores**: Azul (#3b82f6), Verde (#10b981), Gris (#6b7280)
- **Fuente**: Inter (Google Fonts)
- **Estilo**: Moderno, limpio, profesional
- **Responsive**: Mobile-first design

##  Endpoints API

\\\
GET /api/health                     # Estado del sistema
GET /api/data/totals?date=YYYY-MM-DD
GET /api/data/standard?date=YYYY-MM-DD
GET /api/data/8columns?date=YYYY-MM-DD
\\\

##  Scripts Disponibles

\\\ash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run start        # Servidor producción
npm run lint         # Linter
\\\

##  Soporte

Para issues o preguntas, crear un issue en GitHub.

---

**Desarrollado para Laudus ERP** 
