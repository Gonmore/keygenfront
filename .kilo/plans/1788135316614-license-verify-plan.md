# Plan: Página Pública de Verificación de Licencias

## Objetivo
Agregar una página pública en `/web/verify` donde clientes externos puedan consultar una licencia por su ID (UUID) y ver datos básicos: propietario (email), producto, política, estado, máquinas usadas y fecha de expiración. Sin requerir autenticación.

## Decisiones confirmadas
- **Ruta pública**: `/web/verify`
- **Dashboard admin**: Se mantiene en `/` (dentro del basePath `/web`)
- **Búsqueda**: Solo por ID de licencia (UUID)
- **API Keygen**: `GET /v1/accounts/{account_id}/licenses/{license_ID}` con Bearer token (server-side)
- **Branding**: Supernovatel — `Logo_Azul.png` para fondo claro, `Logo_Blanco.png` para fondo oscuro

## Tareas de implementación

### 1. Configurar basePath en Next.js
**Archivo**: `next.config.ts`
- Agregar `basePath: '/web'` para que toda la app sirva bajo `/web/`
- Esto afecta rutas estáticas y navegación; el dashboard admin quedará en `/web/`

### 2. Crear Server Action para consulta segura a Keygen
**Archivo**: `app/actions/license-verify.ts`
- Server action que recibe `licenseId` como parámetro
- Usa el cliente `keygenApi` existente (que ya tiene el token Bearer)
- Hace GET a `/licenses/{licenseId}`
- Devuelve los datos de la licencia o un error controlado
- El token nunca se expone al cliente

### 3. Crear la página pública de verificación
**Archivo**: `app/verify/page.tsx`
- Página servidor que renderiza el componente cliente de búsqueda
- Metadatos SEO configurados (title, description)

### 4. Crear componente cliente de búsqueda
**Archivo**: `app/verify/LicenseSearch.tsx`
- `'use client'`
- Formato de entrada: campo de texto para el ID de licencia + botón "Verificar"
- Valida que el input no esté vacío
- Llama al server action `verifyLicense`
- Maneja estados: idle, loading, success, error
- Muestra resultado en tarjeta con diseño profesional

### 5. Crear componente de resultado de licencia
**Archivo**: `app/verify/LicenseResult.tsx`
- Muestra los datos básicos de la licencia:
  - **Propietario**: email del usuario
  - **Producto**: nombre del producto asociado
  - **Política**: nombre de la política
  - **Estado**: badge con color (ACTIVE = verde, INACTIVE = ámbar)
  - **Máquinas**: conteo de máquinas usadas vs límite
  - **Expiración**: fecha formateada (o "Perpetua" si no tiene)
- Usa iconos de lucide-react para cada campo
- Diseño responsive con Tailwind

### 6. Actualizar layout con branding Supernovatel
**Archivo**: `app/layout.tsx`
- Actualizar metadata: title "Supernovatel - Verificación de Licencias"
- Agregar logo de Supernovatel en header/footer de la página pública
- Usar `Logo_Azul.png` (fondo claro por defecto)

### 7. Estilos y UX
- Diseño limpio, centrado, profesional
- Fondo claro con acentos en azul (marca Supernovatel)
- Mensajes de error claros (ej: "Licencia no encontrada", "ID inválido")
- Loading state con spinner mientras consulta
- Responsive (mobile-first)

## Archivos a modificar/crear

| Acción | Archivo |
|--------|---------|
| Modificar | `next.config.ts` |
| Modificar | `app/layout.tsx` |
| Crear | `app/actions/license-verify.ts` |
| Crear | `app/verify/page.tsx` |
| Crear | `app/verify/LicenseSearch.tsx` |
| Crear | `app/verify/LicenseResult.tsx` |

## Flujo de datos

```
Cliente (navegador)
  ↓ Ingresa license ID
  ↓ Submit
LicenseSearch.tsx (client)
  ↓ Llama server action
app/actions/license-verify.ts (server)
  ↓ keygenApi.get('/licenses/{id}')
Keygen API (http://keygen-api:3000)
  ↓ JSON:API response
app/actions/license-verify.ts
  ↓ Datos formateados
LicenseSearch.tsx
  ↓ Pasa props
LicenseResult.tsx
  ↓ Renderiza tarjeta con datos
Cliente ve resultado
```

## Notas de despliegue
- En producción, nginx en `licensing.supernovatel.com` debe proxy `/web/` al contenedor del frontend
- Las variables de entorno (`KEYGEN_API_URL`, `KEYGEN_ACCOUNT_ID`, `KEYGEN_ADMIN_TOKEN`) se mantienen igual
- El `basePath: '/web'` requiere rebuild (`npm run build`)

## Validación
- `npm run build` debe completar sin errores
- `npm run lint` debe pasar
- Probar localmente: `npm run dev` y visitar `/web/verify`
- Verificar que el dashboard admin siga funcionando en `/web/`
