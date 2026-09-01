# VI FEXPS - Plataforma de Registro de Emprendimientos

Sistema de registro para emprendedores participantes en la Feria de Experiencias de Proyección Social.

## Características

- **Formulario público**: Los emprendedores se registran con sus datos
- **Panel admin completo**: Dashboard, gestión de emprendedores, usuarios y exportación
- **Exportar Excel**: Descarga reportes en formato Excel
- **Responsive**: Se adapta a dispositivos móviles
- **Todo en un solo archivo**: Fácil de mantener y desplegar

## Estructura

```
fexp-admin/
├── index.html              # Archivo principal (formulario + admin)
├── css/
│   └── styles.css          # Estilos
├── js/
│   ├── app.js              # Lógica del formulario y navegación
│   ├── admin.js            # Lógica del panel admin
│   └── supabase-client.js  # Conexión a datos
└── README.md
```

## Inicio Rápido

### Abrir el sistema

Simplemente abre `index.html` en tu navegador.

### Acceder al panel admin

1. Haz clic en **"Panel de Administración"** en el footer
2. Credenciales por defecto:
   - **Correo**: admin@fexp.com
   - **Contraseña**: admin123

### Cambiar contraseña admin

Edita `js/admin.js` y busca la función `getInitialUsers()` para modificar las credenciales iniciales.

## Panel de Administración

### Dashboard
- Estadísticas: Total, Pendientes, Aprobados, Rechazados
- Últimos 5 registros

### Emprendedores
- Tabla completa con todos los campos
- Filtros: Todos, Pendientes, Aprobados, Rechazados
- Acciones: Aprobar (✓), Rechazar (✗), Ver detalles (👁)

### Usuarios
- Agregar nuevos usuarios (nombre, correo, contraseña, rol)
- Editar usuarios existentes
- Eliminar usuarios (excepto admin principal)
- Roles: admin (acceso total)

### Exportar
- Descargar todos los emprendedores
- Descargar solo aprobados
- Descargar solo pendientes
- Descargar solo rechazados

## Flujo de Navegación

```
[Página carga]
    ↓
[Formulario Registro]
    ↓
[Footer: "Panel Admin"]
    ↓
[Login Admin]
    ↓
[Dashboard Admin]
    ↓
[Cerrar Sesión] → Vuelve al Formulario
```

## Conectar con Supabase

### Paso 1: Crear tablas en Supabase

```sql
CREATE TABLE emprendedores (
    id BIGSERIAL PRIMARY KEY,
    autorizacion BOOLEAN,
    actividad TEXT,
    tipo_participante TEXT,
    nombres TEXT,
    documento TEXT,
    correo TEXT,
    celular TEXT,
    nombre_emprendimiento TEXT,
    linea_negocio TEXT,
    redes_sociales TEXT,
    acompanante TEXT,
    elementos TEXT,
    productos TEXT,
    requerimientos TEXT,
    jornada_preparacion TEXT,
    estado TEXT DEFAULT 'pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT,
    email TEXT UNIQUE,
    password TEXT,
    rol TEXT DEFAULT 'admin'
);
```

### Paso 2: Configurar credenciales

Edita `js/supabase-client.js`:

```javascript
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-anon-key-aqui';
```

## Desplegar en GitHub Pages

1. Sube el código a un repositorio
2. Ve a Settings > Pages
3. Selecciona la rama `main`
4. Accede a: `https://tu-usuario.github.io/nombre-repo/`

## Notas

- Los datos se guardan en localStorage mientras Supabase no esté configurado
- Una vez conectado Supabase, los datos se sincronizarán automáticamente
- El formulario valida todos los campos obligatorios
- El usuario admin principal (id: 1) no se puede eliminar
- Al cerrar sesión del admin, se vuelve al formulario de registro