# Admin Panel Setup Guide

## GitHub Token Configuration

El panel de administración ahora dispara workflows de GitHub Actions para cargar datos sin límites de tiempo.

### 1. Crear GitHub Personal Access Token

1. Ve a [GitHub Settings > Developer Settings > Personal Access Tokens > Tokens (classic)](https://github.com/settings/tokens)
2. Click en "Generate new token (classic)"
3. Configuración:
   - **Note**: `Laudus Admin Panel - Workflow Dispatch`
   - **Expiration**: `No expiration` o `90 days` (recomendado renovar periódicamente)
   - **Scopes**: Selecciona uno de estos:
     - ✅ `workflow` (Update GitHub Action workflows) - **Recomendado, más seguro**
     - ⚠️  `repo` (Full control of private repositories) - Solo si necesitas acceso completo
4. Click "Generate token"
5. **IMPORTANTE**: Copia el token inmediatamente (formato: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - No podrás verlo nuevamente después de cerrar la página

### 2. Configurar Variables de Entorno

#### Local Development

Crear o editar `.env.local`:

```env
# MongoDB (ya existente)
MONGODB_URI=mongodb://localhost:27017/laudus
MONGODB_DB=laudus

# GitHub Token (nuevo)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Vercel Production

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Settings > Environment Variables
3. Agregar nueva variable:
   - **Key**: `GITHUB_TOKEN`
   - **Value**: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (tu token)
   - **Environments**: Marca `Production`, `Preview`, `Development`
4. Click "Save"
5. **Redeploy** el proyecto para aplicar cambios:
   - Deployments tab > Latest deployment > "..." > Redeploy

### 3. Verificar Configuración

#### Test Local

```bash
npm run dev
```

1. Navega a `http://localhost:3000/dashboard/admin/load-data`
2. Selecciona fecha y endpoints
3. Click "Cargar Datos"
4. Deberías ver:
   ```
   ✅ GitHub Actions workflow disparado exitosamente
   📅 Fecha: 2025-10-17
   📊 Endpoints: totals, standard, 8columns
   
   🔗 Ve a GitHub Actions para ver el progreso:
      https://github.com/victor-hernandez-kirovich/laudus-api/actions
   
   ⏱️  El proceso puede tardar 10-15 minutos
   💾 Los datos se guardarán automáticamente en MongoDB
   ```
5. Ve a [GitHub Actions](https://github.com/victor-hernandez-kirovich/laudus-api/actions)
6. Confirma que el workflow "Laudus Balance Sheet Manual Load" está ejecutándose

#### Test Production

1. Espera a que Vercel complete el redeploy
2. Navega a `https://tu-dominio.vercel.app/dashboard/admin/load-data`
3. Repite los mismos pasos que en local
4. Verifica que el workflow se dispare correctamente

### 4. Monitorear Ejecución

#### GitHub Actions

- URL: https://github.com/victor-hernandez-kirovich/laudus-api/actions
- Workflow: "Laudus Balance Sheet Manual Load"
- Duración esperada: 10-15 minutos
- Logs disponibles: Click en el workflow run > "fetch-balance-sheet-manual" job

#### MongoDB Verification

Después de que el workflow termine:

```bash
cd C:\Users\victo\Desktop\laudus-api
python check-mongodb-detailed.py
```

Deberías ver los registros con la fecha seleccionada:
```
Collection: balance_totals
Records: 176
Latest: 2025-10-17

Collection: balance_standard  
Records: 127
Latest: 2025-10-17

Collection: balance_8columns
Records: 241
Latest: 2025-10-17
```

## Troubleshooting

### Error: "GitHub token not configured"

**Causa**: Variable `GITHUB_TOKEN` no está configurada

**Solución**:
1. Verifica `.env.local` (local) o Vercel Environment Variables (producción)
2. Asegúrate de que el nombre sea exactamente `GITHUB_TOKEN`
3. Vercel: Redeploy después de agregar la variable

### Error: 401 Unauthorized en GitHub API

**Causa**: Token inválido o sin permisos

**Solución**:
1. Verifica que el token tenga scope `workflow` o `repo`
2. Regenera el token si expiró
3. Actualiza la variable de entorno con el nuevo token
4. Vercel: Redeploy después de actualizar

### Workflow no se ejecuta

**Causa**: Token sin permisos suficientes

**Solución**:
1. Verifica los scopes del token en GitHub Settings
2. Debe tener al menos scope `workflow`
3. Si usas `repo`, verifica que tengas acceso al repositorio

### Workflow falla en GitHub Actions

**Causa**: Error en la ejecución del script Python

**Solución**:
1. Ve a GitHub Actions > Click en el workflow run > Logs
2. Busca el error específico:
   - **Authentication failed**: Verifica secrets de MongoDB en el repositorio
   - **Timeout**: Aumenta `timeout-minutes` en `.github/workflows/laudus-manual.yml`
   - **Connection refused**: Verifica que MongoDB esté accesible desde GitHub

## Architecture

### Production Flow
```
Admin UI (Vercel)
  ↓ POST /api/admin/load-data
GitHub API
  ↓ Dispatch workflow_dispatch event
GitHub Actions (Ubuntu)
  ↓ Run fetch_balancesheet_manual.py
MongoDB (Cloud)
  ✓ Data saved
```

### Advantages

- ✅ **No timeout limits**: GitHub Actions permite hasta 6 horas (configurado: 360 min)
- ✅ **Serverless-friendly**: Vercel solo dispara el workflow, responde inmediatamente
- ✅ **Logs centralizados**: Todos los logs en GitHub Actions
- ✅ **Retry capability**: Puedes re-ejecutar workflows fallidos desde GitHub UI
- ✅ **Free for public repos**: GitHub Actions es gratis para repositorios públicos

### Limitations

- ⏳ **No real-time updates**: El UI no muestra progreso en tiempo real (solo "workflow triggered")
- 🔗 **External dependency**: Requiere acceso a GitHub API
- 🔑 **Token management**: Requiere crear y mantener GitHub token

## Security Notes

- ⚠️ **NUNCA** commitees el token en el código
- ⚠️ **NUNCA** compartas el token en público
- ⚠️ **NUNCA** uses un token con más permisos de los necesarios
- ✅ Usa scope `workflow` en lugar de `repo` si es posible
- ✅ Rota el token periódicamente (cada 90 días recomendado)
- ✅ Revoca tokens antiguos cuando generes nuevos

## Next Steps

1. ✅ Configurar `GITHUB_TOKEN` en Vercel
2. ✅ Redeploy proyecto en Vercel
3. ✅ Test en producción
4. ⏳ (Opcional) Configurar notificaciones de GitHub Actions (email/Slack)
5. ⏳ (Opcional) Agregar webhook para actualizar UI cuando workflow termine
