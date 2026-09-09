# AeroLit

A modern Web Component project built with [Lit](https://lit.dev/) and [Vite](https://vitejs.dev/).

## Descripción

AeroLit es una aplicación web basada en componentes que utiliza una paleta de colores personalizada con soporte para temas claro (Light) y oscuro (Dark).

### Paleta de Colores

El proyecto implementa un sistema de diseño utilizando la siguiente paleta:
- **Shadow Grey** (`#3A2E39`)
- **Dark Teal** (`#1E555C`)
- **Almond Silk** (`#F4D8CD`)
- **Sandy Clay** (`#EDB183`)
- **Strawberry Red** (`#F15152`)

## Scripts de Desarrollo

- `npm run dev`: Inicia el servidor de desarrollo local.
- `npm run build`: Construye la aplicación para producción.
- `npm run preview`: Previsualiza la construcción de producción localmente.

## Estructura

- `src/index.css`: Contiene las variables CSS globales (`:root`) para el sistema de diseño y temas.
- `src/my-element.ts`: Componente Lit de ejemplo.

## Variables de Entorno

Este proyecto utiliza llamadas a la API de **Aviationstack**. Para que funcione en tu entorno local, necesitas configurar las variables de entorno.

1. Duplica el archivo `.env.example` y renómbralo a `.env`.
2. Añade tu clave API de APILayer/Aviationstack:

```env
VITE_AVIATIONSTACK_API_KEY=tu_api_key_aqui
```
> **Nota:** Las peticiones al plan gratuito están limitadas, por lo que durante el desarrollo recomendamos usar datos mockeados para no agotar la cuota.
