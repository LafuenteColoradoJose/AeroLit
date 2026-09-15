# AeroLit ✈️

Una aplicación web moderna basada en **Web Components** para el seguimiento y visualización de vuelos y estado de aeropuertos en España. Construida con **Lit**, **Vite** en el frontend, y propulsada por un backend optimizado nativo en **Vercel Serverless Functions**.

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
* **Backend de Extracción Dedicado (Serverless):**
  * Desplegado como funciones Serverless en Vercel.
  * Evade las estrictas restricciones de CORS y WAF (Akamai de AENA) mediante recolección servidor-a-servidor optimizada con procesamiento en paralelo por lotes (chunking).
* **Radar en Vivo (ADSB.lol):** Integración nativa gestionada desde el servidor backend para mapear en tiempo real el tráfico aéreo sobre España utilizando ADSB.lol (una alternativa gratuita y abierta de la comunidad de aviación), evadiendo los bloqueos corporativos a IPs de Vercel/AWS.
* **Dashboard Interactivo:** Tarjetas de KPIs (vuelos activos, retrasos), gráficas de actividad y listado rápido de vuelos urgentes.

* **Testing Extenso (Vitest):** Cobertura de código superior al 80% (Verde) cubriendo la lógica backend y los componentes clave del frontend (JSDOM).
* **Modo Oscuro Nivel Sistema:** Transición fluida entre temas, con una paleta de colores de alto contraste pensada para la legibilidad.

## 🎨 Paleta de Colores

El proyecto implementa un sistema de diseño custom utilizando:
- **Shadow Grey** (`#3A2E39`)
- **Dark Teal** (`#1E555C`)
- **Almond Silk** (`#F4D8CD`)
- **Sandy Clay** (`#EDB183`)
- **Strawberry Red** (`#F15152`)

## 🛠 Instalación y Scripts de Desarrollo

AeroLit utiliza un ecosistema *Full-Stack* adaptado a Vercel.

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el entorno de desarrollo local (incluye API Serverless)
npx vercel dev

# 3. Construir para producción (Frontend)
npm run build

# 4. Ejecutar tests y reporte de cobertura total (>80%)
npm run coverage
```

## ⚙️ Arquitectura de Datos 

El proyecto resuelve de forma elegante los bloqueos anti-bot de AENA (Akamai WAF) y los baneos de IPs Cloud en herramientas de radar:
1. El backend (`api/flights.ts` y `api/radar.ts`) hace el barrido a las webs oficiales bajo demanda (Lazy Fetching) dentro del límite de 10s de Vercel (Hobby Tier).
2. Vite/Vercel CLI levanta un entorno proxy que enruta las peticiones `/api/*` directamente a las funciones serverless.
3. El cliente Lit consume los datos instantáneamente sin penalizaciones de latencia ni bloqueos de IPs, gozando de una experiencia en riguroso directo.
