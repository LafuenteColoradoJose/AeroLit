<div align="center">
  <img src="public/AeroLit_logo.png" alt="AeroLit Logo" width="150"/>
</div>

# 🛠️ Manual Técnico · AeroLit

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Lit](https://img.shields.io/badge/Lit-3.x-324FFF?style=flat-square&logo=lit)](https://lit.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![Vitest](https://img.shields.io/badge/Vitest-1.x-FCC72B?style=flat-square&logo=vitest)](https://vitest.dev)

**Documentación de Arquitectura, Patrones de Diseño y Estrategia de Datos**

</div>

---

## 📋 Tabla de Contenidos

- [🛠️ Manual Técnico · AeroLit](#️-manual-técnico--aerolit)
  - [📋 Tabla de Contenidos](#-tabla-de-contenidos)
  - [1. Arquitectura Full-Stack Serverless](#1-arquitectura-full-stack-serverless)
    - [Capa Cliente (Frontend)](#capa-cliente-frontend)
    - [Capa Servidor (Backend Serverless)](#capa-servidor-backend-serverless)
  - [2. Estrategia de Datos: Evasión de Rate-Limits (Anti-WAF)](#2-estrategia-de-datos-evasión-de-rate-limits-anti-waf)
    - [⚠️ El Problema](#️-el-problema)
    - [💡 La Solución: Parallel Chunking Engine en Serverless](#-la-solución-parallel-chunking-engine-en-serverless)
  - [3. Motor Híbrido y Simulación de Estado](#3-motor-híbrido-y-simulación-de-estado)
  - [4. Protección de API de Radar en Vivo (ADSB.lol)](#4-protección-de-api-de-radar-en-vivo-adsblol)
  - [5. Testing, Calidad y Documentación](#5-testing-calidad-y-documentación)
  - [6. Desarrollo impulsado por IA Agéntica (Agentic AI)](#6-desarrollo-impulsado-por-ia-agéntica-agentic-ai)

---

## 1. Arquitectura Full-Stack Serverless

AeroLit ha evolucionado de un backend Express clásico a una arquitectura *Serverless* diseñada para plataformas Serverless de primer nivel como Vercel:

### Capa Cliente (Frontend)
Construida bajo el paradigma de **Component-Driven Design** utilizando **Lit** (Web Components) y **TypeScript**. 
- **Encapsulamiento:** Cada componente (`<live-clock>`, `<urgent-flights>`) gestiona su propio estado y ciclo de vida mediante Shadow DOM.
- **Rendimiento:** No se utiliza Virtual DOM; la reactividad ataca directamente a los estándares de la plataforma web.

### Capa Servidor (Backend Serverless)
Desarrollada sobre **Vercel Serverless Functions** (`api/`).
- Responsable exclusivo de extraer, normalizar y servir los datos de tráfico aéreo al vuelo (Lazy Fetching) dentro del estricto límite de 10 segundos del plan gratuito.
- Expone endpoints ligeros (`/api/flights`, `/api/radar`) al frontend.

---

## 2. Estrategia de Datos: Evasión de Rate-Limits (Anti-WAF)

### ⚠️ El Problema
Los proveedores aeronáuticos protegen sus endpoints con potentes firewalls de capa 7 (WAF) como **Akamai**, aplicando bloqueos severos por CORS y baneando IPs.

### 💡 La Solución: Parallel Chunking Engine en Serverless
AeroLit resuelve esto delegando toda la carga a las funciones Serverless (`server/aena-scraper.ts`):

1. **Recolección en Bloques (Chunking):**
   - Para no exceder el límite de ejecución Serverless (10 segundos), el scraping iterativo de los aeropuertos se realiza en lotes paralelos usando `Promise.all()`, acortando un proceso de 20s a menos de 2s.
2. **Extracción Silenciosa Servidor-a-Servidor:**
   - El servidor bypassa CORS inyectando *headers* específicos y *cookies* validadas.
3. **Lazy Fetching y Caché en Tiempo de Ejecución:**
   - Las instancias del scraper evitan inicializar procesos en segundo plano (imposible en Serverless). Utilizan una estrategia de Lazy Fetching y almacenamiento temporal en caché en memoria durante la vida efímera de la Lambda.

---

## 3. Motor Híbrido y Simulación de Estado

Obtener vuelos a demanda resuelve la limitación Serverless, pero los usuarios esperan ver cambios en tiempo real.

La solución es el **Client-Side State Simulation (Simulación de Estado en el Cliente)** impulsado por el componente `<live-clock>`:
- El frontend sincroniza su "latido" con la hora local exacta.
- Constantemente compara el instante actual con la `horaProgramada` de todos los vuelos descargados.
- Transiciona **localmente** los estados sin necesidad del backend:
  - `horaProgramada` > `ahora` ➔ **Scheduled** (Programado)
  - `horaProgramada` <= `ahora` y `horaAterrizaje` > `ahora` ➔ **Active** (Despegó)
  - `horaAterrizaje` <= `ahora` ➔ **Landed** (Aterrizado)
- Esto produce una UI extremadamente viva sin consumir ancho de banda de red en repetidos accesos Serverless.

---

## 4. Protección de API de Radar en Vivo (ADSB.lol)

Al igual que ocurre con los vuelos de AENA, las redes públicas como OpenSky Network aplican baneos severos a las direcciones IP de Datacenters y proveedores en la nube como Vercel (AWS). 

Para garantizar un radar 100% estable en producción, se ha migrado a **ADSB.lol**:
1. **Datos Comunitarios (Server-Side):** El backend se conecta a la API abierta de ADSB.lol (que no banea IPs Cloud), interceptando señales ADS-B de aviones reales.
2. **Capa de Abstracción:** El endpoint interno `/api/radar` captura los datos de ADSB.lol, los transforma al vuelo al antiguo array multi-dimensional (estilo OpenSky) y los entrega al cliente, evitando así refactorizaciones innecesarias en el frontend.
3. **Pausado en Background (Frontend):** Para ahorrar recursos de red, el componente `<aerolit-radar>` pausa su refresco visual usando `document.hidden` cuando el usuario cambia de pestaña.

---

## 5. Testing, Calidad y Documentación

La fiabilidad es crítica en entornos aeronáuticos. 
- **Vitest:** La cobertura de test global del proyecto se mantiene robusta.
  - **Servidor:** Se inyectan *mocks* interceptando llamadas HTTPS a ADSB.lol y a AENA para verificar el parseo, los timeouts y la lógica de Lazy Fetching Serverless.
  - **Cliente:** Se usan *Fake Timers* y *JSDOM* para probar la reactividad sin esperar, testeando componentes web nativos a gran velocidad.

---

## 6. Desarrollo impulsado por IA Agéntica (Agentic AI)

El desarrollo de **AeroLit** se ha beneficiado enormemente del uso de "Skills" (habilidades) específicas para la IA.

Se han empleado las siguientes herramientas agénticas:
*   **Agent Skills (by Addy Osmani):** Habilidades que proporcionan al agente de IA flujos de trabajo estructurados. Utilizado para el desarrollo guiado por pruebas (*TDD*), revisión cruzada de código y resolución sistemática de problemas (*Debugging*).
*   **Modern Web Guidance & Frontend Engineering:** Skills enfocadas en convenciones modernas: uso de **Lit** para Web Components, estado reactivo (`@state`), CSS nativo avanzado y optimización de rendimiento y accesibilidad (A11y).
