# Portal Web Login

MVP  desarrollado con **Express**, **Handlebars**, **SQLite** y **Multer**.

## Funcionalidades

- Registro de usuarios en la pantalla principal.
- Persistencia de datos en SQLite.
- Login posterior con validación de credenciales.
- Pantalla de bienvenida personalizada con el nombre del usuario.
- Subida opcional de avatar con validación de tipo y tamaño.

## Requisitos

- Node.js 18 o superior.

## Instalación

```bash
npm install //Para instalar las dependencias
npm start //Para ejecutar el proyecto local
```

Luego abrí `http://localhost:3000`.

## Estructura

- `server.js`: configura Express, Handlebars, sesiones y middlewares.
- `routes/auth.js`: router modular para registro, login, bienvenida y logout.
- `db.js`: inicializa SQLite y crea la tabla `users`.
- `views/`: layouts, partials y vistas Handlebars.
- `public/`: estilos y archivos subidos.
