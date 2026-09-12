# AeroLit ✈️

Una aplicación web moderna basada en **Web Components** para el seguimiento y visualización de vuelos y estado de aeropuertos en España. Construida con [Lit](https://lit.dev/) y [Vite](https://vitejs.dev/).

## Descripción

AeroLit proporciona una interfaz fluida e intuitiva para consultar salidas y llegadas de vuelos, observar tráfico aéreo en vivo y visualizar métricas de aeropuertos. Cuenta con un diseño adaptable y soporte completo para Modo Claro (Light) y Modo Oscuro (Dark).

## ✨ Características Principales

* **Buscador de Vuelos Avanzado (AENA):**
  * Acceso a programación real de vuelos para **48 aeropuertos españoles**.
  * Filtrado dinámico por *Salidas*, *Llegadas* y *Estado de Vuelo* (Programado, Activo, Aterrizado, Cancelado).
  * **Motor de Búsqueda Integrado:** Búsqueda en tiempo real por texto (Nº de Vuelo, Aerolínea, Código IATA).
  * **Paginación Fluida:** Manejo optimizado del DOM mostrando hasta 20 vuelos por página.
  * **Reloj en Vivo (Live Clock):** La vista se actualiza silenciosamente cada 60 segundos manteniendo sincronía con el reloj del usuario.
  * Ordenación cronológica operativa (prioridad a vuelos programados y en curso frente a finalizados).
  * **Doble Vista de visualización**:
    * *Vista de Panel (Lista):* Estilo panel de terminal clásico para visualizar rápidamente gran cantidad de datos.
    * *Vista de Tarjetas (Cuadrícula):* Interfaz de tarjetas detalladas y modernas.
    * *Vista de Panel (Lista):* Estilo panel de terminal clásico para visualizar rápidamente gran cantidad de datos (Hora, Destino, Vuelo, Puerta, Estado).
    * *Vista de Tarjetas (Cuadrícula):* Interfaz de tarjetas detalladas y modernas.
* **Radar en Vivo:** Integración con OpenSky Network para mapear en tiempo real el tráfico aéreo sobre la península ibérica.
* **Dashboard Interactivo:** Tarjetas de KPIs (vuelos activos, retrasos) y listado rápido de vuelos urgentes.

* **Documentación Autogenerada (TypeDoc):** Todo el código cuenta con JSDoc tipado estrictamente, permitiendo generar un sitio estático de documentación en HTML para desarrolladores.
* **Radar Dinámico (Anti-Baneo):** El radar refresca las posiciones cada 60s, empleando la API de Visibilidad de Página (`document.hidden`) y una memoria temporal en el frontend para no malgastar peticiones cuando la pestaña no está activa, asegurando estabilidad frente a rate-limits.
* **Testing Extenso (Vitest):** Cobertura de código superior al 80% (Verde) en los módulos core del dashboard y el radar, con renderizado asíncrono y simulación de timers en un entorno JSDOM.

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

# 4. Ejecutar tests y reporte de cobertura
npm run test:coverage

# 5. Generar sitio web estático de documentación (TypeDoc)
npm run docs

```

## ⚙️ Variables de Entorno y APIs

Este proyecto soporta llamadas a **Aviationstack** (para histórico de vuelos) y **OpenSky** (para radar).

1. Renombra el archivo `.env.example` a `.env`.
2. Añade tu clave API:

```env
VITE_AVIATIONSTACK_API_KEY=tu_api_key_aqui
```

> **Nota para Desarrollo (Eternal Mock):** Las peticiones al plan gratuito están limitadas. La aplicación cuenta con un fallback a **datos mockeados masivos** (`mock-flights.json`). Para evitar que estos datos estáticos caduquen, el `FlightService` incorpora una lógica de interpolación que **desplaza temporalmente todas las fechas** basándose en la fecha actual del sistema. De esta forma, el simulador siempre mostrará vuelos relativos a tu "hoy", ofreciendo una experiencia inmersiva y permanente.
