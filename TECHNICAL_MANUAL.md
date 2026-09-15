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

1. [Arquitectura Full-Stack](#1-arquitectura-full-stack)
2. [Estrategia de Datos: Evasión de Rate-Limits (Anti-WAF)](#2-estrategia-de-datos-evasi%C3%B3n-de-rate-limits-anti-waf)
3. [Motor Híbrido y Simulación de Estado](#3-motor-h%C3%ADbrido-y-simulaci%C3%B3n-de-estado)
4. [Protección de API de Radar en Vivo](#4-protecci%C3%B3n-de-api-de-radar-en-vivo)
5. [Testing, Calidad y Documentación](#5-testing-calidad-y-documentaci%C3%B3n)
6. [Desarrollo impulsado por IA Agéntica](#6-desarrollo-impulsado-por-ia-ag%C3%A9ntica)

---

## 1. Arquitectura Full-Stack

AeroLit ha evolucionado a una arquitectura *Full-Stack* dividida en dos capas especializadas:

### Capa Cliente (Frontend)
Construida bajo el paradigma de **Component-Driven Design** utilizando **Lit** (Web Components) y **TypeScript**. 
- **Encapsulamiento:** Cada componente (\`<live-clock>\`, \`<urgent-flights>\`) gestiona su propio estado y ciclo de vida mediante Shadow DOM.
- **Rendimiento:** No se utiliza Virtual DOM; la reactividad ataca directamente a los estándares de la plataforma web.

### Capa Servidor (Backend)
Desarrollada sobre **Node.js** y **Express**.
- Responsable exclusivo de extraer, normalizar y cachear los datos de tráfico aéreo.
- Expone endpoints estables (`/api/flights`) al frontend.

---

## 2. Estrategia de Datos: Evasión de Rate-Limits (Anti-WAF)

### ⚠️ El Problema
Los proveedores aeronáuticos protegen sus endpoints con potentes firewalls de capa 7 (WAF) como **Akamai**, aplicando bloqueos severos por CORS (Cross-Origin Resource Sharing) y baneando IPs que hagan *polling* frecuente desde navegadores.

### 💡 La Solución: In-Memory Scraper Engine
AeroLit resuelve esto delegando toda la carga al backend de Node.js (`server/aena-scraper.ts`):

1. **Recolección Silenciosa Servidor-a-Servidor:**
   - El servidor bypassa CORS y los mecanismos de bot-detection del navegador inyectando *headers* específicos y *cookies* validadas.
   - Realiza un barrido iterativo de los 48 aeropuertos españoles (introduciendo pausas intencionadas para no ahogar los servidores de AENA).
2. **Caché en RAM de Ultra-Baja Latencia:**
   - Los datos brutos se mapean al estándar *Aviationstack* y se guardan directamente en la memoria RAM del servidor de Node.
   - La recolección se lanza asíncronamente en un cronograma (1 hora de intervalo).
3. **Proxy Inverso en Desarrollo:**
   - Para evadir colisiones de puerto, Vite (`vite.config.ts`) intercepta las llamadas frontend a `/api/*` y las redirige limpiamente al puerto de Express, simulando un mismo origen.

---

## 3. Motor Híbrido y Simulación de Estado

Descargar todos los vuelos del país de golpe una vez por hora soluciona el problema de red, pero los usuarios esperan ver cambios en tiempo real (segundo a segundo).

La solución es el **Client-Side State Simulation (Simulación de Estado en el Cliente)** impulsado por el componente \`<live-clock>\`:
- El frontend sincroniza su "latido" con la hora local exacta.
- Constantemente compara el instante actual con la `horaProgramada` de todos los vuelos descargados.
- Transiciona **localmente** los estados sin necesidad del backend:
  - `horaProgramada` > `ahora` ➔ **Scheduled** (Programado)
  - `horaProgramada` <= `ahora` y `horaAterrizaje` > `ahora` ➔ **Active** (Despegó)
  - `horaAterrizaje` <= `ahora` ➔ **Landed** (Aterrizado)
- Esto produce una UI extremadamente viva sin consumir ancho de banda en *polling*.

---

## 4. Protección de API de Radar en Vivo

Al igual que ocurre con los vuelos de AENA, **OpenSky Network** aplica bloqueos estrictos a las IPs que realizan excesivas peticiones desde un navegador (HTTP 429 Too Many Requests). 

Para garantizar un radar 100% estable, se ha implementado el **Motor de Extracción OpenSkyScraper** en Node.js (`server/opensky-scraper.ts`):
1. **Extracción Silenciosa (Server-Side):** El backend extrae posiciones mediante una llamada HTTPS nativa servidor-a-servidor cada 15 segundos.
2. **Distribución RAM (Client-Side):** Los clientes frontend no interactúan con OpenSky directamente. Consumen el endpoint interno `/api/radar` que devuelve instantáneamente la última lectura de la memoria RAM del servidor.
3. **Pausado en Background (Frontend):** Para ahorrar recursos de red locales, el componente `<aerolit-radar>` pausa su refresco visual automáticamente empleando la API `document.hidden` cuando el usuario cambia de pestaña.

---

## 5. Testing, Calidad y Documentación

La fiabilidad es crítica en entornos aeronáuticos. 
- **Vitest & Supertest:** La cobertura de test es superior al **90% global**.
  - **Servidor:** Se inyectan *mocks* simulando red caída, APIs corruptas y timeouts para probar que el Scraper de Node nunca crashea y responde vía Supertest. Cobertura del backend: **95-98%**.
  - **Cliente:** Se usan *Fake Timers* y *JSDOM* para probar la reactividad sin esperar, testeando componentes web nativos a gran velocidad.
- **Documentación JSDoc:** La arquitectura exige tipado y comentarios JSDoc obligatorios para modelos, servicios de ingesta e interfaces del scraper, garantizando mantenibilidad a largo plazo.

---
*Documento generado para el equipo de desarrollo y auditoría técnica.*

## 6. Desarrollo impulsado por IA Agéntica (Agentic AI)

El desarrollo de **AeroLit** se ha beneficiado enormemente del uso de "Skills" (habilidades) específicas para la IA.

Se han empleado las siguientes herramientas agénticas:
*   **Agent Skills (by Addy Osmani):** Habilidades que proporcionan al agente de IA flujos de trabajo estructurados. Utilizado para el desarrollo guiado por pruebas (*TDD*), revisión cruzada de código y resolución sistemática de problemas (*Debugging*).
*   **Modern Web Guidance & Frontend Engineering:** Skills enfocadas en convenciones modernas: uso de **Lit** para Web Components, estado reactivo (`@state`), CSS nativo avanzado y optimización de rendimiento y accesibilidad (A11y).
