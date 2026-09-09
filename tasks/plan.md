# Plan de Implementación: Theme Toggle

## Arquitectura de CSS
Actualmente `index.css` define variables en `:root` y las pisa dentro de `@media (prefers-color-scheme: dark)`.
Para que el usuario pueda forzar un tema, modificaremos el CSS para que los selectores `[data-theme="light"]` y `[data-theme="dark"]` tengan prioridad absoluta sobre la *media query*.

## Componente Sidebar
- Añadiremos un contenedor inferior en `<aerolit-sidebar>` usando `mt-auto` (margin-top: auto) o flex para empujarlo hacia abajo.
- Crearemos un botón allí.
- En el ciclo de vida `connectedCallback()`, leeremos de `localStorage` si hay tema forzado, si no, usaremos `window.matchMedia('(prefers-color-scheme: dark)')` para conocer la preferencia por defecto y sincronizar el estado interno (`@state() currentTheme`).
- Al hacer click, guardaremos en `localStorage`, cambiaremos el estado y aplicaremos el atributo `data-theme` al `document.documentElement`.

## Tests
- Mock de `localStorage`.
- Verificaremos el estado inicial y el click del botón en `aerolit-sidebar.test.ts`.
