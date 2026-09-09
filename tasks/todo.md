- [x] Tarea 1: Refactorizar `index.css` para soportar `data-theme`.
  - Acceptance: Los estilos reaccionan a `document.documentElement.setAttribute('data-theme', 'dark/light')`.
  - Verify: Comprobación visual o inspect.
  - Files: `src/index.css`

- [x] Tarea 2: Añadir UI y Lógica en `aerolit-sidebar.ts`.
  - Acceptance: Botón abajo con icono ☀️/🌙, lee preferencia SO por defecto, usa `localStorage`.
  - Verify: Clickar el botón cambia el CSS global.
  - Files: `src/components/AeroLit-sidebar/aerolit-sidebar.ts`

- [x] Tarea 3: Actualizar tests.
  - Acceptance: Cobertura sigue al 100%.
  - Verify: `npm run coverage`
  - Files: `src/components/AeroLit-sidebar/aerolit-sidebar.test.ts`
