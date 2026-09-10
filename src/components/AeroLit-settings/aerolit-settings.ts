import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import '@phosphor-icons/webcomponents/PhGear';

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
      <div class="settings-container">
        <h1>Ajustes <ph-gear weight="duotone" style="vertical-align: middle;"></ph-gear></h1>
        <p>Configuración de la aplicación próximamente.</p>
      </div>  `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "aerolit-settings": AerolitSettings;
    }
}
