# Arquitectura

Este documento describe la arquitectura del frontend de gestión de licencias de Supernovatel, su relación con el servidor Keygen y cómo se despliega en producción.

## Visión General

```
Cliente (navegador)
  │
  │ HTTPS (https://licensing.supernovatel.com)
  ▼
Nginx (reverse proxy)
  ├── /web/        → Frontend (Next.js, puerto 3000)
  └── /v1/         → Keygen API (puerto 3000, contenedor separado)
```

## Contexto de Despliegue

El frontend se sirve como un contenedor Docker que se despliega junto al servidor Keygen en el datacenter de Supernovatel.

- **Dominio público**: `https://licensing.supernovatel.com`
- **Base path del frontend**: `/web/` (configurado vía `basePath` en `next.config.ts`)
- **Keygen API URL interna**: `http://keygen-api:3000`

### Rutas públicas vs. internas

| Ruta             | Accesible públicamente | Descripción                              |
|------------------|------------------------|------------------------------------------|
| `/web/verify`    | Sí                     | Verificación de licencias (sin auth)     |
| `/web/`          | No (red local)         | Dashboard administrativo de Keygen       |
| `/web/?view=*`   | No (red local)         | Gestión de products, policies, users, licenses |

> **Nota**: El acceso restringido a las rutas administrativas se maneja a nivel de Nginx (acceso por IP/red local), no a nivel de aplicación.

## Componentes del Frontend

### Estructura de directorios

```
frontend/
├── app/
│   ├── layout.tsx          # Layout raíz (Next.js App Router)
│   ├── page.tsx            # Dashboard admin (products, policies, users, licenses)
│   ├── verify/             # Página pública de verificación de licencias
│   │   ├── page.tsx        # Página contenedora (Server Component)
│   │   ├── LicenseSearch.tsx  # Formulario de búsqueda (Client Component)
│   │   └── LicenseResult.tsx   # Visualización de resultados (Client Component)
│   ├── actions/            # Server Actions
│   │   ├── products.ts     # Acción para obtener productos
│   │   └── license-verify.ts   # Server action: consulta segura a Keygen API
│   └── components/
│       └── CopyButton.tsx  # Botón para copiar al portapapeles
├── lib/
│   └── api.ts              # Cliente axios preconfigurado para Keygen API
├── public/                 # Assets estáticos (logos, favicon)
│   ├── Logo_Azul.png       # Logo Supernovatel (fondo claro)
│   ├── Logo_Blanco.png     # Logo Supernovatel (fondo oscuro)
│   └── Estrella_*.png      # Íconos de marca
├── Dockerfile              # Imagen Docker para despliegue
├── next.config.ts          # Configuración Next.js (basePath: /web)
└── .env.local              # Variables de entorno
```

## Variables de Entorno

| Variable               | Descripción                                      |
|------------------------|--------------------------------------------------|
| `KEYGEN_API_URL`       | URL interna del servidor Keygen (`http://keygen-api:3000`) |
| `KEYGEN_ACCOUNT_ID`    | UUID de la cuenta en Keygen                      |
| `KEYGEN_ADMIN_TOKEN`   | Token Bearer de administrador para Keygen        |

## Relación con Endpoints de Keygen

El frontend consume la API de Keygen (JSON:API estándar) mediante un cliente Axios configurado en `lib/api.ts`. La base URL es `KEYGEN_API_URL/v1/accounts/KEYGEN_ACCOUNT_ID`.

### Endpoints de lectura (GET)

| Endpoint                          | Usado por                   | Descripción                        |
|-----------------------------------|-----------------------------|------------------------------------|
| `GET /products`                   | Dashboard, verify           | Lista todos los productos           |
| `GET /policies`                   | Dashboard, verify           | Lista todas las políticas           |
| `GET /users`                      | Dashboard, verify           | Lista todos los usuarios            |
| `GET /licenses`                   | Dashboard                   | Lista todas las licencias           |
| `GET /licenses/{license_id}`      | verify (`/web/verify`)      | Obtiene una licencia específica por ID |

### Endpoints de escritura (admin dashboard)

| Endpoint                          | Operación | Descripción                  |
|-----------------------------------|-----------|------------------------------|
| `POST /products`                  | Create    | Crear un nuevo producto      |
| `POST /policies`                  | Create    | Crear una nueva política     |
| `POST /users`                     | Create    | Crear un nuevo usuario       |
| `POST /licenses`                  | Create    | Crear una nueva licencia     |
| `PATCH /products/{id}`            | Update    | Actualizar un producto       |
| `PATCH /policies/{id}`            | Update    | Actualizar una política      |
| `PATCH /users/{id}`               | Update    | Actualizar un usuario        |
| `PATCH /licenses/{id}`            | Update    | Actualizar una licencia      |
| `DELETE /products/{id}`           | Delete    | Eliminar un producto         |
| `DELETE /policies/{id}`           | Delete    | Eliminar una política        |
| `DELETE /users/{id}`              | Delete    | Eliminar un usuario          |
| `DELETE /licenses/{id}`           | Delete    | Eliminar una licencia        |

### Formato de datos

Keygen usa el estándar [JSON:API](https://jsonapi.org/). El helper `formatJsonApi()` en `lib/api.ts` construye los payloads correctos con `data.type`, `data.attributes` y `data.relationships`.

Las respuestas siguen la estructura `{ data: [...], meta: {...} }` para listados, y `{ data: { id, attributes, relationships } }` para recursos individuales.

## Seguridad

- **Token de admin**: Se mantiene en el servidor (Server Actions). Nunca se expone al navegador cliente.
- **Página pública `/web/verify`**: No requiere autenticación. Solo realiza consultas GET a Keygen.
- **Dashboard admin**: Accesible solo desde la red local/datacenter (restricción a nivel de Nginx).

## Nginx (producción)

Ejemplo de configuración de Nginx para proxy:

```nginx
server {
    listen 443 ssl;
    server_name licensing.supernovatel.com;

    # Frontend Next.js (todo bajo /web/)
    location /web/ {
        # Restringir a red local si necesario:
        # allow 10.0.0.0/8;
        # deny all;

        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Keygen API pública (licencias)
    location /v1/ {
        allow all;
        proxy_pass http://keygen-api:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Build & Docker

```bash
# Build
npm run build

# Docker build
docker build \
  --build-arg KEYGEN_API_URL=http://keygen-api:3000 \
  --build-arg KEYGEN_ACCOUNT_ID=0bfa00a4-8c41-41f2-938d-ea696456770d \
  --build-arg KEYGEN_ADMIN_TOKEN=admin-* \
  -t supernovatel-frontend .
```

El Dockerfile usa `output: "standalone"` de Next.js para generar una imagen minimalista.
