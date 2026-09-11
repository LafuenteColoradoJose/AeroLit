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

---

## 3. Simulación de Estado en el Cliente

Dado que solo descargamos datos masivos cada 12 horas, ¿cómo logramos que el Dashboard parezca vivo segundo a segundo? Mediante la **Simulación de Estado en el Cliente (Client-Side State Simulation)**.

El componente \`<live-clock>\` no es solo un elemento visual, actúa como el "latido" (heartbeat) de la aplicación:
- El frontend compara de forma continua la hora actual (\`currentTime\`) con la hora de salida (\`departureTime\`) de los vuelos en caché.
- Cuando la hora local supera la hora de despegue, el motor de AeroLit transiciona **automáticamente y de forma local** el estado del vuelo de \`scheduled\` a \`active\`.
- Esto genera un flujo constante de datos dinámicos en la UI (los contadores suben y bajan, los vuelos entran y salen de los radares) **sin consumir ni un solo byte de ancho de banda** ni requerir peticiones al servidor.

---

## 4. Testing y Control de Calidad

La fiabilidad es crítica en entornos aeronáuticos. 
- **Vitest & Open-WC:** Toda la lógica de componentes y servicios está testeada de forma unitaria en entornos JSDOM.
- Los reportes de cobertura (Coverage) son artefactos dinámicos excluidos explícitamente del repositorio (\`.gitignore\`) para mantener un historial limpio en control de versiones, siguiendo los estándares de la industria.

---
*Documento generado para el equipo de desarrollo y auditoría técnica.*
