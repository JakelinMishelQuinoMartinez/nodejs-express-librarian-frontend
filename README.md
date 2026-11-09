# Librarian Frontend

Frontend independiente de Librarian, construido con HTML, CSS y JavaScript sin dependencias de compilación.

## Requisitos

- Node.js y la API de [Librarian](../nodejs-express-librarian/) en ejecución en `http://localhost:3000`.
- Visual Studio Code con la extensión Live Server.

## Ejecución local

1. Inicia el backend siguiendo las instrucciones de su [README](../nodejs-express-librarian/README.md).
2. Abre esta carpeta en Visual Studio Code.
3. Abre `public/index.html` con Live Server y usa el origen `http://localhost:5500`.

El frontend se conecta por defecto a `http://localhost:3000`. Si la API está en otro origen, edita `API_BASE` en `public/js/core.js`. Si Live Server usa un origen diferente de `http://localhost:5500`, configura `FRONTEND_ORIGIN` en el `.env` del backend con el origen exacto del frontend.

## Estructura

```text
public/
  index.html
  styles.css
  js/
    core.js       # Estado compartido, API y utilidades
    main.js       # Inicialización y eventos de la interfaz
    catalog.js    # Catálogo y tarjetas de libros
    cart.js       # Cesta, préstamos y compras
    auth.js       # Registro, sesión y autenticación
    activity.js   # Historial y devoluciones
    inventory.js  # Administración del inventario
```

Los archivos JavaScript son módulos ES cargados directamente por el navegador; no se requiere un paso de compilación.
