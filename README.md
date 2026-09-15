# AeroLit ✈️

Una aplicación web moderna basada en **Web Components** para el seguimiento y visualización de vuelos y estado de aeropuertos en España. Construida con **Lit**, **Vite** en el frontend, y propulsada por un backend optimizado en **Node.js** con **Express**.

## Descripción

AeroLit proporciona una interfaz fluida e intuitiva para consultar salidas y llegadas de vuelos reales, observar tráfico aéreo en vivo y visualizar métricas de aeropuertos. Cuenta con un diseño adaptable y soporte completo para Modo Claro (Light) y Modo Oscuro (Dark).

## ✨ Características Principales

* **Buscador de Vuelos Avanzado (AENA):**
  * Acceso a programación **real** de vuelos para **48 aeropuertos españoles**.
  * Filtrado dinámico por *Salidas*, *Llegadas* y *Estado de Vuelo* (Programado, Activo, Aterrizado, Cancelado).
  * **Motor de Búsqueda Integrado:** Búsqueda en tiempo real por texto (Nº de Vuelo, Aerolínea, Código IATA).
  * **Reloj en Vivo (Live Clock):** La vista se actualiza silenciosamente cada 60 segundos manteniendo sincronía con el reloj del usuario, actualizando el estado de los vuelos en vivo de forma local.
  * **Doble Vista de visualización**:
    * *Vista de Panel (Lista):* Estilo panel de terminal clásico para visualizar rápidamente gran cantidad de datos (Hora, Destino, Vuelo, Puerta, Estado).
    * *Vista de Tarjetas (Cuadrícula):* Interfaz de tarjetas detalladas y modernas para móviles.
* **Backend de Extracción Dedicado (Scraper Engine):**
  * Servidor intermedio Node.js + Express.
  * Evade las estrictas restricciones de CORS y WAF (Akamai) de AENA mediante recolección servidor-a-servidor.
  * Caché en memoria RAM de ultra-baja latencia.
* **Radar en Vivo:** Integración con OpenSky Network para mapear en tiempo real el tráfico aéreo sobre la península ibérica.
* **Dashboard Interactivo:** Tarjetas de KPIs (vuelos activos, retrasos), gráficas de actividad y listado rápido de vuelos urgentes.

* **Testing Extenso (Vitest):** Cobertura de código superior al 90% (Verde) cubriendo al 100% el backend (con Supertest) y los componentes clave del frontend (JSDOM).
* **Modo Oscuro Nivel Sistema:** Transición fluida entre temas, con una paleta de colores de alto contraste pensada para la legibilidad.

## 🎨 Paleta de Colores

El proyecto implementa un sistema de diseño custom utilizando:
- **Shadow Grey** (`#3A2E39`)
- **Dark Teal** (`#1E555C`)
- **Almond Silk** (`#F4D8CD`)
- **Sandy Clay** (`#EDB183`)
- **Strawberry Red** (`#F15152`)

## 🛠 Instalación y Scripts de Desarrollo

AeroLit utiliza un ecosistema *Full-Stack* ligero.

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el ecosistema completo (Backend y Frontend simultáneamente)
npm run start

# 3. Construir para producción (Frontend)
npm run build

# 4. Ejecutar tests y reporte de cobertura total (>90%)
npm run coverage
```

## ⚙️ Arquitectura de Datos 

El proyecto resuelve de forma elegante los bloqueos anti-bot de AENA (Akamai WAF):
1. El backend (`npm run dev:server`) hace un barrido cronometrado a la web oficial y vuelca todos los vuelos nacionales en su memoria RAM de forma continua.
2. Vite (`npm run dev`) levanta un proxy que redirige las peticiones locales `/api/flights` directamente al puerto del servidor de caché.
3. El cliente Lit consume los datos instantáneamente sin penalizaciones de latencia ni bloqueos de IPs, gozando de una experiencia en riguroso directo.
