<div align="center" style="margin-bottom: 20px;">
  <img src="https://lit.dev/images/logo.svg" height="50" alt="Lit" style="margin-right: 20px;">
  <img src="https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg" height="50" alt="TypeScript" style="margin-right: 20px;">
  <img src="https://upload.wikimedia.org/wikipedia/commons/9/99/Unofficial_JavaScript_logo_2.svg" height="50" alt="JavaScript">
</div>

<h1 align="center">Lit - Cheat Sheet (Guía Profesional)</h1>
<p align="center"><b>Stack:</b> TypeScript, Lit 3.x, Vite, Web Components.</p>

---
<style>
  @media print {
    pre, table, blockquote, tr { page-break-inside: avoid !important; }
    ul, p { page-break-inside: avoid !important; }
    .page-break { page-break-before: always; }
  }
  .heading-container { display: flex; align-items: center; gap: 10px; margin-top: 1rem; }
  .doc-link { text-decoration: none; color: #666; font-size: 0.9em; margin-bottom: 15px; display: inline-block; }
  h2 { margin-bottom: 0.2rem; }
</style>

## 📑 Índice
- [1. Inicialización Rápida](#sec-1)
- [2. Decoradores Principales (TypeScript)](#sec-2)
- [3. Template Syntax (lit-html)](#sec-3)
- [4. Flujo de Control Estándar](#sec-4)
- [5. Arquitectura: Flujo Unidireccional](#sec-5)
- [6. Directivas de Estilos Dinámicos](#sec-6)
- [7. Ciclo de Vida del Web Component](#sec-7)
- [8. Rendimiento: Renderizado Indexado (repeat)](#sec-8)
- [9. Flujo de Control Funcional Avanzado](#sec-9)
- [10. Micro-optimizaciones del DOM](#sec-10)
- [11. Context API (@lit/context)](#sec-11)
- [12. Shadow DOM y Proyección (Slots)](#sec-12)
- [13. Controladores Reactivos](#sec-13)

---

<div class="page-break"></div>
<a name="sec-1"></a>
<h2><img src="https://api.iconify.design/lucide:rocket.svg?color=%23324fff" width="28" align="absmiddle"> 1. Inicialización Rápida</h2>
<a href="https://lit.dev/docs/getting-started/" class="doc-link" target="_blank"><img src="https://api.iconify.design/lucide:external-link.svg?color=%23666" width="14" align="absmiddle"> Leer en lit.dev</a>

Creación de un proyecto moderno usando el template oficial de TypeScript.

```bash
npm create vite@latest my-lit-app -- --template lit-ts
cd my-lit-app
npm install
npm run dev
```

<div class="page-break"></div>
<a name="sec-2"></a>
<h2><img src="https://api.iconify.design/lucide:tag.svg?color=%23324fff" width="28" align="absmiddle"> 2. Decoradores Principales (TypeScript)</h2>
<a href="https://lit.dev/docs/components/properties/" class="doc-link" target="_blank"><img src="https://api.iconify.design/lucide:external-link.svg?color=%23666" width="14" align="absmiddle"> Leer en lit.dev</a>

Imports desde `lit/decorators.js`. Lit utiliza el estándar de decoradores de TypeScript para simplificar la creación de Web Components.

| Decorador | Descripción |
| :--- | :--- |
| `@customElement('my-tag')` | Registra la clase como un Custom Element nativo en el DOM del navegador. |
| `@property({ type: Type })`| Define una propiedad pública reactiva (API del componente). Acepta `String`, `Number`, `Boolean`, `Object`, `Array`. Si su valor cambia, el componente se re-renderiza. |
| `@state()` | Define un estado interno, privado y reactivo de la clase. Altera la vista cuando cambia. |
| `@query('#my-id')` | Obtiene una referencia asíncrona, segura y tipada a un nodo interno del Shadow DOM. |

> **⚠️ Tip de Mutabilidad:** Lit observa los cambios por *referencia*. Si tu `@state()` o `@property()` es un **Array u Objeto**, mutarlo directamente (ej. `this.arr.push(1)`) **NO** repintará la pantalla. Debes asignar una nueva referencia (`this.arr = [...this.arr, 1]`) o llamar manualmente al método `this.requestUpdate()`.

<div class="page-break"></div>
<a name="sec-3"></a>
<h2><img src="https://api.iconify.design/lucide:layout-template.svg?color=%23324fff" width="28" align="absmiddle"> 3. Template Syntax (lit-html)</h2>
<a href="https://lit.dev/docs/templates/expressions/" class="doc-link" target="_blank"><img src="https://api.iconify.design/lucide:external-link.svg?color=%23666" width="14" align="absmiddle"> Leer en lit.dev</a>

Enlaza los datos de la clase TypeScript al HTML de forma puramente declarativa dentro de la función `render()`.

*   **Data Binding (Texto):** Interpolación directa de valores.
    ```typescript
    html`<p>Hola, ${this.nombre}</p>`
    ```
*   **Property Binding (`.`):** Para pasar estructuras de datos complejas (objetos, arrays) hacia otros Web Components anidados.
    ```typescript
    html`<mi-componente .usuario=${this.userObj}></mi-componente>`
    ```
*   **Attribute Binding (sin prefijo):** Para inyectar valores en atributos HTML nativos de tipo string o numérico.
    ```typescript
    html`<div id=${this.dynamicId}></div>`
    ```
*   **Boolean Attribute (`?`):** Inserta o elimina un atributo en el DOM dinámicamente basado en una evaluación booleana (ideal para `disabled`, `readonly`, `hidden`).
    ```typescript
    html`<button ?disabled=${this.isLoading}>Enviar</button>`
    ```
*   **Event Binding (`@`):** Adjunta un *Event Listener* estándar (nativos o CustomEvents) al elemento.
    ```typescript
    html`<button @click=${this.handleClick}>Click</button>`
    ```

<div class="page-break"></div>
<a name="sec-4"></a>
<h2><img src="https://api.iconify.design/lucide:git-branch.svg?color=%23324fff" width="28" align="absmiddle"> 4. Flujo de Control Estándar</h2>
<a href="https://lit.dev/docs/templates/conditionals/" class="doc-link" target="_blank"><img src="https://api.iconify.design/lucide:external-link.svg?color=%23666" width="14" align="absmiddle"> Leer en lit.dev</a>

Lit no usa motores de plantillas pesados; delega toda la lógica de control a la sintaxis nativa de JavaScript/TypeScript.

### Condicionales (If / Else)
Tienes dos formas principales según la complejidad:
*   **En línea (Ternario):** Ideal para alternar bloques simples.
    ```typescript
    html`${this.hasAccess ? html`<button>Entrar</button>` : html`<p>Denegado</p>`}`
    ```
*   **Bloque clásico (Fuera del HTML):** Si la condición es muy compleja, usa un `if` nativo antes de retornar.
    ```typescript
    render() {
      if (this.isLoading) {
        return html`<loading-spinner></loading-spinner>`;
      }
      return html`<main-content></main-content>`;
    }
    ```

### Bucles y Listas (For)
Tampoco hay directivas especiales, se manipulan arrays de forma nativa:
*   **Mapeo en línea (`.map`):** La forma estándar.
    ```typescript
    html`
      <ul>
        ${this.items.map((item: Item) => html`<li>${item.name}</li>`)}
      </ul>
    `
    ```
*   **Bucle clásico (`for...of`):** Útil si necesitas filtrar u operar con lógica antes de pintar.
    ```typescript
    render() {
      const listHtml = [];
      for (const item of this.items) {
        if (item.isActive) {
          listHtml.push(html`<li>${item.name}</li>`);
        }
      }
      
      return html`<ul>${listHtml}</ul>`;
    }
    ```

<div class="page-break"></div>
<a name="sec-5"></a>
<h2><img src="https://api.iconify.design/lucide:arrow-down-up.svg?color=%23324fff" width="28" align="absmiddle"> 5. Arquitectura: Flujo Unidireccional</h2>
<a href="https://lit.dev/docs/components/events/" class="doc-link" target="_blank"><img src="https://api.iconify.design/lucide:external-link.svg?color=%23666" width="14" align="absmiddle"> Leer en lit.dev</a>

La regla de oro para la comunicación entre componentes Web es: **Propiedades hacia abajo, Eventos hacia arriba.**

### ⬇️ Hacia los Hijos (Inyección de Propiedades)
El componente superior expone y transmite los datos usando la sintaxis de punto (`.`).
```typescript
// En el componente Superior (Padre):
html`<item-card .item=${this.miDato}></item-card>`

// En el componente Inferior (item-card.ts):
@property({ type: Object }) item?: Item;
```

### ⬆️ Hacia los Padres (Despacho de Eventos)
El componente inferior emite eventos personalizados usando la API nativa `CustomEvent`, configurada para traspasar el límite del Shadow DOM.
```typescript
// En el componente Inferior (Despacha):
private seleccionar(): void {
  this.dispatchEvent(new CustomEvent('item-seleccionado', {
    detail: { id: this.item?.id },
    bubbles: true, 
    composed: true // Atraviesa el Shadow DOM
  }));
}

// En el componente Superior (Escucha):
html`<item-card @item-seleccionado=${this.manejarSeleccion}></item-card>`

private manejarSeleccion(event: CustomEvent<{id: string}>): void {
  console.log("Elemento seleccionado ID:", event.detail.id);
}
```

<div class="page-break"></div>
<a name="sec-6"></a>
<h2><img src="https://api.iconify.design/lucide:paint-bucket.svg?color=%23324fff" width="28" align="absmiddle"> 6. Directivas de Estilos Dinámicos</h2>
<a href="https://lit.dev/docs/templates/directives/#classmap-and-stylemap" class="doc-link" target="_blank"><img src="https://api.iconify.design/lucide:external-link.svg?color=%23666" width="14" align="absmiddle"> Leer en lit.dev</a>

Imports desde `lit/directives/...`

*   **classMap:** Evalúa y aplica clases CSS al elemento de manera reactiva y limpia.
    ```typescript
    import { classMap } from 'lit/directives/class-map.js';
    
    const classes = { active: this.isActive, error: this.hasError };
    html`<div class=${classMap(classes)}></div>`
    ```
*   **styleMap:** Genera estilos en línea (inline-styles) reaccionando al estado local.
    ```typescript
    import { styleMap } from 'lit/directives/style-map.js';
    
    const styles = { color: 'red', marginTop: '10px' };
    html`<div style=${styleMap(styles)}></div>`
    ```

<div class="page-break"></div>
<a name="sec-7"></a>
<h2><img src="https://api.iconify.design/lucide:clock.svg?color=%23324fff" width="28" align="absmiddle"> 7. Ciclo de Vida del Web Component</h2>
<a href="https://lit.dev/docs/components/lifecycle/" class="doc-link" target="_blank"><img src="https://api.iconify.design/lucide:external-link.svg?color=%23666" width="14" align="absmiddle"> Leer en lit.dev</a>

Métodos base heredados de `LitElement` que facilitan enganchar lógica en puntos deterministas del renderizado.

| Método | Descripción y Casos de Uso |
| :--- | :--- |
| `connectedCallback()` | El elemento se ha añadido físicamente al DOM. Instante recomendado para arrancar `setInterval`, adjuntar `addEventListener` a `window` o iniciar peticiones asíncronas. **Es imperativo llamar a `super.connectedCallback()`**. |
| `firstUpdated()` | Lit ha completado el primer renderizado. El árbol HTML local está disponible; seguro para leer medidas físicas, canvas o instanciar librerías de terceros (ej. Chart.js) seleccionando nodos con `@query`. |
| `updated(changedProps)` | Se invoca tras cada ciclo de repintado exitoso. Contiene un `Map` para revisar si mutó una propiedad en concreto frente a su valor anterior. |
| `disconnectedCallback()` | El elemento se ha desmontado del DOM. **Obligatorio** para recolección de basura (limpiar event listeners remotos, limpiar timers) y evitar *memory leaks*. |

<div class="page-break"></div>
<a name="sec-8"></a>
<h2><img src="https://api.iconify.design/lucide:zap.svg?color=%23324fff" width="28" align="absmiddle"> 8. Rendimiento: Renderizado Indexado (repeat)</h2>
<a href="https://lit.dev/docs/templates/directives/#repeat" class="doc-link" target="_blank"><img src="https://api.iconify.design/lucide:external-link.svg?color=%23666" width="14" align="absmiddle"> Leer en lit.dev</a>

Para evitar los cuellos de botella del `.map()` estándar (que destruye y reconstruye todos los nodos DOM si cambia el índice o el orden), la directiva `repeat()` asocia nodos a una llave única para moverlos en lugar de borrarlos.

```typescript
import { repeat } from 'lit/directives/repeat.js';

html`
  <ul>
    ${repeat(
      this.items, 
      (item: Item) => item.id, // Identity Key (inmutable)
      (item: Item, index: number) => html`<li>${index}: ${item.name}</li>`
    )}
  </ul>
`
```

<div class="page-break"></div>
<a name="sec-9"></a>
<h2><img src="https://api.iconify.design/lucide:brain.svg?color=%23324fff" width="28" align="absmiddle"> 9. Flujo de Control Funcional Avanzado</h2>
<a href="https://lit.dev/docs/templates/directives/#cache" class="doc-link" target="_blank"><img src="https://api.iconify.design/lucide:external-link.svg?color=%23666" width="14" align="absmiddle"> Leer en lit.dev</a>

Lit provee directivas declarativas para simplificar ternarios anidados y agilizar el motor del DOM virtual.

*   **Cache:** Extrae el fragmento condicional inactivo y lo pausa en memoria en lugar de destruirlo físicamente. Óptimo al alternar componentes complejos como vistas o pestañas para garantizar recargas instantáneas.
    ```typescript
    import { cache } from 'lit/directives/cache.js';
    
    html`${cache(this.vista === 'lista' ? html`<vista-lista></vista-lista>` : html`<vista-grid></vista-grid>`)}`
    ```
*   **When:** Directiva sintáctica que remplaza las expresiones ternarias aportando legibilidad al *early return*.
    ```typescript
    import { when } from 'lit/directives/when.js';
    
    html`${when(
      this.user, 
      () => html`<p>Bienvenido ${this.user!.name}</p>`, 
      () => html`<p>Sesión expirada</p>`
    )}`
    ```

<div class="page-break"></div>
<a name="sec-10"></a>
<h2><img src="https://api.iconify.design/lucide:gauge.svg?color=%23324fff" width="28" align="absmiddle"> 10. Micro-optimizaciones del DOM</h2>
<a href="https://lit.dev/docs/components/lifecycle/#willupdate" class="doc-link" target="_blank"><img src="https://api.iconify.design/lucide:external-link.svg?color=%23666" width="14" align="absmiddle"> Leer en lit.dev</a>

*   **`willUpdate(changedProperties)`:** Se acciona *antes* de la fase síncrona de `render()`. Es el escenario adecuado para la computación de estados derivados o formatters pesados (ej. sumas totales o transformación de strings). Modificar estados aquí **no disparará un nuevo ciclo de renderizado**.
    ```typescript
    protected willUpdate(changedProperties: PropertyValues<this>): void {
      if (changedProperties.has('precioBase') || changedProperties.has('impuestos')) {
        this.precioTotal = this.precioBase + this.impuestos; // 1 solo repaint
      }
    }
    ```
*   **`await this.updateComplete`:** Promesa arquitectónica del motor Lit. Permite pausar la ejecución de una función asíncrona hasta asegurar que las actualizaciones de estado recientes han terminado de pintarse físicamente en la pantalla.
    ```typescript
    async abrirDialogo(): Promise<void> {
      this.dialogoVisible = true;
      await this.updateComplete; // Garantiza que el nodo HTML existe
      this.dialogElement?.showModal();
    }
    ```

<div class="page-break"></div>
<a name="sec-11"></a>
<h2><img src="https://api.iconify.design/lucide:syringe.svg?color=%23324fff" width="28" align="absmiddle"> 11. Context API (@lit/context)</h2>
<a href="https://lit.dev/docs/data/context/" class="doc-link" target="_blank"><img src="https://api.iconify.design/lucide:external-link.svg?color=%23666" width="14" align="absmiddle"> Leer en lit.dev</a>

Herramienta de Inyección de Dependencias. Soluciona el problema de paso en cascada (*Prop Drilling*), distribuyendo contextos, configuraciones o variables globales sin conectarlos manualmente jerarquía por jerarquía.

```typescript
import { createContext, provide, consume } from '@lit/context';
import type { UserContext } from './types';

// 1. Declarar Token Simbólico
export const userContext = createContext<UserContext>('user-context');

// 2. Elemento Proveedor (Módulo superior/Padre)
@customElement('app-root')
export class AppRoot extends LitElement {
  @provide({ context: userContext })
  @state() user: UserContext = { name: 'Admin', role: 'admin' };
}

// 3. Elemento Consumidor (Descendientes en cualquier capa)
@customElement('user-profile')
export class UserProfile extends LitElement {
  @consume({ context: userContext, subscribe: true })
  @state() user!: UserContext; 
}
```

<div class="page-break"></div>
<a name="sec-12"></a>
<h2><img src="https://api.iconify.design/lucide:puzzle.svg?color=%23324fff" width="28" align="absmiddle"> 12. Shadow DOM y Proyección (Slots)</h2>
<a href="https://lit.dev/docs/components/shadow-dom/" class="doc-link" target="_blank"><img src="https://api.iconify.design/lucide:external-link.svg?color=%23666" width="14" align="absmiddle"> Leer en lit.dev</a>

Patrón para crear componentes contenedores reutilizables inyectando HTML desde el componente padre.

```html
<!-- Instanciación e Inyección externa -->
<tarjeta-informativa>
  <h2 slot="titulo">Alerta Global</h2>
  <p>Texto distribuido hacia el default slot de la tarjeta.</p>
</tarjeta-informativa>
```

```typescript
// Estructura interna de tarjeta-informativa.ts
render() {
  return html`
    <header> 
      <slot name="titulo">Título de respaldo</slot> 
    </header>
    <main> 
      <slot></slot> <!-- Receptor HTML genérico --> 
    </main>
  `;
}
```
*   **Estilizado cruzado de los Slots:** Como el Shadow DOM garantiza total encapsulación, el único puente de comunicación CSS permitido hacia los elementos proyectados es el pseudo-elemento especial `::slotted()`.
    ```css
    ::slotted(h2) { 
      color: var(--primary-color); 
      font-weight: bold;
      margin: 0;
    }
    ```

<div class="page-break"></div>
<a name="sec-13"></a>
<h2><img src="https://api.iconify.design/lucide:cpu.svg?color=%23324fff" width="28" align="absmiddle"> 13. Controladores Reactivos</h2>
<a href="https://lit.dev/docs/composition/controllers/" class="doc-link" target="_blank"><img src="https://api.iconify.design/lucide:external-link.svg?color=%23666" width="14" align="absmiddle"> Leer en lit.dev</a>

Patrón arquitectónico de Lit para extraer, encapsular y reutilizar la lógica de estado o ciclo de vida (ej. Fetching de APIs, subscripción a Websockets o Timers recurrentes) sin ensuciar la clase visual del componente.

```typescript
import { ReactiveController, ReactiveControllerHost } from 'lit';

// 1. Entidad Controladora Aislada
export class RelojLogicoController implements ReactiveController {
  private timer?: number;
  public valor: Date = new Date();

  constructor(private host: ReactiveControllerHost) {
    this.host.addController(this); // Registrar la vinculación del ciclo
  }

  hostConnected(): void {
    this.timer = window.setInterval(() => {
      this.valor = new Date();
      this.host.requestUpdate(); // Emite señal síncrona de renderizado al Host
    }, 1000);
  }

  hostDisconnected(): void {
    clearInterval(this.timer); // Prevención de Fugas de memoria
  }
}

// 2. Composición de UI (Múltiples componentes pueden rehusarlo)
@customElement('display-reloj')
export class DisplayReloj extends LitElement {
  private clock = new RelojLogicoController(this); // Instancia pura

  render() {
    return html`
      <div class="clock-ui">
        Tiempo Local: <strong>${this.clock.valor.toLocaleTimeString()}</strong>
      </div>
    `;
  }
}
```
