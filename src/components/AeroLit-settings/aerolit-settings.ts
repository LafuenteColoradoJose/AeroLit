import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("aerolit-settings")
export class AerolitSettings extends LitElement {
    static styles = css`
        :host {
            display: block;
            padding: 2rem;
        }
        h1 {
            color: var(--primary-color);
        }
        p {
            color: var(--text-color);
        }
    `;

    render() {
        return html`
        <h1>Ajustes ⚙️</h1>
        <p>Configuración de la aplicación (Próximamente...)</p>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "aerolit-settings": AerolitSettings;
    }
}
