# 🛠️ Manual Técnico · AeroLit

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Lit](https://img.shields.io/badge/Lit-3.x-324FFF?style=flat-square&logo=lit)](https://lit.dev)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Vitest](https://img.shields.io/badge/Vitest-1.x-FCC72B?style=flat-square&logo=vitest)](https://vitest.dev)

**Documentación de Arquitectura, Patrones de Diseño y Estrategia de Datos**

</div>

---

## 📋 Tabla de Contenidos

1. [Arquitectura del Frontend](#1-arquitectura-del-frontend)
2. [Estrategia de Datos: Evasión de Rate-Limits (Anti-WAF)](#2-estrategia-de-datos-evasión-de-rate-limits-anti-waf)
3. [Simulación de Estado en el Cliente](#3-simulación-de-estado-en-el-cliente)
4. [Testing y Control de Calidad](#4-testing-y-control-de-calidad)

---

## 1. Arquitectura del Frontend

AeroLit está construido bajo el paradigma de **Component-Driven Design (Diseño Orientado a Componentes)** utilizando **Lit** (Web Components estándar) y **TypeScript**. 

Esto garantiza:
- **Encapsulamiento total:** Cada componente (ej. \`<live-clock>\`, \`<urgent-flights>\`) gestiona su propio estado, ciclo de vida y estilos mediante Shadow DOM.
- **Bajo acoplamiento:** Los componentes no dependen unos de otros directamente, comunicándose mediante eventos (Custom Events) o consumiendo servicios compartidos (\`flight-service.ts\`).
- **Rendimiento Nativo:** Al utilizar estándares web en lugar de Virtual DOM pesados, el uso de memoria es mínimo y el renderizado es inmediato.

---

## 2. Estrategia de Datos: Evasión de Rate-Limits (Anti-WAF)

### ⚠️ El Problema
El principal desafío técnico del proyecto es la ingesta de datos en tiempo real. Los proveedores aeronáuticos (como Aena) protegen sus endpoints con potentes firewalls de capa 7 (WAF) como **Akamai**, aplicando *Rate-Limits* muy estrictos. Hacer *polling* (peticiones continuas) cada pocos segundos para actualizar el dashboard resulta en un baneo inmediato de la IP (HTTP 429 / HTTP 403).

### 💡 La Solución: Caché Híbrida Predictiva
Para resolver este problema, AeroLit implementa un patrón avanzado de **Caché Híbrida** en el servicio de ingesta (\`flight-service.ts\`):

1. **Sincronización Masiva (Base Schedule):**
   - Se realiza una única petición "pesada" cada **12 horas**.
   - Esta petición descarga el bloque completo de vuelos programados (\`scheduled\`) para el día.
   - Estos datos se almacenan en memoria/Local Storage y forman la "Caché Base".

2. **Polling Ligero de Deltas (Updates):**
   - Para mantener el rigor del tiempo real sin disparar las alarmas del WAF, se realiza una micro-petición cada **15 minutos**.
   - Esta petición **solo** consulta vuelos con cambios críticos (retrasos severos, cancelaciones o desvíos) en la próxima ventana de 2 horas.
   - Las deltas se fusionan con la Caché Base.

### 🛡️ Protección de API en Tiempo Real (Radar)
Además de la caché predictiva para vuelos programados, el componente `<aerolit-radar>` realiza consultas constantes (cada 60 segundos) a la API de **OpenSky Network**. Para evitar bloqueos temporales por exceso de cuota (HTTP 429), se ha implementado:
1. **Pausado en Background:** Uso nativo de `document.hidden` (Page Visibility API). Si la pestaña no está visible, el intervalo se suspende.
2. **Caché Reactiva en Servicio (`flight-service.ts`):** Se retiene en memoria (`livePlanesCache`) el payload de OpenSky durante 30 segundos. Solicitudes redundantes disparadas por la UI (o por doble renderizado) obtienen la caché sin golpear la red.


---

## 3. Simulación de Estado en el Cliente

Dado que solo descargamos datos masivos cada 12 horas, ¿cómo logramos que el Dashboard parezca vivo segundo a segundo? Mediante la **Simulación de Estado en el Cliente (Client-Side State Simulation)**.

El componente \`<live-clock>\` no es solo un elemento visual, actúa como el "latido" (heartbeat) de la aplicación:
- El frontend compara de forma continua la hora actual (\`currentTime\`) con la hora de salida (\`departureTime\`) de los vuelos en caché.
- Cuando la hora local supera la hora de despegue, el motor de AeroLit transiciona **automáticamente y de forma local** el estado del vuelo de \`scheduled\` a \`active\`.
- Esto genera un flujo constante de datos dinámicos en la UI (los contadores suben y bajan, los vuelos entran y salen de los radares) **sin consumir ni un solo byte de ancho de banda** ni requerir peticiones al servidor.

---


## 4. Testing, Calidad y Documentación

La fiabilidad es crítica en entornos aeronáuticos. 
- **Vitest & Open-WC:** Toda la lógica de componentes y servicios está testeada de forma unitaria en entornos JSDOM. Se aplican técnicas de *Mocking* profundo (ej. inyección simulada de *Chart.js* y *Leaflet*) y uso de *Fake Timers* (`vi.useFakeTimers()`) para probar la reactividad sin esperar.
- **Cobertura Métrica:** El CI exige superar el umbral del **80% (Verde)** en `Statements, Branches, Functions y Lines`.
- **Documentación JSDoc & TypeDoc:** La arquitectura exige tipado y comentarios JSDoc obligatorios para modelos y métodos expuestos. Una tarea automatizada (`npm run docs`) extrae esta metadata compilandola en un manual HTML hipervinculado, manteniendo una "Single Source of Truth".


---
*Documento generado para el equipo de desarrollo y auditoría técnica.*

## 5. Desarrollo impulsado por IA Agéntica (Agentic AI)

Dado el paradigma actual donde la programación asistida por agentes autónomos de IA es un estándar en la industria, el desarrollo de **AeroLit** se ha beneficiado enormemente del uso de "Skills" (habilidades) específicas para la IA.

En concreto, se han empleado las siguientes herramientas agénticas:
*   **Agent Skills (by Addy Osmani):** Una potente suite de habilidades que proporciona al agente de IA flujos de trabajo estructurados. Se ha utilizado para el desarrollo guiado por pruebas (*Test-Driven Development*), revisión cruzada de código (*Code Review*) y resolución de problemas (*Debugging*), garantizando así un código robusto y una cobertura de tests total (100% passing en Vitest).
*   **Modern Web Guidance & Frontend Engineering:** Skills enfocadas en asegurar que el código generado sigue las convenciones más modernas del desarrollo web: uso de **Lit** para Web Components estándar, estado reactivo (decorators `@state`), uso avanzado de CSS (variables y *Container Queries*) y buenas prácticas de rendimiento y accesibilidad.

El ciclo de desarrollo riguroso asistido por IA seguido fue:

```text
  DEFINE          PLAN           BUILD          VERIFY         REVIEW          SHIP
 ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐
 │ Idea │ ───▶ │ Spec │ ───▶ │ Code │ ───▶ │ Test │ ───▶ │  QA  │ ───▶ │  Go  │
 │Refine│      │  PRD │      │ Impl │      │Debug │      │ Gate │      │ Live │
 └──────┘      └──────┘      └──────┘      └──────┘      └──────┘      └──────┘
  /spec          /plan          /build        /test         /review       /ship
```
