# Spec: Theme Toggle (Light/Dark Mode)

## Objective
Implementar un botón (Theme Toggle) dentro del menú lateral (`aerolit-sidebar`) que permita al usuario cambiar el tema visual de la aplicación entre modo claro (Light) y modo oscuro (Dark). La preferencia del usuario debe ser persistente (guardarse en el navegador).

## Tech Stack
- **Framework:** Lit + TypeScript
- **Estilos:** CSS Custom Properties (Variables que ya tenemos en `src/index.css`)
- **Almacenamiento:** `localStorage` (API nativa del navegador)
- **Testing:** Vitest + `@open-wc/testing`

## Commands
- **Dev:** `npm run dev`
- **Test:** `npm run test`
- **Coverage:** `npm run coverage`

## Project Structure
- Modificaremos `src/components/AeroLit-sidebar/aerolit-sidebar.ts` para añadir la UI y la lógica.
- Modificaremos `src/components/AeroLit-sidebar/aerolit-sidebar.test.ts` para cubrir la nueva funcionalidad.
- Actualizaremos `src/index.css` si es necesario mapear el atributo `data-theme="dark"` al root.

## Code Style
- Usar el decorador `@state()` para controlar reactivamente el estado actual del tema (`light` o `dark`).
- El componente Sidebar despachará un evento (`CustomEvent`) o directamente alterará el `document.documentElement.setAttribute('data-theme', theme)` (preferible por simplicidad y convención global en HTML).

## Testing Strategy
- Se añadirán test unitarios en `aerolit-sidebar.test.ts` que verifiquen:
  1. Que el botón existe en el DOM.
  2. Que al hacer clic, el tema cambia y el atributo se refleja en el `document.documentElement`.
  3. Que se guarda en `localStorage` (mockeando la API de ser necesario).
- La cobertura total del proyecto debe mantenerse en **100%**.

## Boundaries
- **Always:** Ejecutar los tests antes de dar la tarea por finalizada. Validar que la accesibilidad (contraste de colores) se mantiene bien.
- **Ask first:** Si necesitamos reestructurar la paleta de colores global para adaptar el modo oscuro de forma agresiva.
- **Never:** Usar `any` en TypeScript o introducir dependencias externas (ej. librerías de temas) para algo que se puede hacer con JS vainilla.

## Success Criteria
1. El botón es visible en el `<aerolit-sidebar>`.
2. Hacer clic en el botón alterna instantáneamente los colores de toda la aplicación.
3. El botón muestra un icono intuitivo (ej. ☀️ para pasar a modo claro, 🌙 para pasar a modo oscuro).
4. Si el usuario recarga la página, su preferencia de tema se mantiene.
5. Los tests de Vitest pasan y cubren esta funcionalidad (100% verde).

## Open Questions
1. Actualmente en `index.css` tenemos el modo oscuro gobernado por `@media (prefers-color-scheme: dark)`. ¿Queremos anular esto y que mande exclusivamente el botón (añadiendo una clase `.dark` o `data-theme="dark"` al HTML), o queremos que el botón anule temporalmente la preferencia del sistema operativo?
2. ¿Dónde colocamos exactamente el botón? ¿Al final de la lista de navegación (abajo del todo) o al lado del logotipo en la cabecera?
