# AeroLit ✈️

Una aplicación web moderna basada en **Web Components** para el seguimiento y visualización de vuelos y estado de aeropuertos en España. Construida con [Lit](https://lit.dev/) y [Vite](https://vitejs.dev/).

## Descripción

AeroLit proporciona una interfaz fluida e intuitiva para consultar salidas y llegadas de vuelos, observar tráfico aéreo en vivo y visualizar métricas de aeropuertos. Cuenta con un diseño adaptable y soporte completo para Modo Claro (Light) y Modo Oscuro (Dark).

## ✨ Características Principales

* **Buscador de Vuelos Avanzado (AENA):**
  * Acceso a programación real de vuelos para **48 aeropuertos españoles**.
  * Filtrado instantáneo por *Salidas* y *Llegadas*.
  * Ordenación cronológica automática.
  * **Doble Vista de visualización**:
    * *Vista de Panel (Lista):* Estilo panel de terminal clásico para visualizar rápidamente gran cantidad de datos (Hora, Destino, Vuelo, Puerta, Estado).
    * *Vista de Tarjetas (Cuadrícula):* Interfaz de tarjetas detalladas y modernas.
* **Radar en Vivo:** Integración con OpenSky Network para mapear en tiempo real el tráfico aéreo sobre la península ibérica.
* **Dashboard Interactivo:** Tarjetas de KPIs (vuelos activos, retrasos) y listado rápido de vuelos urgentes.
* **Modo Oscuro Nivel Sistema:** Transición fluida entre temas, con una paleta de colores de alto contraste pensada para la legibilidad.

## 🎨 Paleta de Colores

El proyecto implementa un sistema de diseño custom utilizando:
- **Shadow Grey** (`#3A2E39`)
- **Dark Teal** (`#1E555C`)
- **Almond Silk** (`#F4D8CD`)
- **Sandy Clay** (`#EDB183`)
- **Strawberry Red** (`#F15152`)

## 🛠 Instalación y Scripts de Desarrollo

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor de desarrollo local
npm run dev

# 3. Construir para producción
npm run build
```

## ⚙️ Variables de Entorno y APIs

Este proyecto soporta llamadas a **Aviationstack** (para histórico de vuelos) y **OpenSky** (para radar).

1. Renombra el archivo `.env.example` a `.env`.
2. Añade tu clave API:

```env
VITE_AVIATIONSTACK_API_KEY=tu_api_key_aqui
```

> **Nota para Desarrollo:** Las peticiones al plan gratuito están limitadas. La aplicación cuenta con un fallback a **datos mockeados masivos** (`mock-flights.json` generado a partir de la API de AENA con ~29.000 vuelos) para garantizar una experiencia completa sin agotar tu cuota de peticiones durante el desarrollo.
